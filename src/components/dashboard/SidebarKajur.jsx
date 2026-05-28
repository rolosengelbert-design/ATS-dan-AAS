import { Link } from 'react-router-dom';

function SidebarKajur({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, dosenPendingLength, handleLogout }) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`} style={{ background: 'linear-gradient(180deg, #0f0c29, #302b63, #24243e)' }}>
      <button className="btn-sidebar-close" onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>✕</button>
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <img src="/poli.png" alt="Logo" />
        <div>Politeknik Negeri<span>Teknik Elektro</span></div>
      </Link>
      <div style={{ padding: '1rem 1.5rem', margin: '0.5rem 0', background: 'rgba(255,215,0,0.08)', borderRadius: '8px', borderLeft: '3px solid gold', fontSize: '0.8rem', color: '#fcd34d' }}>
        👑 Kepala Jurusan
      </div>
      <ul className="nav-links">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabClick('dashboard')}>
            Dashboard Eksekutif
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'verifikasi' ? 'active' : ''}`} onClick={() => handleTabClick('verifikasi')}>
            Verifikasi Dosen
            {dosenPendingLength > 0 && (
              <span style={{ background: '#ef4444', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', marginLeft: '8px' }}>
                {dosenPendingLength}
              </span>
            )}
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'dosen' ? 'active' : ''}`} onClick={() => handleTabClick('dosen')}>
            Data Seluruh Dosen
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'aktivitas' ? 'active' : ''}`} onClick={() => handleTabClick('aktivitas')}>
            Pantau Aktivitas
          </a>
        </li>
      </ul>
      <div className="sidebar-footer" style={{ marginTop: 'auto', padding: '1rem' }}>
        <button className="btn btn-outline btn-full" onClick={handleLogout}>🚪 Keluar</button>
      </div>
    </aside>
  );
}

export default SidebarKajur;
