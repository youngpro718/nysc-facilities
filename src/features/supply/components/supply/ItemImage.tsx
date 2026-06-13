/**
 * ItemImage — renders an inventory item's photo. When the item has no uploaded
 * photo (only ~1 of 153 do today), it falls back to a generic category-themed
 * stock image keyed off the item name — the same approach the mobile cards use,
 * so a user "gets an idea" of the item on both platforms. If even that fails to
 * load, a category emoji placeholder is shown.
 */

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { getCategoryVisual } from '@features/supply/utils/categoryConfig';
import { getGenericItemImage } from '@/utils/inventoryImages';

interface ItemImageProps {
  photoUrl?: string | null;
  name?: string;
  categoryName?: string | null;
  alt?: string;
  className?: string;
}

export function ItemImage({ photoUrl, name = '', categoryName, alt = '', className }: ItemImageProps) {
  const [failed, setFailed] = useState(false);
  const visual = getCategoryVisual(categoryName);
  const src = photoUrl || getGenericItemImage(name);

  if (failed) {
    // Last-resort placeholder: category emoji on a tinted background.
    return (
      <div
        className={cn(
          'flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br',
          visual.gradient,
          className,
        )}
        aria-hidden
      >
        <span className="text-2xl leading-none">{visual.icon}</span>
      </div>
    );
  }

  return (
    <div className={cn('overflow-hidden rounded-lg bg-muted', className)}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="h-full w-full object-cover"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
