/**
 * Sidebar · 侧边导航
 * 深空中的星轨 · 鼠标点入时只加深的微妙交互
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

type NavGroup = 'collect' | 'consume' | 'brew' | 'scene';

interface NavItem {
  to: string;
  label: string;
  labelEn: string;
  symbol: string; // 单字符号 · 镜月隐喻
  group: NavGroup;
}

/** 三段式信息架构 · 用户旅程分组（采集→消费→场景） */
const NAV_ITEMS: NavItem[] = [
  // 采集层 · 你是谁
  { to: '/', label: '入口', labelEn: 'Portal', symbol: '月', group: 'collect' },
  { to: '/personality', label: '人格', labelEn: 'Persona', symbol: '镜', group: 'collect' },
  { to: '/cards', label: '牌类', labelEn: 'Cards', symbol: '牌', group: 'collect' },
  { to: '/chess', label: '棋局', labelEn: 'Chess', symbol: '弈', group: 'collect' },
  { to: '/mind', label: '思维库', labelEn: 'Library', symbol: '库', group: 'collect' },
  { to: '/invest', label: '实验室', labelEn: 'Lab', symbol: '验', group: 'collect' },
  { to: '/brew/sandbox', label: '沙盘', labelEn: 'Sandbox', symbol: '沙', group: 'collect' },
  { to: '/poker', label: '扑克', labelEn: 'Poker', symbol: '扑', group: 'collect' },
  // 消费层 · 给自己调什么
  { to: '/menu', label: '酒单', labelEn: 'Menu', symbol: '单', group: 'consume' },
  { to: '/cocktail', label: '调酒', labelEn: 'Elixir', symbol: '杯', group: 'consume' },
  // 酿层 · 创意调制
  { to: '/brew/scent', label: '香', labelEn: 'Scent', symbol: '香', group: 'brew' },
  { to: '/brew/journey', label: '弧', labelEn: 'Journey', symbol: '弧', group: 'brew' },
  { to: '/brew/light', label: '光', labelEn: 'Light', symbol: '光', group: 'brew' },
  { to: '/brew/music', label: '乐', labelEn: 'Music', symbol: '乐', group: 'brew' },
  { to: '/brew/molecular', label: '分子', labelEn: 'Molecule', symbol: '粒', group: 'brew' },
  { to: '/brew/story-preview', label: '叙事', labelEn: 'Ode', symbol: '赋', group: 'brew' },
  { to: '/brew/balance', label: '平衡', labelEn: 'Balance', symbol: '衡', group: 'brew' },
  // 场景层 · 在哪儿喝
  { to: '/mbti-party', label: '酒局', labelEn: 'Party', symbol: '局', group: 'scene' },
  { to: '/tavern', label: '酒馆', labelEn: 'Tavern', symbol: '夜', group: 'scene' },
  { to: '/bar-counter', label: '吧台', labelEn: 'Counter', symbol: '台', group: 'scene' },
];

const GROUP_META: Record<NavGroup, { label: string; labelEn: string }> = {
  collect: { label: '采集', labelEn: 'COLLECT' },
  consume: { label: '消费', labelEn: 'CONSUME' },
  brew: { label: '酿', labelEn: 'BREW' },
  scene: { label: '场景', labelEn: 'SCENE' },
};

const GROUP_ORDER: NavGroup[] = ['collect', 'consume', 'brew', 'scene'];

export default function Sidebar() {
  const { profile, vector, username, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-20 lg:w-64 glass border-r border-amethyst-500/15 flex-col z-20">
      {/* 品牌标 · 镜月 */}
      <div className="px-4 lg:px-6 py-7 flex items-center gap-3">
        <div className="relative w-10 h-10 shrink-0 animate-breathe">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-moon-50 via-amethyst-400 to-amethyst-600 shadow-glow-amethyst" />
          <div className="absolute inset-[3px] rounded-full bg-void-gradient opacity-90" />
          <div className="absolute inset-0 rounded-full border border-gold-400/40" />
        </div>
        <div className="hidden lg:block">
          <div className="font-display text-lg text-gold-sheen leading-none">
            觉醉
          </div>
          <div className="text-[10px] text-amethyst-400 tracking-[0.3em] mt-1">
            人格调酒
          </div>
        </div>
      </div>

      <div className="divider-gold mx-4 lg:mx-6" />

      {/* 导航 · 星轨 · 三段式分组（采集→消费→场景） */}
      <nav className="flex-1 px-2 lg:px-3 py-4 flex flex-col overflow-y-auto">
        {GROUP_ORDER.map((group, gi) => {
          const items = NAV_ITEMS.filter((i) => i.group === group);
          // 消费层在无任何采集产物时灰显（仍可点，弱化引导）
          const dimmed = group === 'consume' && !profile && !vector;
          return (
            <div key={group} className={gi > 0 ? 'mt-3' : ''}>
              <div className="px-3 pt-2 pb-1 text-[10px] tracking-[0.3em] text-amethyst-400/50 uppercase">
                {GROUP_META[group].labelEn}
              </div>
              <div className={`flex flex-col gap-1 transition-opacity duration-300 ${dimmed ? 'opacity-40' : ''}`}>
                {items.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/'}
                    className={({ isActive }) =>
                      `nav-item flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm ${
                        isActive ? 'active' : 'text-moon-200/70'
                      }`
                    }
                  >
                    <span className="w-6 h-6 shrink-0 flex items-center justify-center font-display text-base text-gold-400/80">
                      {item.symbol}
                    </span>
                    <div className="hidden lg:block leading-tight">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-[10px] text-amethyst-400/60 tracking-widest uppercase">
                        {item.labelEn}
                      </div>
                    </div>
                  </NavLink>
                ))}
              </div>
              {gi < GROUP_ORDER.length - 1 && (
                <div className="divider-gold mx-4 lg:mx-6 mt-3 opacity-50" />
              )}
            </div>
          );
        })}
      </nav>

      {/* 画像状态 · 底部镜像 */}
      <div className="hidden lg:block px-4 pb-6">
        <div className="divider-gold mb-4" />
        <div className="glass rounded-xl p-3 text-xs">
          {profile ? (
            <>
              <div className="text-moon-200/60 mb-1">当前画像</div>
              <div className="text-gold-sheen font-medium font-display">
                {profile.archetype.name}
              </div>
              <div className="text-[10px] text-amethyst-400/70 mt-1 leading-relaxed">
                {profile.archetype.tagline}
              </div>
            </>
          ) : vector ? (
            <>
              <div className="text-moon-200/60 mb-1">牌类向量已采集</div>
              <div className="text-gold-sheen font-medium font-display">六维契约</div>
              <div className="text-[10px] text-amethyst-400/70 mt-1">
                前往调酒 · 看向量织酒
              </div>
            </>
          ) : (
            <>
              <div className="text-moon-200/50">画像未启</div>
              <div className="text-[10px] text-amethyst-400/50 mt-1">
                前往人格页 · 织一张属于你的夜
              </div>
            </>
          )}
        </div>
        {/* 用户信息 + 登出 */}
        <div className="mt-2 flex items-center justify-between px-1">
          <span className="text-[10px] text-moon-200/40 truncate max-w-[120px]">
            {username}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="text-[10px] text-amethyst-400/40 hover:text-gold-400 transition-colors duration-300 tracking-wider"
          >
            登出
          </button>
        </div>
      </div>
    </aside>
  );
}
