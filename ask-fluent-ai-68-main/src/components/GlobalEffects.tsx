import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export const GlobalEffects = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the glow position
  const springConfig = { damping: 25, stiffness: 150 };
  const dx = useSpring(mouseX, springConfig);
  const dy = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 1. Global Noise Grain */}
      <div className="noise-overlay" />

      {/* 2. Interactive Mouse Glow (Background Layer) */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[-1] overflow-hidden"
        style={{
          background: `radial-gradient(circle 600px at ${dx}px ${dy}px, hsl(var(--primary) / 0.12), transparent 80%)`,
        }}
      />
      
      {/* 3. Secondary Cyan Accent Glow */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-[-2] overflow-hidden"
        style={{
          background: `radial-gradient(circle 400px at ${dx}px ${dy}px, hsl(var(--cyan) / 0.08), transparent 70%)`,
        }}
      />
    </>
  );
};
