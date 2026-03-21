import React from 'react';

export default function TopBar({ user, onLogout, tab, setTab, isAdmin }) {
  const tabs = isAdmin
    ? ['Dashboard', 'My Stats', 'Leaderboard', 'Weigh-In', 'Photos', 'Admin', 'Settings']
    : ['Dashboard', 'My Stats', 'Leaderboard', 'Weigh-In', 'Photos', 'Settings'];

  return (
    <>
      <div className="topbar">
        <div className="topbar-logo">LeanUp</div>
        <div className="topbar-right">
          <span className="topbar-user">{user.name || user.username}</span>
          <button className="logout-btn" onClick={onLogout}>Sign Out</button>
        </div>
      </div>
      <div className="nav">
        {tabs.map(t => (
          <button
            key={t}
            className={`nav-tab${tab === t ? ' active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>
    </>
  );
}
