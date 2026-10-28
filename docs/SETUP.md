# Panduan Instalasi

Langkah menjalankan SSO Launcher di komputer pengembang maupun di server.

> Kembali ke [README utama](../README.md).

## Prasyarat

| Perangkat | Versi |
| --- | --- |
| .NET SDK | 10.0.100 atau lebih baru (lihat `global.json`) |
| Node.js | 24.19 sampai sebelum 25 |
| pnpm | 10.17.1 |
| PostgreSQL | 16 atau lebih baru |
| dotnet-ef | Versi yang sama dengan EF Core di proyek |

```powershell
corepack enable
corepack prepare pnpm@10.17.1 --activate
dotnet tool install --global dotnet-ef
```

## Ambil Kode dan Dependensi

```powershell
git clone <alamat-repo> sso-launcher
cd sso-launcher
pnpm install
dotnet restore "apps/api/SsoLauncher.Api.csproj"
```

## Siapkan Database

Buat database kosong di PostgreSQL:

```sql
CREATE DATABASE sso_launcher;
```

> **Catatan:** Tabel dibuat oleh migrasi, jangan dibuat manual. Nama tabel dan konvensi penamaannya dijelaskan di [`database/README.md`](../database/README.md).

## Konfigurasi

### API

API membaca konfigurasi dengan urutan `appsettings.json`, lalu `appsettings.{Environment}.json`, lalu environment variable. Nilai yang dibaca belakangan menimpa yang sebelumnya.

Di lokal, semua koneksi dan signing key diisi di `appsettings.Development.json`, yang berperan seperti file `.env` untuk API dan tidak ikut ter-commit. Di server produksi, nilai yang sama diisi lewat environment variable, misalnya `ConnectionStrings__PostgreSql`. User-secrets tidak lagi dipakai.

| Kunci | Keterangan |
| --- | --- |
| `ConnectionStrings__PostgreSql` | Koneksi PostgreSQL |
| `Session__LifetimeHours` | Lama sesi login, dalam jam |
| `SsoToken__SigningKey` | Kunci penanda tangan token SSO, minimal 32 karakter acak |
| `SsoToken__LifetimeSeconds` | Umur token SSO, bawaan 60 detik |
| `ServiceAccessToken__SigningKey` | Kunci token antar-layanan, minimal 32 karakter acak |
| `ServiceAccessToken__LifetimeSeconds` | Umur token antar-layanan, bawaan 300 detik |
| `Cors__AllowedOrigins__0` | Alamat web yang boleh memanggil API |

Cara paling mudah untuk komputer lokal adalah menyalin file contoh, lalu mengisi password database dan kedua signing key:

```powershell
Copy-Item "apps/api/appsettings.Development.example.json" "apps/api/appsettings.Development.json"
```

Contoh connection string:

```text
Host=127.0.0.1;Port=5432;Database=sso_launcher;Username=postgres;Password=<password>
```

Membuat kunci acak:

```powershell
$bytes = New-Object byte[] 48
[System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

Jalankan dua kali, satu hasil untuk `SsoToken:SigningKey` dan satu untuk `ServiceAccessToken:SigningKey`. Perintah ini memakai pembangkit acak kriptografis dan berjalan di Windows PowerShell 5.1 maupun PowerShell 7.

> **Catatan:** `appsettings.Development.json` tidak ikut ter-commit. Di Windows, gunakan `127.0.0.1` alih-alih `localhost`, karena koneksi lewat `localhost` bisa sesekali _timeout_.

### Menjalankan Setiap Hari

Setelah konfigurasi terisi, setiap kali bekerja cukup buka dua terminal:

```powershell
# Terminal 1: API
cd apps/api
dotnet run

# Terminal 2: web
cd apps/web
pnpm dev
```

### Web

```powershell
Copy-Item "apps/web/.env.example" "apps/web/.env.local"
```

| Variabel | Keterangan |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Alamat API, misalnya `http://localhost:5000` |

## Migrasi Database

```powershell
dotnet ef database update `
    --project "apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj" `
    --startup-project "apps/api/SsoLauncher.Api.csproj" `
    --context SsoLauncherDbContext
```

Dalam mode Development, API juga menjalankan migrasi otomatis setiap kali dinyalakan. Untuk memastikan migrasi sudah lengkap:

```sql
SELECT "MigrationId" FROM __ef_migrations_history ORDER BY "MigrationId";
```

## Menjalankan

Buka dua terminal di root proyek:

```powershell
$env:ASPNETCORE_ENVIRONMENT = "Development"
dotnet run --project "apps/api/SsoLauncher.Api.csproj"
```

```powershell
pnpm --prefix "apps/web" dev
```

| Layanan | Alamat |
| --- | --- |
| API | `http://localhost:5000` |
| Web | `http://localhost:3000` |

## Login Pertama

Dalam mode Development, seeder membuat menu bawaan, satu grup **Administrator** yang memegang seluruh menu, aksi, dan aplikasi, serta satu akun berikut di dalam grup itu. Seeder tidak membuat aplikasi; daftarkan aplikasi lewat **Manajemen Aplikasi**, dan grup Administrator otomatis mendapat akses ke semua aplikasi setiap kali API dijalankan:

| Email | Password |
| --- | --- |
| `administrator@example.com` | `p@ssw0rd` |

> **Catatan:** Seeder hanya berjalan di mode Development. Password di atas hanya dipakai saat akun pertama kali dibuat; setelah itu email dan password akun ini tidak diubah seeder, jadi password yang Anda ganti lewat Profil tetap berlaku. Di server produksi akun awal dibuat manual, dan password di atas jangan dipakai.

Seeder hanya menulis ke database kalau ada yang berubah, dan tidak menimpa susunan menu yang sudah diatur lewat Manajemen Menu.

### Uji Beban

Untuk menguji tabel dengan data besar, jalankan seeder uji beban secara manual di mode Development:

```powershell
dotnet run --project "apps/api/SsoLauncher.Api.csproj" -- --seed-load-test
```

Seeder ini menambahkan **20.000 pengguna** (nama berawalan "Uji", NIK berawalan `99`), **500 grup** ("Grup Uji 001" dan seterusnya), dan **100.000 riwayat aktivitas** (ringkasan berawalan `[uji]`), lalu berhenti tanpa menyalakan API. Menjalankannya lagi hanya melengkapi yang kurang. Password semua pengguna uji adalah `p@ssw0rd123!`.

Setelah selesai menguji, hapus semua data uji tanpa menyentuh data lain:

```powershell
dotnet run --project "apps/api/SsoLauncher.Api.csproj" -- --clear-load-test
```

### Aplikasi Demo

Untuk mengisi Manajemen Aplikasi, Beranda, dan Aplikasi Saya dengan contoh data, jalankan seeder aplikasi demo di mode Development:

```powershell
dotnet run --project "apps/api/SsoLauncher.Api.csproj" -- --seed-demo-applications
```

Seeder ini membuat **35 aplikasi acak** dari daftar nama aplikasi contoh, dengan jenis dari daftar departemen bawaan, warna dan ikon acak, sekitar 80% aktif, 10% maintenance (beserta pesannya), 10% nonaktif, dan sekitar 75% memakai SSO. Tanggal dibuat diacak dalam setahun terakhir. Slug semua aplikasi demo berawalan `demo-`, dan grup Administrator langsung mendapat aksesnya. Aplikasi SSO demo belum punya kredensial, jadi tampil **Belum terhubung** dan tidak bisa dibuka. Kalau aplikasi demo sudah ada, seeder tidak menambah lagi.

Hapus semua aplikasi demo beserta akses grup, favorit, kredensial, dan aktivitasnya:

```powershell
dotnet run --project "apps/api/SsoLauncher.Api.csproj" -- --clear-demo-applications
```

> **Catatan:** Log perintah SQL EF Core disembunyikan di `appsettings.Development.json` supaya progres seeder dan error tetap terbaca. Ubah level `Microsoft.EntityFrameworkCore.Database.Command` ke `Information` kalau perlu melihat query-nya.

## Cara Kerja Hak Akses

SSO Launcher tidak memakai peran seperti admin atau user. Semua hak akses datang dari **grup**.

| Yang diatur | Tempatnya |
| --- | --- |
| Menu yang terlihat di sidebar | Manajemen Grup & Akses → tab Akses Menu |
| Halaman pengelolaan yang boleh dibuka | Sama dengan menu yang dimiliki |
| Tombol aksi yang boleh dipakai | Centang aksi di dalam tiap menu, pada tab Akses Menu |
| Aplikasi yang bisa dibuka lewat SSO | Tab Akses Aplikasi di grup |

Aturannya:

- Pengguna hanya melihat menu yang diberikan ke grup aktif tempat ia menjadi anggota.
- Pengguna tanpa grup tidak melihat menu apa pun.
- Endpoint pengelolaan diperiksa di server: pengguna butuh menu `users`, grup butuh `groups`, aplikasi butuh `applications`, menu portal butuh `menus`, dan Riwayat Aktivitas butuh `audit`.
- Akses aplikasi sepenuhnya lewat grup. Akses langsung per pengguna sudah ditiadakan.
- Menonaktifkan pengguna langsung mencabut seluruh sesinya.
- Membuka alamat halaman yang menunya tidak dimiliki menghasilkan halaman **403**, bukan pengalihan diam-diam.

### Akses per tombol

Selain menu, tiap grup mencentang **aksi** yang boleh dipakai di menu itu. Daftar aksinya ditentukan di kode, pada `apps/api/src/SsoLauncher.Domain/Constants/MenuActions.cs`, lalu muncul otomatis di layar Akses Menu.

| Menu | Aksi yang bisa diberikan |
| --- | --- |
| Manajemen Pengguna | Tambah, Ubah, Hapus, Atur Ulang Password, Cabut Sesi |
| Manajemen Grup & Akses | Tambah, Ubah, Hapus, Duplikat, Kelola Pengguna, Kelola Akses |
| Manajemen Aplikasi | Tambah, Ubah, Hapus, Kredensial SSO |
| Manajemen Menu | Tambah, Ubah, Hapus, Urutkan, Mode Perbaikan |
| Riwayat Aktivitas | Ekspor Riwayat, Pulihkan Data, Kembalikan Versi |

Pemeriksaannya di dua tempat: tombol disembunyikan di tampilan, **dan** endpoint-nya menolak dengan 403 kalau dipanggil langsung. Mengubah status aktif termasuk izin **Ubah**, karena keduanya memakai endpoint yang sama.

> **Untuk pengembang:** setiap kali menambah tombol aksi baru, tiga langkah wajib dilakukan sekaligus. Daftarkan aksinya di `MenuActions.cs`, jaga endpoint-nya dengan `AuthorizeActionAsync`, lalu sembunyikan tombolnya dengan `can("...")` di halamannya.

### Menu bertingkat

Menu sidebar boleh bertingkat tanpa batas: menu utama, submenu, sub-submenu, dan seterusnya. Menu yang punya submenu **tidak membuka halaman** saat diklik, hanya membuka atau menutup daftar di bawahnya. Portal menolak susunan yang membentuk lingkaran, misalnya memindahkan menu ke dalam submenunya sendiri.

### Mode perbaikan

Setiap menu bisa ditandai **sedang dalam perbaikan** lewat tombol kunci inggris di Manajemen Menu. Saat aktif, semua pengguna yang membuka menu itu beserta submenunya melihat halaman 503 dengan judul dan keterangan yang diisi administrator. Berlaku juga untuk administrator sendiri, jadi matikan dulu kalau halamannya perlu dibuka.

## Menguji SSO dari Lokal

Portal punya aplikasi demo untuk membuktikan alur SSO tanpa perlu aplikasi sungguhan. Filenya di luar repo, misalnya `C:\my-project\sso-demo\server.mjs`, dan berjalan di `localhost:5100`.

Daftarkan dulu aplikasi uji lewat portal:

1. Di **Manajemen Aplikasi**, tambah aplikasi dengan slug `erp` dan URL callback `http://localhost:5100/sso/callback`.
2. Di tab **Kredensial SSO** aplikasi itu, buat kredensial lalu salin Client ID dan Client Secret yang muncul sekali.
3. Beri akses aplikasi itu ke grup **Administrator** di **Grup & Akses**.

```powershell
Set-Location "C:\my-project\sso-demo"

$env:CLIENT_ID = "<Client ID dari portal>"
$env:CLIENT_SECRET = "<Client Secret dari portal>"
$env:APP_SLUG = "erp"
$env:SESSION_CHECK_SECONDS = "10"

node server.mjs
```

Yang dibuktikan:

1. Klik **Buka** di portal langsung masuk ke aplikasi tanpa login ulang.
2. Membuka `localhost:5100` tanpa lewat portal ditolak.
3. Token yang tidak sah ditolak dengan 401.
4. Logout di portal membuat aplikasi ikut keluar pada pemeriksaan berikutnya.
5. Klik **Keluar** di aplikasi kembali ke Beranda portal tanpa login ulang, dan sesi portal tetap aktif.
6. Bekerja di aplikasi memperpanjang sesi portal lewat `POST /api/sso/session`.

> **Catatan:** Tombol Keluar di aplikasi demo harus mengalihkan ke `http://localhost:3000/signed-out/{APP_SLUG}`, bukan `/logout`. Sesuaikan `server.mjs` kalau masih memakai alamat lama.

## Membersihkan Data Pengembangan

Untuk mengulang uji coba dari awal tanpa membuat ulang database, jalankan:

```powershell
cd C:\my-project\sso-launcher
.\database\dev\reset-dev-data.ps1
```

Skrip menyimpan pengguna `administrator@example.com`, grup **Administrator**, dan menu portal, lalu menghapus semua data lain: pengguna dan grup lain, aplikasi beserta kredensialnya, Riwayat Aktivitas, notifikasi, favorit, dan sesi pengguna lain. Skrip meminta nama database diketik ulang sebagai konfirmasi, menolak database yang namanya mengandung `prod`, dan berjalan dalam satu transaksi (gagal berarti tidak ada yang berubah). Pengguna dan grup yang disimpan bisa diganti lewat `-KeepUser` dan `-KeepGroup`.

Setelah selesai, jalankan ulang API supaya hak akses grup Administrator disusun ulang.

> **Jangan** jalankan di server produksi. Data yang dihapus tidak masuk Tempat Sampah dan tidak bisa dipulihkan.

## Pemeriksaan Kode

```powershell
dotnet build "apps/api/SsoLauncher.Api.csproj"
pnpm --prefix "apps/web" lint
pnpm --prefix "apps/web" typecheck
pnpm --prefix "apps/web" test
```

Tes frontend memakai Vitest dan tidak butuh database. Berkas tesnya bernama `*.test.ts` atau `*.test.tsx` dan diletakkan di samping file yang diuji. Tes hook diberi nama `use-*.test.ts` supaya dijalankan di jsdom; tes lain berjalan di Node.

Tes integrasi API memakai database `sso_launcher_test` yang dibuat ulang setiap kali tes dijalankan:

```powershell
$env:SSO_LAUNCHER_TEST_DB_CONNECTION = "Host=127.0.0.1;Port=5432;Database=sso_launcher_test;Username=postgres"
$env:PGPASSWORD = Read-Host "Password postgres"
dotnet test --project "apps/api/tests/SsoLauncher.Api.Tests/SsoLauncher.Api.Tests.csproj" --configuration Release
```

Tes memakai `--configuration Release` supaya tetap bisa dijalankan saat API sedang hidup lewat `dotnet run`, sama seperti di CI. Aturan database tes ada di [`database/README.md`](../database/README.md#database-test).

## Masalah Umum

| Gejala | Penyelesaian |
| --- | --- |
| `address already in use` pada port 5000 | Proses API lama masih jalan. `Get-NetTCPConnection -LocalPort 5000 -State Listen \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` |
| `Another next dev server is already running` | Hentikan dengan `taskkill /PID /F` sesuai PID yang tertera |
| Halaman lama masih muncul, atau typecheck merujuk file yang sudah dihapus | Hapus cache: `Remove-Item -Recurse -Force apps\web\.next` |
| VS Code melaporkan file `.next/dev/types/*` tidak ditemukan | Jalankan dev server sekali, lalu Ctrl+Shift+P → TypeScript: Restart TS Server |
| Sidebar kosong setelah login | Pengguna belum tergabung di grup aktif yang punya akses menu |
| `The operation has timed out` saat terhubung ke PostgreSQL | Pakai `Host=127.0.0.1` di connection string, bukan `localhost` |
| `The name '...' is used by an existing migration` | Migrasi dengan nama itu sudah ada, cukup jalankan `database update` |
| Tes gagal dengan `28P01: password authentication failed` | Password PostgreSQL di `PGPASSWORD` salah atau belum diisi |
| Tes gagal dengan `PendingModelChangesWarning` | Model berubah tetapi migrasinya belum dibuat. Jalankan `dotnet ef migrations add` |
| `Could not copy ... The file is locked by: "SsoLauncher.Api"` | API masih berjalan dari `dotnet run` dan mengunci DLL di `bin/Debug`. Hentikan dengan Ctrl+C sebelum build. Tes boleh tetap dijalankan saat API hidup asalkan memakai `--configuration Release`, karena hasil build-nya ditaruh di `bin/Release` |
| Top bar menampilkan nama departemen lengkap, bukan kodenya | Kolom `departemen_code` pengguna itu masih kosong. Ubah pengguna dan pilih ulang departemennya, lalu muat ulang halaman |

## Catatan Produksi

- Jalankan dengan `ASPNETCORE_ENVIRONMENT=Production`, supaya seeder dan OpenAPI tidak aktif.
- Pasang HTTPS di depan API dan web. Cookie sesi otomatis ditandai `Secure` di luar mode Development.
- Isi `Cors__AllowedOrigins__0` dengan domain portal yang sebenarnya.
- Isi `AllowedHosts` dengan nama host API yang sebenarnya, misalnya `AllowedHosts=sso-api.example.com`. Nilai bawaannya hanya menerima `localhost`, sehingga API di server produksi akan menolak semua request dengan status 400 sampai pengaturan ini diisi.
- Simpan connection string dan kedua signing key sebagai environment variable atau secret manager, bukan di file yang ikut ke repo.
- Jalankan migrasi secara terpisah sebelum menyalakan versi baru API.
- Kalau API berada di belakang reverse proxy (IIS, Nginx, load balancer), daftarkan alamat proxy tersebut supaya IP yang tercatat di audit, dipakai pembatas login, dan dipakai kunci login adalah IP komputer pengguna yang sebenarnya:

```json
"ForwardedHeaders": {
  "KnownProxies": ["10.10.1.5"],
  "KnownNetworks": ["10.10.1.0/24"]
}
```

Isi `KnownProxies` dengan IP proxy satu per satu, atau `KnownNetworks` dengan jaringan proxy dalam format CIDR. Proxy yang berjalan di server yang sama dengan API (`127.0.0.1`) sudah dipercaya otomatis. Jangan pernah mengisi jaringan yang juga dipakai komputer pengguna, karena pengguna di jaringan itu bisa memalsukan IP-nya lewat header `X-Forwarded-For`.
