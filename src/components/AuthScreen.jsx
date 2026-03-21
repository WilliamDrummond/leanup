import React, { useState } from 'react';
import { db } from '../lib/supabase';
import { mapUser } from '../lib/utils';

export default function AuthScreen({ onLogin }) {
  const [u, setU] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const rows = await db.query('users', `?username=eq.${encodeURIComponent(u)}&password=eq.${encodeURIComponent(p)}&select=*`);
      if (rows.length) onLogin(mapUser(rows[0]));
      else setErr('Invalid username or password.');
    } catch(ex) {
      setErr('Error: ' + (ex.message || ex));
    }
    setLoading(false);
  }

  return (
    <div className="auth-wrap">
      <div className="auth-bg">{'LEAN\nUP'}</div>
      <div className="auth-card">
        <div className="auth-logo">LeanUp</div>
        <div className="auth-sub">8-Week Fat Loss Contest</div>
        <form onSubmit={login}>
          <div className="field">
            <label>Username</label>
            <input value={u} onChange={e => setU(e.target.value)} placeholder="username" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={p} onChange={e => setP(e.target.value)} placeholder="••••••••" />
          </div>
          {err && <div className="err">{err}</div>}
          <button className="btn" type="submit" style={{ marginTop: 20 }} disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
