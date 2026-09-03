/**
 * AppStore · 全局状态
 * 管理人格画像的跨页面流转与本地持久化（localStorage）
 * 管理情绪调节器的主动选择（sessionStorage · 关 tab 即失，刷新存活）
 * 持久化逻辑委托给 cocktailService，本层只管 React 状态
 *
 * 反馈数据三分区存储（参考 YBus PIPELINE/DRAFT/AUDIT 隔离）：
 *   - juezui-feedback-raw · 原始评分信号（仅追加，cap 100）· 用户数据
 *   - juezui-feedback-calibrated · 最新校准后向量快照（可覆盖）· 派生态
 *   - juezui-feedback-audit · 校准动作日志（仅追加，cap 100）· 含 drift/fused
 *   旧 key 'juezui-feedback' 在 mount 时一次性迁移到 raw 区
 *
 * 鉴权：Mock 登录 · localStorage 持久化 · 后端就绪后替换 login 为真实 API
 *
 * 性能监控：关键状态切换点输出 perfMark 日志（仅 DEV），含堆内存占用
 */

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from 'react';
import type { PersonalityProfile } from '../types/personality';
import type { MoodTag } from '../types/cocktail';
import type { PersonaVector } from '../types/personaFusion';
import type { TimeSlot } from '../engine/timeEngine';
import type { FeedbackSignal, CalibrateAuditEntry } from '../types/feedback';
import { cocktailService } from '../services/cocktailService';
import { calibrateVectorWithAudit, trackFeedback } from '../engine/feedbackEngine';
import { logger } from '../engine/logger';
import { signEntry } from '../services/storageBus';

/** 情绪调节器 session 存储键 · 关 tab 即失 */
const MOOD_STORAGE_KEY = 'juezui-mood';

// ═════════════════════════════════════════════════════════
// 鉴权 · Mock 登录 · localStorage 持久化
// ═════════════════════════════════════════════════════════

/** 鉴权存储键 */
const AUTH_STORAGE_KEY = 'juezui-auth';

interface AuthState {
  isLoggedIn: boolean;
  username: string;
  loginAt: number;
}

const DEFAULT_AUTH_STATE: AuthState = {
  isLoggedIn: false,
  username: '',
  loginAt: 0,
};

/** 从本地恢复鉴权状态 · 失败回默认（未登录） */
function loadAuthState(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return DEFAULT_AUTH_STATE;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (!parsed.isLoggedIn || !parsed.username) return DEFAULT_AUTH_STATE;
    return {
      isLoggedIn: true,
      username: parsed.username,
      loginAt: parsed.loginAt ?? 0,
    };
  } catch {
    return DEFAULT_AUTH_STATE;
  }
}

/** 持久化鉴权状态 · 失败静默降级 */
function persistAuthState(state: AuthState): void {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* localStorage 不可用 · 静默降级 */
  }
}

// ═════════════════════════════════════════════════════════
// 反馈数据三分区存储 · 参考 YBus PIPELINE/DRAFT/AUDIT 隔离
//   - raw：原始评分信号（仅追加，cap 100）· 用户数据
//   - calibrated：最新校准后向量快照（可覆盖）· 派生态
//   - audit：校准动作日志（仅追加，cap 100）· 含 drift/fused 元数据
// ═════════════════════════════════════════════════════════

/** raw 区 · 原始评分信号 */
const FEEDBACK_RAW_KEY = 'juezui-feedback-raw';
/** calibrated 区 · 最新校准后向量快照 */
const FEEDBACK_CALIBRATED_KEY = 'juezui-feedback-calibrated';
/** audit 区 · 校准动作日志 */
const FEEDBACK_AUDIT_KEY = 'juezui-feedback-audit';
/** 旧 key · 一次性迁移到 raw 区后删除 */
const FEEDBACK_LEGACY_KEY = 'juezui-feedback';

/** 评分历史上限 · 超出截断旧记录 */
const FEEDBACK_HISTORY_LIMIT = 100;
/** 审计日志上限 · 与 raw 同步 */
const AUDIT_LOG_LIMIT = 100;

/**
 * 性能监控日志 · 仅 DEV 环境（含测试）输出
 * 输出：时间戳 + JS 堆内存占用（Chrome 非标准 API，jsdom 无则省略）+ 详情
 */
function perfMark(scope: string, detail: Record<string, unknown> = {}): void {
  if (!import.meta.env.DEV) return;
  const mem = (
    performance as Performance & { memory?: { usedJSHeapSize: number } }
  ).memory;
  const memStr = mem
    ? ` mem=${(mem.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`
    : '';
  const ts = performance.now().toFixed(1);
  logger.store(`AppStore:${scope}`, { ...detail, ts, mem: memStr.trim() });
}

/** 情绪调节器持久化结构 */
interface MoodState {
  mood: MoodTag | null;
  intensity: number;
  /** 音乐音量 0-1 · 持久化避免刷新重置 */
  musicVolume: number;
}

/** 默认情绪态 · 调节器关闭，强度中性，音量 0.5 */
const DEFAULT_MOOD_STATE: MoodState = {
  mood: null,
  intensity: 0.5,
  musicVolume: 0.5,
};

interface AppStoreValue {
  /** 是否已登录 · localStorage 持久化 */
  isLoggedIn: boolean;
  /** 当前用户名 · localStorage 持久化 */
  username: string;
  /** 登录 · Mock 鉴权 · 后端就绪后替换为真实 API */
  login: (username: string) => void;
  /** 登出 · 清除鉴权状态 */
  logout: () => void;
  profile: PersonalityProfile | null;
  /** 六维人格向量 · 牌类入口产物，作为唯一数据契约驱动派生层 */
  vector: PersonaVector | null;
  /** 当前主动情绪 · null 表示关闭调节 */
  activeMood: MoodTag | null;
  /** 情绪强度 0-1 */
  moodIntensity: number;
  /** 旅程音乐是否启用 · 默认关闭，用户主动开启（避免浏览器自动播放策略） */
  audioEnabled: boolean;
  /** 音乐音量 0-1 */
  musicVolume: number;
  /** 用户手动选择的时段 · null 表示按系统时间（入口页 5 星球交互产物） */
  manualTimeSlot: TimeSlot | null;
  /** 喝后评分历史 · raw 区 · localStorage 持久化，最多 100 条 */
  feedbackHistory: FeedbackSignal[];
  /** 校准审计日志 · audit 区 · localStorage 持久化，最多 100 条 · 仅追加 */
  auditLog: CalibrateAuditEntry[];
  saveProfile: (profile: PersonalityProfile) => void;
  clearProfile: () => void;
  /** 持久化六维向量 · 牌类入口落库后即作为唯一数据契约 */
  saveVector: (vec: PersonaVector) => void;
  /** 清除本地六维向量 */
  clearVector: () => void;
  /** 设置主动情绪 · null 关闭调节（退化为时段感知） */
  setActiveMood: (mood: MoodTag | null) => void;
  /** 设置情绪强度 0-1 · 自动夹取 */
  setMoodIntensity: (intensity: number) => void;
  /** 开启/关闭旅程音乐 */
  setAudioEnabled: (enabled: boolean) => void;
  /** 设置音乐音量 0-1 · 自动夹取 */
  setMusicVolume: (volume: number) => void;
  /** 设置手动时段 · null 回退到系统时间（入口页星球点击产物） */
  setManualTimeSlot: (slot: TimeSlot | null) => void;
  /** 追加喝后评分 · 自动持久化到 raw 区并截断到 100 条上限 */
  addFeedback: (fb: FeedbackSignal) => void;
  /**
   * 基于当前向量 + 评分历史计算校准向量 · 无向量或无评分时返回 null
   * 副作用：持久化到 calibrated 区 + 追加 audit 条目（仅当向量变化时）
   */
  getCalibratedVector: () => PersonaVector | null;
}

const AppStoreContext = createContext<AppStoreValue | null>(null);

/** 从 session 恢复情绪态 · 失败回默认 */
function loadMoodState(): MoodState {
  try {
    const raw = sessionStorage.getItem(MOOD_STORAGE_KEY);
    if (!raw) return DEFAULT_MOOD_STATE;
    const parsed = JSON.parse(raw) as Partial<MoodState>;
    const intensity =
      typeof parsed.intensity === 'number'
        ? Math.max(0, Math.min(1, parsed.intensity))
        : 0.5;
    const musicVolume =
      typeof parsed.musicVolume === 'number'
        ? Math.max(0, Math.min(1, parsed.musicVolume))
        : 0.5;
    return {
      mood: parsed.mood ?? null,
      intensity,
      musicVolume,
    };
  } catch {
    return DEFAULT_MOOD_STATE;
  }
}

/** 写入 session · 失败静默降级 */
function persistMoodState(state: MoodState): void {
  try {
    sessionStorage.setItem(MOOD_STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* sessionStorage 不可用 · 静默降级 */
  }
}

/** 六维向量相等性比较 · 用于 audit 去重（避免重复追加相同快照） */
function vectorsEqual(a: PersonaVector, b: PersonaVector): boolean {
  return (
    a.TOL === b.TOL &&
    a.SPD === b.SPD &&
    a.INF === b.INF &&
    a.ENT === b.ENT &&
    a.LEAD === b.LEAD &&
    a.VIS === b.VIS
  );
}

// ── raw 区 · 原始评分信号 ──────────────────────────────

/** 从本地恢复原始评分 · 失败回空数组 · 兼容旧 key 一次性迁移 */
function loadRawFeedback(): FeedbackSignal[] {
  try {
    let raw = localStorage.getItem(FEEDBACK_RAW_KEY);
    if (!raw) {
      // 旧 key 迁移 · 一次性搬到 raw 区并删除旧 key
      const legacy = localStorage.getItem(FEEDBACK_LEGACY_KEY);
      if (legacy) {
        localStorage.setItem(FEEDBACK_RAW_KEY, legacy);
        localStorage.removeItem(FEEDBACK_LEGACY_KEY);
        raw = legacy;
      }
    }
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as FeedbackSignal[];
  } catch {
    return [];
  }
}

/** 持久化原始评分到 raw 区 · 失败静默降级 */
function persistRawFeedback(history: FeedbackSignal[]): void {
  try {
    localStorage.setItem(FEEDBACK_RAW_KEY, JSON.stringify(history));
  } catch {
    /* localStorage 不可用 · 静默降级 */
  }
}

// ── calibrated 区 · 最新校准后向量快照 ──────────────────

/** 从本地恢复最新校准向量 · 失败回 null */
function loadCalibratedSnapshot(): PersonaVector | null {
  try {
    const raw = localStorage.getItem(FEEDBACK_CALIBRATED_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersonaVector;
  } catch {
    return null;
  }
}

/** 持久化最新校准向量到 calibrated 区（覆盖）· 失败静默降级 */
function persistCalibratedSnapshot(vec: PersonaVector): void {
  try {
    localStorage.setItem(FEEDBACK_CALIBRATED_KEY, JSON.stringify(vec));
  } catch {
    /* localStorage 不可用 · 静默降级 */
  }
}

// ── audit 区 · 校准动作日志（仅追加）────────────────────

/** 从本地恢复审计日志 · 失败回空数组 */
function loadAuditLog(): CalibrateAuditEntry[] {
  try {
    const raw = localStorage.getItem(FEEDBACK_AUDIT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as CalibrateAuditEntry[];
  } catch {
    return [];
  }
}

/**
 * 追加审计条目到 audit 区 · 仅追加 + 截断到 100 条上限
 * 条目自动附加 HMAC 防篡改签名
 * @returns 更新后的完整日志（供 setState 用）
 */
function appendAuditEntry(
  log: CalibrateAuditEntry[],
  entry: CalibrateAuditEntry,
): CalibrateAuditEntry[] {
  const signed = signEntry(entry as unknown as Record<string, unknown>) as unknown as CalibrateAuditEntry;
  const next = [...log, signed];
  const trimmed =
    next.length > AUDIT_LOG_LIMIT
      ? next.slice(next.length - AUDIT_LOG_LIMIT)
      : next;
  try {
    localStorage.setItem(FEEDBACK_AUDIT_KEY, JSON.stringify(trimmed));
  } catch {
    /* localStorage 不可用 · 静默降级 */
  }
  return trimmed;
}

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<PersonalityProfile | null>(null);
  const [vector, setVector] = useState<PersonaVector | null>(null);
  const [moodState, setMoodState] = useState<MoodState>(loadMoodState);
  // 音乐开关不持久化 · 避免刷新后触发浏览器自动播放策略拦截
  const [audioEnabled, setAudioEnabledState] = useState(false);
  // 手动时段不持久化 · 每次进入按系统时间，用户主动点星球才覆盖
  const [manualTimeSlot, setManualTimeSlotState] = useState<TimeSlot | null>(null);
  // 喝后评分历史 · raw 区 · localStorage 持久化，闭环校准向量
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackSignal[]>(loadRawFeedback);
  // 校准审计日志 · audit 区 · localStorage 持久化，追溯向量演变
  const [auditLog, setAuditLog] = useState<CalibrateAuditEntry[]>(loadAuditLog);
  // 鉴权状态 · localStorage 持久化 · Mock 登录
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);

  // 上一次情绪态引用 · 用于切换前后对比日志
  const prevMoodRef = useRef<MoodState>(moodState);
  // 挂载时间戳 · 用于统计初始化耗时
  const mountTsRef = useRef<number>(performance.now());
  // 上次校准快照引用 · 用于 audit 去重（避免重复追加相同向量）
  const lastCalibratedRef = useRef<PersonaVector | null>(loadCalibratedSnapshot());

  // 挂载时从本地恢复画像与六维向量 · 让其跨刷新存活
  useEffect(() => {
    perfMark('mount:start', { from: 'localStorage' });
    const loaded = cocktailService.loadProfile();
    setProfile(loaded);
    const loadedVec = cocktailService.loadVector();
    setVector(loadedVec);
    perfMark('mount:loaded', {
      hasProfile: loaded !== null,
      archetype: loaded?.archetype.code ?? 'none',
      hasVector: loadedVec !== null,
      feedbackCount: feedbackHistory.length,
      auditCount: auditLog.length,
      initMs: (performance.now() - mountTsRef.current).toFixed(1),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = useCallback((next: PersonalityProfile) => {
    perfMark('saveProfile', { archetype: next.archetype.code });
    setProfile(next);
    cocktailService.saveProfile(next);
  }, []);

  const clearProfile = useCallback(() => {
    perfMark('clearProfile', {});
    setProfile(null);
    cocktailService.clearProfile();
  }, []);

  const saveVector = useCallback((next: PersonaVector) => {
    perfMark('saveVector', {
      TOL: next.TOL,
      SPD: next.SPD,
      INF: next.INF,
      ENT: next.ENT,
      LEAD: next.LEAD,
      VIS: next.VIS,
    });
    setVector(next);
    cocktailService.saveVector(next);
  }, []);

  const clearVector = useCallback(() => {
    perfMark('clearVector', {});
    setVector(null);
    cocktailService.clearVector();
  }, []);

  const setActiveMood = useCallback((mood: MoodTag | null) => {
    setMoodState((prev) => {
      const next = { ...prev, mood };
      persistMoodState(next);
      perfMark('setActiveMood', {
        from: prev.mood,
        to: mood,
        intensity: next.intensity,
        changed: prev.mood !== mood,
      });
      prevMoodRef.current = next;
      return next;
    });
  }, []);

  const setMoodIntensity = useCallback((intensity: number) => {
    const clamped = Math.max(0, Math.min(1, intensity));
    setMoodState((prev) => {
      const next = { ...prev, intensity: clamped };
      persistMoodState(next);
      perfMark('setMoodIntensity', {
        from: prev.intensity.toFixed(2),
        to: clamped.toFixed(2),
        mood: next.mood,
        changed: prev.intensity !== clamped,
      });
      prevMoodRef.current = next;
      return next;
    });
  }, []);

  const setAudioEnabled = useCallback((enabled: boolean) => {
    perfMark('setAudioEnabled', { to: enabled });
    setAudioEnabledState(enabled);
  }, []);

  const setMusicVolume = useCallback((volume: number) => {
    const clamped = Math.max(0, Math.min(1, volume));
    setMoodState((prev) => {
      const next = { ...prev, musicVolume: clamped };
      persistMoodState(next);
      perfMark('setMusicVolume', {
        from: prev.musicVolume.toFixed(2),
        to: clamped.toFixed(2),
      });
      prevMoodRef.current = next;
      return next;
    });
  }, []);

  const setManualTimeSlot = useCallback((slot: TimeSlot | null) => {
    perfMark('setManualTimeSlot', { to: slot });
    setManualTimeSlotState(slot);
  }, []);

  const addFeedback = useCallback((fb: FeedbackSignal) => {
    setFeedbackHistory((prev) => {
      const next = [...prev, fb];
      // 超出上限截断旧记录 · 保留最近 100 条
      const trimmed =
        next.length > FEEDBACK_HISTORY_LIMIT
          ? next.slice(next.length - FEEDBACK_HISTORY_LIMIT)
          : next;
      persistRawFeedback(trimmed);
      trackFeedback('calibrate.persist', {
        recipeId: fb.recipeId,
        rating: fb.rating,
        total: trimmed.length,
        zone: 'raw',
      });
      perfMark('addFeedback', {
        recipeId: fb.recipeId,
        rating: fb.rating,
        total: trimmed.length,
      });
      return trimmed;
    });
  }, []);

  // ── 鉴权 · Mock 登录 ──────────────────────────────────

  const login = useCallback((username: string) => {
    const next: AuthState = {
      isLoggedIn: true,
      username,
      loginAt: Date.now(),
    };
    setAuthState(next);
    persistAuthState(next);
    perfMark('login', { username });
  }, []);

  const logout = useCallback(() => {
    setAuthState(DEFAULT_AUTH_STATE);
    persistAuthState(DEFAULT_AUTH_STATE);
    perfMark('logout', {});
  }, []);

  // 校准向量 · 基于当前向量 + 评分历史 · 兜底推荐向量取最近一条 feedback 的快照
  // 需用 ref 读最新 vector/feedbackHistory，避免 useCallback 闭包陈旧
  const vectorRef = useRef<PersonaVector | null>(vector);
  vectorRef.current = vector;
  const feedbackHistoryRef = useRef<FeedbackSignal[]>(feedbackHistory);
  feedbackHistoryRef.current = feedbackHistory;

  const getCalibratedVector = useCallback((): PersonaVector | null => {
    const base = vectorRef.current;
    const history = feedbackHistoryRef.current;
    if (!base || history.length === 0) return null;
    // 兜底推荐向量 · 取最近一条携带 recommendedVec 的记录，否则退化为当前向量
    const fallbackRec =
      [...history].reverse().find((f) => f.recommendedVec)?.recommendedVec ?? base;
    try {
      // 含审计元数据的校准 · drift + fused 用于 audit 条目
      const { vector, drift, fused } = calibrateVectorWithAudit(
        base,
        history,
        fallbackRec,
      );

      // 副作用 1 · 持久化到 calibrated 区（覆盖）
      persistCalibratedSnapshot(vector);

      // 副作用 2 · 追加 audit 条目（仅当向量与上次快照不同 · 去重）
      const last = lastCalibratedRef.current;
      if (!last || !vectorsEqual(last, vector)) {
        const entry: CalibrateAuditEntry = {
          ts: Date.now(),
          feedbackCount: history.length,
          drift,
          fused,
          vector,
        };
        setAuditLog((prev) => appendAuditEntry(prev, entry));
        lastCalibratedRef.current = vector;
        trackFeedback('calibrate.persist', {
          zone: 'audit',
          drift,
          fused,
          feedbackCount: history.length,
        });
      }

      return vector;
    } catch (err) {
      trackFeedback('calibrate.error', {
        msg: err instanceof Error ? err.message : String(err),
      });
      return base;
    }
  }, []);

  return (
    <AppStoreContext.Provider
      value={{
        isLoggedIn: authState.isLoggedIn,
        username: authState.username,
        login,
        logout,
        profile,
        vector,
        activeMood: moodState.mood,
        moodIntensity: moodState.intensity,
        audioEnabled,
        musicVolume: moodState.musicVolume,
        manualTimeSlot,
        saveProfile,
        clearProfile,
        saveVector,
        clearVector,
        setActiveMood,
        setMoodIntensity,
        setAudioEnabled,
        setMusicVolume,
        setManualTimeSlot,
        feedbackHistory,
        auditLog,
        addFeedback,
        getCalibratedVector,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

/** 取用全局画像与情绪态 · 必须在 Provider 内调用 */
export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) {
    throw new Error('useAppStore 必须在 AppStoreProvider 内使用');
  }
  return ctx;
}
