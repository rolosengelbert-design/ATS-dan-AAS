import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';
import { login } from '../../services/api';

function LoginMahasiswa() {
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!nim || !password) {
      notify.error("Mohon masukkan NIM dan Password!");
      return;
    }
    
    setLoading(true);
    try {
      const data = await login({ tipeAkun: 'mahasiswa', identitas: nim.trim(), password: password });
      
      notify.success('Berhasil Masuk!');
      // Kirim id, nim, dan nama ke Dashboard
      navigate('/dashboard-mahasiswa', { 
        state: { 
          id: data.user.id,
          nim: data.user.identitas, 
          nama: data.user.nama 
        } 
      });
    } catch (error) {
      console.error('Error:', error);
      notify.error(error.message || 'Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/poli.png" alt="Logo" />
          <h2>Portal Mahasiswa</h2>
          <p>Silakan masuk menggunakan NIM Anda</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="nim">Nomor Induk Mahasiswa (NIM)</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="nim" 
                className="form-control" 
                placeholder="Masukkan NIM Anda" 
                required 
                value={nim}
                onChange={(e) => setNim(e.target.value)}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="passMhs">Password</label>
            <div className="input-wrapper">
              <input 
                type="password" 
                id="passMhs" 
                className="form-control" 
                placeholder="••••••••" 
                required 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk ke Portal'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Belum punya akun? <Link to="/register" className="btn-text">Daftar disini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginMahasiswa;
