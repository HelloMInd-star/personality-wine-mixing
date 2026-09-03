/**
 * LoginPage · 登入镜中
 *
 * 深空沉浸式登录页 · 无侧栏/无星野/无主理人
 * Mock 鉴权：用户名+密码非空即可登录，持久化到 localStorage
 * 后端就绪后替换 login() 为真实 API 调用
 */

import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore } from '../store/appStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAppStore();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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

  return (
    <div className="fixed inset-0 bg-void-gradient flex flex-col items-center justify-center overflow-hidden">
      {/* 背景星尘 · 浮动光点 */}
      <div className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-twinkle-slow"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              background: i % 3 === 0 ? '#f0c674' : i % 3 === 1 ? '#9b7bd4' : '#d8c9f5',
              animationDelay: `${Math.random() * 4}s`,
              animationDuration: `${3 + Math.random() * 3}s`,
              opacity: 0.3 + Math.random() * 0.4,
            }}
          />
        ))}
      </div>

      {/* 登录容器 */}
      <div className="relative z-10 w-full max-w-sm px-6 animate-fade-in">
        {/* 镜月 · 品牌标识 */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-moon-50 via-amethyst-400 to-amethyst-600 shadow-glow-amethyst animate-breathe">
              <div className="absolute inset-[5px] rounded-full bg-void-gradient opacity-90" />
              <div className="absolute inset-0 rounded-full border border-gold-400/40" />
              <div className="absolute -inset-2 rounded-full border border-amethyst-500/20 animate-twinkle-slow" />
            </div>
          </div>

          <div className="text-[11px] tracking-[0.6em] text-amethyst-400/80 uppercase mb-3">
            星云 · 人格调酒台
          </div>
          <h1 className="font-display text-4xl text-gold-sheen text-shadow-glow-gold">
            觉醉
          </h1>
          <p className="mt-2 text-moon-200/50 text-sm tracking-wider">
            登入镜中 · 以人格为引
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleSubmit} className="glass glass-gold rounded-2xl p-8 space-y-5">
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
              onChange={(e) => setUsername(e.target.value)}
              placeholder="你的代号"
              autoComplete="username"
              autoFocus
              className="w-full bg-void-700/60 border border-amethyst-500/20 rounded-xl px-4 py-3 text-moon-50 placeholder:text-moon-200/30 focus:outline-none focus:border-gold-400/50 transition-colors duration-300 text-sm"
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
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              className="w-full bg-void-700/60 border border-amethyst-500/20 rounded-xl px-4 py-3 text-moon-50 placeholder:text-moon-200/30 focus:outline-none focus:border-gold-400/50 transition-colors duration-300 text-sm"
            />
          </div>

          {/* 错误提示 */}
          {error && (
            <div className="text-rose-400/80 text-xs text-center animate-fade-in">
              {error}
            </div>
          )}

          {/* 登入按钮 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold-sheen text-void-900 font-semibold py-3 rounded-xl tracking-wide transition-all duration-300 hover:shadow-glow-gold disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
              onClick={() => {
                setError('');
                // 新客 · 自动填入默认用户名并登录
                setUsername('新客');
                setPassword('juezui');
              }}
              className="text-[11px] text-amethyst-400/50 hover:text-gold-400 transition-colors duration-300 tracking-wider"
            >
              新客 · 初启
            </button>
          </div>
        </form>

        <p className="mt-6 text-center text-[10px] text-moon-200/25 tracking-wider">
          Mock 鉴权 · 任意用户名密码即可登入
        </p>
      </div>
    </div>
  );
}