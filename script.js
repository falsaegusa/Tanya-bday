// ====================================
// CINEMATIC PHYSICS ENGINE
// ====================================

const state = {
    mouseX: window.innerWidth / 2,
    mouseY: window.innerHeight / 2,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    spotlightX: window.innerWidth / 2,
    spotlightY: window.innerHeight / 2,
    scrollSpeed: 0
};

// ====================================
// MOUSE TRACKING & SPOTLIGHT
// ====================================
let isIdle = true;
let lastMouseMove = Date.now();
let time = 0;

const resetIdle = (x, y) => {
    state.mouseX = x;
    state.mouseY = y;
    isIdle = false;
    lastMouseMove = Date.now();

    document.body.classList.add('hover-active');
    clearTimeout(window.hoverTimer);
    window.hoverTimer = setTimeout(() => {
        document.body.classList.remove('hover-active');
    }, 100);
};

document.addEventListener('mousemove', (e) => resetIdle(e.clientX, e.clientY));

// Touch support
document.addEventListener('touchstart', (e) => resetIdle(e.touches[0].clientX, e.touches[0].clientY));
document.addEventListener('touchmove', (e) => resetIdle(e.touches[0].clientX, e.touches[0].clientY));

// Linear Interpolation
const lerp = (start, end, factor) => {
    return start + (end - start) * factor;
};

// Physics Loop
const animate = () => {
    // Check for idle state (no input for 2.5s)
    if (Date.now() - lastMouseMove > 2500) {
        isIdle = true;
    }

    if (isIdle) {
        time += 0.015;
        // Organic Lissajous figure for auto-wandering
        // varying frequencies (0.8, 1.1) create non-repeating feel
        const wanderX = window.innerWidth / 2 + Math.cos(time * 0.8) * (window.innerWidth * 0.3);
        const wanderY = window.innerHeight / 2 + Math.sin(time * 1.1) * (window.innerHeight * 0.3);

        state.mouseX = wanderX;
        state.mouseY = wanderY;
    }

    // 1. Cursor Physics (Fast follow)
    state.cursorX = lerp(state.cursorX, state.mouseX, 0.2);
    state.cursorY = lerp(state.cursorY, state.mouseY, 0.2);

    const dot = document.querySelector('.cursor-dot');
    const circle = document.querySelector('.cursor-circle');

    if (dot && circle) {
        // Fade out cursor UI when idle (so just the spotlight remains)
        const opacity = isIdle ? 0 : 1;
        dot.style.opacity = opacity;
        circle.style.opacity = opacity;

        dot.style.transform = `translate(${state.cursorX}px, ${state.cursorY}px) translate(-50%, -50%)`;
        circle.style.transform = `translate(${state.cursorX}px, ${state.cursorY}px) translate(-50%, -50%)`;
    }

    // 2. Spotlight Physics (Slow, heavy follow)
    state.spotlightX = lerp(state.spotlightX, state.mouseX, 0.08);
    state.spotlightY = lerp(state.spotlightY, state.mouseY, 0.08);

    document.documentElement.style.setProperty('--spotlight-x', `${state.spotlightX}px`);
    document.documentElement.style.setProperty('--spotlight-y', `${state.spotlightY}px`);

    requestAnimationFrame(animate);
};

animate();

// ====================================
// INTRO & LOADING
// ====================================
const introOverlay = document.querySelector('.intro-overlay');
const tapTarget = document.querySelector('.tap-target');

if (tapTarget) {
    tapTarget.addEventListener('click', () => {
        introOverlay.classList.add('hidden');

        // Play music
        const music = document.getElementById('bg-music');
        if (music) {
            music.volume = 0.5; // Set reasonable volume
            music.play().catch(e => console.log("Audio play failed:", e));
        }

        // Loop is already running, so as soon as things become visible/black screen lifts, they will render correctly.
    });
}

// ====================================
// SCROLL SCRUBBING ANIMATIONS (LANDO STYLE)
// ====================================
// We want the animation state to be 1:1 with scroll position.
// Progress 0 = entering bottom
// Progress 0.5 = center screen (fully visible)
// Progress 1 = exiting top

const scrollElements = document.querySelectorAll('.scroll-fx');

const updateScrollAnimations = () => {
    const triggerBottom = window.innerHeight * 1.0; // Start animating when it hits bottom
    const triggerTop = 0; // Finish/Exit when hits top

    scrollElements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const elTop = rect.top;
        const elHeight = rect.height;

        // Calculate where the element is in the viewport (0 to 1)
        // 0 = just entered bottom
        // 1 = just exited top
        // tailored range: we want it fully active at center

        const centerPoint = window.innerHeight / 2;
        const distFromCenter = rect.top + rect.height / 2 - centerPoint;

        // Normalize distance: 0 is center. positive is below, negative is above.
        // Range of effect: +/- window height div 2
        const range = window.innerHeight / 1.5;

        let progress = 1 - Math.abs(distFromCenter / range);
        progress = Math.max(0, Math.min(1, progress)); // Clamp 0-1

        // Easing for smoother feel
        const ease = t => t * (2 - t); // Quad ease out
        const p = ease(progress);

        // Apply styles based on progress
        // Opacity: 0 -> 1 -> 0 (fade in then out)
        el.style.opacity = p;

        // Transform: Scrub sliding
        // If it's the hero side-slides, we handle them differently
        if (el.classList.contains('slide-left')) {
            // Slide from -100px to 0 then back to -100px relative to center
            const offset = (1 - p) * -150;
            el.style.transform = `translateX(${offset}px) skewX(${(1 - p) * 20}deg)`;
        } else if (el.classList.contains('slide-right')) {
            const offset = (1 - p) * 150;
            el.style.transform = `translateX(${offset}px) skewX(${(1 - p) * -20}deg)`;
        } else {
            // Default Up/Down scrub
            const yOffset = (1 - p) * 100;
            el.style.transform = `translateY(${yOffset}px) scale(${0.9 + (p * 0.1)})`;
        }
    });

    requestAnimationFrame(updateScrollAnimations);
};

// Start the loop
updateScrollAnimations();

// Keep observer ONLY for non-scroll-fx things if needed (like reveals)
// or just rely on this loop for everything marked .scroll-fx

// ====================================
// MAGNETIC ELEMENTS
// ====================================

const magneticElements = document.querySelectorAll('.magnetic, .nav-logo, .wish-item');

magneticElements.forEach(el => {
    el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const deltaX = e.clientX - centerX;
        const deltaY = e.clientY - centerY;

        // Intensity of pull
        const pull = 0.4;

        el.style.transform = `translate(${deltaX * pull}px, ${deltaY * pull}px)`;
    });

    el.addEventListener('mouseleave', () => {
        el.style.transform = `translate(0px, 0px)`;
        el.style.transition = 'transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';

        setTimeout(() => {
            el.style.transition = ''; // clear transition for next mousemove
        }, 500);
    });
});


// ====================================
// GALLERY PARALLAX
// ====================================
window.addEventListener('scroll', () => {
    const scrollY = window.scrollY;

    // Parallax for gallery items
    document.querySelectorAll('.gallery-item, .gallery-item-wide').forEach(item => {
        const speed = item.getAttribute('data-speed') || 1;
        const yPos = -(scrollY * 0.1 * speed);
        // item.style.transform = `translateY(${yPos}px)`; // Optional: can be heavy on performance
    });

    // Rotate big heart on scroll
    const heart = document.querySelector('.big-heart');
    if (heart) {
        heart.style.transform = `rotate(${scrollY * 0.1}deg)`;
    }
});

// ====================================
// LOADING REVEAL
// ====================================
// ====================================
// LOADING REVEAL
// ====================================
window.addEventListener('load', () => {
    document.body.classList.remove('loading-state');
    // Hero animations are triggered by tapTarget click now
});
