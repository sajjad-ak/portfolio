/**
 * Neural Network Background Animation
 * Floating nodes connected by glowing gold lines across the entire site.
 */
(function () {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // ── Config ──────────────────────────────────────────────────
    const NODE_COUNT        = 72;
    const MAX_LINK_DIST     = 180;   // px — max distance to draw a link
    const NODE_RADIUS_MIN   = 1.5;
    const NODE_RADIUS_MAX   = 3.5;
    const BASE_SPEED        = 0.28;
    const GOLD              = [201, 177, 138];   // RGB of --primary-color
    const GOLD_BRIGHT       = [232, 213, 183];   // RGB of --secondary-color
    const PULSE_SPEED       = 0.008;
    const MOUSE_REPEL_DIST  = 130;
    const MOUSE_REPEL_FORCE = 0.018;

    let W, H, dpr, nodes = [];
    let mouse = { x: -9999, y: -9999 };
    let rafId;
    let pulseT = 0;

    // ── Node class ───────────────────────────────────────────────
    class Node {
        constructor() { this.reset(true); }

        reset(randomY = false) {
            this.x  = Math.random() * W;
            this.y  = randomY ? Math.random() * H : H + 10;
            this.r  = NODE_RADIUS_MIN + Math.random() * (NODE_RADIUS_MAX - NODE_RADIUS_MIN);
            const speed = BASE_SPEED * (0.4 + Math.random() * 0.8);
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.alpha  = 0.4 + Math.random() * 0.5;
            this.bright = Math.random() > 0.75;   // 25 % are bright nodes
            this.pulseOffset = Math.random() * Math.PI * 2;
        }

        update() {
            // Mouse repulsion
            const mdx = this.x - mouse.x;
            const mdy = this.y - mouse.y;
            const md2 = mdx * mdx + mdy * mdy;
            if (md2 < MOUSE_REPEL_DIST * MOUSE_REPEL_DIST && md2 > 0) {
                const mf = MOUSE_REPEL_FORCE / Math.sqrt(md2);
                this.vx += mdx * mf;
                this.vy += mdy * mf;
            }

            // Speed cap
            const sp = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
            const maxSp = BASE_SPEED * 2.2;
            if (sp > maxSp) {
                this.vx = (this.vx / sp) * maxSp;
                this.vy = (this.vy / sp) * maxSp;
            }

            this.x += this.vx;
            this.y += this.vy;

            // Wrap / bounce
            if (this.x < -20) this.x = W + 20;
            if (this.x > W + 20) this.x = -20;
            if (this.y < -20) this.y = H + 20;
            if (this.y > H + 20) this.y = -20;
        }

        draw() {
            const pulse = 0.7 + 0.3 * Math.sin(pulseT + this.pulseOffset);
            const a     = this.alpha * pulse;
            const [r, g, b] = this.bright ? GOLD_BRIGHT : GOLD;

            ctx.beginPath();
            ctx.arc(this.x, this.y, this.r * pulse, 0, Math.PI * 2);

            // Glow
            const grad = ctx.createRadialGradient(
                this.x, this.y, 0,
                this.x, this.y, this.r * 4 * pulse
            );
            grad.addColorStop(0, `rgba(${r},${g},${b},${a})`);
            grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
            ctx.fillStyle = grad;
            ctx.fill();
        }
    }

    // ── Resize ───────────────────────────────────────────────────
    function resize() {
        dpr = window.devicePixelRatio || 1;
        W   = window.innerWidth;
        H   = window.innerHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        canvas.style.width  = W + 'px';
        canvas.style.height = H + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    // ── Init ─────────────────────────────────────────────────────
    function init() {
        resize();
        nodes = Array.from({ length: NODE_COUNT }, () => new Node());
        window.addEventListener('resize', resize, { passive: true });
        window.addEventListener('mousemove', e => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        }, { passive: true });
        window.addEventListener('touchmove', e => {
            if (e.touches.length > 0) {
                mouse.x = e.touches[0].clientX;
                mouse.y = e.touches[0].clientY;
            }
        }, { passive: true });
        window.addEventListener('mouseleave', () => {
            mouse.x = -9999; mouse.y = -9999;
        }, { passive: true });
        loop();
    }

    // ── Draw links ───────────────────────────────────────────────
    function drawLinks() {
        for (let i = 0; i < nodes.length; i++) {
            const a = nodes[i];
            for (let j = i + 1; j < nodes.length; j++) {
                const b = nodes[j];
                const dx = a.x - b.x;
                const dy = a.y - b.y;
                const d  = Math.sqrt(dx * dx + dy * dy);
                if (d > MAX_LINK_DIST) continue;

                const opacity = (1 - d / MAX_LINK_DIST) * 0.35;
                const [r, g, bl] = GOLD;

                // Slight colour variation based on combined brightness
                const useBright = a.bright && b.bright;
                const [cr, cg, cb] = useBright ? GOLD_BRIGHT : GOLD;

                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = `rgba(${cr},${cg},${cb},${opacity})`;
                ctx.lineWidth = useBright ? 0.9 : 0.5;
                ctx.stroke();
            }
        }
    }

    // ── Loop ─────────────────────────────────────────────────────
    function loop() {
        ctx.clearRect(0, 0, W, H);
        pulseT += PULSE_SPEED;

        drawLinks();
        for (const n of nodes) {
            n.update();
            n.draw();
        }

        rafId = requestAnimationFrame(loop);
    }

    // ── Boot ─────────────────────────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
