/**
 * 引擎逻辑测试脚本 · 模拟数据驱动
 * 构造 8 组覆盖不同人格原型的模拟答案，跑通：
 *   答案 → 五维分数 → 原型匹配 → 风味偏好 → 调酒推荐
 *
 * 运行：npx tsx src/scripts/testEngine.ts
 */

import type { TraitKey } from '../types/personality';
import type { FlavorKey } from '../types/cocktail';
import { PERSONALITY_QUESTIONS } from '../data/personalityQuestions';
import { PERSONALITY_TRAITS } from '../data/personalityTraits';
import { FLAVOR_MAP } from '../data/flavorMeta';
import { buildProfile } from '../engine/personalityEngine';
import { recommendCocktails, recommendByArchetype } from '../engine/cocktailEngine';

// —— ANSI 色 · 呼应深空紫金 ——
const C = {
  gold: '\x1b[38;5;221m',
  purple: '\x1b[38;5;141m',
  moon: '\x1b[38;5;189m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
};

type Target = 'high' | 'low' | 'mid';

/** 按目标维度高低生成模拟答案 · 自动处理反向题计分 */
function makeAnswers(target: Record<TraitKey, Target>): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const q of PERSONALITY_QUESTIONS) {
    const t = target[q.dimension];
    let v: number;
    if (t === 'high') v = q.reverse ? 1 : 5; // 反向题给1，反转后得5
    else if (t === 'low') v = q.reverse ? 5 : 1; // 反向题给5，反转后得1
    else v = 3;
    answers[q.id] = v;
  }
  return answers;
}

/** 分数条 · 0-100 映射 20 格 */
function scoreBar(score: number, width = 20): string {
  const filled = Math.round((score / 100) * width);
  return `${C.gold}${'█'.repeat(filled)}${C.dim}${'░'.repeat(width - filled)}${C.reset}`;
}

/** 偏好条 · 0-1 映射 10 格 */
function prefBar(v: number, width = 10): string {
  const filled = Math.round(v * width);
  return `${C.purple}${'█'.repeat(filled)}${C.dim}${'░'.repeat(width - filled)}${C.reset}`;
}

const DIVIDER = `${C.dim}─`.repeat(64) + C.reset;
const BANNER = `${C.gold}${'═'.repeat(64)}${C.reset}`;

/** 打印单个测试用例结果 */
function printCase(index: number, name: string, target: Record<TraitKey, Target>) {
  const answers = makeAnswers(target);
  const profile = buildProfile(answers);
  const { scores, archetype, flavorPreference } = profile;

  const recommendations = recommendCocktails(flavorPreference, 3);

  console.log(BANNER);
  console.log(
    `${C.bold}[用例 ${index}] ${name}${C.reset} ${C.dim}(原型: ${archetype.code})${C.reset}`,
  );
  console.log(DIVIDER);

  // 五维分数
  console.log(`${C.moon}五维分数 OCEAN${C.reset}`);
  for (const trait of PERSONALITY_TRAITS) {
    const score = scores[trait.key];
    console.log(
      `  ${trait.shortLetter} ${trait.label.padEnd(4)} ${scoreBar(score)} ${C.bold}${String(score).padStart(3)}${C.reset}`,
    );
  }
  console.log();

  // 人格原型
  console.log(
    `${C.gold}人格原型 · ${archetype.name}${C.reset} ${C.dim}(${archetype.code})${C.reset}`,
  );
  console.log(`  ${C.moon}「${archetype.tagline}」${C.reset}`);
  console.log(`  ${C.dim}${archetype.description}${C.reset}`);
  console.log();

  // 风味偏好 · 按 0-1 权重排序
  const flavorEntries = (Object.keys(flavorPreference) as FlavorKey[])
    .map((k) => ({ key: k, value: flavorPreference[k] ?? 0 }))
    .sort((a, b) => b.value - a.value);

  console.log(`${C.moon}风味偏好 · 八维${C.reset}`);
  for (const { key, value } of flavorEntries) {
    const meta = FLAVOR_MAP[key];
    console.log(
      `  ${meta.label.padEnd(4)} ${prefBar(value)} ${C.bold}${value.toFixed(2)}${C.reset}`,
    );
  }
  console.log();

  // 契合调酒 Top3
  console.log(`${C.moon}契合调酒 · Top 3${C.reset}`);
  recommendations.forEach((rec, i) => {
    const { cocktail, matchScore, reasons } = rec;
    const scoreColor = matchScore >= 85 ? C.gold : matchScore >= 70 ? C.moon : C.dim;
    console.log(
      `  ${i + 1}. ${C.bold}${cocktail.name}${C.reset} ${C.dim}${cocktail.nameEn}${C.reset} ${scoreColor}${matchScore} 契合${C.reset}`,
    );
    console.log(`     ${C.dim}基酒 ${cocktail.baseSpirit} · ${cocktail.glass} · ABV ${cocktail.abv}%${C.reset}`);
    if (reasons[0]) {
      console.log(`     ${C.purple}→ ${reasons[0]}${C.reset}`);
    }
  });
  console.log();
}

// —— 8 组测试用例 · 覆盖五维高低组合与各原型 ——
const CASES: { name: string; target: Record<TraitKey, Target> }[] = [
  {
    name: '全高 · OCEAN 皆高',
    target: {
      openness: 'high',
      conscientiousness: 'high',
      extraversion: 'high',
      agreeableness: 'high',
      neuroticism: 'high',
    },
  },
  {
    name: '全低 · OCEAN 皆低',
    target: {
      openness: 'low',
      conscientiousness: 'low',
      extraversion: 'low',
      agreeableness: 'low',
      neuroticism: 'low',
    },
  },
  {
    name: '开放性独高 · 织梦者向',
    target: {
      openness: 'high',
      conscientiousness: 'low',
      extraversion: 'low',
      agreeableness: 'low',
      neuroticism: 'low',
    },
  },
  {
    name: '尽责性独高 · 守序者向',
    target: {
      openness: 'low',
      conscientiousness: 'high',
      extraversion: 'low',
      agreeableness: 'low',
      neuroticism: 'low',
    },
  },
  {
    name: '外向性独高 · 焰心者向',
    target: {
      openness: 'low',
      conscientiousness: 'low',
      extraversion: 'high',
      agreeableness: 'low',
      neuroticism: 'low',
    },
  },
  {
    name: '宜人性独高 · 月潮者向',
    target: {
      openness: 'low',
      conscientiousness: 'low',
      extraversion: 'low',
      agreeableness: 'high',
      neuroticism: 'low',
    },
  },
  {
    name: '神经质独高 · 雾行者向',
    target: {
      openness: 'low',
      conscientiousness: 'low',
      extraversion: 'low',
      agreeableness: 'low',
      neuroticism: 'high',
    },
  },
  {
    name: '全中 · 均衡型',
    target: {
      openness: 'mid',
      conscientiousness: 'mid',
      extraversion: 'mid',
      agreeableness: 'mid',
      neuroticism: 'mid',
    },
  },
];

console.log(`\n${C.bold}${C.gold}Y.Mine · 人格匹配 & 调酒推荐 逻辑测试${C.reset}`);
console.log(`${C.dim}8 组模拟画像 × 引擎纯函数链路验证${C.reset}\n`);

CASES.forEach((c, i) => printCase(i + 1, c.name, c.target));

// —— 附加 · 原型亲和推荐测试 ——
console.log(BANNER);
console.log(`${C.bold}[附加] 原型亲和推荐 · recommendByArchetype${C.reset}`);
console.log(DIVIDER);
const archetypeCodes = ['dreamweaver', 'clockmaker', 'ember', 'mistwalker'];
for (const code of archetypeCodes) {
  const recs = recommendByArchetype(code, 2);
  console.log(`${C.gold}${code}${C.reset} ${C.dim}→${C.reset} ${recs.map((r) => `${r.cocktail.name}(${r.matchScore})`).join('、') || '无匹配'}`);
}

console.log(`\n${C.dim}测试完成 · 共 ${CASES.length} 组画像 + ${archetypeCodes.length} 组原型亲和${C.reset}\n`);
