/**
 * 调酒故事引擎 · Cocktail Story Engine
 *
 * 从用户画像（MBTI + 6D向量 + 三级标签）和酒款数据中，
 * 按模板生成调酒故事文案。
 *
 * 四段式叙事结构：
 *   1. 序章 · 人格底色 —— 你是谁，为什么这杯酒属于你
 *   2. 风味叙事 —— 风味参数的文学化翻译
 *   3. 场景时刻 —— 三个喝酒场景
 *   4. 落款 · 金句 —— 一句话收尾
 *
 * 模板驱动，纯函数，无副作用
 */

import { type PersonaVector, DIM_LABEL } from '../types/personaFusion';
import { type Cocktail, type FlavorKey } from '../types/cocktail';
import { mbtiToBaseVector, derivePersonaTag } from './personaFusionEngine';
import { logger } from './logger';

// ═════════════════════════════════════════════════════════
// 类型定义
// ═════════════════════════════════════════════════════════

/** 故事生成输入 */
export interface StoryInput {
  /** MBTI 四字母代码 */
  mbti: string;
  /** 6D 人格向量 [-1, 1] */
  vector: PersonaVector;
  /** 三级标签 · 如 "谋略者·敛·锐" */
  tag: string;
  /** 选中的酒款 */
  cocktail: Cocktail;
  /** 用户场景 · 如 "独酌沉思" */
  scenario?: string;
}

/** 故事生成输出 */
export interface StoryOutput {
  /** 标题 */
  title: string;
  /** 英文副标题 */
  subtitleEn: string;
  /** 序章 · 人格底色 */
  opening: string;
  /** 风味叙事 */
  flavorNarrative: string;
  /** 场景时刻 */
  scenes: string[];
  /** 金句 */
  quote: string;
  /** 元数据 */
  meta: {
    mbti: string;
    tag: string;
    topDim: string;
    topDimDir: string;
    cocktailName: string;
    baseSpirit: string;
    dominantFlavor: string;
    abv: number;
  };
}

// ═════════════════════════════════════════════════════════
// MBTI 性格内核
// ═════════════════════════════════════════════════════════

const MBTI_KERNEL: Record<string, string> = {
  ISTJ: '严谨务实的秩序维护者，信奉规则与承诺，注重细节且追求准确，是最可靠的执行者。',
  ISFJ: '温暖内敛的守护者，默默付出不求回报，重视他人感受远胜过自己，是最让人安心的存在。',
  ESTJ: '果断高效的执行者，天生的组织者与领导者，讲规则、重结果，是团队里最靠谱的主心骨。',
  ESFJ: '热情洋溢的社交家，天生的氛围制造者，关心每个人的感受，走到哪里都能带来欢声笑语。',
  ISTP: '冷静的鉴赏家，动手解决问题的实战派，在开放中保持自持，在精确中寻找自由。',
  ISFP: '追随当下审美的探险家，体验派，用感官丈量世界，温柔而自由。',
  ESTP: '高临场感的行动派，企业家精神，敏锐捕捉机会，在刺激中保持冷静。',
  ESFP: '把快乐和能量传递给周围的表演者，活在当下，感染每一个遇见的人。',
  INTJ: '战略型架构师，习惯从长期视角推演路径，独立、理性、追求系统性地解决问题。',
  INTP: '逻辑型探索者，享受拆解复杂系统的过程，思辨、好奇、不断追问为什么。',
  ENTJ: '指挥型统领，果断推进目标并调配资源，果断、目标导向、天生的领导者。',
  ENTP: '辩论型发明家，擅长跨界联想和逆向思维，创意层出不穷，挑战一切既定规则。',
  INFJ: '提倡者，用直觉和温度锚定长远意义，深刻、理想主义、善于洞察人心。',
  INFP: '调停者，内心有一套自洽的价值光谱，共情、理想、追求内心和谐。',
  ENFJ: '主人公，擅长用愿景点燃一群人，感染力、利他、天生的导师。',
  ENFP: '竞选者，热情驱动下不断探索新可能，发散、热情、永远好奇下一步。',
};

/** 获取 MBTI 性格内核，缺失时用通用描述 */
function getKernel(mbti: string): string {
  return MBTI_KERNEL[mbti.toUpperCase()] || '独特的个人底色，无法被简单归类。';
}

// ═════════════════════════════════════════════════════════
// 维度叙事短语
// ═════════════════════════════════════════════════════════

const DIM_PHRASE_POSITIVE: Record<string, string> = {
  TOL: '对不确定性保持开放，相信在混乱中自有秩序',
  SPD: '决策果断，不拖泥带水，相信第一判断的力量',
  INF: '谋定而后动，在充分的信息中寻找最优解',
  ENT: '热情外向，在人群中汲取能量，感染身边的每一个人',
  LEAD: '天生的引领者，习惯站在队伍前方，为他人指明方向',
  VIS: '相信直觉，在理性之外，给灵感留一扇窗',
};

const DIM_PHRASE_NEGATIVE: Record<string, string> = {
  TOL: '对边界有清晰的感知，在规则与结构中感到安全',
  SPD: '深思熟虑，在行动之前，愿意花时间把路径看清楚',
  INF: '相信直觉胜过数据，在模糊中捕捉精准的灵感',
  ENT: '内敛沉静，在独处中汲取能量，内心的世界比外界更丰富',
  LEAD: '不急于站在最前面，更擅长在背后支撑整个团队',
  VIS: '相信眼见为实，在具体与可验证中建立对世界的理解',
};

function getTopDimPhrase(vector: PersonaVector): { dim: string; phrase: string; dir: string } {
  const ranked = (Object.keys(vector) as (keyof PersonaVector)[])
    .map((k) => ({ dim: k, val: vector[k], abs: Math.abs(vector[k]) }))
    .sort((a, b) => b.abs - a.abs);

  const top = ranked[0];
  const label = DIM_LABEL[top.dim];
  const dir = top.val >= 0 ? '正向' : '反向';
  const phrase = top.val >= 0
    ? DIM_PHRASE_POSITIVE[top.dim]
    : DIM_PHRASE_NEGATIVE[top.dim];

  return { dim: label, phrase, dir };
}

// ═════════════════════════════════════════════════════════
// 风味标签 → 文学化短语
// ═════════════════════════════════════════════════════════

const FLAVOR_POETRY: Record<FlavorKey, string[]> = {
  sweet: ['如第一缕晨光落在舌尖', '甜而不腻，像记忆里最温柔的那句话', '蜂蜜般的温润，在口中缓缓化开'],
  sour: ['酸得恰到好处，像生活本身——有棱角才有滋味', '青柠的清新在舌尖跳跃，唤醒每一个沉睡的味蕾', '柠檬的酸度提亮整体口感，像暗夜中的一道闪电'],
  bitter: ['苦尽甘来，是成年人才能读懂的味道', '微苦的尾韵像一段值得回味的故事', '苦艾的草本苦香，在深呼吸中缓缓展开'],
  strong: ['烈而不燥，像一把淬过火的刀', '入口有力，但从不失分寸', '凛冽的酒精感，像冬夜里的一声号角'],
  smoky: ['烟熏的质感像远山的薄雾，缓缓笼罩整个口腔', '泥煤的烟熏味在舌尖蔓延，像一场安静的篝火', '烟熏的余韵绵长，带着大地的温度和时间的重量'],
  fruity: ['果香在口中绽放，像夏天的第一口西瓜', '水果的甜香轻盈跳跃，带来一阵热带的风', '浆果的酸甜在唇齿间流转，像一场微醺的梦'],
  herbal: ['草本的气息干净而克制，像清晨的露水', '杜松子的清香在口中画出一道绿色的弧线', '草本的层次在舌尖徐徐展开，每一步都有新的发现'],
  creamy: ['丝滑如绸缎，温柔地包裹整个口腔', '奶油的绵密像母亲的怀抱，柔软而安全', '绵密的泡沫在舌尖融化，像云朵飘过味蕾的天空'],
};

function getFlavorPoetry(flavorProfile: Record<FlavorKey, number>): string[] {
  const lines: string[] = [];
  const entries = (Object.entries(flavorProfile) as [FlavorKey, number][])
    .filter(([, v]) => v >= 5)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  for (const [key, val] of entries) {
    const pool = FLAVOR_POETRY[key];
    if (pool) {
      const idx = val >= 8 ? 0 : val >= 6 ? 1 : 2;
      lines.push(pool[Math.min(idx, pool.length - 1)]);
    }
  }

  return lines.length > 0 ? lines : ['极简的配方中，蕴藏着微妙的平衡。'];
}

// ═════════════════════════════════════════════════════════
// 场景叙事
// ═════════════════════════════════════════════════════════

const SCENE_OPTIONS: Record<string, string[]> = {
  独酌沉思: [
    '完成一个重要项目后的独处奖励时刻，关掉所有通知，只有你和这杯酒。',
    '深夜窗边，城市的灯光在远处闪烁，你举起酒杯，为今天画上完美的句号。',
  ],
  商务社交: [
    '商务谈判成功后的庆祝，不需要太多言语，一杯酒就是最好的确认。',
    '雪茄吧里的战略复盘局，酒过三巡，思路却越来越清晰。',
  ],
  餐前开胃: [
    '夜幕降临前的仪式感，一杯开胃酒，为即将到来的夜晚拉开序幕。',
    '傍晚的露台上，落日余晖中，一杯酒的时间，刚好够整理一天的心情。',
  ],
  夏日消暑: [
    '炎炎夏日午后，冰凉的酒杯在手中凝出水珠，每一口都是对夏天的致敬。',
    '泳池边、露台上、沙滩旁——这杯酒就是夏天的缩写。',
  ],
  社交聚会: [
    '派对的开场酒，气氛从这杯酒开始升温，每个人脸上都带着期待的笑容。',
    '朋友聚会，酒杯碰撞的声音比任何音乐都更让人放松。',
  ],
  浪漫约会: [
    '烛光摇曳的夜晚，酒杯中的液体在灯光下泛着琥珀色的光，对面的人比酒更醉人。',
    '第一次约会，这杯酒像一个温柔的破冰者，让所有的紧张都融化在舌尖。',
  ],
  休闲时光: [
    '周末的午后，阳光透过百叶窗洒在桌上，一杯酒、一本书、一个下午。',
    '没有日程、没有计划，只有这杯酒和当下的惬意。',
  ],
  特别时刻: [
    '值得纪念的日子，值得一杯特别的酒。',
    '人生的重要时刻，需要一杯酒来见证和铭记。',
  ],
};

function getScenes(scenarios: string[] | undefined): string[] {
  if (!scenarios || scenarios.length === 0) {
    return ['独酌 · 与自己对话的时刻', '小聚 · 与知己分享的时刻', '庆祝 · 为值得的事举杯的时刻'];
  }

  const scenes: string[] = [];
  for (const s of scenarios) {
    const pool = SCENE_OPTIONS[s];
    if (pool) {
      scenes.push(pool[Math.floor(Math.random() * pool.length)]);
    }
  }
  return scenes.slice(0, 3);
}

// ═════════════════════════════════════════════════════════
// 金句生成
// ═════════════════════════════════════════════════════════

const QUOTES: Record<string, string[]> = {
  '结构者': ['规则不是束缚，是让一切恰到好处的刻度。', '在秩序中，我找到了最大的自由。'],
  '弹性者': ['生活不是直线，而是顺势而为的曲线。', '在变化中保持从容，是最高级的秩序。'],
  '沉思者': ['慢一点，稳一点，每一步都算数。', '深思不是犹豫，是对选择的尊重。'],
  '决断者': ['说得出，做得到。', '当断则断，不拖泥带水。'],
  '直觉者': ['看见别人看不见的，相信别人不相信的。', '直觉是经验的另一种语言。'],
  '谋略者': ['多一分则过，少一分不足，恰好才是答案。', '每一步都经过计算，没有偶然。'],
  '沉静者': ['沉默不是无话可说，是在等一个值得开口的时刻。', '内敛的力量，比喧嚣更持久。'],
  '炽烈者': ['燃烧吧，在每一个值得燃烧的瞬间。', '热情不是冲动，是生命力的证明。'],
  '追随者': ['不站在最前面，但站在最需要的地方。', '支撑的力量，有时比引领更强大。'],
  '引领者': ['路在那里，我走过去，然后你们跟上。', '引领不是控制，是让别人看见可能。'],
  '实干者': ['做了再说，结果会证明一切。', '空想不如行动，每一步都在靠近答案。'],
  '灵感者': ['在别人看到数据的地方，我看到故事。', '灵感不是等待，是在日常中捕捉。'],
};

function getQuote(tag: string): string {
  const L1 = tag.split('·')[0];
  const pool = QUOTES[L1] || ['这杯酒，就是你的答案。', '一杯酒，一个人，一个故事。'];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ═════════════════════════════════════════════════════════
// 主引擎
// ═════════════════════════════════════════════════════════

/**
 * 生成调酒故事文案
 *
 * @param input 用户画像 + 酒款数据
 * @returns 四段式故事文案
 */
export function generateStory(input: StoryInput): StoryOutput {
  const { mbti, vector, tag, cocktail } = input;
  const upperMbti = mbti.toUpperCase();

  logger.engine('Story:generate', { mbti: upperMbti, tag, cocktail: cocktail.name });

  // ── 元数据 ──
  const topDim = getTopDimPhrase(vector);
  const flavorEntries = (Object.entries(cocktail.flavorProfile) as [FlavorKey, number][])
    .sort((a, b) => b[1] - a[1]);
  const dominantFlavor = flavorEntries[0]?.[0] || 'sweet';

  // ── 标题 ──
  const title = `${tag}的${cocktail.name}`;
  const subtitleEn = `${cocktail.nameEn} · for ${upperMbti}`;

  // ── 序章：人格底色 ──
  const kernel = getKernel(upperMbti);
  const opening = [
    `${upperMbti}——${kernel}`,
    '',
    `你的人格里，${topDim.phrase}。`,
    `这杯酒，是为${tag}量身定制的——不多不少，恰到好处。`,
  ].join('\n');

  // ── 风味叙事 ──
  const flavorLines = getFlavorPoetry(cocktail.flavorProfile);
  const tastingNote = cocktail.tastingNotes || cocktail.story;
  const flavorNarrative = [
    `第一口，${flavorLines[0] || '极简的配方中，蕴藏着微妙的平衡。'}`,
    flavorLines[1] ? `然后是${flavorLines[1].replace(/^[^，。]+[，。]/, '').trimStart()}` : '',
    flavorLines[2] ? `最后，${flavorLines[2]}` : '',
    '',
    tastingNote,
  ].filter(Boolean).join('\n');

  // ── 场景时刻 ──
  const scenes = getScenes(cocktail.scenarios);

  // ── 金句 ──
  const quote = getQuote(tag);

  return {
    title,
    subtitleEn,
    opening,
    flavorNarrative,
    scenes,
    quote,
    meta: {
      mbti: upperMbti,
      tag,
      topDim: topDim.dim,
      topDimDir: topDim.dir,
      cocktailName: cocktail.name,
      baseSpirit: cocktail.baseSpirit,
      dominantFlavor,
      abv: cocktail.abv,
    },
  };
}

/**
 * 批量生成 · 同一用户对多个酒款生成故事
 */
export function generateStories(inputs: StoryInput[]): StoryOutput[] {
  return inputs.map((input) => generateStory(input));
}

/**
 * 从 MBTI 快速生成（无需手动传入 vector 和 tag）
 */
export function generateFromMbti(mbti: string, cocktail: Cocktail, scenario?: string): StoryOutput {
  const vector = mbtiToBaseVector(mbti);
  const tag = derivePersonaTag(vector);
  return generateStory({ mbti, vector, tag, cocktail, scenario });
}

// ═════════════════════════════════════════════════════════
// 导出
// ═════════════════════════════════════════════════════════

export const cocktailStoryEngine = {
  generateStory,
  generateStories,
  generateFromMbti,
};

export default cocktailStoryEngine;