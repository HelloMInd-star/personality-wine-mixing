/**
 * 路由根 · 包裹 Provider + 导航
 */
import { Routes, Route } from 'react-router-dom';
import { CollectionProvider } from './store/collectionStore';
import Navigation from './components/common/Navigation';
import SelectPage from './pages/SelectPage';
import TarotPage from './pages/TarotPage';
import ZodiacPage from './pages/ZodiacPage';
import PokerPage from './pages/PokerPage';
import TexasPage from './pages/TexasPage';
import ResultPage from './pages/ResultPage';

export default function App() {
  return (
    <CollectionProvider>
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<SelectPage />} />
            <Route path="/tarot" element={<TarotPage />} />
            <Route path="/zodiac" element={<ZodiacPage />} />
            <Route path="/poker" element={<PokerPage />} />
            <Route path="/texas" element={<TexasPage />} />
            <Route path="/result" element={<ResultPage />} />
          </Routes>
        </main>
      </div>
    </CollectionProvider>
  );
}
