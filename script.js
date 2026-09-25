// Theme toggle — respects saved preference, falls back to system setting.
const root = document.documentElement;
const toggle = document.getElementById('theme-toggle');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
  root.dataset.theme = savedTheme;
} else if (window.matchMedia('(prefers-color-scheme: light)').matches) {
  root.dataset.theme = 'light';
}

function setTheme(next) {
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
}

toggle.addEventListener('click', () => {
  setTheme(root.dataset.theme === 'light' ? 'dark' : 'light');
});

// Scroll-reveal animations via IntersectionObserver.
const revealables = document.querySelectorAll('.reveal');
if (reduceMotion) {
  revealables.forEach((el) => el.classList.add('visible'));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.15 }
  );
  revealables.forEach((el) => observer.observe(el));
}

// Keep the footer year current.
document.getElementById('year').textContent = new Date().getFullYear();

// Cursor spotlight on cards.
document.querySelectorAll('.card, .post-card').forEach((card) => {
  card.addEventListener('pointermove', (e) => {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  });
});

// Toasts.
let toastEl;
let toastTimer;
function toast(message) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.append(toastEl);
  }
  toastEl.textContent = message;
  toastEl.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('show'), 2600);
}

// Party mode: the Konami code, or (party!) in the REPL.
function toggleParty() {
  const on = root.classList.toggle('party');
  toast(on ? '↑↑↓↓←→←→BA — party mode on.' : 'Party mode off. Back to work.');
  return on;
}

const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
let konamiPos = 0;
document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  if (key === KONAMI[konamiPos]) konamiPos++;
  else if (key === KONAMI[0]) konamiPos = konamiPos === 2 ? 2 : 1; // "↑↑↑↓…" still counts
  else konamiPos = 0;
  if (konamiPos === KONAMI.length) {
    konamiPos = 0;
    toggleParty();
  }
});

window.mj = { setTheme, toggleParty, toast };
