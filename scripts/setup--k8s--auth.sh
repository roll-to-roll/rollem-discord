#!/bin/bash

trap "echo 'Command exited with non-zero status $0'" ERR
set -e
cd "$(dirname "${BASH_SOURCE[0]}")"

DOCTL_CONTEXT_NAME="Rollem"
DOCTL_CLUSTER_NAME="rollem-sfo2"

echo
echo "### Checking for tokens (and switching context to '$DOCTL_CONTEXT_NAME')"
if ! doctl auth switch --context "$DOCTL_CONTEXT_NAME" ; then
  echo "#### Auth not found -- Initializing '$DOCTL_CONTEXT_NAME'"
  echo "See https://docs.digitalocean.com/reference/api/create-personal-access-token/ for instructions"
  doctl auth init --interactive --context "$DOCTL_CONTEXT_NAME"
  echo
  echo "#### Switching context to '$DOCTL_CONTEXT_NAME'"
  doctl auth switch --context "$DOCTL_CONTEXT_NAME"
else
  echo "#### Auth found -- Context switched to '$DOCTL_CONTEXT_NAME'"
fi

echo
echo "### Configuring cluster connection via doctl"
doctl kubernetes cluster kubeconfig save "$DOCTL_CLUSTER_NAME"

echo
echo "#######################################################"
echo "### Configuration complete -- Running test commands ###"
echo "#######################################################"

echo
echo "#### Version"
kubectl version

echo
echo "#### Who Am I?"
kubectl auth whoami

echo
echo "#### Pods Access Check"
echo "Running    (default): " $(kubectl get pods --field-selector=status.phase==Running --output json | jq -j '.items | length')
echo "Running (monitoring): " $(kubectl get pods --namespace monitoring --field-selector=status.phase==Running --output json | jq -j '.items | length')
