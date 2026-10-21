# Configuration

How the stack is wired and every setting that matters, with pointers to the repo that owns each one.

## Compose services

`compose.yaml` defines three services:

| Service | Image or build | Ports (host:container) | Notes |
| --- | --- | --- | --- |
| `neo4j` | `neo4j:2026.10-community` | 7474:7474 (browser), 7687:7687 (bolt) | Data in the named volume `neo4j-data`. Healthcheck runs `cypher-shell`; the server waits for it. |
| `server` | built from `../grandstack-server` | 4000:4000 | Needs Neo4j healthy first. |
| `web` | built from `../grandstack-web` | 3000:8080 | Static files served by unprivileged nginx. |

Because the builds use `../grandstack-server` and `../grandstack-web`, **the three repositories must sit side by side in one folder.**

## Settings you are likely to change

| Setting | Where | Default | Effect |
| --- | --- | --- | --- |
| `NEO4J_PASSWORD` | `.env` (copy from `.env.example`) | `grandstack-dev` | Neo4j password; used by Neo4j, the healthcheck and the server. Set before the first start: Neo4j stores the password in the volume. |
| Server variables (`SEED`, `SEED_PATH`, `SEED_PROBE_LABEL`, `REFRESH_COUNTS`, `CORS_ORIGIN`, `NEO4J_DATABASE`, ...) | `server.environment` in `compose.yaml` | see the server's `docs/configuration.md` | How the server behaves. Add the ones you need under `server.environment`. |
| `VITE_GRAPHQL_URL` | `web.build.args` in `compose.yaml` | `http://localhost:4000/graphql` | The URL the **browser** uses to reach the server. Fixed at build time, so rebuild `web` after changing it. |
| Host ports | `ports` in `compose.yaml` | 3000, 4000, 7474, 7687 | Change the left side to avoid clashes. If you move the web port, also set the server's `CORS_ORIGIN` to the new web origin. If you move the server port, change `VITE_GRAPHQL_URL`. |

The server's own variable list lives in `docs/configuration.md` in `grandstack-server`; it is the source of truth.

## Everyday commands

```sh
docker compose up --build        # start everything (first run builds the images)
docker compose up -d             # start in the background
docker compose logs -f server    # follow one service
docker compose down              # stop, keep the data
docker compose down -v           # stop and DELETE the Neo4j data (the sample reseeds on next start)
```

Use your own schema and data with an override file: [build your own app](build-your-own-app.md).

## Podman

On macOS `docker` may actually be Podman. If commands cannot connect, start the VM with `podman machine start` and set `DOCKER_HOST` to the socket it prints. Compose works the same way. The stack in this repo was developed and tested under Podman.

## Resetting data

There is no authentication, and the app can edit and delete everything. To get the sample data back, run `docker compose down -v` then `docker compose up`. A seed newer than the loaded one reloads by itself on server start; see the server's `docs/seeding.md`.

## If a port is already in use

If you already run Neo4j (or anything else) on one of these ports, compose may fail to bind it, or a client may reach the wrong server: on the machine this was built on, a local Neo4j listened on `127.0.0.1:7687` while the container's forwarded port was bound as well, so `bolt://localhost:7687` could hit either one. The stack itself is unaffected, because the server reaches Neo4j over the compose network (`bolt://neo4j:7687`). To avoid confusion, change the left side of the port mapping in `compose.yaml` (for example `"17687:7687"`) before connecting a tool from your machine, and check what is listening with `lsof -nP -iTCP:7687 -sTCP:LISTEN`.

## Ports at a glance

| URL | What |
| --- | --- |
| http://localhost:3000 | Web app |
| http://localhost:4000/graphql | GraphQL API and GraphiQL |
| http://localhost:7474 | Neo4j Browser (user `neo4j`, password from `.env`) |
| bolt://localhost:7687 | Neo4j Bolt |
