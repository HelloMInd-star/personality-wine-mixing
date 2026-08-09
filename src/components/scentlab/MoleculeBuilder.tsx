/**
 * MoleculeBuilder · 拖拽拼图核心交互 · 乐高分子结构搭建
 *
 * 用户从左侧原料库拖拽香味卡片到右侧组合区 · 按前调→中调→后调堆叠
 * 每个原料渲染为「分子积木」· 带分子符号 + 乐高凸点 · 落入有弹性动画
 * 积木之间用化学键连接线 · 整体形成分子链式结构
 *
 * 交互：
 *   - HTML5 drag-and-drop · 原料卡 draggable · 槽位 onDrop
 *   - 每层最多 3 个原料 · 超出替换最早的
 *   - 点击积木移除
 *   - 落入动画：scale 0→1.15→1 + 轻微旋转 · 0.5s ease-out
 */

import { useState } from 'react';
import {
  getNotesByLayer,
  getScentNote,
  MAX_NOTES_PER_LAYER,
} from '../../data/scentLabData';
import type { ScentNoteLayer, ScentNote } from '../../types/scentLab';
import GlassPanel from '../ui/GlassPanel';

export interface MoleculeBuilderProps {
  topNotes: string[];
  heartNotes: string[];
  baseNotes: string[];
  /** 基础调颜色 · 用于化学键与核心节点 */
  baseColor: string;
  /** 基础调符号 · 中心节点显示 */
  baseSymbol: string | null;
  onChange: (layer: ScentNoteLayer, notes: string[]) => void;
}

/** 层元数据 */
const LAYER_META: { key: ScentNoteLayer; label: string; en: string; desc: string }[] = [
  { key: 'top', label: '前调', en: 'Top Note', desc: '最先闻到 · 挥发最快' },
  { key: 'heart', label: '中调', en: 'Heart Note', desc: '核心香气' },
  { key: 'base', label: '后调', en: 'Base Note', desc: '余香最慢 · 留得住时间' },
];

export default function MoleculeBuilder({
  topNotes,
  heartNotes,
  baseNotes,
  baseColor,
  baseSymbol,
  onChange,
}: MoleculeBuilderProps) {
  const [dragNote, setDragNote] = useState<string | null>(null);
  const [dragOverLayer, setDragOverLayer] = useState<ScentNoteLayer | null>(null);

  const layerNotesMap: Record<ScentNoteLayer, string[]> = {
    top: topNotes,
    heart: heartNotes,
    base: baseNotes,
  };

  /** 拖拽开始 · 记录原料 id */
  const handleDragStart = (e: React.DragEvent, noteId: string) => {
    setDragNote(noteId);
    e.dataTransfer.setData('text/plain', noteId);
    e.dataTransfer.effectAllowed = 'copy';
  };

  /** 拖拽悬停 · 允许放置 */
  const handleDragOver = (e: React.DragEvent, layer: ScentNoteLayer) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setDragOverLayer(layer);
  };

  /** 放置 · 加入对应层 · 超出上限替换最早 */
  const handleDrop = (e: React.DragEvent, layer: ScentNoteLayer) => {
    e.preventDefault();
    setDragOverLayer(null);
    const noteId = e.dataTransfer.getData('text/plain') || dragNote;
    if (!noteId) return;
    const current = layerNotesMap[layer];
    if (current.includes(noteId)) return; // 已存在
    const next = [...current, noteId];
    if (next.length > MAX_NOTES_PER_LAYER) {
      next.shift(); // 移除最早的
    }
    onChange(layer, next);
    setDragNote(null);
  };

  /** 移除某层的某个原料 */
  const handleRemove = (layer: ScentNoteLayer, noteId: string) => {
    const current = layerNotesMap[layer];
    onChange(layer, current.filter((id) => id !== noteId));
  };

  return (
    <div className="grid lg:grid-cols-5 gap-5">
      {/* 左侧 · 原料库 · 按层分组可拖拽 */}
      <div className="lg:col-span-2 space-y-4">
        <div className="text-[10px] tracking-[0.3em] text-amethyst-400/70 uppercase mb-2">
          原料库 · 拖拽到右侧
        </div>
        {LAYER_META.map((meta) => {
          const notes = getNotesByLayer(meta.key);
          return (
            <div key={meta.key}>
              <div className="flex items-baseline justify-between mb-2">
                <span className="font-display text-sm text-moon-50/85 tracking-[0.1em]">
                  {meta.label}
                </span>
                <span className="text-[9px] tracking-[0.2em] text-moon-200/40 font-mono">
                  {meta.en}
                </span>
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {notes.map((note) => (
                  <DraggableNoteCard
                    key={note.id}
                    note={note}
                    onDragStart={(e) => handleDragStart(e, note.id)}
                  />
                ))}
              </div>
              <p className="text-[10px] text-moon-200/35 italic mt-1">{meta.desc}</p>
            </div>
          );
        })}
      </div>

      {/* 右侧 · 组合区 · 分子链搭建 */}
      <div className="lg:col-span-3">
        <GlassPanel padding="md" className="h-full">
          {/* 中心核心节点 · 基础调 */}
          <div className="flex flex-col items-center mb-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center font-display text-2xl border-2 transition-all duration-500"
              style={{
                borderColor: baseSymbol ? baseColor : 'rgba(124,95,191,0.3)',
                color: baseSymbol ? baseColor : 'rgba(216,201,245,0.3)',
                background: baseSymbol ? `${baseColor}15` : 'transparent',
                boxShadow: baseSymbol ? `0 0 16px ${baseColor}40` : 'none',
              }}
            >
              {baseSymbol ?? '?'}
            </div>
            <div className="text-[9px] tracking-[0.3em] text-moon-200/40 mt-1.5 font-mono uppercase">
              Core · 基础调
            </div>
          </div>

          {/* 三层槽位 · 化学键连接 */}
          <div className="space-y-2">
            {LAYER_META.map((meta, idx) => {
              const selected = layerNotesMap[meta.key];
              const isDragOver = dragOverLayer === meta.key;
              return (
                <div key={meta.key}>
                  {/* 化学键连接线 · 层间 */}
                  {idx > 0 && (
                    <div className="flex justify-center my-1">
                      <div
                        className="w-px h-3 transition-all duration-500"
                        style={{
                          background: selected.length
                            ? `linear-gradient(to bottom, ${baseColor}50, ${baseColor}80)`
                            : 'rgba(124,95,191,0.15)',
                        }}
                      />
                    </div>
                  )}
                  <DropSlot
                    label={meta.label}
                    en={meta.en}
                    notes={selected}
                    baseColor={baseColor}
                    isDragOver={isDragOver}
                    onDragOver={(e) => handleDragOver(e, meta.key)}
                    onDragLeave={() => setDragOverLayer(null)}
                    onDrop={(e) => handleDrop(e, meta.key)}
                    onRemove={(noteId) => handleRemove(meta.key, noteId)}
                  />
                </div>
              );
            })}
          </div>

          {/* 提示 */}
          <p className="text-[10px] text-moon-200/35 italic mt-4 text-center">
            每层最多 {MAX_NOTES_PER_LAYER} 种 · 点击积木可移除 · 拖拽改变结构
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 子组件 · 可拖拽原料卡
// ═════════════════════════════════════════════════════════

function DraggableNoteCard({
  note,
  onDragStart,
}: {
  note: ScentNote;
  onDragStart: (e: React.DragEvent) => void;
}) {
  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      className="group relative flex flex-col items-center justify-center aspect-square rounded-md border transition-all duration-300 cursor-grab active:cursor-grabbing hover:scale-105"
      style={{
        borderColor: `${note.color}55`,
        background: `${note.color}12`,
      }}
      title={note.desc}
    >
      <span
        className="font-mono text-[10px] font-semibold leading-none"
        style={{ color: note.color }}
      >
        {note.molecule}
      </span>
      <span className="text-[8px] text-moon-200/50 mt-0.5">{note.label}</span>
    </button>
  );
}

// ═════════════════════════════════════════════════════════
// 子组件 · 拖放槽位 + 积木渲染
// ═════════════════════════════════════════════════════════

function DropSlot({
  label,
  en,
  notes,
  baseColor,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemove,
}: {
  label: string;
  en: string;
  notes: string[];
  baseColor: string;
  isDragOver: boolean;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent) => void;
  onRemove: (noteId: string) => void;
}) {
  return (
    <div
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      className="relative rounded-lg border-2 border-dashed p-2.5 transition-all duration-300"
      style={{
        borderColor: isDragOver
          ? `${baseColor}99`
          : notes.length
            ? `${baseColor}30`
            : 'rgba(124,95,191,0.18)',
        background: isDragOver ? `${baseColor}0a` : 'rgba(255,255,255,0.01)',
      }}
    >
      {/* 槽位标签 */}
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] tracking-[0.2em] text-moon-200/50 font-mono">
          {label} · {en}
        </span>
        <span className="text-[9px] text-moon-200/35 font-mono">
          {notes.length}/{MAX_NOTES_PER_LAYER}
        </span>
      </div>

      {/* 积木列表 · 水平排列 · 化学键连接 */}
      {notes.length > 0 ? (
        <div className="flex items-center gap-1 flex-wrap">
          {notes.map((noteId, i) => {
            const note = getScentNote(noteId);
            if (!note) return null;
            return (
              <div key={noteId} className="flex items-center">
                {i > 0 && (
                  <span
                    className="text-xs mx-0.5 font-mono"
                    style={{ color: `${baseColor}80` }}
                  >
                    —
                  </span>
                )}
                <MoleculeBlock note={note} onRemove={() => onRemove(noteId)} />
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-[10px] text-moon-200/30 italic py-2 text-center">
          拖入{label}原料…
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════
// 子组件 · 分子积木 · 乐高凸点 + 弹性落入动画
// ═════════════════════════════════════════════════════════

function MoleculeBlock({
  note,
  onRemove,
}: {
  note: ScentNote;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="group relative flex flex-col items-center justify-center px-2.5 py-1.5 rounded-md border transition-all duration-300 hover:scale-105 molecule-drop"
      style={{
        borderColor: `${note.color}80`,
        background: `linear-gradient(135deg, ${note.color}22 0%, ${note.color}10 100%)`,
        boxShadow: `0 0 8px ${note.color}30, inset 0 1px 0 ${note.color}40`,
      }}
      title={`点击移除 ${note.label}`}
    >
      {/* 乐高凸点 · 顶部装饰 */}
      <span
        className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-1 rounded-t-sm"
        style={{ background: `${note.color}cc` }}
      />
      {/* 分子符号 */}
      <span
        className="font-mono text-[11px] font-semibold leading-none"
        style={{ color: note.color }}
      >
        {note.molecule}
      </span>
      {/* 原料名 */}
      <span className="text-[8px] text-moon-50/70 mt-0.5">{note.label}</span>
      {/* 移除提示 · hover 显示 */}
      <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-md bg-void-900/60 text-[9px] text-moon-200/70">
        ×
      </span>
    </button>
  );
}
