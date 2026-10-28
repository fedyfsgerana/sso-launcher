# SSO Launcher — Panduan Integrasi SSO

Panduan untuk menghubungkan aplikasi lain ke SSO Launcher, sehingga pengguna cukup login sekali di portal.


## Prinsip

SSO Launcher adalah **satu-satunya pusat akun dan pintu masuk** untuk semua aplikasi perusahaan.

| Dikelola oleh | Tanggung jawab |
| --- | --- |
| **SSO Launcher** | Data pengguna, password, login, logout, dan keputusan siapa yang boleh membuka aplikasi (lewat grup dan akses aplikasi) |
| **Aplikasi** | Sesi login miliknya sendiri, dan hak akses **di dalam** aplikasi (modul, fitur, data) untuk pengguna yang sudah diizinkan portal |

Konsekuensinya bagi setiap aplikasi:

- Tidak ada halaman login, form password, atau manajemen pengguna di aplikasi.
- Pengguna yang belum punya sesi selalu dialihkan ke SSO Launcher.
- Data pengguna di aplikasi hanya salinan dari portal, dengan kunci `userId` portal.

## Serah Terima

Semua yang dibutuhkan tim aplikasi diserahkan dalam **satu file Panduan Integrasi** (`SSO Launcher - SSO Integration {Nama Aplikasi}.md`) yang dibuat dari SSO Launcher. Alurnya sama untuk semua aplikasi:

1. **Tim aplikasi** mengirim ke pengelola portal: nama aplikasi, slug yang diinginkan, alamat aplikasi per lingkungan, teknologi backend, dan IP server (kalau firewall perlu dibuka).
2. **Pengelola portal** mendaftarkan aplikasi di **Manajemen Aplikasi → Tambah**. Alamat callback disusun otomatis dari alamat aplikasi dengan path standar `/sso/callback`.
3. **Pengelola portal** membuat kredensial di **Kredensial SSO → Buat Kredensial**, lalu mengklik **Unduh** pada kartu **Panduan Integrasi** di jendela **Kredensial Dibuat**. File panduan berisi Client ID dan Client Secret yang baru dibuat, data aplikasi, pengaturan siap tempel, pekerjaan yang harus dilakukan, daftar uji, dan dokumen ini. Panduan hanya bisa diunduh **sekali** per kredensial.
4. **Pengelola portal** menyerahkan file panduan ke penanggung jawab server aplikasi lewat jalur yang aman.
5. **Tim aplikasi** mengerjakan sesuai panduan, memasang pengaturannya, lalu mengabari pengelola portal untuk pemberian akses grup dan uji bersama.

Client Secret hanya ada di file panduan, karena portal tidak menyimpan secret aslinya. Kalau file hilang atau bocor, buat kredensial baru, unduh panduannya, pasang, lalu cabut kredensial lama.

### Diberikan oleh pengelola SSO Launcher (isi Panduan Integrasi)

| Item | Keterangan |
| --- | --- |
| Dokumen ini | Alur, endpoint, format data, contoh kode, dan aturan keamanan |
| Alamat web portal | Untuk mengalihkan browser pengguna, misalnya `https://sso.example.com` |
| Alamat API portal | Untuk dipanggil server aplikasi, misalnya `https://sso-api.example.com` |
| Slug aplikasi | Kode unik aplikasi di portal, misalnya `erp` |
| Client ID dan Client Secret | Kredensial layanan aplikasi, sudah terisi di pengaturan siap tempel dalam file panduan. File itu diserahkan lewat jalur yang aman, tidak lewat chat atau email biasa |
| Akun uji | Pengguna portal yang sudah diberi akses ke aplikasi |

### Diberikan oleh tim aplikasi

| Item | Keterangan |
| --- | --- |
| Alamat aplikasi | Alamat utama per lingkungan, misalnya `https://erp.example.com`. Portal menyusun alamat callback `https://erp.example.com/sso/callback` secara otomatis |
| Teknologi backend | Supaya contoh kode yang dipakai sesuai |
| IP server aplikasi | Kalau akses jaringan ke API portal perlu dibuka di firewall |

## Alur Masuk

Ada dua jalan masuk, dan keduanya selalu melewati portal.

### Dari SSO Launcher

```text
Pengguna ──klik Buka──▶ SSO Launcher
                          │  memeriksa akses pengguna
                          │  membuat sso_token (60 detik, sekali pakai)
                          ▼
Browser ──▶ https://aplikasi/sso/callback?sso_token=...
                          │
Server aplikasi ──1──▶ POST /api/service-auth/token   (Client ID + Secret)
                ──2──▶ POST /api/sso/validate         (token layanan + sso_token)
                ◀────── data pengguna + grup
                          │
                          ▼
Server aplikasi membuat sesi, lalu mengalihkan ke halaman utama
```

### Langsung ke alamat aplikasi

Pengguna membuka alamat aplikasi dari bookmark atau link yang dibagikan, tapi belum punya sesi di aplikasi.

```text
Pengguna ──▶ https://aplikasi/laporan/harian
                          │  belum ada sesi
                          ▼
Browser ──▶ https://portal/launch/{slug}?to=/laporan/harian
                          │  belum login portal? tampil halaman login portal
                          │  tidak punya akses? tampil halaman akses ditolak
                          ▼
Browser ──▶ https://aplikasi/sso/callback?sso_token=...&return_to=/laporan/harian
                          │  validasi seperti alur pertama
                          ▼
Server aplikasi membuat sesi, lalu mengalihkan ke /laporan/harian
```

> **Setelah Keluar dari aplikasi:** kalau pengguna sudah menekan **Keluar** di aplikasi, lalu membuka alamat aplikasi itu lagi secara langsung, portal **tidak** menerbitkan token otomatis. Pengguna diarahkan ke **Beranda portal** dan harus membuka aplikasi lagi lewat tombol **Buka**. Setelah itu, alamat langsung kembali berjalan seperti biasa. Aplikasi tidak perlu melakukan apa pun untuk aturan ini.

> **Catatan:** Aplikasi tujuan **tidak boleh mempercayai apa pun dari URL**. Satu-satunya bukti sah adalah respons dari `/api/sso/validate`, yang dipanggil dari **server** aplikasi.

### Alamat tetap

| Alamat | Dipakai untuk |
| --- | --- |
| `{portal}/launch/{slug}` | Mengalihkan pengguna yang belum punya sesi. Tambahkan `?to=/path` untuk kembali ke halaman tertentu |
| `{portal}/signed-out/{slug}` | Tujuan tombol Keluar di aplikasi. Sesi portal tetap aktif dan pengguna kembali ke Beranda portal |
| `{portal}/logout` | Keluar dari portal sekaligus. Pakai hanya kalau aplikasi sengaja menyediakan tombol keluar dari semua aplikasi |
| `{aplikasi}/sso/callback` | Penerima `sso_token` dari portal |

## Daftarkan Aplikasi di Portal

Dikerjakan pengelola SSO Launcher.

1. **Manajemen Aplikasi → Tambah Aplikasi.** Isi nama, kategori, dan **slug**. Biarkan **Login Lewat SSO Portal** bernilai **Ya**, lalu isi **URL Aplikasi** dengan URL callback dari tim aplikasi.
2. **Kredensial SSO → Buat Kredensial.** Kredensial baru mendapat izin `sso.validate users.read`. Salin Client Secret saat itu juga, karena hanya tampil sekali.
3. **Beri akses** lewat **Manajemen Grup & Akses → Akses Aplikasi**. Akses aplikasi hanya diberikan lewat grup.

Simpan kredensial di server aplikasi sebagai environment variable:

```text
PORTAL_WEB_URL=https://sso.example.com
PORTAL_API_URL=https://sso-api.example.com
PORTAL_APP_SLUG=erp
PORTAL_CLIENT_ID=sso_3f9c…
PORTAL_CLIENT_SECRET=Yk2n…
```

> **Catatan:** Kredensial yang dibuat sebelum direktori pengguna tersedia hanya punya izin `sso.validate`. Buat kredensial baru, lalu cabut yang lama.

## Mengelola Kredensial

Kredensial SSO **wajib** untuk setiap aplikasi yang login lewat portal. Tanpa kredensial aktif ber-izin `sso.validate`, portal menolak tombol **Buka** dan menampilkan pesan bahwa aplikasi belum siap dibuka. Penolakan ini tercatat di Riwayat Aktivitas sebagai "Gagal membuka aplikasi: Kredensial SSO belum tersedia". Di tabel Manajemen Aplikasi, kondisi ini tampil sebagai badge merah **Belum terhubung**.

| Topik | Keterangan |
| --- | --- |
| Masa berlaku | Kredensial tidak kedaluwarsa dan dipakai berulang sampai dicabut. Yang berumur pendek hanya token layanan (5 menit) dan `sso_token` (60 detik) |
| Izin | Setiap kredensial yang dibuat dari portal mendapat `sso.validate users.read` |
| Jumlah | Satu aplikasi boleh punya lebih dari satu kredensial aktif, misalnya saat pergantian. Hindari kredensial cadangan yang tidak dipakai, karena setiap kredensial aktif adalah satu pintu yang bisa bocor |
| Status Terhubung | Berarti ada minimal satu kredensial aktif, belum tentu sudah dipakai. Bukti pemakaian ada di kolom **Terakhir Dipakai** pada tab Kredensial SSO |
| Kapan dicabut | Secret diduga bocor, pemegangnya berganti, aplikasi pensiun, atau saat rotasi rutin, misalnya setahun sekali |
| Aplikasi tanpa SSO | Situs yang tidak memakai login portal ditandai **Login Lewat SSO Portal: Tidak** di form aplikasi. Situs ini dibuka langsung tanpa `sso_token`, tidak butuh kredensial, dan tampil dengan badge abu-abu **Tanpa SSO**. Pakai hanya untuk pengecualian, karena semua aplikasi perusahaan seharusnya login lewat portal |

### Mengganti kredensial tanpa downtime

1. Buat kredensial baru di tab **Kredensial SSO**.
2. Serahkan Client ID dan Secret baru ke tim aplikasi lewat jalur aman.
3. Tim aplikasi mengganti environment variable, lalu menjalankan ulang aplikasinya.
4. Pastikan kolom **Terakhir Dipakai** kredensial baru sudah terisi, dan kredensial lama tidak bergerak lagi.
5. Cabut kredensial lama.

> **Catatan:** Mencabut kredensial lama sebelum yang baru terpasang membuat aplikasi langsung tidak bisa login, dan sesi yang sedang berjalan berakhir pada pemeriksaan berikutnya. Kalau yang dicabut adalah satu-satunya kredensial aktif, portal juga langsung menolak tombol **Buka** untuk aplikasi itu.

## Halaman Callback

Pengguna tiba di:

```text
https://aplikasi/sso/callback?sso_token=eyJ1c2VyX2lk…&return_to=/laporan/harian
```

Server aplikasi:

1. Mengambil `sso_token` dari query string. Kalau kosong, alihkan ke `{portal}/launch/{slug}`.
2. Memvalidasi token ke API portal (bagian berikutnya).
3. Menyimpan atau memperbarui salinan pengguna berdasarkan `userId`.
4. Membuat sesi login aplikasi.
5. Mengalihkan ke `return_to` **hanya kalau** nilainya alamat relatif di dalam aplikasi (diawali `/` dan bukan `//`). Selain itu, alihkan ke halaman utama.

## Ambil Token Layanan

```http
POST /api/service-auth/token
Content-Type: application/json

{
  "clientId": "sso_3f9c…",
  "clientSecret": "Yk2n…"
}
```

```json
{
  "accessToken": "…",
  "tokenType": "Bearer",
  "expiresIn": 300,
  "scope": "sso.validate users.read"
}
```

Token berlaku 300 detik dan boleh dipakai berkali-kali selama belum kedaluwarsa. Simpan di memori server dan ambil ulang saat hampir habis. Endpoint ini dibatasi 30 permintaan per menit per alamat IP.

## Validasi Token SSO

```http
POST /api/sso/validate
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "token": "<sso_token dari URL>"
}
```

```json
{
  "userId": 14,
  "name": "Andi Saputra",
  "email": "andi.saputra@example.com",
  "employeeNumber": "PFC014",
  "department": "Finance & Accounting Factory",
  "departemenCode": "ACC",
  "jobTitle": "Staff Akuntansi",
  "applicationId": 3,
  "applicationSlug": "erp",
  "groups": ["Finance Pusat"],
  "expiresAt": "2026-09-21T09:01:00+00:00"
}
```

| Field | Kegunaan |
| --- | --- |
| `userId` | Kunci unik pengguna (angka 64-bit). Pakai ini untuk mencocokkan akun, bukan email |
| `departemenCode` | Kode departemen, misalnya `FIN` atau `IT`. Lebih stabil daripada nama departemen |
| `name`, `email`, `employeeNumber`, `department`, `jobTitle` | Data profil untuk ditampilkan atau disalin |
| `groups` | Grup yang memberi akses ke aplikasi ini |
| `applicationSlug` | Pastikan sama dengan `PORTAL_APP_SLUG` |

Respons `401 Unauthorized` berarti token **tidak boleh diterima**. Penyebabnya sengaja tidak dibedakan: token palsu atau kedaluwarsa, sudah pernah dipakai, untuk aplikasi lain, kredensial salah atau dicabut, atau pengguna sudah tidak punya akses. Alihkan pengguna ke `{portal}/launch/{slug}`.

## Direktori Pengguna

Karena pengguna hanya ada di portal, manajemen akses di aplikasi mengambil daftar pengguna dari sini. Butuh izin `users.read`.

### Daftar pengguna yang boleh membuka aplikasi

```http
GET /api/directory/users?search=andi&page=1&pageSize=50
Authorization: Bearer <accessToken>
```

```json
{
  "total": 1,
  "page": 1,
  "pageSize": 50,
  "items": [
    {
      "userId": 14,
      "name": "Andi Saputra",
      "email": "andi.saputra@example.com",
      "employeeNumber": "PFC014",
      "department": "Finance & Accounting Factory",
      "departemenCode": "ACC",
      "jobTitle": "Staff Akuntansi",
      "groups": ["Finance Pusat"],
      "updatedAt": "2026-09-20T03:12:00+00:00"
    }
  ]
}
```

| Parameter | Keterangan |
| --- | --- |
| `search` | Mencari nama, email, NIK, nama departemen, atau kode departemen |
| `updatedSince` | Hanya pengguna yang datanya berubah sejak waktu ini (ISO 8601), untuk sinkronisasi berkala |
| `page`, `pageSize` | Halaman dan jumlah per halaman. Bawaan 1 dan 50, maksimal 200 |

Daftar ini hanya berisi pengguna **aktif** yang **punya akses ke aplikasi pemanggil**. Aplikasi tidak bisa melihat pengguna yang hanya punya akses ke aplikasi lain.

### Periksa satu pengguna

```http
GET /api/directory/users/14
Authorization: Bearer <accessToken>
```

```json
{
  "userId": 14,
  "isActive": true,
  "hasAccess": true,
  "user": {
    "userId": 14,
    "name": "Andi Saputra",
    "groups": ["Finance Pusat"],
    "…": "…"
  }
}
```

Kalau `isActive` atau `hasAccess` bernilai `false`, `user` bernilai `null` dan pengguna tidak boleh memakai aplikasi lagi.

## Cek Sesi Berkala

**Wajib untuk semua aplikasi.** Portal tidak bisa menghapus cookie milik aplikasi, karena domainnya berbeda. Karena itu aplikasilah yang bertanya ke portal, dan satu endpoint ini menjawab empat hal sekaligus.

```http
POST /api/sso/session
Authorization: Bearer <accessToken>
Content-Type: application/json

{
  "userId": 14,
  "keepAlive": true
}
```

```json
{
  "active": true,
  "reason": "active",
  "sessionExpiresAt": "2026-09-24T17:20:00+00:00"
}
```

| `reason` | Arti dan tindakan aplikasi |
| --- | --- |
| `active` | Sesi portal masih hidup dan akses masih ada. Perpanjang sesi aplikasi |
| `session` | Pengguna sudah keluar dari portal, sesinya dicabut, kedaluwarsa, atau diam terlalu lama. **Akhiri sesi aplikasi** |
| `user` | Akun dinonaktifkan atau dihapus. **Akhiri sesi aplikasi** |
| `access` | Akses pengguna ke aplikasi ini dicabut. **Akhiri sesi aplikasi** |
| `application` | Aplikasi dinonaktifkan atau kredensialnya dicabut. **Akhiri sesi aplikasi** |

### Aturan pemakaian

1. Panggil **maksimal sekali tiap 5 menit per pengguna**, bukan setiap permintaan halaman. Simpan waktu pemeriksaan terakhir di sesi aplikasi.
2. Kirim `keepAlive: true`. Dengan begitu **sesi portal ikut diperpanjang** selama pengguna masih bekerja di aplikasi, sehingga portal tidak tiba-tiba meminta login ulang.
3. Kalau `active` bernilai `false`, **hapus sesi aplikasi** lalu alihkan ke `{portal}/launch/{slug}`. Jangan tampilkan pesan teknis ke pengguna.
4. Kalau portal tidak bisa dihubungi, anggap sesi **masih berlaku** sampai batas toleransi singkat, misalnya 15 menit, lalu akhiri sesi. Ini mencegah semua aplikasi ikut mati saat portal sedang dipelihara.
5. `keepAlive` **tidak bisa menembus batas mutlak** sesi portal, yaitu 8 jam sejak login. Setelah itu pengguna wajib login ulang, di portal maupun di semua aplikasi.

> Endpoint ini menggantikan cara lama yang memakai `GET /api/directory/users/{userId}`. Direktori tetap dipakai untuk menyalin data pengguna, bukan untuk memeriksa sesi.

## Sesi dan Logout

| Kejadian | Yang dilakukan aplikasi |
| --- | --- |
| Pengguna belum punya sesi | Alihkan ke `{portal}/launch/{slug}?to={path}` |
| Pengguna klik Keluar | Akhiri sesi aplikasi, lalu alihkan ke `{portal}/signed-out/{slug}`. Sesi portal tetap aktif, jadi pengguna kembali ke Beranda portal tanpa login ulang. Kalau sesi portal sudah berakhir, pengguna diarahkan ke halaman login portal |
| Pengguna ingin keluar dari semua | Opsional. Akhiri sesi aplikasi, lalu alihkan ke `{portal}/logout`. Sesi portal berakhir dan aplikasi lain ikut keluar pada pemeriksaan berikutnya |
| Selama sesi berjalan | Panggil `POST /api/sso/session` setiap 5 menit dengan `keepAlive: true`. Kalau `active` bernilai `false`, akhiri sesi dan alihkan ke portal |
| Pengguna keluar dari portal | Pemeriksaan berikutnya menjawab `session`, dan aplikasi ikut mengakhiri sesinya. Paling lambat 5 menit setelah logout |
| Masa sesi aplikasi | Maksimal 8 jam, sama dengan portal, dan diperpanjang lewat pemeriksaan berkala di atas |

Arahnya dua sisi. **Turun**: logout di portal membuat semua aplikasi ikut keluar. **Naik**: selama pengguna bekerja di aplikasi, sesi portal ikut hidup, sehingga pengguna tidak dipaksa login ulang saat kembali ke portal. Keluar dari satu aplikasi hanya mengakhiri sesi aplikasi itu, tidak memengaruhi portal maupun aplikasi lain.

## Contoh Kode

### ASP.NET Core

```csharp
builder.Services.AddHttpClient("Portal", client =>
    client.BaseAddress = new Uri(builder.Configuration["PORTAL_API_URL"]!));
builder.Services.AddSingleton<PortalServiceToken>();

builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.ExpireTimeSpan = TimeSpan.FromHours(8);
        options.Events.OnRedirectToLogin = context =>
        {
            var to = context.Request.Path + context.Request.QueryString;
            context.Response.Redirect(
                $"{portalWebUrl}/launch/{appSlug}?to={Uri.EscapeDataString(to)}");
            return Task.CompletedTask;
        };
    });

app.MapGet("/sso/callback", async (
    string? sso_token,
    string? return_to,
    IHttpClientFactory httpClientFactory,
    PortalServiceToken serviceToken,
    HttpContext httpContext) =>
{
    if (string.IsNullOrWhiteSpace(sso_token))
    {
        return Results.Redirect($"{portalWebUrl}/launch/{appSlug}");
    }

    var client = httpClientFactory.CreateClient("Portal");
    client.DefaultRequestHeaders.Authorization =
        new AuthenticationHeaderValue("Bearer", await serviceToken.GetAsync());

    var response = await client.PostAsJsonAsync(
        "/api/sso/validate",
        new { token = sso_token });

    if (!response.IsSuccessStatusCode)
    {
        return Results.Redirect($"{portalWebUrl}/launch/{appSlug}");
    }

    var user = await response.Content.ReadFromJsonAsync<PortalUser>();

    if (user is null || user.ApplicationSlug != appSlug)
    {
        return Results.Redirect($"{portalWebUrl}/launch/{appSlug}");
    }

    var identity = new ClaimsIdentity(
        [
            new Claim(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new Claim(ClaimTypes.Name, user.Name)
        ],
        CookieAuthenticationDefaults.AuthenticationScheme);

    await httpContext.SignInAsync(new ClaimsPrincipal(identity));

    var target = return_to is { Length: > 0 } &&
                 return_to.StartsWith('/') &&
                 !return_to.StartsWith("//")
        ? return_to
        : "/";

    return Results.Redirect(target);
});

app.MapPost("/logout", async (HttpContext httpContext) =>
{
    await httpContext.SignOutAsync();
    return Results.Redirect($"{portalWebUrl}/signed-out/{appSlug}");
});

public sealed record PortalUser(
    long UserId,
    string Name,
    string Email,
    string? EmployeeNumber,
    string? Department,
    string? JobTitle,
    string ApplicationSlug,
    IReadOnlyList<string> Groups,
    bool DirectAccess);
```

### Node.js (Express)

```js
app.use((req, res, next) => {
  if (req.session.user || req.path.startsWith("/sso/")) {
    return next();
  }

  const to = encodeURIComponent(req.originalUrl);
  return res.redirect(`${portalWeb}/launch/${appSlug}?to=${to}`);
});

app.get("/sso/callback", async (req, res) => {
  const { sso_token: ssoToken, return_to: returnTo } = req.query;

  if (typeof ssoToken !== "string") {
    return res.redirect(`${portalWeb}/launch/${appSlug}`);
  }

  const response = await fetch(`${portalApi}/api/sso/validate`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await serviceToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ token: ssoToken }),
  });

  if (!response.ok) {
    return res.redirect(`${portalWeb}/launch/${appSlug}`);
  }

  const user = await response.json();

  if (user.applicationSlug !== appSlug) {
    return res.redirect(`${portalWeb}/launch/${appSlug}`);
  }

  req.session.user = { id: user.userId, name: user.name };

  const safe =
    typeof returnTo === "string" &&
    returnTo.startsWith("/") &&
    !returnTo.startsWith("//");

  return res.redirect(safe ? returnTo : "/");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect(`${portalWeb}/signed-out/${appSlug}`));
});

app.use(async (req, res, next) => {
  const user = req.session.user;

  if (!user) {
    return next();
  }

  const checkedAt = req.session.checkedAt ?? 0;

  if (Date.now() - checkedAt < 5 * 60 * 1000) {
    return next();
  }

  const response = await fetch(`${portalApi}/api/sso/session`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${await serviceToken()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userId: user.id, keepAlive: true }),
  });

  const status = response.ok ? await response.json() : { active: true };

  if (!status.active) {
    return req.session.destroy(() =>
      res.redirect(`${portalWeb}/launch/${appSlug}`),
    );
  }

  req.session.checkedAt = Date.now();
  return next();
});
```

### Laravel

```php
Route::get('/sso/callback', function (Request $request) {
    $portal = config('services.portal');
    $ssoToken = $request->query('sso_token');

    if (! $ssoToken) {
        return redirect("{$portal['web_url']}/launch/{$portal['slug']}");
    }

    $serviceToken = Cache::remember('portal_service_token', 240, fn () =>
        Http::post("{$portal['api_url']}/api/service-auth/token", [
            'clientId' => $portal['client_id'],
            'clientSecret' => $portal['client_secret'],
        ])->throw()->json('accessToken'));

    $response = Http::withToken($serviceToken)
        ->post("{$portal['api_url']}/api/sso/validate", ['token' => $ssoToken]);

    if ($response->failed() || $response->json('applicationSlug') !== $portal['slug']) {
        return redirect("{$portal['web_url']}/launch/{$portal['slug']}");
    }

    $data = $response->json();

    $user = User::updateOrCreate(
        ['portal_user_id' => $data['userId']],
        [
            'name' => $data['name'],
            'email' => $data['email'],
            'employee_number' => $data['employeeNumber'],
        ]
    );

    Auth::login($user);

    $returnTo = $request->query('return_to');
    $safe = is_string($returnTo) && str_starts_with($returnTo, '/') && ! str_starts_with($returnTo, '//');

    return redirect($safe ? $returnTo : '/');
});

Route::post('/logout', function () {
    Auth::logout();

    return redirect(config('services.portal.web_url').'/signed-out/'.config('services.portal.slug'));
});
```

### Python (FastAPI)

```python
@app.middleware("http")
async def portal_guard(request: Request, call_next):
    if request.url.path.startswith("/sso/"):
        return await call_next(request)

    user = request.session.get("user")

    if not user:
        to = quote(request.url.path, safe="")
        return RedirectResponse(f"{PORTAL_WEB}/launch/{APP_SLUG}?to={to}")

    checked_at = request.session.get("checked_at", 0)

    if time.time() - checked_at >= 300:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{PORTAL_API}/api/sso/session",
                headers={"Authorization": f"Bearer {await service_token()}"},
                json={"userId": user["id"], "keepAlive": True},
            )

        status = response.json() if response.is_success else {"active": True}

        if not status["active"]:
            request.session.clear()
            return RedirectResponse(f"{PORTAL_WEB}/launch/{APP_SLUG}")

        request.session["checked_at"] = time.time()

    return await call_next(request)

@app.get("/sso/callback")
async def sso_callback(request: Request, sso_token: str = "", return_to: str = "/"):
    if not sso_token:
        return RedirectResponse(f"{PORTAL_WEB}/launch/{APP_SLUG}")

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{PORTAL_API}/api/sso/validate",
            headers={"Authorization": f"Bearer {await service_token()}"},
            json={"token": sso_token},
        )

    if not response.is_success:
        return RedirectResponse(f"{PORTAL_WEB}/launch/{APP_SLUG}")

    data = response.json()

    if data["applicationSlug"] != APP_SLUG:
        return RedirectResponse(f"{PORTAL_WEB}/launch/{APP_SLUG}")

    request.session["user"] = {"id": data["userId"], "name": data["name"]}
    request.session["checked_at"] = time.time()

    safe = return_to.startswith("/") and not return_to.startswith("//")

    return RedirectResponse(return_to if safe else "/")
```

### Python (Django)

```python
class PortalSsoMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith("/sso/"):
            return self.get_response(request)

        user = request.session.get("portal_user")

        if not user:
            to = quote(request.get_full_path(), safe="")
            return redirect(f"{settings.PORTAL_WEB}/launch/{settings.APP_SLUG}?to={to}")

        if time.time() - request.session.get("checked_at", 0) >= 300:
            status = portal_session_status(user["id"])

            if not status["active"]:
                request.session.flush()
                return redirect(f"{settings.PORTAL_WEB}/launch/{settings.APP_SLUG}")

            request.session["checked_at"] = time.time()

        return self.get_response(request)
```

### Java (Spring Boot)

```java
@Component
public class PortalSsoFilter extends OncePerRequestFilter {

    private final PortalClient portal;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain chain) throws IOException, ServletException {

        if (request.getRequestURI().startsWith("/sso/")) {
            chain.doFilter(request, response);
            return;
        }

        HttpSession session = request.getSession();
        PortalUser user = (PortalUser) session.getAttribute("portalUser");

        if (user == null) {
            String to = URLEncoder.encode(request.getRequestURI(), UTF_8);
            response.sendRedirect(portal.web() + "/launch/" + portal.slug() + "?to=" + to);
            return;
        }

        long checkedAt = (long) session.getAttribute("checkedAt");

        if (System.currentTimeMillis() - checkedAt >= 300_000L) {
            if (!portal.sessionActive(user.id())) {
                session.invalidate();
                response.sendRedirect(portal.web() + "/launch/" + portal.slug());
                return;
            }

            session.setAttribute("checkedAt", System.currentTimeMillis());
        }

        chain.doFilter(request, response);
    }
}
```

```java
@GetMapping("/sso/callback")
public String callback(
        @RequestParam(name = "sso_token", required = false) String ssoToken,
        @RequestParam(name = "return_to", defaultValue = "/") String returnTo,
        HttpSession session) {

    if (ssoToken == null || ssoToken.isBlank()) {
        return "redirect:" + portal.web() + "/launch/" + portal.slug();
    }

    PortalUser user = portal.validate(ssoToken);

    if (user == null || !portal.slug().equals(user.applicationSlug())) {
        return "redirect:" + portal.web() + "/launch/" + portal.slug();
    }

    session.setAttribute("portalUser", user);
    session.setAttribute("checkedAt", System.currentTimeMillis());

    boolean safe = returnTo.startsWith("/") && !returnTo.startsWith("//");

    return "redirect:" + (safe ? returnTo : "/");
}
```

### PHP Native / CodeIgniter 4

```php
<?php

function portal_guard(): void
{
    if (str_starts_with($_SERVER['REQUEST_URI'], '/sso/')) {
        return;
    }

    if (empty($_SESSION['portal_user'])) {
        $to = urlencode($_SERVER['REQUEST_URI']);
        header('Location: ' . PORTAL_WEB . '/launch/' . APP_SLUG . '?to=' . $to);
        exit;
    }

    if (time() - ($_SESSION['checked_at'] ?? 0) >= 300) {
        $status = portal_session_status($_SESSION['portal_user']['id']);

        if (! $status['active']) {
            session_destroy();
            header('Location: ' . PORTAL_WEB . '/launch/' . APP_SLUG);
            exit;
        }

        $_SESSION['checked_at'] = time();
    }
}

function portal_session_status(int $userId): array
{
    $curl = curl_init(PORTAL_API . '/api/sso/session');

    curl_setopt_array($curl, [
        CURLOPT_POST => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Authorization: Bearer ' . portal_service_token(),
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'userId' => $userId,
            'keepAlive' => true,
        ]),
    ]);

    $body = curl_exec($curl);
    $code = curl_getinfo($curl, CURLINFO_HTTP_CODE);

    curl_close($curl);

    return $code === 200 ? json_decode($body, true) : ['active' => true];
}
```

### Go

```go
func portalGuard(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if strings.HasPrefix(r.URL.Path, "/sso/") {
			next.ServeHTTP(w, r)
			return
		}

		session, _ := store.Get(r, "app_session")
		userID, ok := session.Values["userID"].(int64)

		if !ok {
			to := url.QueryEscape(r.URL.Path)
			http.Redirect(w, r, portalWeb+"/launch/"+appSlug+"?to="+to, http.StatusFound)
			return
		}

		checkedAt, _ := session.Values["checkedAt"].(int64)

		if time.Now().Unix()-checkedAt >= 300 {
			active, err := portalSessionActive(r.Context(), userID)

			if err == nil && !active {
				session.Options.MaxAge = -1
				_ = session.Save(r, w)
				http.Redirect(w, r, portalWeb+"/launch/"+appSlug, http.StatusFound)
				return
			}

			session.Values["checkedAt"] = time.Now().Unix()
			_ = session.Save(r, w)
		}

		next.ServeHTTP(w, r)
	})
}
```

## Daftar Periksa Keamanan

| Aturan | Alasan |
| --- | --- |
| Validasi `sso_token` dari server, bukan browser | Client Secret tidak boleh sampai ke browser |
| Jangan membaca data dari isi `sso_token` | Isinya baru sah setelah dijawab `/api/sso/validate` |
| Cocokkan `applicationSlug` dengan slug aplikasi sendiri | Menolak token yang dibuat untuk aplikasi lain |
| Cocokkan akun berdasarkan `userId` | Nama dan email bisa berubah, `userId` tidak |
| Terima `return_to` hanya kalau diawali `/` dan bukan `//` | Mencegah pengguna dialihkan ke situs palsu |
| Hapus `sso_token` dari URL setelah berhasil | Supaya token tidak tersimpan di riwayat browser |
| Simpan Client Secret di environment variable server | Tidak boleh ada di kode atau repository |
| Terapkan hak akses di server aplikasi | Menyembunyikan tombol saja tidak mencegah akses langsung |
| Pakai HTTPS di portal dan aplikasi | Token dan kredensial tidak boleh lewat jaringan tanpa enkripsi |
| Kredensial uji coba dan produksi dibuat terpisah | Kebocoran di lingkungan uji tidak berdampak ke produksi |
| Panggil `POST /api/sso/session` tiap 5 menit | Logout, penonaktifan akun, dan pencabutan akses di portal langsung berlaku di aplikasi |
| Jangan buat sesi aplikasi lebih panjang dari portal | Sesi aplikasi tidak boleh hidup setelah sesi portal berakhir |

## Kriteria Berhasil

1. Membuka alamat aplikasi tanpa sesi langsung diarahkan ke login portal, lalu kembali ke halaman yang dituju setelah login.
2. Klik **Buka** di portal langsung masuk ke aplikasi tanpa login ulang.
3. URL setelah masuk tidak lagi mengandung `sso_token`.
4. Membuka ulang URL callback yang sama ditolak.
5. Manajemen akses aplikasi bisa memilih pengguna dari direktori portal.
6. Keluar dari aplikasi hanya mengakhiri sesi aplikasi itu. Pengguna kembali ke Beranda portal tanpa login ulang selama sesi portal masih ada.
7. Keluar dari portal membuat aplikasi ikut keluar, paling lambat 5 menit kemudian.
8. Pengguna yang dinonaktifkan atau dicabut aksesnya di portal kehilangan sesi aplikasi dalam waktu pemeriksaan berkala.
9. Bekerja di aplikasi membuat sesi portal ikut hidup, sehingga pengguna tidak diminta login ulang saat kembali ke portal.
10. Setiap pembukaan aplikasi dan keluar dari aplikasi tercatat di Riwayat Aktivitas portal.

## Catatan Teknis

| Topik | Keterangan |
| --- | --- |
| Umur token | Token SSO 60 detik, token layanan 300 detik. Diatur lewat `SsoToken__LifetimeSeconds` dan `ServiceAccessToken__LifetimeSeconds` |
| Sekali pakai | Penanda token terpakai disimpan di tabel `mgmt_sso_token_uses` secara atomik, sehingga token bekas tetap ditolak walaupun API dijalankan ulang atau dijalankan lebih dari satu instans. Penanda yang sudah kedaluwarsa dibersihkan otomatis setiap hari |
| Izin kredensial | `sso.validate` untuk validasi login dan cek sesi, `users.read` untuk direktori pengguna |
| Batas mutlak sesi | 8 jam sejak login, diatur lewat `Session__LifetimeHours`. Batas diam 15 menit, diatur lewat `Session__IdleMinutes`, dan disegarkan oleh `POST /api/sso/session` |
| Tipe ID | `userId` dan `applicationId` berupa bilangan bulat 64-bit. Portal tidak mengirim email |
| Jejak audit | Setiap pembukaan aplikasi lewat portal dan setiap keluar dari aplikasi lewat `/signed-out/{slug}` tercatat di Riwayat Aktivitas. Token SSO sendiri tidak pernah dicatat |
