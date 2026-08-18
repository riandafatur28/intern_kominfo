FROM php:8.4-cli

RUN apt-get update && apt-get install -y \
    libpq-dev \
    libpng-dev \
    libgd-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    unzip \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-install \
    pdo \
    pdo_pgsql \
    gd \
    mbstring \
    xml \
    dom \
    zip

# Cegah OOM saat render PDF (dompdf butuh >128M utk laporan tim dgn foto)
RUN printf 'memory_limit=512M\n' > /usr/local/etc/php/conf.d/memory.ini

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
