import { db } from './supabase';

export const mapUser = u => ({ id: u.id, username: u.username, password: u.password, role: u.role, name: u.name, startWeight: u.start_weight, email: u.email || '' });
export const mapLog  = l => ({ id: l.id, userId: l.user_id, weight: l.weight, date: l.date, ts: l.ts });
export const mapPhoto = p => ({ id: p.id, userId: p.user_id, name: p.name, week: p.week, dataUrl: p.data_url, date: p.date, ts: p.ts });
export const mapContest = c => ({ startDate: c.start_date });

export async function loadAll() {
  const [users, [contest], logs, photos] = await Promise.all([
    db.query('users', '?select=*').then(r => r.map(mapUser)),
    db.query('contest', '?select=*&id=eq.1').then(r => r.map(mapContest)),
    db.query('logs', '?select=*&order=date.asc').then(r => r.map(mapLog)),
    db.query('photos', '?select=*&order=ts.desc').then(r => r.map(mapPhoto)),
  ]);
  return { users, contest: contest || { startDate: null }, logs, photos };
}

export const pctLost = (start, current) => +(((start - current) / start) * 100).toFixed(2);
export const todayStr = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Australia/Brisbane' });
export const fmtDate = d => new Date(d + 'T12:00:00').toLocaleDateString('en-AU', { day: 'numeric', month: 'short' });
export const daysBetween = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export function contestDay(startDate) {
  if (!startDate) return null;
  const d = daysBetween(startDate, todayStr()) + 1;
  return d < 1 ? null : d;
}
export function contestWeek(startDate) {
  const d = contestDay(startDate);
  if (!d) return null;
  return Math.min(Math.ceil(d / 7), 8);
}
export function getStatus(contest) {
  if (!contest.startDate) return 'pending';
  const start = new Date(contest.startDate);
  const end = new Date(start.getTime() + 56 * 86400000);
  const now = new Date();
  if (now < start) return 'pending';
  if (now > end) return 'ended';
  return 'live';
}

export function calcStats(user, myLogs, contest) {
  if (!myLogs.length) return null;
  const sorted = [...myLogs].sort((a, b) => a.date.localeCompare(b.date));
  const first = sorted[0], last = sorted[sorted.length - 1];
  const totalLost = +(first.weight - last.weight).toFixed(2);
  const weightPctLost = pctLost(first.weight, last.weight);
  const daySpan = Math.max(daysBetween(first.date, last.date), 1);
  const avgPerDay = +(totalLost / daySpan).toFixed(3);
  const pacePerWeek = +(avgPerDay * 7).toFixed(2);

  let bestDrop = 0, worstGain = 0;
  for (let i = 1; i < sorted.length; i++) {
    const diff = +(sorted[i - 1].weight - sorted[i].weight).toFixed(2);
    if (diff > bestDrop) bestDrop = diff;
    if (diff < worstGain) worstGain = diff;
  }

  // Streak
  let streak = 0;
  const logSet = new Set(sorted.map(l => l.date));
  let check = todayStr();
  while (logSet.has(check)) {
    streak++;
    const d = new Date(check); d.setDate(d.getDate() - 1);
    check = d.toISOString().slice(0, 10);
  }

  // Projection
  let daysLeft = 0, projectedFinal = null, projectedLoss = 0;
  if (contest.startDate) {
    const endDate = new Date(new Date(contest.startDate).getTime() + 56 * 86400000).toISOString().slice(0, 10);
    daysLeft = Math.max(0, daysBetween(todayStr(), endDate));
    projectedLoss = +(avgPerDay * daysLeft).toFixed(2);
    projectedFinal = +(last.weight - projectedLoss).toFixed(1);
  }

  // 7-day trend
  const recent7 = sorted.slice(-7);
  const trend = recent7.length >= 2 ? +(recent7[0].weight - recent7[recent7.length - 1].weight).toFixed(2) : 0;

  return { first, last, sorted, totalLost, weightPctLost, avgPerDay, pacePerWeek, bestDrop, worstGain, streak, daysLeft, projectedFinal, projectedLoss, trend };
}

export function buildLB(users, logs) {
  return users
    .filter(u => u.role !== 'admin' && u.startWeight)
    .map(u => {
      const myLogs = logs.filter(l => l.userId === u.id).sort((a, b) => a.date.localeCompare(b.date));
      const last = myLogs[myLogs.length - 1];
      const currentWeight = last ? last.weight : u.startWeight;
      const weightPctLost = pctLost(u.startWeight, currentWeight);
      return { ...u, currentWeight, weightPctLost, logCount: myLogs.length, logDates: new Set(myLogs.map(l => l.date)) };
    })
    .sort((a, b) => b.weightPctLost - a.weightPctLost);
}
