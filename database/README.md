# Panduan Database

PostgreSQL, migrasi Entity Framework Core, dan konvensi penamaan skema SSO Launcher.

> Kembali ke [README utama](../README.md).

## Teknologi

| Komponen | Keterangan |
| --- | --- |
| Database | PostgreSQL 16 atau lebih baru |
| ORM | Entity Framework Core dengan Npgsql, migrasi _code-first_ |
| DbContext | `SsoLauncherDbContext` |
| Kode persistence | `apps/api/src/SsoLauncher.Infrastructure/Persistence/` |
| Proyek migrasi | `apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj` |
| Proyek startup | `apps/api/SsoLauncher.Api.csproj` |

## Database dan Koneksi

Nama database development adalah `sso_launcher`. Buat dengan `createdb` atau lewat `psql`:

```powershell
createdb -U postgres sso_launcher
```

```sql
CREATE DATABASE sso_launcher;
```

API membaca koneksi dari konfigurasi ASP.NET Core. Untuk lokal, isi `apps/api/appsettings.Development.json` atau gunakan environment variable:

```powershell
$env:ConnectionStrings__PostgreSql = "Host=127.0.0.1;Port=5432;Database=sso_launcher;Username=postgres;Password=<password>"
```

> **Catatan:** Di Windows, gunakan `127.0.0.1` alih-alih `localhost`. Dengan `localhost`, koneksi bisa sesekali _timeout_ karena alamat IPv6 dicoba lebih dulu. Jangan pernah menaruh password database di kode atau file yang ikut ter-commit.

## Migrasi

Migrasi disimpan di `apps/api/src/SsoLauncher.Infrastructure/Persistence/Migrations/` dan merupakan riwayat skema. Pastikan `dotnet-ef` terpasang (`dotnet tool install --global dotnet-ef`) dengan versi yang cocok dengan EF Core di proyek.

| Tujuan | Perintah |
| --- | --- |
| Buat migrasi baru | `dotnet ef migrations add NamaMigrasi ... --output-dir "Persistence/Migrations"` |
| Terapkan migrasi | `dotnet ef database update ...` |
| Daftar migrasi | `dotnet ef migrations list ...` |
| Cek perubahan model | `dotnet ef migrations has-pending-model-changes ...` |
| Skrip SQL | `dotnet ef migrations script ... --output "database/migration.sql"` |
| Skrip idempoten | `dotnet ef migrations script --idempotent ... --output "database/migration-idempotent.sql"` |
| Hapus migrasi terakhir | `dotnet ef migrations remove ...` (hanya kalau belum diterapkan) |
| Ke migrasi tertentu | `dotnet ef database update NamaMigrasi ...` |

Tanda `...` di atas selalu berisi tiga argumen yang sama:

```powershell
--project "apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj" `
--startup-project "apps/api/SsoLauncher.Api.csproj" `
--context SsoLauncherDbContext
```

Contoh lengkap membuat migrasi:

```powershell
dotnet ef migrations add NamaMigrasi `
    --project "apps/api/src/SsoLauncher.Infrastructure/SsoLauncher.Infrastructure.csproj" `
    --startup-project "apps/api/SsoLauncher.Api.csproj" `
    --context SsoLauncherDbContext `
    --output-dir "Persistence/Migrations"
```

> **Catatan:** Nama migrasi harus menjelaskan perubahannya, misalnya `AddApplicationMetadata`. Jangan menghapus atau mengubah migrasi yang sudah diterapkan dan di-commit. Kembali ke migrasi tertentu bisa membatalkan migrasi setelahnya, jadi periksa SQL-nya dulu sebelum dijalankan pada database penting.

Dalam mode Development, API menerapkan migrasi yang tertunda secara otomatis saat dijalankan. Perilaku ini tidak berlaku untuk produksi.

> **Catatan:** Riwayat migrasi dimulai dari dua migrasi: `InitialCreate` (seluruh tabel dari model EF Core) dan `PartitionAuditLogs` (mengubah `audit_logs` menjadi tabel berpartisi per bulan beserta fungsi pengelola partisinya). Setiap perubahan skema berikutnya wajib menjadi migrasi baru.

## Partisi Riwayat Aktivitas

`audit_logs` adalah tabel berpartisi per bulan (`PARTITION BY RANGE (occurred_at)`), supaya Riwayat Aktivitas tetap ringan saat datanya besar dan data lama bisa dibuang per bulan sekaligus. Bagi aplikasi tetap terlihat satu tabel, jadi query, filter, dan ekspor tidak berubah.

| Bagian | Keterangan |
| --- | --- |
| `audit_logs_YYYY_MM` | Satu partisi per bulan, dengan batas awal bulan UTC (tampil 07:00 WIB di DBeaver) |
| `audit_logs_default` | Penampung cadangan untuk baris di luar rentang partisi yang ada. Seharusnya selalu kosong |
| `pk_audit_logs` | Primary key `(audit_logs_id, occurred_at)`, karena PostgreSQL mewajibkan kolom partisi ikut di primary key |
| `audit_logs_hilo_seq` | Sequence untuk `audit_logs_id`. Aplikasi mengambil blok 10 ID sekaligus (HiLo), jadi ID tidak selalu berurutan rapat |
| `audit_logs_ensure_partitions(start, bulan)` | Membuat partisi dari bulan `start` sampai bulan berjalan ditambah `bulan`. Dipanggil `AuditPartitionWorker` saat API start dan setiap 24 jam, dengan 3 bulan ke depan |
| `audit_logs_drop_partitions_before(batas)` | Menghapus partisi yang seluruh isinya lebih tua dari `batas`. Dipanggil pembersihan otomatis sebelum `DELETE` bertahap |

`audit_data_versions.audit_logs_id` tetap menyimpan ID audit, tetapi **tanpa foreign key**, karena PostgreSQL tidak mengizinkan foreign key ke satu kolom di tabel berpartisi. Riwayat versi mengambil ringkasan dan alasan lewat `LEFT JOIN`, dan hasilnya kosong kalau catatan auditnya sudah terhapus.

Melihat partisi beserta rentangnya:

```sql
SELECT child.relname AS partisi, pg_get_expr(child.relpartbound, child.oid) AS rentang
FROM pg_inherits
JOIN pg_class parent ON parent.oid = pg_inherits.inhparent
JOIN pg_class child ON child.oid = pg_inherits.inhrelid
WHERE parent.relname = 'audit_logs'
ORDER BY child.relname;
```

> **Catatan:** Kalau `audit_logs_default` ternyata berisi data, artinya ada baris yang masuk sebelum partisi bulannya dibuat. Partisi bulan itu tidak bisa dibuat selama barisnya masih di partisi cadangan, jadi pindahkan dulu barisnya ke tabel sementara, buat partisinya dengan `audit_logs_ensure_partitions`, lalu masukkan kembali.

## Seeder Development

Seeder ada di `apps/api/src/SsoLauncher.Infrastructure/Persistence/Seed/DevelopmentDataSeeder.cs` dan hanya berjalan di mode Development. Isinya menu portal bawaan, grup **Administrator** yang memegang seluruh menu beserta **semua aksi tombol**, aplikasi perusahaan ERP dengan kredensial SSO lokal, dan akun berikut di dalam grup itu:

| Email | Password |
| --- | --- |
| `administrator@example.com` | `p@ssw0rd` |

> **Catatan:** Password di atas hanya dipakai saat akun pertama kali dibuat; setelah itu seeder tidak mengubah email maupun password akun ini. Produksi tidak boleh bergantung pada akun seeder.

## Database Test

Tes integrasi API di `apps/api/tests/SsoLauncher.Api.Tests` memakai database terpisah, misalnya `sso_launcher_test`. Database ini **dihapus dan dibuat ulang setiap kali tes dijalankan**, lalu migrasi dan seeder Development diterapkan. Karena itu namanya wajib diakhiri `_test` (tes menolak berjalan kalau tidak), dan akun PostgreSQL-nya harus punya hak membuat database. Database tidak perlu dibuat dulu dengan `createdb`.

```powershell
$env:SSO_LAUNCHER_TEST_DB_CONNECTION = "Host=127.0.0.1;Port=5432;Database=sso_launcher_test;Username=postgres"
$env:PGPASSWORD = Read-Host "Password postgres"
dotnet test --project "apps/api/tests/SsoLauncher.Api.Tests/SsoLauncher.Api.Tests.csproj" --configuration Release
```

> **Catatan:** Password dibaca dari `PGPASSWORD`, sehingga tidak tertulis di connection string maupun di riwayat perintah. Kedua environment variable hanya berlaku di jendela terminal itu.

> **Catatan:** Tes juga gagal kalau model punya perubahan yang belum dibuatkan migrasi, karena migrasi dijalankan saat tes dimulai.

> **Catatan:** Jangan pernah mengarahkan test yang merusak data ke database development atau produksi.

## Inspeksi Skema

Masuk ke database dengan `psql -U postgres -d sso_launcher`, lalu gunakan `\l`, `\c`, `\dt`, `\d nama_tabel`, `\dn`, `\di`, dan `\q`.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'mgmt_users'
ORDER BY ordinal_position;
```

Riwayat migrasi disimpan di tabel `__ef_migrations_history`:

```sql
SELECT *
FROM __ef_migrations_history
ORDER BY "MigrationId";
```

> **Catatan:** Jangan menambah atau menghapus baris riwayat migrasi secara manual, kecuali saat pemulihan yang direncanakan dengan matang.

## Backup dan Restore

```powershell
pg_dump -U postgres -d sso_launcher -F c -f "sso_launcher.backup"
```

```powershell
createdb -U postgres sso_launcher_restore
pg_restore -U postgres -d sso_launcher_restore --clean --if-exists "sso_launcher.backup"
```

> **Catatan:** Simpan file backup di luar repo dan jangan di-commit. Selalu periksa database tujuan sebelum menjalankan restore.

## Reset Database Development

Hanya untuk lokal, saat reset total memang diinginkan:

```powershell
dropdb -U postgres sso_launcher
createdb -U postgres sso_launcher
```

Kalau penghapusan database gagal atau _timeout_, kosongkan skemanya saja. Jalankan saat terhubung ke `sso_launcher`, dan tutup koneksi lain terlebih dahulu:

```sql
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
```

Setelah itu terapkan migrasi dengan `dotnet ef database update`. Menjalankan API dalam mode Development akan mengisi ulang data seeder.

> **Catatan:** Jangan pernah menjalankan prosedur reset ini di produksi.

## Penamaan

### Tabel

Setiap nama tabel diawali nama modulnya: `mgmt_` untuk modul manajemen, `audit_` untuk Riwayat Aktivitas, dan `portal_` untuk data portal pribadi. `__ef_migrations_history` dikelola Entity Framework Core dan tetap memakai namanya sendiri.

| Tabel | Primary Key | Modul |
| --- | --- | --- |
| `mgmt_users` | `mgmt_users_id` | Manajemen Pengguna |
| `mgmt_refresh_tokens` | `mgmt_refresh_tokens_id` | Manajemen Pengguna (sesi) |
| `mgmt_user_groups` | `mgmt_user_groups_id` | Manajemen Grup & Akses |
| `mgmt_user_group_members` | `mgmt_group_members_id` | Manajemen Grup & Akses |
| `mgmt_user_group_application_accesses` | `mgmt_group_app_accesses_id` | Manajemen Grup & Akses |
| `mgmt_user_group_menu_accesses` | `mgmt_group_menu_accesses_id` | Manajemen Grup & Akses |
| `mgmt_group_menu_actions` | `mgmt_group_menu_actions_id` | Manajemen Grup & Akses (aksi tombol) |
| `mgmt_applications` | `mgmt_applications_id` | Manajemen Aplikasi |
| `mgmt_application_service_credentials` | `mgmt_app_credentials_id` | Manajemen Aplikasi |
| `mgmt_portal_menus` | `mgmt_portal_menus_id` | Manajemen Menu |
| `mgmt_login_failures` | `mgmt_login_failures_id` | Keamanan login (kunci sementara) |
| `mgmt_sso_token_uses` | `mgmt_sso_token_uses_id` | Keamanan SSO (penanda token sekali pakai) |
| `audit_logs` | `audit_logs_id` | Riwayat Aktivitas |
| `audit_data_versions` | `audit_data_versions_id` | Riwayat Aktivitas |
| `portal_favorites` | `portal_favorites_id` | Portal (Favorit) |
| `portal_activities` | `portal_activities_id` | Portal (Terbaru) |
| `portal_notifications` | `portal_notifications_id` | Portal (Notifikasi) |
| `portal_notification_settings` | `portal_notification_settings_id` | Portal (Preferensi notifikasi) |
| `__ef_migrations_history` | `MigrationId` | Entity Framework Core |

### Primary Key dan Foreign Key

- Setiap primary key bertipe `bigint` yang dibuat PostgreSQL (`GENERATED BY DEFAULT AS IDENTITY`), sehingga baris baru mendapat nilai 1, 2, 3, dan seterusnya. Pengecualiannya `audit_logs`, lihat [Partisi Riwayat Aktivitas](#partisi-riwayat-aktivitas).
- Nama kolomnya adalah nama tabel ditambah `_id`. Nama yang panjang disingkat, contohnya `mgmt_user_group_application_accesses` memakai `mgmt_group_app_accesses_id`.
- Kolom foreign key memakai nama yang sama dengan primary key yang dirujuknya. Contohnya, `mgmt_user_group_members` memiliki kolom `mgmt_user_groups_id` dan `mgmt_users_id`.

Kolom yang bisa merujuk ke banyak tabel, atau punya peran khusus, memakai nama deskriptif:

| Kolom | Tabel | Arti |
| --- | --- | --- |
| `parent_id` | `mgmt_portal_menus` | Menu induk di tabel yang sama, boleh bertingkat tanpa batas |
| `action_key` | `mgmt_group_menu_actions` | Kode aksi tombol, misalnya `create`, `update`, `delete`, `export` |
| `maintenance_active` | `mgmt_portal_menus` | Menandai halaman sedang dalam perbaikan, beserta `maintenance_title` dan `maintenance_message` |
| `maintenance_message` | `mgmt_applications` | Pesan yang dilihat pengguna saat aplikasi berstatus maintenance, maksimal 300 huruf. Dikosongkan otomatis saat status berubah |
| `actor_id` | `audit_logs`, `audit_data_versions` | Pengguna yang melakukan aksi |
| `target_id` | `audit_logs` | Data yang menjadi sasaran aksi, di tabel mana pun |
| `entity_id` | `audit_data_versions` | Data yang diberi versi, di tabel mana pun |
| `deleted_by_id` | Setiap tabel yang memakai soft delete | Pengguna yang menghapus baris |

### Kolom Lain

- Nama kolom memakai huruf kecil dengan garis bawah (`snake_case`).
- Nilai benar/salah memakai tipe `boolean` PostgreSQL. `psql` menampilkannya sebagai `t` dan `f`.
- Tabel yang memakai soft delete memiliki `deleted_at`, `deleted_by_id`, `deleted_by_name`, dan `delete_reason`.
- `mgmt_users.email` unik di antara pengguna yang belum dihapus, disimpan dalam huruf kecil, maksimal 254 karakter.
- `mgmt_user_groups.name` unik per departemen di antara grup yang belum dihapus, lewat index `ux_mgmt_user_groups_departemen_code_name`. Nama yang sama boleh dipakai di departemen berbeda.

### Constraint dan Index

| Awalan | Dipakai untuk | Contoh |
| --- | --- | --- |
| `pk_` | Primary key | `pk_mgmt_users` |
| `fk_` | Foreign key | `fk_mgmt_user_group_members_mgmt_users` |
| `ux_` | Index unik | `ux_mgmt_users_email` |
| `ix_` | Index biasa | `ix_audit_logs_occurred_at` |

> **Catatan:** PostgreSQL memotong diam-diam nama yang lebih dari 63 karakter, jadi setiap nama constraint dan index harus tetap dalam batas itu. Tabel, kolom, index, dan constraint baru wajib mengikuti konvensi ini.

## Index dan Constraint

Index dibuat hanya kalau mendukung pola query yang benar-benar dipakai, misalnya pencarian email, identitas aplikasi, relasi akses, pencarian token sesi, pencarian kredensial layanan, dan query berbasis waktu kedaluwarsa. Pertimbangkan biaya penulisan sebelum menambah index.

Integritas data dijaga di database lewat primary key, foreign key, constraint unik, kolom wajib, panjang maksimum, dan index yang tepat. Validasi di aplikasi melengkapi constraint database, bukan menggantikannya.

## Panduan Produksi

Sebelum menerapkan perubahan skema di produksi:

| No | Langkah |
| --- | --- |
| 1 | Backup database |
| 2 | Tinjau migrasinya, dan SQL yang dihasilkan kalau perlu |
| 3 | Periksa operasi yang menghapus data, perubahan kolom opsional menjadi wajib, dan rename kolom yang ternyata menjadi drop lalu create |
| 4 | Perkirakan dampak pembuatan index |
| 5 | Pastikan aplikasi kompatibel dengan skema baru |
| 6 | Siapkan rencana rollback atau pemulihan |
| 7 | Terapkan pada jadwal deployment yang sesuai |

Kredensial produksi disimpan di konfigurasi environment yang aman atau secret manager yang disetujui, tidak pernah di README, kode, file `.env` yang ter-commit, riwayat Git, atau environment variable frontend.

Setiap kali perilaku database berubah: buat migrasi baru, biarkan EF Core memperbarui model snapshot, jangan mengubah migrasi lama secara manual, perbarui dokumen ini kalau prosedurnya berubah, dan pisahkan database test dari development maupun produksi.
