// src/components/Confetti.tsx
import React, { useEffect, useRef } from 'react';

interface ConfettiProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
  intensity?: 'low' | 'medium' | 'high';
}

interface ConfettiParticle {
  x: number;
  y: number;
  color: string;
  size: number;
  velocity: {
    x: number;
    y: number;
  };
  rotation: number;
  rotationSpeed: number;
  shape: 'square' | 'circle' | 'triangle' | 'star';
  opacity: number;
}

export function Confetti({ 
  active, 
  duration = 3000, 
  onComplete,
  intensity = 'medium' 
}: ConfettiProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<ConfettiParticle[]>([]);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  // Generate confetti particles
  const generateParticles = (count: number) => {
    if (!canvasRef.current) return [];
    
    const canvas = canvasRef.current;
    const particles: ConfettiParticle[] = [];
    const colors = [
      '#FFC700', // yellow
      '#FF0097', // pink
      '#00C4FF', // blue
      '#47FF00', // green
      '#FF3D00', // orange
      '#9D00FF', // purple
    ];
    
    const shapes: ('square' | 'circle' | 'triangle' | 'star')[] = [
      'square', 'circle', 'triangle', 'star'
    ];

    for (let i = 0; i < count; i++) {
      const size = Math.random() * 12 + 5; // 5-17px
      particles.push({
        x: Math.random() * canvas.width,
        y: -20, // Start above the canvas
        color: colors[Math.floor(Math.random() * colors.length)],
        size,
        velocity: {
          x: (Math.random() - 0.5) * 8,
          y: Math.random() * 3 + 1
        },
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 5,
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        opacity: 1
      });
    }
    
    return particles;
  };

  // Draw a single particle
  const drawParticle = (
    ctx: CanvasRenderingContext2D, 
    particle: ConfettiParticle
  ) => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate((particle.rotation * Math.PI) / 180);
    ctx.globalAlpha = particle.opacity;
    ctx.fillStyle = particle.color;
    
    const halfSize = particle.size / 2;
    
    // Draw based on shape
    switch (particle.shape) {
      case 'square':
        ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size);
        break;
      case 'circle':
        ctx.beginPath();
        ctx.arc(0, 0, halfSize, 0, Math.PI * 2);
        ctx.fill();
        break;
      case 'triangle':
        ctx.beginPath();
        ctx.moveTo(0, -halfSize);
        ctx.lineTo(halfSize, halfSize);
        ctx.lineTo(-halfSize, halfSize);
        ctx.closePath();
        ctx.fill();
        break;
      case 'star':
        ctx.beginPath();
        const spikes = 5;
        const outerRadius = halfSize;
        const innerRadius = halfSize / 2;
        
        for (let i = 0; i < spikes * 2; i++) {
          const radius = i % 2 === 0 ? outerRadius : innerRadius;
          const angle = (i * Math.PI) / spikes;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;
          
          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        
        ctx.closePath();
        ctx.fill();
        break;
    }
    
    ctx.restore();
  };
  
  // Animate the confetti
  const animate = (timestamp: number) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Initialize start time on first frame
    if (startTimeRef.current === null) {
      startTimeRef.current = timestamp;
    }
    
    // Calculate elapsed time
    const elapsedTime = timestamp - startTimeRef.current;
    const progress = Math.min(elapsedTime / duration, 1);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Update and draw particles
    particlesRef.current.forEach((particle, index) => {
      // Apply gravity and air resistance
      particle.velocity.y += 0.1; // Gravity
      particle.velocity.x *= 0.99; // Air resistance
      
      // Update position
      particle.x += particle.velocity.x;
      particle.y += particle.velocity.y;
      
      // Update rotation
      particle.rotation += particle.rotationSpeed;
      
      // Update opacity for fade out
      if (progress > 0.7) {
        particle.opacity = 1 - ((progress - 0.7) / 0.3);
      }
      
      // Draw the particle
      drawParticle(ctx, particle);
      
      // Update reference
      particlesRef.current[index] = particle;
    });
    
    // Continue animation if duration not exceeded
    if (progress < 1) {
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Animation complete
      startTimeRef.current = null;
      if (onComplete) onComplete();
    }
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const parent = canvas.parentElement;
      
      if (parent) {
        canvas.width = parent.clientWidth;
        canvas.height = parent.clientHeight;
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); // Initial sizing
    
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Start/stop animation based on active prop
  useEffect(() => {
    if (active) {
      // Determine particle count based on intensity
      let particleCount;
      switch (intensity) {
        case 'low':
          particleCount = 50;
          break;
        case 'high':
          particleCount = 200;
          break;
        case 'medium':
        default:
          particleCount = 100;
      }
      
      // Generate particles and start animation
      particlesRef.current = generateParticles(particleCount);
      startTimeRef.current = null;
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation if active becomes false
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [active, duration, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 z-20 pointer-events-none"
    />
  );
}