# Panduan Kontribusi

Terima kasih sudah tertarik berkontribusi pada SSO Launcher.

## Melaporkan masalah

Buka [Issue](https://github.com/fedyfsgerana/sso-launcher/issues) dan sertakan:

- langkah untuk mengulang masalah,
- hasil yang diharapkan dan hasil yang terjadi,
- versi .NET, Node.js, PostgreSQL, dan browser yang dipakai.

Celah keamanan jangan dilaporkan lewat Issue publik. Lihat [SECURITY](docs/SECURITY.md).

## Alur kerja

1. Fork repository, lalu buat branch dari `main`.

   ```bash
   git checkout -b fitur/nama-singkat
   ```

2. Ikuti panduan instalasi di [SETUP](docs/SETUP.md).
3. Pastikan semua pemeriksaan lolos sebelum commit.

   ```bash
   pnpm --prefix apps/web lint
   pnpm --prefix apps/web typecheck
   pnpm --prefix apps/web test
   pnpm --prefix apps/web build
   dotnet build apps/api/SsoLauncher.Api.csproj --configuration Release
   dotnet test --project apps/api/tests/SsoLauncher.Api.Tests/SsoLauncher.Api.Tests.csproj
   ```

4. Tulis pesan commit mengikuti [Conventional Commits](https://www.conventionalcommits.org/), misalnya `feat: tambah filter aplikasi` atau `fix: perbaiki validasi email`.
5. Ajukan Pull Request ke `main` dengan penjelasan singkat apa yang berubah dan kenapa.

## Aturan kode

- Setiap endpoint admin wajib memeriksa sesi dan akses menu di server. Menyembunyikan tombol di tampilan saja tidak cukup.
- Perubahan model database disertai migrasi baru dari `dotnet ef migrations add`. Jangan mengubah migrasi yang sudah dirilis.
- Setiap perubahan data dicatat lewat audit logger, dan password, secret, atau token tidak pernah masuk ke log.
- Kontrak OpenAPI di `apps/api/OpenApi/Contracts/` diperbarui setiap kali API berubah.
- Teks antarmuka memakai Bahasa Indonesia.
