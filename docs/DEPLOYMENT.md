# Panduan Deployment

Menjalankan SSO Launcher di server sandbox atau produksi.

> Kembali ke [README utama](../README.md) · Untuk komputer development, lihat [SETUP.md](SETUP.md).

## Arsitektur di Server

```text
                    ┌──────────────────────────────┐
Pengguna ──HTTPS──▶ │ sso.example.com       (web)│ Next.js, port 3000
                    └──────────────┬───────────────┘
                                   │ browser memanggil API
                    ┌──────────────▼───────────────┐
Aplikasi ──HTTPS──▶ │ sso-api.example.com   (API)│ .NET, port 5000
                    └──────────────┬───────────────┘
                                   │
                    ┌──────────────▼───────────────┐
                    │ PostgreSQL 16+               │
                    └──────────────────────────────┘
```

Dua hal yang wajib:

- **Web dan API memakai HTTPS.** Cookie sesi portal memakai tanda `Secure` di luar mode development, jadi login tidak akan berhasil lewat HTTP.
- **API bisa dijangkau dua pihak**: browser pengguna, dan server aplikasi lain seperti ERP.

## Prasyarat

| Komponen | Keterangan |
| --- | --- |
| .NET 10 Runtime | ASP.NET Core Runtime, bukan SDK, kecuali build dilakukan di server |
| Node.js 24 LTS | Untuk menjalankan web Next.js |
| pnpm 10 | `corepack enable` lalu `corepack prepare pnpm@10.17.1 --activate` |
| PostgreSQL 16+ | Database kosong, misalnya `sso_launcher`, dengan pengguna khusus portal |
| Reverse proxy | IIS, Nginx, atau lainnya, dengan sertifikat HTTPS |

## Build

Build dilakukan di komputer developer atau di CI, lalu hasilnya disalin ke server.

```powershell
Set-Location "C:\my-project\sso-launcher"

dotnet publish "apps/api/SsoLauncher.Api.csproj" --configuration Release --output "publish/api"

$env:NEXT_PUBLIC_API_URL = "https://sso-api.example.com"
pnpm install --frozen-lockfile
pnpm --prefix "apps/web" build
```

> **Penting:** `NEXT_PUBLIC_API_URL` dibaca **saat build**, bukan saat dijalankan. Kalau alamat API berubah, web harus di-build ulang.

Yang disalin ke server:

| Sumber | Tujuan |
| --- | --- |
| `publish/api/` | Folder API di server |
| `apps/web/.next/`, `apps/web/public/`, `apps/web/package.json`, `apps/web/next.config.ts`, `pnpm-lock.yaml`, `pnpm-workspace.yaml` | Folder web di server, lalu jalankan `pnpm install --prod --frozen-lockfile` di sana |

## Konfigurasi API

Semua pengaturan diisi lewat **environment variable**, bukan dengan mengubah `appsettings.json`. Pemisah bagian memakai dua garis bawah.

Di luar mode Development, API **memeriksa pengaturan saat dinyalakan** dan menolak berjalan kalau kunci penandatangan kosong, kurang dari 32 karakter, atau sama satu sama lain; kalau `AllowedHosts` kosong, `*`, atau masih localhost; atau kalau `Cors__AllowedOrigins` bukan alamat `https` atau masih localhost. Pesan error di log menyebutkan pengaturan mana yang perlu diperbaiki. API juga menulis **peringatan** di log kalau `ForwardedHeaders__KnownProxies` kosong atau pengaturan `Bootstrap` masih berisi password.

| Variabel | Keterangan |
| --- | --- |
| `ASPNETCORE_ENVIRONMENT` | **Wajib** `Production`. Mode Development menjalankan seeder dan membuka dokumentasi API |
| `ConnectionStrings__PostgreSql` | Koneksi database |
| `AllowedHosts` | Nama host API, misalnya `sso-api.example.com`. Bawaannya hanya menerima localhost, jadi wajib diisi |
| `Cors__AllowedOrigins__0` | Alamat web portal, misalnya `https://sso.example.com` |
| `SsoToken__SigningKey` | Kunci acak baru, minimal 32 karakter |
| `ServiceAccessToken__SigningKey` | Kunci acak baru, berbeda dari kunci SSO |
| `ForwardedHeaders__KnownProxies__0` | IP reverse proxy, supaya IP pengguna tercatat benar. Bisa juga `ForwardedHeaders__KnownNetworks__0` dalam format CIDR |
| `Session__LifetimeHours`, `Session__IdleMinutes` | Opsional. Bawaan 8 jam dan 15 menit. `LifetimeHours` adalah batas mutlak yang tidak bisa ditembus perpanjangan dari aplikasi lain |
| `DataRetention__Enabled` dan turunannya | Opsional. Pembersihan otomatis harian. Bawaan: audit 36 bulan, versi data 36 bulan, aktivitas portal 6 bulan, notifikasi 3 bulan, penanda token SSO 1 hari setelah kedaluwarsa, 5.000 baris per batch |
| `LoginLockout__MaxFailuresPerAddress` dan turunannya | Opsional. Bawaan 5 per IP, 20 per akun, jendela 15 menit |
| `RequestLimits__MaxBodyBytes`, `RequestLimits__TimeoutSeconds`, `RequestLimits__ExportTimeoutSeconds` | Opsional. Ukuran isi permintaan maksimal (bawaan 1 MB, karena portal tidak menerima unggahan file), batas waktu permintaan biasa (bawaan 30 detik), dan batas waktu ekspor Excel (bawaan 120 detik). Permintaan yang melewati batas waktu dihentikan dengan status 504. Batas waktu ini tidak aktif saat API dijalankan dengan debugger |
| `RateLimiting__PerAddressPerMinute`, `RateLimiting__PerSessionPerMinute`, `RateLimiting__ExportPerMinute` | Opsional. Batas permintaan API per menit: bawaan 600 per alamat IP, 300 per sesi login, dan 10 ekspor Excel per sesi. Naikkan batas per IP kalau banyak pengguna keluar lewat satu alamat yang sama (NAT) dan `KnownProxies` tidak bisa diisi. Pemeriksaan `/health` tidak dibatasi |
| `Bootstrap__Email`, `Bootstrap__Password`, `Bootstrap__Name` | Akun administrator pertama. Lihat bagian berikutnya |

Membuat kunci acak:

```powershell
[Convert]::ToBase64String((1..48 | ForEach-Object { Get-Random -Maximum 256 }))
```

```bash
openssl rand -base64 48
```

Konfigurasi web hanya satu, dan sudah tertanam saat build: `NEXT_PUBLIC_API_URL`.

## Migrasi Database

Migrasi **tidak berjalan otomatis** di mode Production. Jalankan manual setiap kali ada versi baru.

Cara paling aman adalah membuat bundle di komputer developer, lalu menjalankannya di server tanpa perlu SDK:

```powershell
dotnet ef migrations bundle --project "apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj" --startup-project "apps/api/SsoLauncher.Api.csproj" --context "SsoLauncherDbContext" --configuration Release --output "publish/migrate.exe"
```

Di server:

```powershell
.\migrate.exe --connection "Host=...;Port=5432;Database=sso_launcher;Username=...;Password=..."
```

Selalu **backup database** sebelum menjalankan migrasi.

> **Catatan:** `audit_logs` adalah tabel berpartisi per bulan. Partisi bulan berjalan sampai 3 bulan ke depan dibuat otomatis oleh API saat start dan setiap 24 jam, jadi tidak perlu dibuat manual. Pastikan user database yang dipakai API boleh membuat tabel di schema `public`, karena partisi baru dibuat dengan `CREATE TABLE`.

## Akun Administrator Pertama

Saat API dijalankan dalam mode Production, portal memastikan sembilan menu bawaan ada. Kalau database **belum punya pengguna sama sekali**, portal juga membuat akun administrator pertama dari pengaturan `Bootstrap`, lalu memasukkannya ke grup Administrator dengan seluruh menu beserta **semua aksi tombol**.

```text
Bootstrap__Email=admin@example.com
Bootstrap__Password=PasswordSementaraYangPanjang123
Bootstrap__Name=Administrator Sistem
Bootstrap__Department=Information Technology
Bootstrap__JobTitle=Programmer
```

Setelah login pertama:

1. **Ganti password** lewat Profil Saya.
2. **Hapus pengaturan `Bootstrap`** dari server.

Pengaturan ini aman kalau tertinggal, karena portal hanya membuat akun saat database benar-benar kosong. Tapi lebih rapi kalau dihapus.

## Windows Server + IIS

1. Pasang **ASP.NET Core Hosting Bundle** untuk .NET 10, lalu restart IIS.
2. Buat situs untuk API, arahkan ke folder `publish/api`, dengan application pool **No Managed Code**.
3. Isi environment variable di `web.config` atau di pengaturan application pool.
4. Untuk web Next.js, jalankan sebagai layanan Windows dengan **NSSM** atau **PM2**:

```powershell
pm2 start "pnpm" --name sso-launcher-web -- --prefix "C:\sso-launcher\web" start
pm2 save
```

5. Buat situs IIS untuk domain web, lalu pasang **URL Rewrite** dan **Application Request Routing** yang meneruskan ke `http://localhost:3000`.
6. Pasang sertifikat HTTPS di kedua situs, lalu isi `ForwardedHeaders__KnownProxies__0` dengan IP server IIS.

## Linux + Nginx

1. Salin `publish/api` ke `/var/www/sso-launcher/api`, lalu buat layanan systemd:

```ini
[Unit]
Description=SSO Launcher API
After=network.target

[Service]
WorkingDirectory=/var/www/sso-launcher/api
ExecStart=/usr/bin/dotnet /var/www/sso-launcher/api/SsoLauncher.Api.dll
Restart=always
User=www-data
Environment=ASPNETCORE_ENVIRONMENT=Production
Environment=ASPNETCORE_URLS=http://127.0.0.1:5000
EnvironmentFile=/etc/sso-launcher/api.env

[Install]
WantedBy=multi-user.target
```

Isi `/etc/sso-launcher/api.env` dengan variabel dari tabel konfigurasi, satu per baris, lalu batasi izinnya dengan `chmod 600`.

2. Layanan web Next.js dibuat dengan cara yang sama, dengan `ExecStart=/usr/bin/pnpm start` dan `Environment=PORT=3000`.

3. Konfigurasi Nginx:

```nginx
server {
    server_name sso.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    server_name sso-api.example.com;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

4. Pasang HTTPS dengan `certbot --nginx`, lalu isi `ForwardedHeaders__KnownProxies__0=127.0.0.1`.

## Docker

Jalankan API dan web sebagai dua container, dengan reverse proxy di depannya. Variabel lingkungan diisi lewat `environment` atau file `.env` milik Compose, dan kunci rahasia sebaiknya memakai Docker secret.

Catatan penting untuk Docker:

- `NEXT_PUBLIC_API_URL` diisi saat **build image web**, bukan saat container dijalankan.
- Alamat proxy di `ForwardedHeaders__KnownProxies__0` adalah IP container proxy di jaringan Docker, bukan `127.0.0.1`.
- Migrasi dijalankan sebagai container sekali jalan sebelum API dinyalakan.

## Setelah Deploy

| Pemeriksaan | Hasil yang diharapkan |
| --- | --- |
| `GET https://sso-api.example.com/health` | Status 200 |
| `https://sso-api.example.com/scalar` | Tidak bisa dibuka, karena hanya aktif di mode Development |
| Header respons API | Ada `Strict-Transport-Security`, `X-Frame-Options`, dan `Content-Security-Policy`, tanpa header `Server` |
| Login di web portal | Berhasil dengan akun bootstrap, lalu password diganti |
| Riwayat Aktivitas | Kolom IP berisi IP pengguna yang sebenarnya, bukan IP proxy |
| Tambah aplikasi dan kredensial SSO | Kredensial baru dibuat khusus untuk lingkungan ini, tidak memakai kredensial development |
| Ekspor Excel di Riwayat Aktivitas | File `.xlsx` terunduh dan terbuka normal. Kolom Waktu memakai WIB dan bisa diurutkan |
| Akses per tombol | Grup tanpa aksi Hapus tidak melihat tombolnya, dan pemanggilan langsung ke endpoint-nya ditolak dengan 403 |
| Logout serentak | Setelah logout di portal, aplikasi yang terhubung ikut keluar pada pemeriksaan berikutnya, paling lambat 5 menit |

## Menghubungkan Aplikasi Lain

Setiap aplikasi yang dibuka lewat portal wajib mengikuti [`SSO-INTEGRATION.md`](SSO-INTEGRATION.md). Yang disiapkan pengelola portal untuk tiap aplikasi:

| Langkah | Keterangan |
| --- | --- |
| Daftarkan aplikasi | Manajemen Aplikasi → Tambah Aplikasi, dengan URL callback `https://{aplikasi}/sso/callback` |
| Buat kredensial SSO | Tab Kredensial SSO. Client Secret hanya tampil sekali, dan diserahkan lewat jalur aman |
| Beri akses lewat grup | Manajemen Grup & Akses → Akses Aplikasi. Tanpa ini pengguna tidak bisa membukanya |
| Minta bukti uji | Tim aplikasi mengisi Kriteria Berhasil di dokumen integrasi, kesepuluh poinnya, sebelum aplikasi diaktifkan untuk pengguna |

Kredensial lingkungan uji dan produksi dibuat terpisah, dan kredensial yang sudah tidak dipakai segera dicabut.

Perawatan rutin:

- **Backup database** terjadwal, karena seluruh data portal ada di sana.
- **Pantau ukuran tabel audit** (`audit_logs` dan `audit_data_versions`). Pembersihan otomatis sudah berjalan lewat pengaturan `DataRetention`, dan partisi `audit_logs` yang lewat batas dihapus per bulan, tapi ukurannya tetap perlu diawasi. Partisi `audit_logs_default` seharusnya selalu kosong.
- **Periksa kerentanan paket** secara berkala dengan `pnpm audit --prod` dan `dotnet list package --vulnerable`.
- **Pantau beban `POST /api/sso/session`**, karena tiap aplikasi memanggilnya sekali per pengguna tiap 5 menit.
