import { supabase } from '../lib/supabase';

// --- FILE UPLOAD HELPER ---
export const uploadFile = async (file) => {
  if (!file) return null;
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.round(Math.random() * 1E9)}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error } = await supabase.storage
    .from('uploads')
    .upload(filePath, file);

  if (error) {
    console.error('Upload error:', error);
    throw new Error('Gagal mengunggah file. Pastikan bucket "uploads" sudah ada dan public.');
  }

  const { data } = supabase.storage
    .from('uploads')
    .getPublicUrl(filePath);

  return data.publicUrl;
};

// --- AUTH & USER ---
export const register = async ({ tipeAkun, nama, identitas, email, password }) => {
  const table = tipeAkun === 'dosen' ? 'dosen' : 'mahasiswa';
  const idField = tipeAkun === 'dosen' ? 'nidn' : 'nim';

  // Check existing
  const { data: existing, error: checkError } = await supabase
    .from(table)
    .select('*')
    .or(`${idField}.eq.${identitas},email.eq.${email}`);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) {
    throw new Error(`${idField.toUpperCase()} atau Email sudah terdaftar`);
  }

  const insertData = {
    nama_lengkap: nama,
    email: email,
    password_hash: password
  };
  insertData[idField] = identitas;

  const { error: insertError } = await supabase.from(table).insert([insertData]);
  if (insertError) throw insertError;
  return { message: 'Pendaftaran berhasil' };
};

export const login = async ({ tipeAkun, identitas, password }) => {
  const table = tipeAkun === 'dosen' ? 'dosen' : 'mahasiswa';
  const idField = tipeAkun === 'dosen' ? 'nidn' : 'nim';

  const { data: user, error } = await supabase
    .from(table)
    .select('*')
    .eq(idField, identitas)
    .single();

  if (error || !user) throw new Error('Akun tidak ditemukan');
  if (user.password_hash !== password) throw new Error('Password salah');

  if (tipeAkun === 'dosen') {
    if (user.status === 'pending') throw new Error('Akun Anda belum diverifikasi oleh Kajur. Silakan hubungi Sekretaris Jurusan.');
    if (user.status === 'ditolak') throw new Error('Akun Anda ditolak oleh Kajur. Silakan hubungi Sekretaris Jurusan.');
  }

  return {
    message: 'Login berhasil',
    user: {
      id: user.id,
      nama: user.nama_lengkap,
      identitas: tipeAkun === 'dosen' ? user.nidn : user.nim
    }
  };
};

export const loginAdmin = async ({ username, password }) => {
  const { data: user, error } = await supabase
    .from('admin')
    .select('*')
    .eq('username', username)
    .single();

  if (error || !user) throw new Error('Akun tidak ditemukan');
  if (user.password_hash !== password) throw new Error('Password salah');

  return {
    message: 'Login berhasil',
    user: { id: user.id, nama: user.nama, role: user.role, username: user.username }
  };
};

export const daftarDosen = async (data) => {
  const { data: existing, error: checkError } = await supabase
    .from('dosen')
    .select('*')
    .or(`nidn.eq.${data.nidn},email.eq.${data.email}`);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) throw new Error('NIDN atau Email sudah terdaftar');

  const { error: insertError } = await supabase
    .from('dosen')
    .insert([{
      nidn: data.nidn,
      nama_lengkap: data.nama_lengkap,
      email: data.email,
      password_hash: data.password,
      status: 'pending',
      didaftarkan_oleh: data.sekjur_id
    }]);

  if (insertError) throw insertError;
  return { message: 'Data dosen berhasil dikirim ke Kajur untuk verifikasi' };
};

export const getDosenPending = async () => {
  const { data, error } = await supabase
    .from('dosen')
    .select(`id, nidn, nama_lengkap, email, status, created_at, admin:didaftarkan_oleh ( nama )`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data.map(r => ({ ...r, didaftarkan_oleh: r.admin ? r.admin.nama : null }));
};

export const verifikasiDosen = async (dosenId, action) => {
  const { error } = await supabase
    .from('dosen')
    .update({ status: action })
    .eq('id', dosenId);
  if (error) throw error;
  return { message: action === 'aktif' ? 'Akun dosen berhasil diverifikasi dan diaktifkan' : 'Akun dosen ditolak' };
};

export const getSemuaDosen = async () => {
  const { data, error } = await supabase
    .from('dosen')
    .select(`id, nidn, nama_lengkap, email, status, created_at, admin:didaftarkan_oleh ( nama ), kelas ( count )`)
    .order('status')
    .order('nama_lengkap');

  if (error) throw error;
  return data.map(r => ({
    ...r,
    didaftarkan_oleh: r.admin ? r.admin.nama : null,
    total_kelas: r.kelas && r.kelas[0] ? r.kelas[0].count : 0
  }));
};

// --- MATAKULIAH & KELAS ---
export const getMatakuliah = async () => {
  const { data, error } = await supabase.from('matakuliah').select('*');
  if (error) throw error;
  return data;
};

export const createMatakuliah = async (data) => {
  const { data: existing, error: checkError } = await supabase
    .from('matakuliah')
    .select('*')
    .eq('kode_mk', data.kode_mk);

  if (checkError) throw checkError;
  if (existing && existing.length > 0) throw new Error('Kode Mata Kuliah sudah ada');

  const { error: insertError } = await supabase.from('matakuliah').insert([data]);
  if (insertError) throw insertError;
  return { message: 'Mata Kuliah berhasil ditambahkan' };
};

export const createKelas = async (data) => {
  const { data: existing, error: checkError } = await supabase
    .from('kelas')
    .select('id')
    .eq('kode_kelas', data.kode_kelas.toUpperCase());

  if (checkError) throw checkError;
  if (existing && existing.length > 0) throw new Error('Kode Kelas sudah digunakan. Gunakan kode lain.');

  const { error: insertError } = await supabase
    .from('kelas')
    .insert([{
      nama_kelas: data.nama_kelas,
      matakuliah_nama: data.matakuliah_nama,
      kode_kelas: data.kode_kelas.toUpperCase(),
      dosen_id: data.dosen_id,
      jumlah_mahasiswa: data.jumlah_mahasiswa,
      waktu: data.waktu || ''
    }]);

  if (insertError) throw insertError;
  return { message: 'Kelas berhasil dibuat' };
};

export const getKelasByDosen = async (dosenId) => {
  const { data: rows, error } = await supabase
    .from('kelas')
    .select(`*, mahasiswa_kelas ( tanda_tangan, absen_nim ), tugas ( jam_pelaksanaan )`)
    .eq('dosen_id', dosenId);

  if (error) throw error;
  const mks = await getMatakuliah();

  return rows.map(k => {
    const mk = mks.find(m => m.nama_mk === k.matakuliah_nama);
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
};

export const getSemuaKelas = async () => {
  const { data: rows, error } = await supabase
    .from('kelas')
    .select(`id, nama_kelas, matakuliah_nama, kode_kelas, nilai_dikirim, waktu, jumlah_mahasiswa, dosen:dosen_id ( nama_lengkap, nidn, email ), tugas ( count )`)
    .order('nama_kelas');

  if (error) throw error;
  return rows.map(r => ({
    ...r,
    dosen: r.dosen ? r.dosen.nama_lengkap : null,
    nidn: r.dosen ? r.dosen.nidn : null,
    email_dosen: r.dosen ? r.dosen.email : null,
    total_tugas: r.tugas && r.tugas[0] ? r.tugas[0].count : 0
  }));
};

export const updateTargetMahasiswa = async (kelasId, target) => {
  const { error } = await supabase
    .from('kelas')
    .update({ jumlah_mahasiswa: target })
    .eq('id', kelasId);
  if (error) throw error;
  return { message: 'Target jumlah mahasiswa diperbarui' };
};

export const getKelasByMahasiswa = async (mahasiswaId) => {
  const { data: rows, error } = await supabase
    .from('mahasiswa_kelas')
    .select(`kelas:kelas_id ( id, nama_kelas, matakuliah_nama, jumlah_mahasiswa, dosen:dosen_id ( nama_lengkap ), mahasiswa_kelas ( mahasiswa_id ) )`)
    .eq('mahasiswa_id', mahasiswaId);

  if (error) throw error;
  const mks = await getMatakuliah();

  return rows.map(r => {
    const k = r.kelas;
    const mk = mks.find(m => m.nama_mk === k.matakuliah_nama);
    return {
      ...k,
      dosen: k.dosen ? k.dosen.nama_lengkap : null,
      kategori: mk ? mk.kategori : null,
      mahasiswa_terdaftar: k.mahasiswa_kelas ? k.mahasiswa_kelas.length : 0
    };
  });
};

export const gabungKelas = async (data) => {
  const { data: kelasData, error: kelasError } = await supabase
    .from('kelas')
    .select('*')
    .eq('kode_kelas', data.kode_kelas.toUpperCase())
    .single();

  if (kelasError || !kelasData) throw new Error('Kode Kelas tidak ditemukan.');

  const { data: existing, error: checkError } = await supabase
    .from('mahasiswa_kelas')
    .select('*')
    .match({ mahasiswa_id: data.mahasiswa_id, kelas_id: kelasData.id });

  if (existing && existing.length > 0) throw new Error('Anda sudah terdaftar di kelas ini.');

  const { error: joinError } = await supabase
    .from('mahasiswa_kelas')
    .insert([{
      mahasiswa_id: data.mahasiswa_id,
      kelas_id: kelasData.id,
      absen_nim: data.absen_nim,
      tanda_tangan: data.tanda_tangan
    }]);

  if (joinError) throw joinError;
  return { message: `Berhasil bergabung ke kelas: ${kelasData.nama_kelas}`, kelas: kelasData };
};

export const getKehadiranKelas = async (kelasId) => {
  const { data: rows, error } = await supabase
    .from('mahasiswa_kelas')
    .select(`absen_nim, tanda_tangan, mahasiswa:mahasiswa_id ( nim, nama_lengkap )`)
    .eq('kelas_id', kelasId);

  if (error) throw error;
  return rows.map(r => ({
    nim: r.mahasiswa ? r.mahasiswa.nim : null,
    nama_lengkap: r.mahasiswa ? r.mahasiswa.nama_lengkap : null,
    absen_nim: r.absen_nim,
    tanda_tangan: r.tanda_tangan,
    status_hadir: (r.tanda_tangan && r.absen_nim) ? 'Hadir' : 'Belum Hadir'
  }));
};

export const kirimNilaiKelas = async (kelasId) => {
  const { error } = await supabase
    .from('kelas')
    .update({ nilai_dikirim: true })
    .eq('id', kelasId);
  if (error) throw error;
  return { message: 'Nilai berhasil dikirim ke Kajur & Sekjur' };
};

// --- TUGAS ---
export const getTugasByKelas = async (kelasId) => {
  const { data, error } = await supabase
    .from('tugas')
    .select('*, kelas(waktu)')
    .eq('kelas_id', kelasId)
    .order('id', { ascending: false });

  if (error) throw error;
  return data.map(t => ({ ...t, kelas_waktu: t.kelas ? t.kelas.waktu : null }));
};

export const createTugas = async (data, file) => {
  const fileUrl = await uploadFile(file);
  const { error } = await supabase
    .from('tugas')
    .insert([{
      kelas_id: data.kelas_id,
      judul: data.judul,
      deskripsi: data.deskripsi,
      waktu_mulai: data.tanggal,
      waktu_selesai: data.tanggal,
      tenggat_waktu: data.tanggal,
      jam_pelaksanaan: data.jam_pelaksanaan || '',
      file_url: fileUrl
    }]);
  if (error) throw error;
  return { message: 'Tugas berhasil ditambahkan' };
};

export const updateTugas = async (id, data, file) => {
  const updateData = {
    judul: data.judul,
    deskripsi: data.deskripsi,
    tenggat_waktu: data.tanggal,
    jam_pelaksanaan: data.jam_pelaksanaan || ''
  };
  if (file) {
    updateData.file_url = await uploadFile(file);
  }
  const { error } = await supabase.from('tugas').update(updateData).eq('id', id);
  if (error) throw error;
  return { message: 'Tugas berhasil diperbarui' };
};

// --- PENGUMPULAN ---
export const submitPengumpulan = async (data, file) => {
  const fileUrl = await uploadFile(file);
  const jawaban = data.jawaban_teks || '';

  const { data: existing } = await supabase
    .from('pengumpulan_tugas')
    .select('*')
    .match({ tugas_id: data.tugas_id, mahasiswa_id: data.mahasiswa_id })
    .single();

  if (existing) {
    const updateData = { jawaban_teks: jawaban, waktu_kumpul: new Date().toISOString() };
    if (fileUrl) updateData.file_url = fileUrl;

    const { error: updateError } = await supabase
      .from('pengumpulan_tugas')
      .update(updateData)
      .eq('id', existing.id);

    if (updateError) throw updateError;
    return { message: 'Jawaban tugas berhasil diperbarui' };
  }

  const { error: insertError } = await supabase
    .from('pengumpulan_tugas')
    .insert([{
      tugas_id: data.tugas_id,
      mahasiswa_id: data.mahasiswa_id,
      jawaban_teks: jawaban,
      file_url: fileUrl
    }]);

  if (insertError) throw insertError;
  return { message: 'Tugas berhasil dikumpulkan' };
};

export const getPengumpulanByMahasiswa = async (mahasiswaId) => {
  const { data: rows, error } = await supabase
    .from('pengumpulan_tugas')
    .select('*, tugas(kelas_id)')
    .eq('mahasiswa_id', mahasiswaId);

  if (error) throw error;
  return rows.map(pt => ({ ...pt, kelas_id: pt.tugas ? pt.tugas.kelas_id : null }));
};

export const getPengumpulanByKelas = async (kelasId) => {
  const { data: rows, error } = await supabase
    .from('pengumpulan_tugas')
    .select(`id, jawaban_teks, file_url, waktu_kumpul, nilai, tugas:tugas_id ( id, judul, tenggat_waktu, jam_pelaksanaan, kelas_id ), mahasiswa:mahasiswa_id ( nama_lengkap, nim )`)
    .order('id');

  if (error) throw error;

  const mks = await getMatakuliah();
  const { data: kelasData } = await supabase.from('kelas').select('id, matakuliah_nama').eq('id', kelasId);

  return (rows || []).filter(pt => pt.tugas && pt.tugas.kelas_id == kelasId).map(pt => {
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
};

export const batalkanPengumpulan = async (mahasiswaId, tugasId) => {
  const { error } = await supabase
    .from('pengumpulan_tugas')
    .delete()
    .match({ mahasiswa_id: mahasiswaId, tugas_id: tugasId });
  if (error) throw error;
  return { message: 'Pengiriman tugas berhasil dibatalkan' };
};

export const beriNilai = async (pengumpulanId, nilai) => {
  const { error } = await supabase
    .from('pengumpulan_tugas')
    .update({ nilai })
    .eq('id', pengumpulanId);
  if (error) throw error;
  return { message: 'Nilai berhasil disimpan' };
};

// --- BERITA ACARA ---
export const createBeritaAcara = async (data) => {
  const { error } = await supabase.from('berita_acara').insert([data]);
  if (error) throw error;
  return { message: 'Berita acara berhasil disimpan' };
};

export const getBeritaAcaraByDosen = async (dosenId) => {
  const { data, error } = await supabase
    .from('berita_acara')
    .select('*')
    .eq('dosen_id', dosenId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
};
