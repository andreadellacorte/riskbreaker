# Kubernetes (base manifests)

Generic **base** manifests for a placeholder **web** workload. They are meant to be **customized** (image name, resources, ingress, secrets) before any cluster apply.

## Layout

| File                                                   | Purpose                                                                                                                                   |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| [`base/kustomization.yaml`](./base/kustomization.yaml) | Kustomize entrypoint                                                                                                                      |
| [`base/namespace.yaml`](./base/namespace.yaml)         | Namespace `riskbreaker`                                                                                                                   |
| [`base/deployment.yaml`](./base/deployment.yaml)       | Deployment — replace `image` with your registry path (e.g. built from [`infra/docker/Dockerfile`](../docker/Dockerfile) **`web` target**) |
| [`base/service.yaml`](./base/service.yaml)             | ClusterIP on port 80                                                                                                                      |

## Usage

With a working kubeconfig:

```bash
kubectl apply -k infra/k8s/base
```

For a static SPA you will usually add an **Ingress** (or LoadBalancer Service) in an overlay; not included here so the base stays provider-agnostic.
