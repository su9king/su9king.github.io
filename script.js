/* =========================================================
   Min-cheol Shin — Software is Art
   Cinematic interaction & background canvas.
   ========================================================= */

(function () {
    'use strict';

    /* ---------- Constants ---------- */
    const TOTAL_SCENES = 8;
    const TRANSITION_LOCK_MS = 1100;

    /* ---------- DOM ---------- */
    const scenes      = document.querySelectorAll('.scene');
    const hudFill     = document.getElementById('hud-fill');
    const hudCounter  = document.getElementById('hud-counter');
    const hint        = document.getElementById('hint');
    const canvas      = document.getElementById('bg-canvas');
    const ctx         = canvas.getContext('2d');
    const codeBlock   = document.getElementById('code-block');
    const langButtons = document.querySelectorAll('.lang-btn');

    /* ---------- State ---------- */
    let currentScene = 1;
    let isTransitioning = false;
    let mode = 'idle';
    let frame = 0;
    let codeStarted = false;
    let hintTimer = null;
    let lang = 'ko';

    /* ---------- Resize ---------- */
    let W = 0, H = 0, DPR = 1;
    function resize() {
        DPR = Math.min(window.devicePixelRatio || 1, 2);
        W = window.innerWidth;
        H = window.innerHeight;
        canvas.width = W * DPR;
        canvas.height = H * DPR;
        canvas.style.width = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    /* ---------- Custom cursor ---------- */
    const cursor = {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        lastMove: 0,
    };
    document.addEventListener('mousemove', (e) => {
        cursor.x = e.clientX;
        cursor.y = e.clientY;
        cursor.lastMove = performance.now();
        document.body.style.setProperty('--cx', cursor.x + 'px');
        document.body.style.setProperty('--cy', cursor.y + 'px');
    });

    /* ---------- Scene management ---------- */
    function showScene(n) {
        if (n < 1 || n > TOTAL_SCENES) return;
        if (n === currentScene) return;
        isTransitioning = true;

        const prev = document.querySelector(`.scene[data-scene="${currentScene}"]`);
        const next = document.querySelector(`.scene[data-scene="${n}"]`);

        if (prev) {
            prev.classList.remove('is-active');
            prev.classList.add('is-leaving');
            setTimeout(() => prev.classList.remove('is-leaving'), 800);
        }

        currentScene = n;

        setTimeout(() => {
            if (next) next.classList.add('is-active');
            updateHUD();
            updateMode();
            scheduleHint();
            if (n === 5) startCodeTyping();
            setTimeout(() => { isTransitioning = false; }, TRANSITION_LOCK_MS);
        }, 380);
    }

    function gotoNext() {
        if (isTransitioning) return;
        if (currentScene < TOTAL_SCENES) {
            showScene(currentScene + 1);
        } else {
            showScene(1);
        }
    }

    function gotoPrev() {
        if (isTransitioning) return;
        if (currentScene > 1) showScene(currentScene - 1);
    }

    function updateHUD() {
        const pct = ((currentScene - 1) / (TOTAL_SCENES - 1)) * 100;
        hudFill.style.width = pct + '%';
        hudCounter.textContent =
            String(currentScene).padStart(2, '0') + ' / ' +
            String(TOTAL_SCENES).padStart(2, '0');
    }

    function scheduleHint() {
        hint.classList.remove('is-visible');
        clearTimeout(hintTimer);
        const hintText = hint.querySelector('.hint-text');
        if (currentScene === TOTAL_SCENES) {
            // hold the hint silent through the credits, then invite a replay
            if (hintText) hintText.textContent = 'press to replay';
            hintTimer = setTimeout(() => hint.classList.add('is-visible'), 92000);
            return;
        }
        if (hintText) hintText.textContent = 'press any key';
        hintTimer = setTimeout(() => hint.classList.add('is-visible'), 2400);
    }

    function updateMode() {
        const sceneEl = document.querySelector(`.scene[data-scene="${currentScene}"]`);
        mode = (sceneEl && sceneEl.dataset.canvas) || 'idle';
    }

    /* ---------- Input handlers ---------- */

    const IGNORED_KEYS = new Set([
        'Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab',
        'NumLock', 'ScrollLock', 'Escape', 'ContextMenu',
        'AudioVolumeUp', 'AudioVolumeDown', 'AudioVolumeMute',
    ]);

    function shouldSkipForTarget(target) {
        if (!target) return false;
        return !!target.closest('a, button, input, textarea, select');
    }

    document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (IGNORED_KEYS.has(e.key)) return;
        if (e.key && e.key.length > 1 && /^F\d+$/.test(e.key)) return;
        if (shouldSkipForTarget(e.target)) return;

        if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
            e.preventDefault();
            gotoPrev();
            return;
        }

        e.preventDefault();
        gotoNext();
    });

    document.addEventListener('click', (e) => {
        if (shouldSkipForTarget(e.target)) return;
        gotoNext();
    });

    document.addEventListener('touchstart', (e) => {
        if (shouldSkipForTarget(e.target)) return;
        // do not preventDefault to allow scrolling for credits if needed
        gotoNext();
    }, { passive: true });

    let wheelLock = 0;
    document.addEventListener('wheel', (e) => {
        if (isTransitioning) return;
        if (Math.abs(e.deltaY) < 12) return;
        const now = performance.now();
        if (now - wheelLock < 700) return;
        wheelLock = now;
        if (e.deltaY > 0) gotoNext(); else gotoPrev();
    }, { passive: true });

    /* ---------- Lang toggle ---------- */

    const COPY = {
        ko: {
            'meta-presents': 'a film by',
            'display-translation': '소프트웨어는 예술이다.',
            'prologue': [
                '전통의 예술이 캔버스 위에 메시지를 그렸다면,',
                '오늘의 소프트웨어는 모니터라는 캔버스 위에서',
                '사용자와 <em>실시간으로</em> 호흡하며',
                '새로운 문화를 그려낸다.',
            ],
            'act-1-title': '인터페이스의 미학',
            'act-1-en':    'Aesthetics of Interaction',
            'act-1-body':  '타이포그래피와 색, 여백과 모션.<br>잘 만들어진 인터페이스를 탐색할 때<br>우리는 <em>갤러리를 거니는 듯한</em> 몰입을 느낀다.',
            'act-1-hint':  '— 마우스를 움직여 보세요',
            'act-2-title': '보이지 않는 것의 시각화',
            'act-2-en':    'Visualizing the Invisible',
            'act-2-body':  '수백만 건의 트랜잭션, 메모리의 흐름, 런타임의 병목.<br>눈에 보이지 않는 시스템의 호흡을<br>한 장의 그래프로 <em>조각해내는</em> 일.',
            'act-3-title': '코드의 구조미',
            'act-3-en':    'The Visual Structure of Code',
            'act-3-body-q':'"코드가 아름답다"라고 말할 때, 우리는<br>논리의 완벽함과 함께 <em>형태의 안정감</em>을 본다.',
            'act-4-title': '새로운 창작의 패러다임',
            'act-4-en':    'A New Paradigm of Creation',
            'act-4-body':  '소프트웨어는 더 이상 정보를 소비하는 매체가 아니다.<br>이제 그것은 <em>예술을 생성하고 탐구하는 주체</em>다.',
            'epilogue': [
                '결국 소프트웨어는',
                '인간과 기계를 잇는 번역기이며,',
                '<em>우리 시대의 가장 거대한 시각 예술의 캔버스다.</em>',
            ],
        },
        en: {
            'meta-presents': 'a film by',
            'display-translation': '소프트웨어는 예술이다.',
            'prologue': [
                'If classical art drew its message on canvas,',
                'today\'s software paints on the canvas of a screen —',
                'breathing with the user <em>in real time,</em>',
                'and shaping a new culture.',
            ],
            'act-1-title': 'Aesthetics of Interaction',
            'act-1-en':    '인터페이스의 미학',
            'act-1-body':  'Typography and color, white space and motion.<br>When you explore a well-crafted interface,<br>you feel <em>as though wandering through a gallery.</em>',
            'act-1-hint':  '— move your cursor',
            'act-2-title': 'Visualizing the Invisible',
            'act-2-en':    '보이지 않는 것의 시각화',
            'act-2-body':  'Millions of transactions, memory flowing, runtimes throttled.<br>To <em>sculpt</em> the unseen breath of a system<br>into a single, legible graph.',
            'act-3-title': 'The Visual Structure of Code',
            'act-3-en':    '코드의 구조미',
            'act-3-body-q':'When we say <em>"the code is beautiful,"</em><br>we mean both the logic — and the form.',
            'act-4-title': 'A New Paradigm of Creation',
            'act-4-en':    '새로운 창작의 패러다임',
            'act-4-body':  'Software is no longer just a medium of consumption.<br>It has become <em>a creator and an explorer</em> of art itself.',
            'epilogue': [
                'In the end, software',
                'is a translator between human and machine —',
                '<em>the largest canvas of visual art in our time.</em>',
            ],
        },
    };

    function applyLang(L) {
        lang = L;
        const C = COPY[L];

        document.querySelectorAll('.meta-presents').forEach(el => el.textContent = C['meta-presents']);
        document.querySelector('.display-translation').textContent = C['display-translation'];

        // prologue
        const prologue = document.querySelectorAll('[data-scene="2"] .prose-line');
        C.prologue.forEach((t, i) => prologue[i] && (prologue[i].innerHTML = t));

        // acts
        const setIn = (sel, html) => { const el = document.querySelector(sel); if (el) el.innerHTML = html; };
        setIn('[data-scene="3"] .act-title', C['act-1-title']);
        setIn('[data-scene="3"] .act-en',    C['act-1-en']);
        setIn('[data-scene="3"] .act-body',  C['act-1-body']);
        setIn('[data-scene="3"] .act-hint',  C['act-1-hint']);
        setIn('[data-scene="4"] .act-title', C['act-2-title']);
        setIn('[data-scene="4"] .act-en',    C['act-2-en']);
        setIn('[data-scene="4"] .act-body',  C['act-2-body']);
        setIn('[data-scene="5"] .act-title', C['act-3-title']);
        setIn('[data-scene="5"] .act-en',    C['act-3-en']);
        setIn('[data-scene="5"] .act-body',  C['act-3-body-q']);
        setIn('[data-scene="6"] .act-title', C['act-4-title']);
        setIn('[data-scene="6"] .act-en',    C['act-4-en']);
        setIn('[data-scene="6"] .act-body',  C['act-4-body']);

        // epilogue
        const epi = document.querySelectorAll('[data-scene="7"] .prose-line');
        C.epilogue.forEach((t, i) => epi[i] && (epi[i].innerHTML = t));

        document.documentElement.lang = (L === 'ko') ? 'ko' : 'en';
        langButtons.forEach(b => b.classList.toggle('is-active', b.dataset.lang === L));
    }

    langButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            applyLang(btn.dataset.lang);
        });
    });

    /* ---------- Background canvases ---------- */

    // Idle drift dust (used as base ambient)
    const dust = Array.from({ length: 70 }, () => ({
        x: Math.random(),
        y: Math.random(),
        z: Math.random() * 0.8 + 0.2,
        vx: (Math.random() - 0.5) * 0.00015,
        vy: (Math.random() - 0.5) * 0.00015,
    }));

    // Cursor trail
    const trail = [];

    // Topology
    const N_NODES = 14;
    const nodes = Array.from({ length: N_NODES }, () => ({
        x: Math.random(),
        y: Math.random(),
        r: 1.8 + Math.random() * 1.6,
        pulse: Math.random() * Math.PI * 2,
        load: Math.random(),
    }));
    const edges = [];
    for (let i = 0; i < nodes.length; i++) {
        const dists = [];
        for (let j = 0; j < nodes.length; j++) {
            if (i === j) continue;
            dists.push({ j, d: Math.hypot(nodes[j].x - nodes[i].x, nodes[j].y - nodes[i].y) });
        }
        dists.sort((a, b) => a.d - b.d);
        for (let k = 0; k < 2; k++) {
            const j = dists[k].j;
            const exists = edges.some(e =>
                (e.a === i && e.b === j) || (e.a === j && e.b === i)
            );
            if (!exists) edges.push({ a: i, b: j, packets: [] });
        }
    }

    // Generative particles
    const particles = Array.from({ length: 90 }, () => ({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: 0,
        vy: 0,
        age: Math.random() * 200,
    }));

    // pseudo-noise (sin-based)
    function noise2D(x, y) {
        return (
            Math.sin(x * 12.9898 + y * 78.233) * 0.5 +
            Math.sin(x * 39.346 + y * 11.135 + 1.7) * 0.3 +
            Math.sin(x * 5.123  + y * 27.842 + 3.1) * 0.2
        );
    }

    function drawDust() {
        ctx.fillStyle = 'rgba(245, 239, 226, 1)';
        for (const d of dust) {
            d.x += d.vx;
            d.y += d.vy;
            if (d.x < 0) d.x = 1; else if (d.x > 1) d.x = 0;
            if (d.y < 0) d.y = 1; else if (d.y > 1) d.y = 0;
            const size = d.z * 1.4;
            ctx.globalAlpha = d.z * 0.22;
            ctx.beginPath();
            ctx.arc(d.x * W, d.y * H, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    function drawCursorTrail() {
        drawDust();
        // only emit particles while the cursor is actually moving (recent move)
        if (performance.now() - cursor.lastMove < 80) {
            trail.push({
                x: cursor.x,
                y: cursor.y,
                life: 1,
                size: 5 + Math.random() * 8,
            });
        }
        if (trail.length > 120) trail.splice(0, trail.length - 120);
        for (let i = 0; i < trail.length; i++) {
            const t = trail[i];
            t.life -= 0.014;
            if (t.life <= 0) continue;
            ctx.globalAlpha = t.life * 0.55;
            ctx.fillStyle = '#c9a35b';
            ctx.beginPath();
            ctx.arc(t.x, t.y, t.size * t.life, 0, Math.PI * 2);
            ctx.fill();
        }
        // remove dead
        for (let i = trail.length - 1; i >= 0; i--) {
            if (trail[i].life <= 0) trail.splice(i, 1);
        }
        ctx.globalAlpha = 1;
    }

    function drawTopology() {
        // edges first
        for (const e of edges) {
            const a = nodes[e.a], b = nodes[e.b];
            const ax = a.x * W, ay = a.y * H;
            const bx = b.x * W, by = b.y * H;
            ctx.strokeStyle = 'rgba(201, 163, 91, 0.18)';
            ctx.lineWidth = 0.7;
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.stroke();

            if (Math.random() < 0.012) {
                e.packets.push({ t: 0, dir: Math.random() < 0.5 ? 1 : -1, speed: 0.008 + Math.random() * 0.01 });
            }
            for (let i = e.packets.length - 1; i >= 0; i--) {
                const p = e.packets[i];
                p.t += p.speed * p.dir;
                if (p.t > 1 || p.t < 0) {
                    e.packets.splice(i, 1);
                    continue;
                }
                const px = ax + (bx - ax) * p.t;
                const py = ay + (by - ay) * p.t;
                ctx.fillStyle = '#c9a35b';
                ctx.shadowColor = '#c9a35b';
                ctx.shadowBlur = 14;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.shadowBlur = 0;
        }

        // nodes
        for (const n of nodes) {
            n.pulse += 0.025;
            const pulse = 1 + Math.sin(n.pulse) * 0.25;
            const x = n.x * W, y = n.y * H;
            ctx.fillStyle = 'rgba(245, 239, 226, 0.9)';
            ctx.beginPath();
            ctx.arc(x, y, n.r * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = 'rgba(201, 163, 91, 0.35)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.arc(x, y, n.r * pulse + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    function drawGenerative() {
        // fade trail
        ctx.fillStyle = 'rgba(5, 4, 2, 0.07)';
        ctx.fillRect(0, 0, W, H);
        for (const p of particles) {
            const angle = noise2D(p.x * 0.0028, p.y * 0.0028 + frame * 0.0009) * Math.PI * 2;
            p.vx = (p.vx + Math.cos(angle) * 0.05) * 0.96;
            p.vy = (p.vy + Math.sin(angle) * 0.05) * 0.96;
            p.x += p.vx;
            p.y += p.vy;
            p.age++;
            if (p.x < -10 || p.x > W + 10 || p.y < -10 || p.y > H + 10 || p.age > 380) {
                p.x = Math.random() * W;
                p.y = Math.random() * H;
                p.age = 0;
                p.vx = 0; p.vy = 0;
            }
            ctx.fillStyle = 'rgba(201, 163, 91, 0.65)';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.1, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    function drawCodeBg() {
        // soft horizontal lines, slowly drifting (like a film leader)
        ctx.strokeStyle = 'rgba(201, 163, 91, 0.045)';
        ctx.lineWidth = 1;
        const offset = (frame * 0.4) % 32;
        for (let y = -offset; y < H; y += 32) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(W, y);
            ctx.stroke();
        }
        drawDust();
    }

    function tick() {
        frame++;
        ctx.clearRect(0, 0, W, H);

        switch (mode) {
            case 'cursor':     drawCursorTrail(); break;
            case 'topology':   drawTopology();    break;
            case 'generative': drawGenerative();  break;
            case 'code':       drawCodeBg();      break;
            default:           drawDust();
        }

        requestAnimationFrame(tick);
    }

    /* ---------- Code typing for Act III ---------- */

    const CODE_TEXT =
`// software is a canvas

const software = (intent) => {
    const meaning = think(intent);
    const form    = shape(meaning);
    const beauty  = refine(form);
    return beauty;
};

// for me, it has always been
//   not a tool, but a canvas.

software("hello, world.");`;

    const KEYWORDS = new Set(['const', 'return', 'let', 'var', 'new', 'class', 'function', 'if', 'else', 'for']);
    const FNS      = new Set(['software', 'think', 'shape', 'refine']);

    function escapeHTML(s) {
        return s
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    function tokenize(text) {
        const out = [];
        let i = 0;
        while (i < text.length) {
            const c = text[i];

            if (c === '/' && text[i + 1] === '/') {
                let end = text.indexOf('\n', i);
                if (end === -1) end = text.length;
                out.push({ t: 'cmt', v: text.slice(i, end) });
                i = end;
                continue;
            }

            if (c === '"' || c === "'") {
                const q = c;
                let j = i + 1;
                while (j < text.length && text[j] !== q) {
                    if (text[j] === '\\') j++;
                    j++;
                }
                out.push({ t: 'str', v: text.slice(i, Math.min(j + 1, text.length)) });
                i = j + 1;
                continue;
            }

            if (/[a-zA-Z_$]/.test(c)) {
                let j = i;
                while (j < text.length && /[a-zA-Z0-9_$]/.test(text[j])) j++;
                const word = text.slice(i, j);
                let t = 'id';
                if (KEYWORDS.has(word)) t = 'kw';
                else if (FNS.has(word)) t = 'fn';
                out.push({ t, v: word });
                i = j;
                continue;
            }

            if (c === '=' && text[i + 1] === '>') {
                out.push({ t: 'pun', v: '=>' });
                i += 2;
                continue;
            }

            if (/[(){}\[\];,.:=>+\-*/]/.test(c)) {
                out.push({ t: 'pun', v: c });
                i++;
                continue;
            }

            // whitespace and other
            out.push({ t: 'ws', v: c });
            i++;
        }
        return out;
    }

    function tokensToHTML(tokens) {
        let html = '';
        for (const tk of tokens) {
            if (tk.t === 'ws') html += escapeHTML(tk.v);
            else html += `<span class="tk-${tk.t}">${escapeHTML(tk.v)}</span>`;
        }
        return html;
    }

    function startCodeTyping() {
        if (codeStarted) {
            codeBlock.innerHTML = tokensToHTML(tokenize(CODE_TEXT)) +
                                 '<span class="caret"></span>';
            return;
        }
        codeStarted = true;
        codeBlock.innerHTML = '';
        let i = 0;

        function step() {
            if (currentScene !== 5) return;
            if (i > CODE_TEXT.length) return;
            const partial = CODE_TEXT.slice(0, i);
            codeBlock.innerHTML = tokensToHTML(tokenize(partial)) +
                                 '<span class="caret"></span>';
            const ch = CODE_TEXT.charAt(i);
            i++;
            let delay;
            if (ch === '\n')      delay = 130;
            else if (ch === ' ')  delay = 22;
            else                  delay = 30 + Math.random() * 28;
            setTimeout(step, delay);
        }

        setTimeout(step, 1100);
    }

    /* ---------- Init ---------- */

    function init() {
        // raise the curtain after first render
        setTimeout(() => {
            document.body.classList.add('is-curtain-up');
        }, 600);
        applyLang('ko');
        updateHUD();
        updateMode();
        scheduleHint();
        tick();
    }

    init();
})();
