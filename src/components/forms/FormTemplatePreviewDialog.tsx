import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { FormTemplate } from '@/types/formTemplate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface FormTemplatePreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  template: FormTemplate | null;
}

export function FormTemplatePreviewDialog({
  open,
  onOpenChange,
  template,
}: FormTemplatePreviewDialogProps) {
  if (!template) return null;

  const renderField = (field: Record<string, unknown>) => {
    const baseProps = {
      id: field.id,
      placeholder: field.placeholder || field.label,
      disabled: true, // Preview mode
    };

    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
      case 'number':
        return <Input {...baseProps} type={field.type} />;

      case 'textarea':
        return <Textarea {...baseProps} rows={3} />;

      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup disabled>
            {field.options?.map((option: string) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>{option}</Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox id={field.id} disabled />
            <Label htmlFor={field.id}>{field.label}</Label>
          </div>
        );

      case 'date':
        return <Input {...baseProps} type="date" />;

      default:
        return <Input {...baseProps} />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Form Preview: {template.template_name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Info */}
          <div className="flex items-center gap-2">
            <Badge>{template.template_type.replace('_', ' ')}</Badge>
            <Badge variant="outline">v{template.version}</Badge>
            {template.is_active && (
              <Badge variant="default" className="bg-green-600">
                Active
              </Badge>
            )}
          </div>

          {template.description && (
            <p className="text-sm text-muted-foreground">{template.description}</p>
          )}

          {/* Form Sections */}
          {template.sections
            .sort((a, b) => a.order - b.order)
            .map((section) => (
              <Card key={section.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                  {section.description && (
                    <p className="text-sm text-muted-foreground">{section.description}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.fields
                    .filter((f) => f.section_id === section.id)
                    .sort((a, b) => a.order - b.order)
                    .map((field) => (
                      <div key={field.id} className="space-y-2">
                        {field.type !== 'checkbox' && (
                          <Label htmlFor={field.id}>
                            {field.label}
                            {field.required && <span className="text-red-600 dark:text-red-400 ml-1">*</span>}
                          </Label>
                        )}
                        {renderField(field)}
                        {field.help_text && (
                          <p className="text-xs text-muted-foreground">{field.help_text}</p>
                        )}
                      </div>
                    ))}
                </CardContent>
              </Card>
            ))}

          {/* Stats */}
          <div className="text-sm text-muted-foreground border-t pt-4">
            <div className="grid grid-cols-2 gap-2">
              <div>Total Sections: {template.sections.length}</div>
              <div>Total Fields: {template.fields.length}</div>
              <div>
                Required Fields: {template.fields.filter((f) => f.required).length}
              </div>
              <div>
                Optional Fields: {template.fields.filter((f) => !f.required).length}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
