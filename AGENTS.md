# Project Notes

## After making changes

Always run this after making changes (artisan commands must run inside Docker since MongoDB/MinIO run in containers):

```bash
docker exec nova-starter-app-1 bash -c "php artisan queue:clear && php artisan queue:flush && php artisan cache:clear && php artisan route:clear && php artisan config:clear && php artisan view:clear && php artisan clear-compiled && php artisan optimize:clear" && npm run build
```

## Docker services

The app runs in Docker. Container name: `nova-starter-app-1`. Run artisan commands via:

```bash
docker exec nova-starter-app-1 php artisan <command>
```

## Build

```bash
npm run build   # tsc && vite build && vite build --ssr
```
