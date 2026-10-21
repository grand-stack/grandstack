# Architecture

GRANDstack is a way to build apps on a Neo4j graph with GraphQL: a Neo4j database, a GraphQL server generated from a schema file, and a React client with typed operations. The **A** now stands for **Agent**: the same GraphQL API that serves the web app is meant to serve coding agents and agentic apps too. Apollo has been removed; the pieces are Neo4j's GraphQL library, GraphQL Yoga and open-source libraries that run locally in Docker.

This guide describes what is built today (versions: grandstack-server v0.7.0, grandstack-web v0.5.0, grandstack-auth v0.1.0, grandstack v0.7.0). What is planned is on the [roadmap](roadmap.md).

## Components

```
  Browser                      Docker (compose)
 +-----------------+      +---------------------------------------------+
 | React app       |      | web      nginx, static files          :3000 |
 | grandstack-web  |<-----|                                             |
 |                 |      | server   Node, GraphQL Yoga,          :4000 |
 | urql, typed ops |----->|          @neo4j/graphql v7                  |
 +-----------------+      |          (grandstack-server)                |
   POST /graphql          |             |                               |
                          |             | Bolt                          |
                          |             v                               |
                          | neo4j    Neo4j community        :7474 :7687 |
                          +---------------------------------------------+
```

- The **browser** loads the static app from `web` (port 3000) and sends GraphQL requests **directly** to `server` (port 4000). `web` does not proxy; the server allows the web origin with CORS.
- The **server** has no resolvers. It reads `schema/schema.graphql`, and `@neo4j/graphql` generates the API and translates each request into Cypher.
- **Neo4j** holds the data. Port 7474 serves Neo4j Browser (user `neo4j`, password from `.env`).

| Repository | Role | Documentation |
| --- | --- | --- |
| `grandstack` (this one) | Compose stack, overview, tutorial, agent guide | here |
| `grandstack-server` | The GraphQL server image | `docs/` in that repo |
| `grandstack-web` | The React app (open, no login) | `docs/` in that repo |
| `grandstack-auth` | Optional: gateway, Keycloak dev realm, auth rules, demo client | `docs/` in that repo |

## Data model (the sample)

```
(Person)-[:ACTED_IN {roles: [String]}]->(Movie)<-[:DIRECTED]-(Person)
                                         (Movie)-[:IN_GENRE]->(Genre)
(SeedMeta {name, version})   marker for seed versioning, not part of the API
```

- **Movie**: `title` (unique), `tagline`, `released`, `rating` (0 to 10), `runtime` (minutes).
- **Person**: `name` (unique), `born`, and the stored counts `actedCount` and `directedCount`.
- **Genre**: `name` (unique).
- `ACTED_IN` carries the character names as `roles`.
- Computed fields in the schema: `Movie.similar` (shared director, cast and genres) and `Person.collaborators` (shared films).
- 152 films, 464 people and 18 genres are bundled. The titles, casts and relationships are real; ratings and runtimes are approximate sample data.

The full field list is generated from the schema in `grandstack-server/docs/schema-reference.md`.

## A request, end to end

Example: the user ticks the Drama genre on `/movies`.

1. The React app updates the URL (`/movies?g=Drama`). The URL is the single source of truth for filters.
2. `buildWhere` turns the filters into a GraphQL `MovieWhere`, and urql sends the typed `Results` operation to `POST /graphql`.
3. Yoga builds the request context (driver, database, options) and runs the operation.
4. `@neo4j/graphql` translates it to Cypher, runs it on Neo4j, and shapes the rows into the response, including genre and decade counts computed with the *other* filters applied.
5. The component renders typed data. If it was a mutation, a server plugin first recalculates the stored film counts, so the refetch is correct.

## Authentication (opt-in)

The default stack above is open. Adding `compose.auth.yaml` puts a gateway in front of the server and adds Keycloak and a demo client:

```
  Browser (demo client :3001, or any client)
       |  OIDC login                      Authorization: Bearer <token>
       v                                              |
  Keycloak :8081  <-- JWKS (public keys) --+          v
  (dev realm, demo users)                  |   Gateway :4000 (Hive Gateway, proxy mode)
                                           |     validates the token, applies permissions per mutation
                                           |            |  forwards Authorization
                                           +--> Server (not published to the host)
                                                  verifies the token again, applies row-level rules --> Neo4j
```

- **Reads are public; writes need a login.** Roles `user`, `editor`, `moderator` map to permissions at the gateway and to row rules on the server (only a review's author or a moderator can change it).
- **Two independent checks:** the gateway answers "may this token call this mutation?"; the server answers "may it change this row?" and refuses unauthenticated writes even if reached directly.
- The server stays auth-agnostic: it only gets generic settings (`AUTH_*` to verify tokens, `SCHEMA_EXTRA_PATHS` to load extra schema). The `User` and `Review` types and every rule live in `grandstack-auth` and are mounted in.
- **`grandstack-web` is deliberately unchanged.** Through the gateway it is an anonymous client: reading works, writing is refused. Adding login to it is a documented exercise in `grandstack-auth`.
- Details, roles, responses and what to change for production: the `grandstack-auth` repository's `docs/how-it-works.md`.

## Design decisions and why

| Decision | Reason |
| --- | --- |
| Generate the API from a schema file with `@neo4j/graphql` rather than writing resolvers | The schema is the single description of the API, which is easy for people and agents to read and change; filters, sorting and nested writes come for free. |
| GraphQL Yoga, no Apollo | The brief removes Apollo; Yoga is the Guild's lightweight server with a plugin system we use. |
| Schema and seed are mounted files, configuration is environment variables | The same image serves any data model. See [build your own app](build-your-own-app.md). |
| Seed has a version and a marker node; data it did not load is never touched | A newer seed reloads cleanly, and pointing the server at your own Neo4j never overwrites your data. |
| Film counts stored on `Person` and refreshed by a plugin after every mutation | Computed (`@cypher`) fields cannot be sorted or filtered in plain GraphQL, and a plugin keeps every client (UI, `curl`, agent) correct without knowing about it. |
| Relationship edits are sent as diffs, never "disconnect all, then connect" | In `@neo4j/graphql` v7 the disconnect runs last and removes the new links. |
| Names and titles are the keys (unique constraints), so there are no ids | It keeps the sample readable and URLs meaningful; the cost is that renames change URLs and duplicates are rejected. |
| Filters live in the URL | Results are shareable and reloadable and the back button works. |
| Posters and avatars are generated from the text | No image licensing, no assets to host. |
| Needle-style look reimplemented, `@neo4j-ndl/*` not used | Those packages are GPL-3.0 and this project is Apache-2.0. The tokens are approximations, not verified against Needle. |
| `react-force-graph-2d` for graph views | MIT-licensed; Neo4j's own NVL has a custom licence. |
| Separate repos, versioned with semver tags | Each piece can be cloned and used alone; the umbrella records which versions work together. |
| Community Neo4j, database `neo4j` | It runs locally with no licence; community supports a single database. |
| Auth as a gateway plus server rules, in its own repo, opt-in | Authentication is orthogonal to the app: the gateway can front any GraphQL server, the server stays generic, the default quickstart stays zero-config, and `grandstack-web` shows what an app looks like before login. |
| Both the gateway and the server verify the token | Defence in depth: the server is safe even if reached directly. |
| Permissions at the gateway are derived from roles | Keycloak grants OAuth scopes per client, not per user, so roles are what differ between users; the gateway also accepts `permissions` and `scope` claims for other providers. |
| Row-level `filter` rules, not `validate`; ISO strings, not `DateTime` | `validate` rules and `DateTime` reads need Neo4j's APOC plugin, which this stack does not include. |
| Reviews are created by a custom mutation using the token's `sub` | The author cannot be spoofed because clients cannot pass one; the generated create is removed. |

## Limits today

- **The default stack has no authentication.** Anyone who can reach the server can read, create, edit and delete everything. Do not expose it publicly. The opt-in auth setup is development-only too (Keycloak dev mode, demo users, plain HTTP); see `grandstack-auth` for what production would need.
- The compose file builds the server and web images from sibling checkouts; it does not pull published images yet ([versioning](versioning-and-releases.md)).
- Everything runs on one machine in Docker or Podman; there is no production deployment recipe.
