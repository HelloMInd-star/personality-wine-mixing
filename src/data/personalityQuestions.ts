/**
 * 人格测评题目集 · 三十题夜之问卷
 * 以「夜里的你」为情境，避开直白测试腔
 * 每维度六题，其中两题为反向计分
 */

import type { PersonalityQuestion, LikertOption } from '../types/personality';

/** 五点李克特量表 · 标签有夜的纹理 */
export const LIKERT_OPTIONS: LikertOption[] = [
  { value: 1, label: '鲜少如此' },
  { value: 2, label: '偶有此感' },
  { value: 3, label: '时有时无' },
  { value: 4, label: '常常如此' },
  { value: 5, label: '向来如此' },
];

/** 测评题目 · 顺序为 OCEAN，每维六题 */
export const PERSONALITY_QUESTIONS: PersonalityQuestion[] = [
  // —— 开放性 Openness ——
  {
    id: 'o1',
    dimension: 'openness',
    text: '我愿意为一种没听过的酒名，在酒单上停留很久。',
    reverse: false,
  },
  {
    id: 'o2',
    dimension: 'openness',
    text: '夜里我常被一缕陌生的香气牵走脚步。',
    reverse: false,
  },
  {
    id: 'o3',
    dimension: 'openness',
    text: '我喜欢把两种不相干的味道凑在一起，看它们会变成什么。',
    reverse: false,
  },
  {
    id: 'o4',
    dimension: 'openness',
    text: '面对未知，我更愿意退回那杯喝过千百回的熟悉。',
    reverse: true,
  },
  {
    id: 'o5',
    dimension: 'openness',
    text: '凌晨冒出的念头，我会记下来，等哪天真的去试一试。',
    reverse: false,
  },
  {
    id: 'o6',
    dimension: 'openness',
    text: '我偏爱被时间验证过的经典，不愿为一时新奇冒险。',
    reverse: true,
  },

  // —— 尽责性 Conscientiousness ——
  {
    id: 'c1',
    dimension: 'conscientiousness',
    text: '我会为一次对饮，提前把冰与杯都备齐。',
    reverse: false,
  },
  {
    id: 'c2',
    dimension: 'conscientiousness',
    text: '答应别人的事，我总在日落之前就办好。',
    reverse: false,
  },
  {
    id: 'c3',
    dimension: 'conscientiousness',
    text: '我的计划常写到一半，就被夜色带去了别处。',
    reverse: true,
  },
  {
    id: 'c4',
    dimension: 'conscientiousness',
    text: '即使独自饮酒，我也按部就班，不肯将就分毫。',
    reverse: false,
  },
  {
    id: 'c5',
    dimension: 'conscientiousness',
    text: '凌晨的灵感常让我推翻原定的安排，纵情一回。',
    reverse: true,
  },
  {
    id: 'c6',
    dimension: 'conscientiousness',
    text: '我喜欢把用过的东西归回原位，留一份秩序在夜里。',
    reverse: false,
  },

  // —— 外向性 Extraversion ——
  {
    id: 'e1',
    dimension: 'extraversion',
    text: '吧台的人声让我越发有精神，仿佛被点亮。',
    reverse: false,
  },
  {
    id: 'e2',
    dimension: 'extraversion',
    text: '人群中我总在寻找一个可以安静注视的角落。',
    reverse: true,
  },
  {
    id: 'e3',
    dimension: 'extraversion',
    text: '我常是那个先举起杯、把沉默打破的人。',
    reverse: false,
  },
  {
    id: 'e4',
    dimension: 'extraversion',
    text: '独处时，我的能量才像潮水一样慢慢回来。',
    reverse: true,
  },
  {
    id: 'e5',
    dimension: 'extraversion',
    text: '我喜欢让一桌陌生人，渐渐变成一桌朋友。',
    reverse: false,
  },
  {
    id: 'e6',
    dimension: 'extraversion',
    text: '长久的喧闹会让我想推门出去，透一口夜的凉。',
    reverse: true,
  },

  // —— 宜人性 Agreeableness ——
  {
    id: 'a1',
    dimension: 'agreeableness',
    text: '邻座落单，我会自然地递过去一句话。',
    reverse: false,
  },
  {
    id: 'a2',
    dimension: 'agreeableness',
    text: '我容易相信别人递来的善意，不加太多防备。',
    reverse: false,
  },
  {
    id: 'a3',
    dimension: 'agreeableness',
    text: '对陌生人的好意，我总会先存三分保留。',
    reverse: true,
  },
  {
    id: 'a4',
    dimension: 'agreeableness',
    text: '我宁肯自己少喝一口，也不愿让场子冷下来。',
    reverse: false,
  },
  {
    id: 'a5',
    dimension: 'agreeableness',
    text: '争执时，我很少是那个先退一步的人。',
    reverse: true,
  },
  {
    id: 'a6',
    dimension: 'agreeableness',
    text: '别人的难处，我常比旁人更早察觉。',
    reverse: false,
  },

  // —— 神经质 Neuroticism ——
  {
    id: 'n1',
    dimension: 'neuroticism',
    text: '一句无心的话，能在我心里回响整夜。',
    reverse: false,
  },
  {
    id: 'n2',
    dimension: 'neuroticism',
    text: '入睡前，我常把白天的细节翻来覆去看。',
    reverse: false,
  },
  {
    id: 'n3',
    dimension: 'neuroticism',
    text: '我很少被突如其来的情绪带走，心是稳的。',
    reverse: true,
  },
  {
    id: 'n4',
    dimension: 'neuroticism',
    text: '夜越深，我的心事越容易浮上来。',
    reverse: false,
  },
  {
    id: 'n5',
    dimension: 'neuroticism',
    text: '风波过后，我总能很快回到一杯酒的平静。',
    reverse: true,
  },
  {
    id: 'n6',
    dimension: 'neuroticism',
    text: '一杯没调好的酒，会让我惦记很久。',
    reverse: false,
  },
];
