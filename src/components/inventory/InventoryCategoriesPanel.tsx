import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Folder, Package } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CategoryFormDialog } from "./CategoryFormDialog";

type Category = {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
  item_count?: number;
};

export const InventoryCategoriesPanel = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);

  // Realtime handled by global RealtimeProvider; queries are invalidated centrally

  const { data: categories, isLoading } = useQuery({
    queryKey: ["inventory-categories-with-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventory_categories")
        .select(`
          *,
          inventory_items(count)
        `)
        .order("name");

      if (error) throw error;

      return data?.map(category => ({
        ...category,
        item_count: (category.inventory_items as any[])?.[0]?.count || 0,
      })) as Category[];
    },
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      // Check if category has items
      const { data: items } = await supabase
        .from("inventory_items")
        .select("id")
        .eq("category_id", categoryId)
        .limit(1);

      if (items && items.length > 0) {
        throw new Error("Cannot delete category that contains items. Please move or delete the items first.");
      }

      const { error } = await supabase
        .from("inventory_categories")
        .delete()
        .eq("id", categoryId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories-with-counts"] });
      toast({
        title: "Category deleted",
        description: "Category has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleDelete = async (category: Category) => {
    if (confirm(`Are you sure you want to delete the "${category.name}" category?`)) {
      deleteCategoryMutation.mutate(category.id);
    }
  };

  const handleAddCategory = () => {
    setDialogMode("create");
    setSelectedCategory(null);
    setDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setDialogMode("edit");
    setSelectedCategory(category);
    setDialogOpen(true);
  };

  const getColorClass = (color: string) => {
    const colorMap: Record<string, string> = {
      red: "bg-red-100 text-red-800",
      blue: "bg-blue-100 text-blue-800",
      green: "bg-green-100 text-green-800",
      orange: "bg-orange-100 text-orange-800",
      purple: "bg-purple-100 text-purple-800",
      yellow: "bg-yellow-100 text-yellow-800",
      pink: "bg-pink-100 text-pink-800",
      gray: "bg-gray-100 text-gray-800",
    };
    return colorMap[color] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return <div className="flex justify-center p-8">Loading categories...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Inventory Categories</h2>
          <p className="text-muted-foreground">Organize your inventory items by category</p>
        </div>
        <Button onClick={handleAddCategory}>
          <Plus className="h-4 w-4 mr-2" />
          Add Category
        </Button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories?.length === 0 ? (
          <Card className="col-span-full p-8 text-center">
            <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No categories found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first category to organize your inventory items.
            </p>
            <Button onClick={handleAddCategory}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Category
            </Button>
          </Card>
        ) : (
          categories?.map((category) => (
            <Card key={category.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${getColorClass(category.color)}`}>
                        <span className="text-lg">{category.icon || "📦"}</span>
                      </div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Package className="h-4 w-4" />
                      <span>{category.item_count || 0} items</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(category)}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      disabled={category.item_count > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {category.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.description}</p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Category Stats */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Category Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-1 rounded ${getColorClass(category.color)}`}>
                      <span className="text-sm">{category.icon || "📦"}</span>
                    </div>
                    <span className="font-medium">{category.name}</span>
                  </div>
                  <Badge variant="outline">
                    {category.item_count || 0} items
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Form Dialog */}
      <CategoryFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        category={selectedCategory}
        mode={dialogMode}
      />
    </div>
  );
};