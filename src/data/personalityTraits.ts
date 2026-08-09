/**
 * 人格五维元数据 · OCEAN
 * 深空之中，五颗性格的星，各自照见夜的一个侧面
 */

import type { TraitKey, TraitMeta } from '../types/personality';

/** 五维元数据 · 顺序固定为 OCEAN */
export const PERSONALITY_TRAITS: TraitMeta[] = [
  {
    key: 'openness',
    label: '开放性',
    labelEn: 'Openness',
    shortLetter: 'O',
    description: '对未知与新经验的接纳，是夜空里愿意伸手去够的那颗星。',
    highTrait: '在陌生里看见可能，惯于把未曾尝过的味道放在舌尖',
    lowTrait: '偏爱熟悉的轮廓，喜欢一杯喝过千百回的酒',
    color: '#f0c674',
    symbol: '星图',
  },
  {
    key: 'conscientiousness',
    label: '尽责性',
    labelEn: 'Conscientiousness',
    shortLetter: 'C',
    description: '对秩序与承诺的守护，是把每一滴都量到分毫的耐心。',
    highTrait: '步调沉稳，每一杯都按经典配方落定',
    lowTrait: '随性而为，允许今晚略过几分刻度',
    color: '#d4a84b',
    symbol: '时计',
  },
  {
    key: 'extraversion',
    label: '外向性',
    labelEn: 'Extraversion',
    shortLetter: 'E',
    description: '向外延伸的热度，是把笑声递过吧台的那一束光。',
    highTrait: '在人群中发热，甘愿做那杯明亮的烈',
    lowTrait: '于角落里发光，更愿独饮一杯静的',
    color: '#9b7bd4',
    symbol: '焰心',
  },
  {
    key: 'agreeableness',
    label: '宜人性',
    labelEn: 'Agreeableness',
    shortLetter: 'A',
    description: '对他人柔软的体察，是替邻座添上一勺糖的体贴。',
    highTrait: '温润如月，把锋芒藏进丝绒里',
    lowTrait: '棱角分明，喜欢酒里那一点不肯妥协的苦',
    color: '#7c5fbf',
    symbol: '月潮',
  },
  {
    key: 'neuroticism',
    label: '神经质',
    labelEn: 'Neuroticism',
    shortLetter: 'N',
    description: '情绪起伏的潮汐，是夜里心事被风一吹就起涟漪的敏。',
    highTrait: '心思细密，易被夜色撩动情绪的弦',
    lowTrait: '心境沉稳，纵有风浪也能端住一杯不洒',
    color: '#5d44a0',
    symbol: '雾镜',
  },
];

/** 维度键 → 元数据 · 便于快速查找 */
export const TRAIT_MAP: Record<TraitKey, TraitMeta> = PERSONALITY_TRAITS.reduce(
  (map, trait) => {
    map[trait.key] = trait;
    return map;
  },
  {} as Record<TraitKey, TraitMeta>,
);
