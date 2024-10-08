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

USER node

ENTRYPOINT ["/usr/bin/env", "sh", "-c"]
CMD ["bash"]
