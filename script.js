// ── Constants ─────────────────────────────────────────────────────────────
const WORLD_W = 4000;
const WORLD_H = 3000;
const SPAWN_INTERVAL_BASE = 1300;
const MAX_FRAGMENTS = 12;
const GRID_STEP = 60;

// ── Chapters ───────────────────────────────────────────────────────────────
// Each chapter is a fixed image placed in world-space.
// x / y = top-left corner of the image in the world (4000 × 3000).
// Adjust these coordinates freely to reposition chapters.
const CHAPTERS = [
  { id: "chapter-1", img: "Input/Chapter1.jpg", x:  340, y:  280  },
  { id: "chapter-2", img: "Input/Chapter2.jpg", x: 2600, y:  420  },
  { id: "chapter-3", img: "Input/Chapter3.jpg", x: 1200, y: 1800  },
  { id: "chapter-4", img: "Input/Chapter4.jpg", x: 2900, y: 1600  },
  { id: "chapter-5", img: "Input/Chapter5.jpg", x:  800, y: 2400  },
];

// ── Elements ──────────────────────────────────────────────────────────────
const world     = document.getElementById('world');
const stage     = document.getElementById('stage');
const canvas    = document.getElementById('grid');
const cursorEl  = document.getElementById('cursor');
const hint      = document.getElementById('hint');

// ── Minimap ───────────────────────────────────────────────────────────────
const minimap = document.createElement('div');
minimap.id = 'minimap';

// Current position dot
const minimapDot = document.createElement('div');
minimapDot.id = 'minimap-dot';
minimap.appendChild(minimapDot);

// One anchor dot per chapter
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

// ── Place chapter images in the world ─────────────────────────────────────
CHAPTERS.forEach((ch) => {
  const wrap = document.createElement('div');
  wrap.className = 'chapter';
  wrap.id = ch.id;
  wrap.style.left = ch.x + 'px';
  wrap.style.top  = ch.y + 'px';

  const img = document.createElement('img');
  img.src = ch.img;
  img.alt = ch.id;
  img.draggable = false;

  const label = document.createElement('div');
  label.className = 'chapter-label';
  label.textContent = ch.id.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());

  wrap.appendChild(img);
  wrap.appendChild(label);
  stage.appendChild(wrap);
});

// ── State ─────────────────────────────────────────────────────────────────
let screenMX = window.innerWidth  / 2;
let screenMY = window.innerHeight / 2;

// World-space position of the viewport's top-left corner
let camX = WORLD_W / 2 - window.innerWidth  / 2;
let camY = WORLD_H / 2 - window.innerHeight / 2;

// Target camera (for smooth panning)
let targetCamX = camX;
let targetCamY = camY;

let moved        = false;
let lastSpawn    = 0;
let lastTrail    = 0;
let activeFrags  = [];
let fragIndex    = 0;
let idleTimer    = null;

// ── Fragment data ─────────────────────────────────────────────────────────
// type: 'question' → Times New Roman
//       'body'     → Arial
//       'annotation' → Space Mono
// size: 's' | 'm' | 'l' | 'xl'
const FRAGMENTS = [
  { text: "Can we see public space as a stage?",                         type: "question",    size: "l"  },
  { text: "A place where performances constantly happen\nwithout anyone realising.",
                                                                           type: "body",        size: "m"  },
  { text: "pedestrian\n/pəˈdestriən/\nn. a person walking",              type: "annotation",  size: "s"  },
  { text: "Could pedestrians be seen as performers\nthe moment they step outside?",
                                                                           type: "question",    size: "m"  },
  { text: "road marks\ncrossings\npavements",                             type: "annotation",  size: "s"  },
  { text: "Scripts.",                                                      type: "question",    size: "xl" },
  { text: "They tell us how to move.\nWhere to stop.\nThey direct.",      type: "body",        size: "m"  },
  { text: "Do we follow because we want to —\nor because we have learned to?",
                                                                           type: "question",    size: "m"  },
  { text: "And what does that make me?",                                  type: "question",    size: "l"  },
  { text: "Am I simply observing?",                                        type: "question",    size: "m"  },
  { text: "director\nchoreographer\nwitness",                             type: "annotation",  size: "s"  },
  { text: "Someone who reads movement.\nFrames it. Highlights it.",       type: "body",        size: "m"  },
  { text: "The street as score.",                                          type: "question",    size: "l"  },
  { text: "Every crossing: a cue.\nEvery pause: a rest.",                 type: "body",        size: "s"  },
  { text: "What kind of role do we take on\nthe second we enter the street?",
                                                                           type: "question",    size: "m"  },
  { text: "to perform\nwithout knowing\nyou are performing",              type: "annotation",  size: "s"  },
  { text: "The city is always watching.",                                  type: "body",        size: "m"  },
  { text: "Or is no one watching at all?",                                 type: "question",    size: "m"  },
  { text: "A rehearsal space.\nA testing ground.\nAn open space.",        type: "body",        size: "s"  },
  { text: "walk.",                                                          type: "question",    size: "xl" },
  { text: "The pavement doesn't ask you to perform.\nIt just waits.",     type: "body",        size: "m"  },
  { text: "role\n/rəʊl/\nn. the function assumed\nin a particular situation",
                                                                           type: "annotation",  size: "s"  },
  { text: "You are always already on stage.",                              type: "question",    size: "l"  },
  { text: "stage\n/steɪdʒ/\nn. a raised floor or platform\nalso: a period of development",
                                                                           type: "annotation",  size: "s"  },
  { text: "Who wrote the script\nyou are following right now?",           type: "question",    size: "m"  },
  { text: "stop.",                                                          type: "question",    size: "xl" },
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
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD_H);
    ctx.stroke();
  }
  for (let y = 0; y <= WORLD_H; y += GRID_STEP) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD_W, y);
    ctx.stroke();
  }

  // Draw a subtle boundary edge
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

// Smoothly pan so that world-point (wx, wy) is centred on screen
function panToWorld(wx, wy) {
  const dest = clampCam(
    wx - window.innerWidth  / 2,
    wy - window.innerHeight / 2
  );
  targetCamX = dest.x;
  targetCamY = dest.y;
}

// Click anywhere on the minimap to navigate there
minimap.addEventListener('click', (e) => {
  const rect = minimap.getBoundingClientRect();
  const rx = (e.clientX - rect.left)  / rect.width;
  const ry = (e.clientY - rect.top)   / rect.height;
  panToWorld(rx * WORLD_W, ry * WORLD_H);
});

// World-space cursor position
function worldX() { return screenMX + camX; }
function worldY() { return screenMY + camY; }

// ── Minimap update ────────────────────────────────────────────────────────
function updateMinimap() {
  const px = (camX + window.innerWidth  / 2) / WORLD_W;
  const py = (camY + window.innerHeight / 2) / WORLD_H;
  minimapDot.style.left = (px * 100) + '%';
  minimapDot.style.top  = (py * 100) + '%';
}

// ── Mouse input ───────────────────────────────────────────────────────────
document.addEventListener('mousemove', (e) => {
  screenMX = e.clientX;
  screenMY = e.clientY;

  // Update visible cursor
  cursorEl.style.left = screenMX + 'px';
  cursorEl.style.top  = screenMY + 'px';
  cursorEl.classList.remove('idle');

  if (!moved) {
    moved = true;
    hint.classList.add('hidden');
  }

  // Pan camera: push world when cursor nears edges
  const edge = 250;
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

  // Reset idle
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
  setTimeout(() => dot.remove(), 2000);
}

// ── Fragment spawn ────────────────────────────────────────────────────────
function spawnFragment() {
  if (!moved) return;

  const data = FRAGMENTS[fragIndex % FRAGMENTS.length];
  fragIndex++;

  const el = document.createElement('div');
  el.className = `fragment ${data.type} ${data.size}`;
  el.textContent = data.text;

  // Place in world-space, offset from cursor
  const angle = Math.random() * Math.PI * 2;
  const dist  = 100 + Math.random() * 200;
  const margin = 60;

  let wx = worldX() + Math.cos(angle) * dist;
  let wy = worldY() + Math.sin(angle) * dist;

  wx = Math.max(margin, Math.min(WORLD_W - 340, wx));
  wy = Math.max(margin, Math.min(WORLD_H - 140, wy));

  el.style.left = wx + 'px';
  el.style.top  = wy + 'px';

  stage.appendChild(el);

  // Trigger fade-in next frame
  requestAnimationFrame(() => {
    requestAnimationFrame(() => el.classList.add('visible'));
  });

  // Schedule fade-out
  const linger = 7000 + Math.random() * 9000;
  setTimeout(() => fadeOut(el), linger);

  activeFrags.push(el);

  // Cull oldest if over limit
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

// ── Main loop ─────────────────────────────────────────────────────────────
function loop(ts) {
  requestAnimationFrame(loop);

  // Smooth camera
  camX += (targetCamX - camX) * 0.08;
  camY += (targetCamY - camY) * 0.08;
  applyCamera();
  updateMinimap();

  if (!moved) return;

  // Trail
  if (ts - lastTrail > 55) {
    spawnTrail();
    lastTrail = ts;
  }

  // Fragment
  const interval = SPAWN_INTERVAL_BASE + activeFrags.length * 180;
  if (ts - lastSpawn > interval) {
    spawnFragment();
    lastSpawn = ts;
  }
}

requestAnimationFrame(loop);