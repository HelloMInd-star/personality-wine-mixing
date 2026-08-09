import ComingSoonPage from './ComingSoonPage';

export default function ZodiacPage() {
  return (
    <ComingSoonPage
      module="zodiac"
      priority="P1"
      features={[
        '输入出生日期 / 时间 / 城市',
        '计算太阳 · 月亮 · 上升 · 水星 · 火星 · 金星',
        'Canvas 绘制简版星盘 12 宫',
        '六星体 × 四象 → 人格权重',
      ]}
    />
  );
}
