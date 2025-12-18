// ====================================
// WISH UNIVERSE PARTICLE SYSTEM
// ====================================
class ParticleSystem {
    constructor() {
        this.canvas = document.getElementById('finale-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.active = false;

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    explode() {
        this.active = true;
        this.canvas.classList.add('active');

        // Create 500 particles
        for (let i = 0; i < 500; i++) {
            this.particles.push(new Particle(this.canvas.width / 2, this.canvas.height / 2));
        }

        this.animate();
    }

    animate() {
        if (!this.active) return;

        this.ctx.fillStyle = 'rgba(3, 3, 3, 0.2)'; // Trails
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.particles.forEach((p, index) => {
            p.update();
            p.draw(this.ctx);
            if (p.life <= 0) this.particles.splice(index, 1);
        });

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.animate());
        } else {
            this.active = false;
            this.canvas.classList.remove('active');
        }
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 15 + 2;
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.01; // Much faster decay (was 0.005)
        this.color = `hsl(${330 + Math.random() * 40}, 100%, 60%)`; // Pink/Purple range
        this.size = Math.random() * 4 + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Interaction with mouse/spotlight
        const dx = this.x - state.mouseX;
        const dy = this.y - state.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 200) {
            this.vx += dx * 0.001; // Push away gently
            this.vy += dy * 0.001;
        }

        this.vx *= 0.96; // Friction
        this.vy *= 0.96;
        this.life -= this.decay;
        this.size *= 0.99;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life * 0.6; // More translucent (was full life)
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// Finale Trigger
const finaleBtn = document.getElementById('finale-btn');
if (finaleBtn) {
    const system = new ParticleSystem();
    finaleBtn.addEventListener('click', () => {
        finaleBtn.style.opacity = '0';
        finaleBtn.style.pointerEvents = 'none'; // Prevent double clicks
        system.explode();

        // Show thank you message after explosion with delay
        setTimeout(() => {
            const h2 = document.querySelector('.footer-content h2');
            if (h2) {
                h2.style.transition = "opacity 0.2s ease"; // Super fast fade out
                h2.style.opacity = 0;

                setTimeout(() => {
                    h2.innerHTML = "AD MAIORA<br><span style='font-size: 0.4em; letter-spacing: 0.3em; margin-top: 1rem; display: block; opacity: 0.8;'>ENJOY YOUR DAY!</span>";
                    h2.style.border = "none";
                    h2.style.fontSize = "clamp(2rem, 5vw, 4rem)";
                    h2.style.color = "#fff";
                    h2.style.textShadow = "none"; // Clean, no glow

                    // Add impact animation
                    h2.classList.add('finale-impact');
                    h2.style.opacity = 1;

                }, 100); // Faster swap (was 200)
            }
        }, 50); // Almost instant start (was 100)
    });
}

