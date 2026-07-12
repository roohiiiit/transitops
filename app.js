/* ═══════════════════════════════════════════════════════════
   TransitOps — Application Controller
   Routing, page registry, initialisation.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  let currentPage = null;

  // ── Page Renderers Registry ──
  // Each page module can call TransitOps.registerPage(id, renderFn)
  // renderFn should return an HTML string OR directly manipulate the DOM.
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
  function navigate(pageId) {
    if (pageId === currentPage) return;

    currentPage = pageId;
    Layout.setActivePage(pageId);

    // Use registered renderer or fallback to placeholder
    const renderer = pageRenderers[pageId];
    if (renderer) {
      const result = renderer();
      // If renderer returns a string, inject it. Otherwise assume it manipulated DOM directly.
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
    // If we're already on this page, re-render with the real renderer
    if (currentPage === pageId) {
      const result = renderFn();
      if (typeof result === 'string') {
        Layout.setPageContent(result);
      }
    }
  }

  // ── Initialise ──
  document.addEventListener('DOMContentLoaded', () => {
    Layout.create();
    navigate('dashboard');
  });

  // ── Public API ──
  window.TransitOps = {
    navigate:     navigate,
    registerPage: registerPage,
    currentPage:  () => currentPage,
  };

})();
