FROM nginxinc/nginx-unprivileged:stable-alpine

ARG BUILD_VERSION=0.0.0-dev
LABEL org.opencontainers.image.title="Lobstermania" \
      org.opencontainers.image.version="${BUILD_VERSION}"

COPY --chown=101:101 index.html /usr/share/nginx/html/index.html
COPY --chown=101:101 css/ /usr/share/nginx/html/css/
COPY --chown=101:101 js/ /usr/share/nginx/html/js/
COPY --chown=101:101 assets/ /usr/share/nginx/html/assets/
USER root
RUN case "$BUILD_VERSION" in ''|*[!0-9A-Za-z.+-]*) exit 1 ;; esac \
    && printf '{"version":"%s"}\n' "$BUILD_VERSION" > /usr/share/nginx/html/version.json

USER 101

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD wget -q -O /dev/null http://127.0.0.1:8080/version.json || exit 1
