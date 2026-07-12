/* ═══════════════════════════════════════════════════════════
   TransitOps — Layout Shell
   Sidebar + Topbar + Content Area
   Injected once, reused by all pages.
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  // ── SVG Icon Factory ──
  function svg(paths, size) {
    const w = size || 20;
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${paths}</svg>`;
  }

  // ── Icon Paths (24×24 viewBox, Lucide-compatible) ──
  const ICONS = {
    dashboard:
      '<rect x="3" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="14" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1"/>' +
      '<rect x="14" y="14" width="7" height="7" rx="1"/>',

    vehicles:
      '<rect x="2" y="7" width="12" height="9" rx="1"/>' +
      '<path d="M14 10h3.5l2.5 3v3h-6"/>' +
      '<circle cx="6.5" cy="17.5" r="2.5"/>' +
      '<circle cx="17" cy="17.5" r="2.5"/>',

    drivers:
      '<circle cx="12" cy="8" r="4"/>' +
      '<path d="M5 21v-1a7 7 0 0 1 14 0v1"/>',

    trips:
      '<path d="M3 7l6-3 6 3 6-3v14l-6 3-6-3-6 3V7z"/>' +
      '<path d="M9 4v14"/>' +
      '<path d="M15 7v14"/>',

    maintenance:
      '<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',

    fuel:
      '<rect x="5" y="2" width="10" height="18" rx="1"/>' +
      '<line x1="4" y1="22" x2="16" y2="22"/>' +
      '<rect x="7" y="5" width="6" height="4"/>' +
      '<path d="M15 8h2.5L20 11v5a1 1 0 0 1-1 1h-1"/>',

    reports:
      '<path d="M3 3v18h18"/>' +
      '<rect x="7" y="13" width="3" height="5" rx="0.5"/>' +
      '<rect x="12" y="8" width="3" height="10" rx="0.5"/>' +
      '<rect x="17" y="11" width="3" height="7" rx="0.5"/>',

    search:
      '<circle cx="11" cy="11" r="8"/>' +
      '<path d="M21 21l-4.35-4.35"/>',
  };

  // ── Navigation Config ──
  const NAV_ITEMS = [
    { id: 'dashboard',   label: 'Dashboard',       icon: ICONS.dashboard },
    { id: 'vehicles',    label: 'Vehicles',         icon: ICONS.vehicles },
    { id: 'drivers',     label: 'Drivers',          icon: ICONS.drivers },
    { id: 'trips',       label: 'Trips',            icon: ICONS.trips },
    { id: 'create-trip', label: 'Create Trip',      icon: ICONS.trips },
    { id: 'maintenance', label: 'Maintenance',      icon: ICONS.maintenance },
    { id: 'fuel',        label: 'Fuel & Expense',   icon: ICONS.fuel },
    { id: 'reports',     label: 'Reports',          icon: ICONS.reports },
    { id: 'preview',     label: 'Table Preview',    icon: ICONS.search },
  ];

  const PAGE_TITLES = {
    dashboard:   'Dashboard',
    vehicles:    'Vehicle Registry',
    drivers:     'Driver Management',
    trips:       'Trip Management',
    'create-trip': 'Schedule New Trip',
    maintenance: 'Maintenance',
    fuel:        'Fuel & Expense',
    reports:     'Reports & Analytics',
    preview:     'Database Table Preview',
  };

  // ── Role-Based Access ──
  const ROLE_PERMISSIONS = {
    'Fleet Manager':     ['Dashboard', 'Vehicles', 'Drivers', 'Trips', 'Create Trip', 'Maintenance', 'Fuel & Expense', 'Reports', 'Table Preview'],
    'Driver':            ['Dashboard', 'Trips'],
    'Safety Officer':    ['Dashboard', 'Drivers', 'Trips', 'Create Trip'],
    'Financial Analyst': ['Dashboard', 'Vehicles', 'Fuel & Expense', 'Reports', 'Table Preview'],
  };

  const ALL_ROLES = Object.keys(ROLE_PERMISSIONS);

  // ── Get nav items for current role ──
  function getNavItemsForRole(role) {
    const allowed = ROLE_PERMISSIONS[role] || [];
    return NAV_ITEMS.filter(item => allowed.includes(item.label));
  }

  // ── Render sidebar nav (called on init and role change) ──
  function renderNav() {
    const navEl = document.getElementById('sidebar-nav');
    if (!navEl) return;

    const role = DataLayer.getCurrentRole() || 'Fleet Manager';
    const items = getNavItemsForRole(role);
    navEl.innerHTML = items.map(item => `
      <a class="nav-item" data-page="${item.id}" id="nav-${item.id}">
        <span class="nav-icon">${svg(item.icon)}</span>
        <span class="nav-label">${item.label}</span>
      </a>
    `).join('');

    // Re-bind click handlers
    navEl.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const pageId = el.dataset.page;
        if (window.TransitOps && window.TransitOps.navigate) {
          window.TransitOps.navigate(pageId);
        }
      });
    });
  }

  // ── Set role + re-render ──
  function updateRoleDisplay() {
    const role = DataLayer.getCurrentRole() || 'Fleet Manager';
    const display = document.getElementById('role-display');
    if (display) display.textContent = role;
    
    // Re-render sidebar
    renderNav();

    // If current page is no longer allowed, navigate to Dashboard
    const allowed = getNavItemsForRole(role).map(i => i.id);
    const current = window.TransitOps && window.TransitOps.currentPage();
    if (current && !allowed.includes(current)) {
      if (window.TransitOps && window.TransitOps.navigate) {
        window.TransitOps.navigate('dashboard');
      }
    } else if (current) {
      // Re-mark the active item since nav was rebuilt
      setActivePage(current);
    }
  }

  // ── Build Layout Shell ──
  function createLayout() {
    const role = DataLayer.getCurrentRole() || 'Fleet Manager';

    document.body.innerHTML = `
      <!-- ═══ SIDEBAR ═══ -->
      <aside class="sidebar" id="sidebar">
        <div class="sidebar-brand">
          <div class="wordmark">
            <span class="wordmark-full">Transit<span class="accent">Ops</span></span>
            <span class="wordmark-short"><span class="accent">T</span>·</span>
          </div>
        </div>

        <nav class="sidebar-nav" id="sidebar-nav">
          <!-- populated by renderNav() -->
        </nav>

        <div class="sidebar-footer">
          <div class="sidebar-status">
            <span class="status-dot"></span>
            <span class="sidebar-version">v1.0 · operational</span>
          </div>
        </div>
      </aside>

      <!-- ═══ TOPBAR ═══ -->
      <header class="topbar" id="topbar">
        <h1 class="page-title" id="page-title">Dashboard</h1>
        <div class="topbar-right">
          <div class="search-wrapper">
            <input type="text" class="search-input" placeholder="Search fleet..." id="global-search">
            <span class="search-icon">${svg(ICONS.search, 15)}</span>
          </div>
          <div class="role-switcher-wrapper" style="display: flex; align-items: center; gap: 12px;">
            <div style="display: flex; align-items: center;">
              <span class="role-dot"></span>
              <span id="role-display" style="font-size: 13px; font-weight: 600; color: var(--text-primary); margin-left: 8px;">${role}</span>
            </div>
            <button onclick="localStorage.removeItem('transitops_token'); window.location.reload();" class="btn btn--ghost" style="padding: 4px 8px; font-size: 12px; border: 1px solid var(--border-color); color: #ff4d4f;">Sign Out</button>
          </div>
        </div>
      </header>

      <!-- ═══ MAIN CONTENT ═══ -->
      <main class="main-content" id="main-content">
        <div id="page-content"></div>
      </main>
    `;

    // Render initial nav for current role
    renderNav();
  }

  // ── Update Active Page ──
  function setActivePage(pageId) {
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.dataset.page === pageId);
    });

    const titleEl = document.getElementById('page-title');
    if (titleEl) {
      titleEl.textContent = PAGE_TITLES[pageId] || pageId;
    }
  }

  // ── Inject Page Content with Transition ──
  function setPageContent(html) {
    const container = document.getElementById('page-content');
    if (!container) return;

    // Fade out current content
    container.style.opacity = '0';
    container.style.transition = 'opacity 100ms cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      container.classList.remove('page-enter');
      container.innerHTML = html;
      
      // Trigger stagger and number animations
      if (window.TransitOpsAnimations) {
        window.TransitOpsAnimations.initStagger(container);
        window.TransitOpsAnimations.initNumbers(container);
      }
      
      // Setup slide up start state
      container.style.transform = 'translateY(8px)';
      container.style.transition = 'none';
      void container.offsetWidth; // Force reflow
      
      // Fade in and slide up
      container.style.transition = 'opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1)';
      container.style.opacity = '1';
      container.style.transform = 'translateY(0)';
      
      // Clean up inline styles after transition
      setTimeout(() => {
        container.style.transform = '';
        container.style.transition = 'opacity 100ms cubic-bezier(0.4, 0, 0.2, 1)';
      }, 150);

    }, 100);
  }

  // ── Get Content Container (for direct DOM manipulation) ──
  function getContentElement() {
    return document.getElementById('page-content');
  }

  // ── Show / Hide Shell (for Login page) ──
  function setShellVisible(visible) {
    const sidebar = document.getElementById('sidebar');
    const topbar  = document.getElementById('topbar');
    const main    = document.getElementById('main-content');

    if (sidebar) sidebar.style.display = visible ? '' : 'none';
    if (topbar)  topbar.style.display  = visible ? '' : 'none';

    if (main) {
      main.style.marginLeft = visible ? '' : '0';
      main.style.marginTop  = visible ? '' : '0';
      main.style.height     = visible ? '' : '100vh';
    }
  }

  // ── Animations & Polish Utilities ──
  window.TransitOpsAnimations = {
    initStagger: (container) => {
      const cards = container.querySelectorAll('.stagger-card');
      cards.forEach((c, i) => {
        c.style.animation = `cardIn 150ms cubic-bezier(0.4, 0, 0.2, 1) ${i * 40}ms forwards`;
      });
    },
    
    initNumbers: (container) => {
      const numberEls = container.querySelectorAll('.animate-number');
      numberEls.forEach(el => {
        const id = el.dataset.metricId;
        const targetVal = parseFloat(el.dataset.value || el.textContent.replace(/[^0-9.-]+/g, ''));
        const prefix = el.dataset.prefix || '';
        const suffix = el.dataset.suffix || '';
        
        let startVal = 0;
        if (id && window.DataLayer && window.DataLayer.getPreviousMetric) {
          startVal = window.DataLayer.getPreviousMetric(id) || 0;
          window.DataLayer.setPreviousMetric(id, targetVal);
        }

        if (startVal === targetVal) {
          el.textContent = prefix + targetVal + suffix;
          return; 
        }

        // Animate from startVal to targetVal over 400ms
        const startTime = performance.now();
        const duration = 400;

        function update(currentTime) {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // ease-out
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          const currentVal = startVal + (targetVal - startVal) * easeProgress;
          
          el.textContent = prefix + Math.round(currentVal) + suffix;

          if (progress < 1) {
            requestAnimationFrame(update);
          } else {
            el.textContent = prefix + targetVal + suffix;
          }
        }
        requestAnimationFrame(update);
      });
    },

    showToast: (msg, type = 'success') => {
      let container = document.getElementById('toast-container');
      if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
      }

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;
      toast.textContent = msg;
      
      container.appendChild(toast);

      setTimeout(() => {
        toast.classList.add('is-closing');
        setTimeout(() => toast.remove(), 200);
      }, 3000);
    }
  };

  // ── Public API ──
  window.Layout = {
    create:          createLayout,
    setActivePage:   setActivePage,
    setPageContent:  setPageContent,
    PAGE_TITLES:     PAGE_TITLES,
    updateRoleDisplay: updateRoleDisplay,
  };

})();
