FROM php:8.4-cli

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libonig-dev \
    libxml2-dev \
    libzip-dev \
    libicu-dev \
    libssl-dev \
    zip \
    unzip \
    supervisor \
    cron \
    procps \
    nodejs \
    npm \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd zip intl sockets opcache

# Install Redis extension
RUN pecl install redis && docker-php-ext-enable redis

# Install Swoole extension for Octane
RUN pecl install swoole && docker-php-ext-enable swoole

# Install Composer
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /var/www/html

# Copy composer files first for caching
COPY composer.json composer.lock ./

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

# Copy application code
COPY . .

# Run composer scripts
RUN composer dump-autoload --optimize

# Install NPM dependencies and build assets
RUN npm install && npm run build

# Create storage directories
RUN mkdir -p storage/framework/{cache,sessions,views} \
    && mkdir -p storage/logs \
    && mkdir -p bootstrap/cache

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 775 storage bootstrap/cache

# Copy custom PHP config (upload limits, memory)
COPY docker/php.ini /usr/local/etc/php/conf.d/99-custom.ini

# Copy supervisor configs (production + development)
COPY docker/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY docker/supervisord.dev.conf /etc/supervisor/conf.d/supervisord.dev.conf

# Copy cron config
COPY docker/crontab /etc/cron.d/laravel-cron
RUN chmod 0644 /etc/cron.d/laravel-cron \
    && crontab /etc/cron.d/laravel-cron

# Expose port for Octane
EXPOSE 8000

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
