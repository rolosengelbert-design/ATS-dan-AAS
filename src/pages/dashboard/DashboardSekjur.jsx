import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';

function DashboardSekjur() {
  const location = useLocation();
  const navigate = useNavigate();
  const sekjurId = location.state?.id || 2;
  const namaSekjur = location.state?.nama || 'Sekretaris Jurusan';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [semuaKelas, setSemuaKelas] = useState([]);
  const [semuaDosen, setSemuaDosen] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const [formDosen, setFormDosen] = useState({
    nidn: '', nama_lengkap: '', email: '', password: ''
  });

  useEffect(() => {
    fetchSemuaKelas();
    fetchSemuaDosen();
  }, []);

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

  const handleDaftarDosen = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const res = await fetch('http://localhost:5000/api/sekjur/daftar-dosen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formDosen, sekjur_id: sekjurId })
      });
      const data = await res.json();
      if (res.ok) {
        notify.success('Dosen berhasil didaftarkan! Menunggu verifikasi Kajur.');
        setFormDosen({ nidn: '', nama_lengkap: '', email: '', password: '' });
        fetchSemuaDosen();
      } else {
        notify.error(data.message);
      }
    } catch {
      notify.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  const badgeStyle = (status) => {
    const base = { padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 600 };
    if (status === 'aktif') return { ...base, background: 'rgba(34,197,94,0.2)', color: '#86efac' };
    if (status === 'pending') return { ...base, background: 'rgba(251,191,36,0.2)', color: '#fcd34d' };
    return { ...base, background: 'rgba(239,68,68,0.2)', color: '#fca5a5' };
  };

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <img src="/poli.png" alt="Logo" />
          <div>Politeknik Negeri<span>Teknik Elektro</span></div>
        </Link>
        <ul className="nav-links">
          <li className="nav-item"><a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>Dashboard</a></li>
          <li className="nav-item"><a className={`nav-link ${activeTab === 'daftar' ? 'active' : ''}`} onClick={() => setActiveTab('daftar')}>Daftarkan Dosen</a></li>
          <li className="nav-item"><a className={`nav-link ${activeTab === 'aktivitas' ? 'active' : ''}`} onClick={() => setActiveTab('aktivitas')}>Pantau Aktivitas</a></li>
        </ul>
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem' }}>
          <button className="btn btn-outline btn-full" onClick={() => navigate('/')}>🚪 Keluar</button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <h2>Dashboard Sekretaris Jurusan</h2>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 600 }}>{namaSekjur}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Sekretaris Jurusan</div>
            </div>
            <div className="avatar" style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>S</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <>
            <div className="dashboard-cards">
              <div className="dash-card">
                <div className="card-title">Total Dosen</div>
                <div className="card-value">{semuaDosen.length}</div>
              </div>
              <div className="dash-card">
                <div className="card-title">Dosen Aktif</div>
                <div className="card-value">{semuaDosen.filter(d => d.status === 'aktif').length}</div>
              </div>
              <div className="dash-card">
                <div className="card-title">Menunggu Verifikasi</div>
                <div className="card-value" style={{ color: '#fcd34d' }}>{semuaDosen.filter(d => d.status === 'pending').length}</div>
              </div>
              <div className="dash-card">
                <div className="card-title">Total Kelas</div>
                <div className="card-value">{semuaKelas.length}</div>
              </div>
            </div>
            <div className="recent-activity">
              <h3 style={{ marginBottom: '1rem' }}>Status Seluruh Dosen</h3>
              {semuaDosen.map(d => (
                <div key={d.id} className="activity-item" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <strong>{d.nama_lengkap}</strong>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginLeft: '8px' }}>NIDN: {d.nidn}</span>
                    <br/>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {d.total_kelas} Kelas • Didaftarkan oleh: {d.didaftarkan_oleh || 'Manual'}
                    </span>
                  </div>
                  <span style={badgeStyle(d.status)}>{d.status.toUpperCase()}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {activeTab === 'daftar' && (
          <div className="recent-activity" style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '1.5rem' }}>📝 Daftarkan Dosen Baru</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              Data dosen yang Anda daftarkan akan dikirim ke <strong>Kajur (Marson Budiman)</strong> untuk diverifikasi sebelum akun dapat digunakan.
            </p>
            <form onSubmit={handleDaftarDosen}>
              <div className="form-group">
                <label>NIDN Dosen</label>
                <input type="text" className="form-control" required value={formDosen.nidn} onChange={e => setFormDosen({...formDosen, nidn: e.target.value})} placeholder="Contoh: 0012345678" />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" className="form-control" required value={formDosen.nama_lengkap} onChange={e => setFormDosen({...formDosen, nama_lengkap: e.target.value})} placeholder="Nama lengkap dosen" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" required value={formDosen.email} onChange={e => setFormDosen({...formDosen, email: e.target.value})} placeholder="email@polimdo.ac.id" />
              </div>
              <div className="form-group">
                <label>Password Sementara</label>
                <input type="password" className="form-control" required value={formDosen.password} onChange={e => setFormDosen({...formDosen, password: e.target.value})} placeholder="Password yang akan digunakan dosen untuk login" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Mengirim...' : '📤 Kirim ke Kajur untuk Verifikasi'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'aktivitas' && (
          <div className="recent-activity">
            <h3 style={{ marginBottom: '1rem' }}>🏫 Semua Kelas yang Dibuat Dosen</h3>
            {semuaKelas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Belum ada kelas yang dibuat.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Kelas</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Mata Kuliah</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Dosen</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Total Tugas</th>
                  </tr>
                </thead>
                <tbody>
                  {semuaKelas.map(k => (
                    <tr key={k.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{k.nama_kelas}</td>
                      <td style={{ padding: '0.75rem' }}>{k.matakuliah_nama}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{k.dosen}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>{k.total_tugas}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardSekjur;
