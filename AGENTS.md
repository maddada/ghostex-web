# Ghostex Web

This repository is mounted at `apps/web` in [maddada/Ghostex](https://github.com/maddada/Ghostex).
Read the parent checkout's `AGENTS.md` before changing code when working there.

The build depends on Ghostex's root `package.json`, `bun.lock`, `tsconfig.json`, and shared packages.
Keep the `@/` alias pointing at the Ghostex root and use real parent-repository paths for shared imports.
See `README.md` for checkout and build instructions.

Run `bun run web:typecheck` and `bun run web:build` from the Ghostex root to verify changes.
Do not add tests unless the user explicitly asks for them.
Do not start or restart Ghostex unless the user asks.

Commit web changes in this repository, push them, then update the `apps/web` submodule pointer in Ghostex.
Do not include other contributors' pending changes in your commits or discard their work.
Search `src/` first and exclude dependency, build, and generated directories.
