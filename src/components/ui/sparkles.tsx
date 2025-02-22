
"use client";
import React, { useId } from "react";
import Particles from "@tsparticles/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useParticles } from "./sparkles/hooks/useParticles";
import { createParticleConfig, type ParticleConfigOptions } from "./sparkles/config/particleConfig";

type SparklesCoreProps = ParticleConfigOptions & {
  id?: string;
  className?: string;
};

export const SparklesCore = (props: SparklesCoreProps) => {
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

  const { init, controls, handleParticlesLoaded } = useParticles();
  const generatedId = useId();

  const particleConfig = createParticleConfig({
    background,
    particleColor,
    minSize,
    maxSize,
    speed,
    particleDensity,
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={controls} 
      className={cn("opacity-0", className)}
    >
      {init && (
        <Particles
          id={id || generatedId}
          className={cn("h-full w-full")}
          particlesLoaded={handleParticlesLoaded}
          options={particleConfig}
        />
      )}
    </motion.div>
  );
};
