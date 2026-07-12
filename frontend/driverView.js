/* ═══════════════════════════════════════════════════════════
   TransitOps — Mobile Driver View (Mission Control Redesign)
   ═══════════════════════════════════════════════════════════ */

(function () {
  'use strict';

  const API_URL = window.location.origin;
  let activeTrip = null;
  let watchId = null;
  let isBroadcasting = false;

  // ─── Inject Styles ───────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    body.driver-view-active {
      background: #0A0A0C;
      color: #F2F2F2;
      margin: 0;
      padding: 0;
      height: 100vh;
      overflow: hidden;
      font-family: var(--font-sans, 'Inter', sans-serif);
    }

    /* ── Trip Selection Screen ── */
    .driver-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
    }
    .driver-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.07);
      background: #111114;
    }
    .driver-content {
      flex: 1;
      padding: 24px 20px calc(env(safe-area-inset-bottom, 0px) + 20px);
      overflow-y: auto;
    }
    .driver-section-title {
      font-size: 13px;
      font-weight: 600;
      color: #9CA3AF;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 16px;
    }
    .driver-trip-card {
      background: #18181C;
      border: 1px solid rgba(255,255,255,0.07);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 14px;
      cursor: pointer;
      transition: border-color 0.2s, box-shadow 0.2s;
      -webkit-tap-highlight-color: transparent;
    }
    .driver-trip-card:active {
      border-color: #D4FF4F;
      box-shadow: 0 0 16px rgba(212,255,79,0.1);
    }
    .driver-trip-id {
      font-size: 11px;
      color: #D4FF4F;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin-bottom: 6px;
    }
    .driver-trip-route {
      font-size: 18px;
      font-weight: 600;
      color: #F2F2F2;
      margin-bottom: 8px;
    }
    .driver-trip-meta {
      font-size: 13px;
      color: #9CA3AF;
    }
    .driver-select-btn {
      width: 100%;
      margin-top: 16px;
      padding: 12px;
      border: none;
      border-radius: 10px;
      background: #D4FF4F;
      color: #0A0A0C;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: opacity 0.15s;
      -webkit-tap-highlight-color: transparent;
    }
    .driver-select-btn:active { opacity: 0.75; }

    .driver-empty-state {
      text-align: center;
      padding: 60px 20px;
      color: #9CA3AF;
    }
    .driver-empty-icon {
      font-size: 40px;
      margin-bottom: 16px;
    }
    .driver-empty-title {
      font-size: 18px;
      font-weight: 600;
      color: #F2F2F2;
      margin-bottom: 8px;
    }
    .driver-empty-desc {
      font-size: 14px;
    }

    /* ── Mission Control Screen ── */
    .mc-layout {
      display: flex;
      flex-direction: column;
      height: 100vh;
      width: 100vw;
      background: #0A0A0C;
    }
    .mc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: calc(env(safe-area-inset-top, 0px) + 16px) 20px 16px;
      background: #0A0A0C;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      flex-shrink: 0;
    }
    .mc-back-btn {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      background: none;
      border: none;
      color: #9CA3AF;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      padding: 8px 0;
      -webkit-tap-highlight-color: transparent;
    }
    .mc-back-btn:active { color: #F2F2F2; }
    .mc-title {
      font-size: 18px;
      font-weight: 600;
      color: #F2F2F2;
    }
    .mc-title span { color: #D4FF4F; }

    .mc-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 24px 20px calc(env(safe-area-inset-bottom, 0px) + 32px);
    }
    .mc-inner {
      max-width: 520px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
      min-height: 100%;
    }

    /* Eyebrow label */
    .mc-eyebrow {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 11px;
      font-weight: 700;
      color: #D4FF4F;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .mc-eyebrow-line {
      width: 20px;
      height: 2px;
      background: #D4FF4F;
      border-radius: 2px;
      flex-shrink: 0;
    }

    /* Route Card */
    .mc-route-card {
      background: #18181C;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 24px;
      position: relative;
      overflow: hidden;
      animation: mcSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .mc-route-card::before {
      content: '';
      position: absolute;
      top: -40px; left: -40px;
      width: 180px; height: 180px;
      background: radial-gradient(circle, rgba(212,255,79,0.08) 0%, transparent 70%);
      pointer-events: none;
    }

    .mc-route-timeline {
      display: flex;
      flex-direction: column;
      position: relative;
    }
    .mc-route-stop {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      position: relative;
    }
    .mc-stop-dot-wrap {
      display: flex;
      flex-direction: column;
      align-items: center;
      flex-shrink: 0;
      width: 16px;
    }
    .mc-stop-dot {
      width: 14px;
      height: 14px;
      border-radius: 50%;
      margin-top: 5px;
      flex-shrink: 0;
    }
    .mc-dot-origin { background: #D4FF4F; box-shadow: 0 0 8px rgba(212,255,79,0.5); }
    .mc-dot-dest {
      background: transparent;
      border: 2px dashed rgba(255,255,255,0.3);
      box-sizing: border-box;
    }
    .mc-connector {
      width: 2px;
      height: 44px;
      background: linear-gradient(to bottom, #D4FF4F, rgba(255,255,255,0.1));
      margin: 2px 0;
      flex-shrink: 0;
    }
    .mc-stop-body { flex: 1; padding-bottom: 4px; }
    .mc-city-name {
      font-size: 28px;
      font-weight: 700;
      color: #F2F2F2;
      line-height: 1.2;
      margin-bottom: 4px;
    }
    .mc-city-meta {
      font-size: 12px;
      color: #9CA3AF;
    }

    /* Status Card */
    .mc-status-card {
      background: #18181C;
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 20px;
      padding: 28px 24px;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      transition: border-color 0.4s ease, box-shadow 0.4s ease;
      position: relative;
    }
    .mc-status-card.is-offline {
      border-left: 3px solid #EF4444;
    }
    .mc-status-card.is-online {
      border-color: rgba(212,255,79,0.4);
      box-shadow: 0 0 32px rgba(212,255,79,0.06);
    }

    .mc-status-icon-wrap {
      position: relative;
      width: 56px;
      height: 56px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }
    .mc-status-svg {
      position: relative;
      z-index: 2;
      transition: color 0.4s ease;
      color: #6B7280;
    }
    .mc-status-card.is-online .mc-status-svg { color: #D4FF4F; }

    .mc-pulse-ring {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      border: 2px solid #D4FF4F;
      opacity: 0;
    }
    .mc-status-card.is-online .mc-pulse-ring {
      animation: mcPulseRing 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
    }
    .mc-status-card.is-offline .mc-pulse-ring {
      border-color: #EF4444;
      animation: mcPulseRing 3s ease-in-out infinite;
    }

    .mc-status-title {
      font-size: 18px;
      font-weight: 600;
      color: #F2F2F2;
      margin: 0 0 6px;
      transition: color 0.3s ease;
    }
    .mc-status-card.is-online .mc-status-title { color: #D4FF4F; }
    .mc-status-desc {
      font-size: 14px;
      color: #9CA3AF;
      margin: 0;
      font-family: 'JetBrains Mono', monospace;
    }

    /* CTA Button */
    .mc-cta-btn {
      width: 100%;
      min-height: 56px;
      border: none;
      border-radius: 14px;
      font-size: 16px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      cursor: pointer;
      transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.3s ease;
      -webkit-tap-highlight-color: transparent;
      background: #D4FF4F;
      color: #0A0A0C;
      box-shadow: 0 0 24px rgba(212,255,79,0.25);
      margin-top: auto;
    }
    .mc-cta-btn:hover {
      transform: scale(1.02);
      box-shadow: 0 0 32px rgba(212,255,79,0.4);
    }
    .mc-cta-btn:active {
      transform: scale(0.97);
      box-shadow: 0 0 10px rgba(212,255,79,0.1);
    }
    .mc-cta-btn.is-active {
      background: #EF4444;
      color: #fff;
      box-shadow: 0 0 24px rgba(239,68,68,0.25);
    }
    .mc-cta-btn.is-active:hover {
      box-shadow: 0 0 32px rgba(239,68,68,0.4);
    }

    /* Animations */
    @keyframes mcSlideUp {
      0%   { opacity: 0; transform: translateY(18px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    @keyframes mcPulseRing {
      0%   { transform: scale(0.85); opacity: 0.7; }
      100% { transform: scale(2.2);  opacity: 0; }
    }

    /* ── Wordmark ── */
    .wordmark { font-family: var(--font-display, 'Space Grotesk', sans-serif); font-weight: 700; letter-spacing: -0.5px; }
    .text-accent { color: #D4FF4F; }

    /* ── Desktop Enhancements ── */
    @media (min-width: 768px) {
      .mc-header {
        padding: 32px 40px 24px;
        border-bottom: none;
        max-width: 640px;
        margin: 0 auto;
        width: 100%;
        box-sizing: border-box;
      }
      .mc-scroll { padding: 16px 40px 64px; }
      .mc-inner { gap: 28px; }
      .mc-route-card { padding: 36px 40px; }
      .mc-connector { height: 56px; }
      .mc-city-name { font-size: 34px; }
      .mc-city-meta { font-size: 13px; }
      .mc-status-card { padding: 40px; }
      .mc-status-icon-wrap { width: 72px; height: 72px; }
      .mc-status-svg-inner { width: 40px; height: 40px; }
      .mc-cta-btn { min-height: 64px; font-size: 18px; }
    }
  `;
  document.head.appendChild(style);

  // ─── SVG Icons ───────────────────────────────────────────
  const ICONS = {
    back: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>`,
    broadcast: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>`,
    stop: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>`,
    signal_offline: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/><line x1="2" y1="2" x2="22" y2="22" stroke-width="2"/></svg>`,
    signal_online: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor"/></svg>`,
    alert: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`
  };

  // ─── Trip Selection Screen ────────────────────────────────
  async function create() {
    document.body.className = 'driver-view-active';
    const allTrips = DataLayer.getTrips();
    const myEmail = DataLayer.getCurrentUserEmail();
    const allDrivers = DataLayer.getDrivers();
    const myDriver = allDrivers.find(d => d.email === myEmail);
    const myDriverId = myDriver ? myDriver.id : null;

    const dispatchedTrips = allTrips.filter(t => t.status === 'Dispatched' && t.driverId === myDriverId);
    const acceptedTrips = allTrips.filter(t => t.status === 'Accepted' && t.driverId === myDriverId);
    renderSelectionScreen(dispatchedTrips, acceptedTrips);
  }

  function renderSelectionScreen(dispatchedTrips, acceptedTrips) {
    let listHtml = '';
    const trips = [...dispatchedTrips, ...acceptedTrips];

    if (trips.length === 0) {
      listHtml = `
        <div class="driver-empty-state">
          <div class="driver-empty-icon">🚦</div>
          <div class="driver-empty-title">No Active Trips</div>
          <div class="driver-empty-desc">You have no dispatched trips at the moment.<br>Check back with your fleet manager.</div>
        </div>
      `;
    } else {
      listHtml = trips.map(t => {
        const isAccepted = t.status === 'Accepted';
        return `
        <div class="driver-trip-card" onclick="window.TransitOps.DriverView.selectTrip(${t.id})">
          <div class="driver-trip-id">Trip #${String(t.id).padStart(3, '0')} <span style="float: right; color: ${isAccepted ? '#2ec4b6' : '#ff9f1c'}">${t.status}</span></div>
          <div class="driver-trip-route">${t.source} → ${t.destination}</div>
          <div class="driver-trip-meta">Cargo: ${t.cargoWeightKg} kg &nbsp;·&nbsp; ${t.plannedDistanceKm} km</div>
          <button class="driver-select-btn" style="${isAccepted ? 'background: #2ec4b6; color: #fff;' : ''}">${isAccepted ? 'Start Mission Control' : 'Accept Ride'}</button>
        </div>
      `}).join('');
    }

    document.body.innerHTML = `
      <div class="driver-layout">
        <div class="driver-header">
          <div class="wordmark" style="font-size: 19px;">Transit<span class="text-accent">Ops</span> Driver</div>
          <button class="mc-back-btn" onclick="window.TransitOps.DriverView.signOut()">Sign Out</button>
        </div>
        <div class="driver-content">
          <div class="driver-section-title">Your Dispatched Trips</div>
          ${listHtml}
        </div>
      </div>
    `;
  }

  // ─── Trip Selection ───────────────────────────────────────
  async function selectTrip(tripId) {
    let allTrips = DataLayer.getTrips();
    activeTrip = allTrips.find(t => t.id == tripId);
    
    if (activeTrip) {
      if (activeTrip.status === 'Dispatched') {
        try {
          activeTrip = await DataLayer.acceptTrip(tripId);
        } catch (err) {
          alert("Failed to accept trip.");
          return;
        }
      }
      isBroadcasting = false;
      renderActiveMissionScreen();
    }
  }

  // ─── Mission Control Screen ───────────────────────────────
  function renderActiveMissionScreen() {
    document.body.innerHTML = `
      <div class="mc-layout">

        <!-- Header -->
        <div class="mc-header">
          <button class="mc-back-btn" onclick="window.TransitOps.DriverView.goBack()">
            ${ICONS.back} Back
          </button>
          <div class="mc-title">Mission <span>Control</span></div>
        </div>

        <!-- Scrollable Content -->
        <div class="mc-scroll">
          <div class="mc-inner">

            <!-- Eyebrow -->
            <div class="mc-eyebrow">
              <div class="mc-eyebrow-line"></div>
              Active Route
            </div>

            <!-- Route Card -->
            <div class="mc-route-card">
              <div class="mc-route-timeline">
                <div class="mc-route-stop">
                  <div class="mc-stop-dot-wrap">
                    <div class="mc-stop-dot mc-dot-origin"></div>
                  </div>
                  <div class="mc-stop-body">
                    <div class="mc-city-name">${activeTrip.source}</div>
                    <div class="mc-city-meta">Departure: --:-- &nbsp;·&nbsp; Starting point</div>
                  </div>
                </div>

                <div class="mc-route-stop">
                  <div class="mc-stop-dot-wrap">
                    <div class="mc-connector"></div>
                  </div>
                  <div style="flex:1;"></div>
                </div>

                <div class="mc-route-stop">
                  <div class="mc-stop-dot-wrap">
                    <div class="mc-stop-dot mc-dot-dest"></div>
                  </div>
                  <div class="mc-stop-body">
                    <div class="mc-city-name">${activeTrip.destination}</div>
                    <div class="mc-city-meta">ETA: --:-- &nbsp;·&nbsp; ${activeTrip.plannedDistanceKm} km total</div>
                  </div>
                </div>
              </div>
            </div>

            <!-- GPS Status Card -->
            <div class="mc-status-card is-offline" id="mc-status-card">
              <div class="mc-status-icon-wrap">
                <div id="mc-status-icon" class="mc-status-svg">
                  ${ICONS.signal_offline}
                </div>
                <div class="mc-pulse-ring" id="mc-pulse-ring"></div>
              </div>
              <h3 class="mc-status-title" id="mc-status-title">GPS Offline</h3>
              <p class="mc-status-desc" id="mc-status-desc">Your location is not being broadcasted.</p>
            </div>

            <!-- CTA Button -->
            <button class="mc-cta-btn" id="mc-cta-btn" onclick="window.TransitOps.DriverView.toggleBroadcast()">
              <span id="mc-cta-icon">${ICONS.broadcast}</span>
              <span id="mc-cta-text">Start Broadcasting GPS</span>
            </button>

            <!-- Complete Ride Button -->
            <button class="mc-cta-btn" style="background: #2ec4b6; color: #fff; box-shadow: 0 0 24px rgba(46,196,182,0.25); margin-top: 12px;" onclick="window.TransitOps.DriverView.completeRide()">
              <span>✅</span>
              <span>Complete Ride</span>
            </button>

            <!-- Report Issue Button -->
            <button class="mc-cta-btn" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #F2F2F2; box-shadow: none; margin-top: 12px;" onclick="window.TransitOps.DriverView.reportIssue()">
              <span>${ICONS.alert}</span>
              <span>Report Issue</span>
            </button>


          </div>
        </div>

        <!-- Report Issue Modal -->
        <div id="mc-issue-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.85); z-index: 1000; align-items: center; justify-content: center; padding: 20px; backdrop-filter: blur(4px);">
          <div style="background: #18181C; border: 1px solid rgba(255,255,255,0.1); border-radius: 20px; padding: 28px; width: 100%; max-width: 400px; box-shadow: 0 16px 48px rgba(0,0,0,0.6); animation: mcSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);">
            <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
              <div style="width: 40px; height: 40px; border-radius: 10px; background: rgba(239,68,68,0.15); color: #EF4444; display: flex; align-items: center; justify-content: center;">
                ${ICONS.alert}
              </div>
              <h3 style="font-size: 20px; font-weight: 600; color: #F2F2F2; margin: 0;">Report Vehicle Issue</h3>
            </div>
            <p style="font-size: 14px; color: #9CA3AF; margin-bottom: 24px; line-height: 1.5;">Describe the problem you are experiencing with this vehicle. This will alert the Safety Officer immediately.</p>
            <textarea id="mc-issue-text" style="width: 100%; box-sizing: border-box; height: 120px; resize: none; margin-bottom: 24px; background: #0A0A0C; border: 1px solid rgba(255,255,255,0.15); color: #F2F2F2; border-radius: 12px; padding: 16px; font-family: 'Inter', sans-serif; font-size: 14px; outline: none; transition: border-color 0.2s;" placeholder="e.g. Engine making a knocking sound..." onfocus="this.style.borderColor='#D4FF4F'" onblur="this.style.borderColor='rgba(255,255,255,0.15)'"></textarea>
            <div style="display: flex; gap: 12px;">
              <button class="btn" style="flex: 1; background: transparent; border: 1px solid rgba(255,255,255,0.2); color: #F2F2F2; border-radius: 12px; height: 48px; font-weight: 600;" onclick="window.TransitOps.DriverView.closeIssueModal()">Cancel</button>
              <button class="btn" style="flex: 1; background: #D4FF4F; color: #0A0A0C; border: none; border-radius: 12px; height: 48px; font-weight: 600; box-shadow: 0 0 16px rgba(212,255,79,0.2);" onclick="window.TransitOps.DriverView.submitIssue()">Submit Report</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // ─── Toggle GPS Broadcast ─────────────────────────────────
  function toggleBroadcast() {
    isBroadcasting = !isBroadcasting;

    const card   = document.getElementById('mc-status-card');
    const icon   = document.getElementById('mc-status-icon');
    const title  = document.getElementById('mc-status-title');
    const desc   = document.getElementById('mc-status-desc');
    const btn    = document.getElementById('mc-cta-btn');
    const ctaIcon = document.getElementById('mc-cta-icon');
    const ctaTxt = document.getElementById('mc-cta-text');

    const token = localStorage.getItem('transitops_token');

    if (isBroadcasting) {
      card.classList.remove('is-offline');
      card.classList.add('is-online');
      icon.innerHTML = ICONS.signal_online;
      title.textContent = 'Transmitting Live';
      desc.textContent = 'Connecting to GPS satellites...';
      btn.classList.add('is-active');
      ctaIcon.innerHTML = ICONS.stop;
      ctaTxt.textContent = 'Stop Broadcasting';
      // Notify backend GPS is ON
      fetch(`${API_URL}/trips/${activeTrip.id}/gps-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ active: true })
      }).catch(e => console.error('GPS status update failed:', e));
      startGPS();
    } else {
      card.classList.remove('is-online');
      card.classList.add('is-offline');
      icon.innerHTML = ICONS.signal_offline;
      title.textContent = 'GPS Offline';
      desc.textContent = 'Your location is not being broadcasted.';
      btn.classList.remove('is-active');
      ctaIcon.innerHTML = ICONS.broadcast;
      ctaTxt.textContent = 'Start Broadcasting GPS';
      // Notify backend GPS is OFF (triggers fleet manager alert)
      fetch(`${API_URL}/trips/${activeTrip.id}/gps-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ active: false })
      }).catch(e => console.error('GPS status update failed:', e));
      stopGPS();
    }
  }

  // ─── GPS Tracking ─────────────────────────────────────────
  function startGPS() {
    if (!navigator.geolocation) {
      document.getElementById('mc-status-desc').textContent = 'Geolocation is not supported by your browser.';
      return;
    }

    const token = localStorage.getItem('transitops_token');

    watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const descEl = document.getElementById('mc-status-desc');
        if (descEl) descEl.textContent = `${lat.toFixed(5)}, ${lon.toFixed(5)}`;

        try {
          await fetch(`${API_URL}/trips/${activeTrip.id}/location`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ lat, lon })
          });
        } catch (err) {
          console.error('Failed to broadcast location:', err);
        }
      },
      (error) => {
        console.error('GPS Error:', error);
        const descEl = document.getElementById('mc-status-desc');
        if (descEl) descEl.textContent = `GPS Error: ${error.message}`;
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );
  }

  function stopGPS() {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      watchId = null;
    }
  }

  // ─── Navigation ───────────────────────────────────────────
  function goBack() {
    stopGPS();
    isBroadcasting = false;
    activeTrip = null;
    create();
  }

  function signOut() {
    stopGPS();
    localStorage.removeItem('transitops_token');
    window.TransitOps.showLogin();
  }

  // ─── Complete Ride ────────────────────────────────────────
  async function completeRide() {
    if (!activeTrip) return;
    const odo = prompt("Enter ending odometer (km):");
    if (!odo) return;
    const fuel = prompt("Enter fuel consumed (liters):");
    if (!fuel) return;

    try {
      await DataLayer.completeTrip(activeTrip.id, parseFloat(odo), parseFloat(fuel));
      alert("Ride completed successfully!");
      goBack();
    } catch (err) {
      alert("Error completing ride: " + err.message);
    }
  }

  // ─── Issue Reporting ──────────────────────────────────────
  function reportIssue() {
    if (!activeTrip) return;
    const modal = document.getElementById('mc-issue-modal');
    if (modal) {
      modal.style.display = 'flex';
      const textEl = document.getElementById('mc-issue-text');
      if (textEl) {
        textEl.value = '';
        setTimeout(() => textEl.focus(), 50);
      }
    }
  }

  function closeIssueModal() {
    const modal = document.getElementById('mc-issue-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  async function submitIssue() {
    const textEl = document.getElementById('mc-issue-text');
    if (!textEl) return;
    const msg = textEl.value.trim();
    if (!msg) {
      alert("Please enter a description.");
      return;
    }

    const token = localStorage.getItem('transitops_token');
    try {
      const btn = document.querySelector('#mc-issue-modal .btn:nth-child(2)');
      if (btn) btn.textContent = 'Submitting...';

      const res = await fetch(`${API_URL}/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          driverId: activeTrip.driverId,
          vehicleId: activeTrip.vehicleId,
          message: msg
        })
      });

      if (btn) btn.textContent = 'Submit Report';

      if (res.ok) {
        closeIssueModal();
        if (window.TransitOpsAnimations) {
          window.TransitOpsAnimations.showToast("Issue reported successfully", "success");
        } else {
          alert("Issue reported to Safety Officer successfully.");
        }
      } else {
        alert("Failed to report issue.");
      }
    } catch (err) {
      console.error(err);
      alert("Error reporting issue.");
    }
  }

  // ─── Public API ───────────────────────────────────────────
  window.TransitOps = window.TransitOps || {};
  window.TransitOps.DriverView = {
    create,
    selectTrip,
    toggleBroadcast,
    goBack,
    signOut,
    completeRide,
    reportIssue,
    closeIssueModal,
    submitIssue
  };

})();
