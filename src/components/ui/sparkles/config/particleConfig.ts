
// This file contains the particle configuration for the sparkles component
// Note: We're using a simpler type definition to avoid issues with the ISourceOptions import

export interface ParticleConfigOptions {
  background?: string;
  particleColor?: string;
  minSize?: number;
  maxSize?: number;
  speed?: number;
  particleDensity?: number;
}

export const createParticleConfig = (options: ParticleConfigOptions = {}): any => {
  const {
    background = "#000000",
    particleColor = "#ffffff",
    minSize = 0.1,
    maxSize = 2,
    speed = 1,
    particleDensity = 100
  } = options;

  return {
    background: {
      color: {
        value: background
      }
    },
    fpsLimit: 120,
    particles: {
      color: {
        value: particleColor
      },
      move: {
        enable: true,
        direction: "none",
        outModes: {
          default: "out"
        },
        random: true,
        speed: speed,
        straight: false
      },
      number: {
        density: {
          enable: true,
          area: particleDensity
        },
        value: 120
      },
      opacity: {
        animation: {
          enable: true,
          speed: 1,
          sync: false
        },
        value: {
          min: 0,
          max: 1
        }
      },
      shape: {
        type: "circle"
      },
      size: {
        value: {
          min: minSize,
          max: maxSize
        }
      }
    },
    detectRetina: true
  };
};
