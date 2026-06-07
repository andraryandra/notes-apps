import type { ChartSegment } from '../utils/dashboardStats';
import { useI18n } from '../i18n/useI18n';

interface DonutProps {
  segments: ChartSegment[];
  size?: number;
  stroke?: number;
  centerLabel?: string;
  centerValue?: string | number;
  emptyLabel?: string;
}

export function DonutChart({
  segments,
  size = 160,
  stroke = 22,
  centerLabel,
  centerValue,
  emptyLabel = '',
}: DonutProps) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const c = 2 * Math.PI * r;

  if (total === 0) {
    return (
      <div className="dash-donut dash-donut--empty" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="var(--border)"
            strokeWidth={stroke}
            strokeDasharray="4 6"
          />
        </svg>
        <div className="dash-donut-center">
          <span className="dash-donut-center-value">0</span>
          <span className="dash-donut-center-label">{emptyLabel}</span>
        </div>
      </div>
    );
  }

  let offset = 0;

  return (
    <div className="dash-donut" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {segments.map((seg) => {
          const pct = seg.value / total;
          const dash = pct * c;
          const gap = c - dash;
          const el = (
            <circle
              key={seg.id}
              cx={cx}
              cy={cy}
              r={r}
              fill="none"
              stroke={seg.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${cx} ${cy})`}
              className="dash-donut-segment"
            />
          );
          offset += dash;
          return el;
        })}
      </svg>
      {(centerLabel || centerValue !== undefined) && (
        <div className="dash-donut-center">
          {centerValue !== undefined && (
            <span className="dash-donut-center-value">{centerValue}</span>
          )}
          {centerLabel && <span className="dash-donut-center-label">{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

interface BarProps {
  data: { label: string; notes: number; cards: number; total: number; dayStart: number }[];
}

export function ActivityBarChart({ data }: BarProps) {
  const { t } = useI18n();
  const max = Math.max(1, ...data.map((d) => d.total));

  return (
    <div className="dash-activity-chart">
      <div className="dash-activity-bars">
        {data.map((d) => {
          const h = Math.max(4, (d.total / max) * 100);
          const noteH = d.total ? (d.notes / d.total) * h : 0;
          const cardH = h - noteH;
          return (
            <div key={d.dayStart} className="dash-activity-col">
              <div className="dash-activity-bar-wrap" title={t('dashboard.activityCount', { count: d.total })}>
                <div className="dash-activity-bar" style={{ height: `${h}%` }}>
                  {d.cards > 0 && (
                    <div className="dash-activity-seg dash-activity-seg--card" style={{ flex: cardH }} />
                  )}
                  {d.notes > 0 && (
                    <div
                      className="dash-activity-seg dash-activity-seg--note"
                      style={{ flex: noteH || h }}
                    />
                  )}
                  {d.total === 0 && <div className="dash-activity-seg dash-activity-seg--empty" />}
                </div>
              </div>
              <span className="dash-activity-label">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="dash-activity-legend">
        <span>
          <i className="dash-legend-dot dash-legend-dot--note" /> {t('dashboard.chartNotes')}
        </span>
        <span>
          <i className="dash-legend-dot dash-legend-dot--card" /> {t('dashboard.chartTodos')}
        </span>
      </div>
    </div>
  );
}

interface HBarProps {
  items: { name: string; count: number }[];
  color?: string;
  emptyLabel?: string;
}

export function HorizontalBarChart({ items, color = 'var(--accent)', emptyLabel }: HBarProps) {
  const max = Math.max(1, ...items.map((i) => i.count));

  if (items.length === 0) {
    return <p className="dashboard-empty">{emptyLabel}</p>;
  }

  return (
    <div className="dash-hbar-chart">
      {items.map((item) => (
        <div key={item.name} className="dash-hbar-row">
          <span className="dash-hbar-label" title={item.name}>
            {item.name}
          </span>
          <div className="dash-hbar-track">
            <div
              className="dash-hbar-fill"
              style={{ width: `${(item.count / max) * 100}%`, background: color }}
            />
          </div>
          <span className="dash-hbar-value">{item.count}</span>
        </div>
      ))}
    </div>
  );
}

export function SegmentLegend({ segments }: { segments: ChartSegment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <ul className="dash-segment-legend">
      {segments.map((seg) => (
        <li key={seg.id}>
          <span className="dash-segment-dot" style={{ background: seg.color }} />
          <span className="dash-segment-name">{seg.label}</span>
          <span className="dash-segment-pct">{Math.round((seg.value / total) * 100)}%</span>
          <strong>{seg.value}</strong>
        </li>
      ))}
    </ul>
  );
}
