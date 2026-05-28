import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';
import { getKehadiranKelas, getPengumpulanByKelas, getKelasByDosen, getBeritaAcaraByDosen, getDosenPending, getSemuaKelas, getSemuaDosen, verifikasiDosen } from '../../services/api';

function DashboardKajur() {
  const location = useLocation();
  const navigate = useNavigate();
  const namaKajur = location.state?.nama || 'Kepala Jurusan';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [dosenPending, setDosenPending] = useState([]);
  const [semuaKelas, setSemuaKelas] = useState([]);
  const [semuaDosen, setSemuaDosen] = useState([]);

  // States untuk Pantau Aktivitas Kelas (tab Pantau Aktivitas)
  const [selectedClassMonitoring, setSelectedClassMonitoring] = useState(null);
  const [monitoringAttendance, setMonitoringAttendance] = useState([]);
  const [monitoringSubmissions, setMonitoringSubmissions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTab, setModalTab] = useState('attendance');

  const handleOpenMonitoring = async (k) => {
    setSelectedClassMonitoring(k);
    setModalLoading(true);
    setModalTab('attendance');
    try {
      const attRes = await getKehadiranKelas(k.id).catch(() => []);
      const subRes = await getPengumpulanByKelas(k.id).catch(() => []);
      setMonitoringAttendance(attRes);
      setMonitoringSubmissions(subRes);
    } catch (e) {
      console.error(e);
      notify.error('Gagal mengambil detail aktivitas kelas.');
    } finally {
      setModalLoading(false);
    }
  };

  // States untuk Pantau Dosen (tab Data Seluruh Dosen)
  const [selectedDosenMonitoring, setSelectedDosenMonitoring] = useState(null);
  const [dosenKelas, setDosenKelas] = useState([]);
  const [dosenSelectedKelas, setDosenSelectedKelas] = useState(null);
  const [dosenAttendance, setDosenAttendance] = useState([]);
  const [dosenSubmissions, setDosenSubmissions] = useState([]);
  const [allDosenBeritaAcara, setAllDosenBeritaAcara] = useState([]);
  const [dosenBeritaAcara, setDosenBeritaAcara] = useState([]);
  const [cetakBeritaAcara, setCetakBeritaAcara] = useState(null);
  const [dosenModalTab, setDosenModalTab] = useState('attendance');
  const [dosenModalLoading, setDosenModalLoading] = useState(false);

  const handlePrintBeritaAcara = (b, nidn) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    const tanggalBagian = (b.hari_tanggal || '').includes(',')
      ? b.hari_tanggal.split(',')[1].trim()
      : b.hari_tanggal || '';
    const hariArr = (b.hari_tanggal || '').split(' ');
    const hari = (b.hari_tanggal || '').split(',')[0] || '...';
    const tgl = hariArr[1] || '...';
    const bulan = hariArr[2] || '...';
    const tahun = hariArr[3] || '...';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8"/>
        <title>Berita Acara - ${b.kategori}</title>
        <style>
          body { font-family: 'Times New Roman', serif; margin: 2.5cm 2.5cm 2.5cm 3cm; color: #000; font-size: 12pt; line-height: 1.6; }
          h2 { text-align: center; text-transform: uppercase; text-decoration: underline; margin-bottom: 1.5rem; font-size: 14pt; }
          p { text-align: justify; }
          table.info { width: 100%; border-collapse: collapse; border: none; margin: 1rem 0; }
          table.info td { border: none; padding: 0.2rem 0; vertical-align: top; }
          table.hadir { width: 100%; border-collapse: collapse; text-align: center; margin-top: 0.5rem; }
          table.hadir th, table.hadir td { border: 1px solid black; padding: 0.5rem; font-size: 12pt; }
          .ttd { margin-top: 3rem; display: flex; justify-content: flex-end; }
          .ttd-box { text-align: center; width: 280px; }
          .ttd-box .nama { text-decoration: underline; font-weight: bold; margin-bottom: 0; }
          .ttd-box .nidn { margin: 0; }
          @media print { body { margin: 2cm; } }
        </style>
      </head>
      <body>
        <h2>Berita Acara Pelaksanaan ${b.kategori}</h2>
        <p>
          Pada hari ini <strong>${hari}</strong> tanggal <strong>${tgl}</strong>
          bulan <strong>${bulan}</strong> tahun <strong>${tahun}</strong>,
          telah dilaksanakan <strong>${b.kategori} (Asesmen Tengah/Akhir Semester)</strong>
          dengan rincian sebagai berikut:
        </p>
        <table class="info">
          <tr><td width="30%">Mata Kuliah</td><td width="5%">:</td><td><strong>${b.matakuliah || '-'}</strong></td></tr>
          <tr><td>Program Studi</td><td>:</td><td><strong>${b.prodi || '-'}</strong></td></tr>
          <tr><td>Semester</td><td>:</td><td><strong>${b.semester || '-'}</strong></td></tr>
          <tr><td>Kelas</td><td>:</td><td><strong>${b.kelas || '-'}</strong></td></tr>
          <tr><td>Waktu</td><td>:</td><td><strong>${b.waktu || '-'}</strong></td></tr>
          <tr><td>Dosen Pengampu</td><td>:</td><td><strong>${b.nama_dosen || '-'}</strong></td></tr>
        </table>
        <h4 style="margin-top:1.5rem;margin-bottom:0.5rem;">Rincian Kehadiran Mahasiswa:</h4>
        <table class="hadir">
          <thead>
            <tr>
              <th>Total Terdaftar</th>
              <th>Jumlah Hadir</th>
              <th>Jumlah Tidak Hadir</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>${b.jumlah_terdaftar} Orang</strong></td>
              <td><strong>${b.jumlah_hadir} Orang</strong></td>
              <td><strong>${b.jumlah_tidak_hadir} Orang</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top:1.5rem;">
          Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
        </p>
        <div class="ttd">
          <div class="ttd-box">
            <p>Manado, ${tanggalBagian}</p>
            <p>Dosen Pengampu,</p>
            <br/><br/><br/><br/>
            <p class="nama">${b.nama_dosen || '-'}</p>
            <p class="nidn">NIDN. ${nidn || '-'}</p>
          </div>
        </div>
        <script>window.onload = function(){ window.print(); };<\/script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleOpenDosenMonitoring = async (d) => {
    setSelectedDosenMonitoring(d);
    setDosenKelas([]);
    setDosenSelectedKelas(null);
    setDosenAttendance([]);
    setDosenSubmissions([]);
    setAllDosenBeritaAcara([]);
    setDosenBeritaAcara([]);
    setDosenModalTab('attendance');
    setDosenModalLoading(true);
    try {
      const classes = await getKelasByDosen(d.id).catch(() => []);
      const baList = await getBeritaAcaraByDosen(d.id).catch(() => []);

      setDosenKelas(classes);
      setAllDosenBeritaAcara(baList);

      if (classes.length > 0) {
        await handleSelectDosenKelas(classes[0], baList);
      }
    } catch (e) {
      notify.error('Gagal mengambil data kelas dosen.');
    } finally {
      setDosenModalLoading(false);
    }
  };

  const handleSelectDosenKelas = async (k, customBAList) => {
    setDosenSelectedKelas(k);
    setDosenModalLoading(true);

    const baSource = customBAList || allDosenBeritaAcara;
    const filteredBA = baSource.filter(
      ba => ba.kelas === k.nama_kelas || ba.matakuliah === k.matakuliah_nama
    );
    setDosenBeritaAcara(filteredBA);

    try {
      const attRes = await getKehadiranKelas(k.id).catch(() => []);
      const subRes = await getPengumpulanByKelas(k.id).catch(() => []);
      setDosenAttendance(attRes);
      setDosenSubmissions(subRes);
    } catch (e) {
      notify.error('Gagal mengambil detail kelas.');
    } finally {
      setDosenModalLoading(false);
    }
  };

  useEffect(() => {
    fetchDosenPending();
    fetchSemuaKelas();
    fetchSemuaDosen();
  }, []);

  const fetchDosenPending = async () => {
    try {
      const data = await getDosenPending();
      setDosenPending(data);
    } catch (e) { console.error(e); }
  };

  const fetchSemuaKelas = async () => {
    try {
      const data = await getSemuaKelas();
      setSemuaKelas(data);
    } catch (e) { console.error(e); }
  };

  const fetchSemuaDosen = async () => {
    try {
      const data = await getSemuaDosen();
      setSemuaDosen(data);
    } catch (e) { console.error(e); }
  };

  const handleVerifikasi = async (dosenId, action) => {
    try {
      const data = await verifikasiDosen(dosenId, action);
      notify.success(data.message);
      fetchDosenPending();
      fetchSemuaDosen();
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
                      <strong>{d.nama_lengkap}</strong> — NIDN: {d.nidn}<br />
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
                    <br /><span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Dosen: {k.dosen}</span>
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
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Email</th>
                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Kelas</th>
                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {semuaDosen.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.nama_lengkap}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{d.nidn}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{d.email || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#93c5fd', fontWeight: 700 }}>{d.total_kelas}</td>
                    <td style={{ padding: '0.75rem' }}><span style={badgeStyle(d.status)}>{d.status.toUpperCase()}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Modal Pantau Aktivitas Dosen */}
        {selectedDosenMonitoring && (
          <div className="modal-overlay">
            <div className="modal-content-lg">
              <div className="modal-header-v2">
                <h3 style={{ margin: 0, fontSize: '1.4rem', color: 'var(--secondary)' }}>
                  👨‍🏫 Aktivitas: {selectedDosenMonitoring.nama_lengkap}
                </h3>
                <button className="btn-modal-close-v2" onClick={() => setSelectedDosenMonitoring(null)}>&times;</button>
              </div>

              {/* Info Dosen */}
              <div className="lecturer-info-card">
                <div className="info-item">
                  <span className="label">NIDN</span>
                  <span className="value">{selectedDosenMonitoring.nidn}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email</span>
                  <span className="value" style={{ textTransform: 'lowercase' }}>{selectedDosenMonitoring.email || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status</span>
                  <span className="value"><span style={badgeStyle(selectedDosenMonitoring.status)}>{selectedDosenMonitoring.status.toUpperCase()}</span></span>
                </div>
                <div className="info-item">
                  <span className="label">Total Kelas</span>
                  <span className="value">{dosenKelas.length} Kelas</span>
                </div>
              </div>

              {/* Pilih Kelas */}
              {dosenKelas.length > 0 && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <label style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.5rem' }}>PILIH KELAS:</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {dosenKelas.map(k => (
                      <button
                        key={k.id}
                        onClick={() => handleSelectDosenKelas(k)}
                        style={{
                          padding: '0.4rem 0.9rem',
                          borderRadius: '8px',
                          border: `2px solid ${dosenSelectedKelas?.id === k.id ? 'var(--primary)' : 'var(--border)'}`,
                          background: dosenSelectedKelas?.id === k.id ? 'rgba(2,132,199,0.1)' : 'transparent',
                          color: dosenSelectedKelas?.id === k.id ? 'var(--primary)' : 'var(--text-muted)',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {k.nama_kelas}
                        {k.nilai_dikirim && <span style={{ marginLeft: '6px', fontSize: '0.7rem', color: '#10b981' }}>✓</span>}
                      </button>
                    ))}
                  </div>
                  {dosenSelectedKelas && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <span>📚 {dosenSelectedKelas.matakuliah_nama}</span>
                      <span>🔑 Kode: <strong>{dosenSelectedKelas.kode_kelas}</strong></span>
                      <span>👥 {dosenSelectedKelas.jumlah_mahasiswa} Mahasiswa</span>
                      <span style={{ color: dosenSelectedKelas.nilai_dikirim ? '#10b981' : '#f59e0b', fontWeight: 600 }}>
                        {dosenSelectedKelas.nilai_dikirim ? '✓ Nilai Terkirim' : '⚠ Nilai Belum Dikirim'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {dosenKelas.length === 0 && !dosenModalLoading && (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Dosen ini belum memiliki kelas.</p>
              )}

              {dosenSelectedKelas && (
                <>
                  {/* Tab Navigasi */}
                  <div className="activity-tab-nav">
                    <button className={`activity-tab-btn ${dosenModalTab === 'attendance' ? 'active' : ''}`} onClick={() => setDosenModalTab('attendance')}>
                      📋 Kehadiran ({dosenSelectedKelas.nilai_dikirim ? dosenAttendance.length : 0})
                    </button>
                    <button className={`activity-tab-btn ${dosenModalTab === 'grades' ? 'active' : ''}`} onClick={() => setDosenModalTab('grades')}>
                      📝 Tugas & Nilai ({dosenSelectedKelas.nilai_dikirim ? dosenSubmissions.length : 0})
                    </button>
                    <button className={`activity-tab-btn ${dosenModalTab === 'berita_acara' ? 'active' : ''}`} onClick={() => setDosenModalTab('berita_acara')}>
                      📰 Berita Acara ({dosenSelectedKelas.nilai_dikirim ? dosenBeritaAcara.length : 0})
                    </button>
                  </div>

                  {dosenModalLoading ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Memuat data...</div>
                  ) : !dosenSelectedKelas.nilai_dikirim ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '3rem 1.5rem',
                      background: 'rgba(245, 158, 11, 0.03)',
                      borderRadius: '12px',
                      border: '1px dashed rgba(245, 158, 11, 0.25)',
                      margin: '1.5rem 0'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔒</div>
                      <h4 style={{ margin: '0 0 0.5rem 0', color: '#f59e0b', fontSize: '1.1rem', fontWeight: 600 }}>Data Belum Dikirim oleh Dosen</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto', lineHeight: '1.5' }}>
                        Dosen pengampu belum mengirimkan data nilai/laporan pengumpulan untuk kelas ini ke jurusan.
                        Detail kehadiran mahasiswa, status pengerjaan tugas & nilai, serta berita acara perkuliahan akan tampil di sini setelah dosen menekan tombol <strong>"Kirim Nilai ke Jurusan"</strong> di dashboard mereka.
                      </p>
                    </div>
                  ) : (
                    <>
                      {dosenModalTab === 'attendance' && (
                        dosenAttendance.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Belum ada mahasiswa yang hadir di kelas ini.</p>
                        ) : (
                          <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Mahasiswa</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM Absen</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Status Hadir</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>TTD</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dosenAttendance.map((m, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{m.nama_lengkap}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{m.nim}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{m.absen_nim || '-'}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      <span className={`status-pill ${m.status_hadir === 'Hadir' ? 'terkirim' : 'belum-kirim'}`} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {m.status_hadir}
                                      </span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      {m.tanda_tangan
                                        ? <img src={m.tanda_tangan} alt="TTD" style={{ height: '28px', maxWidth: '75px', background: '#fff', borderRadius: '4px', padding: '2px', border: '1px solid var(--border)' }} />
                                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}

                      {dosenModalTab === 'grades' && (
                        dosenSubmissions.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Belum ada tugas yang dikumpulkan di kelas ini.</p>
                        ) : (
                          <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Tugas</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Mahasiswa</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Waktu Kumpul</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Nilai</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dosenSubmissions.map((s, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.judul_tugas}</td>
                                    <td style={{ padding: '0.75rem' }}>{s.nama_mahasiswa}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{s.nim}</td>
                                    <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(s.waktu_kumpul).toLocaleString('id-ID')}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: s.nilai !== null ? 'var(--primary)' : 'var(--text-muted)', fontSize: '1rem' }}>
                                      {s.nilai !== null ? s.nilai : '-'}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      <span className={`status-pill ${s.nilai !== null ? 'terkirim' : 'belum-kirim'}`} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                        {s.nilai !== null ? 'Sudah Dinilai' : 'Belum Dinilai'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}

                      {dosenModalTab === 'berita_acara' && (
                        dosenBeritaAcara.length === 0 ? (
                          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Belum ada berita acara yang disimpan untuk kelas ini.</p>
                        ) : (
                          <div className="table-responsive">
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                              <thead>
                                <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Mata Kuliah / Kelas</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Dosen</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Tanggal</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Kategori</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Hadir</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dosenBeritaAcara.map((b, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                      <strong style={{ display: 'block', color: 'var(--secondary)' }}>{b.matakuliah}</strong>
                                      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{b.kelas}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>{b.nama_dosen}</td>
                                    <td style={{ padding: '0.75rem' }}>{b.hari_tanggal}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      <span className={`badge-pill ${b.kategori === 'ATS' ? 'ats' : 'aas'}`}>{b.kategori}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 'bold' }}>
                                      {b.jumlah_hadir} / {b.jumlah_terdaftar}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      <button
                                        className="btn btn-primary btn-mini-action"
                                        onClick={() => handlePrintBeritaAcara(b, selectedDosenMonitoring?.nidn)}
                                        title="Cetak Berita Acara"
                                      >🖨️</button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )
                      )}
                    </>
                  )}
                </>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setSelectedDosenMonitoring(null)}>Tutup</button>
              </div>
            </div>
          </div>
        )}

        {/* Pantau Aktivitas */}
        {activeTab === 'aktivitas' && (
          <div className="recent-activity">
            <h3 style={{ marginBottom: '1rem' }}>🏫 Pantau Aktivitas Dosen</h3>
            {semuaDosen.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Belum ada data dosen.</p>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Lengkap</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIDN</th>
                    <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Kelas</th>
                    <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Data Kelas</th>
                  </tr>
                </thead>
                <tbody>
                  {semuaDosen.map(d => (
                    <tr key={d.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.nama_lengkap}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{d.nidn}</td>
                      <td style={{ padding: '0.75rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>{d.email || '-'}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center', color: '#93c5fd', fontWeight: 700 }}>{d.total_kelas}</td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          className="btn btn-primary"
                          style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                          onClick={() => handleOpenDosenMonitoring(d)}
                          disabled={d.total_kelas === 0}
                          title={d.total_kelas === 0 ? 'Dosen belum memiliki kelas' : 'Pantau aktivitas dosen'}
                        >
                          👁️ Lihat Data
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Modal Pantau Aktivitas Kelas */}
        {selectedClassMonitoring && (
          <div className="modal-overlay">
            <div className="modal-content-lg">
              <div className="modal-header-v2">
                <h3 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--secondary)' }}>
                  🏫 Detail Aktivitas Kelas: {selectedClassMonitoring.nama_kelas}
                </h3>
                <button className="btn-modal-close-v2" onClick={() => setSelectedClassMonitoring(null)}>
                  &times;
                </button>
              </div>

              {/* Informasi Dosen Pengampu */}
              <div className="lecturer-info-card">
                <div className="info-item">
                  <span className="label">Dosen Pengampu</span>
                  <span className="value">{selectedClassMonitoring.dosen || 'Belum Ditentukan'}</span>
                </div>
                <div className="info-item">
                  <span className="label">NIDN Dosen</span>
                  <span className="value">{selectedClassMonitoring.nidn || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Email Dosen</span>
                  <span className="value" style={{ textTransform: 'lowercase' }}>{selectedClassMonitoring.email_dosen || '-'}</span>
                </div>
                <div className="info-item">
                  <span className="label">Status Nilai Kelas</span>
                  <span className="value" style={{ marginTop: '4px' }}>
                    <span className={`status-pill ${selectedClassMonitoring.nilai_dikirim ? 'terkirim' : 'belum-kirim'}`} style={{ padding: '0.25rem 0.6rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>
                      {selectedClassMonitoring.nilai_dikirim ? '✓ TERKIRIM' : '⚠ BELUM DIKIRIM'}
                    </span>
                  </span>
                </div>
              </div>

              {/* Tab Navigasi Aktivitas */}
              <div className="activity-tab-nav">
                <button
                  className={`activity-tab-btn ${modalTab === 'attendance' ? 'active' : ''}`}
                  onClick={() => setModalTab('attendance')}
                >
                  📋 Daftar Kehadiran ({monitoringAttendance.length})
                </button>
                <button
                  className={`activity-tab-btn ${modalTab === 'grades' ? 'active' : ''}`}
                  onClick={() => setModalTab('grades')}
                >
                  📝 Tugas & Nilai ({monitoringSubmissions.length})
                </button>
              </div>

              {/* Konten Tab */}
              {modalLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                  Memuat data aktivitas...
                </div>
              ) : (
                <>
                  {modalTab === 'attendance' && (
                    <div className="table-responsive">
                      {monitoringAttendance.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                          Belum ada mahasiswa yang masuk ke kelas ini.
                        </p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Nama Lengkap</th>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM</th>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM Absen</th>
                              <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Status Kehadiran</th>
                              <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Tanda Tangan</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monitoringAttendance.map((m, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{m.nama_lengkap}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{m.nim}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{m.absen_nim || '-'}</td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  <span className={`status-pill ${m.status_hadir === 'Hadir' ? 'terkirim' : 'belum-kirim'}`} style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                    {m.status_hadir}
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {m.tanda_tangan ? (
                                    <img
                                      src={m.tanda_tangan}
                                      alt="TTD"
                                      style={{ height: '30px', maxWidth: '80px', filter: 'contrast(1.5) brightness(0.8)', background: '#fff', borderRadius: '4px', padding: '2px', border: '1px solid var(--border)', display: 'inline-block' }}
                                    />
                                  ) : (
                                    <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>-</span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}

                  {modalTab === 'grades' && (
                    <div className="table-responsive">
                      {monitoringSubmissions.length === 0 ? (
                        <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>
                          Belum ada tugas yang dikirim atau dinilai di kelas ini.
                        </p>
                      ) : (
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Tugas</th>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Mahasiswa</th>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>NIM</th>
                              <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Waktu Kumpul</th>
                              <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Nilai</th>
                              <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {monitoringSubmissions.map((s, idx) => (
                              <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.judul_tugas}</td>
                                <td style={{ padding: '0.75rem' }}>{s.nama_mahasiswa}</td>
                                <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{s.nim}</td>
                                <td style={{ padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {new Date(s.waktu_kumpul).toLocaleString('id-ID')}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 800, color: s.nilai !== null ? 'var(--primary)' : 'inherit', fontSize: '1rem' }}>
                                  {s.nilai !== null ? s.nilai : '-'}
                                </td>
                                <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                  {s.nilai !== null ? (
                                    <span className="status-pill terkirim" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                      Sudah Dinilai
                                    </span>
                                  ) : (
                                    <span className="status-pill belum-kirim" style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600 }}>
                                      Belum Dinilai
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </>
              )}

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-outline" onClick={() => setSelectedClassMonitoring(null)}>
                  Tutup Detail
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default DashboardKajur;
