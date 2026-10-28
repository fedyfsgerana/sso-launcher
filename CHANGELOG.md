# Changelog

Semua perubahan penting dicatat di file ini.

Format mengikuti [Keep a Changelog](https://keepachangelog.com/id-ID/1.1.0/), dan versi mengikuti [Semantic Versioning](https://semver.org/lang/id/).

## [Unreleased]

## [1.0.0] - Belum dirilis

Rilis pertama.

### Ditambahkan

- Login dengan email dan password, sesi lewat cookie HTTP-only dengan CSRF, batas sesi mutlak dan batas tidak aktif, serta penguncian sementara setelah login gagal berulang.
- Application launcher: Beranda, Aplikasi Saya, Favorit, Terbaru, dan pencarian aplikasi.
- SSO dengan token peluncuran 60 detik sekali pakai, token layanan untuk aplikasi tujuan, validasi server-to-server, dan cek sesi berkala untuk logout serentak.
- Kredensial SSO per aplikasi dengan panduan integrasi yang bisa diunduh sekali, termasuk contoh kode ASP.NET Core, Node.js, Laravel, FastAPI, Django, Spring Boot, PHP, dan Go.
- Direktori pengguna untuk aplikasi tujuan: daftar pengguna yang boleh membuka aplikasi dan pemeriksaan satu pengguna.
- Manajemen pengguna, grup dan akses (menu, aksi per tombol, aplikasi, anggota), aplikasi, dan menu portal bertingkat dengan mode perbaikan.
- Notifikasi login dari perangkat baru dan akun terkunci.
- Audit trail: soft delete dengan alasan, histori per field, versi data dengan rollback, tempat sampah, dan ekspor Excel.
- Pengamanan: header keamanan, pembatasan laju permintaan, batas ukuran dan waktu permintaan, serta pemeriksaan konfigurasi produksi.
- Tema terang dan gelap, tampilan responsif dengan menu bawah di HP.
- Tes integrasi API (xUnit) dan tes frontend (Vitest), serta CI GitHub Actions.
