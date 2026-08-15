# Nova Starter — Server Setup Guide

This guide walks you through deploying Nova Starter on a fresh server (written with an **Ubuntu home server** in mind, but the steps apply to any Linux box). It reproduces the same Docker Compose stack you run on your Mac — Nginx reverse proxy + MongoDB + Redis + MinIO + MailHog + n8n — so what works on your laptop works the same way on the server.

---

## Table of Contents

- [Architecture Recap](#architecture-recap)
- [Server Prerequisites](#server-prerequisites)
- [Deployment](#deployment)
- [Accessing the App From Other Machines on Your Network](#accessing-the-app-from-other-machines-on-your-network)
- [Real Domains & Let's Encrypt (Optional)](#real-domains--lets-encrypt-optional)
- [Backups](#backups)
- [Updating the App](#updating-the-app)
- [Troubleshooting](#troubleshooting)

---

## Architecture Recap

The deployment uses the repo's `docker-compose.yml` with the app image built from `docker/8.4/Dockerfile` (Ubuntu 22.04 + PHP 8.4, `artisan serve`, Xdebug, Vite HMR).

Services in the stack:

| Service | Image | Purpose |
|---|---|---|
| `app` | Custom (PHP 8.4) | Laravel app |
| `nginx` | `nginx:alpine` | SSL reverse proxy for `*.nova-starter.localhost` |
| `mongodb` | `mongo:latest` | Primary database (persistent volume) |
| `redis` | `redis:alpine` | Cache / queue |
| `mailhog` | `mailhog/mailhog` | Local mail catcher |
| `minio` | `minio/minio` | S3-compatible file storage (persistent volume) |
| `n8n` | `n8nio/n8n` | Workflow automation (sqlite, persistent volume) |

All persistent data lives in named Docker volumes: `nova-mongodb-data`, `nova-mongodb-config`, `nova-redis`, `nova-minio`, `nova-n8n`. **Back these up before any destructive operation.**

---

## Server Prerequisites

Tested on Ubuntu 22.04 / 24.04 LTS. As a non-root user with `sudo`:

```bash
# 1. System updates
sudo apt update && sudo apt upgrade -y

# 2. Required tooling
sudo apt install -y git curl ufw ca-certificates gnupg

# 3. Docker Engine + Compose plugin (official repo)
# https://docs.docker.com/engine/install/ubuntu/
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 4. Let your user use Docker without sudo
sudo usermod -aG docker $USER
newgrp docker   # or log out and back in

# 5. Verify
docker --version
docker compose version
```

**mkcert** (needed for the self-signed `*.nova-starter.localhost` certs):

```bash
sudo apt install -y libnss3-tools mkcert
mkcert -install   # installs the local CA into the server's trust store
```

> Note: `mkcert -install` only trusts the cert **on the server itself**. Browsers on your laptop/phone will still warn about the cert unless you also install the mkcert root CA on those devices (see [Accessing the app from other machines](#accessing-the-app-from-other-machines-on-your-network)). For a public server, prefer [real domains + Let's Encrypt](#real-domains--lets-encrypt-optional).

---

## Deployment

### 1. Clone the repo

```bash
cd ~
git clone <your-repo-url> nova-starter
cd nova-starter
```

### 2. Configure `.env`

```bash
cp .env.example .env
```

Edit `.env` and review at least these values:

| Variable | Notes |
|---|---|
| `APP_ENV` | `local` |
| `APP_DEBUG` | `false` on a shared server |
| `APP_URL` | The URL users will hit, e.g. `https://app.nova-starter.localhost` or your real domain |
| `DB_USERNAME` / `DB_PASSWORD` | **Change from defaults** (`dbuser`/`password`) |
| `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD` | **Change from defaults** (`minioadmin`/`minioadmin`) |
| `N8N_BASIC_AUTH_USER` / `N8N_BASIC_AUTH_PASSWORD` | **Change from defaults** |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | Set to your MinIO root user/pass, or create a dedicated MinIO user |
| `AWS_URL` / `AWS_SIGNING_URL` | The **externally reachable** MinIO URL (see note below) |
| `AWS_ENDPOINT` | Keep as `http://minio:9000` (internal Docker DNS) |
| `WWWUSER` / `WWWGROUP` | On Ubuntu these are usually `1000`/`1000` (verify with `id -u` / `id -g`) |

> **`AWS_URL` / `AWS_SIGNING_URL` gotcha:** these are used by the browser to fetch presigned upload/download URLs, so they must be reachable from the *client*, not from inside Docker. If you keep `*.nova-starter.localhost`, set them to `https://storage.nova-starter.localhost/uploads` and `https://storage.nova-starter.localhost` respectively, and make sure clients can resolve that host (see [Accessing the app](#accessing-the-app-from-other-machines-on-your-network)).

### 3. (Optional) Set up env encryption

If you share the repo and want to keep `.env` out of git but transferable:

```bash
cp .devconfig.example .devconfig
# edit .devconfig and set LOCAL_ENCRYPTION_KEY=some-strong-secret
```

You can then run `./dev.sh encrypt-env` on your Mac, commit `.env.encrypted`, and run `./dev.sh decrypt-env` on the server to restore `.env`.

### 4. Generate SSL certificates

```bash
mkcert -cert-file "docker/certs/_wildcard.nova-starter.localhost.pem" \
       -key-file "docker/certs/_wildcard.nova-starter.localhost-key.pem" \
       "*.nova-starter.localhost" "nova-starter.localhost"
```

If you're using a real domain instead, put your cert + key at those same paths (or edit `docker/nginx/conf.d/*.conf` to point at your cert files). See [Real domains & Let's Encrypt](#real-domains--lets-encrypt-optional).

### 5. Start the stack

```bash
./dev.sh up
```

This will:
- Build the `app` image (first run takes a few minutes)
- Start all containers
- Install PHP and JS dependencies inside the container
- Run migrations
- Initialize the MinIO `uploads` bucket

> **npm platform-specific package warning:** On macOS, `npm install` inside the container may print `EBADPLATFORM` for `@rolldown/binding-darwin-arm64` (a macOS-only optional dep that can't install on the Linux container). This is harmless — the Linux equivalent installs correctly and the build succeeds. This warning **does not occur on an Ubuntu server** where host and container are both Linux.

### 6. Seed the database

`./dev.sh up` runs migrations but **not** seeders. To create the initial admin user and default roles/permissions:

```bash
docker exec nova-starter-app-1 php artisan db:seed --force
```

Default login after seeding:
- **Email:** `admin@nova-starter.test`
- **Password:** `password`

> If you skip this step, the login page will render but there's no user to log in with.

### 7. Verify

```bash
docker compose ps
```

All services should be `Up`. The app container is named `nova-starter-app-1` (per `AGENTS.md`).

Run artisan commands via:

```bash
docker exec nova-starter-app-1 php artisan <command>
```

### Access points

| Service | URL |
|---|---|
| App | `https://app.nova-starter.localhost` |
| MinIO API | `https://storage.nova-starter.localhost` |
| MinIO Console | `https://storage-console.nova-starter.localhost` |
| MailHog UI | `http://<server-ip>:8025` |
| n8n | `http://<server-ip>:5678` |
| MongoDB | `<server-ip>:27017` |
| Redis | `<server-ip>:6379` |

---

## Accessing the App From Other Machines on Your Network

The stack uses `*.nova-starter.localhost` hostnames. `.localhost` resolves to `127.0.0.1` on each machine, so to reach the server from your laptop/phone you have two options:

### Option A — Per-client hosts file entries

On each client machine, add (replace `192.168.1.10` with your server IP):

```
192.168.1.10  app.nova-starter.localhost
192.168.1.10  storage.nova-starter.localhost
192.168.1.10  storage-console.nova-starter.localhost
```

- **macOS/Linux:** `/etc/hosts`
- **Windows:** `C:\Windows\System32\drivers\etc\hosts` (run as admin)

### Option B — Local DNS (better for many clients)

Run a local DNS server (pihole, dnsmasq) on your network that resolves `*.nova-starter.localhost` → server IP. Point your router/DHCP at it.

### Trusting the self-signed cert on clients

The mkcert cert is trusted only where the mkcert root CA is installed. To avoid browser warnings on your laptop:

```bash
# On the server, find the root CA:
mkcert -CAROOT
# -> prints a folder containing rootCA.pem and rootCA-key.pem

# Copy rootCA.pem to your client and import it into the system trust store:
# macOS: security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain rootCA.pem
# Windows: double-click rootCA.pem -> Install Certificate -> Local Machine -> Trusted Root
```

For a phone, the simplest path is Option B + a real domain + Let's Encrypt (next section).

---

## Real Domains & Let's Encrypt (Optional)

If you own a domain and want proper TLS (recommended for anything beyond a single-user dev box):

1. Point DNS `A` records for `app.yourdomain.com`, `storage.yourdomain.com`, `storage-console.yourdomain.com` to your server IP.
2. Replace the mkcert certs with Let's Encrypt certs. Easiest: run **Caddy** or **Traefik** on the host as the edge proxy to auto-issue certs, and have it forward to the `nginx` container (port 80/443 of the compose stack) or directly to the `app` container.
3. Update `.env`:
   - `APP_URL=https://app.yourdomain.com`
   - `AWS_URL=https://storage.yourdomain.com/uploads`
   - `AWS_SIGNING_URL=https://storage.yourdomain.com`
4. Update `server_name` in `docker/nginx/conf.d/app.conf` and `minio.conf` to your real domains (or rely on the edge proxy and leave the internal nginx as-is).

### Firewall

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Only expose MongoDB (27017), Redis (6379), MinIO (9000/9001), MailHog (8025/1025), n8n (5678) externally if you actually need to — on a home server you usually want these **only on the LAN** or not exposed at all (access them via SSH tunnels):

```bash
# Example: reach MongoDB from your laptop over SSH without opening 27017
ssh -L 27017:localhost:27017 user@server-ip
```

---

## Backups

All state lives in Docker volumes. To back up:

```bash
# Stop the stack to get a consistent snapshot (optional but safest)
docker compose down

# Back up each volume to a tarball
for v in nova-mongodb-data nova-mongodb-config nova-redis nova-minio nova-n8n; do
  docker run --rm -v ${v}:/data -v "$(pwd)":/backup alpine \
    tar czf /backup/${v}.tar.gz -C /data .
done

docker compose up -d
```

Restore:

```bash
docker volume create nova-mongodb-data   # if it doesn't exist
docker run --rm -v nova-mongodb-data:/data -v "$(pwd)":/backup alpine \
  tar xzf /backup/nova-mongodb-data.tar.gz -C /data
```

For MongoDB specifically, prefer `mongodump` / `mongorestore` for logical backups:

```bash
docker compose exec mongodb mongodump --archive --gzip -u "$DB_USERNAME" -p "$DB_PASSWORD" \
  --authenticationDatabase admin > backup-$(date +%F).gz
```

Schedule with cron as needed.

---

## Updating the App

```bash
cd ~/nova-starter
git pull

./dev.sh up            # re-runs migrations and refreshes deps
# or, if the Dockerfile/dependencies changed:
./dev.sh up --rebuild
```

After any code/config change, clear Laravel caches (run inside the container):

```bash
docker exec nova-starter-app-1 bash -c \
  "php artisan queue:clear && php artisan queue:flush && php artisan cache:clear \
   && php artisan route:clear && php artisan config:clear && php artisan view:clear \
   && php artisan clear-compiled && php artisan optimize:clear"
```

And rebuild frontend assets on the host:

```bash
npm run build   # tsc && vite build && vite build --ssr
```

---

## Troubleshooting

**`docker compose ps` shows the app container restarting**
Check logs: `docker compose logs app`. Common causes: bad `.env` (DB credentials, `APP_KEY`), MongoDB not ready yet (the `depends_on` only waits for start, not readiness).

**Browser can't resolve `app.nova-starter.localhost`**
You're on a different machine than the server. See [Accessing the app from other machines](#accessing-the-app-from-other-machines-on-your-network).

**Cert warnings in the browser**
The mkcert root CA isn't installed on the client. Either install it (see guide) or switch to a real domain + Let's Encrypt.

**MinIO uploads fail with signature errors**
`AWS_URL` / `AWS_SIGNING_URL` don't match the host the browser actually used to reach MinIO. Make sure they equal the externally-resolvable MinIO URL and that the cert covers that hostname.

**Port already in use**
Another service on the host is using port 80/443/27017/etc. Either stop it or remap the host-side ports via the `LOCAL_NOVA_*_PORT` env vars in `.env`.

**`E11000 duplicate key error` on `sessions` collection**
The `0001_01_01_000000_create_users_table` migration creates a unique index on the sessions `id` field, but the MongoDB session driver stores the session ID in `_id` (not `id`), so every session document has `id: null` and only one is allowed. A fix migration (`2026_08_14_..._fix_sessions_drop_id_unique_index.php`) is included in the repo and drops the redundant index automatically during `./dev.sh up`. If you're upgrading an existing database where the migration hasn't run yet, run it manually:

```bash
docker exec nova-starter-app-1 php artisan migrate --force
```

**Permission errors on `storage/`**
```bash
docker exec nova-starter-app-1 chown -R 1337:1000 storage bootstrap/cache
docker exec nova-starter-app-1 chmod -R 775 storage bootstrap/cache
```

**Reset everything (destructive)**
```bash
./dev.sh destroy   # removes containers, volumes, networks, app image
```
This wipes the database and MinIO. Only run after you've taken a backup.
