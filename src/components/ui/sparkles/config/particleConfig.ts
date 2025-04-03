
export interface ParticleConfigOptions {
  background?: string;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleDensity?: number;
}

export const createParticleConfig = (options: ParticleConfigOptions = {}) => {
  const {
    background = "transparent",
    particleColor = "#ffffff",
    minSize = 0.6,
    maxSize = 3,
    speed = 1,
    particleDensity = 100
  } = options;

  return {
    background: {
      color: {
        value: background,
      },
    },
    fpsLimit: 120,
    particles: {
      color: {
        value: particleColor,
      },
      move: {
        enable: true,
        direction: "none",
        outModes: {
          default: "out",
        },
        random: true,
        speed: speed,
        straight: false,
      },
      number: {
        density: {
          enable: true,
          area: particleDensity,
        },
        value: 100,
      },
      opacity: {
        value: 0.8,
      },
      shape: {
        type: "circle",
      },
      size: {
        value: { min: minSize, max: maxSize },
      },
    },
    detectRetina: true,
  };
};
