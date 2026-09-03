/**
 * App · 觉醉 感官情绪探索游戏
 * 路由与布局 · 深空铺底，星光侧立，镜与情绪悬浮其间
 *
 * 工程化降债：
 *   - 路由级 React.lazy 拆分 · 首屏仅加载 HomePage
 *   - ErrorBoundary 包路由 · 局部崩溃不白屏
 *   - Suspense fallback 走深空加载态
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Outlet, useLocation } from 'react-router-dom';
import { AppStoreProvider } from './store/appStore';
import StarfieldBackground from './components/layout/StarfieldBackground';
import Sidebar from './components/layout/Sidebar';
import MobileTabBar from './components/layout/MobileTabBar';
import HostBadge from './components/host/HostBadge';
import ErrorBoundary from './components/layout/ErrorBoundary';
import AuthGuard from './components/auth/AuthGuard';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';

// 路由级懒加载 · 不进首屏包
const PreludePage = lazy(() => import('./pages/PreludePage'));
const HubPage = lazy(() => import('./pages/HubPage'));
const ExplorePage = lazy(() => import('./pages/ExplorePage'));
const PersonalityPage = lazy(() => import('./pages/PersonalityPage'));
const CocktailPage = lazy(() => import('./pages/CocktailPage'));
const MenuPage = lazy(() => import('./pages/MenuPage'));
const BrewJourneyPage = lazy(() => import('./pages/BrewJourneyPage'));
const BrewLightPage = lazy(() => import('./pages/BrewLightPage'));
const BrewMusicPage = lazy(() => import('./pages/BrewMusicPage'));
const BrewScentPage = lazy(() => import('./pages/BrewScentPage'));
const BrewMolecularPage = lazy(() => import('./pages/BrewMolecularPage'));
const StoryPreviewPage = lazy(() => import('./pages/StoryPreviewPage'));
const TavernPage = lazy(() => import('./pages/TavernPage'));
const BarCounterPage = lazy(() => import('./pages/BarCounterPage'));
const CardsPage = lazy(() => import('./pages/CardsPage'));
const MbtiPartyPage = lazy(() => import('./pages/MbtiPartyPage'));
const ChessPage = lazy(() => import('./pages/ChessPage'));
const MindLibraryPage = lazy(() => import('./pages/MindLibraryPage'));
const InvestPage = lazy(() => import('./pages/InvestPage'));
const SandboxPage = lazy(() => import('./pages/SandboxPage'));
const BalancePage = lazy(() => import('./pages/BalancePage'));
const PokerPage = lazy(() => import('./pages/PokerPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

/** Suspense fallback · 深空加载态 */
function RouteFallback() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center animate-fade-in">
      <div className="relative w-12 h-12 mb-4">
        <div className="absolute inset-0 rounded-full border border-amethyst-500/30" />
        <div className="absolute inset-0 rounded-full border-t border-gold-400/70 animate-spin" />
        <div
          className="absolute inset-2 rounded-full animate-breathe"
          style={{ background: 'radial-gradient(circle, rgba(240,198,116,0.4), transparent 70%)' }}
        />
      </div>
      <div className="text-[10px] tracking-[0.5em] text-amethyst-400/60 uppercase font-mono">
        Loading
      </div>
    </div>
  );
}

export default function App() {
  const { pathname } = useLocation();
  // 沉浸路由 · 预告/星球枢纽/五维探索/登录 · 全屏 · 不渲染侧栏/主理人/星野背景
  const isImmersive =
    pathname.startsWith('/prelude') ||
    pathname.startsWith('/hub') ||
    pathname.startsWith('/explore') ||
    pathname.startsWith('/login');

  return (
    <AppStoreProvider>
      {!isImmersive && <StarfieldBackground />}
      {!isImmersive && <Sidebar />}
      {!isImmersive && <MobileTabBar />}
      {!isImmersive && <HostBadge />}
      <main className={isImmersive ? 'relative' : 'ml-0 md:ml-20 lg:ml-64 pb-16 md:pb-0 min-h-screen relative'}>
        <ErrorBoundary>
          <Suspense fallback={<RouteFallback />}>
            <Routes>
              {/* 登录 · 沉浸 · 无需鉴权 */}
              <Route path="/login" element={<LoginPage />} />
              {/* 受保护路由 · 需登录 */}
              <Route element={<AuthGuard><Outlet /></AuthGuard>}>
                <Route path="/" element={<HomePage />} />
                <Route path="/prelude" element={<PreludePage />} />
                <Route path="/hub" element={<HubPage />} />
                <Route path="/explore" element={<ExplorePage />} />
                <Route path="/personality" element={<PersonalityPage />} />
                <Route path="/cards" element={<CardsPage />} />
                <Route path="/cocktail" element={<CocktailPage />} />
                <Route path="/menu" element={<MenuPage />} />
                <Route path="/brew/journey" element={<BrewJourneyPage />} />
                <Route path="/brew/light" element={<BrewLightPage />} />
                <Route path="/brew/music" element={<BrewMusicPage />} />
                <Route path="/brew/scent" element={<BrewScentPage />} />
                <Route path="/brew/molecular" element={<BrewMolecularPage />} />
                <Route path="/brew/story-preview" element={<StoryPreviewPage />} />
                <Route path="/tavern" element={<TavernPage />} />
                <Route path="/bar-counter" element={<BarCounterPage />} />
                <Route path="/chess" element={<ChessPage />} />
                <Route path="/mbti-party" element={<MbtiPartyPage />} />
                <Route path="/mind" element={<MindLibraryPage />} />
                <Route path="/invest" element={<InvestPage />} />
                <Route path="/brew/sandbox" element={<SandboxPage />} />
                <Route path="/brew/balance" element={<BalancePage />} />
                <Route path="/poker" element={<PokerPage />} />
                {/* 404 兜底 · 此路无月 */}
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </AppStoreProvider>
  );
}
