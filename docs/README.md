# Dokumentasi Teknis

Arsitektur, keamanan, model akses, dan audit trail SSO Launcher.

> Kembali ke [README utama](../README.md).

## Gambaran

SSO Launcher adalah portal akses aplikasi terpusat dan peluncur SSO untuk perusahaan. Tugas utamanya:

- Mengautentikasi pengguna portal dan menjaga sesinya.
- Mengelola aplikasi terdaftar beserta akses pengguna ke aplikasi tersebut.
- Menampilkan aplikasi yang boleh dibuka setiap pengguna.
- Menerbitkan token SSO berumur pendek, yang divalidasi oleh aplikasi tujuan.
- Mengelola kredensial layanan untuk autentikasi antar-server.
- Menyediakan pengelolaan pengguna, grup, aplikasi, menu, dan akses.
- Menjaga audit trail lengkap: soft delete, histori perubahan per field, versi dengan rollback, dan tempat sampah.

> **Catatan:** SSO Launcher tidak mengatur permission di dalam aplikasi tujuan. Setiap aplikasi tetap bertanggung jawab atas role dan aturan otorisasinya sendiri.

## Arsitektur

| Bagian | Lokasi | Tanggung Jawab |
| --- | --- | --- |
| API | `apps/api/` | Autentikasi, sesi, CSRF, pengelolaan pengguna, grup, aplikasi, menu, dan akses, penerbitan dan validasi token SSO, kredensial layanan, audit, versi data, rollback, tempat sampah, dan penyimpanan data |
| Web | `apps/web/` | Halaman login, navigasi portal, Beranda, Aplikasi Saya, Favorit, Terbaru, peluncuran SSO, halaman manajemen, Riwayat Aktivitas, dialog konfirmasi, serta tampilan error dan loading |

## Lapisan Backend

```text
SsoLauncher.Api
        ↓
SsoLauncher.Application
        ↓
SsoLauncher.Domain
        ↑
SsoLauncher.Infrastructure
```

| Proyek | Isi |
| --- | --- |
| `SsoLauncher.Api` | Endpoint HTTP, binding request, rate limiting, CORS, konteks audit (IP, perangkat, browser, sesi), startup aplikasi, dan OpenAPI |
| `SsoLauncher.Application` | Use case: autentikasi, sesi, pengelolaan pengguna, aplikasi, dan akses, SSO, kredensial layanan, audit, versi data, dan tempat sampah |
| `SsoLauncher.Domain` | Entity, konstanta, dan aturan domain. Tidak bergantung pada ASP.NET Core maupun EF Core |
| `SsoLauncher.Infrastructure` | EF Core dan PostgreSQL, migrasi, hashing password, token sesi, token SSO, token layanan, CSRF, dan seeder development |

## Autentikasi dan Sesi

```text
Browser → POST /api/auth/login → validasi email dan password → sesi dibuat → cookie HTTP-only → sesi browser terautentikasi
```

- Pengguna masuk dengan **email** dan password. Email selalu disimpan dan dibandingkan dalam huruf kecil.
- Token sesi tidak pernah disimpan di `localStorage` atau penyimpanan lain yang bisa dibaca JavaScript.
- Sesi hanya menyimpan pengguna dan waktu kedaluwarsa. Hak akses dihitung ulang di setiap request dari keanggotaan grup, bukan dari peran yang tersimpan di sesi.
- Cookie sesi bersifat HTTP-only, `Secure` di produksi, dan memakai kebijakan SameSite yang sesuai.
- Setiap request yang mengubah data (tambah, edit, hapus, logout, perubahan akses, kredensial) dilindungi CSRF.
- API hanya menerima origin web yang terdaftar di konfigurasi CORS, dengan credentials aktif. Produksi tidak boleh memakai wildcard origin.

## Model Akses

SSO Launcher tidak memakai peran. Semua akses diatur lewat grup:

- **Akses menu** menentukan menu sidebar yang terlihat, dan setiap endpoint manajemen memeriksa menu yang sama di server.
- **Akses aksi** menentukan tombol yang boleh dipakai di dalam menu itu, misalnya Tambah, Hapus, atau Ekspor. Katalog aksinya ada di `MenuActions.cs`, disimpan di `mgmt_group_menu_actions`, dan diperiksa endpoint lewat `PortalAuthorization.AuthorizeActionAsync`.
- **Akses aplikasi** menentukan aplikasi yang boleh dibuka grup. Nama grup yang memberi akses ikut dikirim ke aplikasi tujuan.

| Menu | Melindungi |
| --- | --- |
| `users` | Pengguna dan keamanan akun |
| `groups` | Grup, anggota, akses aplikasi grup, dan akses menu grup |
| `applications` | Aplikasi, pengguna aplikasi, dan kredensial layanan |
| `menus` | Menu portal, urutan, dan mode perbaikan |
| `audit` | Riwayat Aktivitas, histori versi, rollback, dan tempat sampah |

Akses aplikasi selalu divalidasi di server. Mencabut akses mencegah peluncuran berikutnya, dan tampilan frontend tidak pernah dianggap sebagai batas keamanan. Hal yang sama berlaku untuk tombol: menyembunyikannya di tampilan hanya pelengkap, penolakan sesungguhnya terjadi di endpoint.

Menu sidebar boleh bertingkat tanpa batas. Menu yang punya submenu tidak membuka halaman, hanya membuka atau menutup cabangnya, dan portal menolak susunan yang membentuk lingkaran. Menu juga bisa ditandai **sedang dalam perbaikan**, sehingga menu itu beserta seluruh cabangnya menampilkan halaman 503 berisi judul dan keterangan dari administrator.

## Audit Trail

| Komponen | Cara Kerja |
| --- | --- |
| Konteks request | `AuditContextMiddleware` berjalan di setiap request yang mengubah data dan mencatat IP klien, nama perangkat (reverse DNS dengan batas waktu singkat, atau nama komputer untuk request lokal), jenis perangkat, sistem operasi, browser dan versinya, user agent, referensi sesi, request id, method, dan path. Untuk `DELETE` di `/api/admin`, middleware ini juga mewajibkan parameter `reason` |
| Soft delete | Entity yang mengimplementasikan `ISoftDeletable` tidak pernah dihapus. `SsoLauncherDbContext.SaveChanges` mengubah penghapusan menjadi pengisian `deleted_at`, `deleted_by_id`, `deleted_by_name`, dan `delete_reason`. Filter global menyembunyikan baris terhapus, dan index unik hanya berlaku untuk baris yang belum dihapus |
| Histori perubahan | Service membaca snapshot sebelum dan sesudah perubahan lewat `AuditSnapshotReader`, lalu mencatatnya dengan `AuditLogger.RecordChangeAsync` dalam satu transaksi database |
| Rollback & pemulihan | `RollbackService` menerapkan kembali snapshot ke data beserta relasinya, lalu mencatat rollback sebagai versi baru. `RestoreRecordService` memulihkan data yang terhapus |

| Tabel | Isi |
| --- | --- |
| `audit_logs` | Siapa, apa, kapan, di mana, hasil, alasan, dan perubahan per field |
| `audit_data_versions` | Snapshot lengkap setiap versi untuk setiap data |

Login, logout, login gagal, login yang ditolak pembatas, peluncuran aplikasi, keluar dari aplikasi, perubahan favorit, dan pembersihan riwayat pribadi dicatat di `audit_logs` tanpa versi.

## SSO

```text
Pengguna memilih aplikasi → POST /api/sso/launch → API memeriksa sesi dan akses
→ token berumur pendek diterbitkan → browser dialihkan ke aplikasi tujuan
→ backend aplikasi tujuan memvalidasi token → aplikasi tujuan membuat sesinya sendiri
```

Token peluncuran tidak dimaksudkan menjadi sesi jangka panjang. Aturan keamanannya:

- Token kedaluwarsa dengan cepat (60 detik) dan hanya bisa dipakai sekali.
- Token divalidasi di server aplikasi tujuan, termasuk tanda tangan, issuer, dan identitas aplikasi.
- Pengguna harus masih punya akses aktif saat peluncuran.
- Aplikasi SSO harus punya kredensial aktif ber-izin `sso.validate`. Tanpa itu peluncuran ditolak dengan `409` dan kode `sso_not_ready`.
- Aplikasi yang ditandai tanpa SSO dibuka langsung ke alamatnya, tanpa token.
- Signing key tidak boleh masuk repo, dan kunci produksi harus benar-benar acak.

### Sesi lintas aplikasi

Portal tidak bisa menghapus cookie milik aplikasi, karena domainnya berbeda. Karena itu aplikasi yang bertanya, lewat `POST /api/sso/session`, paling sering sekali tiap 5 menit per pengguna.

| Arah | Akibat |
| --- | --- |
| Portal ke aplikasi | Logout, penonaktifan akun, pencabutan akses, atau pencabutan kredensial membuat jawaban `active` bernilai `false`, dan aplikasi mengakhiri sesinya |
| Aplikasi ke portal | Dengan `keepAlive`, pemeriksaan itu menyegarkan sesi portal, sehingga pengguna yang sibuk di aplikasi lain tidak diminta login ulang |
| Keluar dari aplikasi | Hanya sesi aplikasi itu yang berakhir. Aplikasi mengalihkan ke `/signed-out/{slug}`, sesi portal tetap hidup, dan pengguna kembali ke Beranda |

Perpanjangan tidak bisa menembus batas mutlak sesi, yaitu `Session:LifetimeHours`. Panduan lengkap untuk tim aplikasi tujuan ada di [`SSO-INTEGRATION.md`](SSO-INTEGRATION.md).

## Autentikasi Layanan

```text
Aplikasi tujuan → kredensial layanan → autentikasi layanan SSO Launcher → token layanan berumur pendek → operasi antar-server
```

Kredensial layanan adalah rahasia: tidak boleh muncul di JavaScript frontend, tidak boleh masuk Git, harus bisa dicabut, dan disimpan dengan aman oleh aplikasi yang memakainya.

## Rute Frontend

| Kelompok | Rute |
| --- | --- |
| Publik | `/login` |
| Portal | `/overview`, `/my-apps`, `/favorites`, `/recent`, `/profile`, `/settings` |
| Manajemen | `/users`, `/groups`, `/applications`, `/menus`, `/audit` (hanya tampil kalau grup pengguna punya menunya) |
| Peluncur & keluar | `/launch/{slug}` sebagai pintu masuk tetap tiap aplikasi, `/signed-out/{slug}` sebagai tujuan tombol Keluar di aplikasi tanpa mengakhiri sesi portal, dan `/logout` untuk keluar dari portal sekaligus |

Saat pengguna membuka aplikasi, frontend menampilkan layar peluncuran sementara (menyiapkan peluncuran aman, mengirim token, mengalihkan). Kegagalan selalu ditampilkan sebagai pesan error, tidak pernah dialihkan diam-diam.

Membuka alamat yang menunya tidak dimiliki menghasilkan halaman **403** satu layar penuh, dan menu yang sedang dalam perbaikan menghasilkan **503**. Keduanya memakai komponen tampilan yang sama dengan 404 dan 500.

## Lingkungan Development

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project "apps/api/SsoLauncher.Api.csproj"
```

```powershell
pnpm --prefix "apps/web" dev
```

| Hal | Keterangan |
| --- | --- |
| Alamat | `http://localhost:3000` (web) dan `http://localhost:5000` (API) |
| Akun | `administrator@example.com` / `p@ssw0rd`, anggota grup Administrator. Password direset setiap API dijalankan |
| Seeder | `apps/api/src/SsoLauncher.Infrastructure/Persistence/Seed/`, hanya berjalan di mode Development |
| Health check | `GET /health` menjawab `{ "status": "healthy", "service": "sso-launcher-api" }` |
| OpenAPI | Hanya aktif di Development. Kontrak yang di-commit ada di `apps/api/OpenApi/Contracts/` dan harus diperbarui setiap kali API berubah |
| Migrasi | `apps/api/src/SsoLauncher.Infrastructure/Persistence/Migrations/`. Konvensi penamaan tabel (`mgmt_`, `audit_`, `portal_`), primary key angka, dan nama foreign key ada di `database/README.md` |
| Pengujian | Belum ada proyek test otomatis. Kalau dibuat, letakkan di `apps/api/tests/` dan gunakan database PostgreSQL khusus test |

## Pedoman Keamanan

| Jangan di-commit | Jangan dicatat di log |
| --- | --- |
| Password | Password |
| Connection string produksi | Kredensial layanan mentah |
| Signing key | Token sesi |
| Kredensial layanan | Token SSO |
| Sertifikat privat, `.env`, dan file rahasia lokal | Signing key |

Validasi yang berkaitan dengan keamanan selalu dijalankan oleh API. Pembatasan di frontend saja tidak cukup.

Konfigurasi memakai sistem konfigurasi ASP.NET Core dan environment variable (`ConnectionStrings`, `Session`, `SsoToken`, `ServiceAccessToken`, `Cors`). Di frontend, hanya nilai yang aman dibaca publik yang boleh memakai awalan `NEXT_PUBLIC_`.

## Struktur Frontend

Setiap halaman manajemen mengikuti pola yang sama, supaya perubahan cukup dilakukan di satu tempat dan tampilannya seragam.

| Lokasi | Isi |
| --- | --- |
| `app/(portal)/(management)//page.tsx` | State filter, pengambilan data, dan susunan komponen. Tidak berisi markup tabel panjang maupun logika aksi |
| `features//api.ts` | Pemanggilan API dan skema validasi respons |
| `features//use--actions.ts` | Aksi yang mengubah data (ubah status, hapus, aksi massal) beserta dialog konfirmasi dan toast-nya |
| `features//*.ts` lainnya | Logika murni tanpa tampilan, misalnya penyusunan papan menu (`menu-board.ts`) dan konversi filter riwayat (`audit-filters.ts`) |
| `components/management/-table/` | Bagian tampilan halaman: `*-stats` (kartu ringkasan), `*-toolbar` (pencarian dan filter), `*-row` (satu baris beserta menu ⋯), dan `*-table` (kepala tabel dan tampilan kosong) |

Komponen dan hook bersama yang wajib dipakai, bukan ditulis ulang:

| Nama | Kegunaan |
| --- | --- |
| `useServerTable` (`lib/portal`) | Tabel berhalaman dari server: pencarian dengan jeda, urutan, filter, dan muat ulang. Skeleton hanya tampil saat halaman pertama kali dibuka |
| `useRowSelection` (`lib/portal`) | Pilihan baris: pilih satu, pilih semua di halaman, status setengah tercentang, dan kosongkan |
| `PickCheck` | Kotak centang baris dan "pilih semua" |
| `ActiveBulkBar` | Bar aksi massal Aktifkan, Nonaktifkan, dan Hapus |
| `ResetFilterButton` | Tombol atur ulang filter, selalu disertai toast "Filter diatur ulang" |
| `SortHeader`, `SortButton` | Tombol urut kolom beserta ikon arah dan tooltip. `SortHeader` untuk tabel, `SortButton` untuk daftar berbasis `div` |
| `AppStateDot`, `CategoryBadge` | Titik status di pojok ikon aplikasi (SSO, tanpa SSO, maintenance) dan badge kategori aplikasi, dipakai di kartu Aplikasi Saya, Favorit, dan Beranda |
| `PortalMark` (`components/ui`) | Logo SSO Launcher berupa SVG. Di dalam `.brand` (sidebar, topbar ponsel, form login) logo ini beranimasi sekali saat halaman dimuat. Jangan memakai gambar PNG logo |
| `ViewToggle` (`components/ui`) | Tombol ganti tampilan grid dan daftar, dipakai di Aplikasi Saya dan Beranda |
| `EmptyState` | Keadaan kosong dengan ilustrasi beranimasi. Isi `badge={SearchX}` untuk hasil pencarian kosong (kaca pembesar); tanpa `badge` untuk data yang belum ada. Tidak menerima ikon |
| `useStoredChoice` (`lib/portal`) | Pilihan tampilan yang diingat di browser, misalnya papan atau tabel. Kuncinya sebaiknya memuat id pengguna, supaya tiap pengguna punya pilihan sendiri |
| `FormPage`, `SectionPage` | Halaman form dan halaman detail dengan header bergradien. Prop `icon` wajib diisi ikon entitasnya (pengguna, grup, aplikasi, menu) |

Kelas CSS bersama untuk pola tampilan yang berulang:

| Kelas | Kegunaan |
| --- | --- |
| `ch-ic` | Kotak ikon solid di header kartu. Kartu yang header-nya berisi `ch-ic` otomatis berlatar gradien hijau. Tambahkan kelas warna palet (misalnya `ch-ic app-as`) supaya ikon dan latar header ikut berwarna itu; `SettingsCard` menyediakan prop `tone` untuk ini. Untuk bagian yang hanya punya satu aksi utama, pakai `ch-ic ic-warn` atau `ch-ic ic-danger` supaya ikon senada dengan tombol `tone-warn` atau `tone-danger`; tanpa kelas tambahan ikon senada dengan tombol hijau utama |
| `mh-ic` | Kotak ikon solid di header modal dan halaman form. Ikonnya sama dengan ikon tombol yang membuka modal tersebut |
| `mh-info`, `mh-warn`, `mh-success`, `mh-amber` | Warna header modal sesuai fungsinya, dipasang di elemen `modal-card`: info (biru laut) untuk lihat detail dan pindah, warn (kuning kunci) untuk mode perbaikan, success (hijau centang) untuk hasil yang berhasil dibuat, amber untuk favorit. Tanpa kelas ini header memakai hijau tema, untuk form tambah dan ubah |
| `pk-note` | Catatan info di panel pilih (akses, anggota, menu, riwayat, kredensial, Tempat Sampah), dengan jarak tepi panel |
| `note-box`, `note-box warn`, `note-box ok`, `note-box danger` | Catatan info biru, peringatan kuning, status aman hijau, dan status bermasalah merah di dalam modal atau form. Pakai `warn` hanya untuk hal yang tidak bisa dibatalkan atau berdampak ke semua pengguna. Judul tebal ditulis sebagai `JudulIsi` |
| `FormErrorSummary` | Kotak merah "n isian belum benar" di atas form saat Simpan ditekan dan masih ada dua error atau lebih. `FormPage` menampilkannya lewat prop `errorCount`, yang diisi dari `errorSummary` milik hook `useFieldErrors`. Hook yang sama sudah menggulir dan memfokuskan kolom error pertama |
| `fs-head fs-head-ic` | Judul bagian form dengan kotak ikon berwarna di kiri, misalnya di halaman Keamanan pengguna. Di halaman form, cukup isi prop `icon` pada `FormSection`; ikonnya otomatis kecil (30px) dan hijau utama |

Font memakai paket resmi <code>geist</code> lewat <code>next/font</code>. Pakai variabel <code>--font-sans</code> dan <code>--font-mono</code>, bukan nama font langsung, supaya font cadangannya ikut terpasang. Geist Mono dipakai untuk Client ID, secret, dan data teknis.

Untuk membuat halaman manajemen baru:

1. Tulis pemanggilan API di `features/<fitur>/api.ts`.
2. Ambil data dengan `useServerTable` dan simpan pilihan baris dengan `useRowSelection`.
3. Pindahkan aksi yang mengubah data ke `features/<fitur>/use-<fitur>-actions.ts`.
4. Susun tampilan di `components/management/<fitur>-table/` dengan pola stats, toolbar, row, dan table.
5. Pakai komponen bersama di atas untuk kotak centang, aksi massal, dan atur ulang filter.

### Form

Form tambah dan ubah (pengguna, menu) memakai pola tersendiri, karena aturannya lebih banyak daripada halaman tabel:

| Lokasi | Isi |
| --- | --- |
| `features//-form-state.ts` | Aturan form tanpa tampilan: nilai awal, pengisian dari data tersimpan, validasi, kolom yang dikunci, dan data yang dikirim saat simpan |
| `features//use--form.ts` | State form, pemuatan data, perubahan kolom, serta konfirmasi dan proses simpan |
| `components/management//` | Bagian form (`*-section.tsx`) yang menerima hasil hook di atas |
| `components/management/.tsx` | Judul, tombol Batal dan Simpan, serta susunan bagian form |

Halaman portal yang bukan halaman manajemen, seperti Terbaru dan Pengaturan, memakai pola yang sama dengan komponen di `components/portal/<halaman>/`.

### Manajemen Menu

Manajemen Menu punya dua tampilan yang memakai data dan aksi yang sama. **Papan** (`components/management/menu-board/`, logika di `features/menus/menu-board.ts`) cocok saat menu masih sedikit. **Tabel pohon** (`components/management/menu-tree/`, logika di `features/menus/menu-tree.ts`) cocok saat menu sudah banyak: ada kolom alamat, akses grup, status, dan waktu diubah, buka-tutup per bagian, filter bagian, aksi massal (`use-menu-bulk-actions.ts`), dan geser baris untuk mengatur urutan. Keduanya memakai `MenuRowActions` untuk menu ⋯ dan `useMenuDrag` untuk geser, sehingga aturan geser sama persis. Tabel menjadi tampilan bawaan saat menu lebih dari `TABLE_VIEW_THRESHOLD` (30), dan pilihan tampilan disimpan per pengguna lewat `useStoredChoice`.

### Tes Frontend

Tes ditulis dengan Vitest dan diletakkan di samping file yang diuji (`*.test.ts`). Tes hook diberi nama `use-*.test.ts` dan dijalankan di lingkungan browser tiruan (jsdom), sedangkan tes lainnya dijalankan langsung di Node supaya cepat. Pembagian ini diatur di `apps/web/vitest.config.mts` lewat dua proyek, `logic` dan `dom`, jadi nama berkas tes hook wajib diawali `use-`. Tes dibuat untuk **logika murni** (`features/**/*.ts` selain hook dan API) dan **hook bersama** seperti `useRowSelection`. Komponen tampilan, hook aksi, dan `api.ts` tidak diberi tes tersendiri, karena tidak berisi aturan yang bisa salah hitung dan aturan sebenarnya sudah dijaga oleh tes API.

Patokannya: kalau sebuah fungsi berisi kondisi, perhitungan, atau perbandingan tanggal yang hasilnya mempengaruhi data yang ditampilkan atau dikirim, fungsi itu dipindah ke file logika murni dan diberi tes.

## Warna Standar

SSO Launcher memakai satu palet warna standar untuk semua kebutuhan identitas: ikon aplikasi, tombol, badge, chip, avatar, grafik, dan kategori. Palet ini sama dengan warna ikon aplikasi di ilustrasi login. Token didefinisikan di `apps/web/src/styles/00-palette.css`, dan daftarnya untuk JavaScript (misalnya grafik) ada di `lib/portal/palette.ts`.

| Warna | Token | Kode | Kelas warna aplikasi |
| --- | --- | --- | --- |
| Teal | `--pal-teal` | `#0F766E` | `app-hr` |
| Biru Slate | `--pal-slate` | `#3F5F8A` | `app-wh` |
| Oranye | `--pal-orange` | `#D27A1F` | `app-pr` |
| Indigo | `--pal-indigo` | `#5A55C9` | `app-pj` |
| Biru Laut | `--pal-ocean` | `#0B7FAB` | `app-as` |
| Merah | `--pal-red` | `#C43D2F` | `app-dc` |
| Emas | `--pal-gold` | `#A8861A` | `app-fn` |
| Magenta | `--pal-magenta` | `#B83F8E` | `app-hd` |
| Navy | `--pal-navy` | `#1F3A68` | `app-nv` |
| Ungu | `--pal-violet` | `#8B3FB8` | `app-vi` |
| Cokelat | `--pal-brown` | `#8A5A3B` | `app-br` |
| Abu | `--pal-gray` | `#4B5563` | `app-gy` |

Setiap warna punya empat varian, dan varian tema gelap berganti otomatis:

| Token | Dipakai untuk |
| --- | --- |
| `--pal-teal` | Latar solid: ikon aplikasi, tombol, avatar, batang grafik. Isi dengan ikon atau teks putih |
| `--pal-teal-soft` | Latar lembut: badge, chip, sorotan baris, kartu kategori |
| `--pal-teal-line` | Garis tepi badge, kartu, atau pemisah berwarna |
| `--pal-teal-ink` | Teks berwarna di atas latar terang atau soft (kontras minimal 4,5:1) |

Tekstur dan bayangan juga dijadikan token, supaya kesan halus seperti ilustrasi bisa dipakai di mana saja: `--pal-radius` (sudut 26% untuk kotak ikon), `--pal-shadow` (bayangan lembut untuk ikon besar), dan `--pal-shadow-sm` (untuk ikon kecil di daftar dan kartu).

Sudut membulat memakai empat ukuran di `08-density.css`, jangan menulis angka piksel langsung: `--r-xs` 6px (kotak centang), `--r-sm` 8px (tombol kecil, baris daftar, item menu ⋯), `--r-ctl` 12px (tombol, input, dropdown, kotak info, toast), dan `--r-card` 16px (kartu, modal, judul halaman). Badge, tombol segmen, dan avatar memakai bentuk pil atau bulat, sedangkan kotak ikon memakai `--pal-radius`.

Selain 12 warna identitas, warna lain dari ilustrasi login juga dijadikan token:

| Token | Kode | Dipakai untuk |
| --- | --- | --- |
| `--pal-brand` | `#04604F` | Hijau tua logo dan laptop di ilustrasi |
| `--pal-leaf` | `#3F8A6E` | Hijau daun dan alas laptop |
| `--pal-sage` | `#A3CB9E` | Hijau sage logo dan aksen lembut |
| `--pal-mint` (+ soft, line, ink) | `#2F9E6B` | Hijau tanda centang: status berhasil dan aktif |
| `--pal-amber` (+ soft, line, ink) | `#D9A21F` | Kuning kunci: status maintenance dan peringatan |
| `--pal-canvas` | gradien | Latar hijau lembut seperti panel ilustrasi |

Warna status juga diambil dari palet lewat token nada, sehingga badge, tombol, menu aksi, modal konfirmasi, dan kartu ringkasan memakai sumber yang sama:

| Token nada | Sumber | Arti |
| --- | --- | --- |
| `--tone-success` | `--pal-mint` | Aktif, berhasil, pulihkan |
| `--tone-warn` | `--pal-amber` | Maintenance, peringatan |
| `--tone-danger` | `--pal-red` | Nonaktif, hapus, gagal |
| `--tone-info` | `--pal-ocean` | Informasi, buka aplikasi |

Setiap token nada punya varian `-soft`, `-line`, `-ink`, dan `-strong`. Varian `-strong` dipakai untuk latar tombol berteks putih dan tidak berubah di tema gelap. Badge `status` juga tersedia untuk semua warna palet, misalnya `status slate` atau `status teal`, untuk badge identitas seperti jumlah pengguna.

Warna netral dan permukaan juga memakai variabel tema di `01-base.css` (terang) dan `15-theme-dark.css` (gelap), sehingga komponen tidak perlu aturan tema gelap terpisah:

| Variabel | Dipakai untuk |
| --- | --- |
| `--ink`, `--ink-2`, `--ink-3` | Teks utama, teks kuat sekunder (label, tombol halaman), teks sekunder (kode, jalur) |
| `--body`, `--muted`, `--faint` | Teks isi, teks redup, catatan sangat samar |
| `--line`, `--line-strong`, `--line-hover` | Garis biasa, garis tegas (kotak centang, tombol ghost, panduan), garis saat dihover |
| `--surface-sunken` | Latar header tabel, kolom cari, footer form |
| `--surface-stripe`, `--surface-hover` | Baris tabel berselang-seling dan saat dihover |
| `--surface-muted`, `--surface-panel` | Latar tag dan skeleton, panel kolom di dalam kartu |
| `--shadow-ink` | Warna dasar bayangan, dipakai lewat `color-mix` |

Untuk warna transparan, pakai `color-mix(in srgb, var(--token) 12%, transparent)`, bukan `rgba(...)` dengan angka warna langsung.

Aturan pemakaian:

- **Palet untuk identitas, bukan status.** Aktif, Maintenance, Nonaktif, dan Gagal tetap memakai warna status (`status on`, `warn`, `danger`) supaya warna identitas tidak dikira status.
- **Warna tema** (hijau `#04604F` dan sage `#A3CB9E`) tetap menjadi warna utama portal dan tidak termasuk palet ini.
- **Oranye dan Emas** di atas latar solid cukup untuk ikon. Untuk teks putih kecil di atasnya, pakai warna lain atau teks tebal berukuran besar.
- **Jangan menulis kode warna langsung.** Pakai token CSS atau `PALETTE` di TypeScript, supaya perubahan palet cukup dilakukan di satu tempat.
- Kelas warna lama (`app-crm`, `app-fr`, `app-ol`, `app-cy`, `app-rs`, `app-mr`) masih dikenali dan diarahkan ke warna standar terdekat, tetapi tidak lagi ditawarkan di form aplikasi.

## Aturan Dokumentasi

1. Perbarui dokumentasi setiap kali perilaku yang didokumentasikan berubah.
2. Jangan mendokumentasikan fitur yang belum ada.
3. Hapus alur autentikasi atau SSO yang sudah tidak berlaku.
4. Samakan dokumentasi rute dengan frontend, deskripsi API dengan backend, dan dokumentasi database dengan migrasi.
5. Pisahkan panduan produksi dari perilaku yang hanya berlaku di development.
