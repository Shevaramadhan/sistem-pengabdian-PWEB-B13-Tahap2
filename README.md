# Sistem Informasi Pengabdian Dosen (Facultyware)

Sistem Informasi Pengabdian Dosen adalah sebuah modul aplikasi berbasis web yang dibangun di atas *central-panel* (Facultyware). Sistem ini dirancang untuk memfasilitasi dosen di lingkungan fakultas untuk mengajukan, mengelola anggota tim, mengunggah dokumen (proposal & laporan), hingga memfinalisasi kegiatan pengabdian masyarakat.

Proyek ini dikembangkan sebagai Tugas Besar Pemrograman Web (PWEB) Semester 4.

## 📌 Identitas Kelompok (B13)
- **Athaya Nasywa Mahira** (2411523028)
- **Sheva Ramadhan** (2411523020)

---

## 🌐 Live Demo & Deployment (Production)
Aplikasi versi produksi telah di-hosting dan dapat langsung diakses secara publik:
- **URL Akses:** [https://www.sistem-pengabdian-b13.web.id](https://www.sistem-pengabdian-b13.web.id)
- **Hosting / Database:** Railway Cloud MySQL

### Akun Demo (Login)
Gunakan kredensial berikut untuk menguji coba fitur aplikasi di server *production*:
| Peran | Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` |
| **Dosen (Ketua)** | `athaya` | `dosen123` |
| **Dosen (Anggota)** | `sheva` | `dosen123` |

---

## ✨ Fitur Utama

1. **Manajemen Pengabdian (CRUD Lengkap)**
   - Dosen dapat membuat pengajuan pengabdian baru.
   - Menampilkan daftar pengabdian dengan fitur pencarian dan paginasi.
   - Edit dan Hapus pengajuan yang masih berstatus `Diusulkan`.
2. **Manajemen Dokumen (Multer)**
   - Upload file **Proposal** (PDF) saat pengajuan.
   - Upload file **Laporan Akhir** (PDF) saat kegiatan sedang berjalan.
3. **Sistem Anggota Tim & Undangan (Relasi N:M)**
   - Dosen dapat mengundang dosen lain menjadi anggota tim pengabdian.
   - Penentuan *Role* anggota (Ketua, Pemateri, Anggota, dll).
   - Dosen yang diundang dapat **Menerima (Accept)** atau **Menolak (Reject)** undangan melalui panel *Undangan Keanggotaan*.
4. **Alur Persetujuan (Workflow & Status)**
   - Siklus status: `Diusulkan` ➡️ `Berjalan` (disetujui Admin) ➡️ `Selesai` (difinalisasi oleh Dosen).
5. **Keamanan Tingkat Lanjut (RBAC & Anti-IDOR)**
   - **IDOR Protection**: Dosen tidak dapat memodifikasi atau menghapus data pengajuan milik dosen lain.
   - **Role-Based Access Control**: Hanya role *Admin* yang dapat melihat menu persetujuan untuk mengubah status menjadi Berjalan.
6. **Export Data (Reporting)**
   - Export daftar pengabdian ke format **PDF** dan **Excel**.
7. **UI/UX Interaktif (HTMX)**
   - Navigasi mulus ala *Single Page Application* tanpa *full-page reload* berkat implementasi HTMX dan Basecoat CSS.

---

## 🛠️ Stack Teknologi
- **Backend:** Node.js, Express.js
- **Database:** MySQL (Aiven/Railway Cloud)
- **View Engine:** EJS (Embedded JavaScript templates)
- **Styling:** Vanilla CSS, Basecoat, Tailwind CSS
- **Interaktivitas:** HTMX, Vanilla JavaScript
- **Testing:** Playwright (End-to-End Testing)

---

## 🚀 Cara Menjalankan Aplikasi di Lokal (Development)

### Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau terbaru)
- [MySQL](https://www.mysql.com/) (terpasang secara lokal atau menggunakan XAMPP/Cloud DB)

### Langkah Instalasi
1. **Clone repository ini**
   ```bash
   git clone https://github.com/Shevaramadhan/sistem-pengabdian-PWEB-B13-Tahap2.git
   cd sistem-pengabdian-PWEB-B13-Tahap2
   ```

2. **Install dependensi library**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment**
   Buat file `.env` di root direktori (gunakan `.env.example` sebagai referensi) dan sesuaikan dengan kredensial database lokal Anda:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=
   DB_NAME=facultyware
   PORT=3000
   SESSION_SECRET=rahasia_kelompok_b13
   ```

4. **Siapkan Database & Seeding Data**
   Jalankan file SQL schema/migrasi yang telah disediakan untuk membuat struktur tabel di database Anda. Anda juga bisa menjalankan skrip seeding bawaan jika tersedia.

5. **Jalankan Aplikasi**
   Untuk mode development (dengan *hot-reload* nodemon):
   ```bash
   npm run dev
   ```
   Atau untuk mode production:
   ```bash
   npm start
   ```

6. **Akses di Browser**
   Buka `http://localhost:3000` di browser Anda.

---

## 🧪 Pengujian Otomatis (Testing)
Aplikasi ini diuji menggunakan **Playwright** untuk memastikan seluruh alur berjalan tanpa bug. 18 Skenario pengujian (100% Lulus) mencakup autentikasi, validasi form, hingga IDOR protection.

Menjalankan pengujian:
```bash
npx playwright test
```

Menampilkan laporan HTML hasil pengujian:
```bash
npx playwright show-report
```

---
*Dikembangkan dengan dedikasi oleh Kelompok B13 untuk Tugas Besar PWEB.*
