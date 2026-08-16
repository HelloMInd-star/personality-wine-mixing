/**
 * InvestorTwin · 金融孪生数据库
 *
 * Sheet1: 16位世界级投资人档案
 * Sheet2: 16型 MBTI 投资风格映射
 * Sheet3: 5种棋子类型定义
 *
 * 数据链路：用户棋风 → MBTI → 投资风格 → 匹配投资人孪生
 */

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 棋子类型 */
export type ChessPiece = 'Rook' | 'Bishop' | 'Knight' | 'Queen' | 'King';

/** 决策风格 */
export type DecisionStyle = '分析型' | '直觉型';

/** 投资人档案 */
export interface InvestorProfile {
  /** 姓名 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 推断 MBTI */
  mbti: string;
  /** 风险偏好 0-100 */
  risk: number;
  /** 时间偏好 0-100 · 越高越偏长期 */
  timeValue: number;
  /** 决策风格 */
  decisionStyle: DecisionStyle;
  /** 棋子类型 */
  chessPiece: ChessPiece;
  /** 核心标签 */
  tags: string[];
  /** 名言 */
  quote: string;
  /** 流派 */
  school: string;
  /** 地域 */
  region: '国际' | '中国';
  /** 三维坐标 · X=战略度 Y=风险 Z=攻击性 */
  coordinate: {
    x: number;
    y: number;
    z: number;
  };
}

/** MBTI 投资风格 */
export interface MbtiInvestmentStyle {
  mbti: string;
  /** 人格类型名称 */
  typeName: string;
  /** 风险偏好 0-100 */
  risk: number;
  /** 时间偏好 0-100 */
  timeValue: number;
  /** 决策风格 */
  decisionStyle: DecisionStyle;
  /** 棋子 */
  chessPiece: ChessPiece;
  /** 投资特征 */
  features: string;
  /** 适合策略 */
  strategy: string;
}

/** 棋子类型说明 */
export interface ChessPieceInfo {
  piece: ChessPiece;
  /** 中文名 */
  name: string;
  /** 英文名 */
  nameEn: string;
  /** 战略风格 */
  style: string;
  /** 核心特征 */
  features: string;
  /** 代表人物 */
  representatives: string[];
  /** 三维坐标判定边界 */
  boundary: {
    yMin?: number; yMax?: number;
    xMin?: number; xMax?: number;
    zMin?: number; zMax?: number;
  };
}

// ═════════════════════════════════════════════════════════
// Sheet3: 棋子类型定义
// ═════════════════════════════════════════════════════════

export const CHESS_PIECES: ChessPieceInfo[] = [
  {
    piece: 'Rook',
    name: '车',
    nameEn: 'Rook',
    style: '直线型战略家',
    features: '构筑防线，稳扎稳打，耐心纪律',
    representatives: ['巴菲特', '格雷厄姆', 'Bezos', '任正非'],
    boundary: { yMax: 0.40, xMax: 0.45, zMax: 0.40 },
  },
  {
    piece: 'Bishop',
    name: '象',
    nameEn: 'Bishop',
    style: '斜线型思考者',
    features: '非常规角度切入，发现盲区',
    representatives: ['芒格', '保尔森', 'Howard Marks'],
    boundary: { yMin: 0.30, yMax: 0.50, xMin: 0.30, xMax: 0.60, zMin: 0.40, zMax: 0.60 },
  },
  {
    piece: 'Knight',
    name: '马',
    nameEn: 'Knight',
    style: '跳跃型突破者',
    features: '行动非线性，意外位置突破',
    representatives: ['林奇', '伊坎', 'Cathie Wood'],
    boundary: { yMin: 0.65, xMax: 0.72, zMin: 0.70 },
  },
  {
    piece: 'Queen',
    name: '后',
    nameEn: 'Queen',
    style: '全域型进攻者',
    features: '攻守兼备，大范围布局',
    representatives: ['索罗斯', '孙正义', 'Elon Musk'],
    boundary: { yMin: 0.65, xMin: 0.72, zMin: 0.70 },
  },
  {
    piece: 'King',
    name: '王',
    nameEn: 'King',
    style: '系统型核心者',
    features: '原则体系中枢，全局灵魂',
    representatives: ['达利欧', '邓普顿', '马云'],
    boundary: { yMin: 0.30, yMax: 0.72, xMin: 0.72, zMin: 0.30, zMax: 0.60 },
  },
];

// ═════════════════════════════════════════════════════════
// Sheet1: 16位投资人档案
// ═════════════════════════════════════════════════════════

export const INVESTORS: InvestorProfile[] = [
  {
    name: '巴菲特',
    nameEn: 'Warren Buffett',
    mbti: 'INTJ',
    risk: 10,
    timeValue: 95,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    tags: ['价值投资', '长期持有', '安全边际'],
    quote: '别人恐惧我贪婪，别人贪婪我恐惧。',
    school: 'value',
    region: '国际',
    coordinate: { x: 0.95, y: 0.10, z: 0.05 },
  },
  {
    name: '芒格',
    nameEn: 'Charlie Munger',
    mbti: 'INTP',
    risk: 20,
    timeValue: 95,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    tags: ['逆向思维', '多元思维模型', '延迟满足'],
    quote: '反过来想，总是反过来想。',
    school: 'value',
    region: '国际',
    coordinate: { x: 0.95, y: 0.20, z: 0.15 },
  },
  {
    name: '索罗斯',
    nameEn: 'George Soros',
    mbti: 'ENTP',
    risk: 85,
    timeValue: 50,
    decisionStyle: '直觉型',
    chessPiece: 'Queen',
    tags: ['反身性', '宏观对冲', '速战速决'],
    quote: '对错不重要，正确时赚了多少才重要。',
    school: 'hedge',
    region: '国际',
    coordinate: { x: 0.50, y: 0.85, z: 0.82 },
  },
  {
    name: '达利欧',
    nameEn: 'Ray Dalio',
    mbti: 'INTJ',
    risk: 50,
    timeValue: 80,
    decisionStyle: '分析型',
    chessPiece: 'King',
    tags: ['原则驱动', '系统化配置', '痛苦反思'],
    quote: '痛苦 + 反思 = 进步。',
    school: 'hedge',
    region: '国际',
    coordinate: { x: 0.80, y: 0.50, z: 0.45 },
  },
  {
    name: '林奇',
    nameEn: 'Peter Lynch',
    mbti: 'ENFP',
    risk: 65,
    timeValue: 55,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    tags: ['自下而上', '灵活调整', '成长发现'],
    quote: '投资你所知道的。',
    school: 'growth',
    region: '国际',
    coordinate: { x: 0.55, y: 0.65, z: 0.72 },
  },
  {
    name: '孙正义',
    nameEn: 'Masayoshi Son',
    mbti: 'ENTJ',
    risk: 98,
    timeValue: 20,
    decisionStyle: '直觉型',
    chessPiece: 'Queen',
    tags: ['激进押注', '愿景驱动', '重仓未来'],
    quote: '要么做第一，要么做唯一。',
    school: 'vc',
    region: '国际',
    coordinate: { x: 0.20, y: 0.98, z: 0.95 },
  },
  {
    name: '格雷厄姆',
    nameEn: 'Benjamin Graham',
    mbti: 'ISTJ',
    risk: 5,
    timeValue: 85,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    tags: ['价值发现', '安全边际', '市场先生'],
    quote: '市场短期是投票机，长期是称重机。',
    school: 'value',
    region: '国际',
    coordinate: { x: 0.85, y: 0.05, z: 0.03 },
  },
  {
    name: '保尔森',
    nameEn: 'John Paulson',
    mbti: 'ESTJ',
    risk: 90,
    timeValue: 45,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    tags: ['机会驱动', '集中押注', '反向操作'],
    quote: '当机会来临时，下重注。',
    school: 'hedge',
    region: '国际',
    coordinate: { x: 0.45, y: 0.90, z: 0.85 },
  },
  {
    name: '伊坎',
    nameEn: 'Carl Icahn',
    mbti: 'ESTP',
    risk: 88,
    timeValue: 15,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    tags: ['激进主义', '快速调仓', '价值催化'],
    quote: '买低卖高，华尔街的真理。',
    school: 'hedge',
    region: '国际',
    coordinate: { x: 0.15, y: 0.88, z: 0.90 },
  },
  {
    name: '邓普顿',
    nameEn: 'John Templeton',
    mbti: 'INFJ',
    risk: 45,
    timeValue: 98,
    decisionStyle: '分析型',
    chessPiece: 'King',
    tags: ['全球配置', '逆向投资', '长期复利'],
    quote: '最悲观的时刻，是最好的买入时机。',
    school: 'value',
    region: '国际',
    coordinate: { x: 0.98, y: 0.45, z: 0.35 },
  },
  {
    name: 'Elon Musk',
    nameEn: 'Elon Musk',
    mbti: 'ENTJ',
    risk: 99,
    timeValue: 25,
    decisionStyle: '直觉型',
    chessPiece: 'Queen',
    tags: ['颠覆创新', '第一性原理', '极限押注'],
    quote: '当某件事足够重要时，即使胜算不大也该去做。',
    school: 'entrepreneur',
    region: '国际',
    coordinate: { x: 0.25, y: 0.99, z: 0.98 },
  },
  {
    name: 'Jeff Bezos',
    nameEn: 'Jeff Bezos',
    mbti: 'INTJ',
    risk: 35,
    timeValue: 92,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    tags: ['长期主义', '客户至上', '飞轮效应'],
    quote: '如果你决定要做得好，就值得多投入几天思考。',
    school: 'entrepreneur',
    region: '国际',
    coordinate: { x: 0.92, y: 0.35, z: 0.25 },
  },
  {
    name: '马云',
    nameEn: 'Jack Ma',
    mbti: 'ENFJ',
    risk: 75,
    timeValue: 70,
    decisionStyle: '直觉型',
    chessPiece: 'King',
    tags: ['战略远见', '生态布局', '使命驱动'],
    quote: '今天很残酷，明天更残酷，后天很美好。',
    school: 'entrepreneur',
    region: '中国',
    coordinate: { x: 0.70, y: 0.75, z: 0.55 },
  },
  {
    name: '任正非',
    nameEn: 'Ren Zhengfei',
    mbti: 'INTJ',
    risk: 55,
    timeValue: 90,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    tags: ['压强原则', '危机意识', '长期投入'],
    quote: '惶者生存，只有危机感才能驱动持续进步。',
    school: 'entrepreneur',
    region: '中国',
    coordinate: { x: 0.90, y: 0.55, z: 0.35 },
  },
  {
    name: 'Howard Marks',
    nameEn: 'Howard Marks',
    mbti: 'INTP',
    risk: 40,
    timeValue: 75,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    tags: ['周期思维', '第二层思考', '风险控制'],
    quote: '你不可能做着和别人一样的事，却期望获得比别人更好的结果。',
    school: 'value',
    region: '国际',
    coordinate: { x: 0.75, y: 0.40, z: 0.42 },
  },
  {
    name: 'Cathie Wood',
    nameEn: 'Cathie Wood',
    mbti: 'ENTP',
    risk: 95,
    timeValue: 65,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    tags: ['颠覆性创新', '长期主题', '高波动容忍'],
    quote: '创新会带来颠覆，而颠覆会创造巨大的价值。',
    school: 'growth',
    region: '国际',
    coordinate: { x: 0.65, y: 0.95, z: 0.88 },
  },
];

// ═════════════════════════════════════════════════════════
// Sheet2: 16型 MBTI 投资风格
// ═════════════════════════════════════════════════════════

export const MBTI_INVESTMENT_STYLES: MbtiInvestmentStyle[] = [
  {
    mbti: 'INTJ',
    typeName: '建筑师',
    risk: 20,
    timeValue: 90,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    features: '战略导向，偏好独立研究，追求最优解',
    strategy: '价值投资、长期规划、系统化配置',
  },
  {
    mbti: 'INTP',
    typeName: '思想家',
    risk: 25,
    timeValue: 85,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    features: '理论驱动，好奇心强，善于发现规律',
    strategy: '深度研究、逆向思考、第二层思维',
  },
  {
    mbti: 'ENTJ',
    typeName: '指挥官',
    risk: 85,
    timeValue: 45,
    decisionStyle: '直觉型',
    chessPiece: 'Queen',
    features: '果断自信，目标导向，敢于押注',
    strategy: '主动出击、集中投资、愿景驱动',
  },
  {
    mbti: 'ENTP',
    typeName: '辩论家',
    risk: 75,
    timeValue: 50,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    features: '创新思维，善于发现机会，多角度思考',
    strategy: '颠覆性投资、灵活调仓、趋势捕捉',
  },
  {
    mbti: 'INFJ',
    typeName: '倡导者',
    risk: 30,
    timeValue: 92,
    decisionStyle: '分析型',
    chessPiece: 'King',
    features: '洞察力强，价值驱动，追求意义',
    strategy: '使命投资、长期价值、影响力投资',
  },
  {
    mbti: 'INFP',
    typeName: '调停者',
    risk: 35,
    timeValue: 88,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    features: '理想主义，关注长期价值，忠诚于信念',
    strategy: '价值观投资、长期持有、伦理投资',
  },
  {
    mbti: 'ENFJ',
    typeName: '主人公',
    risk: 60,
    timeValue: 70,
    decisionStyle: '直觉型',
    chessPiece: 'King',
    features: '富有感染力，激励他人，团队协作',
    strategy: '生态投资、社会企业、长期愿景',
  },
  {
    mbti: 'ENFP',
    typeName: '竞赛者',
    risk: 65,
    timeValue: 55,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    features: '热情洋溢，适应力强，善于发现可能',
    strategy: '成长投资、灵活配置、机会捕捉',
  },
  {
    mbti: 'ISTJ',
    typeName: '物流师',
    risk: 10,
    timeValue: 92,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    features: '尽职尽责，注重细节，遵守规则',
    strategy: '价值投资、安全边际、长期持有',
  },
  {
    mbti: 'ISFJ',
    typeName: '守卫者',
    risk: 15,
    timeValue: 85,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    features: '稳定可靠，保守谨慎，注重保护',
    strategy: '防御性投资、蓝筹股、定息收入',
  },
  {
    mbti: 'ESTJ',
    typeName: '执行者',
    risk: 80,
    timeValue: 40,
    decisionStyle: '分析型',
    chessPiece: 'Bishop',
    features: '高效务实，注重结果，执行力强',
    strategy: '机会投资、集中押注、主动管理',
  },
  {
    mbti: 'ESFJ',
    typeName: '供给者',
    risk: 40,
    timeValue: 75,
    decisionStyle: '分析型',
    chessPiece: 'Rook',
    features: '乐于助人，关注他人，社区协作',
    strategy: '稳健配置、分红投资、长期积累',
  },
  {
    mbti: 'ISTP',
    typeName: '鉴赏家',
    risk: 70,
    timeValue: 45,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    features: '灵活务实，注重效率，敢于冒险',
    strategy: '短线交易、机会投资、高风险高回报',
  },
  {
    mbti: 'ISFP',
    typeName: '探险家',
    risk: 55,
    timeValue: 60,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    features: '富有艺术感，追求自由，适应变化',
    strategy: '灵活配置、机会主义、分散投资',
  },
  {
    mbti: 'ESTP',
    typeName: '企业家',
    risk: 88,
    timeValue: 25,
    decisionStyle: '直觉型',
    chessPiece: 'Knight',
    features: '行动导向，善于把握机会，勇于竞争',
    strategy: '激进投资、短线操作、趋势跟踪',
  },
  {
    mbti: 'ESFP',
    typeName: '表演者',
    risk: 72,
    timeValue: 35,
    decisionStyle: '直觉型',
    chessPiece: 'Queen',
    features: '充满活力，享受当下，善于社交',
    strategy: '社交投资、趋势投资、灵活配置',
  },
];

// ═════════════════════════════════════════════════════════
// 工具函数
// ═════════════════════════════════════════════════════════

/** 根据 MBTI 查找投资风格 */
export function getInvestmentStyleByMbti(mbti: string): MbtiInvestmentStyle | undefined {
  return MBTI_INVESTMENT_STYLES.find((s) => s.mbti === mbti);
}

/** 根据棋子类型查找投资人 */
export function getInvestorsByPiece(piece: ChessPiece): InvestorProfile[] {
  return INVESTORS.filter((i) => i.chessPiece === piece);
}

/** 根据 MBTI 查找投资人 */
export function getInvestorsByMbti(mbti: string): InvestorProfile[] {
  return INVESTORS.filter((i) => i.mbti === mbti);
}

/** 棋子名称映射 */
export const PIECE_NAMES: Record<ChessPiece, string> = {
  Rook: '车',
  Bishop: '象',
  Knight: '马',
  Queen: '后',
  King: '王',
};

/** 棋子颜色映射 */
export const PIECE_COLORS: Record<ChessPiece, string> = {
  Rook: '#22c55e',
  Bishop: '#f0c674',
  Knight: '#f472b6',
  Queen: '#a78bfa',
  King: '#fbbf24',
};