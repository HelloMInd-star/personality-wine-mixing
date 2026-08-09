/**
 * BaseSelector · Step 1 · 选基调
 * 基于人格向量推荐 4 种基酒 · 点击选择
 * 选中后高亮 · 无向量时返回默认 4 种
 */

import type { BaseSpirit } from '../../types/cocktail';
import type { PersonaVector, PersonaDim } from '../../types/personaFusion';

/** 基酒元数据 · 含向量亲和度权重 */
interface BaseSpiritMeta {
  key: BaseSpirit;
  label: string;
  labelEn: string;
  color: string;
  symbol: string;
  description: string;
  /** 向量亲和度 · 用于推荐匹配计算 */
  affinity: Partial<Record<PersonaDim, number>>;
}

/** 10 种基酒 · 向量亲和度映射 */
const BASE_SPIRITS: BaseSpiritMeta[] = [
  {
    key: 'gin',
    label: '金酒',
    labelEn: 'Gin',
    color: '#a8d8a8',
    symbol: '杜松',
    description: '清新草本 · 直觉型',
    affinity: { VIS: 0.8, SPD: 0.6 },
  },
  {
    key: 'whisky',
    label: '威士忌',
    labelEn: 'Whisky',
    color: '#c89a5a',
    symbol: '橡木',
    description: '深沉复杂 · 深思型',
    affinity: { INF: 0.8, TOL: 0.7 },
  },
  {
    key: 'rum',
    label: '朗姆',
    labelEn: 'Rum',
    color: '#d4a76a',
    symbol: '甘蔗',
    description: '热情甜美 · 炽烈型',
    affinity: { ENT: 0.8, LEAD: 0.6 },
  },
  {
    key: 'vodka',
    label: '伏特加',
    labelEn: 'Vodka',
    color: '#e0e8f0',
    symbol: '纯净',
    description: '纯净百搭 · 果决型',
    affinity: { SPD: 0.8, TOL: 0.6 },
  },
  {
    key: 'tequila',
    label: '龙舌兰',
    labelEn: 'Tequila',
    color: '#c8e065',
    symbol: '烈焰',
    description: '热烈直接 · 主导型',
    affinity: { LEAD: 0.8, ENT: 0.7 },
  },
  {
    key: 'brandy',
    label: '白兰地',
    labelEn: 'Brandy',
    color: '#b8860b',
    symbol: '琥珀',
    description: '优雅醇厚 · 沉稳型',
    affinity: { INF: 0.7, VIS: 0.6 },
  },
  {
    key: 'liqueur',
    label: '利口酒',
    labelEn: 'Liqueur',
    color: '#d4af7a',
    symbol: '蜜糖',
    description: '甜美多变 · 浪漫型',
    affinity: { ENT: 0.7, VIS: 0.5 },
  },
  {
    key: 'sake',
    label: '清酒',
    labelEn: 'Sake',
    color: '#f5f0dc',
    symbol: '米',
    description: '清雅含蓄 · 沉静型',
    affinity: { TOL: 0.7, INF: 0.5 },
  },
  {
    key: 'wine',
    label: '葡萄酒',
    labelEn: 'Wine',
    color: '#9b1a3a',
    symbol: '葡萄',
    description: '优雅复杂 · 雅致型',
    affinity: { VIS: 0.6, INF: 0.6 },
  },
  {
    key: 'none',
    label: '无酒精',
    labelEn: 'Mocktail',
    color: '#90ee90',
    symbol: '清',
    description: '清醒之夜 · 自持型',
    affinity: { TOL: 0.8, SPD: 0.5 },
  },
];

/** 计算基酒与向量的匹配度 · 0-1 */
export function calcAffinity(base: BaseSpiritMeta, vec: PersonaVector): number {
  const dims = Object.keys(base.affinity) as PersonaDim[];
  if (dims.length === 0) return 0.5;
  let sum = 0;
  let weight = 0;
  for (const dim of dims) {
    const w = base.affinity[dim] ?? 0;
    sum += vec[dim] * w;
    weight += w;
  }
  return weight > 0 ? sum / weight : 0.5;
}

/** 基酒元数据查询 · 供 Builder 派生融合酒颜色/名称 */
export function getBaseMeta(key: BaseSpirit): BaseSpiritMeta | undefined {
  return BASE_SPIRITS.find((b) => b.key === key);
}

/** 推荐排序 · 有向量取 top 4 · 无向量返回默认 4 种 */
function getRecommendedBases(vec: PersonaVector | null): Array<BaseSpiritMeta & { score: number }> {
  if (!vec) {
    return [BASE_SPIRITS[0], BASE_SPIRITS[1], BASE_SPIRITS[2], BASE_SPIRITS[3]].map((b) => ({
      ...b,
      score: 0,
    }));
  }
  return [...BASE_SPIRITS]
    .map((b) => ({ ...b, score: calcAffinity(b, vec) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
}

interface BaseSelectorProps {
  dynamicVector: PersonaVector | null;
  selected: BaseSpirit | null;
  onSelect: (base: BaseSpirit) => void;
}

export default function BaseSelector({ dynamicVector, selected, onSelect }: BaseSelectorProps) {
  const recommended = getRecommendedBases(dynamicVector);

  return (
    <div>
      {/* 标题区 */}
      <div className="text-center mb-8">
        <div className="text-[11px] tracking-[0.6em] text-amethyst-400/60 uppercase mb-3">
          Step 1 · 基调
        </div>
        <h3 className="font-display text-xl text-gold-sheen mb-2">选基调</h3>
        <p className="text-sm text-moon-200/60 leading-relaxed">
          {dynamicVector
            ? '主理人基于你的人格向量推荐这 4 种基调'
            : '选择一种基调，开始你的调酒之旅'}
        </p>
      </div>

      {/* 基调卡片网格 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {recommended.map((base, idx) => {
          const isSelected = selected === base.key;
          const isTop = idx === 0 && dynamicVector !== null;
          return (
            <button
              key={base.key}
              type="button"
              onClick={() => onSelect(base.key)}
              className="relative rounded-2xl p-5 text-left transition-all duration-500 group"
              style={{
                background: isSelected
                  ? `linear-gradient(135deg, ${base.color}22, ${base.color}08)`
                  : 'rgba(15, 10, 30, 0.6)',
                border: isSelected
                  ? `1px solid ${base.color}66`
                  : '1px solid rgba(124, 95, 191, 0.15)',
                boxShadow: isSelected
                  ? `0 4px 20px ${base.color}33`
                  : 'none',
                backdropFilter: 'blur(8px)',
              }}
            >
              {/* 推荐角标 */}
              {isTop && (
                <div
                  className="absolute -top-2 -right-2 text-[9px] tracking-widest px-2 py-0.5 rounded-full font-mono"
                  style={{
                    background: 'rgba(240, 198, 116, 0.15)',
                    color: '#f0c674',
                    border: '1px solid rgba(240, 198, 116, 0.3)',
                  }}
                >
                  推荐
                </div>
              )}

              {/* 符号圆 */}
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center mb-3 transition-transform duration-500 group-hover:scale-110"
                style={{
                  background: `radial-gradient(circle at 30% 30%, ${base.color}, ${base.color}66)`,
                  boxShadow: `0 0 12px ${base.color}44`,
                }}
              />

              {/* 名称 */}
              <div className="font-display text-base text-moon-50 mb-0.5">
                {base.label}
              </div>
              <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase mb-2">
                {base.labelEn}
              </div>

              {/* 描述 */}
              <p className="text-[11px] text-moon-200/55 leading-relaxed">
                {base.description}
              </p>

              {/* 匹配度 */}
              {dynamicVector && base.score > 0 && (
                <div className="mt-2 text-[10px] font-mono text-gold-400/50">
                  匹配 {(base.score * 100).toFixed(0)}%
                </div>
              )}

              {/* 选中标记 */}
              {isSelected && (
                <div
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{
                    background: base.color,
                    color: '#070414',
                  }}
                >
                  ✓
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
