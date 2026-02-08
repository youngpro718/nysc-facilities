import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

// Optimized types for inventory management
export interface OptimizedInventoryItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  minimum_quantity: number;
  unit: string;
  location?: string;
  status: string;
  category_name?: string;
  category_color?: string;
  last_updated: string;
  is_low_stock: boolean;
}

export interface InventoryDashboardStats {
  total_items: number;
  total_value: number;
  low_stock_count: number;
  categories_count: number;
  out_of_stock_count: number;
  recently_updated_count: number;
}

export interface OptimizedInventoryCategory {
  id: string;
  name: string;
  color?: string;
  item_count: number;
  low_stock_items: number;
  total_quantity: number;
}

export class OptimizedInventoryService {
  private static readonly CACHE_TIME = 4 * 60 * 1000; // 4 minutes

  /**
   * Get dashboard statistics with optimized query
   */
  static async getDashboardStats(): Promise<InventoryDashboardStats> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          quantity,
          minimum_quantity,
          updated_at
        `);

      if (error) throw error;

      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const stats = data.reduce(
        (acc, item) => {
          acc.total_items++;
          acc.total_value += item.quantity;
          
          if (item.quantity <= item.minimum_quantity) {
            acc.low_stock_count++;
          }
          
          if (item.quantity === 0) {
            acc.out_of_stock_count++;
          }
          
          if (new Date(item.updated_at) > oneDayAgo) {
            acc.recently_updated_count++;
          }
          
          return acc;
        },
        {
          total_items: 0,
          total_value: 0,
          low_stock_count: 0,
          categories_count: 0,
          out_of_stock_count: 0,
          recently_updated_count: 0,
        }
      );

      // Get categories count separately for better performance
      const { count: categoriesCount } = await supabase
        .from('inventory_categories')
        .select('*', { count: 'exact', head: true });

      stats.categories_count = categoriesCount || 0;

      return stats;
    } catch (error) {
      logger.error('Error fetching inventory dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get all inventory items with optimized query
   */
  static async getAllItems(): Promise<OptimizedInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          description,
          quantity,
          minimum_quantity,
          unit,
          location,
          status,
          updated_at,
          inventory_categories (
            name,
            color
          )
        `)
        .order('name');

      if (error) throw error;

      return data.map((item: Record<string, unknown>): OptimizedInventoryItem => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        location: item.location,
        status: item.status,
        category_name: item.inventory_categories?.name,
        category_color: item.inventory_categories?.color,
        last_updated: item.updated_at,
        is_low_stock: item.quantity <= item.minimum_quantity,
      }));
    } catch (error) {
      logger.error('Error fetching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get low stock items with optimized query
   */
  static async getLowStockItems(): Promise<OptimizedInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          description,
          quantity,
          minimum_quantity,
          unit,
          location,
          status,
          updated_at,
          inventory_categories (
            name,
            color
          )
        `)
        .order('quantity', { ascending: true });

      if (error) throw error;

      // Filter low stock items using database minimum_quantity
      const lowStockItems = data.filter((item: Record<string, unknown>) => item.quantity <= item.minimum_quantity);

      return lowStockItems.map((item: Record<string, unknown>): OptimizedInventoryItem => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        location: item.location,
        status: item.status,
        category_name: item.inventory_categories?.name,
        category_color: item.inventory_categories?.color,
        last_updated: item.updated_at,
        is_low_stock: true,
      }));
    } catch (error) {
      logger.error('Error fetching low stock items:', error);
      throw error;
    }
  }

  /**
   * Get categories with item counts
   */
  static async getCategories(): Promise<OptimizedInventoryCategory[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select(`
          id,
          name,
          color,
          inventory_items (
            id,
            quantity,
            minimum_quantity
          )
        `)
        .order('name');

      if (error) throw error;

      return data.map((category: Record<string, unknown>): OptimizedInventoryCategory => {
        const items = category.inventory_items || [];
        const lowStockItems = items.filter((item: Record<string, unknown>) => item.quantity <= item.minimum_quantity);
        const totalQuantity = items.reduce((sum: number, item: Record<string, unknown>) => sum + item.quantity, 0);

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          item_count: items.length,
          low_stock_items: lowStockItems.length,
          total_quantity: totalQuantity,
        };
      });
    } catch (error) {
      logger.error('Error fetching inventory categories:', error);
      throw error;
    }
  }

  /**
   * Search inventory items with full-text search
   */
  static async searchItems(query: string): Promise<OptimizedInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          description,
          quantity,
          minimum_quantity,
          unit,
          location,
          status,
          updated_at,
          inventory_categories (
            name,
            color
          )
        `)
        .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
        .order('name');

      if (error) throw error;

      return data.map((item: Record<string, unknown>): OptimizedInventoryItem => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        location: item.location,
        status: item.status,
        category_name: item.inventory_categories?.name,
        category_color: item.inventory_categories?.color,
        last_updated: item.updated_at,
        is_low_stock: item.quantity <= item.minimum_quantity,
      }));
    } catch (error) {
      logger.error('Error searching inventory items:', error);
      throw error;
    }
  }

  /**
   * Get items by category with optimized query
   */
  static async getItemsByCategory(categoryId: string): Promise<OptimizedInventoryItem[]> {
    try {
      const { data, error } = await supabase
        .from('inventory_items')
        .select(`
          id,
          name,
          description,
          quantity,
          minimum_quantity,
          unit,
          location,
          status,
          updated_at,
          inventory_categories (
            name,
            color
          )
        `)
        .eq('category_id', categoryId)
        .order('name');

      if (error) throw error;

      return data.map((item: Record<string, unknown>): OptimizedInventoryItem => ({
        id: item.id,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        minimum_quantity: item.minimum_quantity,
        unit: item.unit,
        location: item.location,
        status: item.status,
        category_name: item.inventory_categories?.name,
        category_color: item.inventory_categories?.color,
        last_updated: item.updated_at,
        is_low_stock: item.quantity <= item.minimum_quantity,
      }));
    } catch (error) {
      logger.error('Error fetching items by category:', error);
      throw error;
    }
  }
}
