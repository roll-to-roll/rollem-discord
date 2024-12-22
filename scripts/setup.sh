#!/bin/bash

trap "echo 'Command exited with non-zero status $0'" ERR
set -e

cd "$(dirname "${BASH_SOURCE[0]}")"

echo
echo "# Performing scripted setup"
./setup--k8s.sh