# AGENTS.md: grandstack (umbrella)

Compose stack plus the overview docs for GRANDstack (GraphQL on Neo4j: `grandstack-server`, `grandstack-web`). Read [docs/agents.md](docs/agents.md) first; it covers the mental model, where to change what, the verification checklist and the gotchas. [llms.txt](llms.txt) indexes everything.

- Start: `cp .env.example .env && docker compose up --build` (web :3000, GraphQL :4000/graphql, Neo4j :7474). The three repos must sit side by side because compose builds from `../grandstack-server` and `../grandstack-web`.
- `docker compose down -v` deletes the Neo4j data; the sample reseeds on the next start.
- Change the schema, seed or server behaviour in `grandstack-server`; change the UI in `grandstack-web`; follow each repo's `AGENTS.md` and `docs/recipes.md`.
- Before you finish, run the checks for each repo you changed (listed in [docs/agents.md](docs/agents.md#verification-checklist)) and `node scripts/check-links.mjs` here.
- There is no authentication. Do not expose the stack publicly.
- Keep docs true: update the doc next to the behaviour you change, in the same change.
