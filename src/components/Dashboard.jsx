import React from 'react';
import SparkChart from './SparkChart';
import { pctLost, todayStr, contestDay, contestWeek, getStatus, buildLB } from '../lib/utils';

export default function Dashboard({ user, contest, logs, users, isAdmin }) {
  const status = getStatus(contest);
  const week = contestWeek(contest.startDate);
  const day = contestDay(contest.startDate);
  const myLogs = logs.filter(l => l.userId === user.id).sort((a, b) => a.date.localeCompare(b.date));
  const last = myLogs[myLogs.length - 1];
  const lb = buildLB(users, logs);
  const myRank = lb.findIndex(u => u.id === user.id) + 1;
  const loggedToday = myLogs.some(l => l.date === todayStr());
  const pctSoFar = user.startWeight && last ? pctLost(user.startWeight, last.weight) : null;

  return (
    <div>
      <div className="card" style={{ display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1 }}>
          <div style={{ marginBottom: 10 }}>
            {status === 'live' && (
              <span className="contest-status live">
                <span className="pulse"></span> Week {week} &middot; Day {day} of 56
              </span>
            )}
            {status === 'pending' && <span className="contest-status pending">⏳ Contest Not Started</span>}
            {status === 'ended' && <span className="contest-status ended">🏁 Contest Ended</span>}
          </div>

          {status === 'live' && (
            <>
              <div className="progress-bar-wrap">
                <div className="progress-bar" style={{ width: `${(day / 56) * 100}%` }}></div>
              </div>
              <div className="tip" style={{ marginTop: 6 }}>{56 - day} days remaining in the contest</div>
            </>
          )}

          {!contest.startDate && <div className="tip">Admin hasn't set a start date yet.</div>}
        </div>

        {!loggedToday && status === 'live' && (
          <div style={{ background: 'rgba(255,107,53,0.1)', border: '1px solid rgba(255,107,53,0.3)', borderRadius: 10, padding: '14px 18px', textAlign: 'center', minWidth: 160 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>⚖️</div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>Log today's weight!</div>
            <div className="tip">Keep your streak alive</div>
          </div>
        )}

        {loggedToday && last && (
          <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 10, padding: '14px 18px', textAlign: 'center', minWidth: 160 }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>✅</div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--success)' }}>Today: {last.weight}kg</div>
            <div className="tip">{pctSoFar !== null ? `Down ${pctSoFar}% from start` : ''}</div>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat yellow">
          <div className="stat-label">Starting Weight</div>
          <div className="stat-value yellow">{user.startWeight ? `${user.startWeight}kg` : '—'}</div>
          <div className="stat-sub">{user.startWeight ? 'your baseline' : 'log your first weigh-in'}</div>
        </div>

        <div className="stat green">
          <div className="stat-label">Current Weight</div>
          <div className="stat-value green">{last ? `${last.weight}kg` : '—'}</div>
          {last && user.startWeight && (
            <div className="stat-sub">{pctSoFar > 0 ? '-' : '+'}{Math.abs(pctSoFar)}% from start</div>
          )}
        </div>

        <div className="stat orange">
          <div className="stat-label">Your Rank</div>
          <div className="stat-value orange">{myRank > 0 ? `#${myRank}` : '—'}</div>
          <div className="stat-sub">{myRank > 0 ? `of ${lb.length} participants` : 'Log a weigh-in first'}</div>
        </div>

        <div className="stat blue">
          <div className="stat-label">Days Logged</div>
          <div className="stat-value blue">{myLogs.length}</div>
          <div className="stat-sub">{status === 'live' ? `of ${day} days elapsed` : 'total entries'}</div>
        </div>
      </div>

      {myLogs.length >= 2 && (
        <div className="card">
          <div className="card-title">Weight Trend</div>
          <SparkChart logs={myLogs} height={130} />
        </div>
      )}
    </div>
  );
}
