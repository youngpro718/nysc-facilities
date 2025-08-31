
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase";

interface Category {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CategorySelector({ value, onValueChange }: CategorySelectorProps) {
  const { data: categories, isLoading, error } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      console.log('Fetching categories...');
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('id, name, color, icon')
        .order('name');
      
      if (error) {
        console.error('Error fetching categories:', error);
        throw error;
      }
      
      console.log('Retrieved categories:', data);
      return (data || []) as Category[];
    },
  });

  // Debug logging
  console.log('Current categories state:', categories);
  console.log('Loading state:', isLoading);
  console.log('Error state:', error);

  if (error) {
    console.error('Error in CategorySelector:', error);
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Error loading categories" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="error" disabled>Error loading categories</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  if (isLoading) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue placeholder="Loading categories..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="loading" disabled>Loading...</SelectItem>
        </SelectContent>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {(categories || []).map((category) => (
          <SelectItem 
            key={category.id} 
            value={category.id}
            className="flex items-center gap-2"
          >
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: category.color }} 
              />
              {category.name}
            </div>
          </SelectItem>
        ))}
        {(!categories || categories.length === 0) && (
          <SelectItem value="none" disabled>No categories available</SelectItem>
        )}
      </SelectContent>
    </Select>
  );
}
