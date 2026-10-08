# Glint

**A self-hosted photography portfolio you can put online in minutes.**

Glint is for photographers who want a beautiful public home for their work without handing it to
a platform. Run one command on a Raspberry Pi, a Mac mini, a NAS, or a $5 cloud server, upload
your photos, and share the link. Your photos, your server, no subscription.

<!-- TODO: screenshots of the public gallery, the lightbox, and the admin -->

Unlike self-hosted photo *managers* (Immich, PhotoPrism, Piwigo), Glint doesn't try to organize
your whole library. It does one thing: show your best work well.

## Features

- **Justified gallery.** Rows like a contact sheet, every photo at its native aspect ratio, no
  square crops.
- **Animated lightbox.** Photos morph from the grid to fullscreen, with keyboard navigation and
  reduced-motion support.
- **EXIF display.** Camera, lens, aperture, shutter speed, ISO and focal length.
- **Albums.** Public, unlisted, or password-protected for client sets. Feature one album as your
  homepage.
- **Your portfolio, not just a gallery.** Site title, About page with contact details and
  social links, all edited from the admin.
- **Looks good when shared.** Every album gets a link preview with its cover photo on iMessage,
  Slack, X and elsewhere, plus a sitemap for search engines. Unlisted and password-protected
  albums are kept out of search.
- **Anonymous likes.** Visitors don't need an account.
- **Private by default where it matters.** Your original files, and the GPS location inside them,
  are never served to visitors. They only see resized copies with the metadata stripped.
- **Zero configuration.** No database server, no required settings. Everything lives in one
  folder you can back up.

## Quick start

You need [Docker](https://docs.docker.com/get-docker/). Then:

```bash
mkdir glint && cd glint
curl -fsSLO https://raw.githubusercontent.com/dheepak875/Glint/main/docker-compose.yml
docker compose up -d
docker compose logs glint      # shows your generated admin password
```

Open <http://localhost:3000/admin>, sign in as `admin`, create an album, and drag in some photos.
Under **Settings**, add your name, a short description, and an About page. Your gallery is at
<http://localhost:3000>.

That's a working install. To put it on the internet, choose one of the options below.

## Putting it online

| | Home server | Cloud server |
|---|---|---|
| **Runs on** | Raspberry Pi, Mac mini, NAS, any spare computer | Hetzner, DigitalOcean, Linode, any VPS |
| **Cost** | Free (plus a domain) | About $5/month, plus storage |
| **Storage** | Cheap, as big as your drive | Pricier for large libraries |
| **Uptime** | Depends on your home internet | Always on |
| **HTTPS** | Cloudflare Tunnel | Caddy (automatic certificates) |
| **Open router ports?** | No | n/a |

Both use the same `docker-compose.yml` and turn on one extra container.

### Option A: Home server with Cloudflare Tunnel

The tunnel connects *outward* from your machine to Cloudflare, so you don't open any ports on your
router and you get HTTPS for free. You need a domain managed by Cloudflare (a free account is
enough).

1. **Create a tunnel.** In the [Cloudflare dashboard](https://one.dash.cloudflare.com/), go to
   **Networks → Tunnels → Create a tunnel**, choose **Cloudflared**, and name it. On the install
   screen, copy the token (the long string after `--token`).
2. **Add a public hostname.** In the tunnel's **Public Hostname** tab, add your address (for
   example `photos.example.com`) with service type **HTTP** and URL **`glint:3000`**.
3. **Configure and start Glint:**

   ```bash
   mkdir glint && cd glint
   curl -fsSLO https://raw.githubusercontent.com/dheepak875/Glint/main/docker-compose.yml
   curl -fsSL https://raw.githubusercontent.com/dheepak875/Glint/main/.env.example -o .env
   # Edit .env: paste your TUNNEL_TOKEN and set an ADMIN_PASSWORD
   docker compose --profile tunnel up -d
   ```

Your gallery is live at your hostname. Manage it at `https://photos.example.com/admin`.

<details>
<summary><strong>Raspberry Pi notes</strong></summary>

- Use a **Raspberry Pi 4 or 5 with at least 4 GB of RAM**, running a **64-bit** OS (Raspberry Pi
  OS Lite 64-bit works well).
- **Store photos on an SSD, not the SD card.** SD cards are slow and wear out under heavy writes.
  Mount the SSD and run Glint from a folder on it, so `./data` lives there.
- Install Docker with `curl -fsSL https://get.docker.com | sh`, then
  `sudo usermod -aG docker $USER` and log out and back in.
- Uploads take a second or two per photo on a Pi while Glint creates the resized copies. That's
  normal.

</details>

<details>
<summary><strong>Mac mini notes</strong></summary>

- Install [OrbStack](https://orbstack.dev/) (lighter) or
  [Docker Desktop](https://www.docker.com/products/docker-desktop/), and set it to start when you
  log in.
- Stop the Mac from sleeping: **System Settings → Energy → Prevent automatic sleeping when the
  display is off**.
- For a large library, create the `glint` folder on an external drive.

</details>

<details>
<summary><strong>NAS notes (Synology, Unraid, TrueNAS)</strong></summary>

Any NAS that runs Docker Compose can run Glint. On Synology, use **Container Manager → Project**,
point it at a folder containing `docker-compose.yml` and `.env`, and enable the `tunnel` profile.
These setups aren't officially tested yet. Reports and guides are welcome.

</details>

### Option B: Cloud server with your own domain

Glint runs alongside [Caddy](https://caddyserver.com/), which gets and renews an HTTPS certificate
for your domain automatically.

1. **Create a server** with Ubuntu and at least 1 GB of RAM. Attach a block-storage volume if
   you have a large library.
2. **Point your domain at it.** Create a DNS `A` record (and `AAAA` for IPv6) for, say,
   `photos.example.com` pointing at the server's IP. Allow ports 80 and 443 in its firewall.
3. **Install Docker and start Glint:**

   ```bash
   curl -fsSL https://get.docker.com | sh
   mkdir glint && cd glint
   curl -fsSLO https://raw.githubusercontent.com/dheepak875/Glint/main/docker-compose.yml
   curl -fsSL https://raw.githubusercontent.com/dheepak875/Glint/main/.env.example -o .env
   # Edit .env: set DOMAIN=photos.example.com, GLINT_PORT=127.0.0.1:3000, and ADMIN_PASSWORD
   docker compose --profile caddy up -d
   ```

Setting `GLINT_PORT=127.0.0.1:3000` makes sure Glint is only reachable through HTTPS.

### Not supported: Vercel, Netlify, Cloudflare Workers

Serverless platforms don't keep files between requests, and Glint stores its database and photos
on disk. Use one of the options above.

## Configuration

Everything is optional. Copy [`.env.example`](.env.example) to `.env` and set only what you need.

| Setting | Default | What it does |
|---|---|---|
| `ADMIN_USERNAME` | `admin` | Admin login name |
| `ADMIN_PASSWORD` | generated | Admin password. If empty, one is generated, printed in the logs, and saved in `data/secrets.json` |
| `SESSION_SECRET` | generated | Signs login cookies |
| `SITE_TITLE` | `Glint` | Site title until you set one under **Settings** in the admin |
| `SITE_URL` | detected | Your public address, e.g. `https://photos.example.com`, used in link previews and the sitemap. Only needed if previews show the wrong address |
| `TUNNEL_TOKEN` | — | Cloudflare Tunnel token (Option A) |
| `DOMAIN` | — | Your domain (Option B) |
| `GLINT_PORT` | `3000` | Port on the host. Use `127.0.0.1:3000` behind Caddy |
| `GLINT_VERSION` | `latest` | Image version to run, e.g. `0.1.0` to pin |

Supported uploads: JPEG, PNG, WebP, AVIF, TIFF and GIF, up to 50 MB each. HEIC (iPhone) isn't
supported yet. Export as JPEG first.

## Updating

```bash
docker compose pull
docker compose up -d
```

Database changes are applied automatically when Glint starts.

**Automatic updates (optional).** To pick up new releases on their own, add a cron job
(`crontab -e`) that checks every 15 minutes. Glint only restarts when there's a new image:

```bash
*/15 * * * * cd /path/to/glint && docker compose pull -q glint && docker compose up -d glint && docker image prune -f > /dev/null
```

If you'd rather update by hand, pin a version with `GLINT_VERSION=0.1.0` in `.env`.

## Backups

Everything (the database, your photos, and the generated secrets) is in the `data` folder. To
take a consistent backup, stop Glint briefly while you copy it:

```bash
docker compose stop glint
tar czf glint-backup-$(date +%F).tar.gz data
docker compose start glint
```

To restore, put the `data` folder back and start Glint.

## Troubleshooting

- **Forgot the generated admin password?** It's in `data/secrets.json`, or set `ADMIN_PASSWORD`
  in `.env` and run `docker compose up -d`.
- **The `cloudflared` container keeps restarting.** `TUNNEL_TOKEN` is missing or wrong in `.env`.
  Check with `docker compose logs cloudflared`.
- **Too many login attempts.** Glint allows 10 attempts per 15 minutes per address. Wait, or
  restart the container to reset the limit.

## Development

Glint is a [Next.js](https://nextjs.org/) app with SQLite ([Drizzle](https://orm.drizzle.team/)),
[sharp](https://sharp.pixelplumbing.com/) for image processing, and
[Framer Motion](https://motion.dev/) for the lightbox.

```bash
npm install
npm run dev          # http://localhost:3000, data stored in ./data
```

To build and run the Docker image from your checkout instead of pulling the published one:

```bash
docker compose -f docker-compose.yml -f docker-compose.source.yml up -d --build
```

### How it fits together

```
Browser ──► Cloudflare Tunnel or Caddy ──► Glint (Next.js, one container)
                                              ├── data/glint.db       SQLite: albums, photos, likes
                                              ├── data/uploads/       original + resized copies
                                              └── data/secrets.json   generated on first run
```

On upload, Glint keeps the original untouched as your archive copy and creates two resized
versions (400 px and 1600 px wide) with the metadata stripped. Visitors only ever receive the
resized versions.

### Releasing

Pushing a version tag publishes a multi-architecture image (amd64 and arm64) to
`ghcr.io/dheepak875/glint`:

```bash
git tag v0.1.0
git push origin v0.1.0
```

## License

[MIT](LICENSE)
