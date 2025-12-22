import React, { useRef, useEffect, useState } from "react";
import { cn } from "../../lib/utils";

export const SparklesCore = (props) => {
    const {
        id,
        className,
        background,
        minSize,
        maxSize,
        speed,
        particleColor,
        particleDensity,
    } = props;
    const [init, setInit] = useState(false);
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let width = canvas.parentElement.offsetWidth;
        let height = canvas.parentElement.offsetHeight;
        let particles = [];
        let animationId;

        const resize = () => {
            width = canvas.parentElement.offsetWidth;
            height = canvas.parentElement.offsetHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', resize);
        resize();

        class Particle {
            constructor() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * (maxSize || 3 - (minSize || 1)) + (minSize || 1);
                this.speedX = Math.random() * (speed || 1) - (speed || 1) / 2;
                this.speedY = Math.random() * (speed || 1) - (speed || 1) / 2;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.size > 0.2) this.size -= 0.01; // Fade out slightly
                if (this.size <= 0.2) {
                    this.x = Math.random() * width;
                    this.y = Math.random() * height;
                    this.size = Math.random() * (maxSize || 3 - (minSize || 1)) + (minSize || 1);
                }
            }
            draw() {
                ctx.fillStyle = particleColor || "#ffffff";
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            const density = particleDensity || 50;
            const numberOfParticles = (width * height) / 10000 * (density / 10);
            for (let i = 0; i < numberOfParticles; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            // Background logic if needed
            particles.forEach((particle) => {
                particle.update();
                particle.draw();
            });
            animationId = requestAnimationFrame(animate);
        };

        initParticles();
        animate();
        setInit(true);

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationId);
        };
    }, [maxSize, minSize, particleColor, particleDensity, speed]);

    return (
        <div className={cn("relative h-full w-full", className)}>
            <canvas
                ref={canvasRef}
                className="w-full h-full block"
                style={{ background: background || "transparent" }}
            />
        </div>
    );
};
