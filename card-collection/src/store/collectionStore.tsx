/**
 * 采集状态管理 · Context + localStorage 持久化
 * 存储四模块结果 + 融合结果，支持渐进式采集
 */
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type {
  TarotResult,
  ZodiacResult,
  PokerResult,
  TexasResult,
  PersonaFusion,
} from '../types';
import { fusePersona } from '../engine/fusion';

const STORAGE_KEY = 'y-mine-card-collection';

interface CollectionState {
  tarot: TarotResult | null;
  zodiac: ZodiacResult | null;
  poker: PokerResult | null;
  texas: TexasResult | null;
  fusion: PersonaFusion | null;
}

interface CollectionContextValue extends CollectionState {
  setTarot: (r: TarotResult) => void;
  setZodiac: (r: ZodiacResult) => void;
  setPoker: (r: PokerResult) => void;
  setTexas: (r: TexasResult) => void;
  /** 触发融合 · 仅融合已存在的模块 */
  runFusion: () => PersonaFusion;
  /** 清空全部 */
  reset: () => void;
  /** 已完成模块数 */
  completedCount: number;
}

const DEFAULT_STATE: CollectionState = {
  tarot: null,
  zodiac: null,
  poker: null,
  texas: null,
  fusion: null,
};

const CollectionContext = createContext<CollectionContextValue | null>(null);

function loadState(): CollectionState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    return { ...DEFAULT_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STATE;
  }
}

function saveState(state: CollectionState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 容量满或隐私模式 · 静默降级
  }
}

export function CollectionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CollectionState>(loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const setTarot = useCallback((r: TarotResult) => {
    setState((s) => ({ ...s, tarot: r }));
  }, []);
  const setZodiac = useCallback((r: ZodiacResult) => {
    setState((s) => ({ ...s, zodiac: r }));
  }, []);
  const setPoker = useCallback((r: PokerResult) => {
    setState((s) => ({ ...s, poker: r }));
  }, []);
  const setTexas = useCallback((r: TexasResult) => {
    setState((s) => ({ ...s, texas: r }));
  }, []);

  const runFusion = useCallback(() => {
    const fusion = fusePersona({
      tarot: state.tarot ? { result: state.tarot } : undefined,
      zodiac: state.zodiac ? { result: state.zodiac } : undefined,
      poker: state.poker ? { result: state.poker } : undefined,
      texas: state.texas ? { result: state.texas } : undefined,
    });
    setState((s) => ({ ...s, fusion }));
    return fusion;
  }, [state.tarot, state.zodiac, state.poker, state.texas]);

  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const completedCount =
    Number(!!state.tarot) + Number(!!state.zodiac) + Number(!!state.poker) + Number(!!state.texas);

  return (
    <CollectionContext.Provider
      value={{
        ...state,
        setTarot,
        setZodiac,
        setPoker,
        setTexas,
        runFusion,
        reset,
        completedCount,
      }}
    >
      {children}
    </CollectionContext.Provider>
  );
}

export function useCollection() {
  const ctx = useContext(CollectionContext);
  if (!ctx) throw new Error('useCollection must be used within CollectionProvider');
  return ctx;
}
