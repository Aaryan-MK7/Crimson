# Crimson project structure

This guide explains where a change belongs before you open the code. Crimson is a Django project organized around domain apps rather than technical layers. That means the code for a behavior usually lives together: its models, views, serializers, templates, migrations, and tests stay under the app that owns the behavior.

## The application boundary

`socialdistribution/` is the Django project package. The domain apps are:

```text
socialdistribution/
├── settings.py        environment, database, static/media, installed apps
├── urls.py            root router; includes each app’s routes
├── asgi.py            ASGI deployment entry point
└── wsgi.py            WSGI/Gunicorn deployment entry point

accounts/              identity and relationships
posts/                 entries, streams, media, post delivery
interactions/          comments, likes, interaction delivery
nodes/                 remote-node configuration and authentication
core/                  shared project-level hooks
```

The app names are referenced by `INSTALLED_APPS`, URL includes, migrations, templates, and imports. Keep these directories and Python module names stable unless you are deliberately performing a Django app migration.

## App responsibilities

### `accounts/`

This is the identity and social-graph boundary.

- `models.py` defines `Author`, `FollowRequest`, and `Follow`.
- `views.py` handles signup, login, profiles, follow flows, author APIs, and inbox processing that begins with an author.
- `serializers.py` shapes author and relationship payloads.
- `utils.py` contains identity/FQID and relationship helpers.
- `forms.py` contains browser form definitions.
- `signals.py` connects Django users to author records.
- `templates/accounts/` contains account, profile, and follow-request pages.
- `migrations/` records database changes for this app.

Change this app when the feature is about who an author is or who follows whom.

### `posts/`

This is the content and timeline boundary.

- `models.py` defines `Entry` and `HostedImage`.
- `views.py` handles entry APIs, streams, entry pages, image delivery, deletion, and hosted-image upload.
- `utils.py` supports visibility checks and delivery decisions.
- `templates/posts/` contains stream, entry-detail, and deleted-entry pages.
- `templatetags/markdown_extras.py` supports Markdown rendering in templates.
- `migrations/` records entry and media schema changes.

Change this app when the feature is about creating, viewing, editing, deleting, or delivering a post.

### `interactions/`

This is the reaction and conversation boundary.

- `models.py` defines `Comment` and `Like`.
- `views.py` exposes browser and API operations.
- `serializers.py` shapes interaction payloads.
- `templatetags/interaction_tags.py` supports interaction display in templates.
- `migrations/` records interaction schema and duplicate-prevention constraints.

Change this app when the feature is about a comment, a like, or delivery of either one.

### `nodes/`

This is the federation administration boundary.

- `models.py` defines `RemoteNode`.
- `authentication.py` contains node-to-node authentication helpers.
- `views.py` handles node-admin pages and node APIs.
- `forms.py` validates remote-node settings.
- `utils.py` supports outbound communication.
- `migrations/` records remote-node schema changes.

Change this app when the feature is about trusting, disabling, authenticating, or administering another node.

## Supporting directories

| Directory/file | Purpose | Edit policy |
| --- | --- | --- |
| `templates/` | Shared layout such as `base.html` | Edit shared page structure here |
| `static/` | Source CSS and JavaScript | Edit these files; do not edit collected output |
| `staticfiles/` | `collectstatic` output | Regenerate when needed |
| `media/` | Local uploaded/development media | Do not treat as source code |
| `docs/` | API, architecture, and operations explanations | Keep alongside behavior changes |
| `manage.py` | Django command entry point | Usually unchanged |
| `requirements.txt` | Pinned Python dependencies | Update deliberately and test deployment |
| `Procfile` | Gunicorn start command | Keep aligned with the deployment target |

## A typical feature path

For a new field on a post:

1. Update `posts/models.py`.
2. Create a migration in `posts/migrations/`.
3. Update serializers or API views if the field is public.
4. Update the relevant template and static files if it appears in the UI.
5. Update `docs/posts.md` and the user-story notes.
6. Run `python manage.py check` and `python manage.py test`.

For a new federated object:

1. Define its local representation in the owning app.
2. Give it a stable FQID representation.
3. Add inbox validation and persistence.
4. Add outbound delivery to the relevant remote inboxes.
5. Define visibility and authorization rules before adding a UI.
6. Document the payload and test both local and remote paths.
