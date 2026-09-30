# Crimson architecture

Crimson is a single-node Django application that participates in a network of other Crimson nodes. The key architectural rule is simple:

> The browser talks to its home node. Nodes talk to nodes.

That boundary keeps remote data exchange explicit and gives each node one place to enforce its own authentication, visibility, and moderation rules.

## Runtime shape

```text
Browser / alternate client
            |
            | local HTTP requests
            v
   Django templates + REST API
            |
            +--> accounts       identity and relationships
            +--> posts          entries, streams, media
            +--> interactions   comments and likes
            +--> nodes          remote-node administration
            |
            v
      relational database
            ^
            | authenticated inbox POSTs
            v
     remote Crimson nodes
```

The same Django process serves HTML, JavaScript, CSS, and API responses. In deployment, Gunicorn starts `socialdistribution.wsgi` from the `Procfile`.

## Request paths

### Local browser request

```text
browser
  → root URL router (`socialdistribution/urls.py`)
  → app URL module (`accounts/urls.py`, `posts/urls.py`, etc.)
  → view
  → permission/visibility checks
  → model query or mutation
  → HTML response or JSON response
```

### Outbound federation request

```text
local mutation
  → determine affected remote authors/inboxes
  → serialize object with its FQID
  → authenticate with configured RemoteNode credentials
  → POST object to remote inbox
  → record/log the delivery result
```

### Inbound federation request

```text
remote node POST
  → node authentication
  → identify recipient inbox
  → validate object type and required fields
  → resolve local/remote author and object FQIDs
  → persist or update the remote object
  → return an HTTP response
```

## Ownership and FQIDs

An object has a local database identity and a network identity. The database UUID or integer is useful inside one node; the FQID is the identity used across nodes.

```text
local database identity: 7
network identity:        https://node-a.example/api/authors/7/
```

Never use a remote object’s local integer as a foreign key. Store and compare the complete FQID so that `node-a/7` and `node-b/7` remain different authors.

## Visibility is part of the domain model

Visibility is not only a template concern. The same rules need to be applied to:

- stream querysets;
- direct entry URLs;
- comments and likes;
- inbox delivery decisions;
- API responses;
- deleted-entry administration.

When adding an endpoint, decide first which visibility states it can expose and which actor is allowed to call it. Then put the check in the server-side path that every relevant caller uses.

## Persistence

The database is normalized around relationships. Followers, following edges, follow requests, comments, likes, posts, and remote-node connections are rows in related tables. This keeps relationship queries indexable and avoids embedding a growing list inside a single record.

Migrations belong to the app that owns the model. Never edit an old migration to change history; create a new migration and run it through the normal Django migration command.

## Failure points to inspect

When a federated action does not appear remotely, inspect the path in this order:

1. Was the local relationship/visibility query supposed to select the recipient?
2. Was the object serialized with the expected type and FQID?
3. Did the outbound request use the configured remote-node URL and credentials?
4. Did the remote node authenticate the request?
5. Did the inbox validate and persist the object?
6. Does the receiving stream include the stored object for that viewer?

This sequence separates delivery failures from storage failures and visibility failures.
