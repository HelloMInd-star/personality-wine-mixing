/**
 * 角色人格矩阵 · 3 角色 × 10 位代表人物
 *
 * 派生链：
 *   MBTI 字母基线 × 角色倾向调整 → 归一化 [-1, 1] → 个人向量
 *
 * 作为 CocktailPage 的「角色身份」入口数据源：
 *   用户选择角色 → 系统按向量匹配该组内最接近的人物 → 输出人格标签 + 角色标签 + 酒体
 */

import type { PersonaVector, PersonaDim } from '../types/personaFusion';
import type { FlavorKey } from '../types/cocktail';
import type {
  RoleMeta,
  RolePersona,
  RoleType,
  RoleFlavorAdjustment,
} from '../types/role';

const DIMS: PersonaDim[] = ['TOL', 'SPD', 'INF', 'ENT', 'LEAD', 'VIS'];

// ═════════════════════════════════════════════════════════
// 角色元数据 · 三角色的产品定位
// ═════════════════════════════════════════════════════════

export const ROLES: RoleMeta[] = [
  {
    type: 'entrepreneur',
    label: '创业家',
    en: 'Entrepreneur',
    symbol: '◈',
    color: '#e08a3c',
    description: '愿景驱动、执行力强、高冒险。把未饮过的味道，酿成今夜的事业。',
    vectorTendency: { TOL: 0.6, LEAD: 0.6, VIS: 0.4 },
    cocktailStyle: '创新 · 突破 · 大胆',
    cocktailKeywords: ['烟熏', '烈调', '反差', '层次冲撞'],
  },
  {
    type: 'investor',
    label: '投资人',
    en: 'Investor',
    symbol: '◇',
    color: '#7c9cbf',
    description: '风险判断、长期视野、决策果断。一杯沉稳而结构感深厚的酒。',
    vectorTendency: { TOL: 0.4, SPD: 0.5, INF: 0.6 },
    cocktailStyle: '沉稳 · 结构感 · 深厚',
    cocktailKeywords: ['陈年', '醇厚', '木质', '低糖'],
  },
  {
    type: 'architect',
    label: '架构师',
    en: 'Architect',
    symbol: '◊',
    color: '#9b7bd4',
    description: '系统思维、逻辑性、结构感。模块分明，层次清晰的酒体。',
    vectorTendency: { INF: 0.6, VIS: 0.1, ENT: -0.2 },
    cocktailStyle: '模块分明 · 层次清晰',
    cocktailKeywords: ['纯净', '结构', '矿物', '低饱和'],
  },
];

export const ROLE_MAP: Record<RoleType, RoleMeta> = ROLES.reduce(
  (acc, r) => {
    acc[r.type] = r;
    return acc;
  },
  {} as Record<RoleType, RoleMeta>,
);

// ═════════════════════════════════════════════════════════
// MBTI → 六维向量 派生
// ═════════════════════════════════════════════════════════

/** MBTI 四字母基线贡献 · 累加后叠加角色倾向再归一化 */
const MBTI_LETTER_WEIGHT: Record<string, Partial<PersonaVector>> = {
  // E/I · 外向 vs 内向
  E: { ENT: 0.4, LEAD: 0.2 },
  I: { ENT: -0.2, INF: 0.1 },
  // S/N · 实感 vs 直觉
  S: { VIS: -0.3, TOL: -0.1 },
  N: { VIS: 0.4, SPD: -0.1 },
  // T/F · 思考 vs 情感
  T: { INF: 0.2, ENT: -0.1 },
  F: { ENT: 0.2, VIS: 0.1 },
  // J/P · 判断 vs 感知
  J: { SPD: 0.2, TOL: -0.15 },
  P: { SPD: -0.2, TOL: 0.3 },
};

/** 角色倾向调整 · 叠加到 MBTI 基线上 */
const ROLE_TENDENCY: Record<RoleType, Partial<PersonaVector>> = {
  entrepreneur: { TOL: 0.25, LEAD: 0.25, VIS: 0.1 },
  investor: { TOL: 0.1, SPD: 0.2, INF: 0.25 },
  architect: { INF: 0.3, VIS: -0.1, ENT: -0.15 },
};

/** 归一化到 [-1, 1] · 全零原样返回 */
function normalize(vec: PersonaVector): PersonaVector {
  const maxAbs = Math.max(...DIMS.map((d) => Math.abs(vec[d])));
  if (maxAbs === 0) return { ...vec };
  const out = {} as PersonaVector;
  for (const d of DIMS) {
    out[d] = Math.round((vec[d] / maxAbs) * 1000) / 1000;
  }
  return out;
}

/**
 * 由 MBTI + 角色类型派生六维向量
 * 1. MBTI 四字母基线累加
 * 2. 叠加角色倾向调整
 * 3. 归一化到 [-1, 1]
 */
export function mbtiToVector(mbti: string, role: RoleType): PersonaVector {
  const acc: PersonaVector = { TOL: 0, SPD: 0, INF: 0, ENT: 0, LEAD: 0, VIS: 0 };
  const letters = mbti.toUpperCase().split('');
  for (const letter of letters) {
    const w = MBTI_LETTER_WEIGHT[letter];
    if (!w) continue;
    for (const [dim, v] of Object.entries(w)) {
      acc[dim as PersonaDim] += v ?? 0;
    }
  }
  const tendency = ROLE_TENDENCY[role];
  for (const [dim, v] of Object.entries(tendency)) {
    acc[dim as PersonaDim] += v ?? 0;
  }
  return normalize(acc);
}

// ═════════════════════════════════════════════════════════
// 角色人格矩阵 · 30 位代表人物
// ═════════════════════════════════════════════════════════

interface PersonaSeed {
  name: string;
  coreTags: string[];
  traits: string[];
  mbti: string;
  cocktailStyle: string;
}

/** 创业家人格 · 10 位 */
const ENTREPRENEUR_SEEDS: PersonaSeed[] = [
  {
    name: '埃隆·马斯克',
    coreTags: ['第一性原理', '极端愿景'],
    traits: ['高风险', '高愿景', '高执行力'],
    mbti: 'ENTJ',
    cocktailStyle: '烟熏烈调 · 火星尾韵',
  },
  {
    name: '史蒂夫·乔布斯',
    coreTags: ['现实扭曲力场', '极致产品'],
    traits: ['高直觉', '高审美', '高信念'],
    mbti: 'ENTP',
    cocktailStyle: '极简纯饮 · 一滴苦精',
  },
  {
    name: '杰夫·贝佐斯',
    coreTags: ['长期主义', '客户至上'],
    traits: ['高信息依赖', '高情绪稳定'],
    mbti: 'INTJ',
    cocktailStyle: '陈年波本 · 缓慢回甘',
  },
  {
    name: '黄仁勋',
    coreTags: ['技术护城河', '极致执行'],
    traits: ['高决策速度', '高结构思维'],
    mbti: 'ENTJ',
    cocktailStyle: '皮衣黑朗姆 · 烈度结构',
  },
  {
    name: '张一鸣',
    coreTags: ['算法思维', '理性决策'],
    traits: ['高信息依赖', '高逻辑性'],
    mbti: 'INTJ',
    cocktailStyle: '冷萃金酒 · 数据清冽',
  },
  {
    name: '雷军',
    coreTags: ['性价比', '极致共情'],
    traits: ['高社交性', '高效率导向'],
    mbti: 'ENFJ',
    cocktailStyle: '小米香威士忌 · 温润亲民',
  },
  {
    name: '王兴',
    coreTags: ['无限游戏', '多曲线探索'],
    traits: ['高风险', '高直觉', '高韧性'],
    mbti: 'ENTP',
    cocktailStyle: '多曲线分层 · 苦甜交织',
  },
  {
    name: '萨提亚·纳德拉',
    coreTags: ['同理心领导', '成长型思维'],
    traits: ['高情绪稳定', '高社交性'],
    mbti: 'INFJ',
    cocktailStyle: '云层奶洗 · 温和包容',
  },
  {
    name: '布莱恩·切斯基',
    coreTags: ['设计思维', '平台生态'],
    traits: ['高直觉', '高社交性'],
    mbti: 'ENFJ',
    cocktailStyle: '归属感热饮 · 设计甜香',
  },
  {
    name: '谢丽尔·桑德伯格',
    coreTags: ['组织建设', '规模化运营'],
    traits: ['高社交性', '高执行力'],
    mbti: 'ESFJ',
    cocktailStyle: '规模化管理 · 标准经典',
  },
];

/** 投资人人格 · 10 位 */
const INVESTOR_SEEDS: PersonaSeed[] = [
  {
    name: '沃伦·巴菲特',
    coreTags: ['价值投资', '长期复利'],
    traits: ['高信息依赖', '高情绪稳定'],
    mbti: 'ISTJ',
    cocktailStyle: '樱桃可乐威士忌 · 长期简单',
  },
  {
    name: '查理·芒格',
    coreTags: ['跨学科思维', '逆向思维'],
    traits: ['高信息依赖', '高逻辑性'],
    mbti: 'INTP',
    cocktailStyle: '多元学科 · 多层苦艾',
  },
  {
    name: '乔治·索罗斯',
    coreTags: ['反身性', '宏观对冲'],
    traits: ['高风险', '高直觉', '高灵活性'],
    mbti: 'ENTP',
    cocktailStyle: '反身性酸酒 · 锋利转折',
  },
  {
    name: '雷·达里奥',
    coreTags: ['原则驱动', '系统化配置'],
    traits: ['高系统思维', '高情绪稳定'],
    mbti: 'INTJ',
    cocktailStyle: '原则桥水 · 透明结构',
  },
  {
    name: '彼得·林奇',
    coreTags: ['自下而上', '灵活调整'],
    traits: ['高直觉', '高社交性'],
    mbti: 'ENFP',
    cocktailStyle: '市井调研 · 灵活鸡尾',
  },
  {
    name: '詹姆斯·西蒙斯',
    coreTags: ['量化交易', '去情绪化'],
    traits: ['高逻辑性', '高决策速度'],
    mbti: 'INTP',
    cocktailStyle: '量化冷萃 · 去糖去冰',
  },
  {
    name: '约翰·博格尔',
    coreTags: ['指数投资', '被动主义'],
    traits: ['高信息依赖', '低决策频率'],
    mbti: 'INFJ',
    cocktailStyle: '指数均衡 · 长期低耗',
  },
  {
    name: '卡尔·伊坎',
    coreTags: ['激进投资', '快速调仓'],
    traits: ['高风险', '高决策速度'],
    mbti: 'ENTJ',
    cocktailStyle: '激进烈酒 · 短促火辣',
  },
  {
    name: '本杰明·格雷厄姆',
    coreTags: ['价值发现', '安全边际'],
    traits: ['高信息依赖', '低风险'],
    mbti: 'ISTJ',
    cocktailStyle: '安全边际 · 守拙纯饮',
  },
  {
    name: '约翰·邓普顿',
    coreTags: ['全球配置', '逆向投资'],
    traits: ['高情绪稳定', '高直觉'],
    mbti: 'INFJ',
    cocktailStyle: '全球低吸 · 多国风味',
  },
];

/** 架构师人格 · 10 位 */
const ARCHITECT_SEEDS: PersonaSeed[] = [
  {
    name: '林纳斯·托瓦兹',
    coreTags: ['Linux之父', '开源哲学'],
    traits: ['高系统思维', '高独立性'],
    mbti: 'INTJ',
    cocktailStyle: '内核纯净 · 命令行黑朗姆',
  },
  {
    name: '比尔·盖茨',
    coreTags: ['技术远见', '系统化思维'],
    traits: ['高信息依赖', '高逻辑性'],
    mbti: 'ENTJ',
    cocktailStyle: '系统平台 · 标准化调配',
  },
  {
    name: '保罗·格雷厄姆',
    coreTags: ['Y Combinator', '黑客精神'],
    traits: ['高直觉', '高执行力'],
    mbti: 'ENTP',
    cocktailStyle: '黑客编程 · Lisp 简洁',
  },
  {
    name: '马丁·福勒',
    coreTags: ['企业架构', '敏捷方法'],
    traits: ['高信息依赖', '高结构化'],
    mbti: 'INTP',
    cocktailStyle: '重构分层 · 模式清晰',
  },
  {
    name: '克里斯·拉特纳',
    coreTags: ['Swift/LLVM', '编译器架构'],
    traits: ['高逻辑性', '高精确度'],
    mbti: 'INTJ',
    cocktailStyle: '编译器纯化 · 类型严格',
  },
  {
    name: '杰夫·迪恩',
    coreTags: ['Google', '大规模系统'],
    traits: ['高系统思维', '高技术深度'],
    mbti: 'INTP',
    cocktailStyle: 'MapReduce · 分布层叠',
  },
  {
    name: '蒂姆·伯纳斯-李',
    coreTags: ['万维网之父', '去中心化'],
    traits: ['高愿景', '高开放性'],
    mbti: 'INFP',
    cocktailStyle: '万维网开放 · 无中心链接',
  },
  {
    name: '温顿·瑟夫',
    coreTags: ['TCP/IP之父', '网络架构'],
    traits: ['高系统思维', '高逻辑性'],
    mbti: 'INTJ',
    cocktailStyle: '协议分层 · 包交换清冽',
  },
  {
    name: '罗伯特·马丁',
    coreTags: ['代码整洁之道', '敏捷原则'],
    traits: ['高逻辑性', '高结构化'],
    mbti: 'ISTJ',
    cocktailStyle: '整洁代码 · SOLID 五层',
  },
  {
    name: '詹姆斯·戈斯林',
    coreTags: ['Java之父', '跨平台架构'],
    traits: ['高系统思维', '高愿景'],
    mbti: 'INTJ',
    cocktailStyle: 'JVM 跨平台 · 一次调配',
  },
];

/** 由种子构造完整 RolePersona · 自动派生 vector */
function buildPersona(seed: PersonaSeed, role: RoleType, index: number): RolePersona {
  return {
    index,
    role,
    name: seed.name,
    coreTags: seed.coreTags,
    traits: seed.traits,
    mbti: seed.mbti,
    vector: mbtiToVector(seed.mbti, role),
    cocktailStyle: seed.cocktailStyle,
  };
}

/** 完整角色人格矩阵 · 30 位 */
export const ROLE_PERSONAS: RolePersona[] = [
  ...ENTREPRENEUR_SEEDS.map((s, i) => buildPersona(s, 'entrepreneur', i + 1)),
  ...INVESTOR_SEEDS.map((s, i) => buildPersona(s, 'investor', i + 1)),
  ...ARCHITECT_SEEDS.map((s, i) => buildPersona(s, 'architect', i + 1)),
];

/** 按角色筛选人物列表 */
export function getPersonasByRole(role: RoleType): RolePersona[] {
  return ROLE_PERSONAS.filter((p) => p.role === role);
}

// ═════════════════════════════════════════════════════════
// 角色层调酒调整系数 · 在基础 MBTI 酒体之上叠加
// ═════════════════════════════════════════════════════════
//
// 设计原则：
//   - 基础层（MBTI → 酒体）不变
//   - 角色层只做"叠加调整"
//   - 同一个 INTJ：
//       创业家 → 辛辣火焰威士忌
//       投资人 → 木质干冰陈年
//       架构师 → 分层结构木质
//
// 派生链：
//   基础向量 + vectorAdj → 调整后向量 → flavorFromVector → 风味偏好
//   风味偏好 + flavorShift → 最终偏好 → recommendCocktails

export const ROLE_FLAVOR_ADJUSTMENT: Record<RoleType, RoleFlavorAdjustment> = {
  // 创业家 · 高风险高愿景 · 辛辣火焰
  entrepreneur: {
    role: 'entrepreneur',
    vectorAdj: { TOL: 0.15, SPD: 0.1, LEAD: 0.05 },
    // 辛辣方向 → 提烈降甜，增加冲击感
    flavorShift: { strong: 0.2, sour: 0.1, sweet: -0.1, creamy: -0.1 },
    flavorShiftLabel: '辛辣',
    effect: 'fire',
    effectLabel: '火焰效果',
    temperature: 'hot',
    temperatureLabel: '高温燃烧',
    servingNote: '加烈酒 + 火焰效果',
  },

  // 投资人 · 高稳健高信息 · 木质干冰
  investor: {
    role: 'investor',
    vectorAdj: { TOL: -0.05, INF: 0.1, SPD: 0.05 },
    // 木质方向 → 提烟熏草本降果香，深邃沉稳
    flavorShift: { smoky: 0.2, herbal: 0.1, fruity: -0.1, sweet: -0.05 },
    flavorShiftLabel: '木质',
    effect: 'mist',
    effectLabel: '干冰雾气',
    temperature: 'cold',
    temperatureLabel: '低温慢饮',
    servingNote: '加陈年橡木 + 加冰',
  },

  // 架构师（设计师）· 高结构高愿景 · 分层结构
  architect: {
    role: 'architect',
    vectorAdj: { VIS: 0.15, INF: 0.1, ENT: -0.05 },
    // 结构方向 → 提草本柔润降烈度，层次分明
    flavorShift: { herbal: 0.2, creamy: 0.1, strong: -0.1, smoky: 0.05 },
    flavorShiftLabel: '花香结构',
    effect: 'layered',
    effectLabel: '分层结构',
    temperature: 'normal',
    temperatureLabel: '常温结构',
    servingNote: '分层结构 + 模块化杯型',
  },
};

/** 取角色风味调整系数 */
export function getRoleFlavorAdjustment(role: RoleType): RoleFlavorAdjustment {
  return ROLE_FLAVOR_ADJUSTMENT[role];
}

/** 风味键中文标签 · 供 UI 展示 flavorShift */
export const FLAVOR_KEY_LABEL: Record<FlavorKey, string> = {
  sweet: '甜',
  sour: '酸',
  bitter: '苦',
  strong: '烈',
  smoky: '烟熏',
  fruity: '果香',
  herbal: '草本',
  creamy: '柔润',
};
