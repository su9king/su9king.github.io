/* =========================================================
   Min Chul Shin — A Slideshow Argument that Software is Art

   12 slides, manually advanced.
   Web Audio composes a quiet ambient piece across the deck.
   Per-slide animations carry each argument.
   ========================================================= */

(function () {
    'use strict';

    /* ===================== DOM ===================== */
    const deck       = document.getElementById('deck');
    const slides     = Array.from(document.querySelectorAll('.slide'));
    const fillEl     = document.getElementById('progress-fill');
    const hintEl     = document.getElementById('hint');
    const flashEl    = document.getElementById('flash');
    const audioBtn   = document.getElementById('hud-audio');
    const bgmEl      = document.getElementById('bgm');

    const TOTAL = slides.length;

    /* ===================== ONE-TIME VIEW ===================== */
    // The piece is meant to be experienced once. After the first page-load,
    // returning visitors land directly on slide 12 (the signature).
    // Append `?replay` to the URL to clear the flag and see the full show again.
    const VISIT_KEY = 'mcs_software_is_art_seen_v1';

    function hasVisited() {
        try { return localStorage.getItem(VISIT_KEY) === '1'; }
        catch (_) { return false; }
    }
    function markVisited() {
        try { localStorage.setItem(VISIT_KEY, '1'); } catch (_) {}
    }

    const params = new URLSearchParams(location.search);
    if (params.has('replay')) {
        try { localStorage.removeItem(VISIT_KEY); } catch (_) {}
    }
    const REVISIT = hasVisited();

    /* ===================== STATE ===================== */
    let current = 1;
    let isTransitioning = false;
    const TRANSITION_LOCK_MS = 700;

    /* ===================== SLIDE NAVIGATION ===================== */
    function showSlide(n) {
        if (n === current) return;
        if (n < 1) n = 1;
        if (n > TOTAL) n = TOTAL;

        isTransitioning = true;
        const prev = slides[current - 1];
        const next = slides[n - 1];

        prev.classList.remove('is-active');
        prev.classList.add('is-leaving');
        setTimeout(() => prev.classList.remove('is-leaving'), 700);

        current = n;

        setTimeout(() => {
            next.classList.add('is-active');
            updateHUD();
            triggerSlideEnter(n);
            Music.onSlide(n);
            setTimeout(() => { isTransitioning = false; }, TRANSITION_LOCK_MS);
        }, 250);
    }

    function advance() {
        if (isTransitioning) return;
        if (REVISIT) return;          // revisit lock: stays on slide 12
        if (current === TOTAL) return; // no replay — once it's done, it's done
        triggerFlash();
        showSlide(current + 1);
    }

    function updateHUD() {
        fillEl.style.width = ((current - 1) / (TOTAL - 1) * 100) + '%';
    }

    function triggerFlash() {
        flashEl.classList.remove('is-flashing');
        void flashEl.offsetWidth;
        flashEl.classList.add('is-flashing');
    }

    /* ===================== HINT ===================== */
    let hintTimer;
    function showHintBriefly() {
        hintEl.classList.add('is-visible');
        clearTimeout(hintTimer);
        hintTimer = setTimeout(() => hintEl.classList.remove('is-visible'), 2400);
    }

    /* ===================== INPUT ===================== */
    const IGNORED = new Set([
        'Shift','Control','Alt','Meta','CapsLock','Tab','ContextMenu',
        'NumLock','ScrollLock','AudioVolumeUp','AudioVolumeDown','AudioVolumeMute',
    ]);

    function shouldSkipForTarget(target) {
        if (!target) return false;
        return !!target.closest('a, button, input, textarea, select');
    }

    document.addEventListener('keydown', (e) => {
        if (e.metaKey || e.ctrlKey || e.altKey) return;
        if (IGNORED.has(e.key)) return;
        if (/^F\d+$/.test(e.key)) return;
        if (shouldSkipForTarget(e.target)) return;

        Music.kickstart(); // first user gesture unlocks audio

        // Forward-only navigation. There is no going back.
        e.preventDefault();
        advance();
    });

    document.addEventListener('click', (e) => {
        if (shouldSkipForTarget(e.target)) return;
        Music.kickstart();
        advance();
    });

    document.addEventListener('touchstart', (e) => {
        if (shouldSkipForTarget(e.target)) return;
        Music.kickstart();
        advance();
    }, { passive: true });

    /* ===================== AUDIO TOGGLE ===================== */
    audioBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        Music.toggle();
    });

    /* ===================== PER-SLIDE ANIMATIONS ===================== */

    // Map slide *classes* to animations so the trigger never goes stale
    // when slides are reordered.
    function triggerSlideEnter(n) {
        const slide = slides[n - 1];
        if (!slide) return;
        if (slide.classList.contains('slide-negative'))  SlideAnim.startNegative();
        if (slide.classList.contains('slide-music'))     SlideAnim.startMusic();
        if (slide.classList.contains('slide-sculpture')) SlideAnim.startSculpture();
        if (slide.classList.contains('slide-brush'))     SlideAnim.startBrush();
        // slide-dimension is handled entirely by CSS transforms.
    }

    function activeHasClass(cls) {
        const a = document.querySelector('.slide.is-active');
        return !!(a && a.classList.contains(cls));
    }

    /* ============================================================
       SLIDE 4: Negative Space Inversion
       ============================================================ */
    const negativeCanvas = document.getElementById('negative-canvas');
    const negativeCtx    = negativeCanvas.getContext('2d');

    // UI element rectangles (normalized 0..1 within canvas).
    // Together they recall a phone home / chat layout.
    const UI_BOXES = [
        // header
        [0.06, 0.04, 0.88, 0.06],
        // search bar
        [0.06, 0.13, 0.88, 0.04],
        // story rail (5 circles → represented as small squares)
        [0.06, 0.20, 0.10, 0.10],
        [0.18, 0.20, 0.10, 0.10],
        [0.30, 0.20, 0.10, 0.10],
        [0.42, 0.20, 0.10, 0.10],
        [0.54, 0.20, 0.10, 0.10],
        [0.66, 0.20, 0.10, 0.10],
        [0.78, 0.20, 0.10, 0.10],
        // post 1
        [0.06, 0.34, 0.88, 0.04], // username row
        [0.06, 0.40, 0.88, 0.22], // image
        [0.06, 0.64, 0.30, 0.03], // caption
        [0.06, 0.69, 0.55, 0.03],
        // post 2 begin
        [0.06, 0.78, 0.88, 0.04],
        [0.06, 0.86, 0.88, 0.10],
    ];

    /* ============================================================
       SLIDE 7: Observability — flowing layered waveforms.
       Deliberately label-free so non-engineers see the *picture*,
       not jargon. The argument lives in the visual itself.
       ============================================================ */
    const musicCanvas = document.getElementById('music-canvas');
    const musicCtx    = musicCanvas.getContext('2d');
    // 6 horizontal waveforms at slightly different rates, like layered
    // pulses of different systems breathing together.
    const musicWaves = [
        { rate: 1.00, amp: 0.28, harm: 1.7, gold: false, weight: 1.4 },
        { rate: 1.35, amp: 0.20, harm: 2.3, gold: true,  weight: 1.0 },
        { rate: 0.72, amp: 0.34, harm: 1.3, gold: false, weight: 1.2 },
        { rate: 1.62, amp: 0.16, harm: 2.7, gold: true,  weight: 0.9 },
        { rate: 0.93, amp: 0.24, harm: 1.9, gold: false, weight: 1.1 },
        { rate: 1.21, amp: 0.18, harm: 2.1, gold: true,  weight: 1.0 },
    ];

    /* ============================================================
       SLIDE 7: Code sculpture
       ============================================================ */
    const sculptureCode = document.getElementById('sculpture-code');
    const SCULPTURE_TEXT =
`// architecture has weight.

class Composition {
  constructor(intent) {
    this.intent  = intent;
    this.medium  = software;
    this.gestures = [];
  }

  paint(stroke) {
    return this.gestures
      .map(g => g.transform(stroke))
      .filter(g => g.is_truthful())
      .reduce((canvas, g) => g.apply(canvas));
  }
}

const today = new Composition("be honest.");`;

    const KW  = new Set(['class','const','let','var','return','new','this','if','else','=>']);
    const FN  = new Set(['constructor','paint','transform','is_truthful','apply','reduce','filter','map','Composition']);
    const PROP_AFTER = new Set(['.', '?.']);

    function escapeHTML(s) {
        return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
                .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    }

    function tokenize(text) {
        const out = [];
        let i = 0;
        const isAlpha = (c) => /[a-zA-Z_$]/.test(c);
        const isAlnum = (c) => /[a-zA-Z0-9_$]/.test(c);
        const isDigit = (c) => /[0-9]/.test(c);

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
            if (isDigit(c)) {
                let j = i;
                while (j < text.length && /[0-9.]/.test(text[j])) j++;
                out.push({ t: 'num', v: text.slice(i, j) });
                i = j;
                continue;
            }
            if (isAlpha(c)) {
                let j = i;
                while (j < text.length && isAlnum(text[j])) j++;
                const word = text.slice(i, j);

                let k = i - 1;
                while (k >= 0 && /\s/.test(text[k])) k--;
                const isProperty = (k >= 0 && text[k] === '.');

                let type = 'id';
                if (KW.has(word))         type = 'kw';
                else if (FN.has(word))    type = 'fn';
                if (isProperty)           type = 'prop';

                out.push({ t: type, v: word });
                i = j;
                continue;
            }
            if (c === '=' && text[i + 1] === '>') {
                out.push({ t: 'kw', v: '=>' });
                i += 2;
                continue;
            }
            if ('(){}[];:,.=+-*/<>!?&|'.includes(c)) {
                out.push({ t: 'pun', v: c });
                i++;
                continue;
            }
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

    /* ============================================================
       SLIDE 8: AI brush
       ============================================================ */
    const brushPromptEl = document.getElementById('brush-prompt');
    const brushCanvas   = document.getElementById('brush-canvas');
    const brushCtx      = brushCanvas.getContext('2d');
    const BRUSH_PROMPT  = "draw the soul of code";

    /* ===================== ANIMATION SUB-MODULE ===================== */
    const SlideAnim = (() => {

        // ---- Slide 4: Negative space ----
        let negStart = 0;
        let negRunning = false;

        function startNegative() {
            sizeCanvas(negativeCanvas, negativeCtx);
            negStart = performance.now();
            negRunning = true;
            requestAnimationFrame(loopNegative);
        }

        function loopNegative(t) {
            if (!negRunning) return;
            if (!activeHasClass('slide-negative')) { negRunning = false; return; }

            const dt = (t - negStart) / 1000;

            const w = negativeCanvas.clientWidth;
            const h = negativeCanvas.clientHeight;

            // Phase A (0..2.0s): show the UI as gray-on-dark.
            // Phase B (2.0..4.5s): UI dissolves; negative space fills with gold.
            // Phase C (4.5+): hold gold whitespace pattern.

            const phaseA = clamp01((dt - 0.0) / 1.4);                  // UI fades in
            const inverse = clamp01((dt - 2.0) / 2.5);                 // 0..1 inversion
            const ui_alpha = 1 - inverse;
            const gold_alpha = inverse;

            negativeCtx.clearRect(0, 0, w, h);

            if (gold_alpha > 0.001) {
                // Fill the entire stage with gold, then knock out the UI rectangles.
                negativeCtx.fillStyle = `rgba(201, 163, 91, ${0.85 * gold_alpha})`;
                negativeCtx.fillRect(0, 0, w, h);
                // Punch holes for the UI rectangles using destination-out.
                negativeCtx.globalCompositeOperation = 'destination-out';
                for (const box of UI_BOXES) {
                    const [x, y, bw, bh] = box;
                    const margin = (1 - clamp01((dt - 2.0) / 1.6)) * 6;
                    negativeCtx.fillStyle = 'rgba(0, 0, 0, 1)';
                    negativeCtx.fillRect(
                        x * w - margin, y * h - margin,
                        bw * w + margin * 2, bh * h + margin * 2
                    );
                }
                negativeCtx.globalCompositeOperation = 'source-over';
            }

            if (ui_alpha > 0.001) {
                // Draw the gray UI rectangles on top while they fade.
                negativeCtx.fillStyle = `rgba(245, 239, 226, ${0.18 * ui_alpha * phaseA})`;
                for (const box of UI_BOXES) {
                    const [x, y, bw, bh] = box;
                    negativeCtx.fillRect(x * w, y * h, bw * w, bh * h);
                }
                // outline
                negativeCtx.strokeStyle = `rgba(245, 239, 226, ${0.12 * ui_alpha * phaseA})`;
                negativeCtx.lineWidth = 1;
                for (const box of UI_BOXES) {
                    const [x, y, bw, bh] = box;
                    negativeCtx.strokeRect(x * w + 0.5, y * h + 0.5, bw * w - 1, bh * h - 1);
                }
            }

            requestAnimationFrame(loopNegative);
        }

        // ---- Slide 6: Sparklines + music kicks in ----
        let musicStart = 0;
        let musicRunning = false;

        function startMusic() {
            sizeCanvas(musicCanvas, musicCtx);
            musicStart = performance.now();
            musicRunning = true;
            requestAnimationFrame(loopMusic);
        }

        function loopMusic(t) {
            if (!musicRunning) return;
            if (!activeHasClass('slide-music')) { musicRunning = false; return; }

            const w = musicCanvas.clientWidth;
            const h = musicCanvas.clientHeight;
            const dt = (t - musicStart) / 1000;

            musicCtx.clearRect(0, 0, w, h);

            // Stack the waves vertically with generous breathing room.
            const padL = w * 0.06;
            const padR = w * 0.06;
            const padT = h * 0.16;
            const padB = h * 0.26; // extra room for the caption
            const innerW = w - padL - padR;
            const innerH = h - padT - padB;
            const slot = innerH / musicWaves.length;

            for (let i = 0; i < musicWaves.length; i++) {
                const wave = musicWaves[i];
                const cy   = padT + slot * (i + 0.5);
                drawFlowingWave(musicCtx, padL, cy, innerW, slot, wave, dt, i);
            }

            requestAnimationFrame(loopMusic);
        }

        function drawFlowingWave(ctx, x, cy, w, slotH, wave, dt, idx) {
            const amp = slotH * wave.amp;
            ctx.strokeStyle = wave.gold
                ? `rgba(201, 163, 91, 0.78)`
                : `rgba(245, 239, 226, 0.55)`;
            ctx.lineWidth   = wave.weight;
            ctx.lineCap     = 'round';
            ctx.lineJoin    = 'round';

            ctx.beginPath();
            const N = Math.max(80, Math.floor(w / 3));
            const speed = 1.4 * wave.rate;
            for (let i = 0; i <= N; i++) {
                const px = x + (i / N) * w;
                const u  = (i / N) * Math.PI * 6 - dt * speed;
                // layered sines = organic wobble, never quite repeating.
                const py = cy
                    + Math.sin(u) * amp
                    + Math.sin(u * wave.harm + idx * 0.7) * amp * 0.45
                    + Math.sin(u * 0.31 - dt * 0.3 + idx) * amp * 0.18;
                if (i === 0) ctx.moveTo(px, py);
                else         ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        // ---- Slide 7: code sculpture ----
        function startSculpture() {
            sculptureCode.innerHTML = tokensToHTML(tokenize(SCULPTURE_TEXT));
        }

        // ---- Slide 8: AI brush ----
        let brushStart = 0;
        let brushRunning = false;
        let brushPromptText = '';
        let brushTypeIdx = 0;
        const brushParticles = [];

        function startBrush() {
            sizeCanvas(brushCanvas, brushCtx);
            brushStart = performance.now();
            brushRunning = true;
            brushPromptText = '';
            brushTypeIdx = 0;
            brushParticles.length = 0;
            updateBrushPrompt();
            requestAnimationFrame(loopBrush);
        }

        function updateBrushPrompt() {
            brushPromptEl.innerHTML =
                escapeHTML(brushPromptText) +
                '<span class="brush-cursor">▌</span>';
        }

        function loopBrush(t) {
            if (!brushRunning) return;
            if (!activeHasClass('slide-brush')) { brushRunning = false; return; }

            const dt = (t - brushStart) / 1000;
            const w = brushCanvas.clientWidth;
            const h = brushCanvas.clientHeight;

            // Type the prompt over the first ~3 seconds.
            const charTarget = Math.min(BRUSH_PROMPT.length, Math.floor(dt * 7));
            if (charTarget !== brushTypeIdx) {
                brushTypeIdx = charTarget;
                brushPromptText = BRUSH_PROMPT.slice(0, charTarget);
                updateBrushPrompt();
            }

            // Once typing is done, start emitting particles from a flow field.
            if (dt > BRUSH_PROMPT.length / 7 + 0.2 && brushParticles.length < 600) {
                for (let i = 0; i < 8; i++) {
                    brushParticles.push({
                        x: w * 0.5 + (Math.random() - 0.5) * w * 0.3,
                        y: h * 0.55,
                        vx: 0, vy: 0,
                        age: 0,
                        life: 200 + Math.random() * 240,
                        hue: Math.random(),
                    });
                }
            }

            // Soft trail-fade.
            brushCtx.fillStyle = 'rgba(10, 8, 5, 0.045)';
            brushCtx.fillRect(0, 0, w, h);

            // Update + draw particles in flow field
            const FX = (x, y, t) =>
                Math.sin((x * 0.005) + (y * 0.003) + t * 0.3) * 0.6 +
                Math.cos((x * 0.0023) - (y * 0.004) - t * 0.2) * 0.4;
            const FY = (x, y, t) =>
                Math.cos((x * 0.0033) - (y * 0.0021) + t * 0.4) * 0.5 +
                Math.sin((x * 0.0017) + (y * 0.0036) - t * 0.18) * 0.5;

            for (let i = brushParticles.length - 1; i >= 0; i--) {
                const p = brushParticles[i];
                const ax = FX(p.x, p.y, dt) * 0.12;
                const ay = FY(p.x, p.y, dt) * 0.12;
                p.vx = (p.vx + ax) * 0.96;
                p.vy = (p.vy + ay) * 0.96;
                p.x += p.vx;
                p.y += p.vy;
                p.age++;
                if (p.age > p.life || p.x < -10 || p.x > w + 10 || p.y < -10 || p.y > h + 10) {
                    brushParticles.splice(i, 1);
                    continue;
                }
                const alpha = 0.6 * Math.min(1, p.age / 30) * (1 - p.age / p.life);
                brushCtx.fillStyle = p.hue > 0.5
                    ? `rgba(201, 163, 91, ${alpha})`
                    : `rgba(245, 239, 226, ${alpha * 0.7})`;
                brushCtx.beginPath();
                brushCtx.arc(p.x, p.y, 1.0, 0, Math.PI * 2);
                brushCtx.fill();
            }

            requestAnimationFrame(loopBrush);
        }

        function reset() {
            negRunning = false;
            musicRunning = false;
            brushRunning = false;
            brushParticles.length = 0;
            negativeCtx.clearRect(0, 0, negativeCanvas.width, negativeCanvas.height);
            musicCtx.clearRect(0, 0, musicCanvas.width, musicCanvas.height);
            brushCtx.clearRect(0, 0, brushCanvas.width, brushCanvas.height);
        }

        return {
            startNegative, startMusic, startSculpture, startBrush, reset,
        };
    })();

    /* ===================== CANVAS SIZING ===================== */
    function sizeCanvas(canvas, ctx) {
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const r = canvas.getBoundingClientRect();
        canvas.width  = Math.max(1, Math.round(r.width  * DPR));
        canvas.height = Math.max(1, Math.round(r.height * DPR));
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    }

    window.addEventListener('resize', () => {
        // Re-size canvases for the active slide.
        if (current === 4) sizeCanvas(negativeCanvas, negativeCtx);
        if (current === 6) sizeCanvas(musicCanvas, musicCtx);
        if (current === 8) sizeCanvas(brushCanvas, brushCtx);
    });

    /* ===================== MUSIC =====================
       Plays a single MP3 file (`music.mp3` in the repo root) on loop.
       To create the sense of *intensity growing toward the climax*, we
       route the audio through a Web Audio lowpass filter + gain whose
       cutoff and volume ramp upward across the slides:

         · slide 1   → muffled, quiet (cutoff 500 Hz, vol 0.30)
         · slide 10  → wide-open, loud (cutoff 22 kHz, vol 1.00)
         · slide 11  → pull back (cutoff 1.2 kHz, vol 0.55)
         · slide 12  → fade out

       So even if the underlying track is just a steady piece, the listener
       feels the music open up as the argument intensifies.
       If music.mp3 is missing the site still works, just silently. */

    const Music = (() => {
        let ctx       = null;
        let source    = null;
        let filter    = null;
        let gain      = null;
        let muted     = false;
        let started   = false;
        let baseVolume = 0;
        let elementRamp = 0; // rAF id for fallback element-volume ramping

        // Per-slide intensity profile.
        // [lowpass cutoff Hz, gain (0..1)]
        // The piece breathes shallowly through the setup, fills out as
        // we lay the proofs, and bursts open at slide 15 (the self-claim).
        // After the climax it settles into the bio slides like a long exhale.
        const PROFILES = {
            1:  [ 500,  0.26],   // title
            2:  [ 580,  0.30],   // self-aware
            3:  [ 680,  0.34],   // provocation
            4:  [ 800,  0.38],   // "what is art?"
            5:  [ 950,  0.43],   // art is heart taking shape
            6:  [1100,  0.48],   // composition / time / hand
            7:  [1300,  0.54],   // bridge → software
            8:  [1700,  0.60],   // proof: composition (UI negative)
            9:  [2200,  0.66],   // proof: dimension (UI sculpture)
            10: [3000,  0.72],   // proof: time (observability)
            11: [4500,  0.78],   // proof: code structure
            12: [7000,  0.84],   // proof: AI / new medium
            13: [11000, 0.90],   // recap
            14: [16000, 0.94],   // who paints all of this?
            15: [22050, 1.00],   // SELF-CLAIM — peak, fully open
            16: [3000,  0.55],   // quiet poem
            17: [1800,  0.46],   // devotion
            18: [1500,  0.40],   // bio: style/approach
            19: [1300,  0.36],   // bio: tools philosophy
            20: [1100,  0.32],   // python stack card
            21: [800,   0.00],   // signature fade-out
        };

        function attachDiagnostics() {
            if (!bgmEl) return;
            bgmEl.addEventListener('error', () => {
                const err = bgmEl.error;
                console.warn('[bgm] audio element error:',
                    err ? `code=${err.code} (${err.message})` : 'unknown',
                    'src=', bgmEl.currentSrc || bgmEl.src);
            });
            bgmEl.addEventListener('loadedmetadata', () => {
                console.info('[bgm] loaded:', bgmEl.currentSrc, 'duration=', bgmEl.duration);
            });
            bgmEl.addEventListener('stalled', () => console.warn('[bgm] stalled'));
        }

        function setupWebAudio() {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return false;
            try {
                ctx = new AudioCtx();
                source = ctx.createMediaElementSource(bgmEl);
                filter = ctx.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = 500;
                filter.Q.value = 0.7;
                gain = ctx.createGain();
                gain.gain.value = 0;
                source.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                return true;
            } catch (e) {
                // Web Audio failed (e.g. CORS taint, browser quirk).
                // Fall back to playing the audio element directly.
                console.warn('[bgm] Web Audio routing failed, using element fallback:', e);
                ctx = null; source = null; filter = null; gain = null;
                return false;
            }
        }

        function rampElementVolume(target, durSec) {
            cancelAnimationFrame(elementRamp);
            const start = bgmEl.volume;
            const startTime = performance.now();
            function step() {
                const t = (performance.now() - startTime) / 1000;
                const k = Math.min(1, t / Math.max(0.05, durSec));
                bgmEl.volume = Math.max(0, Math.min(1, start + (target - start) * k));
                if (k < 1) elementRamp = requestAnimationFrame(step);
            }
            step();
        }

        function applyProfile(slide, fadeDur = 2.6) {
            const p = PROFILES[slide];
            if (!p) return;
            const [freq, vol] = p;
            baseVolume = vol;
            const target = muted ? 0 : vol;

            if (ctx && filter && gain) {
                const tNow = ctx.currentTime;
                filter.frequency.cancelScheduledValues(tNow);
                filter.frequency.setValueAtTime(filter.frequency.value, tNow);
                filter.frequency.exponentialRampToValueAtTime(Math.max(80, freq), tNow + fadeDur);

                gain.gain.cancelScheduledValues(tNow);
                gain.gain.setValueAtTime(gain.gain.value, tNow);
                gain.gain.linearRampToValueAtTime(target, tNow + fadeDur);
            } else if (bgmEl) {
                // Element-only fallback: volume only, no filter sweep.
                rampElementVolume(target, fadeDur);
            }
        }

        function kickstart() {
            if (started) return;
            if (!bgmEl) return;
            started = true;

            attachDiagnostics();

            // Attempt Web Audio routing. If it fails, we still play the element directly.
            const haveWebAudio = setupWebAudio();

            // If element-only fallback, start with volume 0 so we can ramp it in.
            if (!haveWebAudio) bgmEl.volume = 0;

            // Resume the audio context if the browser created it suspended.
            if (ctx && ctx.state === 'suspended') {
                ctx.resume().catch((err) => console.warn('[bgm] resume failed:', err));
            }

            // Always attempt to play the element.
            const playP = bgmEl.play();
            if (playP && playP.catch) {
                playP.catch((err) => {
                    console.warn('[bgm] play() rejected — file may be missing or blocked:',
                        err && err.message);
                });
            }

            applyProfile(typeof current === 'number' ? current : 1, 0.8);
        }

        function onSlide(n) {
            applyProfile(n);
        }

        function toggle() {
            muted = !muted;
            audioBtn.setAttribute('aria-pressed', String(!muted));
            const target = muted ? 0 : baseVolume;
            if (ctx && gain) {
                const tNow = ctx.currentTime;
                gain.gain.cancelScheduledValues(tNow);
                gain.gain.setValueAtTime(gain.gain.value, tNow);
                gain.gain.linearRampToValueAtTime(target, tNow + 0.6);
            } else if (bgmEl) {
                rampElementVolume(target, 0.6);
            }
        }

        return { kickstart, onSlide, toggle };
    })();

    /* ===================== UTIL ===================== */
    function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

    /* ===================== INIT ===================== */
    function init() {
        // Pre-size canvases that might appear later.
        sizeCanvas(negativeCanvas, negativeCtx);
        sizeCanvas(musicCanvas, musicCtx);
        sizeCanvas(brushCanvas, brushCtx);

        if (REVISIT) {
            // The visitor has been here before. Show only slide 12.
            slides.forEach(s => s.classList.remove('is-active'));
            const sig = slides[TOTAL - 1];
            sig.classList.add('is-active');
            current = TOTAL;
            // Hide the "click to begin again" — there is no beginning again.
            const replay = sig.querySelector('.sig-replay');
            if (replay) replay.remove();
            // Mark progress as full and disable the hint entirely.
            fillEl.style.width = '100%';
            document.body.classList.add('is-revisit');
        } else {
            // First visit. Mark them now — strict one-shot.
            markVisited();
            setTimeout(showHintBriefly, 1800);
            triggerSlideEnter(1);
        }

        updateHUD();
    }
    init();

})();
