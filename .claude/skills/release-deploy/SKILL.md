---
name: release-deploy
description: Lint, test, build, commit, push, build a Podman image, push it to Google Artifact Registry and deploy to Cloud Run for task-tracker-api. Use when asked to release, ship or deploy the app.
---

# Release and deploy task-tracker-api

Run the steps in order and stop at the first failure. Ask the user for confirmation before every outward-facing step: `git push`, `podman push`, and any `gcloud` command that changes the project (deploy, enable APIs, create resources, IAM, secrets, SQL).

## Fixed values

- GCP project: `backend-api-512807` (not the gcloud default `tasktrackerprod001`)
- gcloud account: `mfirasath33@gmail.com`. Pass `--project` and `--account` on every gcloud call. If the account has no credentials, ask the user to run `gcloud auth login`.
- Registry image: `asia-south1-docker.pkg.dev/backend-api-512807/task-tracker/backend`
- Cloud Run service: `task-tracker-api`, region `asia-south1`, port 3000, public
- Cloud SQL: `backend-api-512807:asia-south1:free-trial-first-project`, database `task_tracker`, user `postgres`
- Secrets (Secret Manager): `task-tracker-db-password`, `task-tracker-jwt-secret`

## 1. Verify

1. `git status` and `git diff`; summarize the changes.
2. `npm run lint`, `npm test`, `npm run build`. Fix build or test failures if the cause is clear.
3. Note that `tsconfig.build.tsbuildinfo` is tracked and changes on every build; commit it with the rest.

## 2. Commit and push

1. Write a conventional commit message (`feat`, `fix`, `chore`, ...) and commit all changes. End it with the attribution line from the session's system reminder.
2. Ask, then `git push origin main`.

## 3. Image

1. `SHA=$(git rev-parse --short HEAD)`
2. `podman build -t task-tracker-backend:latest -t task-tracker-backend:$SHA .` (the multi-stage `Dockerfile`, node 22).
3. Verify locally: `podman run --rm --entrypoint node localhost/task-tracker-backend:latest -e "console.log(process.version, require('fs').existsSync('dist/main.js'))"`. Do not start the app; it needs PostgreSQL.
4. Tag both `latest` and `$SHA` with the registry image name above.
5. Ask, then `podman push` both tags. If `podman login` reports invalid credentials, try the push anyway, then confirm with `gcloud artifacts docker images list asia-south1-docker.pkg.dev/backend-api-512807/task-tracker --include-tags`.

## 4. Deploy to Cloud Run

Ask first, then:

```
gcloud run deploy task-tracker-api \
  --image=<registry image>:<SHA> --region=asia-south1 --port=3000 \
  --allow-unauthenticated \
  --add-cloudsql-instances=backend-api-512807:asia-south1:free-trial-first-project \
  --set-env-vars="DB_HOST=/cloudsql/backend-api-512807:asia-south1:free-trial-first-project,DB_PORT=5432,DB_USERNAME=postgres,DB_NAME=task_tracker" \
  --set-secrets="DB_PASSWORD=task-tracker-db-password:latest,JWT_SECRET=task-tracker-jwt-secret:latest" \
  --project=backend-api-512807 --account=mfirasath33@gmail.com
```

- Never put the DB password or JWT secret on the command line or in output; they live in Secret Manager.
- On Windows, gcloud works from PowerShell but not from Git Bash (no Python). Its stderr output makes PowerShell report a `NativeCommandError` even on success; judge by the message text.
- If the revision fails to start, read logs with `gcloud logging read 'resource.type="cloud_run_revision" AND resource.labels.service_name="task-tracker-api"' --limit=25`. A 403 `cloudsql.instances.get` means the compute service account (`<project-number>-compute@developer.gserviceaccount.com`) needs `roles/cloudsql.client`.
- First-time setup on a fresh project also needs the Artifact Registry, Cloud Run, Secret Manager and Cloud SQL Admin APIs enabled, the `task-tracker` Docker repository, the `task_tracker` database, both secrets, and Secret Accessor on them for the compute service account. Ask before creating any of these.

## 5. Smoke test and report

- `curl` the service URL: `/api` should return 200 and `/tasks` without a token 401.
- Report: files changed, commit hash, lint/test/build results, image name, tags, digest, push status, Cloud Run revision and URL.
