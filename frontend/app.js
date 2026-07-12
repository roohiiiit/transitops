/* ═══════════════════════════════════════════════════════════
   TransitOps — Application Controller
   Routing, page registry, initialisation.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentPage = null;

  // ── Page Renderers Registry ──
  const pageRenderers = {};

  // Default placeholder renderer
  function placeholderRenderer(pageId) {
    const title = Layout.PAGE_TITLES[pageId] || pageId;
    return `
      <div class="placeholder-content">
        <div style="text-align: center;">
          <div style="font-family: var(--font-display); font-size: 24px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px;">
            ${title}
          </div>
          <div style="color: var(--text-muted); font-size: 13px;">
            Content goes here
          </div>
        </div>
      </div>
    `;
  }

  // ── Navigation ──
  async function navigate(pageId) {
    // Auth guard - if no token, do not use the router or shell, just show login
    if (!localStorage.getItem('transitops_token')) {
      if (window.TransitOps && window.TransitOps.showLogin) {
        window.TransitOps.showLogin();
      }
      return;
    }

    if (pageId === currentPage) return;

    currentPage = pageId;
    Layout.setActivePage(pageId);

    // Sync all data from backend whenever navigating to keep data fresh across views
    await DataLayer.syncFromBackend();

    // Use registered renderer or fallback to placeholder
    const renderer = pageRenderers[pageId];
    if (renderer) {
      const result = renderer();
      if (typeof result === 'string') {
        Layout.setPageContent(result);
      }
    } else {
      Layout.setPageContent(placeholderRenderer(pageId));
    }
  }

  // ── Register Page ──
  function registerPage(pageId, renderFn) {
    pageRenderers[pageId] = renderFn;
    if (currentPage === pageId) {
      const result = renderFn();
      if (typeof result === 'string') {
        Layout.setPageContent(result);
      }
    }
  }

  // ── Initialise ──
  document.addEventListener('DOMContentLoaded', async () => {
    if (!localStorage.getItem('transitops_token')) {
      if (window.TransitOps && window.TransitOps.showLogin) {
        window.TransitOps.showLogin();
      }
    } else {
      await DataLayer.syncFromBackend();
      Layout.create();
      const role = DataLayer.getCurrentRole();
      if (role === 'Safety Officer') navigate('safety-dashboard');
      else if (role === 'Financial Officer') navigate('finance-dashboard');
      else navigate('dashboard');
    }
  });

  // ── Public API ──
  window.TransitOps = window.TransitOps || {};
  Object.assign(window.TransitOps, {
    navigate:     navigate,
    registerPage: registerPage,
    currentPage:  () => currentPage,
  });



})();
