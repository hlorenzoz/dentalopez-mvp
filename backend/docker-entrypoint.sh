#!/bin/sh
set -e
mkdir -p /uploads
chown -R www-data:www-data /uploads
exec "$@"
