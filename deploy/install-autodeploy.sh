#!/bin/sh
set -eu
umask 077

project_root=${PROJECT_DIR:-$(CDPATH= cd -- "$(dirname "$0")/.." && pwd)}
expected_root=${EXPECTED_PROJECT_DIR:-"$HOME/apps/dashboard"}
env_file=${ENV_FILE:-"$project_root/.env"}
user_unit_dir=${SYSTEMD_USER_DIR:-"$HOME/.config/systemd/user"}
state_dir=${AUTODEPLOY_STATE_DIR:-"$HOME/.local/state/dashboard"}

fail() {
  echo "install-autodeploy: $*" >&2
  exit 1
}

for command_name in git install loginctl systemctl; do
  command -v "$command_name" >/dev/null 2>&1 || \
    fail "required command is missing: $command_name"
done
[ "$project_root" = "$expected_root" ] || \
  fail "checkout must be located at $expected_root (got $project_root)"
[ -d "$project_root/.git" ] || fail "project is not a Git checkout: $project_root"
[ -r "$env_file" ] || fail "environment file is not readable: $env_file"

cd "$project_root"
[ -z "$(git status --porcelain)" ] || fail "working tree is not clean"
current_branch=$(git symbolic-ref --quiet --short HEAD || true)
[ "$current_branch" = main ] || \
  fail "autodeploy must be installed from main (got ${current_branch:-detached HEAD})"

install -d -m 0700 "$user_unit_dir" "$state_dir"
install -m 0644 deploy/systemd/dashboard.service \
  "$user_unit_dir/dashboard.service"
install -m 0644 deploy/systemd/dashboard-autodeploy.service \
  "$user_unit_dir/dashboard-autodeploy.service"
install -m 0644 deploy/systemd/dashboard-autodeploy.timer \
  "$user_unit_dir/dashboard-autodeploy.timer"
chmod 755 deploy/auto-deploy.sh

systemctl --user daemon-reload
systemctl --user enable dashboard.service dashboard-autodeploy.timer
systemctl --user start dashboard.service
systemctl --user start dashboard-autodeploy.timer

systemctl --user is-active --quiet dashboard.service || \
  fail "dashboard.service is not active"
systemctl --user is-active --quiet dashboard-autodeploy.timer || \
  fail "dashboard-autodeploy.timer is not active"

linger=$(loginctl show-user "$USER" -p Linger --value 2>/dev/null || true)
if [ "$linger" != yes ]; then
  echo "install-autodeploy: warning: linger is disabled; ask DevOps to run:" >&2
  echo "  sudo loginctl enable-linger $USER" >&2
fi

echo "install-autodeploy: installed and active"
systemctl --user list-timers dashboard-autodeploy.timer --all --no-pager
