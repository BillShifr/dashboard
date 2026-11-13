# ADR-0002: локальная auth с готовностью к OIDC

Статус: принят.

## Решение

Локальные пароли Argon2id + server-side sessions. В `users` есть nullable
`oidc_subject` для будущего IdP без смены профиля.

## Следствия

Cookie `dashboard_session`, Secure от `APP_ORIGIN`. OIDC не реализуется в v1.
