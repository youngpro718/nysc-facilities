import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ColorPicker } from "./ColorPicker";
import { IconPicker } from "./IconPicker";

const categoryFormSchema = z.object({
  name: z.string().min(1, "Category name is required").max(100, "Name too long"),
  description: z.string().max(500, "Description too long").optional(),
  color: z.enum(["red", "blue", "green", "yellow", "purple", "orange", "pink", "gray"]),
  icon: z.string().min(1, "Please select an icon"),
});

type CategoryFormData = z.infer<typeof categoryFormSchema>;

type Category = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
};

interface CategoryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: Category | null;
  mode: "create" | "edit";
}

export const CategoryFormDialog = ({
  open,
  onOpenChange,
  category,
  mode,
}: CategoryFormDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<CategoryFormData>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      description: "",
      color: "blue",
      icon: "📦",
    },
  });

  // Reset form when dialog opens/closes or category changes
  useEffect(() => {
    if (open && category && mode === "edit") {
      form.reset({
        name: category.name,
        description: category.description || "",
        color: category.color as any,
        icon: category.icon || "📦",
      });
    } else if (open && mode === "create") {
      form.reset({
        name: "",
        description: "",
        color: "blue",
        icon: "📦",
      });
    }
  }, [open, category, mode, form]);

  const createCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      // Check for duplicate names
      const { data: existing } = await supabase
        .from("inventory_categories")
        .select("id")
        .eq("name", data.name)
        .single();

      if (existing) {
        throw new Error("A category with this name already exists");
      }

      const { error } = await supabase
        .from("inventory_categories")
        .insert([{
          name: data.name,
          description: data.description || null,
          color: data.color,
          icon: data.icon,
        }]);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories-with-counts"] });
      toast({
        title: "Category created",
        description: "New category has been created successfully.",
      });
      onOpenChange(false);
      form.reset();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: CategoryFormData) => {
      if (!category) throw new Error("No category to update");

      // Check for duplicate names (excluding current category)
      const { data: existing } = await supabase
        .from("inventory_categories")
        .select("id")
        .eq("name", data.name)
        .neq("id", category.id)
        .single();

      if (existing) {
        throw new Error("A category with this name already exists");
      }

      const { error } = await supabase
        .from("inventory_categories")
        .update({
          name: data.name,
          description: data.description || null,
          color: data.color,
          icon: data.icon,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory-categories-with-counts"] });
      toast({
        title: "Category updated",
        description: "Category has been updated successfully.",
      });
      onOpenChange(false);
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const onSubmit = (data: CategoryFormData) => {
    if (mode === "create") {
      createCategoryMutation.mutate(data);
    } else {
      updateCategoryMutation.mutate(data);
    }
  };

  const isLoading = createCategoryMutation.isPending || updateCategoryMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Category" : "Edit Category"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter category name..."
                      {...field}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter category description..."
                      {...field}
                      disabled={isLoading}
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <ColorPicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="icon"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Icon</FormLabel>
                  <FormControl>
                    <IconPicker
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? mode === "create"
                    ? "Creating..."
                    : "Updating..."
                  : mode === "create"
                  ? "Create Category"
                  : "Update Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};