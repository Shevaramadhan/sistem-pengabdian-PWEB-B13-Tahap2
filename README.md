# Sistem Pengabdian Dosen (Facultyware)

## 📌 Deskripsi Aplikasi
Sistem Informasi Pengabdian Dosen kepada Masyarakat (Facultyware) adalah platform berbasis web yang dirancang untuk memudahkan dosen dalam mengelola data kegiatan pengabdian. Aplikasi ini memungkinkan pengguna untuk menambahkan proposal, memperbarui status pelaksanaan, mengunggah laporan, serta mengelola keanggotaan dalam sebuah pengabdian secara kolaboratif. Aplikasi ini mengimplementasikan Role-Based Access Control (RBAC) dan fitur RestAPI sebagai output tambahan.

## 🚀 Cara Instalasi dan Menjalankan Aplikasi

**Prasyarat:**
- Node.js (v16 atau lebih baru)
- MySQL / MariaDB

**Langkah Instalasi:**
1. Clone repository ini ke komputer lokal Anda:
   ```bash
   git clone https://github.com/husnilk/facultyware.git
   cd facultyware
   ```
2. Instal semua dependensi yang dibutuhkan:
   ```bash
   npm install
   ```
3. Buat file `.env` di _root directory_ berdasarkan referensi `.env.example` (jika ada), lalu sesuaikan konfigurasi database Anda:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=sistem_pengabdian
   PORT=3000
   ```
4. Import skema database ke MySQL dari file yang telah disediakan.
5. Jalankan aplikasi pada lingkungan pengembangan:
   ```bash
   npm run dev
   ```
6. Buka browser dan akses aplikasi melalui `http://localhost:3000`.

## 👥 Pembagian Tugas Anggota

**Kelompok 13 - PWEB B**

| No | Fitur | Penanggung Jawab | NIM |
|---|---|---|---|
| 1 | Dosen dapat melihat dashboard pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 2 | Dosen dapat melihat daftar pengabdian miliknya | Athaya Nasywa Mahira | 2411523028 |
| 3 | Dosen dapat melihat detail data pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 4 | Dosen dapat mencari data pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 5 | Dosen dapat menambahkan data pengabdian baru beserta proposal pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 6 | Dosen dapat melihat status pengajuan proposal pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 7 | Dosen dapat mengubah data pengabdian | Sheva Ramadhan | 2411523020 |
| 8 | Dosen dapat menghapus data pengabdian | Sheva Ramadhan | 2411523020 |
| 9 | Dosen dapat mengekspor data pengabdian ke format PDF atau Excel | Sheva Ramadhan | 2411523020 |
| 10 | Dosen dapat mengupload laporan hasil pengabdian | Sheva Ramadhan | 2411523020 |
| 11 | Dosen dapat melakukan finalisasi pengajuan pengabdian | Sheva Ramadhan | 2411523020 |
| 12 | Dosen dapat menambahkan anggota pengabdian | Sheva Ramadhan | 2411523020 |
| 13 | Dosen dapat mengubah data anggota pengabdian | Sheva Ramadhan | 2411523020 |
| 14 | Dosen dapat menghapus anggota pengabdian | Sheva Ramadhan | 2411523020 |
| 15 | Dosen dapat melihat notifikasi undangan keanggotaan pengabdian | Athaya Nasywa Mahira | 2411523028 |
| 16 | Dosen dapat melihat daftar undangan keanggotaan pengabdian | Sheva Ramadhan | 2411523020 |
| 17 | Dosen dapat menyetujui/menolak undangan keanggotaan pengabdian (Approval) | Athaya Nasywa Mahira | 2411523028 |
| 18 | Dosen dapat mengunduh bukti persetujuan/penolakan keanggotaan dalam format PDF | Athaya Nasywa Mahira | 2411523028 |
| **19** | **Dosen dapat mengambil daftar pengabdian melalui RestAPI (Format JSON)** | **Sheva Ramadhan** | **2411523020** |
| **20** | **Dosen dapat mengambil daftar undangan keanggotaan melalui RestAPI (Format JSON)** | **Athaya Nasywa Mahira** | **2411523028** |
