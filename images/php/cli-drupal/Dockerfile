ARG PHP_VERSION
ARG PHP_IMAGE_VERSION
ARG IMAGE_REPO
FROM ${IMAGE_REPO:-lagoon}/php:${PHP_VERSION}-cli

LABEL maintainer="amazee.io"
ENV LAGOON=cli-drupal

# Defining Versions - https://github.com/hechoendrupal/drupal-console-launcher/releases
ENV DRUPAL_CONSOLE_LAUNCHER_VERSION=1.9.1 \
    DRUPAL_CONSOLE_LAUNCHER_SHA=c44be5772de751a498374b43290c693e6a8c79f4\
    DRUSH_VERSION=8.3.0

RUN curl -L -o /usr/local/bin/drupal "https://github.com/hechoendrupal/drupal-console-launcher/releases/download/${DRUPAL_CONSOLE_LAUNCHER_VERSION}/drupal.phar" \
    && echo "${DRUPAL_CONSOLE_LAUNCHER_SHA} /usr/local/bin/drupal" | sha1sum \
    && chmod +x /usr/local/bin/drupal \
    && php -d memory_limit=-1 /usr/local/bin/composer global require drush/drush:${DRUSH_VERSION} \
    && mkdir -p /home/.drush

COPY drushrc.php drush.yml /home/.drush/

RUN fix-permissions /home/.drush
