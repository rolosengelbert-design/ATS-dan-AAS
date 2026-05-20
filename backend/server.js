const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const fs = require('fs');
// const db = require('./db'); // Dinonaktifkan karena pindah ke Supabase
const supabase = require('./supabase');

const app = express();
const PORT = 5000;

// Pastikan folder uploads ada di root (C:\SEMESTER 6\Web ATS dan AAS\uploads)
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Folder uploads berhasil dibuat di:', uploadDir);
}

// Pendeteksi Error Global
process.on('unhandledRejection', (reason, promise) => {
  console.error('!!! ERROR ASYNC TERDETEKSI !!!');
  console.error('At:', promise, 'Reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('!!! CRASH TERDETEKSI !!!');
  console.error(error);
});

// Anti-Exit: Memastikan event loop tetap berjalan
setInterval(() => { }, 60000);

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    console.log('Mencoba menyimpan file ke:', uploadDir);
    cb(null, uploadDir); // Menggunakan jalur absolut
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json({ limit: '10mb' })); // Menambah limit untuk upload base64 tanda tangan
app.use('/uploads', express.static(uploadDir)); // Route statis menggunakan jalur absolut yang sama dengan uploadDir

// Koneksi Supabase sudah diinisialisasi di supabase.js


// Endpoint untuk registrasi
app.post('/api/register', async (req, res) => {
  const { tipeAkun, nama, identitas, email, password } = req.body;

  if (!tipeAkun || !nama || !identitas || !email || !password) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }

  try {
    const table = tipeAkun === 'dosen' ? 'dosen' : 'mahasiswa';
    const idField = tipeAkun === 'dosen' ? 'nidn' : 'nim';

    // Cek duplikasi
    const { data: existing, error: checkError } = await supabase
      .from(table)
      .select('*')
      .or(`${idField}.eq.${identitas},email.eq.${email}`);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) {
      return res.status(400).json({ message: `${idField.toUpperCase()} atau Email sudah terdaftar` });
    }

    // Insert data baru
    const insertData = {
      nama_lengkap: nama,
      email: email,
      password_hash: password // Di production, password HARUS di-hash
    };
    insertData[idField] = identitas;

    const { error: insertError } = await supabase
      .from(table)
      .insert([insertData]);

    if (insertError) throw insertError;

    res.status(201).json({ message: 'Pendaftaran berhasil' });
  } catch (error) {
    console.error('Error saat registrasi:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message || error });
  }
});

// Endpoint untuk login
app.post('/api/login', async (req, res) => {
  const { tipeAkun, identitas, password } = req.body;

  if (!tipeAkun || !identitas || !password) {
    return res.status(400).json({ message: 'ID dan Password harus diisi' });
  }

  try {
    const table = tipeAkun === 'dosen' ? 'dosen' : 'mahasiswa';
    const idField = tipeAkun === 'dosen' ? 'nidn' : 'nim';

    const { data: users, error: loginError } = await supabase
      .from(table)
      .select('*')
      .eq(idField, identitas)
      .single();

    if (loginError || !users) {
      return res.status(401).json({ message: 'Akun tidak ditemukan' });
    }

    if (users.password_hash !== password) {
      return res.status(401).json({ message: 'Password salah' });
    }

    // Cek status khusus untuk dosen
    if (tipeAkun === 'dosen') {
      if (users.status === 'pending') {
        return res.status(403).json({ message: 'Akun Anda belum diverifikasi oleh Kajur. Silakan hubungi Sekretaris Jurusan.' });
      }
      if (users.status === 'ditolak') {
        return res.status(403).json({ message: 'Akun Anda ditolak oleh Kajur. Silakan hubungi Sekretaris Jurusan.' });
      }
    }

    res.status(200).json({
      message: 'Login berhasil',
      user: {
        id: users.id,
        nama: users.nama_lengkap,
        identitas: tipeAkun === 'dosen' ? users.nidn : users.nim
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server', error: error.message || error });
  }
});

// Login Admin (Sekjur & Kajur)
app.post('/api/admin/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan Password harus diisi' });
  }
  try {
    const { data: users, error: loginError } = await supabase
      .from('admin')
      .select('*')
      .eq('username', username);

    if (loginError) throw loginError;

    if (!users || users.length === 0) return res.status(401).json({ message: 'Akun tidak ditemukan' });

    const user = users[0];
    if (user.password_hash !== password) return res.status(401).json({ message: 'Password salah' });

    res.status(200).json({
      message: 'Login berhasil',
      user: { id: user.id, nama: user.nama, role: user.role, username: user.username }
    });
  } catch (error) {
    console.error('Admin Login error:', error);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
});

// Sekjur: Daftarkan Dosen Baru (status pending)
app.post('/api/sekjur/daftar-dosen', async (req, res) => {
  const { nidn, nama_lengkap, email, password, sekjur_id } = req.body;
  if (!nidn || !nama_lengkap || !email || !password) {
    return res.status(400).json({ message: 'Semua field harus diisi' });
  }
  try {
    const { data: existing, error: checkError } = await supabase
      .from('dosen')
      .select('*')
      .or(`nidn.eq.${nidn},email.eq.${email}`);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) return res.status(400).json({ message: 'NIDN atau Email sudah terdaftar' });

    const { error: insertError } = await supabase
      .from('dosen')
      .insert([{
        nidn,
        nama_lengkap,
        email,
        password_hash: password,
        status: 'pending',
        didaftarkan_oleh: sekjur_id
      }]);

    if (insertError) throw insertError;
    res.status(201).json({ message: 'Data dosen berhasil dikirim ke Kajur untuk verifikasi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mendaftarkan dosen' });
  }
});

// Kajur: Lihat semua dosen pending
app.get('/api/kajur/dosen-pending', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('dosen')
      .select(`
        id, nidn, nama_lengkap, email, status, created_at,
        admin:didaftarkan_oleh ( nama )
      `)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Flatten output agar sesuai format sebelumnya
    const formatted = rows.map(r => ({
      ...r,
      didaftarkan_oleh: r.admin ? r.admin.nama : null
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data dosen' });
  }
});

// Kajur: Verifikasi dosen (setujui atau tolak)
app.put('/api/kajur/verifikasi/:dosen_id', async (req, res) => {
  const { action } = req.body; // 'aktif' atau 'ditolak'
  if (!action) return res.status(400).json({ message: 'Action harus diisi (aktif/ditolak)' });
  try {
    const { error } = await supabase
      .from('dosen')
      .update({ status: action })
      .eq('id', req.params.dosen_id);

    if (error) throw error;
    const pesan = action === 'aktif' ? 'Akun dosen berhasil diverifikasi dan diaktifkan' : 'Akun dosen ditolak';
    res.status(200).json({ message: pesan });
  } catch (error) {
    res.status(500).json({ message: 'Gagal memverifikasi dosen' });
  }
});

// Kajur/Sekjur: Semua kelas dari semua dosen
app.get('/api/laporan/semua-kelas', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('kelas')
      .select(`
        id, nama_kelas, matakuliah_nama,
        dosen:dosen_id ( nama_lengkap, nidn ),
        tugas ( count )
      `)
      .order('nama_kelas');

    if (error) {
      console.error('Laporan semua kelas error:', error);
      throw error;
    }

    const formatted = (rows || []).map(r => ({
      ...r,
      dosen: r.dosen ? r.dosen.nama_lengkap : null,
      nidn: r.dosen ? r.dosen.nidn : null,
      total_tugas: r.tugas ? r.tugas.length : 0
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil laporan', error: error.message || error });
  }
});

// Kajur/Sekjur: Semua dosen
app.get('/api/laporan/semua-dosen', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('dosen')
      .select(`
        id, nidn, nama_lengkap, email, status, created_at,
        admin:didaftarkan_oleh ( nama ),
        kelas ( count )
      `)
      .order('status')
      .order('nama_lengkap');

    if (error) {
      console.error('Laporan semua dosen error:', error);
      throw error;
    }

    const formatted = (rows || []).map(r => ({
      ...r,
      didaftarkan_oleh: r.admin ? r.admin.nama : null,
      total_kelas: r.kelas ? r.kelas.length : 0
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data dosen', error: error.message || error });
  }
});

// ================= ENDPOINTS MANAJEMEN KELAS & MATAKULIAH =================

// Ambil semua matakuliah
app.get('/api/matakuliah', async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('matakuliah').select('*');
    if (error) throw error;
    res.status(200).json(rows);
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('ERROR MATAKULIAH:', error);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    res.status(500).json({ message: 'Gagal mengambil data matakuliah', error: error.message || error });
  }
});

// Buat Matakuliah Baru (Oleh Dosen)
app.post('/api/matakuliah', async (req, res) => {
  const { kode_mk, nama_mk, kategori } = req.body;
  if (!kode_mk || !nama_mk || !kategori) {
    return res.status(400).json({ message: 'Kode, Nama, dan Kategori harus diisi' });
  }
  try {
    const { data: existing, error: checkError } = await supabase
      .from('matakuliah')
      .select('*')
      .eq('kode_mk', kode_mk);

    if (checkError) throw checkError;
    if (existing && existing.length > 0) return res.status(400).json({ message: 'Kode Mata Kuliah sudah ada' });

    const { error: insertError } = await supabase
      .from('matakuliah')
      .insert([{ kode_mk, nama_mk, kategori }]);

    if (insertError) throw insertError;
    res.status(201).json({ message: 'Mata Kuliah berhasil ditambahkan' });
  } catch (error) {
    console.error('Error tambah MK:', error);
    res.status(500).json({ message: `Database error: ${error.message}` });
  }
});

// Buat Kelas Baru (Oleh Dosen)
app.post('/api/kelas', async (req, res) => {
  const { nama_kelas, dosen_id, matakuliah_nama, kode_kelas, jumlah_mahasiswa } = req.body;
  if (!nama_kelas || !dosen_id || !matakuliah_nama || !kode_kelas || !jumlah_mahasiswa) {
    return res.status(400).json({ message: 'Semua field kelas harus diisi (termasuk Kode Kelas dan Jumlah Mahasiswa)' });
  }
  try {
    const { data: existing, error: checkError } = await supabase
      .from('kelas')
      .select('id')
      .eq('kode_kelas', kode_kelas.toUpperCase());

    if (checkError) throw checkError;
    if (existing && existing.length > 0) return res.status(400).json({ message: 'Kode Kelas sudah digunakan. Gunakan kode lain.' });

    const { error: insertError } = await supabase
      .from('kelas')
      .insert([{
        nama_kelas,
        matakuliah_nama,
        kode_kelas: kode_kelas.toUpperCase(),
        dosen_id,
        jumlah_mahasiswa,
        waktu: req.body.waktu || ''
      }]);

    if (insertError) throw insertError;
    res.status(201).json({ message: 'Kelas berhasil dibuat', kode_kelas: kode_kelas.toUpperCase() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membuat kelas', error: error.message || error });
  }
});

// Update Target Mahasiswa / Waktu Kelas
app.put('/api/kelas/:id', async (req, res) => {
  const { jumlah_mahasiswa, waktu } = req.body;
  try {
    const updateData = { jumlah_mahasiswa };
    if (waktu !== undefined) updateData.waktu = waktu;

    const { error } = await supabase
      .from('kelas')
      .update(updateData)
      .eq('id', req.params.id);

    if (error) throw error;
    res.json({ message: 'Kelas berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui kelas' });
  }
});

// Update jumlah mahasiswa target kelas
app.put('/api/kelas/target/:kelas_id', async (req, res) => {
  const { jumlah_mahasiswa } = req.body;
  try {
    const { error } = await supabase
      .from('kelas')
      .update({ jumlah_mahasiswa })
      .eq('id', req.params.kelas_id);

    if (error) throw error;
    res.status(200).json({ message: 'Target jumlah mahasiswa diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui data kelas' });
  }
});

// Ambil kelas yang diajar oleh dosen tertentu
app.get('/api/kelas/dosen/:dosen_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('kelas')
      .select(`
        *,
        mahasiswa_kelas ( tanda_tangan, absen_nim ),
        tugas ( jam_pelaksanaan )
      `)
      .eq('dosen_id', req.params.dosen_id);

    if (error) {
      console.error('Get kelas dosen error:', error);
      throw error;
    }

    // Ambil semua matakuliah untuk mapping manual (karena bukan foreign key)
    const { data: mks } = await supabase.from('matakuliah').select('*');

    const formatted = (rows || []).map(k => {
      const mk = mks?.find(m => m.nama_mk === k.matakuliah_nama);
      return {
        ...k,
        kategori: mk ? mk.kategori : null,
        mahasiswa_terdaftar: k.mahasiswa_kelas ? k.mahasiswa_kelas.length : 0,
        mahasiswa_hadir: (k.mahasiswa_kelas && Array.isArray(k.mahasiswa_kelas))
          ? k.mahasiswa_kelas.filter(mk2 => mk2.tanda_tangan && mk2.absen_nim).length
          : 0,
        latest_task_time: (k.tugas && Array.isArray(k.tugas) && k.tugas.length > 0)
          ? k.tugas[k.tugas.length - 1].jam_pelaksanaan
          : null
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('ERROR KELAS DOSEN:', error);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    res.status(500).json({ message: 'Gagal mengambil data kelas', error: error.message || error });
  }
});

// Tambah Berita Acara
app.post('/api/berita-acara', async (req, res) => {
  try {
    const { error } = await supabase
      .from('berita_acara')
      .insert([req.body]);

    if (error) throw error;
    res.status(201).json({ message: 'Berita acara berhasil disimpan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan berita acara' });
  }
});

// Ambil Berita Acara Dosen
app.get('/api/berita-acara/dosen/:dosen_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('berita_acara')
      .select('*')
      .eq('dosen_id', req.params.dosen_id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.status(200).json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil berita acara', error: error.message || error });
  }
});

// Ambil semua kelas beserta info dosen (Untuk Mahasiswa)
app.get('/api/kelas', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('kelas')
      .select(`
        id, nama_kelas, matakuliah_nama,
        dosen:dosen_id ( nama_lengkap )
      `);

    if (error) {
      console.error('Get semua kelas error:', error);
      throw error;
    }

    const { data: mks } = await supabase.from('matakuliah').select('*');

    const formatted = (rows || []).map(k => {
      const mk = mks?.find(m => m.nama_mk === k.matakuliah_nama);
      return {
        ...k,
        dosen: k.dosen ? k.dosen.nama_lengkap : null,
        kategori: mk ? mk.kategori : null
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    console.error('ERROR KELAS DOSEN:', error);
    console.error('!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
    res.status(500).json({ message: 'Gagal mengambil data kelas', error: error.message || error });
  }
});

// Ambil kelas yang di-ikuti mahasiswa
app.get('/api/kelas/mahasiswa/:mahasiswa_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('mahasiswa_kelas')
      .select(`
        kelas:kelas_id (
          id, nama_kelas, matakuliah_nama, jumlah_mahasiswa,
          dosen:dosen_id ( nama_lengkap ),
          mahasiswa_kelas ( mahasiswa_id )
        )
      `)
      .eq('mahasiswa_id', req.params.mahasiswa_id);

    if (error) {
      console.error('Get kelas mahasiswa error:', error);
      throw error;
    }

    const { data: mks } = await supabase.from('matakuliah').select('*');

    const formatted = (rows || []).map(r => {
      const k = r.kelas;
      const mk = mks?.find(m => m.nama_mk === k.matakuliah_nama);
      return {
        ...k,
        dosen: k.dosen ? k.dosen.nama_lengkap : null,
        kategori: mk ? mk.kategori : null,
        mahasiswa_terdaftar: k.mahasiswa_kelas ? k.mahasiswa_kelas.length : 0
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data kelas mahasiswa' });
  }
});

// Mahasiswa bergabung ke kelas dengan kode kelas
app.post('/api/kelas/gabung', async (req, res) => {
  const { mahasiswa_id, kode_kelas, absen_nim, tanda_tangan } = req.body;
  if (!mahasiswa_id || !kode_kelas || !absen_nim || !tanda_tangan) {
    return res.status(400).json({ message: 'Kode Kelas, ID Mahasiswa, NIM Absen, dan Tanda Tangan harus diisi' });
  }
  try {
    const { data: kelasData, error: kelasError } = await supabase
      .from('kelas')
      .select('*')
      .eq('kode_kelas', kode_kelas.toUpperCase())
      .single();

    if (kelasError || !kelasData) return res.status(404).json({ message: 'Kode Kelas tidak ditemukan.' });

    const { data: existing, error: checkError } = await supabase
      .from('mahasiswa_kelas')
      .select('*')
      .match({ mahasiswa_id, kelas_id: kelasData.id });

    if (existing && existing.length > 0) return res.status(400).json({ message: 'Anda sudah terdaftar di kelas ini.' });

    const { error: joinError } = await supabase
      .from('mahasiswa_kelas')
      .insert([{
        mahasiswa_id,
        kelas_id: kelasData.id,
        absen_nim,
        tanda_tangan
      }]);

    if (joinError) throw joinError;
    res.status(201).json({ message: `Berhasil bergabung ke kelas: ${kelasData.nama_kelas}`, kelas: kelasData });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal bergabung ke kelas' });
  }
});

// Ambil mahasiswa yang tergabung di kelas beserta kehadiran
app.get('/api/kelas/:kelas_id/mahasiswa', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('mahasiswa_kelas')
      .select(`
        absen_nim, tanda_tangan,
        mahasiswa:mahasiswa_id ( nim, nama_lengkap )
      `)
      .eq('kelas_id', req.params.kelas_id);

    if (error) throw error;

    const formatted = rows.map(r => ({
      nim: r.mahasiswa ? r.mahasiswa.nim : null,
      nama_lengkap: r.mahasiswa ? r.mahasiswa.nama_lengkap : null,
      absen_nim: r.absen_nim,
      tanda_tangan: r.tanda_tangan,
      status_hadir: (r.tanda_tangan && r.absen_nim) ? 'Hadir' : 'Belum Hadir'
    }));

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data mahasiswa di kelas' });
  }
});

// ================= ENDPOINTS MANAJEMEN TUGAS =================

// Buat Tugas Baru (Oleh Dosen)
app.post('/api/tugas', upload.single('file'), async (req, res) => {
  const { kelas_id, judul, deskripsi, tanggal, jam_pelaksanaan } = req.body;
  const file = req.file;

  if (!kelas_id || !judul || !tanggal) {
    return res.status(400).json({ message: 'Kelas, Judul, dan Tanggal harus diisi' });
  }

  const fileUrl = file ? `/uploads/${file.filename}` : null;

  try {
    const { error } = await supabase
      .from('tugas')
      .insert([{
        kelas_id,
        judul,
        deskripsi,
        waktu_mulai: tanggal,
        waktu_selesai: tanggal,
        tenggat_waktu: tanggal,
        jam_pelaksanaan: jam_pelaksanaan || '',
        file_url: fileUrl
      }]);

    if (error) throw error;
    res.status(201).json({ message: 'Tugas berhasil ditambahkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menambahkan tugas' });
  }
});

// Update Tugas
app.put('/api/tugas/:id', upload.single('file'), async (req, res) => {
  const { judul, deskripsi, tanggal, jam_pelaksanaan } = req.body;
  const file = req.file;
  const tugasId = req.params.id;

  try {
    const updateData = { judul, deskripsi, tenggat_waktu: tanggal, jam_pelaksanaan: jam_pelaksanaan || '' };
    if (file) updateData.file_url = `/uploads/${file.filename}`;

    const { error } = await supabase
      .from('tugas')
      .update(updateData)
      .eq('id', tugasId);

    if (error) throw error;
    res.status(200).json({ message: 'Tugas berhasil diperbarui' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal memperbarui tugas' });
  }
});

// Ambil tugas berdasarkan kelas
app.get('/api/tugas/kelas/:kelas_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('tugas')
      .select('*, kelas(waktu)')
      .eq('kelas_id', req.params.kelas_id)
      .order('id', { ascending: false });

    if (error) throw error;

    const formatted = rows.map(t => ({
      ...t,
      kelas_waktu: t.kelas ? t.kelas.waktu : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil daftar tugas' });
  }
});

// Ambil tugas untuk mahasiswa (berdasarkan kelas yang diikuti)
app.get('/api/tugas/mahasiswa/:mahasiswa_id', async (req, res) => {
  try {
    // Cari kelas yang diikuti mahasiswa
    const { data: enrollment, error: enrollError } = await supabase
      .from('mahasiswa_kelas')
      .select('kelas_id')
      .eq('mahasiswa_id', req.params.mahasiswa_id);

    if (enrollError) throw enrollError;
    const kelasIds = enrollment.map(e => e.kelas_id);

    const { data: rows, error: tugasError } = await supabase
      .from('tugas')
      .select('*, kelas(nama_kelas, matakuliah_nama, waktu)')
      .in('kelas_id', kelasIds)
      .order('id', { ascending: false });

    if (tugasError) throw tugasError;

    const formatted = rows.map(t => ({
      ...t,
      nama_kelas: t.kelas ? t.kelas.nama_kelas : null,
      matakuliah_nama: t.kelas ? t.kelas.matakuliah_nama : null,
      kelas_waktu: t.kelas ? t.kelas.waktu : null
    }));

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil tugas' });
  }
});

// ================= ENDPOINTS PENGUMPULAN TUGAS =================

// Kumpulkan Tugas (Oleh Mahasiswa) - Mendukung teks/link dan upload file
app.post('/api/pengumpulan', upload.single('file'), async (req, res) => {
  const { tugas_id, mahasiswa_id, jawaban_teks } = req.body;
  const file = req.file;

  if (!tugas_id || !mahasiswa_id) {
    return res.status(400).json({ message: 'Tugas ID dan Mahasiswa ID harus diisi' });
  }

  if (!jawaban_teks && !file) {
    return res.status(400).json({ message: 'Anda harus mengisi teks jawaban/link atau mengunggah file' });
  }

  const fileUrl = file ? `/uploads/${file.filename}` : null;
  const jawaban = jawaban_teks || '';

  try {
    const { data: existing, error: checkError } = await supabase
      .from('pengumpulan_tugas')
      .select('*')
      .match({ tugas_id, mahasiswa_id })
      .single();

    if (existing) {
      const updateData = { jawaban_teks: jawaban, waktu_kumpul: new Date().toISOString() };
      if (fileUrl) updateData.file_url = fileUrl;

      const { error: updateError } = await supabase
        .from('pengumpulan_tugas')
        .update(updateData)
        .eq('id', existing.id);

      if (updateError) throw updateError;
      return res.status(200).json({ message: 'Jawaban tugas berhasil diperbarui' });
    }

    const { error: insertError } = await supabase
      .from('pengumpulan_tugas')
      .insert([{ tugas_id, mahasiswa_id, jawaban_teks: jawaban, file_url: fileUrl }]);

    if (insertError) throw insertError;
    res.status(201).json({ message: 'Tugas berhasil dikumpulkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengumpulkan tugas' });
  }
});

// Ambil semua pengumpulan milik mahasiswa tertentu
app.get('/api/pengumpulan/:mahasiswa_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('pengumpulan_tugas')
      .select('*, tugas(kelas_id)')
      .eq('mahasiswa_id', req.params.mahasiswa_id);

    if (error) throw error;

    const formatted = rows.map(pt => ({
      ...pt,
      kelas_id: pt.tugas ? pt.tugas.kelas_id : null
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil data pengumpulan' });
  }
});

// Batal Pengiriman Tugas (Hapus pengumpulan)
app.delete('/api/pengumpulan/:mahasiswa_id/:tugas_id', async (req, res) => {
  try {
    const { error } = await supabase
      .from('pengumpulan_tugas')
      .delete()
      .match({ mahasiswa_id: req.params.mahasiswa_id, tugas_id: req.params.tugas_id });

    if (error) throw error;
    res.status(200).json({ message: 'Pengiriman tugas berhasil dibatalkan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal membatalkan pengiriman tugas' });
  }
});

// Ambil semua pengumpulan tugas berdasarkan kelas untuk dosen
app.get('/api/pengumpulan/kelas/:kelas_id', async (req, res) => {
  try {
    const { data: rows, error } = await supabase
      .from('pengumpulan_tugas')
      .select(`
        id, jawaban_teks, file_url, waktu_kumpul, nilai,
        tugas:tugas_id ( id, judul, tenggat_waktu, jam_pelaksanaan, kelas_id ),
        mahasiswa:mahasiswa_id ( nama_lengkap, nim )
      `)
      .order('id');

    if (error) {
      console.error('Get pengumpulan kelas error:', error);
      throw error;
    }

    const { data: mks } = await supabase.from('matakuliah').select('*');
    const { data: kelasData } = await supabase.from('kelas').select('id, matakuliah_nama').eq('id', req.params.kelas_id);

    const formatted = (rows || []).filter(pt => pt.tugas && pt.tugas.kelas_id == req.params.kelas_id).map(pt => {
      const mkName = kelasData?.find(k => k.id === pt.tugas.kelas_id)?.matakuliah_nama;
      const mk = mks?.find(m => m.nama_mk === mkName);

      return {
        pengumpulan_id: pt.id,
        judul_tugas: pt.tugas ? pt.tugas.judul : null,
        tenggat_waktu: pt.tugas ? pt.tugas.tenggat_waktu : null,
        jam_pelaksanaan: pt.tugas ? pt.tugas.jam_pelaksanaan : null,
        nama_mahasiswa: pt.mahasiswa ? pt.mahasiswa.nama_lengkap : null,
        nim: pt.mahasiswa ? pt.mahasiswa.nim : null,
        jawaban_teks: pt.jawaban_teks,
        file_url: pt.file_url,
        waktu_kumpul: pt.waktu_kumpul,
        nilai: pt.nilai,
        kategori: mk ? mk.kategori : null
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal mengambil data pengumpulan kelas' });
  }
});

// Beri nilai tugas
app.post('/api/pengumpulan/nilai', async (req, res) => {
  const { pengumpulan_id, nilai } = req.body;
  if (!pengumpulan_id || nilai === undefined) {
    return res.status(400).json({ message: 'ID pengumpulan dan nilai harus diisi' });
  }
  try {
    const { error } = await supabase
      .from('pengumpulan_tugas')
      .update({ nilai })
      .eq('id', pengumpulan_id);

    if (error) throw error;
    res.status(200).json({ message: 'Nilai berhasil disimpan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Gagal menyimpan nilai' });
  }
});

app.listen(PORT, () => {
  console.log(`Server Backend berjalan di http://localhost:${PORT}`);
});
