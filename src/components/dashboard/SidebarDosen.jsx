import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function SidebarDosen({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, handleLogout }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
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
            onClick={() => handleTabClick('dashboard')}
            style={{ cursor: 'pointer' }}
          >
            📊 Overview
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'kelas' ? 'active' : ''}`}
            onClick={() => handleTabClick('kelas')}
            style={{ cursor: 'pointer' }}
          >
            🏫 Manajemen Kelas
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'tugas' ? 'active' : ''}`}
            onClick={() => handleTabClick('tugas')}
            style={{ cursor: 'pointer' }}
          >
            📚 Manajemen Tugas
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'laporan' ? 'active' : ''}`}
            onClick={() => handleTabClick('laporan')}
            style={{ cursor: 'pointer' }}
          >
            📥 Laporan Pengumpulan
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'kehadiran' ? 'active' : ''}`}
            onClick={() => handleTabClick('kehadiran')}
            style={{ cursor: 'pointer' }}
          >
            👥 Daftar Hadir
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'berita_acara' ? 'active' : ''}`}
            onClick={() => handleTabClick('berita_acara')}
            style={{ cursor: 'pointer' }}
          >
            📑 Berita Acara
          </a>
        </li>
        <li className="nav-item">
          <a
            className={`nav-link ${activeTab === 'pengiriman_nilai' ? 'active' : ''}`}
            onClick={() => handleTabClick('pengiriman_nilai')}
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
  );
}

export default SidebarDosen;
