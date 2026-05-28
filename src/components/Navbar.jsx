import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar({ isAuthPage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  if (isAuthPage) {
    return (
      <header className="navbar">
        <Link to="/" className="logo-container" style={{ textDecoration: 'none' }}>
          <img src="" alt="" />
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
        <img src="/" alt="" />
        <div className="logo-text">
          Politeknik Negeri Manado
          <span>Teknik Elektro</span>
        </div>
      </div>
      
      <button className="hamburger-btn" onClick={toggleMenu} aria-label="Toggle menu">
        ☰
      </button>

      <div className={`nav-menu ${isMenuOpen ? 'open' : ''}`}>
        <Link to="/login-dosen" className="btn btn-text" onClick={() => setIsMenuOpen(false)}>Dosen</Link>
        <Link to="/login-mahasiswa" className="btn btn-text" onClick={() => setIsMenuOpen(false)}>Mahasiswa</Link>
        <Link to="/login-admin" className="btn btn-text" style={{ color: '#fcd34d' }} onClick={() => setIsMenuOpen(false)}>👑 Admin</Link>
        <Link to="/register" className="btn btn-primary" onClick={() => setIsMenuOpen(false)}>Daftar</Link>
      </div>
    </header>
  );
}

export default Navbar;
