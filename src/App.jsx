import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import LoginDosen from './pages/auth/LoginDosen';
import LoginMahasiswa from './pages/auth/LoginMahasiswa';
import LoginAdmin from './pages/auth/LoginAdmin';
import Register from './pages/auth/Register';
import DashboardDosen from './pages/dashboard/DashboardDosen';
import DashboardMahasiswa from './pages/dashboard/DashboardMahasiswa';
import DashboardSekjur from './pages/dashboard/DashboardSekjur';
import DashboardKajur from './pages/dashboard/DashboardKajur';

function App() {
  return (
    <Router>
      <Toaster position="top-right" expand={false} richColors />
      <Routes>
        <Route path="/" element={<><Navbar isAuthPage={false} /><Home /></>} />
        <Route path="/login-dosen" element={<><Navbar isAuthPage={true} /><LoginDosen /></>} />
        <Route path="/login-mahasiswa" element={<><Navbar isAuthPage={true} /><LoginMahasiswa /></>} />
        <Route path="/login-admin" element={<><Navbar isAuthPage={true} /><LoginAdmin /></>} />
        <Route path="/register" element={<><Navbar isAuthPage={true} /><Register /></>} />
        <Route path="/dashboard-dosen" element={<DashboardDosen />} />
        <Route path="/dashboard-mahasiswa" element={<DashboardMahasiswa />} />
        <Route path="/dashboard-sekjur" element={<DashboardSekjur />} />
        <Route path="/dashboard-kajur" element={<DashboardKajur />} />
      </Routes>
    </Router>
  );
}

export default App;
