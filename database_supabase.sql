-- ========================================================
-- SCRIPT RESET DATABASE LENGKAP UNTUK SUPABASE (POSTGRESQL)
-- Jalankan isi file ini di SQL Editor Supabase
-- ========================================================

-- Hapus semua tabel lama jika ada
DROP TABLE IF EXISTS pengumpulan_tugas CASCADE;
DROP TABLE IF EXISTS tugas CASCADE;
DROP TABLE IF EXISTS mahasiswa_kelas CASCADE;
DROP TABLE IF EXISTS kelas CASCADE;
DROP TABLE IF EXISTS matakuliah CASCADE;
DROP TABLE IF EXISTS mahasiswa CASCADE;
DROP TABLE IF EXISTS dosen CASCADE;
DROP TABLE IF EXISTS admin CASCADE;
DROP TABLE IF EXISTS berita_acara CASCADE;

-- ===================== BUAT TABEL BARU =====================

-- Tabel Admin (Sekjur & Kajur)
CREATE TABLE admin (
    id SERIAL PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('sekjur', 'kajur')) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Dosen
CREATE TABLE dosen (
    id SERIAL PRIMARY KEY,
    nidn VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('pending', 'aktif', 'ditolak')) NOT NULL DEFAULT 'pending',
    didaftarkan_oleh INTEGER REFERENCES admin(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Mahasiswa
CREATE TABLE mahasiswa (
    id SERIAL PRIMARY KEY,
    nim VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    program_studi VARCHAR(50),
    angkatan INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Matakuliah
CREATE TABLE matakuliah (
    id SERIAL PRIMARY KEY,
    kode_mk VARCHAR(20) NOT NULL UNIQUE,
    nama_mk VARCHAR(100) NOT NULL,
    kategori VARCHAR(10) NOT NULL
);

-- Tabel Kelas
CREATE TABLE kelas (
    id SERIAL PRIMARY KEY,
    nama_kelas VARCHAR(50) NOT NULL,
    matakuliah_nama VARCHAR(100) NOT NULL,
    kode_kelas VARCHAR(20) NOT NULL UNIQUE,
    dosen_id INTEGER NOT NULL REFERENCES dosen(id) ON DELETE CASCADE,
    jumlah_mahasiswa INTEGER DEFAULT 0,
    waktu VARCHAR(100) DEFAULT ''
);

-- Tabel Mahasiswa_Kelas
CREATE TABLE mahasiswa_kelas (
    mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    absen_nim VARCHAR(20),
    tanda_tangan TEXT,
    PRIMARY KEY (mahasiswa_id, kelas_id)
);

-- Tabel Tugas
CREATE TABLE tugas (
    id SERIAL PRIMARY KEY,
    kelas_id INTEGER NOT NULL REFERENCES kelas(id) ON DELETE CASCADE,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    waktu_mulai TIMESTAMPTZ,
    waktu_selesai TIMESTAMPTZ,
    tenggat_waktu TIMESTAMPTZ NOT NULL,
    jam_pelaksanaan VARCHAR(100) DEFAULT '',
    file_url VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Pengumpulan Tugas
CREATE TABLE pengumpulan_tugas (
    id SERIAL PRIMARY KEY,
    tugas_id INTEGER NOT NULL REFERENCES tugas(id) ON DELETE CASCADE,
    mahasiswa_id INTEGER NOT NULL REFERENCES mahasiswa(id) ON DELETE CASCADE,
    jawaban_teks TEXT,
    file_url VARCHAR(255),
    waktu_kumpul TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    nilai INTEGER DEFAULT NULL
);

-- Tabel Berita Acara
CREATE TABLE berita_acara (
    id SERIAL PRIMARY KEY,
    dosen_id INTEGER NOT NULL REFERENCES dosen(id) ON DELETE CASCADE,
    hari_tanggal VARCHAR(255),
    prodi VARCHAR(255),
    matakuliah VARCHAR(255),
    semester VARCHAR(100),
    kelas VARCHAR(100),
    waktu VARCHAR(100),
    nama_dosen VARCHAR(255),
    kategori VARCHAR(50),
    jumlah_terdaftar INTEGER,
    jumlah_hadir INTEGER,
    jumlah_tidak_hadir INTEGER,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ===================== DATA CONTOH =====================

-- Akun Admin (Kajur & Sekjur)
INSERT INTO admin (nama, username, password_hash, role) VALUES
('Marson Budiman', 'kajur', '12345', 'kajur'),
('Maksy Sendiang', 'sekjur', '1234566', 'sekjur');

-- Dosen
INSERT INTO dosen (nidn, nama_lengkap, email, password_hash, status, didaftarkan_oleh) VALUES 
('0012345678', 'Dr. Eng. Budi Santoso, S.T., M.T.', 'budi.santoso@polimdo.ac.id', 'password123', 'aktif', 2),
('0087654321', 'Ir. Siti Aminah, M.Kom.', 'siti.aminah@polimdo.ac.id', 'password123', 'aktif', 2);

-- Mahasiswa
INSERT INTO mahasiswa (nim, nama_lengkap, email, program_studi, angkatan, password_hash) VALUES 
('2102001', 'Andi Pratama', 'andi.p@mhs.polimdo.ac.id', 'D4 Teknik Informatika', 2021, 'password123'),
('2102002', 'Rina Melati', 'rina.m@mhs.polimdo.ac.id', 'rina.m@mhs.polimdo.ac.id', 2021, 'password123');

-- Matakuliah
INSERT INTO matakuliah (kode_mk, nama_mk, kategori) VALUES 
('MK001', 'Pemrograman Web', 'ATS'),
('MK002', 'Jaringan Komputer', 'AAS'),
('MK003', 'Sistem Embedded', 'ATS'),
('MK004', 'Instalasi Listrik', 'AAS');

-- Kelas
INSERT INTO kelas (nama_kelas, matakuliah_nama, kode_kelas, dosen_id, jumlah_mahasiswa) VALUES 
('Kelas A - Pagi', 'Pemrograman Web', 'WEB-001', 1, 30),
('Kelas B - Sore', 'Jaringan Komputer', 'NET-001', 1, 25);

-- Mahasiswa di Kelas
INSERT INTO mahasiswa_kelas (mahasiswa_id, kelas_id) VALUES 
(1, 1), (2, 1);
