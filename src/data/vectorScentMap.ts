/**
 * 六维向量气味空间映射表 · 派生签名气味的单一真相源
 *
 * 设计理念：
 *   每个人格维度在正负倾向上各对应一种气味 note
 *   12 个气味位（6 维 × 正负）独立不重复，覆盖自然香料谱
 *   派生层（scentFromVector）通过加权叠加取 Top-2 作为 primary + signature
 *
 * 与现有 SIGNATURE_SCENTS 对齐：
 *   现有表以原型 code 为 key（如 'The Dreamweaver'），10 个原型 10 种气味
 *   本表以维度倾向为 key，12 个气味位，更细粒度
 *   兼容层会从 vec 派生的 signatureNote 与现有 SIGNATURE_SCENTS 并存
 *
 * 气味叙事呼应维度语义：
 *   TOL(容错)  · 雪/枫 · 冒险者坚定雪松、审慎者沉淀枫香
 *   SPD(速度)  · 薄/烟 · 决断者清爽薄荷、沉思者深邃烟草
 *   INF(信息)  · 迷/苔 · 谋略者清醒迷迭香、直觉者潮湿苔藓
 *   ENT(热情)  · 柑/鸢 · 炽烈者明亮柑橘、沉静者内敛鸢尾
 *   LEAD(主导) · 檀/杜 · 引领者厚重檀香、追随者清新杜松
 *   VIS(直觉)  · 紫/麝 · 灵感者梦幻紫罗兰、实证者厚重麝香
 */

import type { PersonaDim } from '../types/personaFusion';

/** 气味描述 · note 用于序列化，label/symbol 供 UI */
export interface VectorScentNote {
  /** 英文标识 · 用于 key 与序列化 · 与现有 ScentProfile.note 同 namespace */
  note: string;
  /** 中文名 · 供 UI 展示 */
  label: string;
  /** 单字符号 · 镜月隐喻 · 供中心标识渲染 */
  symbol: string;
  /** 诗化描述 · 气味意境 */
  poem: string;
}

/** 单个维度的正负气味对 */
export interface DimensionScentPair {
  dim: PersonaDim;
  /** 正倾向气味 · vec[d] = +1 时纯味 */
  positive: VectorScentNote;
  /** 负倾向气味 · vec[d] = -1 时纯味 */
  negative: VectorScentNote;
}

/**
 * 六维气味空间 · 12 个气味位
 */
export const VECTOR_SCENT_SPACE: Record<PersonaDim, DimensionScentPair> = {
  TOL: {
    dim: 'TOL',
    positive: {
      note: 'cedar', label: '雪松', symbol: '险',
      poem: '雪松挺立，冒险者的脊骨。',
    },
    negative: {
      note: 'maple', label: '枫香', symbol: '审',
      poem: '枫香沉酿，审慎者的余韵。',
    },
  },
  SPD: {
    dim: 'SPD',
    positive: {
      note: 'mint', label: '薄荷', symbol: '决',
      poem: '薄荷破空，决断者的清风。',
    },
    negative: {
      note: 'tobacco', label: '烟草', symbol: '沉',
      poem: '烟草深燃，沉思者的夜色。',
    },
  },
  INF: {
    dim: 'INF',
    positive: {
      note: 'rosemary', label: '迷迭香', symbol: '谋',
      poem: '迷迭香醒，谋略者的清明。',
    },
    negative: {
      note: 'moss', label: '苔藓', symbol: '直',
      poem: '苔藓湿润，直觉者的暗潮。',
    },
  },
  ENT: {
    dim: 'ENT',
    positive: {
      note: 'citrus', label: '柑橘', symbol: '焰',
      poem: '柑橘爆皮，炽烈者的明火。',
    },
    negative: {
      note: 'iris', label: '鸢尾', symbol: '静',
      poem: '鸢尾垂首，沉静者的内室。',
    },
  },
  LEAD: {
    dim: 'LEAD',
    positive: {
      note: 'sandalwood', label: '檀香', symbol: '引',
      poem: '檀香厚载，引领者的台阶。',
    },
    negative: {
      note: 'juniper', label: '杜松', symbol: '随',
      poem: '杜松清风，追随者的步伐。',
    },
  },
  VIS: {
    dim: 'VIS',
    positive: {
      note: 'violet', label: '紫罗兰', symbol: '灵',
      poem: '紫罗兰开，灵感者的夜窗。',
    },
    negative: {
      note: 'musk', label: '麝香', symbol: '实',
      poem: '麝香厚藏，实证者的底稿。',
    },
  },
};

/** 全零向量时的默认签名气味 · 琥珀（与现有 DEFAULT_SIGNATURE_SCENT 一致） */
export const DEFAULT_VECTOR_SCENT: VectorScentNote = {
  note: 'amber', label: '琥珀', symbol: '暮',
  poem: '琥珀归寂，余韵绕杯。',
};

/**
 * 由维度倾向取出对应的气味 note
 * vec[d] >= 0 取 positive，< 0 取 negative
 */
export function getScentByDimensionValue(dim: PersonaDim, value: number): VectorScentNote {
  const pair = VECTOR_SCENT_SPACE[dim];
  return value >= 0 ? pair.positive : pair.negative;
}
