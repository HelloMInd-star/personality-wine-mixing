/**
 * MobileTabBar · 移动端底部导航栏
 *
 * 在屏幕 < 768px 时替代 Sidebar，显示 5 个核心入口 + 用户状态
 * 遵循深空紫金视觉语言 · 磨砂玻璃底栏
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';

interface TabItem {
  to: string;
  symbol: string;
  label: string;
}

const TABS: TabItem[] = [
  { to: '/', symbol: '月', label: '首页' },
  { to: '/personality', symbol: '镜', label: '人格' },
  { to: '/cocktail', symbol: '杯', label: '调酒' },
  { to: '/chess', symbol: '弈', label: '棋局' },
  { to: '/tavern', symbol: '夜', label: '酒馆' },
];

export default function MobileTabBar() {
  const { username, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <nav className="mobile-tabbar" role="navigation" aria-label="移动端导航">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) =>
            `mobile-tabbar-item ${isActive ? 'active' : ''}`
          }
        >
          <span className="mobile-tabbar-symbol">{tab.symbol}</span>
          <span className="mobile-tabbar-label">{tab.label}</span>
        </NavLink>
      ))}

      {/* 用户菜单 */}
      <div className="mobile-tabbar-item mobile-tabbar-user">
        <span className="mobile-tabbar-symbol">
          {username ? username.slice(0, 1) : '?'}
        </span>
        <span className="mobile-tabbar-label" onClick={handleLogout}>
          登出
        </span>
      </div>

      <style>{`
        .mobile-tabbar {
          display: none;
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 50;
          height: 56px;
          background: rgba(7, 4, 20, 0.92);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border-top: 1px solid rgba(155, 123, 212, 0.15);
          padding: 0 4px;
          padding-bottom: env(safe-area-inset-bottom, 0);
          justify-content: space-around;
          align-items: center;
        }
        @media (max-width: 767px) {
          .mobile-tabbar { display: flex; }
        }
        .mobile-tabbar-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 2px; padding: 4px 8px; min-width: 48px;
          text-decoration: none; color: rgba(216, 201, 245, 0.45);
          transition: color 0.2s ease;
          border-radius: 8px;
          cursor: pointer;
          background: none; border: none; font: inherit;
        }
        .mobile-tabbar-item.active {
          color: #f0c674;
        }
        .mobile-tabbar-item.active .mobile-tabbar-symbol {
          text-shadow: 0 0 8px rgba(240, 198, 116, 0.5);
        }
        .mobile-tabbar-symbol {
          font-size: 18px; font-family: 'Noto Serif SC', serif;
          line-height: 1;
        }
        .mobile-tabbar-label {
          font-size: 9px; letter-spacing: 0.15em;
          line-height: 1;
        }
        .mobile-tabbar-user {
          color: rgba(155, 123, 212, 0.5);
          cursor: pointer;
        }
        .mobile-tabbar-user:hover {
          color: #ef4444;
        }
      `}</style>
    </nav>
  );
}