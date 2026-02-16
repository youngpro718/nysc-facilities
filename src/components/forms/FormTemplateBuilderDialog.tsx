import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FormTemplate, FormSection, FormField, FieldType } from '@/types/formTemplate';
import { useCreateFormTemplate, useUpdateFormTemplate } from '@/hooks/useFormTemplates';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';

interface FormTemplateBuilderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FormTemplate | null;
}

export function FormTemplateBuilderDialog({
  open,
  onOpenChange,
  template,
}: FormTemplateBuilderDialogProps) {
  const createTemplate = useCreateFormTemplate();
  const updateTemplate = useUpdateFormTemplate();

  const [templateName, setTemplateName] = useState('');
  const [templateType, setTemplateType] = useState<FormTemplate['template_type']>('custom');
  const [description, setDescription] = useState('');
  const [sections, setSections] = useState<FormSection[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);

  useEffect(() => {
    if (template) {
      setTemplateName(template.template_name);
      setTemplateType(template.template_type);
      setDescription(template.description || '');
      setSections(template.sections);
      setFields(template.fields);
    } else {
      // Reset for new template
      setTemplateName('');
      setTemplateType('custom');
      setDescription('');
      setSections([]);
      setFields([]);
    }
  }, [template, open]);

  const addSection = () => {
    const newSection: FormSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      order: sections.length + 1,
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, updates: Partial<FormSection>) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const deleteSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
    setFields(fields.filter((f) => f.section_id !== id));
  };

  const addField = (sectionId: string) => {
    const newField: FormField = {
      id: `field_${Date.now()}`,
      section_id: sectionId,
      label: 'New Field',
      type: 'text',
      required: false,
      order: fields.filter((f) => f.section_id === sectionId).length + 1,
    };
    setFields([...fields, newField]);
  };

  const updateField = (id: string, updates: Partial<FormField>) => {
    setFields(fields.map((f) => (f.id === id ? { ...f, ...updates } : f)));
  };

  const deleteField = (id: string) => {
    setFields(fields.filter((f) => f.id !== id));
  };

  const handleSave = () => {
    const templateData = {
      template_name: templateName,
      template_type: templateType,
      description,
      sections,
      fields,
    };

    if (template) {
      updateTemplate.mutate(
        { id: template.id, ...templateData },
        {
          onSuccess: () => onOpenChange(false),
        }
      );
    } else {
      createTemplate.mutate(templateData, {
        onSuccess: () => onOpenChange(false),
      });
    }
  };

  const fieldTypes: { value: FieldType; label: string }[] = [
    { value: 'text', label: 'Text Input' },
    { value: 'email', label: 'Email' },
    { value: 'tel', label: 'Phone' },
    { value: 'number', label: 'Number' },
    { value: 'textarea', label: 'Text Area' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Radio Buttons' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'date', label: 'Date' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {template ? 'Edit Form Template' : 'Create Form Template'}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic">Basic Info</TabsTrigger>
            <TabsTrigger value="sections">Sections</TabsTrigger>
            <TabsTrigger value="fields">Fields</TabsTrigger>
          </TabsList>

          {/* Basic Info Tab */}
          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="template-name">Template Name</Label>
              <Input
                id="template-name"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Key Request Form"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="template-type">Template Type</Label>
              <Select value={templateType} onValueChange={(value: any) => setTemplateType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="key_request">Key Request</SelectItem>
                  <SelectItem value="supply_request">Supply Request</SelectItem>
                  <SelectItem value="maintenance_request">Maintenance Request</SelectItem>
                  <SelectItem value="issue_report">Issue Report</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this form template"
                rows={3}
              />
            </div>
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-medium">Form Sections</h3>
              <Button onClick={addSection} size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>

            <div className="space-y-3">
              {sections.map((section) => (
                <Card key={section.id} className="p-4">
                  <div className="flex items-start gap-3">
                    <GripVertical className="h-5 w-5 text-muted-foreground mt-2" />
                    <div className="flex-1 space-y-3">
                      <Input
                        value={section.title}
                        onChange={(e) => updateSection(section.id, { title: e.target.value })}
                        placeholder="Section Title"
                      />
                      <Input
                        value={section.description || ''}
                        onChange={(e) =>
                          updateSection(section.id, { description: e.target.value })
                        }
                        placeholder="Section Description (optional)"
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteSection(section.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>

            {sections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No sections yet. Add a section to get started.
              </div>
            )}
          </TabsContent>

          {/* Fields Tab */}
          <TabsContent value="fields" className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="space-y-3">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-medium">{section.title}</h3>
                  <Button onClick={() => addField(section.id)} size="sm" variant="outline">
                    <Plus className="h-4 w-4 mr-1" />
                    Add Field
                  </Button>
                </div>

                <div className="space-y-2">
                  {fields
                    .filter((f) => f.section_id === section.id)
                    .map((field) => (
                      <Card key={field.id} className="p-4">
                        <div className="grid grid-cols-2 gap-3">
                          <Input
                            value={field.label}
                            onChange={(e) => updateField(field.id, { label: e.target.value })}
                            placeholder="Field Label"
                          />
                          <Select
                            value={field.type}
                            onValueChange={(value: FieldType) =>
                              updateField(field.id, { type: value })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map((type) => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          <Input
                            value={field.help_text || ''}
                            onChange={(e) => updateField(field.id, { help_text: e.target.value })}
                            placeholder="Help text (optional)"
                          />

                          <div className="flex items-center gap-4">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`required-${field.id}`}
                                checked={field.required}
                                onCheckedChange={(checked) =>
                                  updateField(field.id, { required: checked as boolean })
                                }
                              />
                              <label
                                htmlFor={`required-${field.id}`}
                                className="text-sm cursor-pointer"
                              >
                                Required
                              </label>
                            </div>

                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteField(field.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                </div>
              </div>
            ))}

            {sections.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                Add sections first before adding fields.
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!templateName || sections.length === 0}>
            {template ? 'Update Template' : 'Create Template'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
