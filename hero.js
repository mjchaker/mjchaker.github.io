// Home-page hero: a live hydrogen-orbital field, a small Scheme REPL,
// a scrambling "currently" line, and count-up stats. Loaded on index only.
(() => {
  const root = document.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ============================================================
     Orbital field — rejection-samples |ψ|² from the analytic
     hydrogen wavefunctions (unnormalized, atomic units) and
     morphs between them. Point colour = sign of ψ.
     ============================================================ */
  const ORBITALS = [
    { id: '3d-z2', html: '3d<sub>z²</sub>', L: 22, psi: (x, y, z, r) => (3 * z * z - r * r) * Math.exp(-r / 3) },
    { id: '4f-z3', html: '4f<sub>z³</sub>', L: 36, psi: (x, y, z, r) => z * (5 * z * z - 3 * r * r) * Math.exp(-r / 4) },
    { id: '3d-xy', html: '3d<sub>xy</sub>', L: 22, psi: (x, y, z, r) => x * y * Math.exp(-r / 3) },
    { id: '3p-z', html: '3p<sub>z</sub>', L: 25, psi: (x, y, z, r) => z * (6 - r) * Math.exp(-r / 3) },
    { id: '2p-z', html: '2p<sub>z</sub>', L: 12, psi: (x, y, z, r) => z * Math.exp(-r / 2) },
  ];

  const field = (() => {
    const canvas = document.getElementById('hero-field');
    const visual = document.querySelector('.hero-visual');
    const label = document.getElementById('orbital-name');
    if (!canvas || !canvas.getContext) return null;
    const ctx = canvas.getContext('2d');
    const COUNT = window.innerWidth < 700 ? 1600 : 3600;
    const MORPH_MS = 1800;
    const HOLD_MS = 7000;

    function sample(orb) {
      const { L, psi } = orb;
      const rnd = () => (Math.random() * 2 - 1) * L;
      let max = 0;
      for (let i = 0; i < 40000; i++) {
        const x = rnd(), y = rnd(), z = rnd();
        const p = psi(x, y, z, Math.hypot(x, y, z));
        if (p * p > max) max = p * p;
      }
      const pts = new Float32Array(COUNT * 4);
      for (let n = 0, guard = 0; n < COUNT && guard < 6e6; guard++) {
        const x = rnd(), y = rnd(), z = rnd();
        const p = psi(x, y, z, Math.hypot(x, y, z));
        if (Math.random() * max < p * p) {
          pts.set([x / L, y / L, z / L, p >= 0 ? 1 : -1], n * 4);
          n++;
        }
      }
      return pts;
    }

    let idx = 0;
    let from = null;
    let to = sample(ORBITALS[0]);
    let morphStart = -Infinity;
    let lastSwitch = performance.now();
    let yaw = 0, tilt = 0.35, targetYaw = 0, targetTilt = 0.35, pointerYaw = 0;
    let W = 0, H = 0, cx = 0, cy = 0, R = 0;
    let colPos = '#7c6cff', colNeg = '#21d4b4', additive = true, frame = 0;
    const screen = new Float32Array(COUNT * 4);

    function readColors() {
      const cs = getComputedStyle(root);
      colPos = cs.getPropertyValue('--accent').trim() || colPos;
      colNeg = cs.getPropertyValue('--accent-2').trim() || colNeg;
      additive = root.dataset.theme !== 'light';
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      W = rect.width; H = rect.height;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const v = visual.getBoundingClientRect();
      cx = v.left + v.width / 2 - rect.left;
      cy = v.top + v.height / 2 - rect.top;
      // Most of |ψ|² sits at ~0.3–0.5 of the sampling box, so scale the
      // box well past the card for the lobes to spill out around it.
      R = Math.min(Math.max(v.width, v.height) * 1.05, H * 0.95);
    }

    function draw(now) {
      if (++frame % 15 === 0) readColors();
      yaw += reduceMotion ? 0 : 0.0022;
      targetYaw += (pointerYaw - targetYaw) * 0.04;
      tilt += (targetTilt - tilt) * 0.04;

      let k = Math.min(1, (now - morphStart) / MORPH_MS);
      k = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      const morphing = from && k < 1;

      const a = yaw + targetYaw, ca = Math.cos(a), sa = Math.sin(a);
      const ct = Math.cos(tilt), st = Math.sin(tilt);
      for (let i = 0; i < COUNT; i++) {
        const j = i * 4;
        let x = to[j], y = to[j + 1], z = to[j + 2], s = to[j + 3];
        if (morphing) {
          x = from[j] + (x - from[j]) * k;
          y = from[j + 1] + (y - from[j + 1]) * k;
          z = from[j + 2] + (z - from[j + 2]) * k;
          if (k < 0.5) s = from[j + 3];
        }
        const xr = x * ca - y * sa;
        const yr = x * sa + y * ca;
        const vert = z * ct - yr * st;
        const depth = z * st + yr * ct;
        const persp = 3 / (3 + depth);
        screen[j] = cx + xr * R * persp;
        screen[j + 1] = cy - vert * R * persp;
        screen[j + 2] = Math.max(0.18, Math.min(0.95, 0.62 - depth * 0.4)) * (additive ? 1 : 0.8);
        screen[j + 3] = s * 2 * persp;
      }

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = additive ? 'lighter' : 'source-over';
      for (const sign of [1, -1]) {
        ctx.fillStyle = sign > 0 ? colPos : colNeg;
        for (let j = 0; j < screen.length; j += 4) {
          const size = screen[j + 3] * sign;
          if (size <= 0) continue;
          ctx.globalAlpha = screen[j + 2];
          ctx.fillRect(screen[j] - size / 2, screen[j + 1] - size / 2, size, size);
        }
      }
      ctx.globalAlpha = 1;

      if (!reduceMotion && !morphing && now - lastSwitch > HOLD_MS) next(now);
    }

    function next(now = performance.now()) {
      idx = (idx + 1) % ORBITALS.length;
      from = to;
      to = sample(ORBITALS[idx]);
      morphStart = reduceMotion ? -Infinity : now;
      lastSwitch = now + MORPH_MS;
      if (label) label.innerHTML = ORBITALS[idx].html;
      if (!running) draw(performance.now());
      return ORBITALS[idx].id;
    }

    let running = false, rafId = 0, inView = true;
    const loop = (now) => { rafId = requestAnimationFrame(loop); draw(now); };
    function update() {
      const want = !reduceMotion && inView && !document.hidden;
      if (want && !running) { running = true; rafId = requestAnimationFrame(loop); }
      else if (!want && running) { running = false; cancelAnimationFrame(rafId); }
    }

    readColors();
    resize();
    draw(performance.now());
    window.addEventListener('resize', () => { resize(); if (!running) draw(performance.now()); });
    window.addEventListener('pointermove', (e) => {
      pointerYaw = (e.clientX / window.innerWidth - 0.5) * 0.9;
      targetTilt = 0.35 + (e.clientY / window.innerHeight - 0.5) * 0.6;
    }, { passive: true });
    new MutationObserver(() => { readColors(); if (!running) draw(performance.now()); })
      .observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    new IntersectionObserver(([e]) => { inView = e.isIntersecting; update(); }).observe(canvas);
    document.addEventListener('visibilitychange', update);
    // The hero visual slides in on reveal; re-centre once it settles.
    setTimeout(() => { resize(); if (!running) draw(performance.now()); }, 800);
    update();

    return { next, current: () => ORBITALS[idx].id };
  })();

  /* ============================================================
     mj-scheme — a small Scheme: exact integers (BigInt), proper
     tail calls, closures, named let, and MIT-style REPL output.
     ============================================================ */
  class Pair { constructor(car, cdr) { this.car = car; this.cdr = cdr; } }
  class Sym { constructor(name) { this.name = name; } }
  class SchemeError extends Error {}
  class Incomplete extends Error {}
  const NIL = Object.freeze({ nil: true });
  const UNSPEC = Object.freeze({ unspecified: true });
  const SILENT = Object.freeze({ silent: true });

  const symbols = new Map();
  const sym = (name) => {
    let s = symbols.get(name);
    if (!s) symbols.set(name, (s = new Sym(name)));
    return s;
  };
  const list = (...xs) => xs.reduceRight((acc, x) => new Pair(x, acc), NIL);
  const ORD = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
  const wrongType = (x, i, who) =>
    new SchemeError(`The object ${write(x)}, passed as the ${ORD[i] || `${i + 1}th`} argument to ${who}, is not the correct type.`);
  function toArray(lst, who = 'length') {
    const out = [];
    let p = lst;
    for (; p instanceof Pair; p = p.cdr) out.push(p.car);
    if (p !== NIL) throw wrongType(lst, 0, who);
    return out;
  }

  // ---- reader ----
  function tokenize(src) {
    const tokens = [];
    for (const [t] of src.matchAll(/\s+|;[^\n]*|[()']|"(?:\\.|[^\\"])*"?|[^\s()'";]+/g)) {
      if (!/^\s/.test(t) && t[0] !== ';') tokens.push(t);
    }
    return tokens;
  }

  function atom(t) {
    if (/^[+-]?\d+$/.test(t)) return BigInt(t);
    if (/^[+-]?(\d+\.?\d*|\.\d+)(e[+-]?\d+)?$/i.test(t)) return Number(t);
    if (t === '#t' || t === '#true') return true;
    if (t === '#f' || t === '#false') return false;
    if (t[0] === '"') {
      if (!/^"(?:\\.|[^\\"])*"$/.test(t)) throw new Incomplete();
      return t.slice(1, -1).replace(/\\(.)/g, (_, c) => (c === 'n' ? '\n' : c === 't' ? '\t' : c));
    }
    return sym(t);
  }

  function readAll(src) {
    const tokens = tokenize(src);
    let i = 0;
    const read = () => {
      if (i >= tokens.length) throw new Incomplete();
      const t = tokens[i++];
      if (t === "'") return list(sym('quote'), read());
      if (t === ')') throw new SchemeError('Unbalanced close parenthesis');
      if (t !== '(') return atom(t);
      const items = [];
      let tail = NIL;
      for (;;) {
        if (i >= tokens.length) throw new Incomplete();
        if (tokens[i] === ')') { i++; break; }
        if (tokens[i] === '.' && items.length) {
          i++;
          tail = read();
          if (i >= tokens.length) throw new Incomplete();
          if (tokens[i++] !== ')') throw new SchemeError('Ill-formed dotted list');
          break;
        }
        items.push(read());
      }
      return items.reduceRight((acc, x) => new Pair(x, acc), tail);
    };
    const forms = [];
    while (i < tokens.length) forms.push(read());
    return forms;
  }

  // ---- printer ----
  const hashes = new WeakMap();
  let nextHash = 12;
  const hash = (obj) => {
    if (!hashes.has(obj)) hashes.set(obj, nextHash++);
    return hashes.get(obj);
  };

  function write(x, display = false) {
    if (x === true) return '#t';
    if (x === false) return '#f';
    if (x === NIL) return '()';
    if (typeof x === 'bigint') return x.toString();
    if (typeof x === 'number') {
      if (Number.isNaN(x)) return '+nan.0';
      if (!Number.isFinite(x)) return x > 0 ? '+inf.0' : '-inf.0';
      return Number.isInteger(x) && Math.abs(x) < 1e21 ? `${x}.` : String(x);
    }
    if (typeof x === 'string') return display ? x : JSON.stringify(x);
    if (x instanceof Sym) return x.name;
    if (x instanceof Lambda) return `#[compound-procedure ${hash(x)}${x.name ? ` ${x.name}` : ''}]`;
    if (typeof x === 'function') return `#[compiled-procedure ${hash(x)} ("${x.schemeName}" #x10) #xbc ${x.schemeName}]`;
    if (x instanceof Pair) {
      if (x.car === sym('quote') && x.cdr instanceof Pair && x.cdr.cdr === NIL) return `'${write(x.cdr.car, display)}`;
      const parts = [];
      let p = x;
      for (; p instanceof Pair; p = p.cdr) parts.push(write(p.car, display));
      return `(${parts.join(' ')}${p !== NIL ? ` . ${write(p, display)}` : ''})`;
    }
    return '';
  }

  // ---- evaluator ----
  class Env {
    constructor(outer = null) { this.vars = new Map(); this.outer = outer; }
    lookup(s) {
      for (let e = this; e; e = e.outer) if (e.vars.has(s)) return e.vars.get(s);
      throw new SchemeError(`Unbound variable: ${s.name}`);
    }
    define(s, v) { this.vars.set(s, v); }
    set(s, v) {
      for (let e = this; e; e = e.outer) if (e.vars.has(s)) { e.vars.set(s, v); return; }
      throw new SchemeError(`Unbound variable: ${s.name}`);
    }
  }

  class Lambda {
    constructor(params, body, env, name = null) {
      if (body === NIL) throw new SchemeError('Ill-formed special form: (lambda)');
      this.params = params; this.body = body; this.env = env; this.name = name;
    }
    bind(args) {
      const env = new Env(this.env);
      let p = this.params, i = 0;
      for (; p instanceof Pair; p = p.cdr, i++) {
        if (i >= args.length) this.arityError(args.length);
        env.define(p.car, args[i]);
      }
      if (p instanceof Sym) env.define(p, list(...args.slice(i)));
      else if (i < args.length) this.arityError(args.length);
      return env;
    }
    arityError(n) {
      let req = 0, p = this.params;
      for (; p instanceof Pair; p = p.cdr) req++;
      const s = (k) => (k === 1 ? '' : 's');
      throw new SchemeError(`The procedure ${write(this)} has been called with ${n} argument${s(n)}; `
        + `it requires ${p instanceof Sym ? 'at least' : 'exactly'} ${req} argument${s(req)}.`);
    }
  }

  const FUEL_MAX = 3000000;
  let fuel = 0;

  function form(x, min, max = Infinity) {
    const parts = [];
    let p = x.cdr;
    for (; p instanceof Pair; p = p.cdr) parts.push(p.car);
    if (p !== NIL || parts.length < min || parts.length > max) throw new SchemeError(`Ill-formed special form: ${write(x)}`);
    return parts;
  }

  // Evaluates every expression in `body` but the last, which is returned
  // unevaluated so the caller can loop on it (proper tail calls).
  function bodyTail(body, env) {
    if (!(body instanceof Pair)) throw new SchemeError('Ill-formed special form: empty body');
    for (; body.cdr instanceof Pair; body = body.cdr) evaluate(body.car, env);
    return body.car;
  }

  const SPECIAL = new Set(['quote', 'if', 'define', 'set!', 'lambda', 'begin', 'let', 'let*', 'letrec', 'letrec*', 'cond', 'and', 'or', 'when', 'unless']);

  // Special forms live outside evaluate() to keep its stack frame small —
  // that frame is what bounds non-tail recursion depth. Tail positions
  // hand (x, env) back through tailX/tailEnv instead of recursing.
  const TAIL = Object.freeze({ tail: true });
  let tailX, tailEnv;
  const tail = (x, env) => { tailX = x; tailEnv = env; return TAIL; };

  function special(op, x, env) {
    switch (op.name) {
      case 'quote': return form(x, 1, 1)[0];
      case 'if': {
        const [test, then, alt] = form(x, 2, 3);
        if (evaluate(test, env) !== false) x = then;
        else if (alt === undefined) return UNSPEC;
        else x = alt;
        return tail(x, env);
      }
      case 'define': {
        const [target, value] = form(x, 1);
        if (target instanceof Pair) {
          if (!(target.car instanceof Sym)) throw new SchemeError(`Variable required in this context: ${write(target.car)}`);
          env.define(target.car, new Lambda(target.cdr, x.cdr.cdr, env, target.car.name));
          return target.car;
        }
        if (!(target instanceof Sym)) throw new SchemeError(`Variable required in this context: ${write(target)}`);
        const v = value === undefined ? UNSPEC : evaluate(value, env);
        if (v instanceof Lambda && !v.name) v.name = target.name;
        env.define(target, v);
        return target;
      }
      case 'set!': {
        const [target, value] = form(x, 2, 2);
        if (!(target instanceof Sym)) throw new SchemeError(`Variable required in this context: ${write(target)}`);
        env.set(target, evaluate(value, env));
        return UNSPEC;
      }
      case 'lambda':
        form(x, 2);
        return new Lambda(x.cdr.car, x.cdr.cdr, env);
      case 'begin':
        form(x, 0);
        if (x.cdr === NIL) return UNSPEC;
        x = bodyTail(x.cdr, env);
        return tail(x, env);
      case 'let': case 'let*': case 'letrec': case 'letrec*': {
        const parts = form(x, 2);
        let named = null, bindings = parts[0], body = x.cdr.cdr;
        if (op.name === 'let' && bindings instanceof Sym) {
          form(x, 3);
          named = bindings; bindings = parts[1]; body = x.cdr.cdr.cdr;
        }
        const names = [], inits = [];
        for (let b = bindings; b !== NIL; b = b.cdr) {
          if (!(b instanceof Pair) || !(b.car instanceof Pair) || !(b.car.car instanceof Sym)) {
            throw new SchemeError(`Ill-formed special form: ${write(x)}`);
          }
          names.push(b.car.car);
          inits.push(b.car.cdr instanceof Pair ? b.car.cdr.car : UNSPEC);
        }
        if (op.name === 'let') {
          const vals = inits.map((e) => evaluate(e, env));
          if (named) {
            const loopEnv = new Env(env);
            const proc = new Lambda(list(...names), body, loopEnv, named.name);
            loopEnv.define(named, proc);
            env = proc.bind(vals);
          } else {
            env = new Env(env);
            names.forEach((n, i) => env.define(n, vals[i]));
          }
        } else {
          env = new Env(env);
          names.forEach((n, i) => env.define(n, evaluate(inits[i], env)));
        }
        x = bodyTail(body, env);
        return tail(x, env);
      }
      case 'cond': {
        let next = null;
        for (let c = x.cdr; c instanceof Pair; c = c.cdr) {
          const clause = c.car;
          if (!(clause instanceof Pair)) throw new SchemeError(`Ill-formed special form: ${write(x)}`);
          if (clause.car === sym('else')) { next = bodyTail(clause.cdr, env); break; }
          const v = evaluate(clause.car, env);
          if (v !== false) {
            if (clause.cdr === NIL) return v;
            next = bodyTail(clause.cdr, env);
            break;
          }
        }
        if (next === null) return UNSPEC;
        x = next;
        return tail(x, env);
      }
      case 'and': case 'or': {
        const isAnd = op.name === 'and';
        if (x.cdr === NIL) return isAnd;
        let p = x.cdr;
        for (; p.cdr instanceof Pair; p = p.cdr) {
          const v = evaluate(p.car, env);
          if (isAnd ? v === false : v !== false) return v;
        }
        x = p.car;
        return tail(x, env);
      }
      case 'when': case 'unless': {
        form(x, 2);
        const t = evaluate(x.cdr.car, env) !== false;
        if (t !== (op.name === 'when')) return UNSPEC;
        x = bodyTail(x.cdr.cdr, env);
        return tail(x, env);
      }
    }
  }

  function evaluate(x, env) {
    for (;;) {
      if (++fuel > FUEL_MAX) throw new SchemeError('Aborting!: out of fuel — 3,000,000 steps without an answer.');
      if (x instanceof Sym) return env.lookup(x);
      if (!(x instanceof Pair)) {
        if (x === NIL) throw new SchemeError('Combination must be a proper list');
        return x;
      }
      const op = x.car;
      if (op instanceof Sym && SPECIAL.has(op.name)) {
        const v = special(op, x, env);
        if (v !== TAIL) return v;
        x = tailX;
        env = tailEnv;
        continue;
      }
      const f = evaluate(op, env);
      const args = [];
      let p = x.cdr;
      for (; p instanceof Pair; p = p.cdr) args.push(evaluate(p.car, env));
      if (p !== NIL) throw new SchemeError('Combination must be a proper list');
      if (f instanceof Lambda) {
        env = f.bind(args);
        x = bodyTail(f.body, env);
        continue;
      }
      if (typeof f === 'function') return f(...args);
      throw new SchemeError(`The object ${write(f)} is not applicable.`);
    }
  }

  function apply(f, args) {
    if (f instanceof Lambda) {
      const env = f.bind(args);
      return evaluate(bodyTail(f.body, env), env);
    }
    if (typeof f === 'function') return f(...args);
    throw new SchemeError(`The object ${write(f)} is not applicable.`);
  }

  // ---- primitives ----
  const isNum = (x) => typeof x === 'bigint' || typeof x === 'number';
  const num = (x, i, who) => { if (!isNum(x)) throw wrongType(x, i, who); return x; };
  const int = (x, i, who) => {
    if (typeof x === 'bigint') return x;
    if (typeof x === 'number' && Number.isInteger(x)) return BigInt(x);
    throw wrongType(x, i, who);
  };

  function arith(op, a, b) {
    if (typeof a === 'bigint' && typeof b === 'bigint') {
      if (op === '+') return a + b;
      if (op === '-') return a - b;
      if (op === '*') return a * b;
      if (b === 0n) throw new SchemeError('Division by zero signalled by /.');
      return a % b === 0n ? a / b : Number(a) / Number(b);
    }
    a = Number(a); b = Number(b);
    if (op === '+') return a + b;
    if (op === '-') return a - b;
    if (op === '*') return a * b;
    if (b === 0) throw new SchemeError('Division by zero signalled by /.');
    return a / b;
  }

  const eqv = (a, b) => a === b;
  const equal = (a, b) => (a instanceof Pair && b instanceof Pair ? equal(a.car, b.car) && equal(a.cdr, b.cdr) : eqv(a, b));
  const pair = (x, who) => { if (!(x instanceof Pair)) throw wrongType(x, 0, who); return x; };

  let print = () => {};
  let global;

  const PROJECTS = {
    'scheme-interpreter': 'A Lisp in hand-written C: reader, eval/apply core, closures over frame-chained environments, manual memory ownership.',
    'notion-mcp': 'A Model Context Protocol server exposing Notion to LLM agents as tools — built before the official integration existed.',
    'mit-scheme-apple-silicon': 'Native port of MIT/GNU Scheme 12.1 to AArch64. The LIAR compiler emits ARM64 machine code; 96 of 97 upstream tests pass.',
    claudecraft: 'Claude inside a Minecraft server: /ask, or spawn a bot that plans, moves, and places blocks in an agentic tool-use loop.',
    'hydrogen-orbitals': 'Interactive 3D hydrogen orbitals in single-file WebGL, sampled from the exact |ψ|². The thing behind this card is its little sibling.',
    'rift-recap': 'Flask app pulling recent League of Legends matches from the Riot API.',
    'remote-control': 'Native Swift remote for Apple TV and HomeKit/Matter accessories over Wi-Fi and Bluetooth.',
    mastodon: 'Customizing a production Rails + React/TypeScript federated social network.',
  };

  const HELP = `;; Things to try:
;;   (fact 100)              ; exact bignums
;;   (map square (iota 10))
;;   (projects)
;;   (describe 'claudecraft)
;;   (next-orbital)          ; new physics
;;   (theme 'light)  (party!)  (hire-mj)
;;   (clear)  (exit)`;

  function scrollToSection(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function makeGlobal() {
    const env = new Env();
    const def = (name, fn) => { fn.schemeName = name; env.define(sym(name), fn); };

    def('+', (...xs) => xs.reduce((a, x, i) => arith('+', a, num(x, i, 'integer-add')), 0n));
    def('*', (...xs) => xs.reduce((a, x, i) => arith('*', a, num(x, i, 'integer-multiply')), 1n));
    def('-', (...xs) => {
      xs.forEach((x, i) => num(x, i, 'integer-subtract'));
      if (xs.length === 1) return arith('-', 0n, xs[0]);
      return xs.slice(1).reduce((a, x) => arith('-', a, x), xs[0]);
    });
    def('/', (...xs) => {
      xs.forEach((x, i) => num(x, i, '/'));
      if (xs.length === 1) return arith('/', 1n, xs[0]);
      return xs.slice(1).reduce((a, x) => arith('/', a, x), xs[0]);
    });
    const cmp = (name, who, test) => def(name, (...xs) => {
      xs.forEach((x, i) => num(x, i, who));
      for (let i = 0; i + 1 < xs.length; i++) if (!test(xs[i], xs[i + 1])) return false;
      return true;
    });
    cmp('=', 'integer-equal?', (a, b) => a == b); // == on purpose: compares BigInt with Number
    cmp('<', 'integer-less?', (a, b) => a < b);
    cmp('>', 'integer-greater?', (a, b) => a > b);
    cmp('<=', 'integer-less-or-equal?', (a, b) => a <= b);
    cmp('>=', 'integer-greater-or-equal?', (a, b) => a >= b);
    def('quotient', (a, b) => {
      const d = int(b, 1, 'integer-quotient');
      if (d === 0n) throw new SchemeError('Division by zero signalled by integer-quotient.');
      return int(a, 0, 'integer-quotient') / d;
    });
    def('remainder', (a, b) => {
      const d = int(b, 1, 'integer-remainder');
      if (d === 0n) throw new SchemeError('Division by zero signalled by integer-remainder.');
      return int(a, 0, 'integer-remainder') % d;
    });
    def('modulo', (a, b) => {
      const d = int(b, 1, 'integer-modulo');
      if (d === 0n) throw new SchemeError('Division by zero signalled by integer-modulo.');
      return ((int(a, 0, 'integer-modulo') % d) + d) % d;
    });
    def('abs', (x) => (num(x, 0, 'integer-abs') < 0 ? arith('-', 0n, x) : x));
    def('min', (...xs) => xs.reduce((a, x, i) => (num(x, i, 'min') < a ? x : a)));
    def('max', (...xs) => xs.reduce((a, x, i) => (num(x, i, 'max') > a ? x : a)));
    def('square', (x) => arith('*', num(x, 0, 'integer-multiply'), x));
    def('1+', (x) => arith('+', num(x, 0, 'integer-add'), 1n));
    def('-1+', (x) => arith('-', num(x, 0, 'integer-subtract'), 1n));
    def('expt', (b, e) => {
      num(b, 0, 'expt'); num(e, 1, 'expt');
      if (typeof b === 'bigint' && typeof e === 'bigint' && e >= 0n) {
        if (e > 100000n) throw new SchemeError('Aborting!: out of memory');
        return b ** e;
      }
      return Math.pow(Number(b), Number(e));
    });
    def('sqrt', (x) => {
      num(x, 0, 'sqrt');
      if (typeof x === 'bigint' && x >= 0n) {
        const r = BigInt(Math.round(Math.sqrt(Number(x))));
        if (r * r === x) return r;
      }
      return Math.sqrt(Number(x));
    });
    def('exact->inexact', (x) => Number(num(x, 0, 'exact->inexact')));
    def('inexact->exact', (x) => {
      if (typeof x === 'number' && !Number.isInteger(x)) throw new SchemeError(`Integer too large to be converted to exact: ${write(x)}`);
      return typeof x === 'bigint' ? x : BigInt(num(x, 0, 'inexact->exact'));
    });
    def('number?', (x) => isNum(x));
    def('integer?', (x) => typeof x === 'bigint' || (typeof x === 'number' && Number.isInteger(x)));
    def('zero?', (x) => num(x, 0, 'zero?') == 0);
    def('positive?', (x) => num(x, 0, 'positive?') > 0);
    def('negative?', (x) => num(x, 0, 'negative?') < 0);
    def('even?', (x) => int(x, 0, 'integer-remainder') % 2n === 0n);
    def('odd?', (x) => int(x, 0, 'integer-remainder') % 2n !== 0n);
    def('random', (n) => {
      num(n, 0, 'random');
      return typeof n === 'bigint' ? BigInt(Math.floor(Math.random() * Number(n))) : Math.random() * n;
    });
    def('runtime', () => performance.now() / 1000);

    def('car', (x) => pair(x, 'car').car);
    def('cdr', (x) => pair(x, 'cdr').cdr);
    def('cadr', (x) => pair(pair(x, 'cadr').cdr, 'cadr').car);
    def('cddr', (x) => pair(pair(x, 'cddr').cdr, 'cddr').cdr);
    def('caddr', (x) => pair(pair(pair(x, 'caddr').cdr, 'caddr').cdr, 'caddr').car);
    def('cons', (a, b) => new Pair(a, b));
    def('list', (...xs) => list(...xs));
    def('length', (x) => BigInt(toArray(x, 'length').length));
    def('reverse', (x) => toArray(x, 'reverse').reduce((acc, v) => new Pair(v, acc), NIL));
    def('append', (...ls) => {
      if (!ls.length) return NIL;
      const last = ls.pop();
      return ls.flatMap((l) => toArray(l, 'append')).reduceRight((acc, v) => new Pair(v, acc), last);
    });
    def('list-ref', (l, k) => {
      const xs = toArray(l, 'list-ref');
      const i = Number(int(k, 1, 'list-ref'));
      if (i < 0 || i >= xs.length) throw wrongType(k, 1, 'list-ref');
      return xs[i];
    });
    def('iota', (n, start = 0n, step = 1n) => {
      const count = Number(int(n, 0, 'iota'));
      if (count > 100000) throw new SchemeError('Aborting!: out of memory');
      return list(...Array.from({ length: Math.max(0, count) }, (_, i) => arith('+', start, arith('*', BigInt(i), step))));
    });
    def('null?', (x) => x === NIL);
    def('pair?', (x) => x instanceof Pair);
    def('list?', (x) => { let p = x; while (p instanceof Pair) p = p.cdr; return p === NIL; });
    def('map', (f, ...ls) => {
      const arrs = ls.map((l) => toArray(l, 'map'));
      const n = Math.min(...arrs.map((a) => a.length));
      return list(...Array.from({ length: n }, (_, i) => apply(f, arrs.map((a) => a[i]))));
    });
    def('for-each', (f, ...ls) => {
      const arrs = ls.map((l) => toArray(l, 'for-each'));
      const n = Math.min(...arrs.map((a) => a.length));
      for (let i = 0; i < n; i++) apply(f, arrs.map((a) => a[i]));
      return UNSPEC;
    });
    def('filter', (f, l) => list(...toArray(l, 'filter').filter((x) => apply(f, [x]) !== false)));
    def('reduce', (f, init, l) => {
      const xs = toArray(l, 'reduce');
      return xs.length ? xs.slice(1).reduce((acc, x) => apply(f, [x, acc]), xs[0]) : init;
    });
    def('fold-left', (f, init, l) => toArray(l, 'fold-left').reduce((acc, x) => apply(f, [acc, x]), init));
    def('fold-right', (f, init, l) => toArray(l, 'fold-right').reduceRight((acc, x) => apply(f, [x, acc]), init));
    def('apply', (f, ...args) => {
      const last = args.pop();
      return apply(f, [...args, ...toArray(last === undefined ? NIL : last, 'apply')]);
    });
    def('assq', (k, l) => toArray(l, 'assq').find((p) => p instanceof Pair && eqv(p.car, k)) ?? false);
    def('assoc', (k, l) => toArray(l, 'assoc').find((p) => p instanceof Pair && equal(p.car, k)) ?? false);
    def('memq', (k, l) => {
      for (let p = l; p instanceof Pair; p = p.cdr) if (eqv(p.car, k)) return p;
      return false;
    });

    def('eq?', eqv);
    def('eqv?', eqv);
    def('equal?', equal);
    def('not', (x) => x === false);
    def('boolean?', (x) => typeof x === 'boolean');
    def('symbol?', (x) => x instanceof Sym);
    def('string?', (x) => typeof x === 'string');
    def('procedure?', (x) => x instanceof Lambda || typeof x === 'function');
    def('symbol->string', (x) => { if (!(x instanceof Sym)) throw wrongType(x, 0, 'symbol->string'); return x.name; });
    def('string->symbol', (x) => { if (typeof x !== 'string') throw wrongType(x, 0, 'string->symbol'); return sym(x); });
    def('number->string', (x) => write(num(x, 0, 'number->string')));
    def('string->number', (s) => {
      if (typeof s !== 'string') throw wrongType(s, 0, 'string->number');
      const v = atom(s.trim() || '#f');
      return isNum(v) ? v : false;
    });
    def('string-append', (...xs) => xs.map((x, i) => { if (typeof x !== 'string') throw wrongType(x, i, 'string-append'); return x; }).join(''));
    def('string-length', (s) => { if (typeof s !== 'string') throw wrongType(s, 0, 'string-length'); return BigInt([...s].length); });
    def('string-upcase', (s) => { if (typeof s !== 'string') throw wrongType(s, 0, 'string-upcase'); return s.toUpperCase(); });

    def('display', (x) => { print(write(x, true)); return UNSPEC; });
    def('write', (x) => { print(write(x)); return UNSPEC; });
    def('newline', () => { print('\n'); return UNSPEC; });

    // ---- the fun part ----
    def('help', () => { print(`${HELP}\n`); return SILENT; });
    def('whoami', () => 'Mohamad Jad Chaker (MJ) — computer programmer and independent musician.');
    def('projects', () => list(...Object.keys(PROJECTS).map(sym)));
    def('describe', (p) => {
      const key = p instanceof Sym ? p.name : p;
      if (typeof key !== 'string' || !PROJECTS[key]) throw new SchemeError(`Unknown project: ${write(p)} — try (projects)`);
      return PROJECTS[key];
    });
    def('skills', () => list(...['c', 'python', 'scheme', 'java', 'swift', 'c++', 'dsp', 'logic-pro'].map(sym)));
    def('music', () => { scrollToSection('music'); return '“The Light” — out now on Spotify and Apple Music.'; });
    def('hire-mj', () => { scrollToSection('contact'); return 'Excellent choice. mjchaker19@gmail.com'; });
    def('theme', (t) => {
      const name = t instanceof Sym ? t.name : t;
      if (name !== 'light' && name !== 'dark') throw new SchemeError("Try (theme 'light) or (theme 'dark)");
      window.mj?.setTheme(name);
      return sym(name);
    });
    def('party!', () => (window.mj?.toggleParty() ? sym('party-on') : sym('party-off')));
    def('orbital', () => (field ? sym(field.current()) : false));
    def('next-orbital', () => (field ? sym(field.next()) : false));
    def('clear', () => { out.replaceChildren(); return SILENT; });
    def('exit', () => {
      print('Moriturus te saluto.\n');
      global = makeGlobal();
      return SILENT;
    });
    return env;
  }

  /* ============================================================
     REPL UI
     ============================================================ */
  const out = document.getElementById('repl-out');
  const replForm = document.getElementById('repl-form');
  const input = document.getElementById('repl-input');
  const prompt = document.getElementById('repl-prompt');

  if (out && replForm && input) {
    global = makeGlobal();
    const history = [];
    let hIdx = 0;
    let pending = '';
    let printed = '';
    print = (s) => { printed += s; };

    const line = (text, cls, promptText) => {
      const div = document.createElement('div');
      div.className = cls;
      if (promptText) {
        const p = document.createElement('span');
        p.className = 'ln-prompt';
        p.textContent = `${promptText} `;
        div.append(p);
      }
      div.append(text);
      out.append(div);
      while (out.childElementCount > 400) out.firstElementChild.remove();
      out.scrollTop = out.scrollHeight;
    };
    const flush = () => {
      if (printed) line(printed.replace(/\n$/, ''), 'ln-out');
      printed = '';
    };

    function run(expr, silent = false) {
      fuel = 0;
      printed = '';
      if (expr === sym('help') && !silent) {
        line(";; It's a Lisp — try (help), with the parens.", 'ln-meta');
        return;
      }
      try {
        const v = evaluate(expr, global);
        if (silent) { printed = ''; return; }
        flush();
        if (v === SILENT) return;
        if (v === UNSPEC || v === undefined) line(';Unspecified return value', 'ln-meta');
        else if (typeof v === 'boolean' && !v) line(';Value: #f', 'ln-val');
        else line(`;Value: ${write(v)}`, 'ln-val');
      } catch (e) {
        if (silent) return;
        flush();
        if (e instanceof RangeError) line(';Aborting!: maximum recursion depth exceeded', 'ln-err');
        else line(`;${e.message}`, 'ln-err');
      }
    }

    function submit(src) {
      line(src, 'ln-in', pending ? '..' : 'λ>');
      const text = pending ? `${pending}\n${src}` : src;
      let forms;
      try {
        forms = readAll(text);
      } catch (e) {
        if (e instanceof Incomplete) {
          pending = text;
          prompt.textContent = '..';
          return;
        }
        forms = null;
        line(`;${e.message}`, 'ln-err');
      }
      pending = '';
      prompt.textContent = 'λ>';
      if (text.trim()) { history.push(text); hIdx = history.length; }
      if (forms) forms.forEach((f) => run(f));
    }

    replForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const src = input.value;
      input.value = '';
      submit(src);
    });
    input.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp' && hIdx > 0) {
        e.preventDefault();
        input.value = history[--hIdx];
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        hIdx = Math.min(history.length, hIdx + 1);
        input.value = history[hIdx] ?? '';
      } else if (e.key === 'l' && e.ctrlKey) {
        e.preventDefault();
        out.replaceChildren();
      }
    });
    document.getElementById('repl').addEventListener('click', () => {
      if (!window.getSelection()?.toString()) input.focus({ preventScroll: true });
    });

    // Opening demo: types a definition and a bignum, then hands over.
    const FACT = '(define (fact n) (if (= n 0) 1 (* n (fact (- n 1)))))';
    const DEMO = [FACT, '(fact 25)'];
    let demoOn = true;
    const stopDemo = () => {
      if (!demoOn) return;
      demoOn = false;
      input.value = '';
      if (!global.vars.has(sym('fact'))) run(readAll(FACT)[0], true);
    };
    input.addEventListener('focus', stopDemo);
    input.addEventListener('keydown', stopDemo);

    line(';; mj-scheme — a small Scheme, running live in your browser.', 'ln-meta');
    line(';; Type (help) for things to try.', 'ln-meta');
    (async () => {
      if (reduceMotion) { DEMO.forEach(submit); demoOn = false; return; }
      await sleep(1100);
      for (const src of DEMO) {
        for (let i = 1; i <= src.length; i++) {
          if (!demoOn) return;
          input.value = src.slice(0, i);
          await sleep(18 + Math.random() * 38);
        }
        await sleep(280);
        if (!demoOn) return;
        input.value = '';
        submit(src);
        await sleep(650);
      }
      demoOn = false;
    })();
  }

  /* ============================================================
     "currently" line — decodes from noise between phrases
     ============================================================ */
  const nowText = document.getElementById('now-text');
  if (nowText && !reduceMotion) {
    const PHRASES = [
      'porting compilers to new silicon',
      'writing Lisps in C, by hand',
      'wiring LLMs into real tools',
      'mixing tracks in Logic Pro',
      'rendering |ψ|² in the browser',
    ];
    const GLYPHS = '!<>-_\\/[]{}—=+*^?#λψ01';
    let n = 0;
    const scrambleTo = (text) => {
      const from = nowText.textContent;
      const queue = Array.from({ length: Math.max(from.length, text.length) }, (_, i) => {
        const start = Math.floor(Math.random() * 16);
        return { from: from[i] || '', to: text[i] || '', start, end: start + Math.floor(Math.random() * 18), ch: '' };
      });
      let frame = 0;
      const tick = () => {
        let s = '', done = 0;
        for (const q of queue) {
          if (frame >= q.end) { done++; s += q.to; }
          else if (frame >= q.start) {
            if (!q.ch || Math.random() < 0.28) q.ch = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
            s += q.ch;
          } else s += q.from;
        }
        nowText.textContent = s;
        if (done < queue.length) { frame++; requestAnimationFrame(tick); }
      };
      tick();
    };
    setInterval(() => {
      if (document.hidden) return;
      n = (n + 1) % PHRASES.length;
      scrambleTo(PHRASES[n]);
    }, 3400);
  }

  /* ============================================================
     Count-up stats
     ============================================================ */
  const stats = document.querySelector('.stats');
  if (stats && !reduceMotion) {
    const nums = stats.querySelectorAll('[data-count]');
    nums.forEach((el) => { el.textContent = '0'; });
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      obs.disconnect();
      const t0 = performance.now();
      const tick = (now) => {
        const k = Math.min(1, (now - t0) / 1400);
        const eased = 1 - Math.pow(1 - k, 3);
        nums.forEach((el) => { el.textContent = Math.round(Number(el.dataset.count) * eased); });
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    obs.observe(stats);
  }

  /* ============================================================
     For the people who open devtools
     ============================================================ */
  console.log(
    '%cMJ%c\nReading the source? Good — that’s exactly who I like working with.\n'
    + 'Everything here is hand-written: no framework, no build step. The REPL up top is a real (small) Scheme.\n'
    + 'Say hi: mjchaker19@gmail.com',
    'font: 800 42px Inter, system-ui, sans-serif; background: linear-gradient(120deg, #7c6cff, #21d4b4); -webkit-background-clip: text; color: transparent;',
    'font: 500 13px ui-monospace, monospace; color: inherit;'
  );
})();
