# ⚡ Absenku Net

Aplikasi tunnel HTTP gratis — seperti ngrok, tapi tanpa biaya dan tanpa akun.  
Buat URL publik HTTPS instan, lalu inspect semua request masuk lewat dashboard browser.

---

## Cara Kerja

```
Internet → URL Publik (Cloudflare) → absenku → Aplikasi kamu di localhost
```

Setiap request yang masuk bisa dilihat, di-replay, dan di-mock lewat dashboard di browser.

---

## Syarat

Kamu butuh **Node.js** versi 16 ke atas.

**Cek apakah Node.js sudah terinstall:**
```bash
node --version
```

Jika muncul angka versi (misal `v20.11.0`), berarti sudah siap.  
Jika belum, download di: https://nodejs.org — pilih **LTS** lalu install seperti biasa.

---

## Instalasi

Buka terminal, masuk ke folder project ini, lalu jalankan:

```bash
npm install -g .
```

Selesai. Perintah `absenku` sekarang bisa dipakai dari mana saja di terminal.

> **Catatan:** Saat pertama kali dijalankan, `absenku` akan otomatis download `cloudflared`  
> (binary Cloudflare Tunnel, ~30 MB). Cukup sekali, tidak perlu diulang.

---

## Cara Menjalankan

### 1. Jalankan aplikasi kamu dulu

Contoh untuk PHP:
```bash
php -S localhost:8000
```

Contoh untuk Python:
```bash
python -m http.server 8000
```

Contoh untuk Node.js:
```bash
node app.js  # pastikan app berjalan di port tertentu, misal 3000
```

### 2. Jalankan absenku

```bash
absenku http 8000
```

Ganti `8000` dengan port aplikasi kamu.

### 3. Tunggu URL muncul

Setelah ~5–10 detik, akan muncul output seperti ini:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  ✅ TUNNEL AKTIF!

  🌐 Public URL  : https://abc-def-123.trycloudflare.com
  🔍 Inspector   : http://localhost:8080
  🎯 Local app   : http://localhost:8000

  Bagikan URL di atas — sudah HTTPS, bisa diakses siapa saja!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

- **Public URL** — bagikan ke siapa saja, bisa diakses dari internet
- **Inspector** — buka di browser untuk melihat semua request masuk
- **Local app** — aplikasi kamu yang berjalan di komputer lokal

### 4. Berhenti

Tekan `Ctrl + C` di terminal.

---

## Opsi CLI

```bash
absenku http <port> [opsi]
```

| Opsi | Keterangan | Default |
|------|------------|---------|
| `--pass <password>` | Lindungi inspector dengan password | (tidak ada) |
| `--tunnel-port <n>` | Port internal tunnel server | 3000 |
| `--client-port <n>` | Port internal client server | 4040 |

**Contoh dengan password:**
```bash
absenku http 8000 --pass rahasia123
```

Inspector akan meminta username `admin` dan password yang kamu set.

---

## Dashboard Inspector

Buka **http://localhost:8080** di browser saat absenku sedang berjalan.

### Apa yang bisa dilakukan:

#### Lihat Request
Setiap request yang masuk ke URL publik ditampilkan secara real-time:
- Method (GET, POST, PUT, dll.)
- URL path
- Status code response
- Waktu request
- Headers, body request, dan body response lengkap

#### Filter Request
Gunakan tombol filter di bagian atas untuk menampilkan hanya request dengan method atau status tertentu.

#### Copy
Klik tombol **Copy** di samping headers atau body untuk menyalin isinya ke clipboard.

#### Replay Request
Klik tombol **Replay** pada request untuk mengirim ulang request tersebut ke aplikasi kamu.  
Berguna saat kamu ingin test ulang tanpa harus membuat request baru dari client.

#### Edit & Replay
Klik **Edit & Replay** untuk mengubah method, URL, headers, atau body sebelum dikirim ulang.

#### Pause / Resume
Klik tombol **Pause** untuk menghentikan sementara tampilan request baru (data tetap direkam di background).  
Klik **Resume** untuk melanjutkan.

#### Pin Request
Klik ikon pin pada request untuk "mengunci" request tersebut agar tetap terlihat saat scroll.

#### Mock Response
Klik **Mock** pada request untuk membuat mock response — saat URL tersebut dipanggil lagi,  
absenku akan langsung balas dengan response yang sudah kamu definisikan, tanpa meneruskan ke aplikasi.

Berguna untuk simulasi kondisi tertentu (misal: simulasi error 500, atau response spesifik).

#### Mocks List
Klik tombol **Mocks** di navbar untuk melihat dan menghapus semua mock yang aktif.

#### HAR Export
Klik **Export HAR** untuk mengunduh semua request dalam format HAR (HTTP Archive).  
File ini bisa dibuka di Chrome DevTools → Network → Import HAR.

#### Notifikasi Browser
Klik ikon lonceng untuk mengaktifkan notifikasi browser.  
Kamu akan mendapat notifikasi setiap ada request masuk, meski tab inspector tidak sedang terbuka.

#### Clear Log
Klik **Clear** untuk menghapus semua request dari tampilan inspector.

---

## Uninstall

```bash
npm uninstall -g absenku-inspector-request
```

Setelah itu, perintah `absenku` tidak akan tersedia lagi.

> File `cloudflared` yang sudah didownload ada di dalam folder project.  
> Hapus folder project secara manual jika tidak diperlukan lagi.

---

## Catatan Platform

| Sistem Operasi | Status |
|----------------|--------|
| macOS (Intel & Apple Silicon) | ✅ Didukung |
| Linux (x64 & ARM64) | ✅ Didukung |
| Windows | ✅ Didukung |

Binary `cloudflared` akan didownload secara otomatis sesuai dengan OS dan arsitektur komputer kamu.

---

## FAQ

**Q: URL publik berubah setiap kali dijalankan — normal tidak?**  
A: Normal. Cloudflare Quick Tunnel memang memberikan URL acak setiap sesi. Ini adalah layanan gratis tanpa akun.

**Q: Apakah data request saya tersimpan di server?**  
A: Tidak. Semua data hanya tersimpan di memori komputer lokal kamu dan hilang saat absenku dihentikan.

**Q: Bisa dipakai tanpa internet?**  
A: Inspector dan tunnel lokal tetap berjalan, tapi URL publik tidak akan tersedia tanpa koneksi ke Cloudflare.

**Q: Berapa batas request yang bisa ditampilkan?**  
A: Inspector menyimpan maksimal 500 request terakhir.

---

## Struktur File (untuk developer)

```
NGROK/
├── bin/
│   └── absenku.js        ← CLI entry point (perintah absenku)
├── lib/
│   ├── config.js         ← Konfigurasi port dan env vars
│   ├── state.js          ← State bersama antar modul
│   ├── utils.js          ← Helper: SSE, uid, port detection
│   ├── tunnel-server.js  ← Server penerima request publik (port 3000)
│   ├── client-server.js  ← Server komunikasi ke client (port 4040)
│   ├── inspector-server.js ← Server dashboard inspector (port 8080+)
│   ├── inspector-html.js ← HTML/JS dashboard browser
│   ├── tunnel-client.js  ← Client yang forward request ke app lokal
│   └── cloudflared.js    ← Download & spawn cloudflared
├── server.js             ← Entry point alternatif (tanpa CLI)
├── client.js             ← Client standalone (tanpa CLI)
├── package.json
└── README.md
```
