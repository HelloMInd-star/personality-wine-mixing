/**
 * recommendCache · 推荐结果内存 LRU 缓存
 * 实现 v0.1 阶段：单页面会话级缓存，容量 64
 *
 * 设计要点：
 *   - 基于 Map 的插入序实现 LRU，省去手写双向链表
 *   - 按 prefix 分组键空间，支持 clearByPrefix 选择性清理
 *   - 命中时返回同一引用，避免组件层无谓 re-render
 *   - 异常隔离：所有对外操作 try/catch，失败静默降级
 *   - 可观测：内置 debug 日志，通过 setCacheDebugEnabled 切换
 *
 * 触发条件（详见 docs/cache-module-plan.md）：
 *   配方库扩展至 50+ 款时接入 cocktailService 推荐路径
 */

import type { CocktailRecommendation, FlavorKey } from '../types/cocktail';
import type { FlavorPreference } from '../types/personality';

/** 八维风味键 · 顺序固定，用于稳定哈希 */
const FLAVOR_KEYS: FlavorKey[] = [
  'sweet',
  'sour',
  'bitter',
  'strong',
  'smoky',
  'fruity',
  'herbal',
  'creamy',
];

/** 缓存条目 */
export interface CacheEntry {
  recommendations: CocktailRecommendation[];
  createdAt: number;
}

/** 缓存键前缀 · 用于 clearByPrefix 选择性清理 */
const PREF_PREFIX = 'rec:pref:';
const ARCH_PREFIX = 'rec:arch:';

/** 默认容量 · 总占用上限约 64KB（单条约 1KB） */
const DEFAULT_CAPACITY = 64;

// ────────────────────────────────────────────────────────────
// 日志系统 · 可观测层
// ────────────────────────────────────────────────────────────

/**
 * 日志开关 · 默认关闭，避免控制台刷屏
 * 需要观察命中/未命中/写入等常规事件时调用 setCacheDebugEnabled(true)
 * 淘汰（EVICT）与错误（*_ERROR）始终以 warn 输出，不受此开关控制
 */
let debugEnabled = false;

/** 切换常规日志开关 · 供调试或测试环境启用 */
export function setCacheDebugEnabled(enabled: boolean): void {
  debugEnabled = enabled;
}

/** 日志详情类型 */
type LogDetails = Record<string, string | number | boolean | undefined>;

/** 格式化日志详情为字符串 */
function formatDetails(details: LogDetails): string {
  return Object.entries(details)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${v}`)
    .join(' · ');
}

/**
 * 常规日志 · 受 debugEnabled 控制
 * 用于 HIT / MISS / SET / CLEAR / CLEAR_BY_PREFIX 等高频事件
 * 默认关闭以避免控制台刷屏
 */
function log(action: string, details: LogDetails = {}): void {
  if (!debugEnabled) return;
  try {
    const parts = formatDetails(details);
    console.warn(`[recommendCache] ${action}${parts ? ' · ' + parts : ''}`);
  } catch {
    /* 日志失败静默 */
  }
}

/**
 * 告警日志 · 始终输出，不受 debugEnabled 控制
 * 用于 EVICT（淘汰）与 *_ERROR（异常）等重要事件
 */
function warn(action: string, details: LogDetails = {}): void {
  try {
    const parts = formatDetails(details);
    console.warn(`[recommendCache] ${action}${parts ? ' · ' + parts : ''}`);
  } catch {
    /* 日志失败静默 */
  }
}

// ────────────────────────────────────────────────────────────
// LRU 核心类
// ────────────────────────────────────────────────────────────

/**
 * LRU 缓存核心类
 * 基于 ES2015 Map 的插入序特性实现「最近最少使用」淘汰
 *
 * 不变量：
 *   - map 的迭代顺序始终为「最旧 → 最新」
 *   - get / set 命中时将该键移至末尾（最新位）
 *   - 超容量时淘汰首个键（最旧位），并触发 onEvict 回调
 */
export class LRUCache<K, V> {
  private readonly map = new Map<K, V>();

  constructor(
    private readonly capacity: number = DEFAULT_CAPACITY,
    /** 淘汰回调 · 用于上层（recommendCache）记录淘汰日志 */
    private readonly onEvict?: (key: K) => void,
  ) {
    if (capacity <= 0) {
      throw new Error('LRUCache capacity must be positive');
    }
  }

  /** 取值 · 命中时将该键移至最近使用位（末尾） */
  get(key: K): V | undefined {
    const value = this.map.get(key);
    if (value === undefined) return undefined;
    // 重新插入以更新顺序
    this.map.delete(key);
    this.map.set(key, value);
    return value;
  }

  /** 写值 · 超容量时淘汰最旧键；已存在则更新值并移至末尾 */
  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      // 淘汰最旧（首个）键
      const oldest = this.map.keys().next().value;
      if (oldest !== undefined) {
        this.map.delete(oldest);
        // 触发淘汰回调 · 上层据此打印日志
        try {
          this.onEvict?.(oldest);
        } catch {
          /* 回调失败不影响主流程 */
        }
      }
    }
    this.map.set(key, value);
  }

  /** 是否存在（不更新顺序，避免探测行为改变 LRU 状态） */
  has(key: K): boolean {
    return this.map.has(key);
  }

  /** 删除单个键 · 返回是否确实删除 */
  delete(key: K): boolean {
    return this.map.delete(key);
  }

  /** 清空全部 */
  clear(): void {
    this.map.clear();
  }

  /** 当前条目数 */
  get size(): number {
    return this.map.size;
  }

  /** 容量上限 */
  get maxCapacity(): number {
    return this.capacity;
  }

  /** 遍历键 · 顺序为 LRU（旧 → 新），用于前缀清理 */
  keys(): IterableIterator<K> {
    return this.map.keys();
  }
}

// ────────────────────────────────────────────────────────────
// 键生成
// ────────────────────────────────────────────────────────────

/**
 * 将风味偏好哈希为稳定字符串键
 * 权重四舍五入至 2 位小数，避免浮点抖动（< 0.005）导致缓存失效
 */
function hashFlavorPreference(pref: FlavorPreference): string {
  return FLAVOR_KEYS.map((k) => {
    const v = pref[k] ?? 0;
    return Math.round(v * 100) / 100;
  }).join('|');
}

/** 推荐 · 按风味偏好 · 缓存键 */
function prefKey(pref: FlavorPreference, limit: number): string {
  return `${PREF_PREFIX}${hashFlavorPreference(pref)}:limit=${limit}`;
}

/** 推荐 · 按原型 · 缓存键 */
function archKey(code: string, limit: number): string {
  return `${ARCH_PREFIX}${code}:limit=${limit}`;
}

// ────────────────────────────────────────────────────────────
// 单例缓存实例 · 注册淘汰回调
// ────────────────────────────────────────────────────────────

/** 单例缓存实例 · 全局唯一，避免多实例键空间分裂 */
const cache = new LRUCache<string, CacheEntry>(DEFAULT_CAPACITY, (evictedKey) => {
  // 淘汰是重要事件 · 始终以 warn 输出，不受 debugEnabled 控制
  warn('EVICT', {
    evictedKey,
    size: cache.size,
    capacity: cache.maxCapacity,
  });
});

// ────────────────────────────────────────────────────────────
// 对外 API
// ────────────────────────────────────────────────────────────

/**
 * 推荐缓存对外 API
 * 所有方法均 try/catch 兜底，确保缓存异常不影响主流程
 * 命中/未命中/写入/淘汰均有日志输出
 */
export const recommendCache = {
  /** 按风味偏好取推荐缓存 */
  getByPreference(
    pref: FlavorPreference,
    limit: number,
  ): CacheEntry | undefined {
    const key = prefKey(pref, limit);
    try {
      const entry = cache.get(key);
      if (entry) {
        log('HIT', {
          kind: 'pref',
          limit,
          size: cache.size,
          capacity: cache.maxCapacity,
          key,
        });
      } else {
        log('MISS', { kind: 'pref', limit, key });
      }
      return entry;
    } catch {
      warn('GET_ERROR', { kind: 'pref', limit, key });
      return undefined;
    }
  },

  /** 写入推荐缓存 */
  setByPreference(
    pref: FlavorPreference,
    limit: number,
    entry: CacheEntry,
  ): void {
    const key = prefKey(pref, limit);
    try {
      cache.set(key, entry);
      log('SET', {
        kind: 'pref',
        limit,
        size: cache.size,
        capacity: cache.maxCapacity,
        key,
      });
    } catch {
      warn('SET_ERROR', { kind: 'pref', limit, key });
    }
  },

  /** 按原型取推荐缓存 */
  getByArchetype(code: string, limit: number): CacheEntry | undefined {
    const key = archKey(code, limit);
    try {
      const entry = cache.get(key);
      if (entry) {
        log('HIT', {
          kind: 'arch',
          code,
          limit,
          size: cache.size,
          capacity: cache.maxCapacity,
          key,
        });
      } else {
        log('MISS', { kind: 'arch', code, limit, key });
      }
      return entry;
    } catch {
      warn('GET_ERROR', { kind: 'arch', code, limit, key });
      return undefined;
    }
  },

  /** 写入原型推荐缓存 */
  setByArchetype(code: string, limit: number, entry: CacheEntry): void {
    const key = archKey(code, limit);
    try {
      cache.set(key, entry);
      log('SET', {
        kind: 'arch',
        code,
        limit,
        size: cache.size,
        capacity: cache.maxCapacity,
        key,
      });
    } catch {
      warn('SET_ERROR', { kind: 'arch', code, limit, key });
    }
  },

  /** 清空全部缓存 */
  clear(): void {
    const cleared = cache.size;
    cache.clear();
    log('CLEAR', {
      cleared,
      size: cache.size,
      capacity: cache.maxCapacity,
    });
  },

  /**
   * 按前缀清理 · 用于 clearProfile 场景
   * 例：clearByPrefix('rec:pref:') 仅清画像相关，保留原型缓存
   */
  clearByPrefix(prefix: string): void {
    try {
      const keysToDelete: string[] = [];
      for (const key of cache.keys()) {
        if (key.startsWith(prefix)) keysToDelete.push(key);
      }
      for (const k of keysToDelete) cache.delete(k);
      log('CLEAR_BY_PREFIX', {
        prefix,
        removed: keysToDelete.length,
        remaining: cache.size,
        capacity: cache.maxCapacity,
      });
    } catch {
      warn('CLEAR_BY_PREFIX_ERROR', { prefix });
    }
  },

  /** 调试 · 当前条目数 */
  size(): number {
    return cache.size;
  },

  /** 调试 · 容量上限 */
  capacity(): number {
    return cache.maxCapacity;
  },
} as const;
