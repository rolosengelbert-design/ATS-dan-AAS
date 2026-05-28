import { Link } from 'react-router-dom';

function SidebarSekjur({ sidebarOpen, setSidebarOpen, activeTab, setActiveTab, handleLogout }) {
  const handleTabClick = (tab) => {
    setActiveTab(tab);
    setSidebarOpen(false);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
      <button className="btn-sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
      <Link to="/" className="sidebar-logo" style={{ textDecoration: 'none' }}>
        <img src="/poli.png" alt="Logo" />
        <div>Politeknik Negeri<span>Teknik Elektro</span></div>
      </Link>
      <ul className="nav-links">
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => handleTabClick('dashboard')}>
            Dashboard
          </a>
        </li>
        <li className="nav-item">
          <a className={`nav-link ${activeTab === 'daftar' ? 'active' : ''}`} onClick={() => handleTabClick('daftar')}>
            Daftarkan Dosen
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

export default SidebarSekjur;
