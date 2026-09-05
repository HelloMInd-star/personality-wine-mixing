/**
 * BrewLightPage · 觉醉·酿·光 · 杯底光效独立展示页
 *
 * 独立展示可编程 LED 灯环效果 · 四种动画模式可切换
 * 由 lightEngine 派生光效参数 · 零硬件依赖
 *
 * 战略定位：觉醉「感官情绪探索」中的视觉轴 · 一杯酒底下的光之呼吸
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppStore } from '../store/appStore';
import GlassPanel from '../components/ui/GlassPanel';
import LightCanvas from '../components/brew/light/LightCanvas';
import type { LightEffect } from '../types/journey';

/** 演示用光效预设 */
const LIGHT_PRESETS: { pattern: LightEffect['pattern']; label: string; desc: string }[] = [
  { pattern: 'breath', label: '呼吸', desc: '整体明暗 sin 呼吸 · 缓慢起伏' },
  { pattern: 'flow', label: '流动', desc: '光带沿环周角度流动 · 呼应 BPM' },
  { pattern: 'pulse', label: '脉动', desc: '随拍方波脉动 · 呼应音乐节奏' },
  { pattern: 'aurora', label: '极光', desc: '多色 sin 叠加缓流 · 深空极光' },
];

export default function BrewLightPage() {
  const { profile } = useAppStore();
  const [pattern, setPattern] = useState<LightEffect['pattern']>('breath');

  const currentPreset = LIGHT_PRESETS.find((p) => p.pattern === pattern)!;

  /** 演示光效 · 固定颜色和强度 */
  const demoEffect: LightEffect = {
    pattern,
    baseColor: '#7c5fbf',
    accentColor: '#f0c674',
    intensity: 0.85,
    speed: 1,
    particleDensity: 0.6,
  };

  return (
    <div className="animate-orbit-fade-up min-h-screen px-6 md:px-12 lg:px-20 py-12 md:py-16">
      {/* 标题区 */}
      <header className="mb-10">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div>
            <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3 flex items-center gap-2">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-accent animate-orbit-pulse shadow-glow-accent" />
              觉醉 · 酿·光 · Light Canvas
            </div>
            <h1 className="font-display text-3xl md:text-4xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em]">
              杯底光效
            </h1>
          </div>
          <Link
            to="/cocktail"
            className="text-xs text-amethyst-300/70 hover:text-amethyst-200 transition-colors duration-orbit-mid ease-orbit tracking-[0.1em]"
          >
            ← 返回调酒
          </Link>
        </div>
        <p className="text-sm text-moon-200/60 italic max-w-xl">
          可编程 LED 灯环 · 四种动画模式 · 零硬件依赖 · 纯 Canvas 渲染。
        </p>
        <div className="divider-gold mt-5 w-40" />
      </header>

      {/* 模式切换 */}
      <GlassPanel padding="md" className="mb-8 max-w-2xl mx-auto">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="font-display text-sm text-moon-200/80 tracking-[0.15em]">
            动画模式
          </h2>
          <span className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
            {currentPreset.label}
          </span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {LIGHT_PRESETS.map((preset) => {
            const active = pattern === preset.pattern;
            return (
              <button
                key={preset.pattern}
                type="button"
                onClick={() => setPattern(preset.pattern)}
                className="p-3 rounded-capsule border text-center transition-all duration-orbit-mid ease-orbit"
                style={{
                  borderColor: active ? 'rgba(240,198,116,0.5)' : 'rgba(124,95,191,0.2)',
                  background: active ? 'rgba(240,198,116,0.06)' : 'transparent',
                }}
              >
                <div className="font-display text-sm text-moon-50/80">{preset.label}</div>
                <div className="text-[10px] text-moon-200/45 mt-1">{preset.desc}</div>
              </button>
            );
          })}
        </div>
      </GlassPanel>

      {/* 光效画布 */}
      <GlassPanel padding="lg" className="max-w-md mx-auto">
        <div className="flex justify-center py-4">
          <LightCanvas effect={demoEffect} size={280} />
        </div>
        <div className="text-center mt-4">
          <div className="text-[10px] tracking-[0.2em] text-amethyst-400/60 uppercase">
            Pattern · {currentPreset.label}
          </div>
          <p className="text-xs text-moon-200/50 italic mt-1">
            {currentPreset.desc}
          </p>
          {profile && (
            <p className="text-[10px] text-moon-200/40 mt-2">
              在调酒页中，光效会根据你的情绪旅程阶段自动切换。
            </p>
          )}
        </div>
      </GlassPanel>

      <div className="h-16" />
    </div>
  );
}