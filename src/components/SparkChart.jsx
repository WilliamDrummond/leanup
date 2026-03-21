import React from 'react';
import { fmtDate, todayStr } from '../lib/utils';

export default function SparkChart({ logs, height = 160 }) {
  const W = 600, H = height, PL = 52, PR = 20, PT = 16, PB = 36;
  const recent = logs.slice(-30);

  if (recent.length < 2) {
    return <div className="empty" style={{ padding: 24 }}>Log at least 2 days to see your chart 📈</div>;
  }

  const weights = recent.map(l => l.weight);
  const minW = Math.min(...weights) - 0.5;
  const maxW = Math.max(...weights) + 0.5;
  const xs = i => PL + (i / (recent.length - 1)) * (W - PL - PR);
  const ys = w => PT + ((maxW - w) / (maxW - minW)) * (H - PT - PB);
  const pts = recent.map((l, i) => [xs(i), ys(l.weight)]);
  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
  const areaPath = linePath + ` L${pts[pts.length-1][0].toFixed(1)},${(H-PB).toFixed(1)} L${PL},${(H-PB).toFixed(1)} Z`;

  const yTicks = [minW, minW + (maxW - minW) * 0.25, minW + (maxW - minW) * 0.5, minW + (maxW - minW) * 0.75, maxW].map(v => ({ v: +v.toFixed(1), y: ys(v) }));
  const xIdxs = recent.length <= 7 ? recent.map((_, i) => i) : [0, Math.floor(recent.length / 3), Math.floor(recent.length * 2 / 3), recent.length - 1];

  const n = pts.length, sx = pts.reduce((s, _, i) => s + i, 0), sy = pts.reduce((s, p) => s + p[1], 0);
  const sxy = pts.reduce((s, p, i) => s + i * p[1], 0), sx2 = pts.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sxy - sx * sy) / (n * sx2 - sx * sx);
  const intercept = (sy - slope * sx) / n;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e8ff47" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#e8ff47" stopOpacity="0" />
          </linearGradient>
        </defs>

        {yTicks.map((t, i) => (
          <g key={`y-${i}`}>
            <line x1={PL} y1={t.y} x2={W - PR} y2={t.y} stroke="#2a2a2a" strokeWidth="1" />
            <text x={PL - 6} y={t.y + 4} textAnchor="end" fill="#666" fontSize="10" fontFamily="DM Mono">{t.v}</text>
          </g>
        ))}

        {xIdxs.map(i => (
          <text key={`x-${i}`} x={xs(i)} y={H - PB + 18} textAnchor="middle" fill="#666" fontSize="10" fontFamily="DM Mono">
            {fmtDate(recent[i].date)}
          </text>
        ))}

        <line x1={xs(0)} y1={intercept} x2={xs(n-1)} y2={slope*(n-1)+intercept} stroke="#ff6b35" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.7" />
        <path d={areaPath} fill="url(#ag)" />
        <path d={linePath} fill="none" stroke="#e8ff47" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {pts.map((p, i) => {
          const isToday = recent[i].date === todayStr();
          return (
            <circle key={`pt-${i}`} cx={p[0]} cy={p[1]} r={isToday ? 5 : 3} fill={isToday ? '#ff6b35' : '#e8ff47'} />
          );
        })}
      </svg>
    </div>
  );
}
