import React, { useRef, useEffect } from 'react';
import Sketch from 'react-p5';
import p5Types from 'p5';

interface WaterSimulationProps {
  timeLeft: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function WaterSimulation({ timeLeft }: WaterSimulationProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const dimensionsRef = useRef({ width: 0, height: 0 });
  const targetWaterLevelRef = useRef(0);
  const currentWaterLevelRef = useRef(0);

  const setup = (p5: p5Types, canvasParentRef: Element) => {
    if (!containerRef.current) return;
    
    dimensionsRef.current = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    };

    p5.createCanvas(dimensionsRef.current.width, dimensionsRef.current.height)
      .parent(canvasParentRef);

    // Initialize water levels
    targetWaterLevelRef.current = dimensionsRef.current.height;
    currentWaterLevelRef.current = dimensionsRef.current.height;

    // Initialize particles
    particlesRef.current = Array.from({ length: 300 }, () => ({
      x: p5.random(dimensionsRef.current.width),
      y: p5.random(dimensionsRef.current.height),
      vx: 0,
      vy: 0
    }));
  };

  const draw = (p5: p5Types) => {
    const { width, height } = dimensionsRef.current;
    
    // Update target water level based on time
    targetWaterLevelRef.current = (timeLeft / 60) * height;
    
    // Smoothly interpolate current water level
    const easing = 0.05;
    const diff = targetWaterLevelRef.current - currentWaterLevelRef.current;
    currentWaterLevelRef.current += diff * easing;
    
    const waterLevel = currentWaterLevelRef.current;
    
    // Clear background
    p5.clear();
    
    // Draw water background with gradient
    const waterColor = p5.color(0, 183, 235);
    waterColor.setAlpha(80);
    
    // Create gradient effect
    for (let y = height - waterLevel; y < height; y += 2) {
      const alpha = p5.map(y, height - waterLevel, height, 20, 40);
      waterColor.setAlpha(alpha);
      p5.fill(waterColor);
      p5.noStroke();
      p5.rect(0, y, width, 2);
    }

    // Update and draw particles with improved movement
    particlesRef.current.forEach((particle, index) => {
      if (particle.y < height - waterLevel) {
        particle.y = height - waterLevel + p5.random(5);
      }

      // More natural movement
      particle.vx += p5.random(-0.1, 0.1);
      particle.vy += p5.random(-0.05, 0.05);
      
      // Dampen velocities
      particle.vx *= 0.99;
      particle.vy *= 0.99;

      // Limit velocities
      particle.vx = p5.constrain(particle.vx, -2, 2);
      particle.vy = p5.constrain(particle.vy, -1, 1);

      // Update position
      particle.x += particle.vx;
      particle.y += particle.vy;

      // Wrap around horizontally
      if (particle.x < 0) particle.x = width;
      if (particle.x > width) particle.x = 0;

      // Contain vertically within water
      if (particle.y > height) {
        particle.y = height;
        particle.vy *= -0.5;
      }
      if (particle.y < height - waterLevel) {
        particle.y = height - waterLevel;
        particle.vy = 0;
      }

      // Draw particle with glow effect
      const particleColor = p5.color(255, 255, 255);
      particleColor.setAlpha(80);
      p5.fill(particleColor);
      p5.noStroke();
      
      // Draw glow
      p5.circle(particle.x, particle.y, 6);
      particleColor.setAlpha(150);
      p5.fill(particleColor);
      p5.circle(particle.x, particle.y, 3);

      // Update particle reference
      particlesRef.current[index] = particle;
    });

    // Draw animated waves on top
    p5.beginShape();
    waterColor.setAlpha(20);
    p5.fill(waterColor);
    p5.noStroke();
    p5.vertex(0, height);
    
    // Multiple wave frequencies
    for (let x = 0; x <= width; x += 10) {
      const wave1 = p5.sin(x * 0.02 + p5.frameCount * 0.05) * 3;
      const wave2 = p5.sin(x * 0.05 + p5.frameCount * 0.02) * 2;
      const y = height - waterLevel + wave1 + wave2;
      p5.vertex(x, y);
    }
    
    p5.vertex(width, height);
    p5.endShape(p5.CLOSE);
  };

  const windowResized = (p5: p5Types) => {
    if (!containerRef.current) return;
    
    dimensionsRef.current = {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    };
    
    p5.resizeCanvas(dimensionsRef.current.width, dimensionsRef.current.height);
  };

  return (
    <div 
      ref={containerRef} 
      className="absolute inset-0 z-0 overflow-hidden rounded-xl"
      style={{ opacity: 0.9 }}
    >
      <Sketch 
        setup={setup} 
        draw={draw} 
        windowResized={windowResized}
      />
    </div>
  );
}