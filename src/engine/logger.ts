/**
 * 觉醉 · 分级日志系统
 *
 * 用法：
 *   import { logger } from '../engine/logger';
 *   logger.engine('cocktailEngine.recommend 开始');
 *   logger.store('写入向量', { dims: 6 });
 *   logger.flow('调酒推荐', '启动')(...);
 *   logger.wrap('myFn', myFn);
 *
 * 浏览器控制台筛选：
 *   按 [ENGINE] / [STORE] / [FLOW] / [UI] / [ERROR] 标签过滤
 *
 * 订阅机制：
 *   const unsub = logger.subscribe((entry) => { ... });
 *   unsub(); // 取消
 */

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

export type LogCategory = 'engine' | 'store' | 'flow' | 'ui' | 'error' | 'info';
export type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

export interface LogEntry {
  category: LogCategory;
  level: LogLevel;
  tag: string;
  timestamp: string;
  message: string;
  color: string;
  rawArgs: unknown[];
}

type LogSubscriber = (entry: LogEntry) => void;

// ═════════════════════════════════════════════════════════
// 配色 · 深空紫金主题
// ═════════════════════════════════════════════════════════

const LOG_COLORS: Record<LogCategory, string> = {
  engine: '#a855f7', // 紫 · 引擎层
  store: '#f0c674',  // 金 · 存储层
  flow: '#60a5fa',   // 蓝 · 流程追踪
  ui: '#f472b6',     // 粉 · UI 交互
  error: '#ef4444',  // 红 · 错误
  info: '#94a3b8',   // 灰 · 通用
};

// ═════════════════════════════════════════════════════════
// 订阅/发布
// ═════════════════════════════════════════════════════════

const subscribers = new Set<LogSubscriber>();

function subscribe(callback: LogSubscriber): () => void {
  if (typeof callback !== 'function') {
    console.warn('[logger.subscribe] callback 必须是函数');
    return () => {};
  }
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
  };
}

function publish(entry: LogEntry): void {
  for (const cb of subscribers) {
    try {
      cb(entry);
    } catch (e) {
      console.error('[logger.publish] 订阅者处理异常:', e);
    }
  }
}

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

const getTimestamp = (): string => {
  const now = new Date();
  return (
    now.toISOString().replace('T', ' ').slice(0, 19) +
    '.' +
    String(now.getMilliseconds()).padStart(3, '0')
  );
};

const formatArgsLight = (args: unknown[]): string => {
  return args
    .map((arg) => {
      if (arg === null) return 'null';
      if (arg === undefined) return 'undefined';
      if (typeof arg === 'object') {
        if (Array.isArray(arg)) return `[Array(${arg.length})]`;
        const className = (arg as object).constructor?.name || 'Object';
        return `[${className}]`;
      }
      return String(arg);
    })
    .join(' ');
};

// ═════════════════════════════════════════════════════════
// 日志工厂
// ═════════════════════════════════════════════════════════

const createLogger = (category: LogCategory, level: LogLevel = 'log') => {
  const color = LOG_COLORS[category];
  const tag = `[${category.toUpperCase()}]`;

  return (...args: unknown[]): void => {
    const timestamp = getTimestamp();
    const message = formatArgsLight(args);

    // 控制台输出 · 彩色标签
    const consoleFn = console[level] as (...a: unknown[]) => void;
    consoleFn(
      `%c觉醉%c ${tag} %c${timestamp}%c ${message}`,
      `background: ${color}; color: white; padding: 2px 8px; border-radius: 4px; font-weight: bold;`,
      `color: ${color}; font-weight: bold;`,
      'color: #64748b; font-size: 11px;',
      'color: inherit;',
      ...args,
    );

    // 发布到订阅者
    if (subscribers.size > 0) {
      publish({
        category,
        level,
        tag,
        timestamp,
        message,
        color,
        rawArgs: args,
      });
    }
  };
};

// ═════════════════════════════════════════════════════════
// 日志器
// ═════════════════════════════════════════════════════════

export const logger = {
  /** 引擎层 · 算法调用、向量计算、推荐流程 */
  engine: createLogger('engine'),

  /** 存储层 · localStorage 读写、状态持久化 */
  store: createLogger('store'),

  /** 流程追踪 · 用户旅程、页面跳转、会话边界 */
  flow: createLogger('flow'),

  /** UI 交互 · 点击、切换、动画触发 */
  ui: createLogger('ui'),

  /** 错误 · 异常、崩溃、越界 */
  error: createLogger('error', 'error'),

  /** 通用信息 · 调试、状态快照 */
  info: createLogger('info', 'info'),

  // ── 高级工具 ──────────────────────────────────────

  /**
   * 记录一个带计时的流程节点
   *
   * @example
   *   const done = logger.flowTimed('调酒推荐', '启动');
   *   // ... 做一些事情
   *   done('完成'); // 自动计算耗时
   */
  flowTimed: (flowName: string, stepName: string, ...args: unknown[]) => {
    const startTime = performance.now();
    createLogger('flow')(`[${flowName}] → ${stepName}`, ...args);
    return (endStepName: string, ...endArgs: unknown[]): void => {
      const duration = (performance.now() - startTime).toFixed(1);
      createLogger('flow')(`[${flowName}] ✓ ${endStepName} (${duration}ms)`, ...endArgs);
    };
  },

  /**
   * 包装一个函数，自动记录参数和返回值
   *
   * @example
   *   const wrapped = logger.wrap('calibrateVector', calibrateVector);
   *   wrapped(base, feedback, rec); // 自动 logger.info 入参和出参
   */
  wrap: <T extends (...args: any[]) => any>(
    fnName: string,
    fn: T,
  ): T => {
    return ((...args: any[]) => {
      createLogger('info')(`→ ${fnName}()`, args.length > 0 ? args : '(无参数)');
      const start = performance.now();
      try {
        const result = fn(...args);
        const duration = (performance.now() - start).toFixed(1);
        if (result && typeof (result as Promise<unknown>).then === 'function') {
          return (result as Promise<unknown>).then((r) => {
            createLogger('info')(`← ${fnName}() ✓ (${duration}ms)`, r);
            return r;
          }).catch((e: Error) => {
            createLogger('error', 'error')(`✗ ${fnName}()`, e.message);
            throw e;
          });
        }
        createLogger('info')(`← ${fnName}() ✓ (${duration}ms)`, result);
        return result;
      } catch (e) {
        createLogger('error', 'error')(`✗ ${fnName}()`, (e as Error).message);
        throw e;
      }
    }) as unknown as T;
  },

  /**
   * 订阅日志，返回取消订阅函数
   *
   * @example
   *   const unsub = logger.subscribe((entry) => {
   *     if (entry.category === 'error') sendToServer(entry);
   *   });
   */
  subscribe,
};

export default logger;