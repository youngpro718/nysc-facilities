import * as THREE from 'three';

// Room type to icon path mapping (simple SVG paths for canvas drawing)
const ICON_PATHS: Record<string, { path: string; viewBox: string }> = {
  courtroom: {
    path: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', // Gavel-like
    viewBox: '0 0 24 24'
  },
  office: {
    path: 'M20 7h-4V3H8v4H4c-1.1 0-2 .9-2 2v11h20V9c0-1.1-.9-2-2-2zm-8-2h4v2h-4V5zM4 18v-7h4v7H4zm6 0v-9h4v9h-4zm10 0h-4v-7h4v7z', // Briefcase
    viewBox: '0 0 24 24'
  },
  storage: {
    path: 'M20 2H4c-1 0-2 .9-2 2v3h20V4c0-1.1-1-2-2-2zM2 22h20V8H2v14zm2-8h16v2H4v-2z', // Archive box
    viewBox: '0 0 24 24'
  },
  hallway: {
    path: 'M16.01 11H4v2h12.01v3L20 12l-3.99-4z', // Arrow
    viewBox: '0 0 24 24'
  },
  conference: {
    path: 'M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z', // Users
    viewBox: '0 0 24 24'
  },
  jury_room: {
    path: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', // Checkmark in circle
    viewBox: '0 0 24 24'
  },
  judges_chambers: {
    path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z', // Shield
    viewBox: '0 0 24 24'
  },
  default: {
    path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14z', // Square outline
    viewBox: '0 0 24 24'
  }
};

const textureCache = new Map<string, THREE.Texture>();

export function getIconTexture(roomType: string, color: string = '#0ea5e9'): THREE.Texture {
  const cacheKey = `${roomType}-${color}`;
  
  if (textureCache.has(cacheKey)) {
    return textureCache.get(cacheKey)!;
  }

  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;

  // Clear with transparency
  ctx.clearRect(0, 0, 64, 64);

  // Draw circle background
  ctx.beginPath();
  ctx.arc(32, 32, 28, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw icon using simple shapes based on type
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const normalized = roomType?.toLowerCase().replace(/[^a-z_]/g, '') || 'default';
  drawSimpleIcon(ctx, normalized);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  textureCache.set(cacheKey, texture);

  return texture;
}

function drawSimpleIcon(ctx: CanvasRenderingContext2D, type: string): void {
  ctx.save();
  ctx.translate(32, 32);

  switch (type) {
    case 'courtroom':
      // Gavel
      ctx.beginPath();
      ctx.moveTo(-10, -8);
      ctx.lineTo(10, -8);
      ctx.lineTo(10, -2);
      ctx.lineTo(-10, -2);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(-2, -2, 4, 16);
      ctx.fillRect(-8, 10, 16, 4);
      break;

    case 'office':
      // Desk/briefcase
      ctx.fillRect(-12, -6, 24, 14);
      ctx.clearRect(-10, -4, 20, 10);
      ctx.fillRect(-10, -4, 20, 10);
      ctx.fillRect(-4, -10, 8, 6);
      break;

    case 'storage':
      // Box
      ctx.strokeRect(-12, -8, 24, 18);
      ctx.beginPath();
      ctx.moveTo(-12, -2);
      ctx.lineTo(12, -2);
      ctx.stroke();
      ctx.fillRect(-4, 0, 8, 4);
      break;

    case 'hallway':
      // Arrow
      ctx.beginPath();
      ctx.moveTo(-12, 0);
      ctx.lineTo(6, 0);
      ctx.lineTo(6, -6);
      ctx.lineTo(14, 0);
      ctx.lineTo(6, 6);
      ctx.lineTo(6, 0);
      ctx.stroke();
      break;

    case 'conference':
    case 'jury_room':
      // People
      ctx.beginPath();
      ctx.arc(-8, -6, 4, 0, Math.PI * 2);
      ctx.arc(8, -6, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(-12, 0, 8, 10);
      ctx.fillRect(4, 0, 8, 10);
      break;

    case 'judges_chambers':
      // Star/badge
      ctx.beginPath();
      for (let i = 0; i < 5; i++) {
        const angle = (i * 4 * Math.PI) / 5 - Math.PI / 2;
        const r = i === 0 ? 12 : 12;
        ctx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      ctx.closePath();
      ctx.stroke();
      break;

    default:
      // Simple square
      ctx.strokeRect(-10, -10, 20, 20);
  }

  ctx.restore();
}

export function clearTextureCache(): void {
  textureCache.forEach(texture => texture.dispose());
  textureCache.clear();
}
