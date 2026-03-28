import React, { useRef, useState } from "react";
import { motion, useSpring, useMotionValue, useTransform } from "framer-motion";

interface InteractiveCardProps {
  children: React.ReactNode;
  className?: string;
  accent?: "primary" | "cyan" | "accent";
}

export const InteractiveCard = ({ children, className = "", accent = "primary" }: InteractiveCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values for the cursor position within the card (0 to 1)
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);

  // Springs for smooth tilt
  const springConfig = { damping: 20, stiffness: 100 };
  const rotateX = useSpring(useTransform(mouseY, [0, 1], [5, -5]), springConfig);
  const rotateY = useSpring(useTransform(mouseX, [0, 1], [-5, 5]), springConfig);

  // Springs for smooth glow
  const glowX = useSpring(useTransform(mouseX, [0, 1], [0, 100]), springConfig);
  const glowY = useSpring(useTransform(mouseY, [0, 1], [0, 100]), springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    mouseX.set(x);
    mouseY.set(y);
  };

  const resetMouse = () => {
    mouseX.set(0.5);
    mouseY.set(0.5);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={resetMouse}
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      className={`relative group rounded-3xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-primary/5 ${className}`}
    >
      {/* Spotlight Glow Effect */}
      <motion.div
        className="absolute inset-0 pointer-events-none z-[-1] opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[inherit]"
        style={{
          background: `radial-gradient(circle 350px at ${glowX}% ${glowY}%, hsl(var(--${accent}) / 0.08), transparent 70%)`,
        }}
      />

      {/* Main Content (lifted for 3D depth) */}
      <div style={{ transform: "translateZ(20px)" }} className="h-full w-full">
        {children}
      </div>
    </motion.div>
  );
};
