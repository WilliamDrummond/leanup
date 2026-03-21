import React from 'react';
import { buildLB, todayStr, fmtDate, daysBetween, pctLost } from '../lib/utils';

export default function Leaderboard({ users, logs, currentUser, contest }) {
  const lb = buildLB(users, logs);
  const medals = ['🥇', '🥈', '🥉'];
  const rankCls = ['gold', 'silver', 'bronze'];

  const pastDates = [];
  if (contest.startDate) {
    for (let i = 0; i < 56; i++) {
      const d = new Date(contest.startDate);
      d.setDate(d.getDate() + i);
      const ds = d.toISOString().slice(0, 10);
      if (ds <= todayStr()) pastDates.push(ds);
    }
  }
  const show14 = pastDates.slice(-14);

  if (!lb.length) {
    return (
      <div className="card">
        <div className="empty">No participants have set their starting weight yet.</div>
      </div>
    );
  }

  const COLORS = ['#e8ff47','#ff6b35','#60a5fa','#f472b6','#34d399','#a78bfa','#fb923c','#22d3ee'];

  function buildSeries(u) {
    const myLogs = logs
      .filter(l => l.userId === u.id)
      .sort((a, b) => a.date.localeCompare(b.date));
    if (!myLogs.length || !u.startWeight || !contest.startDate) return [];
    return myLogs.map(l => {
      const day = daysBetween(contest.startDate, l.date) + 1;
      const pct = pctLost(u.startWeight, l.weight);
      return { day, pct };
    }).filter(p => p.day >= 1);
  }

  function ComparisonChart() {
    const W = 600, H = 220, PL = 48, PR = 20, PT = 16, PB = 36;
    const allSeries = lb.map((u, i) => ({ u, color: COLORS[i % COLORS.length], pts: buildSeries(u) })).filter(s => s.pts.length >= 1);

    if (allSeries.length === 0) {
      return <div className="empty" style={{ padding: 24 }}>Log weight data to see the race chart!</div>;
    }

    const allPcts = allSeries.flatMap(s => s.pts.map(p => p.pct));
    const allDays = allSeries.flatMap(s => s.pts.map(p => p.day));
    const maxPct = Math.max(...allPcts, 0.5);
    const minPct = Math.min(...allPcts, 0);
    const maxDay = Math.max(...allDays, 7);

    const xs = d => PL + ((d - 1) / Math.max(maxDay - 1, 1)) * (W - PL - PR);
    const ys = p => PT + ((maxPct - p) / Math.max(maxPct - minPct, 0.1)) * (H - PT - PB);

    const yStep = maxPct <= 2 ? 0.5 : maxPct <= 5 ? 1 : maxPct <= 10 ? 2 : 5;
    const yTicks = [];
    for (let v = 0; v <= maxPct + yStep; v += yStep) yTicks.push(+v.toFixed(1));

    const xTicks = [1, 8, 15, 22, 29, 36, 43, 50, 56].filter(d => d <= maxDay + 3);

    return (
      <div>
        <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', display: 'block' }} preserveAspectRatio="none">
          {yTicks.map((v, i) => (
            <g key={`y-${i}`}>
              <line x1={PL} y1={ys(v)} x2={W - PR} y2={ys(v)} stroke={v === 0 ? '#3a3a3a' : '#222'} strokeWidth={v === 0 ? 1.5 : 1} />
              <text x={PL - 6} y={ys(v) + 4} textAnchor="end" fill="#555" fontSize="10" fontFamily="DM Mono">{`${v}%`}</text>
            </g>
          ))}
          {xTicks.map((d, i) => (
            <g key={`x-${i}`}>
              <line x1={xs(d)} y1={PT} x2={xs(d)} y2={H - PB} stroke="#222" strokeWidth="1" strokeDasharray="3 3" />
              <text x={xs(d)} y={H - PB + 16} textAnchor="middle" fill="#555" fontSize="9" fontFamily="DM Mono">{`W${Math.ceil(d / 7)}`}</text>
            </g>
          ))}
          <line x1={PL} y1={ys(0)} x2={W - PR} y2={ys(0)} stroke="#3a3a3a" strokeWidth="1.5" />

          {allSeries.map(({ u, color, pts }) => {
            if (pts.length < 1) return null;
            const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xs(p.day).toFixed(1)},${ys(p.pct).toFixed(1)}`).join(' ');
            const isMe = u.id === currentUser.id;
            return (
              <g key={u.id}>
                <path d={path} fill="none" stroke={color} strokeWidth={isMe ? 3 : 2} strokeLinecap="round" strokeLinejoin="round" opacity={isMe ? 1 : 0.75} />
                {pts.length > 0 && (
                  <circle cx={xs(pts[pts.length-1].day)} cy={ys(pts[pts.length-1].pct)} r={isMe ? 5 : 4} fill={color} />
                )}
              </g>
            );
          })}
        </svg>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px 16px', marginTop: 12, paddingLeft: PL / 3 }}>
          {allSeries.map(({ u, color }) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 20, height: 3, background: color, borderRadius: 2, flexShrink: 0, outline: u.id === currentUser.id ? `2px solid ${color}` : 'none', outlineOffset: 2 }}></div>
              <span style={{ fontSize: 12, color: u.id === currentUser.id ? color : '#999', fontWeight: u.id === currentUser.id ? 600 : 400 }}>{u.name || u.username}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">🏆 Leaderboard</div>
        <p className="tip" style={{ marginBottom: 16 }}>Ranked by % of starting body weight lost - totally fair regardless of how big or small you started.</p>
        {lb.map((u, i) => {
          const cls = rankCls[i] || '';
          const color = COLORS[i % COLORS.length];
          return (
            <div key={u.id} className={`lb-row${cls ? ' ' + cls : ''}`} style={{ borderLeft: `3px solid ${color}` }}>
              <div className={`lb-rank${cls ? ' ' + cls : ''}`}>{medals[i] || `#${i + 1}`}</div>
              <div>
                <div className="lb-name">
                  {u.name || u.username}
                  {u.id === currentUser.id && <span style={{ fontSize: 11, color: 'var(--accent)', marginLeft: 8 }}>← you</span>}
                </div>
                <div className="lb-dots">
                  {show14.map(d => (
                    <div key={d} className={`dot${u.logDates.has(d) ? (d === todayStr() ? ' today' : ' on') : ''}`} title={fmtDate(d)}></div>
                  ))}
                </div>
              </div>
              <div className="lb-right">
                <div className="lb-pct" style={{ color }}>{u.weightPctLost > 0 ? `-${u.weightPctLost}%` : '0%'}</div>
                <div className="lb-detail">{u.startWeight}kg → {u.currentWeight}kg</div>
                <div className="lb-detail">{u.logCount} days logged</div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="card">
        <div className="card-title">📈 The Race</div>
        <p className="tip" style={{ marginBottom: 16 }}>Cumulative % of body weight lost per person over the contest. Higher = winning.</p>
        <ComparisonChart />
      </div>
    </div>
  );
}
