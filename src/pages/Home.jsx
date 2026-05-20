import { Link } from 'react-router-dom';

function Home() {
  return (
    <section className="hero">
      <div className="hero-left">
        <h1>Selamat Datang di Portal <span>Teknik Elektro</span></h1>
        <p>Membangun masa depan cerah bersama Politeknik Negeri Manado. Platform terpadu untuk Dosen dan Mahasiswa.</p>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <Link to="/register" className="btn btn-primary" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Daftar Sekarang</Link>
          <Link to="/login-mahasiswa" className="btn btn-outline" style={{ padding: '1rem 2rem', fontSize: '1.1rem' }}>Masuk Portal</Link>
        </div>
      </div>
      <div className="hero-right"></div>
    </section>
  );
}

export default Home;
