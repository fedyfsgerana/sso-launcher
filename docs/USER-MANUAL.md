# Panduan Pengguna & Administrator

Cara memakai SSO Launcher sehari-hari, untuk karyawan maupun Pengelola Portal.

> Kembali ke [README utama](../README.md). Alur kerja lengkapnya ada di [`WORKFLOW.md`](WORKFLOW.md).

---

## Masuk ke Portal

1. Buka alamat portal di browser.
2. Isi **email** dan **password** dari Pengelola Portal, lalu klik **Masuk**.

| Kalau terjadi | Artinya dan yang harus dilakukan |
| --- | --- |
| Email atau password salah | Periksa penulisan email dan huruf besar kecil password. Setelah beberapa kali gagal, akun dikunci sementara |
| Akun terkunci sementara | Tunggu 15 menit, atau minta Pengelola Portal membuka kuncinya lewat menu Keamanan |
| Akun dinonaktifkan | Hubungi Pengelola Portal. Biasanya terjadi saat karyawan pindah bagian atau resign |
| Sesi berakhir sendiri | Sesi berlaku maksimal 8 jam, dan berakhir kalau diam lebih dari 15 menit. Masuk kembali seperti biasa |

Setiap kali masuk dari perangkat baru, portal mengirim **notifikasi** ke lonceng di kanan atas. Kalau itu bukan Anda, segera ganti password dan beri tahu Pengelola Portal.

---

## Mengenal Halaman Portal

| Menu | Isinya |
| --- | --- |
| **Beranda** | Sapaan, kartu ringkasan (aplikasi tersedia, favorit, dibuka minggu ini, sedang perbaikan), Favorit, Aplikasi Saya dengan pencarian dan filter kategori, serta aktivitas terakhir. Aplikasi tampil sebagai ikon pintasan dengan titik kecil di pojok ikon: hijau berperisai untuk login otomatis lewat SSO, abu-abu berpanah untuk aplikasi tanpa SSO, dan oranye berkunci pas untuk aplikasi yang sedang maintenance. Arahkan kursor ke ikon aplikasi yang sedang maintenance untuk melihat pesan perbaikannya |
| **Aplikasi Saya** | Semua aplikasi yang boleh dibuka, dikelompokkan per kategori, dengan pencarian dan filter |
| **Favorit** | Aplikasi yang ditandai bintang, untuk akses cepat |
| **Terbaru** | Aplikasi yang terakhir dibuka, beserta waktunya |
| **Profil Saya** | Data diri dan penggantian password |
| **Pengaturan** | Tema terang atau gelap, notifikasi, dan daftar perangkat yang sedang masuk |

Halaman manajemen menampilkan **kartu ringkasan** di bawah judul halaman. Warnanya menunjukkan arti angkanya: hijau untuk hal umum, biru untuk informasi, oranye untuk yang perlu perhatian, dan merah untuk masalah.

Menu manajemen hanya tampil kalau grup Anda memilikinya. Kalau tidak tampil, berarti memang tidak diberikan, bukan karena rusak.

Pintasan yang berguna: tekan **Ctrl + K** untuk mencari aplikasi atau menu dari mana saja.

---

## Membuka Aplikasi

1. Cari aplikasinya di **Beranda** atau **Aplikasi Saya**.
2. Klik **Buka**.
3. Muncul layar singkat "Membuka ...", lalu aplikasi terbuka dan Anda **sudah masuk** di sana.

Tidak perlu mengisi email dan password lagi. Itulah inti dari Single Sign-On.

| Kalau terjadi | Artinya |
| --- | --- |
| Tombol Buka tidak bisa diklik | Aplikasi sedang **maintenance**. Arahkan kursor ke tulisan "Sedang maintenance" untuk melihat keterangan dari administrator, kalau ada |
| Aplikasi tidak ada di daftar | Grup Anda belum diberi akses. Minta ke Pengelola Portal |
| Aplikasi meminta login sendiri | Aplikasi itu belum mengikuti panduan integrasi. Laporkan ke Pengelola Portal |
| Halaman 503 sedang dalam perbaikan | Menu itu sengaja ditutup sementara. Judul dan keterangannya dari Pengelola Portal |

**Menandai favorit:** klik ikon bintang di kartu aplikasi. Bintang kuning berarti belum favorit, bintang oranye bercoret berarti sudah favorit dan klik lagi untuk melepas.

---

## Mengelola Akun Sendiri

| Kebutuhan | Langkah |
| --- | --- |
| Ganti password | **Profil Saya** → isi password lama dan baru → Simpan |
| Ganti tema | **Pengaturan** → Tampilan → Terang, Gelap, atau Ikuti Sistem |
| Atur lebar sidebar | Tarik tepi kanan sidebar. Klik dua kali tepinya untuk kembali ke lebar bawaan |
| Atur notifikasi | **Pengaturan** → Notifikasi |
| Lihat perangkat yang masuk | **Pengaturan** → Perangkat. Ada tombol untuk keluar dari perangkat lain |
| Notifikasi maintenance | Anda menerima pemberitahuan saat aplikasi yang boleh Anda buka masuk maintenance dan saat kembali aktif. Bisa dimatikan lewat **Pengaturan → Notifikasi** |
| Hapus notifikasi | Klik lonceng → ikon tempat sampah di notifikasi, atau **Hapus Semua** |
| Keluar | Klik nama di kanan atas → **Keluar**. Semua aplikasi ikut keluar dalam beberapa menit |

---

## Mengurutkan dan Mencari di Tabel

Semua tabel manajemen memakai cara yang sama:

| Kebutuhan | Langkah |
| --- | --- |
| Urutkan | Klik judul kolom yang berikon panah: sekali urut naik ▲, dua kali urut turun ▼, tiga kali kembali ke urutan bawaan |
| Cari dan saring | Ketik di kotak pencarian atau pilih filter di toolbar. Hasil diambil dari server, jadi mencakup semua data, bukan hanya halaman yang terlihat |
| Aksi per baris | Tombol **⋯** di kolom Aksi. Pilihan yang tampil mengikuti aksi yang dicentang untuk grup Anda |
| Aksi massal | Centang beberapa baris, lalu pakai bilah aksi di atas tabel. Pilihan centang dikosongkan saat pindah halaman |

---

## Arti Warna Badge

Warna dan ikon badge dipakai sama di semua halaman, sehingga artinya bisa dikenali tanpa membaca teksnya. Ikon status Aktif, Nonaktif, dan Maintenance sama dengan ikon tombol aksinya.

**Status dan jumlah di tabel manajemen:**

| Warna | Arti |
| --- | --- |
| Hijau | Aktif, atau SSO **Terhubung** |
| Kuning | Aplikasi dalam **Maintenance** dan hal yang perlu diperhatikan |
| Merah | Nonaktif, SSO **Belum terhubung**, **Belum ada kredensial aktif**, kredensial dicabut |
| Abu-abu | **Belum ada**, artinya kolom jumlah masih kosong, dan **Tanpa SSO** untuk aplikasi tautan biasa |
| Ungu | Nama atau jumlah **grup** |
| Biru | Jumlah **aplikasi** |
| Oranye | Jumlah **menu** |
| Biru keabuan | Jumlah **pengguna** |

**Aksi di Riwayat Aktivitas, Aktivitas Terbaru di Beranda, riwayat pengguna, dan Riwayat Versi:**

| Warna | Aksi |
| --- | --- |
| Hijau | Menambah atau mengembalikan: Tambah, Pulihkan, Beri Akses, Kunci Dibuka, Tambah Favorit |
| Kuning | Mengubah data: Ubah, Kembalikan Versi |
| Merah | Menghapus, mencabut, atau gagal: Hapus, Cabut Akses, Dikunci, Gagal Masuk, setiap aksi yang gagal, dan label hasil **Gagal** di detail aktivitas |
| Biru | Buka Aplikasi |
| Abu-abu | Aktivitas tanpa perubahan data: Masuk, Keluar, Hapus Favorit |

> **Catatan untuk pengembang:** badge status dibuat dari komponen di `components/ui/status-badge.tsx` (`ActiveBadge`, `ApplicationStatusBadge`, `CountBadge`, `EmptyBadge`, `GroupBadge`, `SsoConnectionBadge`, `OutcomeBadge`) yang memakai kelas `status on`, `warn`, `danger`, `off`, `purple`, `info`, dan `orange` di `20-features.css`. Warna aksi aktivitas diatur satu tempat di fungsi `actionTone` pada `lib/portal/audit-options.ts`. Jangan menulis `<span className="status ...">` langsung, supaya warna dan ikon tetap seragam. Semua warna badge, tombol, dan kartu ringkasan diambil dari token palet di `styles/00-palette.css` (lihat `docs/README.md` bagian Warna Standar).

---

## Mengelola Pengguna

> Perlu menu **Manajemen Pengguna**. Pilihan di menu ⋯ mengikuti aksi yang dicentang untuk grup Anda.

| Aksi | Langkah |
| --- | --- |
| Tambah pengguna | Tombol **Tambah Pengguna** di toolbar. Isi nama, NIK (opsional), departemen, jabatan, dan **email** yang dipakai untuk login. Pakai **Buat Password Acak** supaya password kuat dan langsung tersalin |
| Ubah data | ⋯ → **Ubah**. Semua kolom bisa diubah, termasuk email. Kalau email diganti, beri tahu penggunanya karena email dipakai untuk login |
| Aktifkan atau nonaktifkan | ⋯ → **Aktifkan** atau **Nonaktifkan**. Menonaktifkan langsung mencabut seluruh sesi pengguna itu |
| Atur ulang password, cabut sesi, buka kunci | ⋯ → **Keamanan** |
| Lihat riwayat | ⋯ → **Riwayat**. Menampilkan semua perubahan yang menyangkut pengguna itu |
| Hapus | ⋯ → **Hapus**, wajib mengisi alasan. Akun sendiri tidak bisa dihapus |

> **Catatan:** Teks dirapikan otomatis saat disimpan. Nama, jabatan, nama grup, nama aplikasi, dan label menu memakai huruf depan tiap kata kapital, sedangkan deskripsi dan pesan cukup huruf depan kalimat. Singkatan seperti IT, HR, dan QC tetap ditulis kapital.

## Mengelola Grup dan Akses

> Perlu menu **Manajemen Grup & Akses**. Di sinilah semua hak akses portal ditentukan.

Satu grup memegang tiga hal:

| Tab | Isinya |
| --- | --- |
| **Kelola Pengguna** | Siapa saja anggota grup ini. Pilihannya hanya pengguna dari departemen grup. Filter Dipilih dan Belum dipilih mengikuti anggota yang sudah tersimpan |
| **Akses Aplikasi** | Aplikasi yang boleh dibuka anggotanya lewat SSO |
| **Akses Menu** | Menu sidebar yang terlihat sampai submenu terdalam, **beserta aksi** yang boleh dipakai di dalamnya. Tampil sebagai kartu per bagian, atau sebagai tabel lewat tombol kolom / tabel di toolbar (bawaan saat menu lebih dari 30). Mencentang menu ikut memilih turunan dan induknya, dan centang di judul kartu bagian memilih semua menu di bagian itu |

**Cara mengatur aksi:** di tab Akses Menu, centang menunya terlebih dulu. Aksi yang tersedia langsung tampil sebagai chip di bawahnya (di tabel, pada kolom Aksi yang diizinkan), dan hitungan seperti **2/5** di samping nama menu menunjukkan jumlah aksi yang diizinkan. Klik chip untuk mengizinkan atau mencabut aksi, atau pakai **Semua aksi**.

Contoh pemakaian nyata:

| Grup | Pengaturan |
| --- | --- |
| Staf HRD | Menu Manajemen Pengguna dengan aksi Tambah dan Ubah saja, tanpa Hapus |
| Auditor | Menu Riwayat Aktivitas dengan aksi Ekspor saja, tanpa Pulihkan dan Kembalikan Versi |
| Operator Produksi | Tanpa menu manajemen, hanya Akses Aplikasi ke aplikasi produksi |

**Membuat grup:** pilih **Departemen** dulu, lalu isi **Nama Grup**. Kolom Nama Grup menampilkan daftar jabatan pengguna di departemen itu. Jabatan yang sudah dipakai grup lain ditandai **Sudah dipakai grup lain**. Klik **Isi Manual** untuk mengetik nama sendiri, atau **Pilih Jabatan** untuk kembali ke daftar. Nama grup hanya perlu unik di departemen yang sama, jadi grup "Operator" boleh ada di beberapa departemen. **Keterangan** dipilih dari daftar umum "Grup akses …", karena aksesnya sendiri diatur di tab Akses Menu dan Akses Aplikasi.

> **Duplikat Grup** berguna saat membuat grup yang mirip. Akses aplikasi dan menunya ikut tersalin, sedangkan anggotanya tidak.

---

## Mengelola Aplikasi

> Perlu menu **Manajemen Aplikasi**.

| Aksi | Langkah |
| --- | --- |
| Tambah aplikasi | Isi nama, dan slug terisi otomatis. **Login Lewat SSO Portal** dibiarkan **Ya**, lalu URL Aplikasi diisi alamat callback dari tim aplikasi. Pilih **Tidak, tautan biasa** hanya untuk situs yang tidak memakai login portal; situs itu dibuka langsung dan tidak butuh kredensial |
| Ubah status | **Aktif** bisa dibuka, **Maintenance** tampil tapi tidak bisa dibuka, **Nonaktif** disembunyikan |
| Pesan maintenance | Saat mengalihkan ke maintenance, isi **Pesan untuk pengguna**, misalnya perkiraan selesainya. Boleh dikosongkan, dan bisa diperbaiki lewat form Ubah Aplikasi |
| Kategori dan keterangan | Kategori mengikuti departemen bawaan ditambah "Lainnya". Keterangan dipilih dari daftar umum, misalnya "Aplikasi pengajuan dan persetujuan", atau pilihan otomatis yang menyebut nama aplikasi dan departemennya |
| Kredensial SSO | ⋯ → **Kredensial SSO**. Bagian atas menampilkan status koneksi, jumlah kredensial aktif (beserta yang belum pernah dipakai), kapan terakhir dipakai, dan alamat callback, disusul alur tiga langkah serah terima. Klik **Buat Kredensial**: jendela **Kredensial Dibuat** menampilkan Client ID dan Client Secret, dan kartu **Panduan Integrasi** dengan tombol **Unduh** untuk file `SSO Launcher - SSO Integration {Nama Aplikasi}.md` (berisi kredensial, pengaturan siap tempel, pekerjaan tim aplikasi, daftar uji, dan panduan SSO lengkap). **Secret dan panduan hanya bisa diambil sekali, dari jendela itu**; kalau terlewat, buat kredensial baru. **Sudah Saya Simpan** baru bisa diklik setelah panduan diunduh atau secret disalin, dan menutup jendela tanpa itu membatalkan kredensial. Kolom **Panduan** di tabel menunjukkan apakah panduan kredensial itu sudah diunduh; status **Aktif · Terpakai**, **Aktif · Belum dipakai**, atau **Dicabut** menunjukkan keadaannya. Menu ⋯ berisi **Cabut** untuk kredensial aktif dan **Hapus** untuk yang sudah dicabut. Untuk mengganti kredensial, buat yang baru dulu, lalu cabut yang lama setelah yang baru terpakai |
| Lihat penggunanya | ⋯ → **Pengguna Aplikasi**. Menampilkan siapa saja yang bisa membuka aplikasi itu dan lewat grup mana |
| Hapus | ⋯ → **Hapus** dengan alasan. Aplikasi tidak bisa dibuka lagi oleh siapa pun |

> Mengubah **slug** aplikasi yang sudah dipakai akan memutus tautan `/launch/{slug}` yang tersimpan di tempat lain. Ubah hanya kalau memang perlu.

---

## Mengelola Menu

> Perlu menu **Manajemen Menu**. Menu bisa dilihat sebagai **papan** (kartu per bagian, berurutan seperti di sidebar) atau **tabel** (daftar bertingkat dengan alamat, jumlah grup, status, dan waktu diubah). Ganti lewat tombol papan / tabel di toolbar. Pilihan Anda diingat, dan saat menu sudah lebih dari 30 tabel menjadi tampilan bawaan.

| Aksi | Langkah |
| --- | --- |
| Tambah bagian | Kotak **Tambah bagian** di akhir papan, atau tombol **Tambah bagian** di bawah tabel. Bagian tampil otomatis di sidebar kalau berisi menu yang bisa diakses pengguna |
| Tambah menu | Tombol **Tambah menu** di dasar kartu bagian (papan), atau ⋯ bagian → **Tambah Menu** (papan dan tabel). Bagiannya terisi otomatis |
| Tambah submenu | ⋯ di baris menu → **Tambah Submenu**. Menu induknya terisi otomatis, dan bisa bertingkat tanpa batas |
| Susun ulang menu | Seret barisnya: tepi atas atau bawah menu lain untuk mengubah urutan, bagian tengahnya untuk menjadikannya submenu, atau area kosong kartu bagian lain untuk memindahkannya ke bagian itu. Tekan Esc untuk membatalkan |
| Pindah ke bagian atau induk lain | Seret ke kartu bagian tujuan, atau ⋯ → **Pindah Posisi** |
| Susun ulang bagian | Seret judul kartu bagian ke kiri atau kanan kartu bagian lain. Di tabel, seret baris bagian ke atas atau ke bawah bagian lain |
| Buka atau tutup submenu | Klik panah di depan menu yang punya submenu |
| Mode perbaikan | ⋯ → **Mode Perbaikan**. Isi judul dan keterangan yang akan dilihat pengguna |
| Aktif atau nonaktif | ⋯ → **Aktifkan** atau **Nonaktifkan**. Menu nonaktif hilang dari sidebar semua pengguna |
| Hapus menu | ⋯ → **Hapus**. Submenunya bisa dipindah ke menu lain atau naik satu tingkat |
| Hapus bagian | ⋯ di judul kartu bagian → **Hapus**. Kalau bagian masih berisi menu, wajib memilih bagian tujuan untuk menu-menunya |
| Aksi massal (tabel) | Centang beberapa menu, lalu pilih **Aktifkan**, **Nonaktifkan**, atau **Hapus** di bar yang muncul. Menu sistem dilewati saat dihapus |
| Susun ulang (tabel) | Seret baris menunya, dengan aturan yang sama seperti di papan. Lepas di baris bagian untuk memindahkan ke akhir bagian itu |
| Ciutkan atau buka semua (tabel) | Tombol ciutkan semua / buka semua di toolbar, atau panah di depan bagian dan menu induk |

Menu nonaktif dan menu dalam mode perbaikan diberi label **Nonaktif** (merah) atau **Maintenance** (kuning). Menu aktif tidak diberi label. Seret-lepas hanya bisa dipakai kalau grup Anda punya aksi **Urutkan Menu**, dan dimatikan sementara selama pencarian atau filter aktif. Menu yang punya submenu **tidak membuka halaman** saat diklik di sidebar, hanya membuka atau menutup cabangnya. Menu bertanda **Sistem** tidak bisa dihapus, tapi boleh dinonaktifkan.

---

## Riwayat Aktivitas

> Perlu menu **Riwayat Aktivitas**.

| Kebutuhan | Langkah |
| --- | --- |
| Cari kejadian | Saring per aksi, modul, hasil, pengguna, atau rentang tanggal |
| Lihat detail perubahan | Klik barisnya. Muncul nilai sebelum dan sesudah, beserta perangkat dan IP pelaku |
| Kembalikan ke versi lama | Dari detail, buka **Histori Versi**, pilih versinya, lalu kembalikan dengan alasan |
| Pulihkan data terhapus | Tab **Tempat Sampah** → ⋯ → **Pulihkan** |
| Unduh laporan | Tombol **Ekspor Excel** di toolbar filter. Filter dan urutan kolom yang aktif ikut diterapkan |

Arti warna label aksi: hijau menambah, oranye mengubah, merah menghapus atau gagal, biru masuk dan membuka aplikasi.

---

## Tanya Jawab

| Pertanyaan | Jawaban |
| --- | --- |
| Kenapa menu saya lebih sedikit dari teman? | Menu mengikuti grup. Minta Pengelola Portal kalau memang butuh |
| Kenapa tombol Hapus tidak ada? | Grup Anda tidak diberi aksi Hapus di menu itu |
| Saya logout di portal, kenapa aplikasi masih terbuka? | Aplikasi memeriksa portal tiap 5 menit. Tunggu sebentar, atau muat ulang halamannya |
| Saya keluar dari aplikasi, kenapa portal masih masuk? | Keluar dari aplikasi hanya menutup aplikasi itu. Anda kembali ke Beranda portal dan bisa membuka aplikasi lain tanpa login ulang. Untuk keluar sepenuhnya, pakai **Keluar** di portal |
| Password saya lupa | Hubungi Pengelola Portal untuk diatur ulang. Portal tidak menyimpan password asli |
| Data terhapus, bisa kembali? | Bisa, lewat Tempat Sampah di Riwayat Aktivitas |
| Kenapa muncul pesan aplikasi belum siap dibuka? | SSO aplikasi itu belum terhubung ke SSO Launcher. Hubungi Administrator Sistem |
| Bisa buka aplikasi tanpa lewat portal? | Tidak. Aplikasi akan mengembalikan Anda ke portal untuk login |
| Kenapa huruf besar nama yang saya ketik berubah? | Portal merapikan penulisan secara otomatis supaya seluruh data seragam. Singkatan yang sudah dikenal tetap kapital |
