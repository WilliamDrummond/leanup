import React from 'react';
import SparkChart from './SparkChart';
import { calcStats, pctLost, todayStr, fmtDate, getStatus, contestDay } from '../lib/utils';

export default function MyStats({ user, logs, contest }) {
  const myLogs = logs.filter(l => l.userId === user.id).sort((a, b) => a.date.localeCompare(b.date));
  const st = calcStats(user, myLogs, contest);

  if (!user.startWeight) {
    return (
      <div className="card">
        <div className="empty">⚖️ Log your first daily weight to unlock your stats!</div>
      </div>
    );
  }

  if (!st) {
    return (
      <div className="card">
        <div className="empty">Log your first daily weight to see stats!</div>
      </div>
    );
  }

  return (
    <div>
      <div className="stats-grid">
        <div className="stat green">
          <div className="stat-label">Total Lost</div>
          <div className={`stat-value ${st.totalLost > 0 ? 'green' : 'orange'}`}>
            {st.totalLost > 0 ? `-${st.totalLost}kg` : `+${Math.abs(st.totalLost)}kg`}
          </div>
          <div className="stat-sub">{st.first.weight}kg → {st.last.weight}kg</div>
        </div>

        <div className="stat yellow">
          <div className="stat-label">% of Start Weight Lost</div>
          <div className="stat-value yellow">
            {st.weightPctLost > 0 ? `-${st.weightPctLost}%` : `+${Math.abs(st.weightPctLost)}%`}
          </div>
          <div className="stat-sub">{st.first.weight}kg start &middot; {st.last.weight}kg now</div>
        </div>

        <div className="stat orange">
          <div className="stat-label">Avg per Day</div>
          <div className={`stat-value ${st.avgPerDay > 0 ? 'green' : 'orange'}`}>
            {st.avgPerDay > 0 ? `-${st.avgPerDay}kg` : `+${Math.abs(st.avgPerDay)}kg`}
          </div>
          <div className="stat-sub">≈ {st.pacePerWeek}kg per week</div>
        </div>

        <div className="stat blue">
          <div className="stat-label">Day Streak 🔥</div>
          <div className="stat-value blue">{st.streak}</div>
          <div className="stat-sub">{st.streak > 0 ? 'consecutive days logged' : 'Log today to start a streak!'}</div>
        </div>

        <div className="stat green">
          <div className="stat-label">Best Day Drop</div>
          <div className="stat-value green">{st.bestDrop > 0 ? `-${st.bestDrop}kg` : '—'}</div>
          <div className="stat-sub">biggest overnight drop recorded</div>
        </div>

        <div className="stat yellow">
          <div className="stat-label">Projected Finish</div>
          <div className="stat-value yellow">{st.projectedFinal ? `${st.projectedFinal}kg` : '—'}</div>
          {st.daysLeft > 0 && <div className="stat-sub">-{st.projectedLoss}kg more in {st.daysLeft} days</div>}
        </div>

        <div className="stat orange">
          <div className="stat-label">7-Day Trend</div>
          <div className={`stat-value ${st.trend > 0 ? 'green' : st.trend < 0 ? 'orange' : 'blue'}`}>
            {st.trend > 0.05 ? `↓ ${st.trend}kg` : st.trend < -0.05 ? `↑ ${Math.abs(st.trend)}kg` : '→ flat'}
          </div>
          <div className="stat-sub">
            {st.trend > 0.05 ? 'dropping nicely!' : st.trend < -0.05 ? 'slight gain - stay the course' : 'weight stable'}
          </div>
        </div>

        <div className="stat blue">
          <div className="stat-label">Total Logs</div>
          <div className="stat-value blue">{myLogs.length}</div>
          <div className="stat-sub">out of {getStatus(contest) === 'live' ? contestDay(contest.startDate) : 56} possible days</div>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Weight Chart (last 30 days)</h2>
          <div className="tip">🟡 weight  🔸 trend line</div>
        </div>
        <SparkChart logs={myLogs} height={200} />
      </div>

      <div className="card">
        <h2 className="card-title">Daily Log History</h2>
        <table className="log-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Weight (kg)</th>
              <th>% of Start</th>
              <th>Change</th>
            </tr>
          </thead>
          <tbody>
            {[...myLogs].reverse().map((l, i, arr) => {
              const prev = arr[i + 1];
              const change = prev ? +(l.weight - prev.weight).toFixed(2) : null;
              const isToday = l.date === todayStr();
              const pct = user.startWeight ? pctLost(user.startWeight, l.weight) : null;
              return (
                <tr key={l.id}>
                  <td>
                    {fmtDate(l.date)}
                    {isToday && <span className="today-badge">Today</span>}
                  </td>
                  <td>{l.weight}</td>
                  <td className={pct > 0 ? 'change-pos' : pct < 0 ? 'change-neg' : ''}>
                    {pct !== null ? `${pct > 0 ? '-' : '+'}${Math.abs(pct)}%` : '—'}
                  </td>
                  <td className={change === null ? '' : change < 0 ? 'change-pos' : change > 0 ? 'change-neg' : 'change-zero'}>
                    {change === null ? 'First entry' : change < 0 ? `▼ ${Math.abs(change)}` : change > 0 ? `▲ ${change}` : '→ same'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
