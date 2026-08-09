import ComingSoonPage from './ComingSoonPage';

export default function PokerPage() {
  return (
    <ComingSoonPage
      module="poker"
      priority="P2"
      features={[
        '标准 52 张扑克',
        '洗牌 → 发 5 张 → 逐张翻牌',
        '自动判定 9 种牌型',
        '牌型 → 人格权重映射',
      ]}
    />
  );
}
