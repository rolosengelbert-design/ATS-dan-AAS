import { Link } from 'react-router-dom';

function Navbar({ isAuthPage }) {
  if (isAuthPage) {
    return (
      <header className="navbar">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <img src="/poli.png" alt="Logo Polimdo" />
          <div className="logo-text">
            Politeknik Negeri Manado
            <span>Teknik Elektro</span>
          </div>
        </Link>
        <div className="nav-menu">
          <Link to="/" className="btn btn-outline">Kembali ke Beranda</Link>
        </div>
      </header>
    );
  }

  return (
    <header className="navbar">
      <div className="logo-container">
        <img src="/poli.png" alt="Logo Polimdo" />
        <div className="logo-text">
          Politeknik Negeri Manado
          <span>Teknik Elektro</span>
        </div>
      </div>
      <div className="nav-menu">
        <Link to="/login-dosen" className="btn btn-text">Dosen</Link>
        <Link to="/login-mahasiswa" className="btn btn-text">Mahasiswa</Link>
        <Link to="/login-admin" className="btn btn-text" style={{ color: '#fcd34d' }}>👑 Admin</Link>
        <Link to="/register" className="btn btn-primary">Daftar</Link>
      </div>
    </header>
  );
}

export default Navbar;
