/**
 * 人格原型集 · 调酒 × 人格 × 夜的隐喻
 * 每个原型是五维星图里一处可被认出的星座
 */

import type { PersonalityArchetype } from '../types/personality';

/** 人格原型 · 覆盖五维的高低组合，末位为均衡兜底型 */
export const PERSONALITY_ARCHETYPES: PersonalityArchetype[] = [
  {
    code: 'The Dreamweaver',
    name: '织梦者',
    tagline: '把未饮过的味道，织进今夜的星图。',
    description:
      '你向陌生敞着怀，把每一种未曾尝过的气息都当作夜的邀请。复杂与意外于你不是风险，而是值得驻足的风景。',
    signature: { openness: [70, 100] },
    auraColor: '#f0c674',
  },
  {
    code: 'The Clockmaker',
    name: '守序者',
    tagline: '每一滴都落在它该落的分毫里。',
    description:
      '你信奉秩序的庄重，纵在凌晨也按部就班。经典之所以为经典，正因它经得起你这种耐心的端详。',
    signature: { conscientiousness: [70, 100] },
    auraColor: '#d4a84b',
  },
  {
    code: 'The Ember',
    name: '焰心者',
    tagline: '你举杯，整张吧台都跟着亮起来。',
    description:
      '你的热度向外延伸，能把一桌陌生人焐成一桌朋友。明亮的烈与热闹的光，是你给夜的颜色。',
    signature: { extraversion: [70, 100] },
    auraColor: '#9b7bd4',
  },
  {
    code: 'The Velvet',
    name: '月潮者',
    tagline: '把锋芒藏进丝绒，让夜柔软下来。',
    description:
      '你替邻座添一勺糖，替冷场补一句话。温润如月潮，你的体贴让每一口都少了几分棱角。',
    signature: { agreeableness: [70, 100] },
    auraColor: '#7c5fbf',
  },
  {
    code: 'The Mistwalker',
    name: '雾行者',
    tagline: '心事被风一吹，便起了涟漪。',
    description:
      '你的敏是夜给的天赋，也是夜给的重量。一句无心之言能在你心里回响整晚，于是你格外需要一杯能安抚的柔。',
    signature: { neuroticism: [65, 100] },
    auraColor: '#5d44a0',
  },
  {
    code: 'The Alchemist',
    name: '炼金者',
    tagline: '以耐心炼新奇，把灵感炼成经典。',
    description:
      '你既有织梦者的好奇，又有守序者的耐心。新意在你手里不是一时兴起，而是被反复校准过的配方。',
    signature: { openness: [65, 100], conscientiousness: [65, 100] },
    auraColor: '#e0b85e',
  },
  {
    code: 'The Solitude',
    name: '独酌者',
    tagline: '角落那杯，是只有自己懂的语言。',
    description:
      '你不愿被人群焐热，也不急着讨好谁。一杯沉静的、带几分锋的酒，正合你独自注视夜的姿态。',
    signature: { extraversion: [0, 40], agreeableness: [0, 45] },
    auraColor: '#2d1b4e',
  },
  {
    code: 'The Navigator',
    name: '引航者',
    tagline: '风浪里端得住一杯不洒，便是你的航向。',
    description:
      '你稳而坚定，少被情绪带偏。在纷乱的夜里，你是那个能替大家守住节奏、把舵指向天明的人。',
    signature: { conscientiousness: [65, 100], neuroticism: [0, 40] },
    auraColor: '#c8a040',
  },
  {
    code: 'The Revel',
    name: '夜宴者',
    tagline: '热烈是底色，锋芒是装饰。',
    description:
      '你在人堆里发热，却也不肯轻易妥协。明亮的烈里藏一点不肯让步的苦，正是你夜里的味道。',
    signature: { extraversion: [65, 100], agreeableness: [0, 45] },
    auraColor: '#b06fc8',
  },
  {
    code: 'The Twilight',
    name: '暮色者',
    tagline: '不偏不倚，恰是夜与昼交界的颜色。',
    description:
      '你的五维近乎均衡，既不极端也不寡淡。像暮色里那一线光，什么都有一点，什么都不喧宾夺主。',
    signature: {
      openness: [35, 65],
      conscientiousness: [35, 65],
      extraversion: [35, 65],
      agreeableness: [35, 65],
      neuroticism: [35, 65],
    },
    auraColor: '#8b7fb8',
  },
];
