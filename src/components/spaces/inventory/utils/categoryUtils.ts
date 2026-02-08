
import { supabase } from "@/lib/supabase";
import { logger } from '@/lib/logger';

export interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export async function fetchAllCategories(): Promise<Category[]> {
  const { data, error } = await supabase
    .from('inventory_categories')
    .select('id, name, color, icon')
    .order('name');
  
  if (error) {
    logger.error('Error fetching categories:', error);
    throw error;
  }
  
  return data || [];
}

export function findCategoryByName(categories: Category[], categoryName: string): Category | null {
  if (!categoryName || !categories.length) return null;
  
  const normalizedName = categoryName.toLowerCase().trim();
  
  // First try exact match
  let match = categories.find(cat => cat.name.toLowerCase() === normalizedName);
  
  // If no exact match, try partial match
  if (!match) {
    match = categories.find(cat => 
      cat.name.toLowerCase().includes(normalizedName) ||
      normalizedName.includes(cat.name.toLowerCase())
    );
  }
  
  return match || null;
}

export function validateCategoryData(importedItems: unknown[], categories: Category[]): {
  validItems: unknown[];
  invalidItems: unknown[];
  missingCategories: string[];
} {
  const validItems: unknown[] = [];
  const invalidItems: unknown[] = [];
  const missingCategories: string[] = [];
  const foundMissingCategories = new Set<string>();

  importedItems.forEach((item, index) => {
    const categoryName = item.category;
    
    if (!categoryName || categoryName === 'General') {
      // Items without category or with 'General' are valid (will use default)
      validItems.push({
        ...item,
        category_id: null,
        rowIndex: index + 1
      });
      return;
    }

    const foundCategory = findCategoryByName(categories, categoryName);
    
    if (foundCategory) {
      validItems.push({
        ...item,
        category_id: foundCategory.id,
        rowIndex: index + 1
      });
    } else {
      invalidItems.push({
        ...item,
        rowIndex: index + 1,
        error: `Category "${categoryName}" not found`
      });
      
      if (!foundMissingCategories.has(categoryName)) {
        missingCategories.push(categoryName);
        foundMissingCategories.add(categoryName);
      }
    }
  });

  return { validItems, invalidItems, missingCategories };
}
