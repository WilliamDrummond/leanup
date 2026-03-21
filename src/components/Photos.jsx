import React, { useState, useRef } from 'react';
import { db } from '../lib/supabase';
import { contestWeek, todayStr, fmtDate } from '../lib/utils';

export default function Photos({ user, contest, photos, refreshAll }) {
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [filter, setFilter] = useState('all');
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef();

  const week = contestWeek(contest.startDate);

  function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setErr('Image files only.'); return; }
    if (file.size > 5 * 1024 * 1024) { setErr('Max 5MB per photo.'); return; }

    const reader = new FileReader();
    reader.onload = async ev => {
      setUploading(true);
      try {
        await db.insert('photos', { id: Date.now().toString(), user_id: user.id, name: user.name || user.username, week: week || 1, data_url: ev.target.result, date: todayStr(), ts: Date.now() });
        await refreshAll();
        setMsg('📸 Uploaded!'); setErr(''); setTimeout(() => setMsg(''), 3000);
      } catch { setErr('Upload failed - try again.'); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  const filtered = (filter === 'all' ? photos : photos.filter(p => p.userId === user.id)).sort((a, b) => b.ts - a.ts);

  async function deletePhoto(id) {
    if (!confirm('Delete this photo?')) return;
    try {
      await db.delete('photos', { id });
      await refreshAll();
    } catch { alert('Delete failed - try again.'); }
  }

  return (
    <div>
      <div className="card">
        <div className="card-title">Upload Progress Photo</div>
        {week && <div className="tip" style={{ marginBottom: 12 }}>Week {week} photo - tagged automatically.</div>}

        <div className="upload-zone" onClick={() => !uploading && fileRef.current.click()}>
          <input type="file" ref={fileRef} accept="image/*" onChange={handleFile} />
          <div style={{ fontSize: 36, marginBottom: 8 }}>{uploading ? '⏳' : '📷'}</div>
          <div className="tip">{uploading ? 'Uploading...' : 'Click to upload (max 5MB)'}</div>
        </div>

        {err && <div className="err" style={{ textAlign: 'left', marginTop: 8 }}>{err}</div>}
        {msg && <div style={{ color: 'var(--success)', fontSize: 13, marginTop: 8 }}>{msg}</div>}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="card-title" style={{ margin: 0 }}>Photo Gallery</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'mine'].map(f => (
              <button
                key={f}
                className="btn btn-sm btn-outline"
                onClick={() => setFilter(f)}
                style={{ opacity: filter === f ? 1 : 0.5 }}
              >
                {f === 'all' ? 'Everyone' : 'Mine'}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty">No photos uploaded yet.</div>
        ) : (
          <div className="photo-grid">
            {filtered.map(p => (
              <div key={p.id} className="photo-card">
                <img className="photo-img" src={p.dataUrl} alt="" />
                <div className="photo-meta">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div className="photo-meta-name">{p.name}</div>
                    {p.userId === user.id && (
                      <button
                        onClick={() => deletePhoto(p.id)}
                        title="Delete photo"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 14, padding: '0 2px', lineHeight: 1, transition: 'color 0.2s' }}
                        onMouseEnter={e => e.target.style.color = 'var(--danger)'}
                        onMouseLeave={e => e.target.style.color = 'var(--muted)'}
                      >
                        🗑
                      </button>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 5 }}>
                    <span className="tag tag-week">Wk {p.week}</span>
                    <span className="tag tag-day">{fmtDate(p.date)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
