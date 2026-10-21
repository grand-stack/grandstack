# GRANDstack

GraphQL on Neo4j for developers and agents. This umbrella repo runs the pieces together.

```sh
cp .env.example .env
docker compose up --build
```

- Web app: http://localhost:3000
- GraphQL: http://localhost:4000/graphql
- Neo4j Browser: http://localhost:7474 (user `neo4j`, password from `.env`)

Includes Neo4j, [grandstack-server](../grandstack-server) and [grandstack-web](../grandstack-web): a movie and people search app with faceted filters, compare, graph views, recommendations, frequent collaborators and full create/edit/delete over 152 sample films and 464 people. Auth

**There is no authentication yet.** Anyone who can reach the app or the GraphQL endpoint can create, edit and delete data. Reset the sample data with `docker compose down -v`.
