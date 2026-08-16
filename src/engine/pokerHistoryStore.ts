/**
 * PokerHistoryStore · 对局历史持久化
 *
 * 从 PokerPage（扑克模拟）和 BalancePage（衡）之间共享对局数据。
 * 使用 localStorage 持久化，支持跨页面读取。
 *
 * 数据流：
 *   PokerPage ──saveGameResult──→ localStorage
 *   BalancePage ──getGameHistory──→ 展示真实对局记录
 */

import type { GameHistoryEntry } from '../types/balance';
import logger from './logger';

// ═════════════════════════════════════════════════════════
// 常量
// ═════════════════════════════════════════════════════════

const STORAGE_KEY = 'ymine_poker_history';
const MAX_HISTORY = 50; // 最多保留 50 条记录

// ═════════════════════════════════════════════════════════
// 存储操作
// ═════════════════════════════════════════════════════════

/** 读取全部历史 */
export function getGameHistory(): GameHistoryEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as GameHistoryEntry[];
  } catch (e) {
    logger.error('PokerHistoryStore', '读取历史失败', (e as Error).message);
    return [];
  }
}

/** 保存一条对局记录 */
export function saveGameResult(entry: Omit<GameHistoryEntry, 'id' | 'timestamp'>): void {
  try {
    const history = getGameHistory();
    const newEntry: GameHistoryEntry = {
      ...entry,
      id: `game-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: Date.now(),
    };

    history.unshift(newEntry);

    // 超出上限则删除最旧记录
    if (history.length > MAX_HISTORY) {
      history.length = MAX_HISTORY;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    logger.store('PokerHistoryStore', '对局已保存', {
      id: newEntry.id,
      winner: newEntry.winner,
      total: history.length,
    });
  } catch (e) {
    logger.error('PokerHistoryStore', '保存失败', (e as Error).message);
  }
}

/** 清空全部历史 */
export function clearGameHistory(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    logger.store('PokerHistoryStore', '历史已清空');
  } catch (e) {
    logger.error('PokerHistoryStore', '清空失败', (e as Error).message);
  }
}

/** 获取历史记录数 */
export function getGameHistoryCount(): number {
  return getGameHistory().length;
}

/** 获取最近 N 条记录 */
export function getRecentGames(n: number = 10): GameHistoryEntry[] {
  return getGameHistory().slice(0, n);
}