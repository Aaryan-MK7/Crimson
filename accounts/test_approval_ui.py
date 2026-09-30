from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse


class AccountApprovalUITests(TestCase):
    def setUp(self):
        self.admin = User.objects.create_user(
            username="node-admin",
            password="test-password",
            is_staff=True,
        )
        self.pending = User.objects.create_user(
            username="new-author",
            password="test-password",
        )

    def test_staff_can_approve_a_pending_author_from_the_ui(self):
        self.client.force_login(self.admin)
        page = self.client.get(reverse("pending-authors-admin"))
        self.assertContains(page, "new-author")

        response = self.client.post(
            reverse("approve-author", args=[self.pending.author.id])
        )
        self.assertRedirects(response, reverse("pending-authors-admin"))
        self.pending.author.refresh_from_db()
        self.assertTrue(self.pending.author.is_approved)

    def test_pending_author_is_kept_on_the_approval_screen(self):
        self.client.force_login(self.pending)
        response = self.client.get(reverse("home"))
        self.assertRedirects(response, reverse("pending-approval"))
        page = self.client.get(reverse("pending-approval"))
        self.assertContains(page, "You're on the list.")
        self.assertNotContains(page, 'id="compose-dialog"')
