
import { useQuery } from "@tanstack/react-query";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";

interface Category {
  id: string;
  name: string;
  color: string;
}

interface CategorySelectorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export function CategorySelector({ value, onValueChange }: CategorySelectorProps) {
  const { data: categories } = useQuery({
    queryKey: ['inventory-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_categories')
        .select('*')
        .order('name');
      
      if (error) throw error;
      return data as Category[];
    },
  });

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {categories?.map((category) => (
          <SelectItem 
            key={category.id} 
            value={category.id}
            className="flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: category.color }} 
            />
            {category.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
