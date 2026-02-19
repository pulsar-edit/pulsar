# VERSION:        0.2
# DESCRIPTION:    Image to build Pulsar

FROM node:16-bookworm-slim

# Install dependencies
RUN apt-get update && \
    DEBIAN_FRONTEND="noninteractive" \
    apt-get install -y \
        build-essential \
        git \
        libsecret-1-dev \
        fakeroot \
        rpm \
        libx11-dev \
        libxkbfile-dev && \
    rm -rf /var/lib/apt/lists/*

ARG PUID=1000 \
    PGID=1000

RUN userdel -r node && \
    addgroup --gid "$PGID" pulsar && \
    adduser --disabled-password --uid "$PUID" --gid "$PGID" --comment "" pulsar

USER pulsar

ENTRYPOINT ["/usr/bin/env", "sh", "-c"]
CMD ["bash"]
