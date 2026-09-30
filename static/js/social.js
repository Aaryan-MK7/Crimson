// Shared composition, draft recovery and small navigation interactions.
(() => {
  const toast = document.getElementById('ui-toast');
  let toastTimer;
  window.crimsonToast = (message) => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
  };
  try {
    const message = sessionStorage.getItem('crimson-notice');
    if (message) { window.crimsonToast(message); sessionStorage.removeItem('crimson-notice'); }
  } catch (_) {}

  const dialog = document.getElementById('compose-dialog');
  const form = document.getElementById('compose-form');
  if (dialog && form) {
    const key = 'crimson-draft-' + dialog.dataset.userId;
    const content = form.elements.content;
    const format = form.elements.contentType;
    const file = form.elements.image;
    const imageArea = form.querySelector('.compose-image');
    const preview = document.getElementById('compose-preview');
    const error = form.querySelector('.compose-error');
    const status = document.getElementById('draft-status');
    const submit = form.querySelector('[type="submit"]');
    let submitting = false;
    const fields = ['title', 'content', 'visibility', 'contentType'];

    const syncFormat = () => {
      imageArea.hidden = format.value !== 'image';
      content.placeholder = format.value === 'image' ? 'Add a caption...' :
        format.value === 'text/markdown' ? 'Write with Markdown. Your formatting comes along.' :
        "What's on your mind?";
    };
    const saveDraft = () => {
      const draft = Object.fromEntries(fields.map(name => [name, form.elements[name].value]));
      try {
        localStorage.setItem(key, JSON.stringify(draft));
        status.textContent = 'Text draft saved on this device.';
      } catch (_) { status.textContent = 'Draft saving is unavailable in this browser.'; }
    };
    try {
      const draft = JSON.parse(localStorage.getItem(key) || 'null');
      if (draft && typeof draft === 'object') {
        fields.forEach(name => { if (typeof draft[name] === 'string') form.elements[name].value = draft[name]; });
        if (!format.value) format.value = 'text/plain';
        if (!form.elements.visibility.value) form.elements.visibility.value = 'PUBLIC';
        if (draft.content || draft.title) status.textContent = 'Your text draft is ready to continue.';
      }
    } catch (_) {}
    syncFormat();
    document.querySelectorAll('[data-compose]').forEach(button => {
      button.addEventListener('click', () => { dialog.showModal(); content.focus(); });
    });
    form.querySelector('[data-close-compose]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
    form.addEventListener('input', saveDraft);
    format.addEventListener('change', () => { syncFormat(); saveDraft(); });
    file.addEventListener('change', () => {
      preview.hidden = true;
      const selected = file.files[0];
      if (!selected) return;
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        if (file.files[0] === selected) { preview.src = reader.result; preview.hidden = false; }
      });
      reader.readAsDataURL(selected);
    });
    dialog.addEventListener('keydown', event => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (!submitting) form.requestSubmit();
      }
    });
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (submitting) return;
      error.hidden = true;
      const showError = message => { error.textContent = message; error.hidden = false; };
      if (format.value === 'image' && !file.files.length) { showError('Choose an image before publishing.'); return; }
      if (format.value !== 'image' && !content.value.trim()) { showError('Add a thought before publishing.'); content.focus(); return; }
      const headers = { 'X-CSRFToken': form.elements.csrfmiddlewaretoken.value };
      let body;
      if (format.value === 'image') body = new FormData(form);
      else {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(Object.fromEntries(fields.map(name => [name, form.elements[name].value])));
      }
      submitting = true;
      submit.disabled = true;
      submit.textContent = 'Publishing…';
      try {
        const response = await fetch('/posts/api/entries/', { method: 'POST', headers, body, credentials: 'same-origin' });
        const result = await response.json().catch(() => ({}));
        if (!response.ok || response.redirected || !result.id) throw new Error(result.error || 'Could not publish. Your draft is safe; please try again.');
        try { localStorage.removeItem(key); sessionStorage.setItem('crimson-notice', 'Your post is live. Let the conversation begin.'); } catch (_) {}
        window.location.assign('/?feed=latest');
      } catch (failure) {
        showError(failure.message || 'Connection interrupted. Your draft is safe.');
        submitting = false;
        submit.disabled = false;
        submit.textContent = 'Publish';
      }
    });
  }

  document.querySelectorAll('[data-edit-post]').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('details')?.removeAttribute('open');
      window.openEditPostDescription?.(button.dataset.editPost, button.dataset.editContent);
      document.getElementById('edit-description')?.focus();
    });
  });
  document.querySelectorAll('[data-confirm-delete]').forEach(deleteForm => {
    deleteForm.addEventListener('submit', event => {
      if (!window.confirm('Delete this post? It will be removed from your profile and feed.')) event.preventDefault();
    });
  });
  document.querySelectorAll('[data-copy-link]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(new URL(button.dataset.copyLink, window.location.origin).href);
        window.crimsonToast('Post link copied.');
      } catch (_) { window.crimsonToast('Could not copy the link. Open the post and copy its address.'); }
    });
  });
  document.addEventListener('click', event => {
    document.querySelectorAll('.feed-post-options[open]').forEach(menu => {
      if (!menu.contains(event.target)) menu.removeAttribute('open');
    });
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape') return;
    document.querySelectorAll('.feed-post-options[open]').forEach(menu => menu.removeAttribute('open'));
    document.getElementById('close-edit-description')?.click();
  });
})();
