#!/bin/bash

# Setup script for Laravel Backend - DroidRun Controller
# This script will set up the database and seed initial data

echo "🚀 Setting up Laravel Backend for DroidRun Controller..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created"
else
    echo "✅ .env file already exists"
fi

# Generate app key if not set
if ! grep -q "APP_KEY=base64:" .env; then
    echo "🔑 Generating application key..."
    php artisan key:generate
    echo "✅ Application key generated"
else
    echo "✅ Application key already set"
fi

# Create SQLite database if using SQLite
if grep -q "DB_CONNECTION=sqlite" .env; then
    if [ ! -f database/database.sqlite ]; then
        echo "💾 Creating SQLite database..."
        touch database/database.sqlite
        echo "✅ SQLite database created"
    else
        echo "✅ SQLite database already exists"
    fi
fi

# Run migrations
echo "🗄️  Running migrations..."
php artisan migrate --force

if [ $? -eq 0 ]; then
    echo "✅ Migrations completed successfully"
else
    echo "❌ Migration failed"
    exit 1
fi

# Seed service packages
echo "🌱 Seeding service packages..."
php artisan db:seed --class=ServicePackageSeeder --force

if [ $? -eq 0 ]; then
    echo "✅ Service packages seeded successfully"
else
    echo "❌ Seeding failed"
    exit 1
fi

echo ""
echo "✨ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "  1. Start the server: php artisan serve"
echo "  2. API will be available at: http://localhost:8000"
echo "  3. Test the API: curl http://localhost:8000/api/packages"
echo ""
echo "📦 Available packages:"
php artisan tinker --execute="echo App\Models\ServicePackage::count() . ' packages created';"
echo ""
echo "🔐 To create a test user, run:"
echo "  php artisan tinker"
echo "  >>> User::factory()->create(['email' => 'test@example.com'])"
echo ""
