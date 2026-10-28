# Runbook Operasional

Langkah penanganan saat SSO Launcher bermasalah, ditulis agar bisa diikuti saat panik.

> Kembali ke [README utama](../README.md).

---

## Kontak dan Prioritas

| Tingkat | Contoh | Target penanganan |
| --- | --- | --- |
| **P1 — Kritis** | Portal mati total, semua aplikasi tidak bisa dibuka | Tangani segera, kabari pengguna lewat kanal resmi |
| **P2 — Tinggi** | Satu aplikasi gagal dibuka, login gagal untuk banyak orang | Hari yang sama |
| **P3 — Sedang** | Satu akun terkunci, satu pengguna kehilangan akses | Jam kerja berikutnya |
| **P4 — Rendah** | Permintaan akses baru, tampilan kurang rapi | Dijadwalkan |

| Penanggung Jawab | Nama | Menangani |
| --- | --- | --- |
| Pengelola Portal | Administrator Sistem | Portal, API, database, akun pengguna, dan akses grup |
| Administrator Aplikasi | Tim pengembang aplikasi masing-masing | Sisi aplikasi tujuan: callback, validasi token, dan sesi aplikasi |
| Infrastruktur | Information Technology Department | Server, jaringan, sertifikat HTTPS, dan backup |

---

## Pemeriksaan Cepat

Jalankan ini lebih dulu sebelum menduga-duga.

```powershell
# 1. API hidup?
Invoke-RestMethod "https://sso-api.example.com/health"

# 2. Web hidup?
(Invoke-WebRequest "https://sso.example.com" -UseBasicParsing).StatusCode

# 3. Database bisa dihubungi?
psql -h <host> -U <user> -d sso_launcher -c "SELECT 1;"
```

| Hasil | Arah pemeriksaan |
| --- | --- |
| Ketiganya sehat | Masalahnya kemungkinan di aplikasi tujuan atau di jaringan pengguna |
| Web mati, API hidup | Periksa proses Next.js, reverse proxy, dan sertifikat |
| API mati | Periksa layanan API, log aplikasi, dan koneksi database |
| Database mati | Prioritas utama. Semua fungsi portal bergantung padanya |

### Menelusuri error lewat nomor referensi

Kalau API mengalami error yang tidak terduga, pengguna hanya menerima pesan umum beserta **nomor referensi** 10 karakter, misalnya `4F2A9C1B7E`, tanpa detail teknis. Nomor yang sama ada di header respons `X-Reference-Id` dan di log API, lengkap dengan jenis error dan stack trace. Minta nomor itu dari pengguna, lalu cari di log:

```powershell
Select-String -Path "<folder log API>\*.log" -Pattern "4F2A9C1B7E"
```

---

## Gangguan 1: Portal Tidak Bisa Diakses

| No | Langkah | Keterangan |
| --- | --- | --- |
| 1 | Jalankan pemeriksaan cepat | Tentukan lapisan mana yang bermasalah |
| 2 | Periksa layanan | IIS: Application Pool. Linux: `systemctl status sso-launcher-api` |
| 3 | Baca log | Cari baris diawali `fail:`. Penyebab tersering: koneksi database dan konfigurasi hilang |
| 4 | Periksa sertifikat | Sertifikat kedaluwarsa membuat browser menolak, walaupun layanan hidup |
| 5 | Periksa ruang disk | Disk penuh menghentikan database dan penulisan log |
| 6 | Nyalakan ulang layanan | Kalau penyebabnya belum jelas, nyalakan ulang API lalu amati log |
| 7 | Kembalikan versi sebelumnya | Kalau gangguan muncul tepat setelah rilis, lihat bagian Rollback Rilis |

Selama gangguan, aplikasi yang sudah terbuka **masih berjalan** sampai pemeriksaan sesi berikutnya gagal. Jadi dampaknya bertahap, bukan seketika.

---

## Gangguan 2: Pengguna Tidak Bisa Login

| Gejala | Penanganan |
| --- | --- |
| Pesan email atau password salah | **Manajemen Pengguna → Keamanan** → Atur Ulang Password, lalu minta segera diganti |
| Pesan akun terkunci | Halaman **Keamanan** yang sama → **Buka Kunci Login** |
| Pesan akun nonaktif | Aktifkan lagi kalau memang berhak. Kalau karyawannya sudah resign, biarkan |
| Status 429 | Terlalu banyak percobaan dari satu IP. Tunggu satu menit, dan periksa apakah ada skrip yang membanjiri login |
| Banyak orang gagal sekaligus | Naikkan ke P2. Periksa log API, koneksi database, dan jam server |

Untuk menelusuri kejadiannya: **Riwayat Aktivitas**, saring aksi **Gagal Masuk** dan **Dikunci**, lalu lihat kolom IP dan perangkat.

Kalau portal sendiri tidak bisa dibuka, buka kunci lewat database:

```sql
UPDATE mgmt_login_failures SET cleared_at = now() WHERE cleared_at IS NULL;
```

---

## Gangguan 3: Aplikasi Gagal Dibuka

| Gejala | Penyebab tersering dan penanganannya |
| --- | --- |
| Aplikasi tidak muncul | Grup pengguna belum diberi akses. Periksa **Akses Aplikasi** di grupnya |
| Tombol Buka mati | Status aplikasi **Maintenance**. Kembalikan ke Aktif kalau sudah selesai |
| Muncul pesan aplikasi belum siap dibuka | Aplikasi SSO belum punya kredensial aktif, terlihat dari badge **Belum terhubung**. Buat kredensial dan serahkan ke tim aplikasi. Kalau aplikasinya memang situs tanpa login portal, ubah **Login Lewat SSO Portal** menjadi **Tidak** |
| Diarahkan balik ke portal | Aplikasi menolak token. Minta Administrator Aplikasi memeriksa log `/sso/callback` |
| Aplikasi menampilkan 401 | Client Secret salah atau kredensial sudah dicabut. Buat kredensial baru dan serahkan lewat jalur aman |
| Aplikasi menampilkan 403 | Pengguna tidak punya akses, atau kredensial kehilangan izin `sso.validate` |
| Token kedaluwarsa terus | Jam server portal dan server aplikasi berbeda jauh. Samakan waktunya lewat NTP |

Untuk memastikan masalahnya di portal atau di aplikasi:

```powershell
$body = @{ clientId = "<client id>"; clientSecret = "<secret>" } | ConvertTo-Json
Invoke-RestMethod "https://sso-api.example.com/api/service-auth/token" -Method Post -ContentType "application/json" -Body $body
```

Kalau token layanan terbit, portal sehat, dan masalahnya di sisi aplikasi.

---

## Gangguan 4: Pengguna Sering Keluar Sendiri

| Kemungkinan | Pemeriksaan |
| --- | --- |
| Batas diam terlalu pendek | `Session__IdleMinutes`, bawaan 15 menit |
| Batas mutlak tercapai | `Session__LifetimeHours`, bawaan 8 jam. Ini normal dan memang disengaja |
| Aplikasi tidak memanggil cek sesi | Tanpa itu, sesi portal tidak ikut diperpanjang. Minta Administrator Aplikasi menerapkan `POST /api/sso/session` dengan `keepAlive` |
| Beberapa instance API tanpa kunci yang sama | Signing key wajib sama persis di semua instance |
| Akun dinonaktifkan orang lain | Telusuri di **Riwayat Aktivitas**, aksi Ubah pada modul Pengguna |

---

## Gangguan 5: Database Penuh atau Lambat

```sql
-- Tabel terbesar
SELECT relname, pg_size_pretty(pg_total_relation_size(relid)) AS ukuran
FROM pg_catalog.pg_statio_user_tables
ORDER BY pg_total_relation_size(relid) DESC
LIMIT 10;

-- Jumlah baris audit per bulan
SELECT date_trunc('month', occurred_at) AS bulan, count(*)
FROM audit_logs
GROUP BY 1 ORDER BY 1 DESC;
```

| Temuan | Penanganan |
| --- | --- |
| `audit_logs` membengkak | Turunkan `DataRetention__AuditLogMonths`, lalu tunggu pembersih harian berjalan. Partisi bulan yang sudah lewat batas dihapus sekaligus |
| `audit_logs_default` berisi data | Ada catatan yang masuk sebelum partisi bulannya dibuat. Cek log `AuditPartitionWorker`, lalu ikuti catatan partisi di `database/README.md` |
| `audit_data_versions` membengkak | Turunkan `DataRetention__DataVersionMonths`. Pertimbangkan arsip sebelum memangkas |
| `portal_activities` membengkak | Turunkan `DataRetention__ActivityMonths`, bawaan 6 bulan |
| Pembersih tidak berjalan | Pastikan `DataRetention__Enabled` bernilai `true`, dan cari barisnya di log API |
| Query lambat | Jalankan `VACUUM ANALYZE`, dan periksa index yang hilang setelah migrasi besar |

> Jangan menghapus baris audit secara manual. Pakai pengaturan retensi, supaya penghapusannya bertahap dan tercatat.

---

## Gangguan 6: Dugaan Penyalahgunaan Akun

| No | Langkah | Keterangan |
| --- | --- | --- |
| 1 | Nonaktifkan akunnya | Seluruh sesi dicabut seketika, dan aplikasi ikut menutup sesinya |
| 2 | Kumpulkan bukti | **Riwayat Aktivitas**, saring per pengguna. Perhatikan IP, perangkat, dan jam kejadian |
| 3 | Ekspor untuk laporan | Tombol **Ekspor Excel** dengan filter yang sama |
| 4 | Periksa dampaknya | Data yang diubah bisa dikembalikan lewat **Histori Versi**, data terhapus lewat **Tempat Sampah** |
| 5 | Cabut kredensial terkait | Kalau yang bocor kredensial aplikasi, cabut lalu terbitkan yang baru |
| 6 | Atur ulang password | Setelah kejadian selesai ditangani, sebelum akun diaktifkan kembali |

---

## Rollback Rilis

```powershell
# 1. Hentikan layanan API
# 2. Kembalikan folder aplikasi ke versi sebelumnya
# 3. Kalau rilis membawa migrasi, kembalikan ke migrasi sebelumnya
dotnet ef database update <NamaMigrasiSebelumnya> `
  --project "apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj" `
  --startup-project "apps/api/SsoLauncher.Api.csproj" `
  --context SsoLauncherDbContext

# 4. Nyalakan layanan, lalu jalankan pemeriksaan cepat
```

> **Backup database sebelum rollback migrasi.** Sebagian migrasi menghapus kolom atau tabel, dan datanya tidak bisa dikembalikan hanya dengan menurunkan versi.

---

## Perawatan Rutin

| Selang waktu | Pekerjaan |
| --- | --- |
| Harian | Backup database. Pastikan berhasil, bukan sekadar terjadwal |
| Mingguan | Baca log API, cari baris `fail:` yang berulang |
| Bulanan | Periksa ukuran tabel audit, dan uji pemulihan backup ke server terpisah |
| Triwulanan | Tinjau akun tidak aktif, isi tiap grup, dan kerentanan paket |
| Tahunan | Ganti signing key, dan tinjau seluruh dokumen keamanan |

> Backup yang tidak pernah diuji pemulihannya belum bisa disebut backup.
