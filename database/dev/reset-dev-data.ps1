param(
    [string]$Database = "sso_launcher",
    [string]$DbHost = "127.0.0.1",
    [int]$Port = 5432,
    [string]$DbUser = "postgres",
    [string]$KeepUser = "administrator@example.com",
    [string]$KeepGroup = "Administrator"
)

$ErrorActionPreference = "Stop"

if ($Database -match "prod") {
    Write-Error "Skrip ini hanya untuk database pengembangan. '$Database' terlihat seperti database produksi."
    exit 1
}

Write-Host "Database : $Database @ ${DbHost}:$Port"
Write-Host "Disimpan : pengguna '$KeepUser', grup '$KeepGroup', dan menu portal"
Write-Host "Dihapus  : pengguna dan grup lain, semua aplikasi dan kredensial, riwayat aktivitas, notifikasi, favorit, sesi pengguna lain"
Write-Host ""

$answer = Read-Host "Ketik nama database ($Database) untuk melanjutkan"

if ($answer -ne $Database) {
    Write-Host "Dibatalkan."
    exit 0
}

$script = Join-Path $PSScriptRoot "reset-dev-data.sql"

& psql -h $DbHost -p $Port -U $DbUser -d $Database `
    -v "keep_user=$KeepUser" `
    -v "keep_group=$KeepGroup" `
    -f $script

if ($LASTEXITCODE -ne 0) {
    Write-Error "Pembersihan gagal. Tidak ada data yang berubah."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Selesai. Jalankan ulang API supaya hak akses grup '$KeepGroup' disusun ulang."
