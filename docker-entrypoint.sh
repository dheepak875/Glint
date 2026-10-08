#!/bin/sh
set -e

# Docker creates a missing bind-mount folder (e.g. ./data on a fresh install) owned by root,
# which the unprivileged app user can't write to. When started as root, hand the data folder
# to the app user (recursively only if its owner is wrong, e.g. first run or a restored
# backup), then drop root before starting the server.
if [ "$(id -u)" = "0" ]; then
  if [ "$(stat -c %u "$STORAGE_PATH")" != "$(id -u node)" ]; then
    chown -R node:node "$STORAGE_PATH"
  fi
  exec setpriv --reuid=node --regid=node --init-groups "$@"
fi

exec "$@"
