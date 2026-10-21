# GRANDstack

GraphQL on Neo4j for developers and agents. A Neo4j database, a GraphQL server generated from a schema file, and a typed React app, run together with Docker Compose. The **A** now stands for **Agent**: the same GraphQL API that serves the web app is meant to serve coding agents and agentic apps.

The bundled example is a movie and people app: faceted search with live counts, compare, graph views, recommendations, frequent collaborators, and create/edit/delete, over 152 sample films and 464 people. You can keep it, change it, or replace the data and build your own ([build your own app](docs/build-your-own-app.md)).

> **There is no authentication yet.** Anyone who can reach the app or the GraphQL endpoint can read, create, edit and delete data. Run it locally and do not expose it publicly. Reset the data any time with `docker compose down -v`.

## Quickstart

You need Docker or Podman with compose. Put the three repositories in one folder, side by side:

```
grandstack-refresh/        any folder name
  grandstack/              this repository (compose and docs)
  grandstack-server/       the GraphQL server
  grandstack-web/          the React app
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

## Repositories

| Repository | What it is | Start with |
| --- | --- | --- |
| `grandstack` | Compose stack, overview, tutorial, agent guide | this README |
| `grandstack-server` | Docker image serving GraphQL over Neo4j from a schema file and env vars | its `README.md` and `docs/how-it-works.md` |
| `grandstack-web` | React app with typed operations | its `README.md` and `docs/architecture.md` |

## Documentation

| Read | To learn |
| --- | --- |
| [Architecture](docs/architecture.md) | Components, data model, request flow, why things are built this way |
| [Build your own app](docs/build-your-own-app.md) | A verified walkthrough: new schema and data, a typed front end |
| [Agent guide](docs/agents.md) | For coding agents: where to change what, checks, gotchas |
| [Configuration](docs/configuration.md) | Services, ports, settings, Podman, resetting data |
| [Versioning and releases](docs/versioning-and-releases.md) | Tags, what is released, how to cut a release |
| [Roadmap](docs/roadmap.md) | Planned work (not built yet) |
| [llms.txt](llms.txt) | An index of all of this for agents |

The sample data has real titles, casts and relationships; ratings and runtimes are approximate.

Last verified: grandstack v0.6.0 with grandstack-server v0.6.0 and grandstack-web v0.5.0, Neo4j 2026.10 community, under Podman 6 on macOS.
