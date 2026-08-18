/**
 * ErrorBoundary · 路由级错误边界
 *
 * 捕获子树渲染异常 · 避免局部崩溃导致整页白屏
 * 深空紫金视觉语言 · 提供重试入口
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  /** 自定义 fallback · 不传用默认 */
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface State {
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // 控制台留痕 · 后续接 trackFeedback 同款上报通道
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback(error, this.reset);

    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-6 animate-fade-in">
        <div className="text-[10px] tracking-[0.5em] text-amethyst-400/60 uppercase font-mono mb-3">
          Signal Lost
        </div>
        <div className="font-display text-3xl text-gold-sheen text-shadow-glow-gold tracking-[0.15em] mb-3">
          星轨断开
        </div>
        <p className="text-sm text-moon-200/60 italic max-w-md mb-6 leading-relaxed">
          这一帧的渲染失焦了 · 可以重试 · 或回到首页继续旅程。
        </p>
        <pre className="text-[10px] text-amethyst-300/50 font-mono max-w-md mb-6 overflow-auto max-h-32 px-4 py-2 rounded-lg border border-amethyst-500/20 bg-amethyst-500/5">
          {error.message}
        </pre>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={this.reset}
            className="px-5 py-2 rounded-lg border border-gold-400/50 hover:border-gold-400 text-gold-sheen text-xs tracking-[0.3em] transition-colors"
          >
            ↻ 重试
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.hash = '/';
            }}
            className="px-5 py-2 rounded-lg border border-amethyst-500/30 hover:border-amethyst-400 text-moon-200/70 text-xs tracking-[0.3em] transition-colors"
          >
            回到首页
          </button>
        </div>
      </div>
    );
  }
}
