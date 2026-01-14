'use client';

import { useRef, useEffect } from 'react';

interface Particle {
  x: number;
  y: number;
  size: number;
  speedY: number;
  speedX: number;
  color: string;
  rotation: number;
}

export function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    setCanvasSize();

    // Handle window resize
    const handleResize = () => setCanvasSize();
    window.addEventListener('resize', handleResize);

    // Create confetti particles
    const confetti: Particle[] = Array.from({ length: 100 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * -canvas.height,
      size: Math.random() * 5 + 2,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 2 - 1,
      color: ['#fbbf24', '#ef4444', '#22c55e', '#3b82f6', '#a855f7'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360,
    }));

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      confetti.forEach(particle => {
        // Update position
        particle.y += particle.speedY;
        particle.x += particle.speedX;
        particle.rotation += 5;

        // Reset if off screen
        if (particle.y > canvas.height) {
          particle.y = -10;
          particle.x = Math.random() * canvas.width;
        }

        // Draw particle
        ctx.save();
        ctx.translate(particle.x, particle.y);
        ctx.rotate((particle.rotation * Math.PI) / 180);
        ctx.fillStyle = particle.color;
        ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size);
        ctx.restore();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    // Stop after 5 seconds
    const timeout = setTimeout(() => {
      cancelAnimationFrame(animationId);
    }, 5000);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(timeout);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-40"
      style={{ zIndex: 40 }}
    />
  );
}
