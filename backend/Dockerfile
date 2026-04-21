FROM yiisoftware/yii-php:8.3-fpm

RUN install-php-extensions pdo_mysql opcache bcmath zip pcov

COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /app
COPY composer.json composer.lock* ./
RUN composer install --no-interaction --no-progress --prefer-dist --no-scripts
COPY . .
RUN composer install --no-interaction --no-progress --prefer-dist \
 && composer dump-autoload --optimize \
 && mkdir -p runtime \
 && chown -R www-data:www-data runtime

EXPOSE 9000
CMD ["php-fpm"]
