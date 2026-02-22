import { useState } from 'react';
import { Plus, FileText, Edit, Trash2, Eye, Power, PowerOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  useFormTemplates,
  useDeleteFormTemplate,
  useToggleTemplateActive,
} from '@/hooks/useFormTemplates';
import { FormTemplate } from '@/types/formTemplate';
import { FormTemplateBuilderDialog } from '@/components/forms/FormTemplateBuilderDialog';
import { FormTemplatePreviewDialog } from '@/components/forms/FormTemplatePreviewDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function FormTemplatesAdmin() {
  const { data: templates, isLoading } = useFormTemplates(false);
  const deleteTemplate = useDeleteFormTemplate();
  const toggleActive = useToggleTemplateActive();

  const [builderOpen, setBuilderOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

  const handleEdit = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setBuilderOpen(true);
  };

  const handlePreview = (template: FormTemplate) => {
    setSelectedTemplate(template);
    setPreviewOpen(true);
  };

  const handleDelete = (id: string) => {
    setTemplateToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (templateToDelete) {
      deleteTemplate.mutate(templateToDelete);
      setDeleteDialogOpen(false);
      setTemplateToDelete(null);
    }
  };

  const handleToggleActive = (id: string, currentStatus: boolean) => {
    toggleActive.mutate({ id, is_active: !currentStatus });
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      key_request: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800',
      supply_request: 'bg-green-100 dark:bg-green-900/30 text-green-800',
      maintenance_request: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800',
      issue_report: 'bg-red-100 dark:bg-red-900/30 text-red-800',
      custom: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 dark:bg-gray-800/30 text-gray-800';
  };

  const getTypeName = (type: string) => {
    const names: Record<string, string> = {
      key_request: 'Key Request',
      supply_request: 'Supply Request',
      maintenance_request: 'Maintenance Request',
      issue_report: 'Issue Report',
      custom: 'Custom',
    };
    return names[type] || type;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-muted-foreground">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold">Form Template Builder</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage dynamic form templates for PDF generation
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedTemplate(null);
            setBuilderOpen(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{templates?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {templates?.filter((t) => t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">
              {templates?.filter((t) => !t.is_active).length || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Custom Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {templates?.filter((t) => t.template_type === 'custom').length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates?.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{template.template_name}</CardTitle>
                  <CardDescription className="mt-1">
                    {template.description || 'No description'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleToggleActive(template.id, template.is_active)}
                  title={template.is_active ? 'Deactivate' : 'Activate'}
                >
                  {template.is_active ? (
                    <Power className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <PowerOff className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Type Badge */}
              <div className="flex items-center gap-2">
                <Badge className={getTypeColor(template.template_type)}>
                  {getTypeName(template.template_type)}
                </Badge>
                <Badge variant="outline">v{template.version}</Badge>
                {template.is_active && (
                  <Badge variant="default" className="bg-green-600">
                    Active
                  </Badge>
                )}
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div>
                  <FileText className="h-3 w-3 inline mr-1" />
                  {template.sections.length} sections
                </div>
                <div>
                  <FileText className="h-3 w-3 inline mr-1" />
                  {template.fields.length} fields
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handlePreview(template)}
                >
                  <Eye className="h-3 w-3 mr-1" />
                  Preview
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(template)}
                >
                  <Edit className="h-3 w-3 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(template.id)}
                >
                  <Trash2 className="h-3 w-3 text-red-600 dark:text-red-400" />
                </Button>
              </div>

              {/* Metadata */}
              <div className="text-xs text-muted-foreground pt-2 border-t">
                Created {new Date(template.created_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {templates?.length === 0 && (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No templates yet</h3>
              <p className="text-muted-foreground">
                Create your first form template to get started
              </p>
            </div>
            <Button
              onClick={() => {
                setSelectedTemplate(null);
                setBuilderOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Template
            </Button>
          </div>
        </Card>
      )}

      {/* Dialogs */}
      <FormTemplateBuilderDialog
        open={builderOpen}
        onOpenChange={setBuilderOpen}
        template={selectedTemplate}
      />

      <FormTemplatePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={selectedTemplate}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Template</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this template? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
