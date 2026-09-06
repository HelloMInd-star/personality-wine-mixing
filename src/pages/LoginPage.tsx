/**
 * LoginPage · 觉醉·镜中 · 登入镜中
 *
 * 深空沉浸式登录页 · 无侧栏/无星野/无主理人
 * Mock 鉴权：用户名+密码非空即可登录，持久化到 localStorage
 * 后端就绪后替换 login() 为真实 API 调用
 *
 * 视觉语言：深空暗紫 + 情绪光斑 · 觉醉感官情绪探索游戏 · 与 TavernPage/CocktailPage 同语
 */

import { useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // 星尘 · useMemo 固定随机值, 避免输入触发 rerender 时星点跳位
  const stardust = useMemo(
    () =>
      Array.from({ length: 20 }).map((_, i) => ({
        size: 2 + Math.random() * 3,
        left: Math.random() * 100,
        top: Math.random() * 100,
        color: i % 3 === 0 ? '#f0c674' : i % 3 === 1 ? '#9b7bd4' : '#d8c9f5',
        delay: Math.random() * 4,
        duration: 3 + Math.random() * 3,
        opacity: 0.3 + Math.random() * 0.4,
      })),
    [],
  );

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('请输入用户名与密码');
      return;
    }

    setLoading(true);

    // Mock 鉴权 · 模拟 600ms 网络延迟 · 后端就绪后替换为真实 API
    setTimeout(() => {
      login(username.trim());
      setLoading(false);
      navigate('/', { replace: true });
    }, 600);
  };

  // 新客 · 一键入镜 (跳过填表, 复用 mock 鉴权时序)
  const handleGuestLogin = () => {
    setError('');
    setLoading(true);
    setTimeout(() => {
      login('新客');
      setLoading(false);
      navigate('/', { replace: true });
    }, 600);
  };

  return (
    <div className="fixed inset-0 bg-void-gradient flex flex-col items-center justify-center overflow-hidden">
      {/* 背景星尘 · 浮动光点 */}
      <div className="absolute inset-0 pointer-events-none">
        {stardust.map((s, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle-slow"
            style={{
              width: `${s.size}px`,
              height: `${s.size}px`,
              left: `${s.left}%`,
              top: `${s.top}%`,
              background: s.color,
              animationDelay: `${s.delay}s`,
              animationDuration: `${s.duration}s`,
              opacity: s.opacity,
            }}
          />
        ))}
      </div>

      {/* 登录容器 */}
      <div className="relative z-10 w-full max-w-sm px-6 animate-orbit-fade-up">
        {/* 镜月 · 品牌标识 */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-moon-50 via-amethyst-400 to-amethyst-600 shadow-glow-amethyst animate-breathe">
              <div className="absolute inset-[5px] rounded-full bg-void-gradient opacity-90" />
              <div className="absolute inset-0 rounded-full border border-gold-400/40" />
              <div className="absolute -inset-2 rounded-full border border-amethyst-500/20 animate-twinkle-slow" />
            </div>
          </div>

          <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3 flex items-center justify-center gap-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-orbit-accent animate-orbit-pulse shadow-glow-accent" />
            觉醉 · 感官情绪探索
          </div>
          <h1 className="font-display text-4xl text-gold-sheen text-shadow-glow-gold">
            觉醉
          </h1>
          <p className="mt-2 text-moon-200/50 text-sm tracking-wider">
            登入镜中 · 以人格为引
          </p>
          <div className="mt-3 flex items-center justify-center gap-3 text-[10px] tracking-[0.35em] text-moon-200/40">
            <span>织镜</span>
            <span className="text-gold-400/30">·</span>
            <span>调酒</span>
            <span className="text-gold-400/30">·</span>
            <span>入局</span>
          </div>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="glass glass-gold rounded-capsule p-8 space-y-5">
          <div className="text-center mb-2">
            <div className="text-[10px] tracking-[0.4em] text-amethyst-400/60 uppercase">
              Sign In
            </div>
          </div>

          {/* 用户名 */}
          <div>
            <label
              htmlFor="login-username"
              className="block text-[10px] tracking-[0.3em] text-amethyst-400/70 mb-2 uppercase"
            >
              用户名
            </label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={(e) => { setUsername(e.target.value); if (error) setError(''); }}
              placeholder="你的代号"
              autoComplete="username"
              autoFocus
              className="w-full bg-void-700/60 border border-amethyst-500/20 rounded-capsule px-4 py-3 text-moon-50 placeholder:text-moon-200/30 focus:outline-none focus:border-gold-400/50 focus:shadow-[0_0_16px_rgba(155,123,212,0.25)] transition-all duration-orbit-mid ease-orbit text-sm"
            />
          </div>

          {/* 密码 */}
          <div>
            <label
              htmlFor="login-password"
              className="block text-[10px] tracking-[0.3em] text-amethyst-400/70 mb-2 uppercase"
            >
              密码
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); if (error) setError(''); }}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-void-700/60 border border-amethyst-500/20 rounded-capsule px-4 py-3 text-moon-50 placeholder:text-moon-200/30 focus:outline-none focus:border-gold-400/50 focus:shadow-[0_0_16px_rgba(155,123,212,0.25)] transition-all duration-orbit-mid ease-orbit text-sm"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-orbit-alert text-xs text-center animate-orbit-fade-up">
              {error}
            </div>
          )}

          {/* 登入按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-sheen text-void-900 font-semibold py-3 rounded-capsule tracking-wide transition-all duration-orbit-mid ease-orbit hover:shadow-glow-gold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-void-900/30 border-t-void-900 rounded-full animate-spin" />
                登入中...
              </span>
            ) : (
              '登入镜中'
            )}
          </button>

          {/* 底部提示 */}
          <div className="text-center pt-2">
            <button
              type="button"
              onClick={handleGuestLogin}
              disabled={loading}
              className="text-[11px] text-amethyst-400/50 hover:text-gold-400 transition-colors duration-orbit-mid ease-orbit tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '入镜中...' : '新客 · 初启'}
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[10px] text-moon-200/25 tracking-wider">
          无需注册 · 起个代号即可入镜
        </p>
      </div>
    </div>
  );
}