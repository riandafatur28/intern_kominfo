FROM php:8.2-cli

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
    pdo_pgsql \
    gd \
    mbstring \
    xml \
    dom \
    zip

COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /app
