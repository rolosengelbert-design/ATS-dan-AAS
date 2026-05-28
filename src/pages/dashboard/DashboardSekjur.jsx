import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';
import { getKehadiranKelas, getPengumpulanByKelas, getKelasByDosen, getBeritaAcaraByDosen, getSemuaKelas, getSemuaDosen, daftarDosen } from '../../services/api';
import SidebarSekjur from '../../components/dashboard/SidebarSekjur';

function DashboardSekjur() {
  const location = useLocation();
  const navigate = useNavigate();
  const sekjurId = location.state?.id || 2;
  const namaSekjur = location.state?.nama || 'Sekretaris Jurusan';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [semuaKelas, setSemuaKelas] = useState([]);
  const [semuaDosen, setSemuaDosen] = useState([]);
  const [loading, setLoading] = useState(false);

  // States untuk Pantau Aktivitas Kelas
  const [selectedClassMonitoring, setSelectedClassMonitoring] = useState(null);
  const [monitoringAttendance, setMonitoringAttendance] = useState([]);
  const [monitoringSubmissions, setMonitoringSubmissions] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalTab, setModalTab] = useState('attendance'); // 'attendance' | 'grades'

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
          <thead><tr><th>Total Terdaftar</th><th>Jumlah Hadir</th><th>Jumlah Tidak Hadir</th></tr></thead>
          <tbody>
            <tr>
              <td><strong>${b.jumlah_terdaftar} Orang</strong></td>
              <td><strong>${b.jumlah_hadir} Orang</strong></td>
              <td><strong>${b.jumlah_tidak_hadir} Orang</strong></td>
            </tr>
          </tbody>
        </table>
        <p style="margin-top:1.5rem;">Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.</p>
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

  const handleDaftarDosen = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMsg('');
    try {
      const data = await daftarDosen({ ...formDosen, sekjur_id: sekjurId });
      notify.success('Dosen berhasil didaftarkan! Menunggu verifikasi Kajur.');
      setFormDosen({ nidn: '', nama_lengkap: '', email: '', password: '' });
      fetchSemuaDosen();
    } catch (err) {
      notify.error(err.message || 'Tidak dapat terhubung ke server.');
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
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <SidebarSekjur
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={() => navigate('/')}
      />

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <h2 style={{ margin: 0 }}>Dashboard Sekretaris Jurusan</h2>
          </div>
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
                    <br />
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
                <input type="text" className="form-control" required value={formDosen.nidn} onChange={e => setFormDosen({ ...formDosen, nidn: e.target.value })} placeholder="Contoh: 0012345678" />
              </div>
              <div className="form-group">
                <label>Nama Lengkap</label>
                <input type="text" className="form-control" required value={formDosen.nama_lengkap} onChange={e => setFormDosen({ ...formDosen, nama_lengkap: e.target.value })} placeholder="Nama lengkap dosen" />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" className="form-control" required value={formDosen.email} onChange={e => setFormDosen({ ...formDosen, email: e.target.value })} placeholder="email@polimdo.ac.id" />
              </div>
              <div className="form-group">
                <label>Password Sementara</label>
                <input type="password" className="form-control" required value={formDosen.password} onChange={e => setFormDosen({ ...formDosen, password: e.target.value })} placeholder="Password yang akan digunakan dosen untuk login" />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Mengirim...' : '📤 Kirim ke Kajur untuk Verifikasi'}
              </button>
            </form>
          </div>
        )}

        {/* Tab Data Seluruh Dosen */}
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
                          fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', transition: 'all 0.2s'
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
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Hari, Tanggal</th>
                                  <th style={{ textAlign: 'left', padding: '0.75rem', color: 'var(--text-muted)' }}>Kategori / Waktu</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Target</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Hadir</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Absen</th>
                                  <th style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--text-muted)' }}>Aksi</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dosenBeritaAcara.map((b, idx) => (
                                  <tr key={idx} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                      <div style={{ fontWeight: 600 }}>{b.hari_tanggal}</div>
                                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Semester: {b.semester}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                      <span className="code-access-pill" style={{ display: 'inline-block', padding: '0.1rem 0.4rem', fontSize: '0.75rem', marginRight: '6px' }}>{b.kategori}</span>
                                      <span style={{ fontSize: '0.85rem' }}>{b.waktu}</span>
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', fontWeight: 600 }}>{b.jumlah_terdaftar}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: '#10b981', fontWeight: 600 }}>{b.jumlah_hadir}</td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center', color: b.jumlah_tidak_hadir > 0 ? '#ef4444' : 'var(--text-muted)', fontWeight: 600 }}>
                                      {b.jumlah_tidak_hadir}
                                    </td>
                                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                                      <button
                                        className="btn btn-primary btn-mini-action"
                                        style={{ padding: '0.3rem 0.7rem', fontSize: '0.82rem' }}
                                        onClick={() => handlePrintBeritaAcara(b, selectedDosenMonitoring?.nidn)}
                                        title="Cetak Berita Acara"
                                      >🖨️ Cetak</button>
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

export default DashboardSekjur;
