# AGENTS.md: grandstack (umbrella)

- `docker compose up --build` starts Neo4j and the server; wait for the `neo4j` healthcheck, then query http://localhost:4000/graphql.
- Config lives in `.env` (copy from `.env.example`). Compose defaults the password to `grandstack-dev`.
- `server` is built from `../grandstack-server` and `web` from `../grandstack-web`. Follow each repo's AGENTS.md for changes.
- `docker compose down -v` also deletes the Neo4j data volume, so the seed runs again next start. An older volume that was seeded before seed versioning (4 movies, no SeedMeta) is treated as foreign data and is not upgraded, so run `down -v` once.
- Later phases will be added as compose profiles; image versions will be pinned per repo.
