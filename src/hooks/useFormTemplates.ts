import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FormTemplate, CreateFormTemplateInput, UpdateFormTemplateInput } from '@/types/formTemplate';
import { toast } from 'sonner';

export function useFormTemplates(activeOnly = false) {
  return useQuery({
    queryKey: ['form-templates', activeOnly],
    queryFn: async () => {
      let query = supabase
        .from('form_templates')
        .select('*')
        .order('template_type')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FormTemplate[];
    },
  });
}

export function useFormTemplate(id: string | null) {
  return useQuery({
    queryKey: ['form-template', id],
    queryFn: async () => {
      if (!id) return null;

      const { data, error } = await supabase
        .from('form_templates')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as FormTemplate;
    },
    enabled: !!id,
  });
}

export function useCreateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateFormTemplateInput) => {
      const { data: { user } } = await supabase.auth.getUser();

      const { data, error } = await supabase
        .from('form_templates')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data as FormTemplate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success('Form template created successfully');
    },
    onError: (error: Error) => {
      console.error('Error creating form template:', error);
      toast.error('Failed to create form template');
    },
  });
}

export function useUpdateFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateFormTemplateInput) => {
      const { id, ...updates } = input;

      const { data, error } = await supabase
        .from('form_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FormTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      queryClient.invalidateQueries({ queryKey: ['form-template', data.id] });
      toast.success('Form template updated successfully');
    },
    onError: (error: Error) => {
      console.error('Error updating form template:', error);
      toast.error('Failed to update form template');
    },
  });
}

export function useDeleteFormTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('form_templates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      toast.success('Form template deleted successfully');
    },
    onError: (error: Error) => {
      console.error('Error deleting form template:', error);
      toast.error('Failed to delete form template');
    },
  });
}

export function useToggleTemplateActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('form_templates')
        .update({ is_active })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as FormTemplate;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['form-templates'] });
      queryClient.invalidateQueries({ queryKey: ['form-template', data.id] });
      toast.success(`Template ${data.is_active ? 'activated' : 'deactivated'}`);
    },
    onError: (error: Error) => {
      console.error('Error toggling template active status:', error);
      toast.error('Failed to update template status');
    },
  });
}
