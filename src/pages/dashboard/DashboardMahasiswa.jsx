import { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';
import { getKelasByMahasiswa, gabungKelas, getTugasByKelas, getPengumpulanByMahasiswa, batalkanPengumpulan, submitPengumpulan } from '../../services/api';
import SidebarMahasiswa from '../../components/dashboard/SidebarMahasiswa';
import './DashboardMahasiswa.css';

function DashboardMahasiswa() {
  const location = useLocation();
  const navigate = useNavigate();
  // Fallback ID mahasiswa ke 1 (Andi Pratama) untuk testing jika belum diset dari login
  const mahasiswaId = location.state?.id || 1;
  const nim = location.state?.nim || '0000000';
  const namaMhs = location.state?.nama || 'Mahasiswa Aktif';

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [kelasSaya, setKelasSaya] = useState([]);
  const [kodeKelasInput, setKodeKelasInput] = useState('');
  const [tugas, setTugas] = useState([]);
  const [pengumpulan, setPengumpulan] = useState([]);
  const [jawaban, setJawaban] = useState('');
  const [fileUpload, setFileUpload] = useState(null);
  const [selectedTugas, setSelectedTugas] = useState(null);
  const [absenNim, setAbsenNim] = useState(nim);
  const [signature, setSignature] = useState(''); // Base64 signature


  useEffect(() => {
    fetchKelasSaya();
    fetchPengumpulan();
  }, []);

  const fetchKelasSaya = async () => {
    try {
      const data = await getKelasByMahasiswa(mahasiswaId);
      setKelasSaya(data);
    } catch (e) { console.error(e); }
  };

  const handleGabungKelas = async (e) => {
    e.preventDefault();
    if (!kodeKelasInput) return;

    if (!absenNim || !signature) {
      notify.warning('Anda harus mengisi NIM Absen dan menandatangani kehadiran!');
      return;
    }

    try {
      const data = await gabungKelas({
        mahasiswa_id: mahasiswaId,
        kode_kelas: kodeKelasInput,
        absen_nim: absenNim,
        tanda_tangan: signature
      });
      notify.success(data.message);
      setKodeKelasInput('');
      setSignature('');
      fetchKelasSaya();
    } catch (e) { notify.error(e.message || 'Gagal bergabung ke kelas'); }
  };

  const fetchTugasKelas = async (kelas_id) => {
    try {
      const data = await getTugasByKelas(kelas_id);
      setTugas(data);
    } catch (e) { console.error(e); }
  };

  const fetchPengumpulan = async () => {
    try {
      const data = await getPengumpulanByMahasiswa(mahasiswaId);
      setPengumpulan(data); // Simpan objek lengkap
    } catch (e) { console.error(e); }
  };

  const handleBatalPengiriman = async (tugas_id) => {
    const result = await notify.confirm('Batalkan Pengiriman?', 'Apakah Anda yakin ingin membatalkan pengiriman tugas ini?');
    if (!result.isConfirmed) return;
    try {
      // Temukan data pengumpulan sebelum dihapus untuk di-edit
      const submission = pengumpulan.find(p => p.tugas_id === tugas_id);

      await batalkanPengumpulan(mahasiswaId, tugas_id);
      
      notify.success('Pengiriman dibatalkan. Silakan edit kembali jawaban Anda.');
      fetchPengumpulan();

      // Otomatis buka form edit dengan data sebelumnya
      if (submission) {
        const taskObj = tugas.find(t => t.id === tugas_id);
        setSelectedTugas(taskObj);
        setJawaban(submission.jawaban_teks || '');
      }
    } catch (e) { notify.error(e.message || 'Gagal membatalkan pengiriman'); }
  };

  const handleKumpulTugas = async (e) => {
    e.preventDefault();

    if (!jawaban && !fileUpload) {
      notify.warning('Anda harus mengisi teks jawaban/link ATAU mengunggah file!');
      return;
    }

    try {
      await submitPengumpulan({
        tugas_id: selectedTugas.id,
        mahasiswa_id: mahasiswaId,
        jawaban_teks: jawaban
      }, fileUpload);
      
      notify.success('Tugas berhasil dikumpulkan!');
      fetchPengumpulan();
      setSelectedTugas(null);
      setJawaban('');
      setFileUpload(null);
      setSignature('');
    } catch (e) { notify.error(e.message || 'Gagal mengumpulkan tugas'); }
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

      <SidebarMahasiswa
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        handleLogout={handleLogout}
      />

      <main className="main-content">
        <header className="topbar">
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <button className="btn-hamburger" onClick={() => setSidebarOpen(true)}>☰</button>
            <div className="page-info">
              <h2 style={{ margin: 0 }}>{activeTab === 'dashboard' ? 'Overview' : 'Akademik'}</h2>
              <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>Selamat datang di portal mahasiswa</p>
            </div>
          </div>
          <div className="user-profile">
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700, color: '#000000ff' }}>{namaMhs}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{nim}</div>
            </div>
            <div className="avatar">{namaMhs[0]}</div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="tab-section-fade">
            <div className="welcome-banner">
              <div className="welcome-content">
                <h1>Halo, {namaMhs.split(' ')[0]}!</h1>
                <p>Jangan lupa periksa tenggat waktu tugas Anda hari ini.</p>
              </div>
              <div className="welcome-stats">
                <div className="mini-stat">
                  <span className="stat-label">Total Kelas</span>
                  <span className="stat-val">{kelasSaya.length}</span>
                </div>
                <div className="mini-stat">
                  <span className="stat-label">Tugas Terkirim</span>
                  <span className="stat-val">{pengumpulan.length}</span>
                </div>
              </div>
            </div>


            <div style={{ display: 'grid', gridTemplateColumns: '0.8fr 1.2fr', gap: '2.5rem' }}>
              <div>
                <div className="section-title-wrapper" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="section-title"> Gabung Kelas Baru</h3>
                </div>
                <div className="join-class-container">
                  <form onSubmit={handleGabungKelas} className="modern-form">
                    <div className="form-group">
                      <label>Kode Kelas</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Contoh: WEB-2024"
                        value={kodeKelasInput}
                        onChange={(e) => setKodeKelasInput(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Verifikasi NIM</label>
                      <input
                        type="text"
                        className="form-control"
                        value={absenNim}
                        onChange={e => setAbsenNim(e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Tanda Tangan Kehadiran</label>
                      <SignaturePad onSave={(data) => setSignature(data)} />
                      {signature && (
                        <div className="signature-preview-box">
                          <p style={{ fontSize: '0.75rem', color: '#10b981', marginBottom: '0.5rem', fontWeight: 700 }}>✅ Preview Tanda Tangan Anda:</p>
                          <img src={signature} alt="Signature Preview" className="signature-preview-img" />
                        </div>
                      )}
                    </div>
                    <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1rem' }}>
                      Gabung Sekarang
                    </button>
                  </form>
                </div>
              </div>

              <div>
                <div className="section-title-wrapper" style={{ marginBottom: '1.5rem' }}>
                  <h3 className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.5rem' }}></span> Kelas Aktif Saya
                  </h3>
                </div>

                <div className="class-grid">
                  {kelasSaya.length === 0 ? (
                    <div className="card-glass" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem' }}>
                      <span style={{ fontSize: '3rem' }}>📭</span>
                      <h4>Belum ada kelas</h4>
                      <p>Silakan bergabung ke kelas menggunakan kode dari dosen.</p>
                    </div>
                  ) : kelasSaya.map(k => {
                    const isSubmitted = pengumpulan.some(p => p.kelas_id === k.id);
                    return (
                      <div
                        key={k.id}
                        className={`student-class-card ${isSubmitted ? 'submitted' : ''}`}
                        onClick={() => { fetchTugasKelas(k.id); setActiveTab('tugas'); }}
                      >
                        <div className="class-card-icon">{isSubmitted ? '✅' : '📖'}</div>
                        <div className="class-card-info">
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <h4>{k.nama_kelas}</h4>
                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                              {isSubmitted && (
                                <span className="badge-pill submitted" style={{ fontSize: '0.65rem' }}>
                                  ✓ TERKIRIM
                                </span>
                              )}
                              {k.kategori && (
                                <span className={`badge-pill ${k.kategori.toLowerCase()}`} style={{ fontSize: '0.65rem' }}>
                                  {k.kategori}
                                </span>
                              )}
                            </div>
                          </div>
                          <p>{k.matakuliah_nama}</p>
                        </div>
                        <div className="class-card-meta">
                          <span className="dosen-tag">👤 {k.dosen}</span>
                          <div className="attendance-mini-badge">
                            👥 {k.mahasiswa_terdaftar || 0} / {k.jumlah_mahasiswa || 0}
                          </div>
                        </div>
                        <div className="card-progress-bar">
                          <div
                            className="card-progress-fill"
                            style={{ width: `${Math.min(100, ((k.mahasiswa_terdaftar || 0) / (k.jumlah_mahasiswa || 1)) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tugas' && (
          <div className="tab-section-fade">
            <div className="section-header">
              <div className="section-title-group">
                <span className="section-icon">📚</span>
                <h3 className="section-title">Manajemen Tugas Kelas</h3>
              </div>
            </div>

            <div className="task-layout">
              <div className="task-list-section">
                {tugas.length === 0 ? (
                  <div className="card-glass" style={{ textAlign: 'center', padding: '5rem' }}>
                    <span style={{ fontSize: '3.5rem' }}>📋</span>
                    <h3>Belum Ada Tugas</h3>
                    <p>Pilih kelas dari Dashboard atau kelas ini belum memiliki instruksi tugas.</p>
                  </div>
                ) : tugas.map(t => {
                  const submission = pengumpulan.find(p => p.tugas_id === t.id);
                  const isSubmitted = !!submission;
                  return (
                    <div key={t.id} className="student-task-item">
                      <div className="task-info-main">
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '1.1rem' }}>{t.judul}</h4>
                          <span className={`task-status-badge ${isSubmitted ? 'submitted' : 'pending'}`}>
                            {isSubmitted ? '✓ TERKIRIM' : '○ BELUM DIKUMPUL'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', marginTop: '0.5rem', gap: '0.25rem' }}>
                          <span className="task-deadline" style={{ color: 'var(--primary)', fontSize: '0.75rem' }}>
                            📅 Tanggal: {new Date(t.waktu_mulai || t.tenggat_waktu).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                          <span className="task-deadline" style={{ color: 'var(--secondary)', fontSize: '0.75rem', fontWeight: 600 }}>
                            🕒 Jadwal: {t.jam_pelaksanaan || 'Belum diatur'}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.75rem', lineHeight: '1.6' }}>
                          {t.deskripsi}
                        </p>
                        {t.file_url && (
                          <a href={t.file_url} target="_blank" rel="noreferrer" style={{
                            display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                            color: 'var(--primary)', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600,
                            marginTop: '0.5rem'
                          }}>
                            📎 Lampiran Materi/Tugas
                          </a>
                        )}
                      </div>
                      <div className="task-actions">
                        {isSubmitted ? (
                          <button
                            className="btn btn-outline"
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                            onClick={() => handleBatalPengiriman(t.id)}
                          >
                            🔄 Edit Pengiriman
                          </button>
                        ) : (
                          <button
                            className={`btn ${selectedTugas?.id === t.id ? 'btn-secondary' : 'btn-primary'}`}
                            onClick={() => setSelectedTugas(t)}
                          >
                            ✍️ Kerjakan
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="submission-section">
                {selectedTugas ? (
                  <div className="card-glass submission-card">
                    <h3 style={{ marginBottom: '1.5rem' }}>📤 Kumpulkan Tugas</h3>
                    <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: '12px', marginBottom: '2rem', borderLeft: '4px solid var(--primary)' }}>
                      <small style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.25rem' }}>Tugas yang dipilih:</small>
                      <strong style={{ color: 'var(--secondary)' }}>{selectedTugas.judul}</strong>
                    </div>

                    <form onSubmit={handleKumpulTugas} className="modern-form">
                      <div className="form-group">
                        <label>Teks Jawaban / Link External</label>
                        <textarea
                          className="form-control"
                          rows="6"
                          value={jawaban}
                          onChange={e => setJawaban(e.target.value)}
                          placeholder="Tulis jawaban teks atau lampirkan link dokumen (Google Drive/OneDrive) di sini..."
                        ></textarea>
                      </div>

                      <div className="form-group">
                        <label>Unggah Dokumen</label>
                        <div className="drop-zone" onClick={() => document.getElementById('file-input').click()}>
                          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📂</div>
                          <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600 }}>Klik untuk pilih file</p>
                          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>PDF, DOCX, ZIP, atau Gambar</p>
                          <input
                            id="file-input"
                            type="file"
                            hidden
                            onChange={e => setFileUpload(e.target.files[0])}
                          />
                        </div>
                        {fileUpload && (
                          <div className="file-selected-indicator">
                            📄 {fileUpload.name} ({(fileUpload.size / 1024).toFixed(1)} KB)
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                        <button type="submit" className="btn btn-primary btn-full">🚀 Kirim Tugas</button>
                        <button
                          type="button"
                          className="btn btn-outline"
                          onClick={() => { setSelectedTugas(null); setFileUpload(null); setJawaban(''); }}
                        >
                          Batal
                        </button>
                      </div>
                    </form>
                  </div>
                ) : (
                  <div className="card-glass" style={{ textAlign: 'center', opacity: 0.7, padding: '4rem' }}>
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <p>Pilih salah satu tugas untuk mulai mengerjakan dan mengumpulkan file.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Sub-component SignaturePad
function SignaturePad({ onSave }) {
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = (el) => {
    if (!el) return;
    const canvas = el;
    const ctx = canvas.getContext('2d');
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a'; // Warna gelap agar terlihat di kanvas putih

    const startDrawing = (e) => {
      setIsDrawing(true);
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    };

    const draw = (e) => {
      if (!isDrawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    };

    const stopDrawing = () => {
      if (!isDrawing) return;
      setIsDrawing(false);
      onSave(canvas.toDataURL());
    };

    canvas.onmousedown = startDrawing;
    canvas.onmousemove = draw;
    canvas.onmouseup = stopDrawing;
    canvas.onmouseleave = stopDrawing;

    // Touch support
    canvas.ontouchstart = (e) => {
      const touch = e.touches[0];
      startDrawing({ clientX: touch.clientX, clientY: touch.clientY });
      e.preventDefault();
    };
    canvas.ontouchmove = (e) => {
      const touch = e.touches[0];
      draw({ clientX: touch.clientX, clientY: touch.clientY });
      e.preventDefault();
    };
    canvas.ontouchend = () => {
      stopDrawing();
      e.preventDefault();
    };
  };

  const clearCanvas = () => {
    const canvas = document.getElementById('signature-canvas');
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    onSave('');
  };

  return (
    <div className="signature-pad-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--secondary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '1.1rem' }}>🖋️</span> Kanvas Tanda Tangan
        </span>
        <button
          type="button"
          className="btn"
          style={{
            padding: '0.35rem 0.85rem',
            fontSize: '0.75rem',
            color: '#ef4444',
            border: '1px solid #fee2e2',
            background: '#fef2f2',
            fontWeight: 700,
            borderRadius: '8px'
          }}
          onClick={clearCanvas}
        >
          🗑️ Bersihkan
        </button>
      </div>
      <canvas
        id="signature-canvas"
        ref={canvasRef}
        width={400}
        height={150}
        style={{ cursor: 'crosshair', width: '100%', height: '150px', background: '#fff', borderRadius: '12px', border: '1px solid var(--border)' }}
      />
      <div style={{ marginTop: '0.5rem', textAlign: 'center' }}>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8', fontStyle: 'italic' }}>Tanda tangan diperlukan sebagai verifikasi kehadiran</span>
      </div>
    </div>
  );
}


export default DashboardMahasiswa;
