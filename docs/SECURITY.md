# Spesifikasi Keamanan

Ringkasan seluruh perlindungan SSO Launcher, untuk keperluan audit dan peninjauan berkala.

> Kembali ke [README utama](../README.md).

---

## Identitas dan Password

| Kontrol | Penerapan |
| --- | --- |
| Penyimpanan password | **PBKDF2-SHA256, 600.000 iterasi**, salt acak 16 byte per pengguna, hash 32 byte. Password asli tidak pernah disimpan maupun dicatat |
| Perbandingan hash | Memakai perbandingan waktu tetap, sehingga tidak bocor lewat selisih waktu proses |
| Akun tidak dikenal | Tetap menghitung hash palsu, supaya waktu jawabannya sama dengan akun yang ada. Penyerang tidak bisa menebak email yang terdaftar |
| Pesan kegagalan | Seragam, tidak membedakan email salah dan password salah |
| Password baru | Panjang minimum diperiksa di server, dan tombol **Buat Password Acak** disediakan untuk administrator |

### Pembatas percobaan login

| Lapisan | Batas bawaan |
| --- | --- |
| Rate limit per IP | 10 permintaan login per menit, dijawab `429` |
| Kunci per alamat IP | 5 kegagalan dalam jendela 15 menit |
| Kunci per akun | 20 kegagalan dalam jendela 15 menit |
| Rate limit autentikasi layanan | 30 permintaan token per menit per pemanggil |

Setiap kuncian dan setiap login gagal tercatat di `audit_logs`, dan pemilik akun menerima notifikasi di portal.

---

## Sesi dan Cookie

| Kontrol | Penerapan |
| --- | --- |
| Penyimpanan sesi | Cookie **HttpOnly**, sehingga tidak bisa dibaca JavaScript. `Secure` aktif di produksi, dan `SameSite` membatasi pengiriman lintas situs |
| Isi cookie | Token acak, bukan data pengguna. Nilainya disimpan sebagai **hash** di database, jadi pencurian isi database tidak memberi sesi yang bisa dipakai |
| Batas mutlak | 8 jam sejak login, diatur lewat `Session:LifetimeHours`. Tidak bisa ditembus perpanjangan dari aplikasi mana pun |
| Batas diam | 15 menit, diatur lewat `Session:IdleMinutes` |
| Pencabutan | Logout, penonaktifan akun, penghapusan akun, dan penggantian password mencabut sesi seketika |
| Perangkat lain | Pengguna bisa melihat daftar perangkat yang sedang masuk dan mengeluarkannya lewat **Pengaturan** |
| CSRF | Setiap permintaan yang mengubah data wajib membawa token CSRF yang cocok dengan sesinya |

---

## Otorisasi

Portal tidak memakai peran. Semua hak akses berasal dari **grup**, dan diperiksa di server pada setiap permintaan.

| Lapisan | Penerapan |
| --- | --- |
| Akses menu | Endpoint manajemen memeriksa kepemilikan menu `users`, `groups`, `applications`, `menus`, atau `audit` |
| Akses aksi | Setiap tombol yang mengubah data punya kunci aksi, diperiksa lewat `PortalAuthorization.AuthorizeActionAsync`. Katalognya ada di `MenuActions.cs` |
| Akses aplikasi | Diperiksa saat peluncuran SSO dan pada setiap pemeriksaan sesi berkala |
| Tampilan | Menyembunyikan tombol dan menu hanya untuk kenyamanan, **tidak pernah dianggap batas keamanan** |
| Halaman tanpa izin | Menghasilkan **403**, bukan pengalihan diam-diam yang menyembunyikan keberadaan halaman |

> Aturan pengembangan: tombol baru wajib melewati tiga langkah sekaligus, yaitu daftar di katalog aksi, penjagaan di endpoint, dan penyembunyian di tampilan. Melewatkan langkah kedua berarti membuka celah.

---

## Keamanan SSO

| Kontrol | Penerapan |
| --- | --- |
| Umur token | **60 detik** dan **sekali pakai**. Token bekas ditolak. Penandanya disimpan di database, jadi tetap berlaku walaupun API dijalankan ulang atau berjalan di lebih dari satu instans |
| Validasi | Dilakukan **server-to-server** oleh aplikasi tujuan, memakai kredensial layanan. Tidak pernah dari browser |
| Pengikatan aplikasi | Token hanya sah untuk aplikasi yang memintanya. Token milik aplikasi lain ditolak |
| Jawaban penolakan | Selalu **401** tanpa membedakan sebab, sehingga tidak membocorkan informasi ke pemanggil |
| Identitas yang dikirim | Hanya data yang diperlukan: id, nama, email, nomor karyawan, departemen, jabatan, aplikasi, dan nama grup. Tidak ada hash password atau data sensitif lain |
| Pemeriksaan berkala | `POST /api/sso/session` memeriksa sesi, status akun, akses aplikasi, dan status kredensial sekaligus |
| Kredensial layanan | Secret disimpan sebagai hash. Bisa dicabut kapan saja, dan pencabutan langsung berlaku |
| Signing key | Kunci SSO dan kunci token layanan **berbeda**, dan keduanya wajib diganti di produksi |

---

## Transport dan Header

| Header | Nilai dan tujuannya |
| --- | --- |
| `Strict-Transport-Security` | Aktif di produksi, memaksa HTTPS |
| `Content-Security-Policy` | `default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'` untuk API |
| `X-Frame-Options` | `DENY`, mencegah clickjacking |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `no-referrer`, mencegah alamat internal bocor ke situs luar |
| `Permissions-Policy` | Kamera, mikrofon, lokasi, dan pembayaran dimatikan |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| Header `Server` | Dihapus, supaya versi server tidak terbaca |
| CORS | Hanya origin portal yang terdaftar. Wildcard dilarang di produksi |

---

## Perlindungan Data

| Kontrol | Penerapan |
| --- | --- |
| Injeksi SQL | Seluruh akses data lewat Entity Framework Core dengan query berparameter |
| Validasi masukan | Diperiksa di server. Validasi frontend hanya untuk kenyamanan |
| Soft delete | Data tidak pernah hilang permanen. Penghapusan wajib disertai alasan, dan bisa dipulihkan |
| Pembersihan otomatis | Audit 36 bulan, versi data 36 bulan, aktivitas portal 6 bulan, notifikasi 3 bulan. Audit dihapus per partisi bulanan, sisanya bertahap agar tidak membebani database |
| Isolasi data pribadi | Notifikasi, favorit, dan riwayat pribadi hanya bisa diakses pemiliknya, diperiksa lewat id sesi |

---

## Jejak Audit

| Yang dicatat | Isi |
| --- | --- |
| Siapa dan kapan | Pelaku, nama saat kejadian, waktu, dan referensi sesi. Tindakan otomatis tercatat atas nama **Sistem** |
| Dari mana | Alamat IP, nama perangkat, jenis perangkat, sistem operasi, browser, dan user agent |
| Apa yang berubah | Nilai sebelum dan sesudah per kolom, plus snapshot lengkap di `audit_data_versions` |
| Alasan | Wajib untuk setiap penghapusan dan pengembalian versi |
| Kejadian autentikasi | Login, logout, login gagal, login yang ditolak pembatas, dan pembukaan aplikasi |
| Yang tidak pernah dicatat | Password, hash password, secret kredensial, token sesi, token SSO, dan signing key |

Jejak audit tidak bisa diubah lewat antarmuka portal. Pengembalian versi pun dicatat sebagai versi baru, bukan menimpa riwayat lama.

---

## Pengelolaan Rahasia

| Tidak boleh masuk Git | Tidak boleh masuk log |
| --- | --- |
| Password dan connection string produksi | Password dan hash-nya |
| Signing key SSO dan token layanan | Token sesi dan token SSO |
| Client Secret aplikasi | Client Secret |
| File `appsettings.Development.json` dan `.env.local` | Signing key |

Penyerahan Client Secret ke tim aplikasi memakai jalur aman, bukan chat grup atau email biasa. Kredensial lingkungan uji dan produksi dibuat terpisah, dan yang tidak dipakai segera dicabut.

---

## Pembagian Tanggung Jawab

| Pihak | Tanggung jawab |
| --- | --- |
| SSO Launcher | Identitas pengguna, sesi, kebijakan password, penerbitan dan validasi token, pencatatan audit, serta penentuan siapa boleh membuka aplikasi apa |
| Aplikasi tujuan | Menjaga Client Secret, memvalidasi token dari server, memeriksa sesi berkala, tidak menyediakan login sendiri, dan menentukan hak akses **di dalam** aplikasinya |
| Infrastruktur | HTTPS, sertifikat, reverse proxy, backup database, dan pembaruan sistem operasi |
| Pengelola Portal | Memberi dan mencabut akses tepat waktu, terutama saat karyawan pindah bagian atau resign |

---

## Peninjauan Berkala

| Selang waktu | Yang diperiksa |
| --- | --- |
| Bulanan | Akun yang tidak aktif, akun karyawan yang sudah resign, dan kredensial aplikasi yang tidak lagi dipakai |
| Triwulanan | Isi tiap grup: apakah menu, aksi, dan aplikasi yang dipegang masih sesuai kebutuhan |
| Triwulanan | Kerentanan paket, lewat `pnpm audit --prod` dan `dotnet list package --vulnerable` |
| Tahunan | Penggantian signing key, dan peninjauan seluruh dokumen ini |
| Saat insiden | Cabut kredensial terkait, cabut sesi pengguna terdampak, lalu telusuri lewat Riwayat Aktivitas |

## Melaporkan Celah Keamanan

Jangan melaporkan celah keamanan lewat Issue publik. Hubungi pembuat langsung lewat [GitHub](https://github.com/fedyfsgerana), sertakan langkah untuk mengulang dan dampaknya.
