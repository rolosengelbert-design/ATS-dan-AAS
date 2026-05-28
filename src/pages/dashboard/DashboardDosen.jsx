import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';
import Swal from 'sweetalert2';
import './DashboardDosen.css';
import { getBeritaAcaraByDosen, getKelasByDosen, getMatakuliah, getTugasByKelas, getPengumpulanByKelas, getKehadiranKelas, beriNilai, createBeritaAcara, kirimNilaiKelas, createKelas, createMatakuliah, createTugas, updateTugas, updateTargetMahasiswa } from '../../services/api';

function DashboardDosen() {
  const location = useLocation();
  const navigate = useNavigate();
  // Karena saat login backend mengembalikan id dosen, kita perlu menangkapnya. 
  // Jika sebelumnya tidak ada id, kita harus fallback ke 1 (untuk testing)
  const dosenId = location.state?.id || 1;
  const nidn = location.state?.nidn || '0000000000';
  const namaDosen = location.state?.nama || 'Dosen Pengajar';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kelas, setKelas] = useState([]);
  const [matakuliah, setMatakuliah] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tugas, setTugas] = useState([]);
  const [selectedLaporanKelas, setSelectedLaporanKelas] = useState('');
  const [laporan, setLaporan] = useState([]);
  const [kehadiran, setKehadiran] = useState([]);
  const [selectedKehadiranKelas, setSelectedKehadiranKelas] = useState('');
  const [showSignatureModal, setShowSignatureModal] = useState(null); // Menyimpan base64 TTD yang dipilih
  const [beritaAcaraList, setBeritaAcaraList] = useState([]);
  const [beritaAcaraInput, setBeritaAcaraInput] = useState({
    hari_tanggal: '', prodi: 'D4 Teknik Informatika', matakuliah: '', semester: '', kelas: '', waktu: '', kategori: 'ATS', jumlah_terdaftar: '', jumlah_hadir: '', jumlah_tidak_hadir: '', nama_dosen: namaDosen
  });
  const [cetakData, setCetakData] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);


  // Form State
  const [newKelas, setNewKelas] = useState({ nama_kelas: '', matakuliah_nama: '', kode_kelas: '', jumlah_mahasiswa: '', waktu: '' });
  const [newTugas, setNewTugas] = useState({
    judul: '',
    deskripsi: '',
    tanggal: '',
    jam_pelaksanaan: ''
  });
  const [newMatakuliah, setNewMatakuliah] = useState({ kode_mk: '', nama_mk: '', kategori: 'ATS' });
  const [tugasFile, setTugasFile] = useState(null);
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [currentEditingTaskId, setCurrentEditingTaskId] = useState(null);

  useEffect(() => {
    fetchKelas();
    fetchMatakuliah();
    fetchBeritaAcara();
  }, []);

  const fetchBeritaAcara = async () => {
    try {
      const data = await getBeritaAcaraByDosen(dosenId);
      setBeritaAcaraList(data);
    } catch (e) { console.error(e); }
  };

  const fetchKelas = async () => {
    try {
      const data = await getKelasByDosen(dosenId);
      setKelas(data);
    } catch (e) { console.error(e); }
  };

  const fetchMatakuliah = async () => {
    try {
      const data = await getMatakuliah();
      setMatakuliah(data);
    } catch (e) { console.error(e); }
  };

  const fetchTugas = async (kelas_id) => {
    try {
      const data = await getTugasByKelas(kelas_id);
      setTugas(data);
    } catch (e) { console.error(e); }
  };

  const fetchLaporan = async (kelas_id) => {
    try {
      const data = await getPengumpulanByKelas(kelas_id);
      setLaporan(data);
    } catch (e) { console.error(e); }
  };

  const fetchKehadiran = async (kelas_id) => {
    try {
      const data = await getKehadiranKelas(kelas_id);
      setKehadiran(data);
    } catch (e) { console.error(e); }
  };

  const handleBeriNilai = async (pengumpulan_id, nilai) => {
    try {
      await beriNilai(pengumpulan_id, parseInt(nilai));
      notify.success('Nilai berhasil disimpan!');
      fetchLaporan(selectedLaporanKelas); // Refresh tabel
    } catch (e) { notify.error('Gagal menyimpan nilai'); }
  };

  const handleSimpanBeritaAcara = async (e) => {
    e.preventDefault();
    try {
      await createBeritaAcara({ ...beritaAcaraInput, dosen_id: dosenId, nama_dosen: namaDosen });
      notify.success('Berita acara berhasil disimpan!');
      fetchBeritaAcara();
      setBeritaAcaraInput({ hari_tanggal: '', prodi: 'D4 Teknik Informatika', matakuliah: '', semester: '', kelas: '', waktu: '', kategori: 'ATS', jumlah_terdaftar: '', jumlah_hadir: '', jumlah_tidak_hadir: '', nama_dosen: namaDosen });
    } catch (e) { notify.error('Gagal menyimpan'); }
  };

  const handleCetak = (data) => {
    setCetakData(data);
    setTimeout(() => window.print(), 300);
  };

  const handleKirimNilai = async () => {
    if (!selectedLaporanKelas) return;

    const result = await Swal.fire({
      title: 'Kirim Nilai ke Jurusan?',
      text: 'Apakah Anda yakin ingin mengirimkan seluruh data nilai mahasiswa di kelas ini ke Kajur dan Sekjur?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Ya, Kirim',
      cancelButtonText: 'Batal',
      background: '#1e293b',
      color: '#fff',
      confirmButtonColor: '#0284c7',
      cancelButtonColor: '#64748b'
    });

    if (result.isConfirmed) {
      try {
        await kirimNilaiKelas(selectedLaporanKelas);
        notify.success('Data nilai berhasil dikirim ke Kajur & Sekjur!');
        fetchKelas(); // Refresh list kelas agar state nilai_dikirim terupdate
      } catch (e) {
        notify.error('Terjadi kesalahan koneksi');
      }
    }
  };

  const handleBuatKelas = async (e) => {
    e.preventDefault();
    try {
      await createKelas({ nama_kelas: newKelas.nama_kelas, matakuliah_nama: newKelas.matakuliah_nama, kode_kelas: newKelas.kode_kelas, dosen_id: dosenId, jumlah_mahasiswa: parseInt(newKelas.jumlah_mahasiswa), waktu: newKelas.waktu });
      notify.success('Kelas berhasil dibuat!');
      fetchKelas();
      setNewKelas({ nama_kelas: '', matakuliah_nama: '', kode_kelas: '', jumlah_mahasiswa: '', waktu: '' });
    } catch (e) { notify.error(e.message || 'Gagal membuat kelas'); }
  };

  const handleBuatMatakuliah = async (e) => {
    e.preventDefault();
    try {
      await createMatakuliah(newMatakuliah);
      notify.success('Mata Kuliah berhasil ditambahkan!');
      fetchMatakuliah();
      setNewMatakuliah({ kode_mk: '', nama_mk: '', kategori: 'ATS' });
    } catch (e) { notify.error(e.message || 'Gagal menambah mata kuliah'); }
  };

  const handleBuatTugas = async (e) => {
    e.preventDefault();
    if (!selectedKelas) return notify.warning('Pilih kelas terlebih dahulu!');
    try {
      const data = {
        kelas_id: selectedKelas,
        judul: newTugas.judul,
        deskripsi: newTugas.deskripsi,
        tanggal: newTugas.tanggal,
        jam_pelaksanaan: newTugas.jam_pelaksanaan
      };

      if (isEditingTask) {
        await updateTugas(currentEditingTaskId, data, tugasFile);
        notify.success('Tugas berhasil diperbarui!');
      } else {
        await createTugas(data, tugasFile);
        notify.success('Tugas berhasil dibuat!');
      }

      fetchTugas(selectedKelas);
      resetTaskForm();
    } catch (e) { notify.error('Gagal memproses tugas'); }
  };

  const resetTaskForm = () => {
    setNewTugas({ judul: '', deskripsi: '', tanggal: '', jam_pelaksanaan: '' });
    setTugasFile(null);
    setIsEditingTask(false);
    setCurrentEditingTaskId(null);
    const fileInput = document.getElementById('tugasFileInput');
    if (fileInput) fileInput.value = '';
  };

  const handleEditClick = (t) => {
    setNewTugas({
      judul: t.judul,
      deskripsi: t.deskripsi,
      tanggal: t.waktu_mulai ? new Date(t.waktu_mulai).toISOString().split('T')[0] : (t.tenggat_waktu ? t.tenggat_waktu.split('T')[0] : ''),
      jam_pelaksanaan: t.jam_pelaksanaan || ''
    });
    setIsEditingTask(true);
    setCurrentEditingTaskId(t.id);
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleEditTarget = async (kelasId, currentTarget) => {
    const { value: newTarget } = await Swal.fire({
      title: 'Edit Target Mahasiswa',
      input: 'number',
      inputValue: currentTarget,
      showCancelButton: true,
      confirmButtonText: 'Simpan',
    });

    if (newTarget) {
      try {
        await updateTargetMahasiswa(kelasId, newTarget);
        notify.success('Target berhasil diperbarui!');
        fetchKelas();
      } catch (e) { notify.error('Gagal memperbarui target'); }
    }
  };

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="dashboard-container">
      {/* Overlay */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      <aside className={`sidebar print-hide ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <button className="btn-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
          <img src="/poli.png" alt="Logo" />
          <div>Politeknik Negeri<span>Teknik Elektro</span></div>
        </Link>
        <ul className="nav-links">
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
              style={{ cursor: 'pointer' }}
            >
              📊 Overview
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'kelas' ? 'active' : ''}`}
              onClick={() => setActiveTab('kelas')}
              style={{ cursor: 'pointer' }}
            >
              🏫 Manajemen Kelas
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'tugas' ? 'active' : ''}`}
              onClick={() => setActiveTab('tugas')}
              style={{ cursor: 'pointer' }}
            >
              📚 Manajemen Tugas
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'laporan' ? 'active' : ''}`}
              onClick={() => setActiveTab('laporan')}
              style={{ cursor: 'pointer' }}
            >
              📥 Laporan Pengumpulan
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'kehadiran' ? 'active' : ''}`}
              onClick={() => setActiveTab('kehadiran')}
              style={{ cursor: 'pointer' }}
            >
              👥 Daftar Hadir
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'berita_acara' ? 'active' : ''}`}
              onClick={() => setActiveTab('berita_acara')}
              style={{ cursor: 'pointer' }}
            >
              📑 Berita Acara
            </a>
          </li>
          <li className="nav-item">
            <a
              className={`nav-link ${activeTab === 'pengiriman_nilai' ? 'active' : ''}`}
              onClick={() => setActiveTab('pengiriman_nilai')}
              style={{ cursor: 'pointer' }}
            >
              Pengiriman Nilai
            </a>
          </li>
        </ul>
        <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem' }}>
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '0.75rem',
            borderRadius: '12px',
            marginBottom: '1rem',
            textAlign: 'center',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fcd34d' }}>
              {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>
              {currentTime.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
          </div>
          <button className="btn btn-outline btn-full" onClick={handleLogout}>🚪 Keluar</button>
        </div>
      </aside>
      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="page-info">
              <h2 style={{ margin: 0 }}>Portal Dosen</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Kelola perkuliahan dan evaluasi mahasiswa</p>
            </div>
          </div>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: 'var(--secondary)' }}>{namaDosen}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>NIDN: {nidn}</div>
            </div>
            <div className="avatar">D</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="tab-section-fade">
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1>Halo, {namaDosen.split(' ')[0]}! 👋</h1>
                <p>Selamat datang kembali. Mari pantau kemajuan akademik kelas Anda hari ini.</p>
              </div>
              <div className="welcome-stats">
                <div className="mini-stat">
                  <span className="stat-label">Total Kelas</span>
                  <span className="stat-val">{kelas.length}</span>
                </div>

              </div>
            </div>

            <div className="section-title-wrapper" style={{ marginTop: '2.5rem', marginBottom: '1.5rem' }}>
              <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>🏫</span> Ringkasan Kelas Anda
              </h3>
            </div>

            <div className="class-grid">
              {kelas.length === 0 ? (
                <div className="empty-selection-state card-glass" style={{ gridColumn: '1 / -1' }}>
                  <span style={{ fontSize: '3rem' }}>📭</span>
                  <h3>Belum ada kelas aktif</h3>
                  <p>Mulai dengan membuat kelas baru di menu Manajemen Kelas.</p>
                </div>
              ) : kelas.map(k => (
                <div key={k.id} className="class-card-v2">
                  <div className="class-card-header">
                    <div className="class-code-badge">{k.kode_kelas}</div>
                    <div className="class-actions-mini">
                      <button
                        className="btn-action-view"
                        onClick={() => {
                          setSelectedLaporanKelas(k.id);
                          fetchLaporan(k.id);
                          setActiveTab('laporan');
                        }}
                      >
                        📊 Laporan
                      </button>
                    </div>
                  </div>
                  <div className="class-card-body">
                    <h4 className="class-card-name">{k.nama_kelas}</h4>
                    <p className="class-card-subject">{k.matakuliah_nama}</p>

                    <div className="class-card-attendance">
                      <div className="attendance-info">
                        <span className="label">Presensi Hari Ini:</span>
                        <span className="value">{k.mahasiswa_terdaftar || 0} / {k.jumlah_mahasiswa || 0}</span>
                      </div>
                      <div className="progress-mini">
                        <div
                          className="progress-fill-mini"
                          style={{ width: `${Math.min(100, ((k.mahasiswa_terdaftar || 0) / (k.jumlah_mahasiswa || 1)) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="class-card-footer">
                    <div className="target-pill"> {k.jumlah_mahasiswa} Mahasiswa</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'kelas' && (
          <div className="tab-section-fade">


            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">🛠️</span>
                <h3 className="section-title">Konfigurasi Kelas & Akademik</h3>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
              <div className="card-glass">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>📚</span> Tambah Mata Kuliah
                </h3>
                <form onSubmit={handleBuatMatakuliah} className="modern-form">
                  <div className="form-group">
                    <label>Kode Mata Kuliah</label>
                    <input type="text" className="form-control" required value={newMatakuliah.kode_mk} onChange={e => setNewMatakuliah({ ...newMatakuliah, kode_mk: e.target.value })} placeholder="Contoh: MK003" />
                  </div>
                  <div className="form-group">
                    <label>Nama Mata Kuliah</label>
                    <input type="text" className="form-control" required value={newMatakuliah.nama_mk} onChange={e => setNewMatakuliah({ ...newMatakuliah, nama_mk: e.target.value })} placeholder="Contoh: Basis Data" />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select className="form-control" required value={newMatakuliah.kategori} onChange={e => setNewMatakuliah({ ...newMatakuliah, kategori: e.target.value })}>
                      <option value="ATS">ATS (Asesmen Tengah Semester)</option>
                      <option value="AAS">AAS (Asesmen Akhir Semester)</option>
                    </select>
                  </div>
                  <button type="submit" className="btn btn-primary btn-full"> Simpan Mata Kuliah</button>
                </form>
              </div>

              <div className="card-glass">
                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.2rem' }}>🏫</span> Buat Kelas Baru
                </h3>
                <form onSubmit={handleBuatKelas} className="modern-form">
                  <div className="form-group">
                    <label>Nama Kelas</label>
                    <input type="text" className="form-control" required value={newKelas.nama_kelas} onChange={e => setNewKelas({ ...newKelas, nama_kelas: e.target.value })} placeholder="Contoh: Kelas A Pagi" />
                  </div>
                  <div className="form-group">
                    <label>Mata Kuliah</label>
                    <input type="text" className="form-control" required value={newKelas.matakuliah_nama} onChange={e => setNewKelas({ ...newKelas, matakuliah_nama: e.target.value })} placeholder="Ketik nama mata kuliah..." />
                  </div>
                  <div className="form-group">
                    <label>Kode Kelas (Unik)</label>
                    <input type="text" className="form-control" required value={newKelas.kode_kelas} onChange={e => setNewKelas({ ...newKelas, kode_kelas: e.target.value })} placeholder="Contoh: WEB-2024" />
                  </div>
                  <div className="form-group">
                    <label>Jumlah Mahasiswa</label>
                    <input type="number" min="1" className="form-control" required value={newKelas.jumlah_mahasiswa} onChange={e => setNewKelas({ ...newKelas, jumlah_mahasiswa: e.target.value })} placeholder="Contoh: 30" />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full"> Buat Kelas Aktif</button>
                </form>
              </div>
            </div>

            <div className="card-glass table-container" style={{ marginTop: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📜</span> Daftar Seluruh Kelas Anda
              </h3>
              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nama Kelas</th>
                      <th>Mata Kuliah</th>
                      <th>Kode Akses</th>
                      <th style={{ textAlign: 'center' }}>Status Mahasiswa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelas.map((k, idx) => (
                      <tr key={idx}>
                        <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{k.nama_kelas}</td>
                        <td>{k.matakuliah_nama}</td>
                        <td>
                          <span className="code-access-pill">{k.kode_kelas}</span>
                        </td>
                        <td>
                          <div className="status-progress-cell">
                            <div className="status-labels">
                              <span className="joined">👥 {k.mahasiswa_terdaftar || 0} / {k.jumlah_mahasiswa}</span>
                              <button
                                className="btn-edit-inline"
                                onClick={() => handleEditTarget(k.id, k.jumlah_mahasiswa)}
                                title="Edit Detail"
                              >
                                ✏️
                              </button>
                            </div>
                            <div className="mini-progress-bar">
                              <div
                                className="fill"
                                style={{ width: `${Math.min(100, ((k.mahasiswa_terdaftar || 0) / (k.jumlah_mahasiswa || 1)) * 100)}%` }}
                              ></div>
                            </div>
                            <span className="present-count">{k.mahasiswa_hadir || 0} Mahasiswa Hadir</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tugas' && (
          <div className="tab-section-fade">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">📚</span>
                <h3 className="section-title">Manajemen Tugas</h3>
              </div>
              <div className="class-selector-wrapper">
                <label>Pilih Kelas:</label>
                <select className="form-control" value={selectedKelas} onChange={e => { setSelectedKelas(e.target.value); fetchTugas(e.target.value); }}>
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas} - {k.matakuliah_nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedKelas ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
                <div className="card-glass">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>{isEditingTask ? '✏️' : '📝'}</span>
                    {isEditingTask ? 'Edit Tugas' : 'Buat Tugas Baru'}
                  </h3>
                  <form onSubmit={handleBuatTugas} className="modern-form">
                    <div className="form-group">
                      <label>Judul Tugas</label>
                      <input type="text" className="form-control" placeholder="Contoh: Implementasi CRUD" required value={newTugas.judul} onChange={e => setNewTugas({ ...newTugas, judul: e.target.value })} />
                    </div>
                    <div className="form-group">
                      <label>Deskripsi</label>
                      <textarea className="form-control" required value={newTugas.deskripsi} onChange={e => setNewTugas({ ...newTugas, deskripsi: e.target.value })} rows="4" placeholder="Jelaskan instruksi tugas secara detail..."></textarea>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label>📅 Tanggal Pelaksanaan</label>
                        <input type="date" className="form-control" required value={newTugas.tanggal} onChange={e => setNewTugas({ ...newTugas, tanggal: e.target.value })} />
                      </div>
                      <div className="form-group">
                        <label>🕒 Waktu Pelaksanaan (Jam)</label>
                        <input type="text" className="form-control" required value={newTugas.jam_pelaksanaan} onChange={e => setNewTugas({ ...newTugas, jam_pelaksanaan: e.target.value })} placeholder="Contoh: 08:00 - 10:00" />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Lampiran File (Opsional)</label>
                      <div className="file-input-wrapper">
                        <input type="file" id="tugasFileInput" className="form-control" onChange={e => setTugasFile(e.target.files[0])} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                      <button type="submit" className="btn btn-primary btn-full">
                        {isEditingTask ? '💾 Perbarui Tugas' : '🚀 Publikasikan Tugas'}
                      </button>
                      {isEditingTask && (
                        <button type="button" className="btn btn-outline" onClick={resetTaskForm}>
                          Batal
                        </button>
                      )}
                    </div>
                  </form>
                </div>

                <div className="card-glass">
                  <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.2rem' }}>📋</span> Daftar Tugas Terbit
                  </h3>
                  <div className="task-list">
                    {tugas.length === 0 ? (
                      <div className="empty-state">
                        <p>Belum ada tugas yang dibuat untuk kelas ini.</p>
                      </div>
                    ) : tugas.map(t => (
                      <div key={t.id} className="task-item-card">
                        <div className="task-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <strong>{t.judul}</strong>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button
                              className="btn-edit-inline"
                              onClick={() => handleEditClick(t)}
                              title="Edit Tugas"
                            >
                              ✏️
                            </button>
                            <span className="task-badge">Aktif</span>
                          </div>
                        </div>
                        <p className="task-desc">{t.deskripsi.substring(0, 100)}{t.deskripsi.length > 100 ? '...' : ''}</p>
                        <div className="task-footer" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem' }}>
                          <span className="task-date">📅 Tanggal: {new Date(t.waktu_mulai || t.tenggat_waktu).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                          <span className="task-date">🕒 Waktu: {t.jam_pelaksanaan || 'Belum diatur'}</span>
                          {t.file_url && (
                            <a href={t.file_url} target="_blank" rel="noreferrer" className="task-attachment">
                              📎 Lampiran
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="empty-selection-state card-glass">
                <span style={{ fontSize: '3rem' }}>📁</span>
                <h3>Silakan pilih kelas terlebih dahulu</h3>
                <p>Pilih kelas dari dropdown di atas untuk mengelola tugas.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'laporan' && (
          <div className="tab-section-fade">
            <div className="section-header print-hide">
              <div className="section-title-group">
                <span className="section-icon">📊</span>
                <h3 className="section-title">Laporan Pengumpulan Tugas</h3>
              </div>
              <div className="class-selector-wrapper">
                <label>Pilih Kelas:</label>
                <select
                  className="form-control"
                  value={selectedLaporanKelas}
                  onChange={e => { setSelectedLaporanKelas(e.target.value); fetchLaporan(e.target.value); }}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas} — {k.matakuliah_nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedLaporanKelas ? (
              <div className="card-glass table-container print-section">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📋 Rekapitulasi Jawaban Mahasiswa</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }} className="print-hide">
                    {/* Fitur kirim nilai telah dipindahkan ke tab Pengiriman Nilai */}
                    {(() => {
                      return null;
                    })()}
                    <button className="btn btn-outline" onClick={() => window.print()}>
                      🖨️ Cetak PDF / Laporan
                    </button>
                  </div>
                </div>
                {laporan.length === 0 ? (
                  <div className="empty-state">
                    <p>Belum ada mahasiswa yang mengumpulkan tugas di kelas ini.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Mahasiswa</th>
                          <th>Tugas</th>
                          <th>Waktu Kumpul</th>
                          <th>Jawaban & File</th>
                          <th style={{ textAlign: 'center' }}>Kategori</th>
                          <th>Input Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        {laporan.map((item, idx) => {
                          const kumpulDate = new Date(item.waktu_kumpul);
                          const deadlineDate = new Date(item.tenggat_waktu);

                          // Ambil jam terakhir dari jam_pelaksanaan jika ada (misal: "08:00 - 10:00")
                          const jamPelaksanaan = item.jam_pelaksanaan || "";
                          const times = jamPelaksanaan.match(/(\d{1,2}[:.]\d{2})/g);

                          if (times && times.length > 0) {
                            const lastTime = times[times.length - 1];
                            const [hh, mm] = lastTime.includes(':') ? lastTime.split(':') : lastTime.split('.');
                            deadlineDate.setHours(parseInt(hh), parseInt(mm), 59, 999);
                          } else {
                            // Default ke akhir hari jika tidak ada jam spesifik
                            deadlineDate.setHours(23, 59, 59, 999);
                          }

                          const isLate = kumpulDate > deadlineDate;
                          const defaultNilai = item.nilai !== null && item.nilai !== undefined
                            ? item.nilai
                            : (isLate ? 75 : 95);
                          return (
                            <tr key={idx}>
                              <td>
                                <div className="student-cell">
                                  <div className="avatar-sm">{item.nama_mahasiswa[0]}</div>
                                  <div>
                                    <div className="student-name">{item.nama_mahasiswa}</div>
                                    <div className="student-id">{item.nim}</div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="task-title-cell" style={{ fontWeight: 600 }}>{item.judul_tugas}</div>
                                {item.jam_pelaksanaan && (
                                  <div style={{ fontSize: '0.75rem', color: 'var(--primary)', marginTop: '0.25rem', fontWeight: 500 }}>
                                    🕒 Jadwal: {item.jam_pelaksanaan}
                                  </div>
                                )}
                              </td>
                              <td>
                                <div className={`time-cell ${isLate ? 'text-danger' : 'text-success'}`}>
                                  <div style={{ fontWeight: 600 }}>
                                    {new Date(item.waktu_kumpul).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                  {isLate && <span className="late-badge">Terlambat</span>}
                                </div>
                              </td>
                              <td>
                                <div className="answer-cell">
                                  {item.file_url && (
                                    <a href={item.file_url} target="_blank" rel="noreferrer" className="file-link">
                                      📎 Download File
                                    </a>
                                  )}
                                  <div className="text-preview" title={item.jawaban_teks}>
                                    {item.jawaban_teks || '-'}
                                  </div>
                                </div>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={`badge-pill ${item.kategori === 'ATS' ? 'ats' : 'aas'}`}>
                                  {item.kategori}
                                </span>
                              </td>
                              <td>
                                <div className="score-cell-container">
                                  <div className="current-score-display">
                                    <span className="score-label">Nilai:</span>
                                    <span className="score-value">{item.nilai || '-'}</span>
                                  </div>
                                  <div className="score-input-group print-hide">
                                    <input
                                      type="number"
                                      min="0"
                                      max="100"
                                      defaultValue={defaultNilai}
                                      id={`nilai-${item.pengumpulan_id}`}
                                      className="form-control input-sm"
                                    />
                                    <button
                                      className="btn btn-primary btn-icon-only"
                                      onClick={() => {
                                        const val = document.getElementById(`nilai-${item.pengumpulan_id}`).value;
                                        if (val) handleBeriNilai(item.pengumpulan_id, val);
                                      }}
                                      title="Simpan Nilai"
                                    >
                                      💾
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-selection-state card-glass">
                <span style={{ fontSize: '3rem' }}>📉</span>
                <h3>Pilih kelas untuk melihat laporan pengumpulan</h3>
                <p>Data pengumpulan akan muncul setelah Anda memilih salah satu kelas Anda.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'kehadiran' && (
          <div className="tab-section-fade">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">👥</span>
                <h3 className="section-title">Daftar Hadir Kelas</h3>
              </div>
              <div className="class-selector-wrapper">
                <label>Pilih Kelas:</label>
                <select
                  className="form-control"
                  value={selectedKehadiranKelas}
                  onChange={e => { setSelectedKehadiranKelas(e.target.value); fetchKehadiran(e.target.value); }}
                >
                  <option value="">-- Pilih Kelas --</option>
                  {kelas.map(k => (
                    <option key={k.id} value={k.id}>{k.nama_kelas} — {k.matakuliah_nama}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedKehadiranKelas ? (
              <div className="card-glass table-container">
                <div className="attendance-header">
                  <h3 style={{ margin: 0, fontSize: '1.25rem' }}>📊 Monitoring Kehadiran Real-time</h3>
                  {(() => {
                    const currentClass = kelas.find(k => k.id === parseInt(selectedKehadiranKelas));
                    const targetMahasiswa = currentClass ? currentClass.jumlah_mahasiswa : kehadiran.length;
                    const hadirCount = kehadiran.filter(m => m.status_hadir === 'Hadir').length;
                    const tidakHadirCount = Math.max(0, targetMahasiswa - hadirCount);
                    const percent = targetMahasiswa > 0 ? Math.round((hadirCount / targetMahasiswa) * 100) : 0;

                    return currentClass && (
                      <div className="attendance-stats-v2">
                        <div className="stat-group">
                          <div className="stat-pill-v2 hadir">
                            <span className="val">{hadirCount}</span>
                            <span className="lab">Hadir</span>
                          </div>
                          <div className="stat-pill-v2 alpha">
                            <span className="val">{tidakHadirCount}</span>
                            <span className="lab">Belum Hadir</span>
                          </div>
                        </div>
                        <div className="progress-container-v2">
                          <div className="progress-label">Persentase: {percent}%</div>
                          <div className="progress-track">
                            <div className="progress-fill" style={{ width: `${percent}%` }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {kehadiran.length === 0 ? (
                  <div className="empty-state">
                    <p>Belum ada mahasiswa yang bergabung di kelas ini.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="modern-table">
                      <thead>
                        <tr>
                          <th>Identitas Mahasiswa</th>
                          <th>NIM Absen</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                          <th style={{ textAlign: 'center' }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kehadiran.map((item, idx) => (
                          <tr key={idx}>
                            <td>
                              <div className="student-cell">
                                <div className="avatar-sm">{item.nama_lengkap[0]}</div>
                                <div>
                                  <div className="student-name">{item.nama_lengkap}</div>
                                  <div className="student-id">{item.nim}</div>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="nim-badge">{item.absen_nim || '-'}</span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <span className={`status-pill ${item.status_hadir === 'Hadir' ? 'hadir' : 'alpha'}`}>
                                {item.status_hadir === 'Hadir' ? '✓ HADIR' : '○ BELUM HADIR'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {item.tanda_tangan ? (
                                <button
                                  className="btn-action-view"
                                  onClick={() => setShowSignatureModal({ signature: item.tanda_tangan, nama: item.nama_lengkap })}
                                >
                                  📝 Lihat TTD
                                </button>
                              ) : <span className="text-muted-sm">Belum Ada</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-selection-state card-glass">
                <span style={{ fontSize: '3rem' }}>👥</span>
                <h3>Pilih kelas untuk monitoring kehadiran</h3>
                <p>Data absensi mahasiswa akan muncul di sini secara real-time.</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'berita_acara' && (
          <div className="tab-section-fade">
            <div className="section-header print-hide">
              <div className="section-title-group">
                <span className="section-icon">📑</span>
                <h3 className="section-title">Berita Acara Perkuliahan</h3>
              </div>
            </div>

            <div className="card-glass print-hide" style={{ marginBottom: '2.5rem' }}>
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>✍️</span> Buat Berita Acara Manual
              </h3>
              <form onSubmit={handleSimpanBeritaAcara} className="modern-form">
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Pilih Kelas (Untuk Isi Otomatis)</label>
                    <select
                      className="form-control"
                      onChange={e => {
                        const k = kelas.find(item => item.id === parseInt(e.target.value));
                        if (k) {
                          setBeritaAcaraInput({
                            ...beritaAcaraInput,
                            prodi: 'D4 Teknik Informatika',
                            matakuliah: k.matakuliah_nama,
                            kelas: k.nama_kelas,
                            kategori: k.kategori || 'ATS',
                            waktu: k.latest_task_time || '',
                            jumlah_terdaftar: k.jumlah_mahasiswa,
                            jumlah_hadir: k.mahasiswa_hadir,
                            jumlah_tidak_hadir: Math.max(0, k.jumlah_mahasiswa - k.mahasiswa_hadir)
                          });
                        }
                      }}
                    >
                      <option value="">-- Pilih Kelas --</option>
                      {kelas.map(k => (
                        <option key={k.id} value={k.id}>{k.nama_kelas} - {k.matakuliah_nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Nama Dosen Pengampu</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.nama_dosen} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, nama_dosen: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Hari, Tanggal</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.hari_tanggal} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, hari_tanggal: e.target.value })} placeholder="Senin, 15 Mei 2026" />
                  </div>
                  <div className="form-group">
                    <label>Program Studi</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.prodi} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, prodi: e.target.value })} placeholder="D4 Teknik Informatika" />
                  </div>
                  <div className="form-group">
                    <label>Mata Kuliah</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.matakuliah} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, matakuliah: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Semester</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.semester} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, semester: e.target.value })} placeholder="Genap 2023/2024" />
                  </div>
                  <div className="form-group">
                    <label>Kelas</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.kelas} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, kelas: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Waktu Pelaksanaan</label>
                    <input type="text" className="form-control" required value={beritaAcaraInput.waktu} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, waktu: e.target.value })} placeholder="08:00 - 10:30 WITA" />
                  </div>
                  <div className="form-group">
                    <label>Kategori</label>
                    <select className="form-control" value={beritaAcaraInput.kategori} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, kategori: e.target.value })}>
                      <option value="ATS">ATS</option>
                      <option value="AAS">AAS</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Mahasiswa</label>
                    <input type="number" className="form-control" required value={beritaAcaraInput.jumlah_terdaftar} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, jumlah_terdaftar: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Jumlah Hadir</label>
                    <input type="number" className="form-control" required value={beritaAcaraInput.jumlah_hadir} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, jumlah_hadir: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>Tidak Hadir</label>
                    <input type="number" className="form-control" required value={beritaAcaraInput.jumlah_tidak_hadir} onChange={e => setBeritaAcaraInput({ ...beritaAcaraInput, jumlah_tidak_hadir: e.target.value })} />
                  </div>
                </div>
                <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '2rem' }}>💾 Simpan Berita Acara</button>
              </form>
            </div>

            <div className="card-glass table-container print-hide">
              <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ fontSize: '1.2rem' }}>📜</span> Daftar Berita Acara Tersimpan
              </h3>
              {beritaAcaraList.length === 0 ? (
                <div className="empty-state">
                  <p>Belum ada berita acara yang disimpan.</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="modern-table">
                    <thead>
                      <tr>
                        <th>Mata Kuliah / Kelas</th>
                        <th>Dosen</th>
                        <th>Tanggal</th>
                        <th style={{ textAlign: 'center' }}>Kategori</th>
                        <th style={{ textAlign: 'center' }}>Hadir</th>
                        <th style={{ textAlign: 'center' }}>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beritaAcaraList.map(b => (
                        <tr key={b.id}>
                          <td>
                            <strong style={{ display: 'block', color: 'var(--secondary)' }}>{b.matakuliah}</strong>
                            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{b.kelas}</span>
                          </td>
                          <td>{b.nama_dosen}</td>
                          <td>{b.hari_tanggal}</td>
                          <td style={{ textAlign: 'center' }}>
                            <span className={`badge-pill ${b.kategori === 'ATS' ? 'ats' : 'aas'}`}>{b.kategori}</span>
                          </td>
                          <td style={{ textAlign: 'center', fontWeight: 'bold' }}>{b.jumlah_hadir} / {b.jumlah_terdaftar}</td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-primary btn-mini-action" onClick={() => handleCetak(b)} title="Cetak Berita Acara">🖨️</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Printable Document Area (Hanya muncul saat klik Cetak di Tab Berita Acara) */}
            {cetakData && (
              <div className="print-section" style={{ background: '#fff', color: '#000', padding: '2rem', borderTop: '2px solid #3b82f6', marginTop: '2rem' }}>
                <div className="print-hide" style={{ textAlign: 'right', marginBottom: '1rem' }}>
                  <button className="btn btn-secondary" onClick={() => setCetakData(null)}>❌ Tutup Preview Cetak</button>
                </div>
                <div style={{ fontFamily: 'Times New Roman, serif', lineHeight: '1.6' }}>
                  <h2 style={{ textAlign: 'center', marginBottom: '2rem', textTransform: 'uppercase', textDecoration: 'underline' }}>Berita Acara Pelaksanaan {cetakData.kategori}</h2>

                  <p style={{ textAlign: 'justify' }}>
                    Pada hari ini <strong>{cetakData.hari_tanggal.split(',')[0]}</strong> tanggal <strong>{cetakData.hari_tanggal.split(' ')[1] || '...'}</strong> bulan <strong>{cetakData.hari_tanggal.split(' ')[2] || '...'}</strong> tahun <strong>{cetakData.hari_tanggal.split(' ')[3] || '...'}</strong>, telah dilaksanakan <strong>{cetakData.kategori} (Asesmen Tengah/Akhir Semester)</strong> dengan rincian sebagai berikut:
                  </p>

                  <table style={{ width: '100%', margin: '1.5rem 0', borderCollapse: 'collapse', border: 'none' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '30%', padding: '0.3rem 0', border: 'none', color: '#000' }}>Mata Kuliah</td>
                        <td style={{ width: '5%', padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.matakuliah}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>Program Studi</td>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.prodi}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>Semester</td>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.semester}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>Kelas</td>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.kelas}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>Waktu</td>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.waktu}</strong></td>
                      </tr>
                      <tr>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>Dosen Pengampu</td>
                        <td style={{ padding: '0.3rem 0', border: 'none', color: '#000' }}>:</td>
                        <td style={{ border: 'none', color: '#000' }}><strong>{cetakData.nama_dosen}</strong></td>
                      </tr>
                    </tbody>
                  </table>

                  <h4 style={{ marginTop: '1.5rem', marginBottom: '0.5rem', color: '#000' }}>Rincian Kehadiran Mahasiswa:</h4>
                  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid black', textAlign: 'center', color: '#000' }}>
                    <thead>
                      <tr>
                        <th style={{ border: '1px solid black', padding: '0.5rem', color: '#000' }}>Total Terdaftar</th>
                        <th style={{ border: '1px solid black', padding: '0.5rem', color: '#000' }}>Jumlah Hadir</th>
                        <th style={{ border: '1px solid black', padding: '0.5rem', color: '#000' }}>Jumlah Tidak Hadir</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>{cetakData.jumlah_terdaftar} Orang</td>
                        <td style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>{cetakData.jumlah_hadir} Orang</td>
                        <td style={{ border: '1px solid black', padding: '0.5rem', fontWeight: 'bold' }}>{cetakData.jumlah_tidak_hadir} Orang</td>
                      </tr>
                    </tbody>
                  </table>

                  <p style={{ textAlign: 'justify', marginTop: '1.5rem', color: '#000' }}>
                    Demikian berita acara ini dibuat dengan sebenar-benarnya untuk dapat dipergunakan sebagaimana mestinya.
                  </p>

                  <div style={{ marginTop: '4rem', display: 'flex', justifyContent: 'flex-end', color: '#000' }}>
                    <div style={{ textAlign: 'center', width: '300px' }}>
                      <p>................., {(() => {
                        const val = cetakData.hari_tanggal || "";
                        return val.includes(',') ? val.split(',')[1].trim() : val;
                      })()}</p>
                      <p>Dosen Pengampu,</p>
                      <br /><br /><br /><br />
                      <p style={{ textDecoration: 'underline', fontWeight: 'bold', marginBottom: '0' }}>{cetakData.nama_dosen}</p>
                      <p style={{ margin: '0' }}>NIDN. {nidn}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Pengiriman Nilai */}
        {activeTab === 'pengiriman_nilai' && (
          <div className="tab-section-fade">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">📤</span>
                <h3 className="section-title">Pengiriman Laporan Perkuliahan (Nilai, Daftar Hadir, Berita Acara)</h3>
              </div>
            </div>

            <div className="card-glass table-container">
              <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Silakan klik tombol <strong>Kirim Nilai ke Jurusan</strong> untuk kelas yang sudah selesai. Setelah terkirim, data nilai, daftar hadir, dan berita acara akan langsung dapat dipantau oleh Kajur dan Sekjur.
              </p>

              <div className="table-responsive">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Nama Kelas</th>
                      <th>Mata Kuliah</th>
                      <th>Kode Kelas</th>
                      <th style={{ textAlign: 'center' }}>Status Pengiriman</th>
                      <th style={{ textAlign: 'center' }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kelas.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Belum ada kelas.</td>
                      </tr>
                    ) : (
                      kelas.map(k => (
                        <tr key={k.id}>
                          <td style={{ fontWeight: 600, color: 'var(--secondary)' }}>{k.nama_kelas}</td>
                          <td>{k.matakuliah_nama}</td>
                          <td><span className="code-access-pill">{k.kode_kelas}</span></td>
                          <td style={{ textAlign: 'center' }}>
                            {k.nilai_dikirim ? (
                              <span style={{
                                background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)',
                                padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem'
                              }}>
                                ✓ Terkirim
                              </span>
                            ) : (
                              <span style={{
                                background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.2)',
                                padding: '0.4rem 0.8rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.85rem'
                              }}>
                                ⚠ Belum Dikirim
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            {!k.nilai_dikirim && (
                              <button
                                className="btn btn-primary"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                                onClick={async () => {
                                  setSelectedLaporanKelas(k.id); // Set id untuk dipakai handleKirimNilai
                                  // Modifikasi handleKirimNilai behavior atau jalankan logic kirim nilai langsung
                                  const result = await Swal.fire({
                                    title: 'Kirim Data ke Jurusan?',
                                    text: 'Nilai, Daftar Hadir, dan Berita Acara untuk kelas ini akan dikirim ke Kajur dan Sekjur.',
                                    icon: 'question',
                                    showCancelButton: true,
                                    confirmButtonText: 'Ya, Kirim',
                                    cancelButtonText: 'Batal',
                                    background: '#1e293b', color: '#fff', confirmButtonColor: '#0284c7', cancelButtonColor: '#64748b'
                                  });
                                  if (result.isConfirmed) {
                                    try {
                                      await kirimNilaiKelas(k.id);
                                      notify.success('Data perkuliahan berhasil dikirim ke Kajur & Sekjur!');
                                      fetchKelas();
                                    } catch (e) { notify.error('Kesalahan koneksi'); }
                                  }
                                }}
                              >
                                📤 Kirim Nilai ke Jurusan
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Tanda Tangan */}
        {showSignatureModal && (
          <div className="modal-overlay tab-section-fade">
            <div className="card-glass modal-content-v2">
              <button
                className="btn-modal-close"
                onClick={() => setShowSignatureModal(null)}
              >
                &times;
              </button>
              <h3 style={{ marginBottom: '1.5rem', color: 'var(--secondary)' }}>
                🖋️ Tanda Tangan: {showSignatureModal.nama}
              </h3>
              <div className="signature-display-box">
                <img src={showSignatureModal.signature} alt="Signature" />
              </div>
              <button className="btn btn-primary btn-full" onClick={() => setShowSignatureModal(null)}>Tutup Preview</button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


export default DashboardDosen;
