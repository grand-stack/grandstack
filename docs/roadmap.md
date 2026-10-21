# Roadmap

> **Not built yet.** Everything on this page is planned work. It describes intent, not a commitment, and none of it exists in the repositories today. For what exists, read the [architecture](architecture.md).

The plan has five phases. Phases 1 and 2 are done and the web app has since gained people pages and full create/edit/delete.

| Phase | Status | What |
| --- | --- | --- |
| 1. Server and umbrella skeleton | Done | GraphQL server image over Neo4j; compose with Neo4j and the server; Movies seed; lint and breaking-change checks; AGENTS.md. |
| 2. Web app | Done | React client with typed operations; `docker compose up` gives Neo4j, server and web. Since extended with faceted search, compare, graph views, people, CRUD. |
| 3. Auth | Planned | A gateway (Hive Gateway) that validates JWTs from Keycloak first, then Auth0. Scope rules at the gateway; `@authorization` in the schema for row-level rules. Adds `User` and `Review` types to the dataset. |
| 4. Agents | Planned | MCP access to the GraphQL API (`@graphql-hive/plugin-mcp`), direct querying by agents, an attempt-memory graph in its own Neo4j database, guardrails for agents that write schemas. |
| 5. Federation and site | Planned | REST APIs as subgraphs composed with the Neo4j subgraph (Mesh OpenAPI handler, Hive Gateway); a Hugo site with `llms.txt`, hoped for at grandstack.ai (availability unchecked). |

## What each phase will change in what you read here

- **Phase 3** will add a gateway service to compose, make the web app send a token, and replace the "no authentication" warnings. Until then, never expose the stack publicly.
- **Phase 4** will add an `agents` repository and an MCP endpoint; the schema descriptions the lint rule already requires are what an agent reads.
- **Phase 5** will add subgraph repositories and publish these docs as a site.

## Things to verify before relying on them

These are open questions from planning, not facts:

- Whether `@neo4j/graphql` v7 supports Apollo Federation (its docs did not confirm).
- Whether the Mesh OpenAPI handler forwards auth headers and composes cleanly; it needs a prototype.
- `@graphql-hive/plugin-mcp` is pre-1.0 and has no built-in auth, so security would rely on the gateway's JWT layer.
- Hive Console (a self-hosted schema registry) is heavy (Postgres, ClickHouse, Redis, Redpanda, MinIO); it would be an optional compose profile.

## Also planned

Publish the repositories to a GitHub organisation (they are private and local until then), publish versioned images, pin them in compose, and add link targets between repositories in these docs once the URLs exist.
