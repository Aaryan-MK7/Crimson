# Burlywood

Burlywood is a full-stack, federated social network built from independently operated nodes. Each node is a complete Django application with its own web interface, REST API, PostgreSQL database, users, media, moderation tools, and federation settings.

Users can publish text, Markdown, and image entries; choose who can see them; follow authors on the same or another node; and exchange comments, likes, and follow requests across node boundaries. No central service owns the social graph.

## Why Burlywood

Most social platforms put identity, content, moderation, and delivery under one operator. Burlywood lets separate communities run their own nodes while still participating in one connected network. A node administrator controls local membership and trusted node connections, while each author controls their own entries and relationships.

## What it supports

- Public, unlisted, friends-only, and deleted entries.
- Text, CommonMark/Markdown, and image posts.
- Author profiles, public timelines, following, unfollowing, and mutual-friend relationships.
- Follow requests that authors can approve or reject.
- Likes and comments on entries and comments, subject to visibility rules.
- Push-based inbox delivery between nodes for entries, edits, deletions, follows, likes, and comments.
- Fully qualified object URLs (FQIDs), so authors and entries remain unambiguous across nodes.
- Node administration for author approval, author management, hosted media, and remote-node access.
- A REST API that can support alternate clients in addition to the bundled browser interface.

## Architecture

Each Burlywood node contains one web application and one relational database:

```text
Browser or alternate client
            |
            v
   Django frontend + REST API
            |
      PostgreSQL database
            ^
            |
  authenticated inbox requests
            |
   -----------------------------
   |                           |
 Node A  <----------------->  Node B
```

The frontend communicates only with the node that served it. Federation happens between node backends: when an author creates an entry or interaction, the author’s node pushes the object to the relevant inboxes on remote nodes. Remote objects are stored and addressed by their original full URL rather than by a local numeric ID.

Deleted entries are retained in the database for administrative review, but are removed from ordinary feeds, profiles, and API responses. Visibility checks are applied both to the browser UI and to API access.

## Technology

- Python and Django 6
- Django REST Framework
- PostgreSQL in deployment; SQLite is convenient for local development and tests
- Server-rendered HTML, CSS, and JavaScript served by the same Django application as the API
- Gunicorn and WhiteNoise for production serving
- Optional Cloudinary/S3-compatible media storage

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py runserver
```

Create an administrator with `python manage.py createsuperuser`, then open `http://127.0.0.1:8000/`.

For deployment, configure a secret key, allowed hosts, database URL, and media settings through environment variables. A deployed node should use PostgreSQL and its own public base URL so generated FQIDs identify the node that owns each object.

## Federation walkthrough

1. Run or deploy two Burlywood nodes with different base URLs.
2. Allow the nodes to connect and configure their remote credentials.
3. Create an author on each node.
4. Send a follow request from one author to the other and approve it.
5. Publish an entry and observe it arrive in the follower’s inbox and stream.
6. Add a comment or like from the remote node and verify that it is delivered back to the original author’s node.
7. Delete the entry and verify that the deletion propagates while the original node retains the record for its administrator.

The repository includes detailed API and user-story documentation in [`docs/`](docs/), including the node, author, entry, interaction, and federation contracts.

## Project history

This repository is a personal copy of the team project originally developed in [`Armaan231104/distributed-social-network`](https://github.com/Armaan231104/distributed-social-network). The original Git history and MIT license are preserved. The implementation and documentation include contributions from the upstream team; the upstream contribution notes should not be read as a claim about this repository owner’s individual contributions.

## License

Burlywood is distributed under the MIT License. See [`LICENSE`](LICENSE).
