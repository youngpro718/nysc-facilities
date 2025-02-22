
import { useState, useEffect } from "react";
import { initParticlesEngine } from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";
import { useAnimation } from "framer-motion";
import type { Container } from "@tsparticles/engine";

export const useParticles = () => {
  const [init, setInit] = useState(false);
  const controls = useAnimation();

  useEffect(() => {
    initParticlesEngine(async (engine) => {
      await loadSlim(engine);
    }).then(() => {
      setInit(true);
    });
  }, []);

  const handleParticlesLoaded = async (container?: Container) => {
    if (container) {
      await controls.start({
        opacity: 1,
        transition: {
          duration: 1,
        },
      });
    }
  };

  return {
    init,
    controls,
    handleParticlesLoaded,
  };
};
