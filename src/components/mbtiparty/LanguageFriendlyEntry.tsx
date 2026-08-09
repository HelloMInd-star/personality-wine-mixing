/**
 * LanguageFriendlyEntry · 语言者友好入口
 *
 * 底部交互面板下方的「一起定义下一杯」入口 + 弹窗
 *
 * 设计理念：
 *   "GitHub 是英文的，但创意不是。"
 *   让中文用户/非英文母语者也能低门槛参与共创 · 代理提交 Issue / PR
 *
 * 三种参与方式：
 *   📝 提交中文 Issue → 共创者协助整理成英文后提交
 *   📧 发送需求到邮箱 → 代理创建 Pull Request
 *   🤝 申请语言协作 → 找到匹配的共创者协助翻译
 *
 * 视觉语言：
 *   - 入口为不显眼的暗号式按钮 · 呼应树洞空间的"夜还在写"
 *   - 弹窗为磨砂玻璃 + 金边 · 但语气温暖而非冷峻
 *   - 三个动作按钮可点击 · 当前为占位 · 后续接 Issue/邮箱/协作系统
 */

import { useState } from 'react';
import GlassPanel from '../ui/GlassPanel';

/** 三种参与方式元数据 */
const PARTICIPATION_METHODS = [
  {
    icon: '📝',
    title: '提交中文 Issue',
    desc: '用中文写下你的创意或反馈，共创者会协助整理成英文后提交。',
    cta: '提交创意',
    accent: '#d4af7a',
  },
  {
    icon: '📧',
    title: '发送需求到邮箱',
    desc: '把想法直接发到我们邮箱，由我们代理创建 Pull Request。',
    cta: '联系共创者',
    accent: '#9b7bd4',
  },
  {
    icon: '🤝',
    title: '申请语言协作',
    desc: '找到匹配的共创者协助翻译，让双方都能用最自在的方式共酿。',
    cta: '了解共创者计划',
    accent: '#7c9cbf',
  },
] as const;

export default function LanguageFriendlyEntry() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* 暗号式入口 · 极低存在感 · 呼应树洞空间风格 */}
      <div className="text-center py-4">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="group relative inline-flex flex-col items-center gap-1.5 px-4 py-2 transition-all duration-500"
          aria-label="语言者友好入口"
        >
          <span className="text-[11px] tracking-[0.4em] text-moon-200/30 font-mono transition-colors duration-500 group-hover:text-moon-200/55">
            · 一起定义下一杯 ·
          </span>
          <span className="text-[9px] tracking-[0.5em] text-gold-400/20 font-mono italic transition-opacity duration-700 opacity-60 group-hover:opacity-100">
            🌍 语言者友好入口
          </span>
        </button>
      </div>

      {/* 弹窗 */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
          style={{ background: 'rgba(7, 4, 20, 0.78)', backdropFilter: 'blur(8px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <GlassPanel gold padding="lg">
              {/* 顶部标题区 */}
              <div className="text-center mb-6">
                <div className="text-3xl mb-2">🌍</div>
                <h2 className="font-display text-xl text-gold-sheen tracking-[0.15em]">
                  语言者友好入口
                </h2>
                <p className="text-sm text-moon-200/65 italic mt-2 max-w-md mx-auto">
                  GitHub 是英文的，但创意不是。
                </p>
                <p className="text-[11px] text-moon-200/50 mt-1.5 max-w-lg mx-auto leading-relaxed">
                  如果你更习惯用中文提交创意或反馈，可以通过以下方式参与：
                </p>
              </div>

              {/* 三种参与方式 */}
              <div className="space-y-3 mb-6">
                {PARTICIPATION_METHODS.map((method) => (
                  <div
                    key={method.title}
                    className="rounded-lg p-4 border transition-all duration-400 hover:bg-white/[0.03]"
                    style={{ borderColor: `${method.accent}25` }}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl shrink-0">{method.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div
                          className="font-display text-sm tracking-[0.08em] mb-1"
                          style={{ color: method.accent }}
                        >
                          {method.title}
                        </div>
                        <p className="text-[12px] text-moon-200/60 leading-relaxed">
                          {method.desc}
                        </p>
                        <button
                          type="button"
                          className="mt-2 text-[11px] tracking-[0.2em] font-mono uppercase transition-colors"
                          style={{ color: `${method.accent}cc` }}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 当前为占位 · 后续接 Issue / 邮箱 / 协作系统
                          }}
                        >
                          → {method.cta}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* 底部分隔线 + 温暖标语 */}
              <div className="divider-gold mb-4" />
              <p className="text-center text-[11px] text-moon-200/45 italic tracking-[0.1em]">
                你的创意不需要会英语才能被看见。
              </p>

              {/* 关闭按钮 */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="px-5 py-2 rounded-lg border border-amethyst-500/25 text-moon-200/65 text-[12px] tracking-[0.2em] font-mono uppercase transition-all duration-300 hover:border-amethyst-400/50 hover:text-moon-200/85"
                >
                  收起
                </button>
              </div>
            </GlassPanel>
          </div>
        </div>
      )}
    </>
  );
}
