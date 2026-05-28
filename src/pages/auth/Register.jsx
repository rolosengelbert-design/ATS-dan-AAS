import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../../services/api';

function Register() {
  const [tipeAkun, setTipeAkun] = useState('mahasiswa');
  const [nama, setNama] = useState('');
  const [identitas, setIdentitas] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await register({ tipeAkun, nama, identitas, email, password });
      
      alert(`Pendaftaran ${tipeAkun === 'dosen' ? 'Dosen' : 'Mahasiswa'} Berhasil!\n\nHalo ${nama}, silakan masuk menggunakan kredensial yang telah didaftarkan.`);
      if(tipeAkun === 'dosen') {
        navigate('/login-dosen');
      } else {
        navigate('/login-mahasiswa');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error.message || 'Terjadi kesalahan koneksi ke server. Pastikan Backend sudah berjalan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page" style={{ paddingTop: '100px', paddingBottom: '50px' }}>
      <div className="auth-card" style={{ maxWidth: '550px' }}>
        <div className="auth-header">
          <img src="/poli.png" alt="Logo" />
          <h2>Buat Akun Baru</h2>
          <p>Bergabung dengan portal Akademik Teknik Elektro</p>
        </div>
        
        <form onSubmit={handleRegister}>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
              <label>Tipe Akun</label>
              <select 
                className="form-control" 
                value={tipeAkun} 
                onChange={(e) => setTipeAkun(e.target.value)} 
                required
              >
                <option value="mahasiswa">Mahasiswa</option>
                <option value="dosen">Dosen</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="nama">Nama Lengkap</label>
            <input 
              type="text" 
              id="nama" 
              className="form-control" 
              placeholder="Masukkan nama lengkap" 
              required 
              value={nama}
              onChange={(e) => setNama(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="identitas">NIM / NIDN</label>
            <input 
              type="text" 
              id="identitas" 
              className="form-control" 
              placeholder="Masukkan ID sesuai tipe akun" 
              required 
              value={identitas}
              onChange={(e) => setIdentitas(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Alamat Email</label>
            <input 
              type="email" 
              id="email" 
              className="form-control" 
              placeholder="nama@polimdo.ac.id" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input 
              type="password" 
              id="password" 
              className="form-control" 
              placeholder="Minimal 8 karakter" 
              minLength="8" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-full" style={{ marginTop: '1.5rem' }} disabled={loading}>
            {loading ? 'Memproses...' : 'Daftar Sekarang'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Sudah punya akun? <br />
            <Link to="/login-mahasiswa" className="btn-text">Login Mahasiswa</Link> |{' '} 
            <Link to="/login-dosen" className="btn-text">Login Dosen</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
