import React, { useState } from 'react';
import { db } from '../lib/supabase';
import { getStatus, todayStr, fmtDate } from '../lib/utils';

export default function WeighIn({ user, setUser, contest, logs, refreshAll }) {
  const [weight, setWeight] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState(false);
  const [editLogId, setEditLogId] = useState(null);
  const [editWeight, setEditWeight] = useState('');

  const status = getStatus(contest);
  const myLogs = logs.filter(l => l.userId === user.id).sort((a, b) => a.date.localeCompare(b.date));
  const loggedToday = myLogs.find(l => l.date === todayStr());

  async function logWeight() {
    setErr(''); setMsg('');
    if (!weight || isNaN(weight) || +weight < 30 || +weight > 300) { setErr('Enter a valid weight in kg.'); return; }
    if (loggedToday) { setErr('Already logged today! Come back tomorrow.'); return; }
    setSaving(true);
    try {
      const logRow = { id: Date.now().toString(), user_id: user.id, weight: +weight, date: todayStr(), ts: Date.now() };
      await db.insert('logs', logRow);
      if (myLogs.length === 0) {
        await db.update('users', { id: user.id }, { start_weight: +weight });
        setUser(prev => ({ ...prev, startWeight: +weight }));
      }
      await refreshAll();
      setWeight('');
      setMsg(`✅ Logged! ${weight}kg`);
      setTimeout(() => setMsg(''), 4000);
    } catch(ex) { setErr('Save failed - try again.'); }
    setSaving(false);
  }

  async function deleteLog(log) {
    if (!confirm('Delete this weigh-in?')) return;
    try {
      await db.delete('logs', { id: log.id });
      if (myLogs[0] && myLogs[0].id === log.id) {
        const remaining = myLogs.filter(l => l.id !== log.id);
        const newStart = remaining.length ? remaining[0].weight : null;
        await db.update('users', { id: user.id }, { start_weight: newStart });
        setUser(prev => ({ ...prev, startWeight: newStart }));
      }
      await refreshAll();
    } catch (ex) {
      alert('Delete failed.');
    }
  }

  async function saveEdit(log) {
    if (!editWeight || isNaN(editWeight) || +editWeight < 30 || +editWeight > 300) { alert('Enter a valid weight in kg.'); return; }
    try {
      await db.update('logs', { id: log.id }, { weight: +editWeight });
      if (myLogs[0] && myLogs[0].id === log.id) {
        await db.update('users', { id: user.id }, { start_weight: +editWeight });
        setUser(prev => ({ ...prev, startWeight: +editWeight }));
      }
      setEditLogId(null);
      await refreshAll();
    } catch (ex) {
      alert('Save failed.');
    }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Your Starting Weight</div>
        {user.startWeight
          ? <div className="tip">Your starting weight is locked in at {user.startWeight}kg. All progress is calculated from this baseline.</div>
          : <div className="tip">Your very first weigh-in will be set as your starting weight. Make sure you log it on Day 1!</div>
        }
      </div>

      <div className="card">
        <div className="card-title">Daily Weigh-In - {fmtDate(todayStr())}</div>
        {loggedToday
          ? (
            <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.25)', borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 18, fontWeight: 600, color: 'var(--success)', marginBottom: 4 }}>✅ Today logged: {loggedToday.weight}kg</div>
              <div className="tip">Come back tomorrow to keep your streak going!</div>
            </div>
          )
          : (
            <div>
              {status !== 'live' && (
                <div className="tip" style={{ marginBottom: 12, color: 'var(--accent2)' }}>
                  {status === 'pending' ? '⏳ Contest hasn\'t started yet - you can still log your weight early!' : '🏁 Contest has ended.'}
                </div>
              )}
              <div className="input-row">
                <div className="field">
                  <label>Weight (kg)</label>
                  <input type="number" step="0.1" value={weight} onChange={e => setWeight(e.target.value)} placeholder="e.g. 84.5" />
                </div>
                <button className="btn btn-sm" onClick={logWeight} style={{ height: 44 }} disabled={saving}>
                  {saving ? 'Saving...' : 'Log ⚖️'}
                </button>
              </div>
            </div>
          )
        }
        {err && <div className="err" style={{ textAlign: 'left', marginTop: 10 }}>{err}</div>}
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 10 }}>{msg}</div>}
      </div>

      {myLogs.length > 0 && (
        <div className="card">
          <div className="card-title">Manage Weigh-Ins</div>
          <table className="log-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Weight (kg)</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {[...myLogs].reverse().map(l => {
                const isEditing = editLogId === l.id;
                return (
                  <tr key={l.id}>
                    <td>{fmtDate(l.date)}</td>
                    <td>
                      {isEditing
                        ? <input
                            type="number"
                            step="0.1"
                            value={editWeight}
                            onChange={e => setEditWeight(e.target.value)}
                            style={{ width: 80, padding: 4, background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)' }}
                          />
                        : l.weight
                      }
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      {isEditing
                        ? (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => setEditLogId(null)} style={{ padding: '4px 8px', fontSize: 12 }}>Cancel</button>
                            <button className="btn btn-sm" onClick={() => saveEdit(l)} style={{ padding: '4px 8px', fontSize: 12 }}>Save</button>
                          </div>
                        )
                        : (
                          <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                            <button className="btn btn-sm btn-outline" onClick={() => { setEditLogId(l.id); setEditWeight(l.weight); }} style={{ padding: '4px 8px', fontSize: 12 }}>Edit</button>
                            <button className="btn btn-sm btn-danger" onClick={() => deleteLog(l)} style={{ padding: '4px 8px', fontSize: 12 }}>Delete</button>
                          </div>
                        )
                      }
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
