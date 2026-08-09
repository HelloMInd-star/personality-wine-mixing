/**
 * HostBadge · 主理人徽章
 * 全局右上角常驻 · 48px 圆形 logo + 指示灯
 * 点击展开 HostPanel · 显示页面指引 + 提示词
 * 时段切换时光标滑动 + toast 提示动态交互
 *
 * 无画像时虚线圆 + "镜空" · 引导测评
 * 有画像时原型主色 + code 首字 + 时段指示灯
 */

import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { resolveTimeSlot } from '../../engine/timeEngine';
import { resolveHostState } from '../../engine/hostEngine';
import HostPanel from './HostPanel';

export default function HostBadge() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, manualTimeSlot } = useAppStore();
  const [panelOpen, setPanelOpen] = useState(false);
  const [toastVisible, setToastVisible] = useState(false);
  const [hostPulse, setHostPulse] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevStatusRef = useRef<string | null>(null);

  // 计算主理人状态
  const currentSlot = resolveTimeSlot(new Date(), manualTimeSlot);
  const hostState = resolveHostState(currentSlot.slot, profile, location.pathname);

  // 路由变化时关闭面板 + toast
  useEffect(() => {
    setPanelOpen(false);
    setToastVisible(false);
  }, [location.pathname]);

  // 点击外部关闭面板
  useEffect(() => {
    if (!panelOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [panelOpen]);

  // 时段切换时触发主理人动态 · 光标滑动 + toast 提示
  useEffect(() => {
    // 首次挂载不触发
    if (prevStatusRef.current === null) {
      prevStatusRef.current = hostState.status;
      return;
    }
    if (prevStatusRef.current === hostState.status) return;
    prevStatusRef.current = hostState.status;

    // 触发 logo 滑动脉冲动画
    setHostPulse((p) => p + 1);

    // 面板展开时不显示 toast（面板已能看到状态）
    if (panelOpen) return;

    setToastVisible(true);
    const timer = setTimeout(() => setToastVisible(false), 2800);
    return () => clearTimeout(timer);
  }, [hostState.status, panelOpen]);

  return (
    <div ref={containerRef} className="fixed top-6 right-6 z-30">
      {/* 组件内 keyframes · 不污染全局 index.css */}
      <style>{`
        @keyframes host-shift {
          0% { transform: translateX(0) scale(1); }
          15% { transform: translateX(-5px) scale(0.92); }
          30% { transform: translateX(5px) scale(1.08); }
          50% { transform: translateX(-3px) scale(0.96); }
          70% { transform: translateX(3px) scale(1.04); }
          100% { transform: translateX(0) scale(1); }
        }
        @keyframes host-toast-slide {
          0% { transform: translateX(24px) translateY(-4px); opacity: 0; }
          100% { transform: translateX(0) translateY(0); opacity: 1; }
        }
      `}</style>

      <button
        type="button"
        onClick={() => setPanelOpen((v) => !v)}
        className="relative block cursor-pointer group"
        aria-label={`主理人 · ${hostState.statusLabel}`}
        aria-expanded={panelOpen}
      >
        {/* 主理人 logo · 48px 圆 · key 触发重挂载播放滑动动画 */}
        {hostState.manifested ? (
          <div
            key={hostPulse}
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-lg text-moon-50 transition-all duration-500 group-hover:scale-105"
            style={{
              background: `radial-gradient(circle at 30% 30%, ${hostState.primaryColor}, ${hostState.primaryColor}88)`,
              boxShadow: `0 4px 16px ${hostState.primaryColor}44, inset 0 1px 2px rgba(255,255,255,0.15)`,
              border: '1px solid rgba(240, 198, 116, 0.25)',
              animation: hostPulse > 0 ? 'host-shift 0.6s ease-out' : undefined,
            }}
          >
            {hostState.symbol}
          </div>
        ) : (
          <div
            key={hostPulse}
            className="w-12 h-12 rounded-full flex items-center justify-center font-display text-xs text-moon-200/40 transition-all duration-500 group-hover:scale-105"
            style={{
              border: '1px dashed rgba(216, 201, 245, 0.3)',
              background: 'rgba(15, 10, 30, 0.6)',
              animation: hostPulse > 0 ? 'host-shift 0.6s ease-out' : undefined,
            }}
          >
            空
          </div>
        )}

        {/* 指示灯 · 右下角叠加 · 颜色平滑过渡 */}
        <span
          className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-void-900 transition-all duration-500"
          style={{
            background: hostState.dotColor,
            boxShadow: hostState.dotColor !== 'transparent'
              ? `0 0 8px ${hostState.glowColor}`
              : 'none',
            borderStyle: hostState.dotColor === 'transparent' ? 'dashed' : 'solid',
            borderColor: hostState.dotColor === 'transparent'
              ? 'rgba(216, 201, 245, 0.3)'
              : '#070414',
          }}
        />
      </button>

      {/* 时段切换 toast · 轻量提示 · 自动消失 */}
      {toastVisible && !panelOpen && (
        <div
          className="absolute top-full right-0 mt-3 rounded-xl overflow-hidden"
          style={{
            background: 'rgba(15, 10, 30, 0.92)',
            backdropFilter: 'blur(12px)',
            border: '1px solid rgba(124, 95, 191, 0.2)',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
            animation: 'host-toast-slide 0.3s ease-out',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background: `radial-gradient(ellipse at top right, ${hostState.primaryColor}33, transparent 60%)`,
            }}
          />
          <div className="relative px-4 py-3 min-w-[200px]">
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className="inline-block w-2 h-2 rounded-full animate-breathe"
                style={{
                  background: hostState.dotColor,
                  boxShadow: hostState.dotColor !== 'transparent' ? `0 0 6px ${hostState.glowColor}` : 'none',
                }}
              />
              <span className="text-[10px] tracking-[0.3em] text-moon-200/60 uppercase">
                {hostState.statusLabel}
              </span>
            </div>
            <p className="text-xs text-moon-200/80 italic font-display leading-relaxed">
              「{hostState.statusHint}」
            </p>
          </div>
        </div>
      )}

      {/* 展开浮层 · 点击徽章展开 */}
      {panelOpen && (
        <HostPanel
          hostState={hostState}
          onNavigate={(path) => {
            setPanelOpen(false);
            navigate(path);
          }}
        />
      )}
    </div>
  );
}
