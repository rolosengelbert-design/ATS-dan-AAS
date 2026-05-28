-- ========================================================
-- SCRIPT RESET DATABASE LENGKAP v2
-- Jalankan seluruh isi file ini di phpMyAdmin (tab SQL)
-- ========================================================

CREATE DATABASE IF NOT EXISTS db_elektro_polimdo;
USE db_elektro_polimdo;

-- Hapus semua tabel lama
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS pengumpulan_tugas;
DROP TABLE IF EXISTS tugas;
DROP TABLE IF EXISTS mahasiswa_kelas;
DROP TABLE IF EXISTS kelas;
DROP TABLE IF EXISTS matakuliah;
DROP TABLE IF EXISTS mahasiswa;
DROP TABLE IF EXISTS dosen;
DROP TABLE IF EXISTS admin;
SET FOREIGN_KEY_CHECKS = 1;

-- ===================== BUAT TABEL BARU =====================

-- Tabel Admin (Sekjur & Kajur)
CREATE TABLE admin (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama VARCHAR(100) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('sekjur', 'kajur') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Dosen (dengan kolom status dan didaftarkan_oleh)
CREATE TABLE dosen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nidn VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status ENUM('pending', 'aktif', 'ditolak') NOT NULL DEFAULT 'pending',
    didaftarkan_oleh INT DEFAULT NULL,
    FOREIGN KEY (didaftarkan_oleh) REFERENCES admin(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Mahasiswa
CREATE TABLE mahasiswa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nim VARCHAR(20) NOT NULL UNIQUE,
    nama_lengkap VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    program_studi VARCHAR(50),
    angkatan YEAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabel Matakuliah
CREATE TABLE matakuliah (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kode_mk VARCHAR(20) NOT NULL UNIQUE,
    nama_mk VARCHAR(100) NOT NULL,
    kategori VARCHAR(10) NOT NULL
);

-- Tabel Kelas (matakuliah diinput manual, dengan kode kelas unik)
CREATE TABLE kelas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nama_kelas VARCHAR(50) NOT NULL,
    matakuliah_nama VARCHAR(100) NOT NULL,
    kode_kelas VARCHAR(20) NOT NULL UNIQUE,
    dosen_id INT NOT NULL,
    jumlah_mahasiswa INT DEFAULT 0,
    nilai_dikirim BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (dosen_id) REFERENCES dosen(id) ON DELETE CASCADE
);

-- Tabel Mahasiswa_Kelas
CREATE TABLE mahasiswa_kelas (
    mahasiswa_id INT NOT NULL,
    kelas_id INT NOT NULL,
    PRIMARY KEY (mahasiswa_id, kelas_id),
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

-- Tabel Tugas
CREATE TABLE tugas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    kelas_id INT NOT NULL,
    judul VARCHAR(255) NOT NULL,
    deskripsi TEXT,
    tenggat_waktu DATETIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (kelas_id) REFERENCES kelas(id) ON DELETE CASCADE
);

-- Tabel Pengumpulan Tugas
CREATE TABLE pengumpulan_tugas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tugas_id INT NOT NULL,
    mahasiswa_id INT NOT NULL,
    jawaban_teks TEXT,
    file_url VARCHAR(255),
    waktu_kumpul TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    nilai INT DEFAULT NULL,
    FOREIGN KEY (tugas_id) REFERENCES tugas(id) ON DELETE CASCADE,
    FOREIGN KEY (mahasiswa_id) REFERENCES mahasiswa(id) ON DELETE CASCADE
);

-- ===================== DATA CONTOH =====================

-- Akun Admin (Kajur & Sekjur)
INSERT INTO admin (nama, username, password_hash, role) VALUES
('Marson Budiman', 'kajur', '12345', 'kajur'),
('Maksy Sendiang', 'sekjur', '1234566', 'sekjur');

-- Dosen (didaftarkan manual oleh Sekjur, status aktif untuk testing)
INSERT INTO dosen (nidn, nama_lengkap, email, password_hash, status, didaftarkan_oleh) VALUES 
('0012345678', 'Dr. Eng. Budi Santoso, S.T., M.T.', 'budi.santoso@polimdo.ac.id', 'password123', 'aktif', 2),
('0087654321', 'Ir. Siti Aminah, M.Kom.', 'siti.aminah@polimdo.ac.id', 'password123', 'aktif', 2);

-- Mahasiswa
INSERT INTO mahasiswa (nim, nama_lengkap, email, program_studi, angkatan, password_hash) VALUES 
('2102001', 'Andi Pratama', 'andi.p@mhs.polimdo.ac.id', 'D4 Teknik Informatika', 2021, 'password123'),
('2102002', 'Rina Melati', 'rina.m@mhs.polimdo.ac.id', 'D3 Teknik Listrik', 2021, 'password123');

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
