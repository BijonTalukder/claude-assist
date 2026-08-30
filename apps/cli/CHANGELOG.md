# Changelog

All notable changes to `claude-assist` are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.2.0

### Added

- **Session management in the dashboard.** The Sessions page can now hide a session or
  permanently delete its transcript.
  - **Hide** is reversible and touches nothing on disk that belongs to Claude Code. Hidden
    sessions are excluded from every analytics view — summary, trends, models, projects —
    and the list has a "Show hidden sessions" toggle to bring them back. The list of hidden
    session ids lives in `~/.claude-assist/hidden-sessions.json` (override the location with
    `CLAUDE_ASSIST_STATE_DIR`).
  - **Delete** permanently removes the session's `.jsonl` transcript from Claude Code's own
    data directory. This cannot be undone and the session stops being resumable in Claude
    Code, so it takes a second, explicit confirmation in the UI.
- **Guard against deleting a live session.** A transcript modified in the last 60 seconds is
  assumed to still be open in Claude Code and is refused; the UI then offers an explicit
  "Delete anyway" override.
- **`.env` exclusions in generated `.claudeignore` files.** Every generated ignore file now
  carries a `# Secrets` block (`.env`, `.env.*`) regardless of detected language, with
  `.env.example` and `.env.sample` negated back in so committed templates stay readable.

### API

New endpoints on the local dashboard server:

| Method   | Path                              | Purpose                                     |
| -------- | --------------------------------- | ------------------------------------------- |
| `POST`   | `/api/analytics/sessions/:id/hide` | Hide a session from analytics (reversible)  |
| `DELETE` | `/api/analytics/sessions/:id/hide` | Unhide a session                            |
| `DELETE` | `/api/analytics/sessions/:id`      | Permanently delete the session's transcript |

`GET /api/analytics/sessions` accepts `?includeHidden=1` to list hidden sessions alongside
visible ones, each flagged with `hidden: true`. Deletion accepts `?force=1` to override the
active-session guard.

### Notes

Deleting and hiding only ever act on sessions the dashboard actually parsed — a session id is
resolved to its file server-side, and the resolved path is verified to sit inside Claude
Code's projects directory before anything is removed. The client never supplies a file path.
