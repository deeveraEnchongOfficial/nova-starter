#!/bin/bash

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Change to the script directory
cd "$DIR"

# Get the project name from the current directory
PROJECT=$(basename "$DIR")

# Function to source devconfig file
source_devconfig() {
    if [ ! -f ".devconfig" ]; then
        echo "❌ No .devconfig file found. Please create one from .devconfig.example"
        exit 1
    fi

    source .devconfig

    if [ -z "$LOCAL_ENCRYPTION_KEY" ]; then
        echo "❌ LOCAL_ENCRYPTION_KEY not set in .devconfig"
        exit 1
    fi
}

# Function to encrypt environment file
encrypt_env() {
    source_devconfig

    echo "🔑 Using encryption key from .devconfig for local environment"
    echo "🔐 Encrypting local environment file..."

    docker compose exec app php artisan env:encrypt --key="$LOCAL_ENCRYPTION_KEY" --force

    echo "✅ Environment file encrypted successfully!"
}

# Function to decrypt environment file
decrypt_env() {
    source_devconfig

    echo "🔑 Using encryption key from .devconfig for local environment"
    echo "🔐 Decrypting local environment file..."

    docker compose exec app php artisan env:decrypt --key="$LOCAL_ENCRYPTION_KEY" --force

    echo "✅ Environment file decrypted successfully!"
}

# Function to check if containers are running
check_containers() {
    if ! docker compose ps | grep -q "app"; then
        echo "❌ Docker containers are not running. Starting them..."
        docker compose up -d
        sleep 5  # Wait for containers to be ready
    fi
}

# Function to run artisan commands
artisan() {
    check_containers
    docker compose exec app php artisan "$@"
}

# Function to run composer commands
composer() {
    check_containers
    docker compose exec app composer "$@"
}

# Function to run npm commands
npm() {
    check_containers
    docker compose exec app npm "$@"
}

# Function to run npx commands
npx() {
    check_containers
    docker compose exec app npx "$@"
}

# Function to open a shell in the app container
shell() {
    check_containers
    docker compose exec app bash
}

# Function to start containers
start_containers() {
    echo "📦 Starting Docker containers..."
    docker compose up -d --remove-orphans
    sleep 5  # Wait for containers to be ready
}

# Function to stop containers without removing them
stop() {
    echo "🛑 Stopping Docker containers..."
    docker compose stop
    if [ $? -ne 0 ]; then
        echo "❌ Failed to stop containers"
        return 1
    fi
    echo "✅ Containers stopped successfully (use 'start' to restart them)"
}

# Function to destroy all containers and volumes
destroy_containers() {
    echo "⚠️  WARNING: This will remove all containers, volumes, networks, and Docker images for this project!"
    echo -n "Are you sure you want to continue? [y/N] "
    read -r response

    if [[ "$response" =~ ^[Yy]$ ]]; then

        echo "🛑 Stopping containers..."
        docker compose down
        if [ $? -ne 0 ]; then
            echo "❌ Failed to stop containers"
            return 1
        fi
        echo "✅ Containers stopped successfully"

        echo "💥 Destroying all containers, volumes, and networks..."
        docker compose down -v --remove-orphans
        if [ $? -ne 0 ]; then
            echo "❌ Failed to destroy containers and volumes"
            return 1
        fi

        echo "🗑️  Removing app Docker image..."
        if docker images -q nova-starter-app | grep -q .; then
            docker rmi $(docker images -q nova-starter-app) || { echo "❌ Failed to remove app Docker image"; return 1; }
        else
            echo "ℹ️  App Docker image not found. Skipping removal."
        fi

        echo "✅ All containers, volumes, networks, and images have been removed"
        echo "ℹ️  You may need to run './dev.sh init' to set up your environment again"
    else
        echo "🛑 Destroy operation cancelled"
        return 1
    fi
}

# Function to run migrations
run_migrations() {
    echo "🗃️  Running database migrations..."
    docker compose exec app php artisan migrate
    if [ $? -ne 0 ]; then
        echo "❌ Database migration failed. Please check your database configuration."
        return 1
    fi
    echo "✅ Migrations completed successfully"
}

# Function to run Laravel Pint
run_pint() {
    check_containers
    echo "🎨 Running Laravel Pint..."
    docker compose exec app ./vendor/bin/pint "$@"
}

# Function to generate IDE helper files
generate_ide_helper() {
    check_containers
    echo "✨ Generating IDE helper files..."
    docker compose exec app php artisan ide-helper:generate
    docker compose exec app php artisan ide-helper:meta
    docker compose exec app php artisan ide-helper:models -M
    echo "✅ IDE helper files generated successfully! 🎉"
}

# Function to format all code
format() {
    check_containers
    echo "🎨 Running code formatters..."

    # Run Laravel Pint
    echo "📝 Running Laravel Pint..."
    docker compose exec app ./vendor/bin/pint

    echo "✅ Code formatting completed successfully!"
}

# Function to rebuild a specific service
rebuild() {
    local service="$1"

    if [ -z "$service" ]; then
        echo "❌ Please specify a service to rebuild"
        echo "Usage: ./dev.sh rebuild <service>"
        echo "Example: ./dev.sh rebuild nginx"
        return 1
    fi

    echo "🔄 Rebuilding $service service..."
    docker compose build "$service"

    echo "🔄 Restarting $service service..."
    sleep 5
    docker compose up -d --no-deps "$service"

    echo "✅ Service $service has been rebuilt and restarted!"
}

# Function to initialize MinIO buckets
init_minio() {
    echo "📁 Initializing MinIO buckets..."
    docker compose exec minio mc alias set nova http://localhost:9000 "${MINIO_ROOT_USER:-minioadmin}" "${MINIO_ROOT_PASSWORD:-minioadmin}"
    docker compose exec minio sh -c "mc mb nova/uploads 2>/dev/null || true"
    docker compose exec minio mc anonymous set public nova/uploads
    echo "✅ MinIO buckets initialized successfully!"
}

# Function to handle the up command
up() {
    local update=true
    local rebuild=false

    # Parse arguments
    while [[ "$#" -gt 0 ]]; do
        case $1 in
            --no-update) update=false ;;
            --rebuild) rebuild=true ;;
            *) echo "⚠️  Unknown parameter: $1"; return 1 ;;
        esac
        shift
    done

    if [ "$rebuild" = true ]; then
        echo "🏗️  Rebuilding app service..."

        # Build with no-cache to ensure fresh dependencies
        docker compose build --no-cache app
        if [ $? -ne 0 ]; then
            echo "❌ Failed to rebuild app service."
            return 1
        fi

        # Clean up old and dangling images
        echo "🧹 Cleaning up old images..."
        docker image prune -f > /dev/null 2>&1
    fi

    # Start containers (needed for both normal up and update)
    start_containers

    # Initialize MinIO buckets
    sleep 3
    init_minio

    echo "📦 Installing PHP dependencies..."
    composer install

    echo "🧶 Installing JavaScript dependencies..."
    npm install

    if [ "$update" = true ]; then
        # Run migrations
        run_migrations || return 1

        echo "✨ Update process completed successfully!"
    else
        echo "✅ Environment is ready!"
    fi

    # Show access information
    echo "🌐 Access your application at: https://app.nova-starter.localhost"
    echo "📧 Access Mailhog at: http://localhost:8025"
    echo "🗃️  MongoDB is available at: localhost:27017"
    echo "💾 Redis is available at: localhost:6379"
    echo "📁 MinIO API at: https://storage.nova-starter.localhost"
    echo "📁 MinIO Console at: https://storage-console.nova-starter.localhost (default credentials: minioadmin/minioadmin)"
}

# Function to initialize the development environment
init() {
    echo "🚀 Initializing development environment..."

    # 0. Check for .devconfig
    if [ ! -f ".devconfig" ]; then
        echo "⚠️  No .devconfig file found."
        if [ -f ".devconfig.example" ]; then
            echo "ℹ️  Creating .devconfig from .devconfig.example..."
            cp .devconfig.example .devconfig
            echo "⚠️  Please edit .devconfig and set your encryption key before continuing."
        else
            echo "LOCAL_ENCRYPTION_KEY=" > .devconfig.example
            cp .devconfig.example .devconfig
            echo "⚠️  Created .devconfig and .devconfig.example. Please set your encryption key in .devconfig before continuing."
        fi
        exit 1
    fi

    # 1. Start containers
    start_containers

    # 2. Install PHP dependencies
    echo "📦 Installing PHP dependencies..."
    composer install || exit 1

    # 3. Install JavaScript dependencies
    echo "🧶 Installing JavaScript dependencies..."
    npm install || exit 1

    # 4. Decrypt environment file if it exists
    if [ -f ".env.encrypted" ]; then
        decrypt_env || exit 1
    fi

    # 5. Run database migrations
    run_migrations || exit 1

    # 6. Build frontend assets
    npm run build || exit 1

    # 7. Initialize MinIO buckets
    init_minio

    echo "✨ Development environment initialized successfully!"

    # Show access information
    echo "🌐 Access your application at: https://app.nova-starter.localhost"
    echo "📧 Access Mailhog at: http://localhost:8025"
    echo "🗃️  MongoDB is available at: localhost:27017"
    echo "💾 Redis is available at: localhost:6379"
    echo "📁 MinIO API at: https://storage.nova-starter.localhost"
    echo "📁 MinIO Console at: https://storage-console.nova-starter.localhost (default credentials: minioadmin/minioadmin)"
}

# Function to run tests
phpunit() {
    check_containers
    echo "🧪 Running PHPUnit tests..."
    docker compose exec app php artisan test "$@"
}

# Show help message
show_help() {
    echo "Nova Starter Development Script"
    echo "============================"
    echo ""
    echo "Container Management:"
    echo "  up [--update]     Start containers. With --update: runs migrations"
    echo "  down              Stop and remove containers"
    echo "  stop              Stop containers without removing them"
    echo "  destroy           Remove all containers, volumes, and networks (with confirmation)"
    echo "  rebuild <service> Rebuild and restart a specific service"
    echo ""
    echo "Environment Management:"
    echo "  init              Initialize development environment (decrypt env, run migrations, build assets)"
    echo "  decrypt-env       Decrypt environment file"
    echo "  encrypt-env       Encrypt environment file"
    echo ""
    echo "Development Tools:"
    echo "  artisan, art      Run Laravel Artisan commands"
    echo "  composer, comp    Run Composer commands"
    echo "  npm               Run NPM commands"
    echo "  npx               Run NPM commands with npx"
    echo "  pint              Run Laravel Pint"
    echo "  shell, sh         Open a shell in the app container"
    echo "  bash              Enter bash shell in the app container"
    echo "  ide               Generate IDE helper files"
    echo "  format            Format code using Laravel Pint"
    echo "  phpunit           Run PHPUnit tests"
    echo ""
    echo "Configuration:"
    echo "  Create a .devconfig file from .devconfig.example and set your encryption key:"
    echo "  - LOCAL_ENCRYPTION_KEY"
    echo ""
    echo "Examples:"
    echo "  # Container Management"
    echo "  ./dev.sh up                    # Start containers"
    echo "  ./dev.sh up --no-update        # Start containers without running migrations"
    echo "  ./dev.sh up --rebuild          # Rebuild app image and start containers"
    echo "  ./dev.sh down                  # Stop and remove containers"
    echo "  ./dev.sh stop                  # Stop containers"
    echo "  ./dev.sh destroy               # Remove everything (containers, volumes, networks)"
    echo "  ./dev.sh rebuild <service>     # Rebuild and restart a specific service"
    echo ""
    echo "  # Environment Management"
    echo "  ./dev.sh init                  # Initialize development environment"
    echo "  ./dev.sh decrypt-env           # Decrypt environment"
    echo "  ./dev.sh encrypt-env           # Encrypt environment"
    echo ""
    echo "  # Development Tools"
    echo "  ./dev.sh art migrate           # Run database migrations"
    echo "  ./dev.sh comp require package  # Install a composer package"
    echo "  ./dev.sh npm install           # Install NPM dependencies"
    echo "  ./dev.sh pint                  # Run Laravel Pint"
    echo "  ./dev.sh sh                    # Open a shell in the container"
    echo "  ./dev.sh bash                  # Enter bash shell in the container"
    echo "  ./dev.sh ide                   # Generate IDE helper files"
    echo "  ./dev.sh format                # Format code using Laravel Pint"
    echo "  ./dev.sh phpunit               # Run PHPUnit tests"
}

# Main command handler
case "$1" in
    "artisan" | "art")
        shift  # Remove 'artisan' from the arguments
        artisan "$@"
        ;;
    "composer" | "comp")
        shift
        composer "$@"
        ;;
    "npm")
        shift
        npm "$@"
        ;;
    "npx")
        shift
        npx "$@"
        ;;
    "pint")
        shift
        run_pint "$@"
        ;;
    "shell" | "sh" | "bash")
        shift
        shell "$@"
        ;;
    "ide")
        shift
        generate_ide_helper "$@"
        ;;
    "format")
        shift
        format "$@"
        ;;
    "phpunit")
        shift
        phpunit "$@"
        ;;
    "up")
        shift
        up "$@"
        ;;
    "down")
        echo "🛑 Stopping and removing containers..."
        docker compose down
        ;;
    "stop")
        shift
        stop "$@"
        ;;
    "start")
        shift
        start_containers
        ;;
    "destroy")
        shift
        destroy_containers "$@"
        ;;
    "rebuild")
        shift
        rebuild "$@"
        ;;
    "init")
        shift
        init "$@"
        ;;
    "encrypt-env")
        shift
        encrypt_env "$@"
        ;;
    "decrypt-env")
        shift
        decrypt_env "$@"
        ;;
    "help" | "--help" | "-h" | *)
        show_help
        ;;
esac
