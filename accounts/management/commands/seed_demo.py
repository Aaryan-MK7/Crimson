import os

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand, CommandError

from posts.models import Entry


class Command(BaseCommand):
    help = "Idempotently creates the shared Crimson demo identity and sample posts."

    def handle(self, *args, **options):
        if os.getenv("DEMO_MODE", "False") != "True":
            self.stdout.write("DEMO_MODE is disabled; skipping demo seed.")
            return

        username = os.getenv("DEMO_USERNAME", "demo").strip()
        password = os.getenv("DEMO_PASSWORD", "")
        if not password:
            raise CommandError("DEMO_PASSWORD is required when DEMO_MODE=True.")

        user, _ = User.objects.get_or_create(
            username=username,
            defaults={"first_name": "Crimson", "last_name": "Demo"},
        )
        user.first_name = "Crimson"
        user.last_name = "Demo"
        user.is_staff = False
        user.is_superuser = False
        user.set_password(password)
        user.save()

        author = user.author
        author.displayName = "Crimson Demo"
        author.description = "A shared account for exploring the hosted Crimson node."
        author.is_approved = True
        author.save()

        samples = (
            (
                "Welcome to the Crimson demo",
                "This is a live Crimson node. Explore authors, publish a post, and try the social workflow.",
            ),
            (
                "Communities can own their home",
                "Crimson keeps identity, moderation, and content on independently operated nodes.",
            ),
        )
        for title, content in samples:
            Entry.objects.get_or_create(
                author=user,
                title=title,
                defaults={
                    "content": content,
                    "visibility": "PUBLIC",
                    "content_type": "text/plain",
                },
            )

        self.stdout.write(self.style.SUCCESS("Crimson demo data is ready."))
