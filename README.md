# GRANDstack

GraphQL on Neo4j for developers and agents. A Neo4j database, a GraphQL server generated from a schema file, and a typed React app, run together with Docker Compose. The **A** now stands for **Agent**: the same GraphQL API that serves the web app is meant to serve coding agents and agentic apps.

The bundled example is a movie and people app: faceted search with live counts, compare, graph views, recommendations, frequent collaborators, and create/edit/delete, over 152 sample films and 464 people. You can keep it, change it, or replace the data and build your own ([build your own app](docs/build-your-own-app.md)).

> **The default stack has no authentication.** Anyone who can reach the app or the GraphQL endpoint can read, create, edit and delete data. Run it locally and do not expose it publicly. Reset the data any time with `docker compose down -v`. Login and access rules are available as an opt-in: see [Run it with authentication](#run-it-with-authentication).

## Quickstart

You need Docker or Podman with compose. Put the repositories in one folder, side by side (the first three are enough for the default stack):

```
grandstack-refresh/        any folder name
  grandstack/              this repository (compose and docs)
  grandstack-server/       the GraphQL server
  grandstack-web/          the React app
  grandstack-auth/         optional: gateway, Keycloak realm, auth rules, demo client (only for the auth setup)
  grandstack-agents/       optional: MCP server and agent examples (only for the agents setup)
```

Then:

```sh
cd grandstack
cp .env.example .env
docker compose up --build
```

| Open | To see |
| --- | --- |
| http://localhost:3000 | The web app |
| http://localhost:4000/graphql | The GraphQL API and GraphiQL |
| http://localhost:7474 | Neo4j Browser (user `neo4j`, password from `.env`, default `grandstack-dev`) |

The first start builds the images and loads the sample data. Stop with `docker compose down`; add `-v` to also delete the data.

## Run it with authentication

Opt-in, development only. This adds Keycloak (login), a gateway that checks every token, row-level rules on the server, and a demo client with a permissions playground. `grandstack-web` is not changed; against the gateway it can read but not write.

```sh
cp .env.example .env     # once, if you have not already
docker compose -f compose.yaml -f compose.auth.yaml up --build
```

| Open | To see |
| --- | --- |
| http://localhost:3001 | The auth demo client: log in as `alice` / `bob` / `carol` (password is the name plus `-pass`) |
| http://localhost:4000/graphql | The gateway: the public GraphQL endpoint (the server itself is no longer published) |
| http://localhost:8081 | Keycloak admin console (`admin` / `admin`) |

Reads stay public; writes need a login. See [`grandstack-auth`](docs/architecture.md#authentication-opt-in) and its docs for roles and rules. Stop it with `docker compose -f compose.yaml -f compose.auth.yaml down` (add `-v` to delete the data).

## Run it with agents

Add an MCP server that lets an agent run GraphQL against the (open) server:

```sh
docker compose -f compose.yaml -f compose.agents.yaml up --build
claude mcp add --transport http grandstack http://localhost:4100/mcp
```

It is read-only by default; `AGENTS_ALLOW_MUTATIONS=true` enables writes. The endpoint has no auth: keep it on your machine. See [`grandstack-agents`](docs/architecture.md#agents-opt-in).

## Repositories

| Repository | What it is | Start with |
| --- | --- | --- |
| `grandstack` | Compose stack, overview, tutorial, agent guide | this README |
| `grandstack-server` | Docker image serving GraphQL over Neo4j from a schema file and env vars | its `README.md` and `docs/how-it-works.md` |
| `grandstack-web` | React app with typed operations (open, no login) | its `README.md` and `docs/architecture.md` |
| `grandstack-auth` | Gateway, Keycloak dev realm, auth schema rules, demo client, and the exercise for adding login to `grandstack-web` | its `README.md` and `docs/how-it-works.md` |
| `grandstack-agents` | MCP server with generic GraphQL tools, a direct agent-loop example, and example code for using auth | its `README.md` and `docs/how-it-works.md` |

## Documentation

| Read | To learn |
| --- | --- |
| [Architecture](docs/architecture.md) | Components, data model, request flow, why things are built this way |
| [Build your own app](docs/build-your-own-app.md) | A verified walkthrough: new schema and data, a typed front end |
| [Agent guide](docs/agents.md) | For coding agents: where to change what, checks, gotchas |
| [Configuration](docs/configuration.md) | Services, ports, settings (including the auth setup), Podman, resetting data |
| [Versioning and releases](docs/versioning-and-releases.md) | Tags, what is released, how to cut a release |
| [Roadmap](docs/roadmap.md) | Planned work (not built yet) |
| [llms.txt](llms.txt) | An index of all of this for agents |

The sample data has real titles, casts and relationships; ratings and runtimes are approximate.

Last verified: grandstack v0.8.0 with grandstack-server v0.7.1, grandstack-web v0.5.1, grandstack-auth v0.1.1 and grandstack-agents v0.1.0, Neo4j 2026.10 community, under Podman 6 on macOS.
