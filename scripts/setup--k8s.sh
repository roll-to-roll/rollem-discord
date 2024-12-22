#!/bin/bash

trap "echo 'Command exited with non-zero status $0'" ERR
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "## Setting up k8s"
./setup--k8s--winget.sh
./setup--k8s--auth.sh

echo