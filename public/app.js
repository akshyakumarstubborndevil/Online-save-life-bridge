
// ============================================================================
// Online Save Life Bridge - Core Client Engine
// Hyper-local Community Emergency Network
// Authentication Integrated Version
// ============================================================================

// APPLICATION STATE
const state = {
  mode: 'victim',
  userLat: 12.9716,
  userLng: 77.5946,
  gpsLocked: false,
  selectedCategory: 'Medical',
  selectedCategoryIcon: 'fa-briefcase-medical',
  activeSosId: null,
  sosTimerInterval: null,
  sosSecondsElapsed: 0,
  sirenActive: false,
  strobeActive: false,
  cprActive: false,
  cprInterval: null,
  alerts: [],
  map: null,
  userMarker: null,
  radarCircle: null,
  alertMarkers: {},
  responderMarkers: [],
  routeLine: null,
  ws: null,
  wsReconnectTimer: null,
  appStarted: false,
  sosPending: false
};

// AUDIO VARIABLES
let audioCtx = null;
let sirenOsc = null;
let sirenMod = null;
let sirenGain = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }

  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  return audioCtx;
}

// ============================================================================
// AUDIO SIREN
// ============================================================================

function toggleSiren(forceState = null) {
  const shouldActive = forceState !== null
    ? forceState
    : !state.sirenActive;

  if (shouldActive) {
    if (state.sirenActive) return;

    try {
      const ctx = getAudioContext();

      sirenOsc = ctx.createOscillator();
      sirenMod = ctx.createOscillator();
      sirenGain = ctx.createGain();

      const modGain = ctx.createGain();

      sirenOsc.type = 'sawtooth';
      sirenMod.type = 'sine';
      sirenMod.frequency.value = 1.5;

      modGain.gain.value = 250;
      sirenOsc.frequency.value = 750;

      sirenMod.connect(modGain);
      modGain.connect(sirenOsc.frequency);

      sirenGain.gain.value = 0.2;

      sirenOsc.connect(sirenGain);
      sirenGain.connect(ctx.destination);

      sirenOsc.start();
      sirenMod.start();

      state.sirenActive = true;

      const label = document.getElementById('sirenLabel');
      const button = document.getElementById('btnToggleSiren');

      if (label) label.textContent = 'Audio Siren: ON';

      if (button) {
        button.classList.add('border-rose-500', 'text-rose-400');
      }

    } catch (error) {
      console.warn('Audio Siren Error:', error);
    }

  } else {
    if (sirenOsc) {
      try {
        sirenOsc.stop();
        sirenMod.stop();
        sirenOsc.disconnect();
      } catch (error) {}

      sirenOsc = null;
      sirenMod = null;
      sirenGain = null;
    }

    state.sirenActive = false;

    const label = document.getElementById('sirenLabel');
    const button = document.getElementById('btnToggleSiren');

    if (label) label.textContent = 'Audio Siren: OFF';

    if (button) {
      button.classList.remove('border-rose-500', 'text-rose-400');
    }
  }
}

// ============================================================================
// STROBE LIGHT
// ============================================================================

function toggleStrobe(forceState = null) {
  const shouldActive = forceState !== null
    ? forceState
    : !state.strobeActive;

  const overlay = document.getElementById('strobeOverlay');

  if (!overlay) return;

  if (shouldActive) {
    overlay.classList.add('strobe-active');
    state.strobeActive = true;

    const label = document.getElementById('strobeLabel');
    const button = document.getElementById('btnToggleStrobe');

    if (label) label.textContent = 'Strobe Light: ON';

    if (button) {
      button.classList.add('border-amber-500', 'text-amber-400');
    }

  } else {
    overlay.classList.remove('strobe-active');
    state.strobeActive = false;

    const label = document.getElementById('strobeLabel');
    const button = document.getElementById('btnToggleStrobe');

    if (label) label.textContent = 'Strobe Light: OFF';

    if (button) {
      button.classList.remove('border-amber-500', 'text-amber-400');
    }
  }
}

// ============================================================================
// CPR METRONOME
// ============================================================================

function playCprBeep() {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'triangle';
  osc.frequency.setValueAtTime(880, ctx.currentTime);

  gain.gain.setValueAtTime(0.3, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(
    0.001,
    ctx.currentTime + 0.08
  );

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.09);

  const circle = document.getElementById('cprPulseCircle');

  if (circle) {
    circle.classList.add('scale-125', 'bg-amber-500/40');

    setTimeout(() => {
      circle.classList.remove('scale-125', 'bg-amber-500/40');
    }, 100);
  }
}

function toggleCprMetronome() {
  const btnText = document.getElementById('cprPlayText');
  const btnIcon = document.getElementById('cprPlayIcon');

  if (state.cprActive) {
    clearInterval(state.cprInterval);

    state.cprActive = false;

    if (btnText) btnText.textContent = 'Start CPR Audio Rhythm';
    if (btnIcon) btnIcon.className = 'fa-solid fa-play';

  } else {
    state.cprActive = true;

    if (btnText) btnText.textContent = 'Stop Metronome';
    if (btnIcon) btnIcon.className = 'fa-solid fa-stop';

    playCprBeep();
    state.cprInterval = setInterval(playCprBeep, 545);
  }
}

// ============================================================================
// LEAFLET MAP
// ============================================================================

function initMap() {
  if (state.map) return;

  if (typeof L === 'undefined') {
    console.error('Leaflet library not loaded.');
    return;
  }

  const mapElement = document.getElementById('map');

  if (!mapElement) {
    console.error('Map element not found.');
    return;
  }

  state.map = L.map('map', {
    zoomControl: false
  }).setView([state.userLat, state.userLng], 15);

  L.control.zoom({
    position: 'bottomright'
  }).addTo(state.map);

  L.tileLayer(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }
  ).addTo(state.map);

  state.radarCircle = L.circle(
    [state.userLat, state.userLng],
    {
      radius: 1000,
      color: '#f43f5e',
      weight: 2,
      dashArray: '6, 8',
      fillColor: '#f43f5e',
      fillOpacity: 0.05
    }
  ).addTo(state.map);

  const userIcon = L.divIcon({
    className: 'custom-user-pin',
    html: `
      <div style="position:relative;width:24px;height:24px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;width:32px;height:32px;border-radius:50%;background:rgba(14,165,233,0.3);animation:ping 2s infinite;"></div>
        <div style="width:16px;height:16px;border-radius:50%;background:#0ea5e9;border:3px solid white;box-shadow:0 0 10px #0ea5e9;"></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });

  state.userMarker = L.marker(
    [state.userLat, state.userLng],
    { icon: userIcon }
  ).addTo(state.map);

  state.userMarker.bindPopup(
    '<strong style="color:#38bdf8">Your Current Location</strong><br><span style="font-size:11px">Radar Active (1.0 km radius)</span>'
  );

  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        state.userLat = pos.coords.latitude;
        state.userLng = pos.coords.longitude;
        state.gpsLocked = true;

        const gpsText = document.getElementById('gpsStatusText');

        if (gpsText) {
          gpsText.textContent =
            `GPS: Locked (${state.userLat.toFixed(4)}, ${state.userLng.toFixed(4)})`;
        }

        state.userMarker.setLatLng([
          state.userLat,
          state.userLng
        ]);

        state.radarCircle.setLatLng([
          state.userLat,
          state.userLng
        ]);

        state.map.setView([
          state.userLat,
          state.userLng
        ], 15);

        spawnSimulatedGuardians();
      },

      (error) => {
        console.warn('GPS unavailable. Using demo coordinates:', error);

        const gpsText = document.getElementById('gpsStatusText');

        if (gpsText) {
          gpsText.textContent = 'GPS: Simulated Location';
        }

        spawnSimulatedGuardians();
      },

      {
        enableHighAccuracy: true,
        timeout: 8000
      }
    );

  } else {
    const gpsText = document.getElementById('gpsStatusText');

    if (gpsText) {
      gpsText.textContent = 'GPS: Unsupported browser';
    }

    spawnSimulatedGuardians();
  }
}

// ============================================================================
// SIMULATED GUARDIANS - DEMO ONLY
// ============================================================================

function spawnSimulatedGuardians() {
  if (!state.map) return;

  state.responderMarkers.forEach(marker => {
    state.map.removeLayer(marker);
  });

  state.responderMarkers = [];

  const volunteers = [
    {
      name: 'Dr. Sameer (First Aid)',
      offsetLat: 0.0035,
      offsetLng: 0.0028,
      dist: '410m away'
    },
    {
      name: 'Pooja K. (Nursing Student)',
      offsetLat: -0.0025,
      offsetLng: 0.0041,
      dist: '520m away'
    },
    {
      name: 'Arun R. (Red Cross Volunteer)',
      offsetLat: 0.0041,
      offsetLng: -0.0032,
      dist: '650m away'
    },
    {
      name: 'Kavita M. (Citizen Guardian)',
      offsetLat: -0.0045,
      offsetLng: -0.0021,
      dist: '710m away'
    }
  ];

  volunteers.forEach(volunteer => {
    const vLat = state.userLat + volunteer.offsetLat;
    const vLng = state.userLng + volunteer.offsetLng;

    const vIcon = L.divIcon({
      className: 'custom-responder-pin',
      html: `<i class="fa-solid fa-shield-heart" title="${volunteer.name}"></i>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    const marker = L.marker(
      [vLat, vLng],
      { icon: vIcon }
    ).addTo(state.map);

    marker.bindPopup(`
      <div style="font-size:12px;line-height:1.4;">
        <strong style="color:#38bdf8">${volunteer.name}</strong><br>
        <span style="color:#94a3b8">Simulated Demo Responder</span><br>
        <span style="color:#10b981;font-weight:bold">${volunteer.dist}</span>
      </div>
    `);

    state.responderMarkers.push(marker);
  });
}

// ============================================================================
// WEBSOCKET CONNECTION
// ============================================================================

function initWebSocket() {
  if (!state.appStarted) return;

  if (
    state.ws &&
    (
      state.ws.readyState === WebSocket.OPEN ||
      state.ws.readyState === WebSocket.CONNECTING
    )
  ) {
    return;
  }

  const protocol = window.location.protocol === 'https:'
    ? 'wss:'
    : 'ws:';

  const wsUrl = `${protocol}//${window.location.host}`;

  state.ws = new WebSocket(wsUrl);

  state.ws.onopen = () => {
    console.log('Connected to Save Life Bridge WebSocket Server.');
  };

  state.ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);

      // Initial server alerts
      if (data.type === 'INIT_STATE') {
        state.alerts = data.alerts || [];
        renderAlerts();
      }

      // Server confirms the actual SOS ID
      else if (data.type === 'SOS_CREATED') {
        if (data.alert && data.alert.id) {
          state.activeSosId = data.alert.id;
          state.sosPending = false;

          console.log('SOS created. Server Alert ID:', state.activeSosId);
        }
      }

      // New emergency
      else if (data.type === 'NEW_SOS_ALERT') {
        if (
          data.alert &&
          !state.alerts.find(alert => alert.id === data.alert.id)
        ) {
          state.alerts.unshift(data.alert);
          renderAlerts();
          showEmergencyBanner(data.alert);
        }
      }

      // Alert updated
      else if (data.type === 'ALERT_UPDATED') {
        const idx = state.alerts.findIndex(
          alert => alert.id === data.alert.id
        );

        if (idx !== -1) {
          state.alerts[idx] = data.alert;
        } else {
          state.alerts.unshift(data.alert);
        }

        renderAlerts();

        if (state.activeSosId === data.alert.id) {
          const countEl = document.getElementById(
            'activeRespondersCount'
          );

          if (countEl) {
            countEl.textContent =
              `${data.alert.respondersCount || 1} Volunteer(s) En Route!`;

            countEl.classList.add('text-emerald-400');
          }

          showEmergencyBanner({
            category: 'Responder En Route!',
            victimName: data.responder
              ? `${data.responder.name} is on the way (ETA: ${data.responder.etaMinutes} mins)`
              : 'Volunteer is reaching you'
          });
        }
      }

      // Alert resolved
      else if (data.type === 'ALERT_RESOLVED') {
        state.alerts = state.alerts.filter(
          alert => alert.id !== data.alertId
        );

        renderAlerts();

        if (state.activeSosId === data.alertId) {
          handleSosResolved();
        }
      }

    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  };

  state.ws.onerror = (error) => {
    console.error('WebSocket connection error:', error);
  };

  state.ws.onclose = () => {
    console.log('WebSocket disconnected.');

    if (state.appStarted) {
      clearTimeout(state.wsReconnectTimer);

      state.wsReconnectTimer = setTimeout(() => {
        initWebSocket();
      }, 3000);
    }
  };
}

// ============================================================================
// SOS HOLD BUTTON
// ============================================================================

let holdStartTime = null;
let holdTimer = null;

const HOLD_DURATION = 2000;

function setupHoldTrigger() {
  const btn = document.getElementById('sosTriggerButton');
  const progress = document.getElementById('holdProgressCircle');
  const statusText = document.getElementById('holdStatusText');

  if (!btn || !progress || !statusText) return;

  const circumference = 2 * Math.PI * 54;

  function startHold(event) {
    event.preventDefault();

    if (state.activeSosId || state.sosPending) return;

    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      statusText.textContent =
        'Server connection unavailable. Please wait and try again.';

      return;
    }

    if (holdTimer) return;

    holdStartTime = Date.now();

    statusText.textContent =
      'Hold steady... Broadcasting in 2 seconds!';

    statusText.classList.add(
      'text-rose-400',
      'animate-pulse'
    );

    holdTimer = setInterval(() => {
      const elapsed = Date.now() - holdStartTime;

      const percentage = Math.min(
        elapsed / HOLD_DURATION,
        1
      );

      const offset =
        circumference - percentage * circumference;

      progress.style.strokeDashoffset = offset;

      if (elapsed >= HOLD_DURATION) {
        clearInterval(holdTimer);
        holdTimer = null;

        triggerEmergencySos();
      }
    }, 30);
  }

  function cancelHold() {
    if (holdTimer) {
      clearInterval(holdTimer);
      holdTimer = null;
    }

    progress.style.strokeDashoffset = circumference;

    if (!state.activeSosId && !state.sosPending) {
      statusText.textContent =
        'Press and hold for 2 seconds to activate';

      statusText.classList.remove(
        'text-rose-400',
        'animate-pulse'
      );
    }
  }

  btn.addEventListener('mousedown', startHold);
  btn.addEventListener('touchstart', startHold, {
    passive: false
  });

  window.addEventListener('mouseup', cancelHold);
  window.addEventListener('touchend', cancelHold);
  window.addEventListener('touchcancel', cancelHold);
}

// ============================================================================
// TRIGGER SOS
// ============================================================================

function triggerEmergencySos() {
  if (state.activeSosId || state.sosPending) return;

  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    alert('Server connection unavailable. Please try again.');
    return;
  }

  const profile = getIceProfile();

  const newAlert = {
    category: state.selectedCategory,
    categoryIcon: state.selectedCategoryIcon,
    victimName: profile.name || 'Citizen in Danger',
    phone: profile.phone1 || '',
    lat: state.userLat,
    lng: state.userLng,
    bloodGroup: profile.blood || 'Not specified',
    allergies: profile.allergies || 'None listed',
    medicalNote: 'Immediate assistance requested by victim via Panic Button',
    emergencyContacts: [
      profile.phone1,
      profile.phone2
    ].filter(Boolean)
  };

  state.sosPending = true;
  state.sosSecondsElapsed = 0;

  state.ws.send(JSON.stringify({
    type: 'TRIGGER_SOS',
    ...newAlert
  }));

  // Start visual emergency indicators
  toggleSiren(true);
  toggleStrobe(true);

  const activeCard = document.getElementById('activeSosCard');
  const categoryName = document.getElementById('activeCategoryName');
  const holdStatus = document.getElementById('holdStatusText');

  if (activeCard) {
    activeCard.classList.remove('hidden');
  }

  if (categoryName) {
    categoryName.textContent = state.selectedCategory;
  }

  if (holdStatus) {
    holdStatus.textContent =
      'EMERGENCY REQUEST SENT - WAITING FOR SERVER CONFIRMATION';

    holdStatus.className =
      'text-xs font-black text-rose-500 mt-4 text-center animate-pulse';
  }

  // Timer
  if (state.sosTimerInterval) {
    clearInterval(state.sosTimerInterval);
  }

  state.sosTimerInterval = setInterval(() => {
    state.sosSecondsElapsed++;

    const minutes = String(
      Math.floor(state.sosSecondsElapsed / 60)
    ).padStart(2, '0');

    const seconds = String(
      state.sosSecondsElapsed % 60
    ).padStart(2, '0');

    const timerEl = document.getElementById('activeTimerText');

    if (timerEl) {
      timerEl.textContent = `${minutes}:${seconds}`;
    }
  }, 1000);

  // Demo auto-accept is intentionally disabled.
  // A real responder must accept the alert from the Guardian panel.
}

// ============================================================================
// RESOLVE SOS
// ============================================================================

function handleSosResolved() {
  if (state.sosTimerInterval) {
    clearInterval(state.sosTimerInterval);
    state.sosTimerInterval = null;
  }

  state.activeSosId = null;
  state.sosPending = false;

  toggleSiren(false);
  toggleStrobe(false);

  const activeCard = document.getElementById('activeSosCard');
  const holdStatus = document.getElementById('holdStatusText');

  if (activeCard) {
    activeCard.classList.add('hidden');
  }

  if (holdStatus) {
    holdStatus.textContent =
      'Emergency resolved. You are marked safe.';

    holdStatus.className =
      'text-xs font-semibold text-emerald-400 mt-4 text-center';
  }

  if (state.routeLine && state.map) {
    state.map.removeLayer(state.routeLine);
    state.routeLine = null;
  }
}

// ============================================================================
// RENDER ALERTS
// ============================================================================

function renderAlerts() {
  const container = document.getElementById('alertsContainer');
  const countBadge = document.getElementById('alertCountBadge');

  if (!container || !state.map) return;

  Object.values(state.alertMarkers).forEach(marker => {
    state.map.removeLayer(marker);
  });

  state.alertMarkers = {};

  container.innerHTML = '';

  if (countBadge) {
    countBadge.textContent = state.alerts.length;
  }

  if (state.alerts.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-slate-500 text-xs">
        <i class="fa-solid fa-check-circle text-2xl text-emerald-500 mb-2"></i>
        <p>No active emergencies in your 1-km radar sector.</p>
        <p class="text-[10px] text-slate-600 mt-1">
          Ready to respond as a Community Guardian.
        </p>
      </div>
    `;

    return;
  }

  state.alerts.forEach(alert => {
    if (
      typeof alert.lat !== 'number' ||
      typeof alert.lng !== 'number'
    ) {
      return;
    }

    const alertIcon = L.divIcon({
      className: 'custom-victim-pin',
      html: `
        <div class="pin-wave"></div>
        <div class="pin-core">
          <i class="fa-solid ${alert.categoryIcon || 'fa-triangle-exclamation'}"></i>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    const marker = L.marker(
      [alert.lat, alert.lng],
      { icon: alertIcon }
    ).addTo(state.map);

    const safeCategory = escapeHtml(alert.category || 'Emergency');
    const safeName = escapeHtml(alert.victimName || 'Citizen');
    const safeBlood = escapeHtml(alert.bloodGroup || 'Not specified');
    const safeAllergies = escapeHtml(alert.allergies || 'Not specified');

    marker.bindPopup(`
      <div style="font-size:12px;line-height:1.4;min-width:180px;">
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
          <span style="background:#e11d48;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;">
            ${safeCategory}
          </span>
          <span style="color:#10b981;font-weight:bold;">EMERGENCY</span>
        </div>

        <strong style="color:white;font-size:13px;">${safeName}</strong><br>

        <span style="color:#94a3b8">Blood Group: </span>
        <strong style="color:#f43f5e">${safeBlood}</strong><br>

        <span style="color:#94a3b8">Allergies: </span>
        <span style="color:#cbd5e1">${safeAllergies}</span><br>

        <button onclick="acceptAlert('${alert.id}', ${alert.lat}, ${alert.lng})"
          style="margin-top:8px;width:100%;background:#0284c7;color:white;border:none;padding:6px;border-radius:8px;font-weight:bold;cursor:pointer;">
          I'm En Route (Respond)
        </button>
      </div>
    `);

    state.alertMarkers[alert.id] = marker;

    const card = document.createElement('div');

    card.className =
      'p-3.5 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-sky-500/50 transition shadow-lg space-y-2.5';

    card.innerHTML = `
      <div class="flex items-start justify-between">
        <div class="flex items-center space-x-2.5">
          <div class="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
            <i class="fa-solid ${alert.categoryIcon || 'fa-triangle-exclamation'}"></i>
          </div>

          <div>
            <div class="text-xs font-black text-white">
              ${safeCategory} Emergency
            </div>

            <div class="text-[11px] text-slate-400">
              ${safeName}
            </div>
          </div>
        </div>

        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${
          alert.status === 'EN_ROUTE'
            ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
            : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
        }">
          ${escapeHtml(alert.status || 'ACTIVE')}
        </span>
      </div>

      <div class="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 grid grid-cols-2 gap-1">
        <div>
          <span class="text-slate-500">Blood:</span>
          <span class="font-bold text-rose-400">${safeBlood}</span>
        </div>

        <div>
          <span class="text-slate-500">Allergies:</span>
          <span class="text-slate-300">${safeAllergies}</span>
        </div>
      </div>

      <div class="flex items-center space-x-2 pt-1">
        <button onclick="acceptAlert('${alert.id}', ${alert.lat}, ${alert.lng})"
          class="flex-1 py-1.5 px-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1">
          <i class="fa-solid fa-person-running"></i>
          <span>Respond (En Route)</span>
        </button>

        <button onclick="focusAlertMap(${alert.lat}, ${alert.lng})"
          class="py-1.5 px-3 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold transition"
          title="Focus Map">
          <i class="fa-solid fa-location-dot"></i>
        </button>
      </div>
    `;

    container.appendChild(card);
  });
}

// ============================================================================
// HTML ESCAPE HELPER
// ============================================================================

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, character => {
    const entities = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    };

    return entities[character];
  });
}

// ============================================================================
// ACCEPT ALERT
// ============================================================================

window.acceptAlert = function(alertId, targetLat, targetLng) {
  if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
    alert('Server connection unavailable. Please try again.');
    return;
  }

  state.ws.send(JSON.stringify({
    type: 'RESPONDER_ACCEPT',
    alertId: alertId,
    responderName: window.currentUser?.name || 'Community Guardian',
    etaMinutes: 3,
    distanceMeters: 350
  }));

  if (state.routeLine && state.map) {
    state.map.removeLayer(state.routeLine);
  }

  state.routeLine = L.polyline(
    [
      [state.userLat, state.userLng],
      [targetLat, targetLng]
    ],
    {
      color: '#0284c7',
      weight: 4,
      dashArray: '8, 8',
      opacity: 0.9
    }
  ).addTo(state.map);

  state.map.fitBounds(
    state.routeLine.getBounds(),
    { padding: [40, 40] }
  );

  showEmergencyBanner({
    category: 'Route Locked!',
    victimName: 'Demo route displayed. Follow verified emergency guidance.'
  });
};

window.focusAlertMap = function(lat, lng) {
  if (state.map) {
    state.map.flyTo([lat, lng], 17, {
      duration: 1.2
    });
  }
};

// ============================================================================
// EMERGENCY NOTIFICATION BANNER
// ============================================================================

function showEmergencyBanner(alert) {
  const banner = document.getElementById('alertNotificationBanner');
  const text = document.getElementById('bannerText');

  if (!banner || !text) return;

  text.textContent =
    `🚨 [${String(alert.category || 'Emergency').toUpperCase()}] ${alert.victimName || 'Citizen'}: COMMUNITY HELP REQUESTED!`;

  banner.classList.remove('hidden');

  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.value = 800;
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.2);

  } catch (error) {}

  setTimeout(() => {
    banner.classList.add('hidden');
  }, 9000);
}

window.dismissBanner = function() {
  const banner = document.getElementById('alertNotificationBanner');

  if (banner) {
    banner.classList.add('hidden');
  }
};

// ============================================================================
// WHATSAPP SOS
// ============================================================================

function shareWhatsAppSOS() {
  const profile = getIceProfile();

  const mapsUrl =
    `https://www.google.com/maps?q=${state.userLat},${state.userLng}`;

  const message = `
🚨 EMERGENCY ALERT! 🚨

I am in an emergency situation (${state.selectedCategory}) and need immediate assistance.

📍 My Location:
${mapsUrl}

🩸 Blood Group: ${profile.blood || 'Not specified'}
⚠️ Conditions: ${profile.allergies || 'Not specified'}

Please send help immediately or call 112.
  `.trim();

  const encoded = encodeURIComponent(message);

  window.open(
    `https://api.whatsapp.com/send?text=${encoded}`,
    '_blank'
  );
}

// ============================================================================
// ICE PROFILE
// ============================================================================

function getIceProfile() {
  const saved = localStorage.getItem('savelife_ice');

  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {}
  }

  return {
    name: '',
    blood: '',
    allergies: '',
    phone1: '',
    phone2: ''
  };
}

function saveIceProfile(data) {
  localStorage.setItem(
    'savelife_ice',
    JSON.stringify(data)
  );
}

// ============================================================================
// MODAL HANDLERS
// ============================================================================

window.openModal = function(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }
};

window.closeModal = function(id) {
  const modal = document.getElementById(id);

  if (modal) {
    modal.classList.add('hidden');
    modal.classList.remove('flex');
  }
};

// ============================================================================
// DOM EVENT LISTENERS
// ============================================================================

function addClickListener(id, callback) {
  const element = document.getElementById(id);

  if (element) {
    element.addEventListener('click', callback);
  }
}

function setupDashboardEvents() {

  // MODE SWITCHER
  const btnVictim = document.getElementById('btnModeVictim');
  const btnResponder = document.getElementById('btnModeResponder');

  const victimPanel = document.getElementById('victimPanel');
  const responderPanel = document.getElementById('responderPanel');

  if (btnVictim && btnResponder && victimPanel && responderPanel) {

    btnVictim.addEventListener('click', () => {
      state.mode = 'victim';

      btnVictim.className =
        'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 bg-rose-600 text-white shadow-md shadow-rose-600/30 flex items-center space-x-1.5';

      btnResponder.className =
        'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-300 hover:text-white flex items-center space-x-1.5';

      victimPanel.classList.remove('hidden');
      responderPanel.classList.add('hidden');
    });

    btnResponder.addEventListener('click', () => {
      state.mode = 'responder';

      btnResponder.className =
        'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 bg-sky-600 text-white shadow-md shadow-sky-600/30 flex items-center space-x-1.5';

      btnVictim.className =
        'px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 text-slate-300 hover:text-white flex items-center space-x-1.5';

      victimPanel.classList.add('hidden');
      responderPanel.classList.remove('hidden');
    });
  }

  // EMERGENCY CATEGORY BUTTONS
  document.querySelectorAll('.cat-btn').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('.cat-btn').forEach(item => {
        item.classList.remove('active');
      });

      button.classList.add('active');

      state.selectedCategory =
        button.getAttribute('data-cat') || 'Medical';

      state.selectedCategoryIcon =
        button.getAttribute('data-icon') || 'fa-briefcase-medical';
    });
  });

  // HARDWARE CONTROLS
  addClickListener('btnToggleSiren', () => toggleSiren());
  addClickListener('btnToggleStrobe', () => toggleStrobe());
  addClickListener('btnWhatsAppBroadcast', shareWhatsAppSOS);

  // CANCEL SOS
  addClickListener('btnCancelSos', () => {
    if (!state.activeSosId) {
      alert('No confirmed active emergency to resolve.');
      return;
    }

    if (!state.ws || state.ws.readyState !== WebSocket.OPEN) {
      alert('Server connection unavailable. Cannot resolve alert.');
      return;
    }

    state.ws.send(JSON.stringify({
      type: 'RESOLVE_ALERT',
      alertId: state.activeSosId
    }));
  });

  // RECENTER MAP
  addClickListener('btnRecenterMap', () => {
    if (state.map) {
      state.map.flyTo(
        [state.userLat, state.userLng],
        15
      );
    }
  });

  // CPR MODAL
  addClickListener('btnOpenCPR', () => {
    openModal('cprModal');
  });

  // ICE MODAL
  addClickListener('btnOpenICE', () => {
    const profile = getIceProfile();

    const fields = {
      iceName: profile.name || '',
      iceBlood: profile.blood || 'O+',
      iceAllergies: profile.allergies || '',
      icePhone1: profile.phone1 || '',
      icePhone2: profile.phone2 || ''
    };

    Object.entries(fields).forEach(([id, value]) => {
      const element = document.getElementById(id);

      if (element) {
        element.value = value;
      }
    });

    openModal('iceModal');
  });

  // SAVE ICE FORM
  const iceForm = document.getElementById('iceForm');

  if (iceForm) {
    iceForm.addEventListener('submit', event => {
      event.preventDefault();

      const data = {
        name: document.getElementById('iceName')?.value || '',
        blood: document.getElementById('iceBlood')?.value || '',
        allergies: document.getElementById('iceAllergies')?.value || '',
        phone1: document.getElementById('icePhone1')?.value || '',
        phone2: document.getElementById('icePhone2')?.value || ''
      };

      saveIceProfile(data);

      closeModal('iceModal');

      alert('ICE Emergency Medical Card saved in this browser.');
    });
  }

  // CPR AUDIO
  addClickListener('btnToggleCprAudio', toggleCprMetronome);

  // SIMULATED NEARBY EMERGENCY - DEMO ONLY
  addClickListener('btnSimulateNearby', () => {
    const mockCategories = [
      'Medical',
      'Accident',
      'Personal Safety',
      'Fire Emergency'
    ];

    const mockIcons = {
      'Medical': 'fa-briefcase-medical',
      'Accident': 'fa-car-crash',
      'Personal Safety': 'fa-shield-halved',
      'Fire Emergency': 'fa-fire'
    };

    const mockCategory =
      mockCategories[
        Math.floor(Math.random() * mockCategories.length)
      ];

    const mockAlert = {
      id: 'sim-' + Date.now(),
      category: mockCategory,
      categoryIcon: mockIcons[mockCategory],
      victimName: 'Demo Nearby Citizen',
      phone: '',
      lat: state.userLat + (Math.random() - 0.5) * 0.007,
      lng: state.userLng + (Math.random() - 0.5) * 0.007,
      radiusKm: 1.0,
      timestamp: Date.now(),
      status: 'ACTIVE',
      bloodGroup: 'B+',
      allergies: 'None reported',
      medicalNote: 'Simulated alert for demonstration'
    };

    // Display this demo alert locally.
    // It is not sent as a real emergency to the server.
    state.alerts.unshift(mockAlert);

    renderAlerts();
    showEmergencyBanner(mockAlert);
  });
}

// ============================================================================
// APPLICATION INITIALIZATION AFTER LOGIN
// ============================================================================

function startSaveLifeApp() {

  if (state.appStarted) return;

  if (!window.currentUser) {
    console.warn('Authentication required before starting dashboard.');
    return;
  }

  state.appStarted = true;

  console.log(
    'Save Life Bridge dashboard started for:',
    window.currentUser.name || window.currentUser.email
  );

  initMap();
  setupHoldTrigger();
  setupDashboardEvents();
  initWebSocket();

  // Refresh Leaflet size after dashboard becomes visible.
  setTimeout(() => {
    if (state.map) {
      state.map.invalidateSize();
    }
  }, 300);
}

// Authentication event from auth.js
window.addEventListener(
  'savelife:authenticated',
  startSaveLifeApp
);

// Handle case where auth.js already completed session check.
if (window.currentUser) {
  startSaveLifeApp();
}
