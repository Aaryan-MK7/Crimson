# Crimson development guide

This is the practical guide for running one node, exercising the federation path, and preparing a deployment.

## Local setup

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `.env` at the repository root:

```dotenv
DEBUG=True
SECRET_KEY=local-development-only
NODE_BASE_URL=http://127.0.0.1:8000
ALLOWED_HOSTS=127.0.0.1,localhost
DATABASE_URL=sqlite:///db.sqlite3
```

Prepare and run the node:

```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
python manage.py runserver
```

## Useful commands

```bash
python manage.py check                 # Django configuration checks
python manage.py test                  # application test suite
python manage.py makemigrations        # generate schema changes after model edits
python manage.py migrate               # apply schema changes
python manage.py collectstatic --noinput
```

The repository also contains development data-generation code. Use it only against a disposable local database because seed/reset operations may remove existing local records.

## Two-node local federation

Run two copies of the application with separate databases and ports. For example:

```bash
# terminal 1
DATABASE_URL=sqlite:///node_a.sqlite3 \
NODE_BASE_URL=http://127.0.0.1:8000 \
python manage.py runserver 127.0.0.1:8000

# terminal 2
DATABASE_URL=sqlite:///node_b.sqlite3 \
NODE_BASE_URL=http://127.0.0.1:8001 \
python manage.py runserver 127.0.0.1:8001
```

Create an administrator and author on each node, then use the node administration screens to configure the other node’s URL and credentials. Exercise the smallest useful federation loop:

```text
follow request → approval → public post → inbox delivery → remote like/comment
```

When testing friends-only entries, verify both directions: a permitted friend can see the entry, and an unrelated author cannot retrieve it through either the UI or API.

## Safe change workflow

1. Identify the owning app using [`PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md).
2. Change the model, view, serializer, template, or static source in that app.
3. Create a migration if the database shape changed.
4. Add or update a test for both the allowed and denied paths.
5. Update the relevant API documentation.
6. Run `check`, migrations, and tests before committing.

## Deployment checklist

- Set `DEBUG=False`.
- Use a strong `SECRET_KEY`.
- Set the public `NODE_BASE_URL`.
- Configure `ALLOWED_HOSTS` and trusted origins.
- Use PostgreSQL through `DATABASE_URL`.
- Configure media storage for production uploads.
- Run migrations and `collectstatic` during deployment.
- Confirm the node can reach each configured remote node.
- Test a real inbox request between two deployed nodes.
- Do not reuse a database between independently operated nodes.
