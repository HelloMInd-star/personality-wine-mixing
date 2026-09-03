/**
 * 单人酒局沙盘 · 类型系统
 *
 * 场景选择 → 五轮推理 → MBTI 概率分布 → 桥接 觉醉 六维向量
 * 独立采集入口，与 MbtiPartyPage（多人酒局）互为补充
 */

// ═════════════════════════════════════════════════════════
// 场景
// ═════════════════════════════════════════════════════════

/** 沙盘场景 */
export interface SandboxScenario {
  id: string;
  title: string;
  desc: string;
  atmosphere: 'formal' | 'casual' | 'professional' | 'intimate' | 'festive';
  background: string;
}

// ═════════════════════════════════════════════════════════
// 角色
// ═════════════════════════════════════════════════════════

/** 酒局中的 MBTI 角色 */
export interface SandboxCharacter {
  mbti: string;
  name: string;
  role: string;
  desc: string;
  color: string;
}

// ═════════════════════════════════════════════════════════
// 轮次
// ═════════════════════════════════════════════════════════

/** MBTI 四维度 */
export type MbtiDim = 'E/I' | 'S/N' | 'T/F' | 'J/P';

/** 轮次配置 */
export interface RoundConfig {
  round: number;
  title: string;
  desc: string;
  dimension: string;
  dimensionLabel: string;
  question: string;
}

/** 单个选项 */
export interface RoundOption {
  key: string;
  text: string;
  /** 对 MBTI 八维分数的影响 */
  traits: Partial<Record<string, number>>;
}

/** 轮次 + 选项 */
export interface RoundWithOptions {
  round: RoundConfig;
  options: RoundOption[];
}

/** 用户单轮选择 */
export interface RoundChoice {
  round: number;
  optionKey: string;
}

// ═════════════════════════════════════════════════════════
// 人格图谱
// ═════════════════════════════════════════════════════════

/** 八维分数 */
export type TraitScores = Record<string, number>;

/** 单维度百分比 */
export interface DimensionPercent {
  percentA: number;
  percentB: number;
  /** 'A' = 第一个倾向主导，'B' = 第二个倾向主导 */
  dominant: 'A' | 'B';
}

/** 四维度百分比 */
export type DimensionMap = Record<MbtiDim, DimensionPercent>;

/** MBTI 概率分布项 */
export interface MbtiProbability {
  type: string;
  probability: number;
}

/** 每轮选择描述 */
export interface ChoiceDescription {
  round: number;
  title?: string;
  text: string;
}

/** 沙盘完整结果 */
export interface SandboxResult {
  /** 四维度百分比 */
  dimensions: DimensionMap;
  /** 八维原始分数 */
  scores: TraitScores;
  /** 推导的 MBTI 类型 */
  mbtiType: string;
  /** 16 型概率分布（降序） */
  probabilities: MbtiProbability[];
  /** 每轮选择描述 */
  choiceDescriptions: ChoiceDescription[];
  /** 计算时间戳 */
  calculatedAt: number;
}

// ═════════════════════════════════════════════════════════
// 调酒师评语
// ═════════════════════════════════════════════════════════

/** 调酒师评语 */
export interface SandboxJudgeComment {
  key: string;
  name: string;
  icon: string;
  color: string;
  personality: string;
  comment: string;
}

// ═════════════════════════════════════════════════════════
// 沙盘状态
// ═════════════════════════════════════════════════════════

/** 沙盘阶段 */
export type SandboxPhase = 'selecting-scene' | 'in-rounds' | 'result';

/** 沙盘 UI 状态 */
export interface SandboxState {
  phase: SandboxPhase;
  scenario: SandboxScenario | null;
  characters: SandboxCharacter[];
  currentRound: number;
  choices: RoundChoice[];
  result: SandboxResult | null;
}