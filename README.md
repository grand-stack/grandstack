# GRANDstack

GraphQL on Neo4j for developers and agents. This umbrella repo runs the pieces together.

```sh
cp .env.example .env
docker compose up --build
```

- GraphQL: http://localhost:4000/graphql
- Neo4j Browser: http://localhost:7474 (user `neo4j`, password from `.env`)

Phase 1 includes Neo4j and [grandstack-server](../grandstack-server). Web, auth, agents and federation arrive in later phases as compose profiles. See [AGENTS.md](AGENTS.md).
