#!/bin/bash
K8S_VERSION=$(kubectl version --output json | jq .serverVersion.gitVersion -r)
ARCH=amd64

# See https://jamesdefabia.github.io/docs/getting-started-guides/docker/
# docker run -d \
#     --volume=/:/rootfs:ro \
#     --volume=/sys:/sys:ro \
#     --volume=/var/lib/docker/:/var/lib/docker:rw \
#     --volume=/var/lib/kubelet/:/var/lib/kubelet:rw \
#     --volume=/var/run:/var/run:rw \
#     --net=host \
#     --pid=host \
#     --privileged \
#     gcr.io/google_containers/hyperkube-${ARCH}:${K8S_VERSION} \
#     /hyperkube kubelet \
#         --containerized \
#         --hostname-override=127.0.0.1 \
#         --api-servers=http://localhost:8080 \
#         --config=/etc/kubernetes/manifests \
#         --cluster-dns=10.0.0.10 \
#         --cluster-domain=cluster.local \
#         --allow-privileged --v=2
CONF="$(doctl kubernetes cluster kubeconfig show rollem-sfo2)"
echo "LAUNCHING gcr.io/google_containers/hyperkube-${ARCH}:${K8S_VERSION}"
echo "$CONF"

pwd

# docker run -d
MSYS_NO_PATHCONV=1 docker run -it \
    --net=host \
    --pid=host \
    --privileged \
    --volume=$(pwd)/kubelet/:/rootfs:ro \
    --volume=$(pwd)/kubelet/sys/:/sys:ro \
    --volume=$(pwd)/kubelet/var/.kube/:/var/.kube:rw \
    --volume=$(pwd)/kubelet/var/lib/docker/:/var/lib/docker:rw \
    --volume=$(pwd)/kubelet/var/lib/kubelet/:/var/lib/kubelet:rw \
    --volume=$(pwd)/kubelet/var/run:/var/run/:rw \
    rancher/hyperkube:${K8S_VERSION}-rancher1 \
    kubelet --bootstrap-kubeconfig /var/.kube/config.yaml
#     /hyperkube kubelet \
#         --containerized \
#         --hostname-override=127.0.0.1 \
#         --api-servers=http://localhost:8080 \
#         --config=/etc/kubernetes/manifests \
#         --cluster-dns=10.0.0.10 \
#         --cluster-domain=cluster.local \
#         --allow-privileged --v=2