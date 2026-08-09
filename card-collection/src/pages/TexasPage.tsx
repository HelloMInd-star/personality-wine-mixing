import ComingSoonPage from './ComingSoonPage';

export default function TexasPage() {
  return (
    <ComingSoonPage
      module="texas"
      priority="P2"
      features={[
        '简化 1v1 vs AI',
        '底牌 → 翻牌 → 转牌 → 河牌',
        '三轮跟注 / 加注 / 弃牌决策',
        '行为统计 → 风险偏好与决策速度',
      ]}
    />
  );
}
