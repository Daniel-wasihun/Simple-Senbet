FROM php:8.4-cli-alpine

COPY --from=mlocati/php-extension-installer /usr/bin/install-php-extensions /usr/local/bin/

RUN install-php-extensions \
    pdo_sqlite \
    pdo_pgsql \
    pgsql \
    mbstring \
    zip \
    intl \
    gd \
    pcntl \
    opcache

WORKDIR /var/www/html

CMD ["php", "artisan", "serve", "--host=0.0.0.0", "--port=8000"]
