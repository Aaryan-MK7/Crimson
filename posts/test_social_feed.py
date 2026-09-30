"""Keep the new feed controls inside the existing visibility boundary."""
from django.contrib.auth.models import User
from django.test import TestCase
from accounts.models import Author, Follow
from posts.models import Entry


class SocialFeedTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.viewer = User.objects.create_user("viewer", password="test-password")
        cls.friend = User.objects.create_user("friend")
        cls.stranger = User.objects.create_user("stranger")
        Author.objects.filter(user__in=[cls.viewer, cls.friend, cls.stranger]).update(is_approved=True)
        Follow.objects.create(follower=cls.viewer.author, followee=cls.friend.author)
        cls.followed_post = Entry.objects.create(author=cls.friend, title="Followed", content="searchable")
        cls.public_post = Entry.objects.create(author=cls.stranger, title="Public", content="searchable")
        cls.private_post = Entry.objects.create(author=cls.stranger, title="Private", content="searchable", visibility="FRIENDS")
        cls.deleted_post = Entry.objects.create(author=cls.friend, title="Deleted", content="searchable", visibility="DELETED")
        cls.media_post = Entry.objects.create(author=cls.friend, title="Photo", content_type="image", image_url="https://example.com/test.png")

    def setUp(self):
        self.client.force_login(self.viewer)

    def test_following_filter_excludes_other_public_and_deleted_posts(self):
        response = self.client.get("/", {"feed": "following"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(set(response.context["posts"]), {self.followed_post, self.media_post})

    def test_search_does_not_reveal_private_or_deleted_entries(self):
        response = self.client.get("/", {"q": "searchable"})
        self.assertEqual(set(response.context["posts"]), {self.followed_post, self.public_post})
        self.assertContains(response, 'Search this feed')
        self.assertContains(response, 'id="compose-dialog"')

    def test_media_filter_and_invalid_filter(self):
        response = self.client.get("/", {"feed": "media"})
        self.assertEqual(list(response.context["posts"]), [self.media_post])
        fallback = self.client.get("/", {"feed": "invalid"})
        self.assertEqual(fallback.context["active_feed"], "latest")
        self.assertNotIn(self.private_post, fallback.context["posts"])

    def test_pagination_has_stable_page_size_and_handles_bad_page(self):
        for i in range(25):
            Entry.objects.create(author=self.friend, title=f"Page entry {i}")
        first = self.client.get("/")
        self.assertEqual(len(first.context["posts"]), 20)
        self.assertTrue(first.context["page_obj"].has_next())
        invalid = self.client.get("/", {"page": "invalid"})
        self.assertEqual(invalid.status_code, 200)
        self.assertEqual(invalid.context["page_obj"].number, 1)

    def test_pending_account_cannot_access_feed_or_composer(self):
        Author.objects.filter(user=self.viewer).update(is_approved=False)
        response = self.client.get("/")
        self.assertRedirects(response, "/pending-approval/")
        pending = self.client.get("/pending-approval/")
        self.assertNotContains(pending, 'id="compose-dialog"')

    def test_author_search_keeps_pending_accounts_hidden(self):
        self.stranger.author.displayName = "Findable"
        self.stranger.author.is_approved = False
        self.stranger.author.save()
        response = self.client.get("/authors/all/", {"q": "Findable"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context["authors"].exists())

    def test_profile_and_request_pages_render_in_new_shell(self):
        for route in ("/me/", "/follow-requests/"):
            response = self.client.get(route, follow=True)
            self.assertEqual(response.status_code, 200)
            self.assertContains(response, 'class="app-nav"')
            self.assertContains(response, 'id="compose-dialog"')
