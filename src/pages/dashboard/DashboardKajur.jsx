import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';

function DashboardKajur() {
  const location = useLocation();
  const navigate = useNavigate();
  const namaKajur = location.state?.nama || 'Kepala Jurusan';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dosenPending, setDosenPending] = useState([]);
  const [semuaKelas, setSemuaKelas] = useState([]);
  const [semuaDosen, setSemuaDosen] = useState([]);

  useEffect(() => {
    fetchDosenPending();
    fetchSemuaKelas();
    fetchSemuaDosen();
  }, []);

  const fetchDosenPending = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/kajur/dosen-pending');
      if (res.ok) setDosenPending(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSemuaKelas = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/laporan/semua-kelas');
      if (res.ok) setSemuaKelas(await res.json());
    } catch (e) { console.error(e); }
  };

  const fetchSemuaDosen = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/laporan/semua-dosen');
      if (res.ok) setSemuaDosen(await res.json());
    } catch (e) { console.error(e); }
  };

  const handleVerifikasi = async (dosenId, action) => {
    try {
      const res = await fetch(`http://localhost:5000/api/kajur/verifikasi/${dosenId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const data = await res.json();
      if (res.ok) {
        notify.success(data.message);
        fetchDosenPending();
        fetchSemuaDosen();
      }
    } catch {
      notify.error('Gagal memverifikasi. Coba lagi.');
    }
  };

  const badgeStyle = (status) => {
    const base = { padding: '3px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600, display: 'inline-block' };
    if (status === 'aktif') return { ...base, background: 'rgba(34,197,94,0.2)', color: '#86efac' };
    if (status === 'pending') return { ...base, background: 'rgba(251,191,36,0.2)', color: '#fcd34d' };
    return { ...base, background: 'rgba(239,68,68,0.2)', color: '#fca5a5' };
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar" style={{ background: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)' }}>
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <img src="/poli.png" alt="Logo" />
          <div>Politeknik Negeri<span>Teknik Elektro</span></div>
        </Link>
        <div style={{ padding: '1rem 1.5rem', margin: '0.5rem 0', background: 'rgba(255,215,0,0.08)', borderRadius: '8px', borderLeft: '3px solid gold', fontSize: '0.8rem', color: '#fcd34d' }}>
          👑 Kepala Jurusan
        </div>
        <ul className="nav-links">
          <li className="nav-item"><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard Eksekutif</a></li>
          <li className="nav-item">
            <a className={`nav-link ${activeTab === 'verifikasi' ? 'active' : ''}`} onClick={() => setActiveTab('verifikasi')}>
              Verifikasi Dosen
              {dosenPending.length > 0 && (
                <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', marginLeft: '8px' }}>
                  {dosenPending.length}
                </span>
              )}
            </a>
          </li>
          <li className="nav-item"><a className={`nav-link ${activeTab === 'dosen' ? 'active' : ''}`} onClick={() => setActiveTab('dosen')}>Data Seluruh Dosen</a></li>
          <li className="nav-item"><a className={`nav-link ${activeTab === 'aktivitas' ? 'active' : ''}`} onClick={() => setActiveTab('aktivitas')}>Pantau Aktivitas</a></li>
        </ul>
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem' }}>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>🚪 Keluar</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2 style={{ background: 'linear-gradient(135deg, #ffd700, #ffb347)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Dashboard Kepala Jurusan
          </h2>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#fcd34d' }}>{namaKajur}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Kepala Jurusan Teknik Elektro</div>
            </div>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #ffd700, #f59e0b)', color: '#1a1a2e', fontWeight: 700 }}>K</div>
          </div>
        </header>

        {/* Dashboard Eksekutif */}
        {activeTab === 'dashboard' && (
          <>
            <div className="dashboard-cards">
              <div className="dash-card" style={{ borderTop: '3px solid #ffd700' }}>
                <div className="card-title">Total Dosen Aktif</div>
                <div className="card-value" style={{ color: '#fcd34d' }}>{semuaDosen.filter(d => d.status === 'aktif').length}</div>
              </div>
              <div className="dash-card" style={{ borderTop: '3px solid #ef4444' }}>
                <div className="card-title">Menunggu Verifikasi</div>
                <div className="card-value" style={{ color: '#fca5a5' }}>{dosenPending.length}</div>
              </div>
              <div className="dash-card" style={{ borderTop: '3px solid #60a5fa' }}>
                <div className="card-title">Total Kelas Aktif</div>
                <div className="card-value" style={{ color: '#93c5fd' }}>{semuaKelas.length}</div>
              </div>
              <div className="dash-card" style={{ borderTop: '3px solid #34d399' }}>
                <div className="card-title">Total Tugas Dibuat</div>
                <div className="card-value" style={{ color: '#6ee7b7' }}>{semuaKelas.reduce((sum, k) => sum + (k.total_tugas || 0), 0)}</div>
              </div>
            </div>

            {dosenPending.length > 0 && (
              <div className="recent-activity" style={{ borderLeft: '4px solid #ffd700', marginBottom: '1.5rem' }}>
                <h3 style={{ marginBottom: '1rem', color: '#fcd34d' }}>⚠️ Menunggu Verifikasi Anda ({dosenPending.length} dosen)</h3>
                {dosenPending.map(d => (
                  <div key={d.id} className="activity-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong>{d.nama_lengkap}</strong> — NIDN: {d.nidn}<br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Didaftarkan oleh: {d.didaftarkan_oleh}</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-primary" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }} onClick={() => handleVerifikasi(d.id, 'aktif')}>✅ Setujui</button>
                      <button className="btn btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', color: '#fca5a5', borderColor: '#fca5a5' }} onClick={() => handleVerifikasi(d.id, 'ditolak')}>❌ Tolak</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="recent-activity">
              <h3 style={{ marginBottom: '1rem' }}>📊 Ringkasan Aktivitas Kelas</h3>
              {semuaKelas.slice(0, 5).map(k => (
                <div key={k.id} className="activity-item" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <strong>{k.nama_kelas}</strong> — {k.matakuliah_nama}
                    <br/><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dosen: {k.dosen}</span>
                  </div>
                  <span style={{ color: '#93c5fd', fontWeight: 600 }}>{k.total_tugas} Tugas</span>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Verifikasi Dosen */}
        {activeTab === 'verifikasi' && (
          <div className="recent-activity">
            <h3 style={{ marginBottom: '1rem' }}>🔍 Verifikasi Pendaftaran Dosen</h3>
            {dosenPending.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>✅</div>
                <p>Tidak ada dosen yang menunggu verifikasi.</p>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Dosen</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIDN</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Didaftarkan Oleh</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {dosenPending.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.nama_lengkap}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{d.nidn}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{d.email}</td>
                      <td style={{ padding: '0.75rem' }}>{d.didaftarkan_oleh}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button className="btn btn-primary" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', marginRight: '6px' }} onClick={() => handleVerifikasi(d.id, 'aktif')}>✅ Setujui</button>
                        <button className="btn btn-outline" style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem', color: '#fca5a5', borderColor: '#fca5a5' }} onClick={() => handleVerifikasi(d.id, 'ditolak')}>❌ Tolak</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Data Seluruh Dosen */}
        {activeTab === 'dosen' && (
          <div className="recent-activity">
            <h3 style={{ marginBottom: '1rem' }}>👨‍🏫 Data Seluruh Dosen</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Lengkap</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIDN</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Kelas</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {semuaDosen.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.nama_lengkap}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{d.nidn}</td>
                    <td style={{ padding: '0.75rem' }}>{d.total_kelas} Kelas</td>
                    <td style={{ padding: '0.75rem' }}><span style={badgeStyle(d.status)}>{d.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pantau Aktivitas */}
        {activeTab === 'aktivitas' && (
          <div className="recent-activity">
            <h3 style={{ marginBottom: '1rem' }}>🏫 Pantau Semua Aktivitas Kelas</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Kelas</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Mata Kuliah</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Dosen Pengampu</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Total Tugas</th>
                </tr>
              </thead>
              <tbody>
                {semuaKelas.map(k => (
                  <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{k.nama_kelas}</td>
                    <td style={{ padding: '0.75rem' }}>{k.matakuliah_nama}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{k.dosen}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#93c5fd', fontWeight: 600 }}>{k.total_tugas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardKajur;
