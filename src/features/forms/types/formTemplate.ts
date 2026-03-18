// Form Template Types for Dynamic Form Builder

export type FieldType = 
  | 'text' 
  | 'email' 
  | 'tel' 
  | 'number' 
  | 'textarea' 
  | 'select' 
  | 'radio' 
  | 'checkbox' 
  | 'date';

export interface FormField {
  id: string;
  section_id: string;
  label: string;
  type: FieldType;
  required: boolean;
  order: number;
  help_text?: string;
  placeholder?: string;
  default?: string;
  readonly?: boolean;
  options?: string[];
  validation?: string;
  max_length?: number;
  min_value?: number;
  max_value?: number;
}

export interface FormSection {
  id: string;
  title: string;
  order: number;
  description?: string;
}

export interface PDFConfig {
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSize: number;
  fontFamily: string;
}

export interface FormTemplate {
  id: string;
  template_name: string;
  template_type: 'key_request' | 'supply_request' | 'maintenance_request' | 'issue_report' | 'custom';
  description: string | null;
  version: number;
  is_active: boolean;
  sections: FormSection[];
  fields: FormField[];
  pdf_config: PDFConfig;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateFormTemplateInput {
  template_name: string;
  template_type: FormTemplate['template_type'];
  description?: string;
  sections: FormSection[];
  fields: FormField[];
  pdf_config?: PDFConfig;
}

export interface UpdateFormTemplateInput extends Partial<CreateFormTemplateInput> {
  id: string;
  is_active?: boolean;
}
