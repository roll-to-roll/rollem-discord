#!/bin/bash

trap "echo 'Command exited with non-zero status $0'" ERR
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

echo "### Installing k8s deps (via Winget)"

echo "#### Getting doctl (via Winget)"
# Official Package https://winstall.app/apps/DigitalOcean.Doctl
winget install --id=DigitalOcean.Doctl  -e && true

echo
echo "#### Getting kubectl (via Winget)"
# OFficial Package https://winstall.app/apps/Kubernetes.kubectl
# From docs https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/
winget install -e --id Kubernetes.kubectl && true

echo
echo "#### Getting jq (via Winget)"
# OFficial Package https://winstall.app/apps/jqlang.jq
# From docs https://jqlang.github.io/jq/download/
winget install jqlang.jq && true

echo
echo "... you may need to re-launch and re-run the script to get these into PATH ..."
echo "... I could not find a good way to refresh the PATH variable here ..."

echo
echo "#######################################################"
echo "### Installation complete                           ###"
echo "#######################################################"
echo