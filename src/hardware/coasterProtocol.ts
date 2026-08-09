/**
 * coasterProtocol · 杯垫硬件协议抽象层
 *
 * 三层可编程空间的「吧台层」硬件接口契约：
 *   上层（BarCounterPage）通过 CoasterProtocol 接口控制杯垫硬件
 *   下层实现可为 MockCoasterDriver（模拟）或 RealCoasterDriver（实体硬件）
 *
 * 物理模型（MockCoasterDriver）：
 *   - 风扇 · PWM 惯性 · 指数趋近目标转速（不会瞬间到位，模拟电机惯性）
 *   - 加热 · 热容模型 · 升温按功率累积、散热按牛顿冷却定律衰减到室温
 *   - 气味强度 · 风扇 × 温度双因子（温度越高释放越强）
 *
 * 物理推进抽为纯函数 stepPhysics · 可独立单测，不依赖定时器
 *
 * 安全约束：
 *   - 最高温度 55℃（硬件阈值，防止烫伤）
 *   - 风扇转速 clamp [0, 1]
 *
 * 对接实体硬件时：实现 CoasterProtocol 接口，替换工厂函数即可，上层零改动
 */

// ═════════════════════════════════════════════════════════
// 类型契约
// ═════════════════════════════════════════════════════════

/** 杯垫硬件遥测 · 实时状态快照 */
export interface CoasterTelemetry {
  /** 实际风扇转速 0-1 · 带惯性（与 target 可能不同） */
  fanSpeed: number;
  /** 目标风扇转速 0-1 */
  fanTarget: number;
  /** 加热元件开关 */
  heating: boolean;
  /** 当前温度 ℃ · 热容模型累积值 */
  temperature: number;
  /** 实际气味释放强度 0-1 · 风扇 × 温度双因子 */
  scentIntensity: number;
  /** 时间戳 ms */
  timestamp: number;
}

/** 杯垫硬件协议接口 · 上层通过此接口控制硬件 */
export interface CoasterProtocol {
  /** 设置风扇目标转速 0-1 */
  setFanSpeed(target: number): void;
  /** 开关加热元件 */
  setHeating(on: boolean): void;
  /** 取当前遥测快照 */
  getTelemetry(): CoasterTelemetry;
  /** 订阅遥测更新 · 返回取消订阅函数 */
  onTelemetry(cb: (t: CoasterTelemetry) => void): () => void;
  /** 启动物理推进（开始 tick） */
  start(): void;
  /** 停止物理推进（清除定时器） */
  stop(): void;
}

/** 物理模型配置 · 可按硬件规格覆写 */
export interface PhysicsConfig {
  /** 风扇趋近系数 · 每秒 · 越大越快到位（默认 1.8 · 约 1.5s 到 90%） */
  fanDamping: number;
  /** 室温 ℃ */
  ambientTemp: number;
  /** 加热功率 ℃/秒 · 升温速率 */
  heatingPower: number;
  /** 散热系数 · 牛顿冷却 · 越大散热越快 */
  coolingCoeff: number;
  /** 最高温度 ℃ · 安全阈值 */
  maxTemp: number;
  /** 最低风扇转速阈值 · 低于此值视为无气味输出 */
  minFanForScent: number;
}

export const DEFAULT_PHYSICS_CONFIG: PhysicsConfig = {
  fanDamping: 1.8,
  ambientTemp: 22,
  // 加热功率远超散热系数 · 平衡温度超过 maxTemp 被 clamp · 模拟 PTC 加热元件的强劲升温
  heatingPower: 4.0,
  // 散热系数 · 时间常数约 10 秒 · 关闭加热后温度较快回落
  coolingCoeff: 0.1,
  maxTemp: 55,
  minFanForScent: 0.05,
};

/** 物理状态 · 可独立推进的纯数据 */
export interface CoasterPhysicsState {
  fanSpeed: number;
  temperature: number;
}

// ═════════════════════════════════════════════════════════
// 纯函数物理推进 · 可独立单测
// ═════════════════════════════════════════════════════════

/** clamp 工具 */
function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

/**
 * 推进一帧物理状态 · 纯函数
 *
 * 风扇：指数趋近 · fanSpeed += (target - fanSpeed) * (1 - exp(-fanDamping * dt))
 *   - dt 无关 · 大步长也稳定
 *   - 模拟电机惯性 · 不会瞬间到位
 *
 * 加热：热容模型
 *   - 加热中：dT = heatingPower * dt - coolingCoeff * (T - ambient) * dt
 *   - 不加热：dT = -coolingCoeff * (T - ambient) * dt（牛顿冷却衰减到室温）
 *   - clamp 到 [ambient, maxTemp]
 *
 * @param state 当前物理状态
 * @param dt 时间步长（秒）
 * @param fanTarget 风扇目标转速
 * @param heating 加热开关
 * @param config 物理配置
 */
export function stepPhysics(
  state: CoasterPhysicsState,
  dt: number,
  fanTarget: number,
  heating: boolean,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): CoasterPhysicsState {
  // 风扇 · 指数趋近
  const fanApproach = 1 - Math.exp(-config.fanDamping * dt);
  const fanSpeed = state.fanSpeed + (fanTarget - state.fanSpeed) * fanApproach;

  // 加热 · 热容 + 牛顿冷却
  const tempDelta = heating
    ? config.heatingPower * dt - config.coolingCoeff * (state.temperature - config.ambientTemp) * dt
    : -config.coolingCoeff * (state.temperature - config.ambientTemp) * dt;
  const temperature = clamp(state.temperature + tempDelta, config.ambientTemp, config.maxTemp);

  return { fanSpeed, temperature };
}

/**
 * 计算气味释放强度 · 风扇 × 温度双因子
 *   tempFactor = (T - ambient) / (maxTemp - ambient) · clamp 0-1
 *   scent = fanSpeed * (0.4 + tempFactor * 0.6)
 *   - 风扇为主导（占 40% 基础 + 温度加成 60%）
 *   - 风扇低于 minFanForScent 时输出 0
 */
export function computeScentIntensity(
  fanSpeed: number,
  temperature: number,
  config: PhysicsConfig = DEFAULT_PHYSICS_CONFIG,
): number {
  if (fanSpeed < config.minFanForScent) return 0;
  const tempFactor = clamp(
    (temperature - config.ambientTemp) / (config.maxTemp - config.ambientTemp),
    0,
    1,
  );
  return clamp(fanSpeed * (0.4 + tempFactor * 0.6), 0, 1);
}

// ═════════════════════════════════════════════════════════
// 模拟驱动实现
// ═════════════════════════════════════════════════════════

const TICK_MS = 100; // 100ms 推进一次 · 平衡流畅度与性能

/**
 * 模拟杯垫驱动 · 实现硬件协议接口
 *
 * 用于开发与演示 · 物理模型可独立测试
 * 对接实体硬件时替换为 RealCoasterDriver（实现同接口），上层零改动
 */
export class MockCoasterDriver implements CoasterProtocol {
  private state: CoasterPhysicsState;
  private fanTarget: number;
  private heating: boolean;
  private config: PhysicsConfig;
  private timerId: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<(t: CoasterTelemetry) => void> = new Set();
  private lastTickMs: number;

  constructor(config: Partial<PhysicsConfig> = {}) {
    this.config = { ...DEFAULT_PHYSICS_CONFIG, ...config };
    this.state = { fanSpeed: 0, temperature: this.config.ambientTemp };
    this.fanTarget = 0;
    this.heating = false;
    this.lastTickMs = Date.now();
  }

  setFanSpeed(target: number): void {
    this.fanTarget = clamp(target, 0, 1);
  }

  setHeating(on: boolean): void {
    this.heating = on;
  }

  getTelemetry(): CoasterTelemetry {
    return this.buildTelemetry();
  }

  onTelemetry(cb: (t: CoasterTelemetry) => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  start(): void {
    if (this.timerId !== null) return;
    this.lastTickMs = Date.now();
    this.timerId = setInterval(() => this.tick(), TICK_MS);
  }

  stop(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  /** 推进一帧 · 用真实 dt 计算物理 */
  private tick(): void {
    const now = Date.now();
    const dt = (now - this.lastTickMs) / 1000;
    this.lastTickMs = now;
    this.state = stepPhysics(this.state, dt, this.fanTarget, this.heating, this.config);
    const telemetry = this.buildTelemetry();
    this.listeners.forEach((cb) => cb(telemetry));
  }

  /** 由当前状态构造遥测快照 */
  private buildTelemetry(): CoasterTelemetry {
    return {
      fanSpeed: this.state.fanSpeed,
      fanTarget: this.fanTarget,
      heating: this.heating,
      temperature: this.state.temperature,
      scentIntensity: computeScentIntensity(
        this.state.fanSpeed,
        this.state.temperature,
        this.config,
      ),
      timestamp: Date.now(),
    };
  }
}

// ═════════════════════════════════════════════════════════
// 工厂函数 · 上层统一入口
// ═════════════════════════════════════════════════════════

/**
 * 创建杯垫驱动实例
 *
 * 当前环境始终返回 MockCoasterDriver
 * 未来对接实体硬件时，根据环境变量或硬件探测切换为 RealCoasterDriver
 *
 * @param config 物理配置覆写（可选）
 */
export function createCoasterDriver(config?: Partial<PhysicsConfig>): CoasterProtocol {
  return new MockCoasterDriver(config);
}
