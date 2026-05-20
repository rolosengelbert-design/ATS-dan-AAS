import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { notify } from '../../utils/notifications';

function LoginAdmin() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      notify.error('Username dan Password harus diisi!');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password })
      });
      const data = await response.json();
      if (response.ok) {
        notify.success(`Selamat Datang, ${data.user.role === 'kajur' ? 'Kepala Jurusan' : 'Sekretaris Jurusan'}!`);
        if (data.user.role === 'kajur') {
          navigate('/dashboard-kajur', { state: { ...data.user } });
        } else {
          navigate('/dashboard-sekjur', { state: { ...data.user } });
        }
      } else {
        notify.error(data.message || 'Login gagal');
      }
    } catch (err) {
      notify.error('Tidak dapat terhubung ke server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <img src="/poli.png" alt="Logo" />
          <h2>Portal Admin</h2>
          <p>Sekretaris Jurusan & Kepala Jurusan</p>
        </div>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="username"
                className="form-control"
                placeholder="Masukkan username Anda"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="passAdmin">Password</label>
            <div className="input-wrapper">
              <input
                type="password"
                id="passAdmin"
                className="form-control"
                placeholder="••••••••"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk ke Portal Admin'}
          </button>
        </form>

        <div className="auth-footer">
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            <Link to="/" className="btn-text">← Kembali ke Beranda</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginAdmin;
