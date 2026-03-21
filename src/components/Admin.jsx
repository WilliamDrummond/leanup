import React, { useState } from 'react';
import { db } from '../lib/supabase';
import { getStatus, pctLost } from '../lib/utils';

export default function Admin({ contest, users, logs, photos, refreshAll }) {
  const [startDate, setStartDate] = useState(contest.startDate || '');
  const [newName, setNewName] = useState('');
  const [newUser, setNewUser] = useState('');
  const [newPass, setNewPass] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [saving, setSaving] = useState('');

  async function saveContest() {
    if (!startDate) { setErr('Pick a start date.'); return; }
    setSaving('contest');
    try {
      await db.update('contest', { id: 1 }, { start_date: startDate });
      await refreshAll();
      setMsg('✅ Start date saved!'); setErr(''); setTimeout(() => setMsg(''), 2500);
    } catch { setErr('Save failed.'); }
    setSaving('');
  }

  async function addUser() {
    if (!newName || !newUser || !newPass) { setErr('Fill all fields.'); return; }
    if (users.find(u => u.username === newUser)) { setErr('Username taken.'); return; }
    setSaving('user');
    try {
      await db.insert('users', { id: Date.now().toString(), username: newUser, password: newPass, role: 'user', name: newName });
      await refreshAll();
      setNewName(''); setNewUser(''); setNewPass('');
      setMsg('✅ Participant added!'); setErr(''); setTimeout(() => setMsg(''), 2500);
    } catch { setErr('Add failed - username may already exist.'); }
    setSaving('');
  }

  async function removeUser(id) {
    if (!confirm('Remove this participant and all their data?')) return;
    try {
      await db.delete('users', { id });
      await refreshAll();
    } catch { alert('Remove failed.'); }
  }

  async function resetLogs(id) {
    if (!confirm('Reset all weigh-in logs for this user?')) return;
    try {
      await db.delete('logs', { user_id: id });
      await db.update('users', { id }, { start_weight: null });
      await refreshAll();
    } catch { alert('Reset failed.'); }
  }

  const participants = users.filter(u => u.role !== 'admin');
  const status = getStatus(contest);

  return (
    <div>
      <div className="card">
        <div className="card-title">⚙️ Contest Settings</div>
        <div style={{ marginBottom: 12, fontSize: 13 }}>Status:
          {status === 'live' && <span className="contest-status live"><span className="pulse"></span> Live</span>}
          {status === 'pending' && <span className="contest-status pending">⏳ Pending</span>}
          {status === 'ended' && <span className="contest-status ended">🏁 Ended</span>}
        </div>

        <div className="input-row">
          <div className="field">
            <label>Contest Start Date</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <button className="btn btn-sm" onClick={saveContest} style={{ height: 44 }} disabled={saving === 'contest'}>
            {saving === 'contest' ? 'Saving...' : 'Save'}
          </button>
        </div>

        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 8 }}>{msg}</div>}
        {err && <div className="err" style={{ textAlign: 'left', marginTop: 8 }}>{err}</div>}
      </div>

      <div className="card">
        <div className="card-title">➕ Add Participant</div>
        <div className="input-row" style={{ flexWrap: 'wrap' }}>
          <div className="field">
            <label>Full Name</label>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="John Smith" />
          </div>
          <div className="field">
            <label>Username</label>
            <input value={newUser} onChange={e => setNewUser(e.target.value)} placeholder="johnsmith" />
          </div>
          <div className="field">
            <label>Password</label>
            <input value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="password" />
          </div>
          <button className="btn btn-sm" onClick={addUser} style={{ height: 44 }} disabled={saving === 'user'}>
            {saving === 'user' ? 'Adding...' : 'Add'}
          </button>
        </div>
      </div>

      <div className="card">
        <div className="card-title">👥 Participants ({participants.length})</div>
        {participants.length === 0 ? (
          <div className="empty">No participants yet.</div>
        ) : (
          participants.map(u => {
            const uLogs = logs.filter(l => l.userId === u.id).sort((a, b) => a.date.localeCompare(b.date));
            const last = uLogs[uLogs.length - 1];
            return (
              <div key={u.id} className="user-row">
                <div className="user-row-name">
                  {u.name} <br />
                  <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 400 }}>@{u.username}</span>
                </div>
                <div className="user-row-info">
                  {u.startWeight ? `Start: ${u.startWeight}kg` : 'No start weight'}
                  {last ? ` → ${last.weight}kg (${pctLost(u.startWeight, last.weight)}% lost)` : ''}
                </div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{uLogs.length} days</div>
                <button className="btn btn-sm btn-outline" onClick={() => resetLogs(u.id)} style={{ fontSize: 12 }}>Reset</button>
                <button className="btn btn-sm btn-danger" onClick={() => removeUser(u.id)} style={{ fontSize: 12 }}>Remove</button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
