import React, { useState } from 'react';
import { loadAll } from './lib/utils';

import AuthScreen from './components/AuthScreen';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import MyStats from './components/MyStats';
import Leaderboard from './components/Leaderboard';
import WeighIn from './components/WeighIn';
import Photos from './components/Photos';
import Admin from './components/Admin';
import Settings from './components/Settings';

export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState('Dashboard');
  const [users, setUsers] = useState([]);
  const [contest, setContest] = useState({ startDate: null });
  const [logs, setLogs] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [appLoading, setAppLoading] = useState(false);

  async function refreshAll() {
    const data = await loadAll();
    setUsers(data.users);
    setContest(data.contest);
    setLogs(data.logs);
    setPhotos(data.photos);
    return data;
  }

  async function handleLogin(u) {
    setUser(u);
    setAppLoading(true);
    await refreshAll();
    setAppLoading(false);
  }

  if (!user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (appLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ fontFamily: "'Bebas Neue'", fontSize: 28, color: 'var(--accent)', letterSpacing: 2 }}>Loading...</div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const currentUser = { ...user, ...(users.find(u2 => u2.id === user.id) || {}) };

  const renderTab = () => {
    switch (tab) {
      case 'Dashboard':   return <Dashboard user={currentUser} contest={contest} logs={logs} users={users} isAdmin={isAdmin} />;
      case 'My Stats':    return <MyStats user={currentUser} logs={logs} contest={contest} />;
      case 'Leaderboard': return <Leaderboard users={users} logs={logs} currentUser={currentUser} contest={contest} />;
      case 'Weigh-In':    return <WeighIn user={currentUser} setUser={fn => setUser(typeof fn === 'function' ? fn(user) : fn)} contest={contest} logs={logs} refreshAll={refreshAll} />;
      case 'Photos':      return <Photos user={currentUser} contest={contest} photos={photos} refreshAll={refreshAll} />;
      case 'Admin':       return isAdmin ? <Admin contest={contest} users={users} logs={logs} photos={photos} refreshAll={refreshAll} /> : null;
      case 'Settings':    return <Settings user={currentUser} setUser={fn => setUser(typeof fn === 'function' ? fn(user) : fn)} />;
      default:            return null;
    }
  };

  return (
    <div className="app">
      <TopBar
        user={currentUser}
        onLogout={() => { setUser(null); setTab('Dashboard'); }}
        tab={tab}
        setTab={setTab}
        isAdmin={isAdmin}
      />
      <div className="content">
        {renderTab()}
      </div>
    </div>
  );
}
