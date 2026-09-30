// One real, persistent theme for every page, including forms and dialogs.
document.addEventListener('DOMContentLoaded', () => {
  const button = document.getElementById('toggle-torch');
  if (!button) return;
  function updateThemeButton() {
    const dark = document.documentElement.dataset.theme === 'dark';
    const label = dark ? 'Switch to light theme' : 'Switch to dark theme';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', String(dark));
    button.title = label;
  }
  updateThemeButton();
  button.addEventListener('click', () => {
    const theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem('crimson-theme', theme); } catch (_) {}
    updateThemeButton();
  });

  const path = window.location.pathname;
  let activeId = 'stream';
  if (path.startsWith('/authors/')) activeId = 'explore';
  if (path.startsWith('/me/')) activeId = 'profile';
  if (path.startsWith('/follow-requests/')) activeId = 'requests';
  if (path.startsWith('/node-admin/')) activeId = 'admin-approvals';
  if (path.startsWith('/posts/admin/')) activeId = 'admin-deleted';
  if (path.startsWith('/nodes/')) activeId = 'nodes';
  if (!['/login/', '/signup/', '/pending-approval/'].includes(path)) {
    document.getElementById(activeId)?.setAttribute('aria-current', 'page');
  }
});

// ── MASONRY ──
function applyMasonryRowWise() {
  const main = document.querySelector('.main-content');
  if (!main) return;
  const grid = main.querySelector('.posts-grid');
  if (!grid) return;

  const items = Array.from(grid.children);
  let COLS = 3;
  if (window.innerWidth <= 700) COLS = 1;
  else if (window.innerWidth <= 1000) COLS = 2;

  items.forEach(item => item.style.transform = 'translateY(0px)');
  let colOffset = new Array(COLS).fill(0);

  for (let i = 0; i < items.length; i += COLS) {
    const rowItems = items.slice(i, i + COLS);
    const tallest = Math.max(...rowItems.map(item => item.offsetHeight));

    if (COLS === 2 && rowItems.length === 2) {
      const h0 = rowItems[0].offsetHeight;
      const h1 = rowItems[1].offsetHeight;
      const diff = Math.abs(h0 - h1) / 2;

      if (h0 > h1) {
        rowItems[0].style.transform = `translateY(0px)`;
        rowItems[1].style.transform = `translateY(${diff}px)`;
        colOffset[0] += 0;
        colOffset[1] += diff;
      } else if (h1 > h0) {
        rowItems[0].style.transform = `translateY(${diff}px)`;
        rowItems[1].style.transform = `translateY(0px)`;
        colOffset[0] += diff;
        colOffset[1] += 0;
      } else {
        continue;
      }

      colOffset = colOffset.map(offset => offset + Math.abs(h0 - h1) / 2);

      rowItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          const t = item.style.transform.match(/translateY\([^)]+\)/);
          item.style.transform = `${t ? t[0] : 'translateY(0px)'} scale(1.015)`;
        });
        item.addEventListener('mouseleave', () => {
          const t = item.style.transform.match(/translateY\([^)]+\)/);
          item.style.transform = `${t ? t[0] : 'translateY(0px)'} scale(1)`;
        });
      });

    } else {
      rowItems.forEach((item, idx) => {
        const diff = tallest - item.offsetHeight;
        item.style.transform = `translateY(-${colOffset[idx]}px)`;

        item.addEventListener('mouseenter', () => {
          const t = item.style.transform.match(/translateY\([^)]+\)/);
          item.style.transform = `${t ? t[0] : 'translateY(0px)'} scale(1.015)`;
        });
        item.addEventListener('mouseleave', () => {
          const t = item.style.transform.match(/translateY\([^)]+\)/);
          item.style.transform = `${t ? t[0] : 'translateY(0px)'} scale(1)`;
        });

        colOffset[idx] += diff;
      });
    }
  }
}

window.addEventListener('load', applyMasonryRowWise);
window.addEventListener('resize', applyMasonryRowWise);
