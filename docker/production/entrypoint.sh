#!/bin/sh
set -e

echo "Initializing Nova Starter..."

if [ -f /var/www/html/.env ]; then
    echo ".env file exists, skipping copy."
else
    if [ -f /var/www/html/.env.example ]; then
        cp /var/www/html/.env.example /var/www/html/.env
        echo "Created .env from .env.example"
    fi
fi

if [ -z "$APP_KEY" ]; then
    echo "Generating application key..."
    php artisan key:generate --force
fi

echo "Running migrations..."
php artisan migrate --force

if [ "$RUN_SEEDERS" = "true" ]; then
    echo "Running seeders..."
    php artisan db:seed --force
fi

echo "Clearing and caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting services..."
exec "$@"
