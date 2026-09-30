# Crimson API index

The API is organized by the domain that owns the object. The detailed documents contain request shapes, response examples, visibility notes, and endpoint-specific behavior.

## Entry points

| Document | Covers |
| --- | --- |
| [`AUTHORS.md`](AUTHORS.md) | Authors, profiles, followers, following, friends, follow requests, and inboxes |
| [`posts.md`](posts.md) | Entries, streams, visibility, FQIDs, images, edits, and deletion |
| [`INTERACTIONS_API.md`](INTERACTIONS_API.md) | Comments and likes as JSON API resources |
| [`INTERACTIONS_UI.md`](INTERACTIONS_UI.md) | Browser routes for liking and commenting |
| [`NODES.md`](NODES.md) | Remote-node administration and node-to-node authentication |
| [`UserStories.md`](UserStories.md) | User-story acceptance notes and implementation references |

## URL ownership

```text
accounts/urls.py       /api/authors/...       authors, relationships, inboxes
posts/urls.py          /posts/...             entries, streams, images
interactions/urls.py   /interactions/...      comments and likes
nodes/urls.py          /nodes/...             remote-node administration
```

The root router in `socialdistribution/urls.py` includes these modules. A browser and an alternate client use the same node; the federation layer uses inbox routes between nodes.

## Common object rules

- Responses identify network objects using full URLs/FQIDs.
- Pagination uses the endpoint’s documented page and size parameters.
- Visibility checks apply to both HTML views and API responses.
- Deleted entries are hidden from ordinary API/UI paths and retained for node administrators.
- Remote objects should be matched by FQID, never by a remote node’s local numeric ID.

## Adding an endpoint

When adding an endpoint, document:

1. Which app owns it.
2. Whether it is local-client or node-to-node traffic.
3. Authentication and visibility requirements.
4. Request fields and validation errors.
5. Response shape and FQID behavior.
6. Delivery or persistence side effects.
7. A test for a successful request and a denied request.
