#!/bin/sh
set -eu
umask 077

project_root=${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}
remote_name=${DEPLOY_REMOTE:-origin}
deploy_branch=${DEPLOY_BRANCH:-main}
github_repository=${GITHUB_REPOSITORY:-BillShifr/dashboard}
ci_workflow=${CI_WORKFLOW_NAME:-CI}
state_dir=${AUTODEPLOY_STATE_DIR:-"$HOME/.local/state/dashboard"}
lock_file="$state_dir/lifecycle.lock"
lifecycle_lock_held=${LIFECYCLE_LOCK_HELD:-false}

fail() {
  echo "autodeploy: $*" >&2
  exit 1
}

for command_name in curl flock git python3; do
  command -v "$command_name" >/dev/null 2>&1 || fail "required command is missing: $command_name"
done
[ -d "$project_root/.git" ] || fail "project is not a Git checkout: $project_root"
case "$lifecycle_lock_held" in true | false) ;; *) fail "LIFECYCLE_LOCK_HELD must be true or false" ;; esac

if [ "$lifecycle_lock_held" = false ]; then
  mkdir -p "$state_dir"
  set +e
  LIFECYCLE_LOCK_HELD=true flock -n -E 73 -o "$lock_file" "$0" "$@"
  lock_status=$?
  set -e
  case "$lock_status" in
    0) exit 0 ;;
    73)
      echo "autodeploy: another deployment is already running"
      exit 0
      ;;
    *) exit "$lock_status" ;;
  esac
fi

cd "$project_root"
[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
current_branch=$(git symbolic-ref --quiet --short HEAD || true)
[ "$current_branch" = "$deploy_branch" ] || fail "expected branch $deploy_branch, got ${current_branch:-detached HEAD}"

remote_url=$(git remote get-url "$remote_name")
case "$remote_url" in
  https://github.com/BillShifr/dashboard.git | git@github.com:BillShifr/dashboard.git) ;;
  *) fail "unexpected deployment remote: $remote_url" ;;
esac

git fetch --quiet --no-tags "$remote_name" "$deploy_branch"
current_head=$(git rev-parse HEAD)
target_head=$(git rev-parse "$remote_name/$deploy_branch")
deployed_ref=$(sed -n 's/^VCS_REF=//p' .env 2>/dev/null || true)

if [ "$current_head" = "$target_head" ] && [ "$deployed_ref" = "$target_head" ]; then
  echo "autodeploy: already current at $current_head"
  exit 0
fi

git merge-base --is-ancestor "$current_head" "$target_head" || \
  fail "origin/$deploy_branch is not a fast-forward from $current_head"

ci_response=$(mktemp "$state_dir/ci-response.XXXXXX")
cleanup() { rm -f "$ci_response"; }
trap cleanup EXIT HUP INT TERM

ci_url="https://api.github.com/repos/$github_repository/actions/runs?branch=$deploy_branch&event=push&head_sha=$target_head&per_page=20"
if ! curl --fail --silent --show-error --location \
  --connect-timeout 10 --max-time 30 \
  -H 'Accept: application/vnd.github+json' \
  -H 'X-GitHub-Api-Version: 2022-11-28' \
  "$ci_url" > "$ci_response"; then
  echo "autodeploy: GitHub CI status is temporarily unavailable; retrying on the next timer run" >&2
  exit 0
fi

set +e
python3 - "$ci_response" "$target_head" "$ci_workflow" <<'PY'
import json
import sys

path, expected_sha, workflow_name = sys.argv[1:]
with open(path, encoding="utf-8") as source:
    payload = json.load(source)
runs = [
    run
    for run in payload.get("workflow_runs", [])
    if run.get("head_sha") == expected_sha
    and run.get("event") == "push"
    and run.get("name") == workflow_name
]
if not runs:
    raise SystemExit(10)
run = max(runs, key=lambda item: (item.get("run_number", 0), item.get("run_attempt", 0)))
if run.get("status") != "completed":
    raise SystemExit(10)
if run.get("conclusion") != "success":
    raise SystemExit(11)
PY
ci_status=$?
set -e

case "$ci_status" in
  0) ;;
  10)
    echo "autodeploy: CI for $target_head is not complete; retrying on the next timer run"
    exit 0
    ;;
  11)
    echo "autodeploy: CI for $target_head did not pass; deployment skipped" >&2
    exit 0
    ;;
  *) fail "could not validate GitHub CI status for $target_head" ;;
esac

echo "autodeploy: releasing $target_head"
CONTAINER_ENGINE=podman COMPOSE_FILE="$project_root/compose.prod.yml" \
  sh "$project_root/scripts/update-production.sh"
echo "autodeploy: deployed $target_head"
