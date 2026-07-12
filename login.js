/* ═══════════════════════════════════════════════════════════
   TransitOps — Login Page
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL = 'http://localhost:8000';

  function renderLoginPage() {
    document.body.className = '';
    
    const html = `
      <div class="login-container">
        <div class="login-hero">
          <div class="login-hero-bg">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="route-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                  <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" stroke-width="1"/>
                  <circle cx="30" cy="30" r="1.5" fill="rgba(212, 255, 63, 0.1)"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#route-grid)" />
              <path d="M -100 800 L 300 400 L 700 600 L 1200 100" fill="none" stroke="var(--accent)" stroke-width="2" stroke-dasharray="8 8" opacity="0.3"/>
              <circle cx="300" cy="400" r="6" fill="var(--bg-base)" stroke="var(--accent)" stroke-width="2" opacity="0.5"/>
              <circle cx="700" cy="600" r="6" fill="var(--bg-base)" stroke="var(--accent)" stroke-width="2" opacity="0.5"/>
            </svg>
          </div>
          <div class="login-hero-content">
            <div class="wordmark-full" style="font-size: 48px; margin-bottom: 16px;">
              Transit<span class="text-accent">Ops</span>
            </div>
            <div class="login-tagline font-mono uppercase text-secondary">
              Smart Transport Operations
            </div>
          </div>
        </div>
        
        <div class="login-form-panel">
          <div class="login-form-wrap">
            <h1 class="login-title">Sign In</h1>
            <p class="login-subtitle text-muted">Enter your credentials to access mission control.</p>
            
            <form id="login-form" novalidate>
              <div class="form-group" style="margin-bottom: 20px;">
                <label class="form-label" for="l-email">Email Address</label>
                <input type="email" class="form-input" id="l-email" placeholder="e.g. manager@transitops.com" required>
              </div>
              
              <div class="form-group" style="margin-bottom: 24px;">
                <label class="form-label" for="l-password">Password</label>
                <input type="password" class="form-input" id="l-password" placeholder="••••••••" required>
              </div>
              
              <div class="login-error" id="login-error"></div>
              
              <button type="submit" class="btn btn--accent login-btn" id="login-submit-btn">
                Sign In <span class="btn-icon">→</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    `;

    document.body.innerHTML = html;

    document.getElementById('login-form').addEventListener('submit', handleLogin);
  }

  async function handleLogin(e) {
    e.preventDefault();
    const emailInput = document.getElementById('l-email');
    const passInput = document.getElementById('l-password');
    const errorDiv = document.getElementById('login-error');
    const btn = document.getElementById('login-submit-btn');

    const email = emailInput.value.trim();
    const password = passInput.value;

    if (!email || !password) {
      errorDiv.textContent = 'Please enter both email and password.';
      return;
    }

    errorDiv.textContent = '';
    btn.textContent = 'Authenticating...';
    btn.disabled = true;

    try {
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      const tokenRes = await fetch(`${API_URL}/auth/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
      });

      if (!tokenRes.ok) {
        throw new Error('Invalid email or password.');
      }

      const tokenData = await tokenRes.json();
      const token = tokenData.access_token;
      
      localStorage.setItem('transitops_token', token);

      const userRes = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!userRes.ok) {
        throw new Error('Failed to retrieve user profile.');
      }

      const userData = await userRes.json();
      const role = userData.role || 'Fleet Manager';
      DataLayer.setCurrentRole(role);

      // Sync backend state arrays to local memory before starting UI
      await DataLayer.syncFromBackend();

      Layout.create();
      window.TransitOps.navigate('dashboard');

    } catch (err) {
      errorDiv.textContent = err.message || 'An error occurred during sign in.';
      btn.innerHTML = 'Sign In <span class="btn-icon">→</span>';
      btn.disabled = false;
    }
  }

  window.TransitOps = window.TransitOps || {};
  window.TransitOps.showLogin = renderLoginPage;

})();
