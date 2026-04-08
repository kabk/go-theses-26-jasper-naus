// ── Panel toggles ─────────────────────────────────────────────────────────
const panels = document.querySelectorAll('.panel');

function closeAllPanels() {
  panels.forEach(p => p.classList.remove('open'));
}

document.getElementById('btn-info').addEventListener('click', () => {
  const panel = document.getElementById('panel-info');
  const isOpen = panel.classList.contains('open');
  closeAllPanels();
  if (!isOpen) panel.classList.add('open');
});

document.getElementById('btn-report').addEventListener('click', () => {
  const panel = document.getElementById('panel-report');
  const isOpen = panel.classList.contains('open');
  closeAllPanels();
  if (!isOpen) panel.classList.add('open');
});

document.querySelectorAll('.panel-close').forEach(btn => {
  btn.addEventListener('click', () => closeAllPanels());
});

// ── Constants ─────────────────────────────────────────────────────────────
const WORLD_W             = 4000;
const WORLD_H             = 3000;
const SPAWN_INTERVAL_BASE = 1300;
const MAX_FRAGMENTS       = 12;
const GRID_STEP           = 60;

// ── Chapters ───────────────────────────────────────────────────────────────
// Images live in content/ folder (alongside index.html).
// x / y = top-left corner of the image in world-space (4000 × 3000).
// Adjust these coordinates freely to reposition chapters.
const CHAPTERS = [
  { id: "chapter-1", video: "content/Chapter1-The-City-as-a-Stage.mp4", x: 1200, y: 1800, label: "Chapter 1: The City as a Stage" },
  { id: "chapter-2", video: "content/Chapter2-The-City-as-a-Stage.mp4", x:  800, y: 2400, label: "Chapter 2: Reading the Scripts" },
  { id: "chapter-3", video: "content/Chapter3-The-City-as-a-Stage.mp4", x: 2900, y: 1600, label: "Chapter 3: Observing the Rules of Space" },
  { id: "chapter-4", video: "content/Chapter4-The-City-as-a-Stage.mp4", x: 2600, y:  420, label: "Chapter 4: Casting 'Characters'" },
  { id: "chapter-5", video: "content/Chapter5-The-City-as-a-Stage.mp4", x:  340, y:  280, label: "Chapter 5: Exercise of Observation 'The Decor'" },
];

// ── Hotspots ──────────────────────────────────────────────────────────────
const HOTSPOTS = [
  { img: "content/Character1.jpg", x:  1700, y:  200, radius: 150, w: 280 },
  { img: "content/Character2.jpg", x:  3600, y:  200, radius: 150, w: 280 },
  { img: "content/Character3.jpg", x:   200, y:  900, radius: 150, w: 280 },
  { img: "content/Character4.jpg", x:  2200, y: 2800, radius: 150, w: 280 },
  { img: "content/Character5.jpg", x:  1000, y: 2300, radius: 150, w: 280 },
  { img: "content/Character6.jpg", x:  2200, y: 1200, radius: 150, w: 280 },
  { img: "content/Closeup1.jpg",   x:  2000, y: 1000, radius: 150, w: 280 },
  { img: "content/Closeup2.jpg",   x:   200, y: 1600, radius: 150, w: 280 },
  { img: "content/Closeup3.jpg",   x:  3800, y: 1000, radius: 150, w: 280 },
  { img: "content/Closeup4.jpg",   x:  1600, y: 2600, radius: 150, w: 280 },
  { img: "content/Decor1.jpg",     x:  3200, y: 2400, radius: 150, w: 280 },
  { img: "content/Decor2.jpg",     x:  1000, y: 1100, radius: 150, w: 280 },
  { img: "content/Decor3.jpg",     x:  2600, y: 1400, radius: 150, w: 280 },
  { img: "content/Decor4.jpg",     x:   500, y: 1900, radius: 150, w: 280 },
  { img: "content/Decor5.jpg",     x:  3400, y:  900, radius: 150, w: 280 },
];

// ── Elements ──────────────────────────────────────────────────────────────
const world    = document.getElementById('world');
const stage    = document.getElementById('stage');
const canvas   = document.getElementById('grid');
const cursorEl = document.getElementById('cursor');
const hint     = document.getElementById('hint');

// ── Minimap ───────────────────────────────────────────────────────────────
const minimap = document.createElement('div');
minimap.id = 'minimap';

const minimapDot = document.createElement('div');
minimapDot.id = 'minimap-dot';
minimap.appendChild(minimapDot);

const minimapViewport = document.createElement('div');
minimapViewport.id = 'minimap-viewport';
minimap.appendChild(minimapViewport);

// One numbered anchor per chapter
CHAPTERS.forEach((ch, i) => {
  const dot = document.createElement('div');
  dot.className = 'minimap-anchor';
  dot.textContent = i + 1;
  dot.style.left = ((ch.x + 320) / WORLD_W * 100) + '%';
  dot.style.top  = ((ch.y + 180) / WORLD_H * 100) + '%';

  dot.addEventListener('click', (e) => {
    e.stopPropagation();
    panToWorld(ch.x + 320, ch.y + 180);
  });

  minimap.appendChild(dot);
});

document.body.appendChild(minimap);

// ── Place chapter videos in the world ─────────────────────────────────────
CHAPTERS.forEach((ch) => {
  const wrap = document.createElement('div');
  wrap.className = 'chapter';
  wrap.id = ch.id;
  wrap.style.left = ch.x + 'px';
  wrap.style.top  = ch.y + 'px';

  const video = document.createElement('video');
  video.src = ch.video;
  video.muted = true;   // start muted so the browser permits the initial load
  video.loop = true;
  video.playsInline = true;
  video.preload = 'auto';
  video.draggable = false;

  // Show first frame immediately
  video.load();

  // Unmute + play on hover; mute + pause on leave
  wrap.addEventListener('mouseenter', () => {
    video.muted = false;
    video.play();
  });
  wrap.addEventListener('mouseleave', () => {
    video.pause();
    video.muted = true;
  });

  const label = document.createElement('div');
  label.className = 'chapter-label';
  label.textContent = ch.label;

  wrap.appendChild(video);
  wrap.appendChild(label);
  stage.appendChild(wrap);
});

// ── Build hotspot elements + crosses ──────────────────────────────────────
HOTSPOTS.forEach((hs) => {
  // Subtle cross marker
  const cross = document.createElement('div');
  cross.className = 'hotspot-cross';
  cross.style.left = hs.x + 'px';
  cross.style.top  = hs.y + 'px';
  stage.appendChild(cross);
  hs.cross = cross;

  // Hidden image
  const el       = document.createElement('div');
  el.className   = 'hotspot';
  el.style.left  = (hs.x - hs.w / 2) + 'px';
  el.style.top   = (hs.y - 160) + 'px';
  el.style.width = hs.w + 'px';

  const img     = document.createElement('img');
  img.src       = hs.img;
  img.draggable = false;
  el.appendChild(img);
  stage.appendChild(el);
  hs.el = el;
});

// ── State ─────────────────────────────────────────────────────────────────
let screenMX   = window.innerWidth  / 2;
let screenMY   = window.innerHeight / 2;

let camX       = WORLD_W / 2 - window.innerWidth  / 2;
let camY       = WORLD_H / 2 - window.innerHeight / 2;
let targetCamX = camX;
let targetCamY = camY;

let moved      = false;
let lastSpawn  = 0;
let lastTrail  = 0;
let activeFrags = [];
let fragIndex  = 0;
let idleTimer  = null;

// ── Fragment data ─────────────────────────────────────────────────────────
// type: 'question'   → Times New Roman
//       'body'       → Arial
//       'annotation' → Space Mono
// size: 's' | 'm' | 'l' | 'xl'
const FRAGMENTS = [
  { text: "Can we see public space as a stage?",                              type: "question",       size: "l"  },
  { text: "A place where performances constantly happen\nwithout realising.", type: "body",           size: "m"  },
  { text: "A stage where we constantly adapt to others",                      type: "body",           size: "s"  },
  { text: "Slowing down, speeding up, waiting, avoiding.",                    type: "annotation",     size: "m"  },
  { text: "Could pedestrians be seen as performers\nthe moment they step outside?", type: "question", size: "m" },
  { text: "Deciding every morning\nwhat role to play",                        type: "body",           size: "s"  },
  { text: "Road markings become scripts",                                     type: "annotation",     size: "s"  },
  { text: "Crossings.",                                                       type: "question",       size: "xl" },
  { text: "Scripts tell us how to move.\nWhere to stop.\nWhere to pause.",    type: "body",           size: "m"  },
  { text: "Follow.",                                                          type: "body",           size: "xl" },
  { text: "Do we follow because we want to —\nor because we have learned to?", type: "question",      size: "m"  },
  { text: "And what does that make us?",                                      type: "question",       size: "l"  },
  { text: "Simply observing?",                                                type: "question",       size: "m"  },
  { text: "A director\nchoreographer\naudience",                              type: "annotation",     size: "s"  },
  { text: "Someone who reads movement.\nFrames it.\nHighlights it.",          type: "body",           size: "m"  },
  { text: "The street as script.",                                            type: "question",       size: "l"  },
  { text: "Every crossing: a cue.\nEvery pause: a rest.",                     type: "body",           size: "s"  },
  { text: "What kind of role do we take on\nthe second we enter the street?", type: "question",       size: "m"  },
  { text: "Everyday movement read as choreography",                           type: "annotation",     size: "s"  },
  { text: "We mirror each other.",                                            type: "body",           size: "m"  },
  { text: "Anticipate.",                                                      type: "body",           size: "xl"  },
  { text: "Adjust.",                                                          type: "body",           size: "s"  },
  { text: "Do you choose your role,\nor do you step into it?",                type: "question",       size: "m"  },
  { text: "A rehearsal space.\nA testing ground.\nAn open space.",            type: "body",           size: "s"  },
  { text: "Walk.",                                                            type: "question",       size: "xl" },
  { text: "Pause.",                                                           type: "question",       size: "xl" },
  { text: "We become performers.\nActors.",                                    type: "body",           size: "m"  },
  { text: "The city already contains a choreography",                         type: "annotation",     size: "s"  },
  { text: "You are already on stage.",                                        type: "question",       size: "l"  },
  { text: "Stage",                                                            type: "annotation",     size: "xl" },
  { text: "Who wrote the script\nyou are following right now?",               type: "question",       size: "m"  },
  { text: "Stop.",                                                            type: "question",       size: "xl" },
  { text: "Go.",                                                              type: "body",           size: "xl" },
];

// ── Grid ──────────────────────────────────────────────────────────────────
function drawGrid() {
  const ctx = canvas.getContext('2d');
  canvas.width  = WORLD_W;
  canvas.height = WORLD_H;
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);

  ctx.strokeStyle = 'rgba(26,26,26,0.055)';
  ctx.lineWidth = 1;

  for (let x = 0; x <= WORLD_W; x += GRID_STEP) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += GRID_STEP) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke();
  }

  ctx.strokeStyle = 'rgba(26,26,26,0.12)';
  ctx.lineWidth = 1;
  ctx.strokeRect(1, 1, WORLD_W - 2, WORLD_H - 2);
}

drawGrid();

// ── Camera ────────────────────────────────────────────────────────────────
function clampCam(x, y) {
  return {
    x: Math.max(0, Math.min(WORLD_W - window.innerWidth,  x)),
    y: Math.max(0, Math.min(WORLD_H - window.innerHeight, y)),
  };
}

function applyCamera() {
  world.style.transform = `translate(${-camX}px, ${-camY}px)`;
}

function panToWorld(wx, wy) {
  const dest = clampCam(
    wx - window.innerWidth  / 2,
    wy - window.innerHeight / 2
  );
  targetCamX = dest.x;
  targetCamY = dest.y;
}

minimap.addEventListener('click', (e) => {
  const rect = minimap.getBoundingClientRect();
  const rx = (e.clientX - rect.left) / rect.width;
  const ry = (e.clientY - rect.top)  / rect.height;
  panToWorld(rx * WORLD_W, ry * WORLD_H);
});

function worldX() { return screenMX + camX; }
function worldY() { return screenMY + camY; }

// ── Minimap update ────────────────────────────────────────────────────────
function updateMinimap() {
  const px = (camX + window.innerWidth  / 2) / WORLD_W;
  const py = (camY + window.innerHeight / 2) / WORLD_H;
  minimapDot.style.left = (px * 100) + '%';
  minimapDot.style.top  = (py * 100) + '%';

const vw = (window.innerWidth  / WORLD_W * 100) + '%';
const vh = (window.innerHeight / WORLD_H * 100) + '%';
minimapViewport.style.width  = vw;
minimapViewport.style.height = vh;
minimapViewport.style.left   = (camX / WORLD_W * 100) + '%';
minimapViewport.style.top    = (camY / WORLD_H * 100) + '%';
}

// ── Mouse input ───────────────────────────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  screenMX = e.clientX;
  screenMY = e.clientY;

  cursorEl.style.left = screenMX + 'px';
  cursorEl.style.top  = screenMY + 'px';
  cursorEl.classList.remove('idle');

  if (!moved) {
    moved = true;
    hint.classList.add('hidden');
  }

  const edge  = 250;
  const speed = 10;
  let dx = 0, dy = 0;

  if (screenMX < edge)                      dx = -speed * (1 - screenMX / edge);
  if (screenMX > window.innerWidth  - edge) dx =  speed * ((screenMX - (window.innerWidth  - edge)) / edge);
  if (screenMY < edge)                      dy = -speed * (1 - screenMY / edge);
  if (screenMY > window.innerHeight - edge) dy =  speed * ((screenMY - (window.innerHeight - edge)) / edge);

  targetCamX += dx;
  targetCamY += dy;

  const clamped = clampCam(targetCamX, targetCamY);
  targetCamX = clamped.x;
  targetCamY = clamped.y;

  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => cursorEl.classList.add('idle'), 2500);
});

// ── Trail ─────────────────────────────────────────────────────────────────
function spawnTrail() {
  const dot = document.createElement('div');
  dot.className = 'trail-dot';
  dot.style.left = screenMX + 'px';
  dot.style.top  = screenMY + 'px';
  document.body.appendChild(dot);
  setTimeout(() => dot.remove(), 3000);
}

// ── Fragment spawn ────────────────────────────────────────────────────────
function spawnFragment() {
  if (!moved) return;

  const data = FRAGMENTS[fragIndex % FRAGMENTS.length];
  fragIndex++;

  const el = document.createElement('div');
  el.className = `fragment ${data.type} ${data.size}`;
  el.textContent = data.text;

  const angle  = Math.random() * Math.PI * 2;
  const dist   = 100 + Math.random() * 200;
  const margin = 60;

  let wx = worldX() + Math.cos(angle) * dist;
  let wy = worldY() + Math.sin(angle) * dist;

  wx = Math.max(margin, Math.min(WORLD_W - 340, wx));
  wy = Math.max(margin, Math.min(WORLD_H - 140, wy));

  el.style.left = wx + 'px';
  el.style.top  = wy + 'px';

  stage.appendChild(el);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });

  const linger = 7000 + Math.random() * 9000;
  setTimeout(() => fadeOut(el), linger);

  activeFrags.push(el);

  if (activeFrags.length > MAX_FRAGMENTS) {
    fadeOut(activeFrags.shift());
  }
}

function fadeOut(el) {
  if (!el.parentNode) return;
  el.classList.remove('visible');
  el.classList.add('fading');
  setTimeout(() => el.remove(), 2400);
  activeFrags = activeFrags.filter(f => f !== el);
}

// ── Mobile detection ──────────────────────────────────────────────────────
const isMobile = window.matchMedia('(max-width: 768px)').matches;

// ── Main loop (desktop only) ───────────────────────────────────────────────
function loop(ts) {
  requestAnimationFrame(loop);

  camX += (targetCamX - camX) * 0.08;
  camY += (targetCamY - camY) * 0.08;
  applyCamera();
  updateMinimap();

  if (!moved) return;

  // Hotspot proximity — reveal image, hide cross
  const cx = worldX();
  const cy = worldY();
  HOTSPOTS.forEach((hs) => {
    const dist = Math.sqrt((cx - hs.x) ** 2 + (cy - hs.y) ** 2);
    const near = dist < hs.radius;
    hs.el.classList.toggle('visible', near);
    hs.cross.classList.toggle('hidden', near);
  });

  if (ts - lastTrail > 55) {
    spawnTrail();
    lastTrail = ts;
  }

  const interval = SPAWN_INTERVAL_BASE + activeFrags.length * 180;
  if (ts - lastSpawn > interval) {
    spawnFragment();
    lastSpawn = ts;
  }
}

if (!isMobile) {
  requestAnimationFrame(loop);
}

// ── Mobile ────────────────────────────────────────────────────────────────
if (isMobile) {
  // Draw the grid onto the mobile canvas
  const mobileCanvas = document.getElementById('mobile-grid');
  if (mobileCanvas) {
    const drawMobileGrid = () => {
      mobileCanvas.width  = window.innerWidth;
      mobileCanvas.height = window.innerHeight;
      const ctx = mobileCanvas.getContext('2d');
      ctx.clearRect(0, 0, mobileCanvas.width, mobileCanvas.height);

      ctx.strokeStyle = 'rgba(26,26,26,0.055)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= mobileCanvas.width; x += GRID_STEP) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, mobileCanvas.height); ctx.stroke();
      }
      for (let y = 0; y <= mobileCanvas.height; y += GRID_STEP) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(mobileCanvas.width, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(26,26,26,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, mobileCanvas.width - 2, mobileCanvas.height - 2);
    };

    drawMobileGrid();
    window.addEventListener('resize', drawMobileGrid);
  }

  // ── Notes ─────────────────────────────────────────────────────────────
  const addNoteBtn  = document.getElementById('add-note-btn-characters');
  const textarea    = document.getElementById('textarea-characters');
  const notesList   = document.getElementById('notes-list-characters');

  if (addNoteBtn && textarea && notesList) {
    addNoteBtn.addEventListener('click', () => {
      const text = textarea.value.trim();
      if (!text) return;
      const item = document.createElement('div');
      item.className = 'field-note-item';
      item.textContent = text;
      notesList.appendChild(item);
      textarea.value = '';
      textarea.focus();
    });
  }

  // ── Screen navigation ──────────────────────────────────────────────────
  function goToScreen(targetId) {
    document.querySelectorAll('.field-screen').forEach(s => {
      s.classList.remove('active');
    });
    const target = document.getElementById(targetId);
    if (target) {
      target.classList.add('active');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  document.querySelectorAll('.field-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const next = btn.getAttribute('data-next');
      if (next) goToScreen(next);
    });
  });



  // ── Overlay grid canvas ────────────────────────────────────────────────
  const overlayGridCanvas = document.getElementById('mobile-overlay-grid');
  if (overlayGridCanvas) {
    const drawOverlayGrid = () => {
      overlayGridCanvas.width  = window.innerWidth;
      overlayGridCanvas.height = window.innerHeight;
      const ctx = overlayGridCanvas.getContext('2d');
      ctx.clearRect(0, 0, overlayGridCanvas.width, overlayGridCanvas.height);

      ctx.strokeStyle = 'rgba(26,26,26,0.055)';
      ctx.lineWidth = 1;

      for (let x = 0; x <= overlayGridCanvas.width; x += GRID_STEP) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, overlayGridCanvas.height); ctx.stroke();
      }
      for (let y = 0; y <= overlayGridCanvas.height; y += GRID_STEP) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(overlayGridCanvas.width, y); ctx.stroke();
      }

      ctx.strokeStyle = 'rgba(26,26,26,0.12)';
      ctx.lineWidth = 1;
      ctx.strokeRect(1, 1, overlayGridCanvas.width - 2, overlayGridCanvas.height - 2);
    };
    drawOverlayGrid();
    window.addEventListener('resize', drawOverlayGrid);
  }

  // ── More overlay ───────────────────────────────────────────────────────
  const moreBtn        = document.getElementById('mobile-more-btn');
  const overlay        = document.getElementById('mobile-overlay');
  const overlayClose   = document.getElementById('mobile-overlay-close');
  const overlayContent = document.getElementById('mobile-overlay-content');
  const reportIndex    = document.getElementById('mobile-report-index');
  const reportSection  = document.getElementById('mobile-report-section');

  if (moreBtn && overlay) {
    moreBtn.addEventListener('click', () => {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (overlayGridCanvas) overlayGridCanvas.classList.add('visible');
    });

    overlayClose.addEventListener('click', () => {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
      if (overlayGridCanvas) overlayGridCanvas.classList.remove('visible');
    });
  }
}