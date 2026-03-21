import React, { useState } from 'react';
import { db } from '../lib/supabase';

export default function Settings({ user, setUser }) {
  const [email, setEmail] = useState(user.email || '');
  const [emailMsg, setEmailMsg] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [passMsg, setPassMsg] = useState('');
  const [passErr, setPassErr] = useState('');
  const [savingPass, setSavingPass] = useState(false);

  async function saveEmail(e) {
    e.preventDefault();
    setEmailErr(''); setEmailMsg('');
    const trimmed = email.trim();
    if (trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setEmailErr('Enter a valid email address.'); return; }
    setSavingEmail(true);
    try {
      await db.update('users', { id: user.id }, { email: trimmed });
      setUser(prev => ({ ...prev, email: trimmed }));
      setEmailMsg('✅ Email saved!');
      setTimeout(() => setEmailMsg(''), 3000);
    } catch { setEmailErr('Save failed - try again.'); }
    setSavingEmail(false);
  }

  async function changePassword(e) {
    e.preventDefault();
    setPassErr(''); setPassMsg('');
    if (!curPass) { setPassErr('Enter your current password.'); return; }
    if (!newPass || newPass.length < 6) { setPassErr('New password must be at least 6 characters.'); return; }
    if (newPass !== confirmPass) { setPassErr('Passwords do not match.'); return; }
    setSavingPass(true);
    try {
      const rows = await db.query('users', `?id=eq.${encodeURIComponent(user.id)}&password=eq.${encodeURIComponent(curPass)}&select=id`);
      if (!rows.length) { setPassErr('Current password is incorrect.'); setSavingPass(false); return; }
      await db.update('users', { id: user.id }, { password: newPass });
      setUser(prev => ({ ...prev, password: newPass }));
      setCurPass(''); setNewPass(''); setConfirmPass('');
      setPassMsg('✅ Password changed!');
      setTimeout(() => setPassMsg(''), 3000);
    } catch { setPassErr('Update failed - try again.'); }
    setSavingPass(false);
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">✉️ Email Address</div>
        <p className="tip" style={{ marginBottom: 16 }}>Add or update the email associated with your account.</p>
        <form onSubmit={saveEmail}>
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          {emailErr && <div className="err" style={{ textAlign: 'left', marginBottom: 8 }}>{emailErr}</div>}
          {emailMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 8 }}>{emailMsg}</div>}
          <button className="btn btn-sm" type="submit" disabled={savingEmail}>
            {savingEmail ? 'Saving...' : 'Save Email'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="card-title">🔒 Change Password</div>
        <p className="tip" style={{ marginBottom: 16 }}>Choose a new password. Must be at least 6 characters.</p>
        <form onSubmit={changePassword}>
          <div className="field">
            <label>Current Password</label>
            <input type="password" value={curPass} onChange={e => setCurPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="••••••••" />
          </div>
          <div className="field">
            <label>Confirm New Password</label>
            <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••••" />
          </div>
          {passErr && <div className="err" style={{ textAlign: 'left', marginBottom: 8 }}>{passErr}</div>}
          {passMsg && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 8 }}>{passMsg}</div>}
          <button className="btn btn-sm" type="submit" disabled={savingPass}>
            {savingPass ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
