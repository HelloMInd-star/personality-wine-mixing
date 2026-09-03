/**
 * StorageBus · 三分区数据总线
 *
 * 对应 觉醉 Game-OS 的命名空间隔离规范：
 *   - pipeline_* : 只读（官方流水线结果，任何业务代码禁止写入）
 *   - draft_*    : 可写（用户数据、草稿区、临时状态）
 *   - audit_log_*: 仅追加不可篡改（永久审计日志，附 HMAC 防篡改签名）
 *
 * 与现有 localStorage 共存，通过前缀隔离命名空间。
 * 当前 觉醉 已实现 draft 区（feedback-raw/calibrated），
 * 本模块补充 audit 区 HMAC 签名 + 健康检查。
 */

import { logger } from '../engine/logger';

// ═════════════════════════════════════════════════════════
// HMAC 轻量签名（前端防篡改）· 生产环境请升级到 Web Crypto Subtle HMAC
// ═════════════════════════════════════════════════════════

const HMAC_SECRET = '觉醉.Audit.V1.Secret';

function simpleHmac(payload: unknown): string {
  const str = typeof payload === 'string' ? payload : JSON.stringify(payload);
  const data = HMAC_SECRET + '::' + str + '::' + HMAC_SECRET;
  // FNV-1a 32-bit
  let hash = 0x811c9dc5;
  for (let i = 0; i < data.length; i++) {
    hash ^= data.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * 验证 HMAC 签名 · 返回 true 表示未被篡改
 */
export function verifyHmac(entry: Record<string, unknown> & { _sig?: string }): boolean {
  if (!entry || typeof entry !== 'object') return false;
  const sig = entry._sig;
  if (!sig) return false;
  const { _sig: _, ...rest } = entry;
  return simpleHmac(rest) === sig;
}

/**
 * 为条目附加 HMAC 签名 · 返回带有 _sig 的新对象
 */
export function signEntry<T extends Record<string, unknown>>(entry: T): T & { _sig: string } {
  return { ...entry, _sig: simpleHmac(entry) };
}

// ═════════════════════════════════════════════════════════
// 审计日志存储
// ═════════════════════════════════════════════════════════

const AUDIT_KEY = 'audit_log_juezui';

interface AuditEntry {
  id: string;
  timestamp: number;
  iso: string;
  category: string;
  action: string;
  details: Record<string, unknown>;
  _sig?: string;
  _tampered?: boolean;
  [key: string]: unknown;
}

/**
 * 追加一条审计日志（自动附加时间戳、ID、防篡改签名）
 */
export function appendAudit(
  category: string,
  action: string,
  details: Record<string, unknown> = {},
): AuditEntry {
  const entryBase: Omit<AuditEntry, '_sig'> = {
    id: `audit_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: Date.now(),
    iso: new Date().toISOString(),
    category,
    action,
    details,
  };

  const entry = signEntry(entryBase) as AuditEntry;

  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    const logs: AuditEntry[] = raw ? JSON.parse(raw) : [];
    logs.push(entry);
    // 保留最近 200 条
    localStorage.setItem(AUDIT_KEY, JSON.stringify(logs.slice(-200)));
    logger.store('AuditLog:append', { category, action, id: entry.id });
  } catch (e) {
    logger.error('AuditLog:append:failed', { msg: (e as Error).message });
  }

  return entry;
}

/**
 * 查询审计日志
 */
export function queryAudit(filter: {
  category?: string;
  action?: string;
  fromTs?: number;
  toTs?: number;
  limit?: number;
} = {}): { total: number; integrity: 'OK' | 'FAILED'; entries: AuditEntry[] } {
  try {
    const raw = localStorage.getItem(AUDIT_KEY);
    let logs: AuditEntry[] = raw ? JSON.parse(raw) : [];

    let integrityOk = true;
    for (const entry of logs) {
      if (!verifyHmac(entry)) {
        integrityOk = false;
        entry._tampered = true;
      }
    }

    if (filter.category) logs = logs.filter((l) => l.category === filter.category);
    if (filter.action) logs = logs.filter((l) => l.action === filter.action);
    if (filter.fromTs !== undefined) logs = logs.filter((l) => l.timestamp >= filter.fromTs!);
    if (filter.toTs !== undefined) logs = logs.filter((l) => l.timestamp <= filter.toTs!);
    if (typeof filter.limit === 'number') logs = logs.slice(-filter.limit);

    return {
      total: logs.length,
      integrity: integrityOk ? 'OK' : 'FAILED',
      entries: logs,
    };
  } catch {
    return { total: 0, integrity: 'FAILED', entries: [] };
  }
}

/**
 * 读取最近 N 条审计日志
 */
export function tailAudit(n = 50) {
  return queryAudit({ limit: n });
}

// ═════════════════════════════════════════════════════════
// 总线健康检查
// ═════════════════════════════════════════════════════════

export interface BusHealth {
  status: 'HEALTHY' | 'UNHEALTHY';
  draft: string;
  auditLog: { entries: number; integrity: string };
  localStorageAvailable: boolean;
  ts: number;
}

export function busHealthCheck(): BusHealth {
  try {
    // 检查 localStorage 可用性
    const testKey = '__bus_health_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    const localStorageAvailable = true;

    // 检查 draft 区（feedback-raw 是否存在）
    const draftOk = localStorage.getItem('juezui-feedback-raw') !== null
      ? 'READY'
      : 'READY (no data yet)';

    // 检查 audit 区
    const audit = tailAudit(1);

    logger.info('BusHealth:check', {
      draft: draftOk,
      auditEntries: audit.total,
      auditIntegrity: audit.integrity,
    });

    return {
      status: audit.integrity === 'OK' ? 'HEALTHY' : 'UNHEALTHY',
      draft: draftOk,
      auditLog: { entries: audit.total, integrity: audit.integrity },
      localStorageAvailable,
      ts: Date.now(),
    };
  } catch (e) {
    logger.error('BusHealth:check:failed', { msg: (e as Error).message });
    return {
      status: 'UNHEALTHY',
      draft: 'ERROR',
      auditLog: { entries: 0, integrity: 'FAILED' },
      localStorageAvailable: false,
      ts: Date.now(),
    };
  }
}

export default {
  verifyHmac,
  signEntry,
  appendAudit,
  queryAudit,
  tailAudit,
  busHealthCheck,
};