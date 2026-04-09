import paperImg from '@/assets/inventory/paper.jpg';
import cleaningImg from '@/assets/inventory/cleaning.jpg';
import lightingImg from '@/assets/inventory/lighting.jpg';
import furnitureImg from '@/assets/inventory/furniture.jpg';
import stationeryImg from '@/assets/inventory/stationery.jpg';
import toolsImg from '@/assets/inventory/tools.jpg';
import safetyImg from '@/assets/inventory/safety.jpg';
import bathroomImg from '@/assets/inventory/bathroom.jpg';
import electronicsImg from '@/assets/inventory/electronics.jpg';
import defaultImg from '@/assets/inventory/default.jpg';

const keywordMap: [string[], string][] = [
  [['paper', 'printer', 'copy', 'toner', 'cartridge', 'ink'], paperImg],
  [['soap', 'sanitizer', 'cleaning', 'bleach', 'detergent', 'disinfect', 'wipe', 'mop', 'broom', 'sponge', 'trash bag', 'garbage'], cleaningImg],
  [['bulb', 'light', 'lamp', 'fluorescent', 'led', 'ballast', 'fixture'], lightingImg],
  [['chair', 'desk', 'table', 'furniture', 'cabinet', 'shelf', 'shelving', 'bookcase'], furnitureImg],
  [['pen', 'pencil', 'marker', 'stapler', 'tape', 'scissor', 'clip', 'folder', 'binder', 'envelope', 'notepad', 'sticky note', 'rubber band', 'eraser'], stationeryImg],
  [['tool', 'wrench', 'screwdriver', 'hammer', 'drill', 'plier', 'saw', 'nail', 'screw', 'bolt'], toolsImg],
  [['safety', 'glove', 'helmet', 'hard hat', 'vest', 'goggles', 'first aid', 'extinguisher', 'mask', 'ear plug'], safetyImg],
  [['toilet', 'tissue', 'towel', 'bathroom', 'restroom', 'dispenser', 'hand dry'], bathroomImg],
  [['battery', 'cable', 'usb', 'charger', 'adapter', 'power strip', 'surge', 'extension cord', 'electronic'], electronicsImg],
];

/**
 * Returns a generic image URL based on the item name.
 * Falls back to a default supplies image if no keyword matches.
 */
export function getGenericItemImage(name: string): string {
  const lower = name.toLowerCase();
  for (const [keywords, image] of keywordMap) {
    if (keywords.some(k => lower.includes(k))) {
      return image;
    }
  }
  return defaultImg;
}
