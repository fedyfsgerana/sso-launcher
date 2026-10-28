# Alur Kerja Sistem

Bagaimana SSO Launcher dipakai sehari-hari, dari pendaftaran aplikasi sampai penelusuran audit.

> Kembali ke [README utama](../README.md).

---

## Peran

SSO Launcher tidak memakai peran seperti admin atau user. Yang ada adalah **grup**, dan grup itu yang memegang menu, aksi, serta aplikasi. Untuk memudahkan pembicaraan, dokumen ini memakai sebutan berikut.

| Sebutan | Siapa dan apa yang dipegang |
| --- | --- |
| **Pengelola Portal** | Anggota grup Administrator. Memegang seluruh menu manajemen beserta aksinya |
| **Administrator Aplikasi** | Tim pengembang aplikasi tujuan, misalnya ERP atau HRIS. Tidak perlu akses manajemen portal |
| **Pengguna** | Karyawan yang membuka aplikasi lewat portal |
| **Auditor** | Grup yang diberi menu Riwayat Aktivitas, tanpa menu manajemen lain |

---

## Alur 1: Menghubungkan Aplikasi Baru

```text
Administrator Aplikasi                 Pengelola Portal
        │                                      │
        │  1. ajukan: nama, URL callback       │
        ├─────────────────────────────────────►│
        │                                      │  2. Tambah Aplikasi
        │                                      │  3. Buat Kredensial SSO
        │  4. Client ID + Secret (jalur aman)  │
        │◄─────────────────────────────────────┤
        │                                      │
        │  5. terapkan panduan integrasi       │
        │  6. kirim bukti Kriteria Berhasil    │
        ├─────────────────────────────────────►│
        │                                      │  7. beri akses ke grup
        │                                      │  8. aplikasi tampil di portal
```

| No | Pelaku | Langkah |
| --- | --- | --- |
| 1 | Administrator Aplikasi | Mengajukan nama aplikasi, alamatnya, dan URL callback `https://{aplikasi}/sso/callback` |
| 2 | Pengelola Portal | **Manajemen Aplikasi → Tambah Aplikasi.** Slug terisi otomatis dari nama, status Aktif, dan Login Lewat SSO Portal bernilai Ya |
| 3 | Pengelola Portal | Buka aplikasinya → **Kredensial SSO → Buat Kredensial.** Secret hanya tampil sekali |
| 4 | Pengelola Portal | Serahkan Client ID dan Secret lewat jalur aman, bukan lewat chat grup atau email biasa |
| 5 | Administrator Aplikasi | Terapkan [panduan integrasi](SSO-INTEGRATION.md): callback, validasi token, cek sesi 5 menit, hapus form login sendiri |
| 6 | Administrator Aplikasi | Uji dengan akun uji, lalu kirim bukti kesepuluh poin Kriteria Berhasil |
| 7 | Pengelola Portal | **Manajemen Grup & Akses → Akses Aplikasi**, centang aplikasi itu untuk grup yang berhak |
| 8 | Pengguna | Aplikasi muncul di Beranda dan Aplikasi Saya, siap dibuka |

> Kredensial wajib ada sebelum aplikasi bisa dipakai login. Tanpa kredensial, portal menolak tombol Buka dan memberi tahu pengguna bahwa aplikasi belum siap dibuka. Kredensial lingkungan uji dan produksi dibuat terpisah, dan kredensial yang tidak dipakai segera dicabut di tab yang sama. Cara mengganti kredensial tanpa downtime ada di [panduan integrasi](SSO-INTEGRATION.md#mengelola-kredensial).

---

## Alur 2: Karyawan Baru

| No | Di mana | Langkah |
| --- | --- | --- |
| 1 | Manajemen Pengguna | **Tambah Pengguna**, lalu isi nama, email, NIK (opsional), departemen, dan jabatan. Tombol **Buat Password Acak** menyalin password ke papan klip |
| 2 | Manajemen Grup & Akses | Buka grup yang sesuai, misalnya **Staf Produksi**, lalu **Kelola Pengguna** dan centang karyawan itu |
| 3 | Serah terima | Berikan email dan password sementara, minta segera diganti lewat **Profil Saya** |
| 4 | Portal | Karyawan login, dan menu serta aplikasi muncul sesuai grupnya |

Kalau belum ada grup yang cocok, buat grup baru dulu. Nama grup bisa dipilih langsung dari jabatan karyawan itu di departemennya, misalnya "Operator" di Quality Control. Setelah itu tentukan tiga hal: **Akses Menu** beserta aksinya, **Akses Aplikasi**, dan **Kelola Pengguna**. Grup yang mirip bisa disalin dengan tombol **Duplikat Grup**, lalu tinggal disesuaikan.

---

## Alur 3: Pemakaian Harian

```text
Pengguna                SSO Launcher                 Aplikasi Tujuan
   │                          │                               │
   │  login sekali            │                               │
   ├─────────────────────────►│                               │
   │                          │                               │
   │  klik Buka               │                               │
   ├─────────────────────────►│                               │
   │                          │  token 60 detik, sekali pakai │
   │                          ├──────────────────────────────►│
   │                          │◄── validasi server-to-server ─┤
   │  halaman aplikasi        │                               │
   │◄─────────────────────────────────────────────────────────┤
   │                          │                               │
   │  buka aplikasi lain      │        tanpa login lagi       │
```

| Yang dilakukan pengguna | Yang terjadi |
| --- | --- |
| Login di portal | Sesi portal dibuat, berlaku maksimal 8 jam, dan berakhir kalau diam lebih dari 15 menit |
| Klik **Buka** pada aplikasi | Portal memeriksa akses, menerbitkan token 60 detik sekali pakai, lalu mengalihkan ke aplikasi |
| Bekerja di aplikasi | Aplikasi memeriksa sesi ke portal tiap 5 menit, dan pemeriksaan itu sekaligus memperpanjang sesi portal |
| Buka aplikasi kedua | Tidak perlu login lagi, karena sesi portal masih hidup |
| Tandai favorit | Aplikasi yang sering dipakai muncul di baris Favorit di Beranda |

Pengguna yang membuka alamat aplikasi langsung, tanpa lewat portal, akan dialihkan kembali ke portal untuk login.

---

## Alur 4: Keluar dari Portal

```text
Pengguna klik Keluar di portal
        │
        ├─► sesi portal berakhir seketika
        │
        └─► aplikasi A, B, C bertanya ke portal (maksimal 5 menit kemudian)
                  │
                  └─► jawaban: tidak aktif → sesi aplikasi dihapus
                            → pengguna dialihkan ke halaman login portal
```

Arahnya dua sisi:

| Arah | Akibat |
| --- | --- |
| Portal ke aplikasi | Keluar dari portal membuat semua aplikasi ikut keluar, paling lambat 5 menit kemudian |
| Aplikasi ke portal | Selama pengguna bekerja di aplikasi, sesi portal ikut hidup, jadi tidak diminta login ulang saat kembali ke portal |
| Keluar dari aplikasi | Hanya aplikasi itu yang keluar. Pengguna kembali ke Beranda portal tanpa login ulang selama sesi portal masih ada |
| Batas mutlak | 8 jam sejak login. Setelah itu wajib login ulang, seaktif apa pun pengguna |

---

## Alur 5: Perubahan Akses di Tengah Jalan

| Yang dilakukan Pengelola Portal | Akibatnya bagi pengguna |
| --- | --- |
| Cabut akses aplikasi dari grup | Aplikasi hilang dari portal, dan sesi di aplikasi itu berakhir pada pemeriksaan berikutnya |
| Cabut akses menu dari grup | Menu hilang dari sidebar. Membuka alamatnya langsung menghasilkan halaman **403** |
| Hapus centang satu aksi | Tombolnya hilang, dan pemanggilan langsung ke endpoint-nya ditolak dengan **403** |
| Nonaktifkan pengguna | Seluruh sesinya dicabut seketika, dan aplikasi ikut menutup sesinya |
| Keluarkan pengguna dari grup | Menu dan aplikasi dari grup itu langsung hilang |
| Alihkan aplikasi ke maintenance | Aplikasi tetap tampil tapi tidak bisa dibuka. Pengguna yang punya akses menerima notifikasi, dan pesan dari administrator muncul sebagai tooltip di kartu aplikasi |
| Kembalikan aplikasi ke aktif | Pengguna yang punya akses menerima notifikasi bahwa aplikasi sudah bisa dibuka lagi, dan pesan maintenance dihapus |
| Nonaktifkan aplikasi | Tidak bisa dibuka siapa pun, termasuk yang sesinya sedang berjalan |

Semua perubahan di atas tercatat di Riwayat Aktivitas, lengkap dengan pelaku, waktu, dan nilai sebelum serta sesudahnya.

---

## Alur 6: Halaman Sedang Dalam Perbaikan

```text
Pengelola Portal                      Pengguna
      │                                  │
      │ Manajemen Menu → 🔧              │
      │ nyalakan + isi judul & keterangan│
      │                                  │
      │                                  │ buka menu itu → halaman 503
      │                                  │ berisi judul & keterangan tadi
      │ selesai memperbaiki              │
      │ matikan sakelarnya               │
      │                                  │ menu kembali normal
```

Berlaku untuk **semua pengguna**, termasuk Pengelola Portal sendiri, dan ikut mengunci seluruh submenu di bawahnya. Kalau halamannya perlu dibuka untuk pengujian, matikan dulu mode perbaikannya.

---

## Alur 7: Menelusuri dan Memulihkan Data

| Kebutuhan | Langkah |
| --- | --- |
| Siapa mengubah apa | **Riwayat Aktivitas → tab Aktivitas.** Saring per aksi, modul, hasil, pengguna, atau rentang tanggal, lalu buka detailnya untuk melihat perubahan per kolom |
| Mengembalikan isian yang salah | Dari detail aktivitas, buka **Histori Versi**, pilih versi yang benar, lalu **Kembalikan ke versi ini** dengan alasan. Rollback dicatat sebagai versi baru |
| Data terlanjur dihapus | **Riwayat Aktivitas → tab Tempat Sampah**, cari datanya, lalu **Pulihkan** |
| Laporan untuk audit | Tombol **Ekspor Excel**. Filter yang sedang aktif ikut diterapkan, maksimal 10.000 baris |
| Jejak satu pengguna | **Manajemen Pengguna → Riwayat** pada baris pengguna itu |

---

## Alur 8: Karyawan Resign

| No | Langkah | Keterangan |
| --- | --- | --- |
| 1 | Nonaktifkan akunnya | Lewat **Manajemen Pengguna**. Seluruh sesinya dicabut seketika, dan semua aplikasi ikut menutup sesinya |
| 2 | Keluarkan dari grup | Lewat **Kelola Pengguna** di tiap grup yang memuatnya |
| 3 | Hapus kalau memang perlu | Penghapusan wajib disertai alasan, dan datanya tetap bisa dipulihkan dari Tempat Sampah |

> Menonaktifkan lebih dianjurkan daripada menghapus, karena jejak audit tetap terbaca dengan nama aslinya.
