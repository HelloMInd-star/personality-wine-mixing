/**
 * coasterProtocol · 杯垫硬件协议单元测试
 *
 * 覆盖：
 *   - stepPhysics · 风扇 PWM 惯性（指数趋近、dt 无关、双向）
 *   - stepPhysics · 加热热容模型（升温、牛顿冷却、温度上限、室温回归）
 *   - computeScentIntensity · 风扇阈值、温度双因子、clamp
 *   - MockCoasterDriver · setFanSpeed/getTelemetry/onTelemetry/定时推进
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  stepPhysics,
  computeScentIntensity,
  MockCoasterDriver,
  createCoasterDriver,
  DEFAULT_PHYSICS_CONFIG,
  type PhysicsConfig,
  type CoasterPhysicsState,
} from './coasterProtocol';

const AMBIENT = DEFAULT_PHYSICS_CONFIG.ambientTemp;
const MAX_TEMP = DEFAULT_PHYSICS_CONFIG.maxTemp;

// ═════════════════════════════════════════════════════════
// stepPhysics · 风扇 PWM 惯性
// ═════════════════════════════════════════════════════════

describe('coasterProtocol · 风扇 PWM 惯性', () => {
  it('从 0 趋近目标 1 · 单步应朝目标移动但不到达', () => {
    const state: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    const next = stepPhysics(state, 0.1, 1, false);
    expect(next.fanSpeed).toBeGreaterThan(0);
    expect(next.fanSpeed).toBeLessThan(1);
  });

  it('多步推进后接近目标', () => {
    let state: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    for (let i = 0; i < 50; i++) {
      state = stepPhysics(state, 0.1, 1, false);
    }
    expect(state.fanSpeed).toBeGreaterThan(0.99);
    expect(state.fanSpeed).toBeLessThanOrEqual(1);
  });

  it('从 1 趋近目标 0 · 双向工作', () => {
    let state: CoasterPhysicsState = { fanSpeed: 1, temperature: AMBIENT };
    for (let i = 0; i < 50; i++) {
      state = stepPhysics(state, 0.1, 0, false);
    }
    expect(state.fanSpeed).toBeLessThan(0.01);
  });

  it('dt 无关 · 大步长与小步长累积结果接近', () => {
    // 一次大步 1s vs 十次小步 0.1s · 指数趋近下结果应相同
    const big = stepPhysics({ fanSpeed: 0, temperature: AMBIENT }, 1, 1, false);
    let small: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    for (let i = 0; i < 10; i++) {
      small = stepPhysics(small, 0.1, 1, false);
    }
    expect(small.fanSpeed).toBeCloseTo(big.fanSpeed, 5);
  });

  it('目标不变时 · 风扇稳定在目标附近', () => {
    let state: CoasterPhysicsState = { fanSpeed: 0.3, temperature: AMBIENT };
    for (let i = 0; i < 30; i++) {
      state = stepPhysics(state, 0.1, 0.3, false);
    }
    expect(state.fanSpeed).toBeCloseTo(0.3, 2);
  });
});

// ═════════════════════════════════════════════════════════
// stepPhysics · 加热热容模型
// ═════════════════════════════════════════════════════════

describe('coasterProtocol · 加热热容模型', () => {
  it('加热中 · 温度上升', () => {
    const state: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    const next = stepPhysics(state, 1, 0, true);
    expect(next.temperature).toBeGreaterThan(AMBIENT);
  });

  it('不加热 · 温度衰减朝室温趋近', () => {
    let state: CoasterPhysicsState = { fanSpeed: 0, temperature: 40 };
    const initial = state.temperature;
    for (let i = 0; i < 300; i++) {
      // 30 秒 · 时间常数约 10 秒 · 3 个时间常数后接近室温
      state = stepPhysics(state, 0.1, 0, false);
    }
    // 温度显著下降
    expect(state.temperature).toBeLessThan(initial);
    // 朝室温趋近 · 不低于室温
    expect(state.temperature).toBeGreaterThanOrEqual(AMBIENT);
    // 接近室温（指数衰减 · 3 个时间常数后残余 < 5%）
    expect(state.temperature).toBeLessThan(AMBIENT + 2);
  });

  it('温度不超过 maxTemp 安全阈值 · 平衡被 clamp', () => {
    let state: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    for (let i = 0; i < 500; i++) {
      // 50 秒 · 加热功率远超散热 · 平衡温度超过 maxTemp 被 clamp
      state = stepPhysics(state, 0.1, 0, true);
    }
    expect(state.temperature).toBeLessThanOrEqual(MAX_TEMP);
    // 平衡温度超 maxTemp · clamp 精确到上限
    expect(state.temperature).toBe(MAX_TEMP);
  });

  it('初始温度为室温 · 不加热不变化', () => {
    const state: CoasterPhysicsState = { fanSpeed: 0, temperature: AMBIENT };
    const next = stepPhysics(state, 1, 0, false);
    expect(next.temperature).toBeCloseTo(AMBIENT, 5);
  });

  it('加热升温速率 · 与 heatingPower 正相关', () => {
    const cfg: PhysicsConfig = { ...DEFAULT_PHYSICS_CONFIG, coolingCoeff: 0 };
    const low = stepPhysics({ fanSpeed: 0, temperature: AMBIENT }, 1, 0, true, {
      ...cfg,
      heatingPower: 0.1,
    });
    const high = stepPhysics({ fanSpeed: 0, temperature: AMBIENT }, 1, 0, true, {
      ...cfg,
      heatingPower: 0.5,
    });
    expect(high.temperature - AMBIENT).toBeGreaterThan(low.temperature - AMBIENT);
  });
});

// ═════════════════════════════════════════════════════════
// computeScentIntensity
// ═════════════════════════════════════════════════════════

describe('coasterProtocol · 气味释放强度', () => {
  it('风扇低于阈值 · 输出 0', () => {
    expect(computeScentIntensity(0, AMBIENT)).toBe(0);
    expect(computeScentIntensity(0.04, AMBIENT)).toBe(0);
  });

  it('风扇高于阈值 · 输出非零', () => {
    expect(computeScentIntensity(0.5, AMBIENT)).toBeGreaterThan(0);
  });

  it('温度越高 · 气味释放越强', () => {
    const cold = computeScentIntensity(0.8, AMBIENT);
    const hot = computeScentIntensity(0.8, MAX_TEMP);
    expect(hot).toBeGreaterThan(cold);
  });

  it('室温下 · 气味 = 风扇 × 0.4', () => {
    const v = computeScentIntensity(0.8, AMBIENT);
    expect(v).toBeCloseTo(0.8 * 0.4, 3);
  });

  it('最高温 · 气味 = 风扇 × 1.0', () => {
    const v = computeScentIntensity(0.8, MAX_TEMP);
    expect(v).toBeCloseTo(0.8, 3);
  });

  it('结果 clamp 在 [0, 1]', () => {
    expect(computeScentIntensity(1, MAX_TEMP)).toBeLessThanOrEqual(1);
    expect(computeScentIntensity(0, AMBIENT)).toBeGreaterThanOrEqual(0);
  });
});

// ═════════════════════════════════════════════════════════
// MockCoasterDriver · 驱动行为
// ═════════════════════════════════════════════════════════

describe('coasterProtocol · MockCoasterDriver 驱动', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('初始遥测 · 风扇 0 · 温度室温 · 加热关闭', () => {
    const driver = new MockCoasterDriver();
    const t = driver.getTelemetry();
    expect(t.fanSpeed).toBe(0);
    expect(t.fanTarget).toBe(0);
    expect(t.heating).toBe(false);
    expect(t.temperature).toBe(AMBIENT);
    expect(t.scentIntensity).toBe(0);
  });

  it('setFanSpeed · 更新目标转速（clamp 0-1）', () => {
    const driver = new MockCoasterDriver();
    driver.setFanSpeed(1.5);
    expect(driver.getTelemetry().fanTarget).toBe(1);
    driver.setFanSpeed(-0.5);
    expect(driver.getTelemetry().fanTarget).toBe(0);
    driver.setFanSpeed(0.7);
    expect(driver.getTelemetry().fanTarget).toBeCloseTo(0.7);
  });

  it('setHeating · 更新加热开关', () => {
    const driver = new MockCoasterDriver();
    driver.setHeating(true);
    expect(driver.getTelemetry().heating).toBe(true);
    driver.setHeating(false);
    expect(driver.getTelemetry().heating).toBe(false);
  });

  it('start + 定时推进 · 风扇实际转速渐近目标', () => {
    const driver = new MockCoasterDriver();
    driver.setFanSpeed(1);
    driver.start();
    // 初始为 0
    expect(driver.getTelemetry().fanSpeed).toBe(0);
    // 推进 2 秒（20 个 tick）
    vi.advanceTimersByTime(2000);
    const fanSpeed = driver.getTelemetry().fanSpeed;
    expect(fanSpeed).toBeGreaterThan(0.9);
    expect(fanSpeed).toBeLessThanOrEqual(1);
    driver.stop();
  });

  it('start + 加热 · 温度上升但不超过上限', () => {
    const driver = new MockCoasterDriver();
    driver.setHeating(true);
    driver.start();
    vi.advanceTimersByTime(10000); // 10 秒
    const temp = driver.getTelemetry().temperature;
    expect(temp).toBeGreaterThan(AMBIENT);
    expect(temp).toBeLessThanOrEqual(MAX_TEMP);
    driver.stop();
  });

  it('onTelemetry · 订阅后收到遥测更新', () => {
    const driver = new MockCoasterDriver();
    const received: number[] = [];
    driver.onTelemetry((t) => received.push(t.fanSpeed));
    driver.setFanSpeed(1);
    driver.start();
    vi.advanceTimersByTime(500); // 5 个 tick
    driver.stop();
    expect(received.length).toBeGreaterThan(0);
    expect(received[received.length - 1]).toBeGreaterThan(0);
  });

  it('onTelemetry · 取消订阅后不再收到', () => {
    const driver = new MockCoasterDriver();
    let count = 0;
    const unsub = driver.onTelemetry(() => count++);
    driver.start();
    vi.advanceTimersByTime(300);
    const countAfterFirst = count;
    unsub();
    vi.advanceTimersByTime(300);
    expect(count).toBe(countAfterFirst);
    driver.stop();
  });

  it('stop · 清除定时器不再推进', () => {
    const driver = new MockCoasterDriver();
    driver.setFanSpeed(1);
    driver.start();
    vi.advanceTimersByTime(500);
    const fanAfterRun = driver.getTelemetry().fanSpeed;
    driver.stop();
    vi.advanceTimersByTime(5000);
    const fanAfterStop = driver.getTelemetry().fanSpeed;
    expect(fanAfterStop).toBe(fanAfterRun);
  });

  it('createCoasterDriver · 工厂返回可用的协议实例', () => {
    const driver = createCoasterDriver();
    expect(driver).toBeDefined();
    expect(typeof driver.setFanSpeed).toBe('function');
    expect(typeof driver.setHeating).toBe('function');
    expect(typeof driver.getTelemetry).toBe('function');
    expect(typeof driver.start).toBe('function');
    expect(typeof driver.stop).toBe('function');
  });

  it('自定义配置 · 覆写物理参数生效', () => {
    const driver = createCoasterDriver({ heatingPower: 0.5, maxTemp: 40 });
    driver.setHeating(true);
    driver.start();
    vi.advanceTimersByTime(10000);
    expect(driver.getTelemetry().temperature).toBeLessThanOrEqual(40);
    driver.stop();
  });
});
