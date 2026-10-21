# AGENTS.md: grandstack (umbrella)

- `docker compose up --build` starts Neo4j and the server; wait for the `neo4j` healthcheck, then query http://localhost:4000/graphql.
- Config lives in `.env` (copy from `.env.example`). Compose defaults the password to `grandstack-dev`.
- The server is built from `../grandstack-server`. Server changes: follow that repo's AGENTS.md.
- `docker compose down -v` also deletes the Neo4j data volume, so the seed runs again next start.
- Later phases will be added as compose profiles; image versions will be pinned per repo.
