import jsPDF from 'jspdf';
import { FormTemplate } from '@/types/formTemplate';

export class DynamicPDFService {
  private doc: jsPDF;
  private yPos: number;
  private readonly pageWidth: number;
  private readonly pageHeight: number;
  private readonly leftMargin: number;
  private readonly rightMargin: number;
  private readonly lineHeight: number = 7;

  constructor(template: FormTemplate) {
    const config = template.pdf_config;
    this.doc = new jsPDF();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.leftMargin = config.margins.left;
    this.rightMargin = config.margins.right;
    this.yPos = config.margins.top;
  }

  generatePDF(template: FormTemplate, facilityEmail: string): Blob {
    // Add header
    this.addHeader(template.template_name);
    
    // Add description if exists
    if (template.description) {
      this.addText(template.description, 10);
      this.yPos += 5;
    }

    // Add sections and fields
    const sortedSections = [...template.sections].sort((a, b) => a.order - b.order);
    
    sortedSections.forEach((section) => {
      this.addSectionHeader(section.title);
      
      if (section.description) {
        this.addText(section.description, 9, true);
      }

      // Get fields for this section
      const sectionFields = template.fields
        .filter((f) => f.section_id === section.id)
        .sort((a, b) => a.order - b.order);

      sectionFields.forEach((field) => {
        this.addField(field);
      });

      this.yPos += 5; // Space between sections
    });

    // Add footer with submission instructions
    this.addFooter(facilityEmail);

    return this.doc.output('blob');
  }

  private addHeader(title: string) {
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.pageWidth / 2, this.yPos, { align: 'center' });
    this.yPos += 12;

    // Add line
    this.doc.setLineWidth(0.5);
    this.doc.line(this.leftMargin, this.yPos, this.pageWidth - this.rightMargin, this.yPos);
    this.yPos += 10;
  }

  private addSectionHeader(title: string) {
    this.checkPageBreak(15);
    
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.leftMargin, this.yPos);
    this.yPos += 8;
  }

  private addField(field: any) {
    this.checkPageBreak(20);

    const labelText = field.required ? `${field.label} *` : field.label;
    
    // Add label
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(labelText, this.leftMargin, this.yPos);
    this.yPos += 5;

    // Add help text if exists
    if (field.help_text) {
      this.doc.setFontSize(8);
      this.doc.setTextColor(100, 100, 100);
      const helpLines = this.doc.splitTextToSize(
        field.help_text,
        this.pageWidth - this.leftMargin - this.rightMargin
      );
      this.doc.text(helpLines, this.leftMargin, this.yPos);
      this.yPos += helpLines.length * 4;
      this.doc.setTextColor(0, 0, 0);
    }

    // Add input field based on type
    switch (field.type) {
      case 'textarea':
        this.addTextareaField();
        break;
      case 'checkbox':
        this.addCheckboxField(field.label);
        break;
      case 'radio':
        this.addRadioField(field.options || []);
        break;
      case 'select':
        this.addSelectField(field.options || []);
        break;
      default:
        this.addInputField();
    }

    this.yPos += 8;
  }

  private addInputField() {
    const fieldWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    this.doc.setLineWidth(0.3);
    this.doc.line(this.leftMargin, this.yPos, this.leftMargin + fieldWidth, this.yPos);
    this.yPos += 2;
  }

  private addTextareaField() {
    const fieldWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    const fieldHeight = 20;
    
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.leftMargin, this.yPos, fieldWidth, fieldHeight);
    this.yPos += fieldHeight + 2;
  }

  private addCheckboxField(label: string) {
    const boxSize = 4;
    this.doc.rect(this.leftMargin, this.yPos - 3, boxSize, boxSize);
    this.doc.setFontSize(9);
    this.doc.text(label, this.leftMargin + boxSize + 2, this.yPos);
    this.yPos += 2;
  }

  private addRadioField(options: string[]) {
    options.forEach((option) => {
      const circleRadius = 2;
      this.doc.circle(this.leftMargin + circleRadius, this.yPos - 1, circleRadius);
      this.doc.setFontSize(9);
      this.doc.text(option, this.leftMargin + circleRadius * 2 + 3, this.yPos);
      this.yPos += 6;
    });
  }

  private addSelectField(options: string[]) {
    const fieldWidth = this.pageWidth - this.leftMargin - this.rightMargin;
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.leftMargin, this.yPos - 4, fieldWidth, 6);
    
    // Add dropdown indicator
    this.doc.setFontSize(8);
    this.doc.text('▼', this.leftMargin + fieldWidth - 5, this.yPos);
    
    // Add options list below
    this.doc.setFontSize(7);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Options: ${options.join(', ')}`, this.leftMargin, this.yPos + 4);
    this.doc.setTextColor(0, 0, 0);
    this.yPos += 6;
  }

  private addText(text: string, fontSize: number, italic: boolean = false) {
    this.checkPageBreak(10);
    
    this.doc.setFontSize(fontSize);
    this.doc.setFont('helvetica', italic ? 'italic' : 'normal');
    
    const lines = this.doc.splitTextToSize(
      text,
      this.pageWidth - this.leftMargin - this.rightMargin
    );
    
    this.doc.text(lines, this.leftMargin, this.yPos);
    this.yPos += lines.length * this.lineHeight;
  }

  private addFooter(facilityEmail: string) {
    const footerY = this.pageHeight - 30;
    
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('How to Submit This Form:', this.leftMargin, footerY);
    
    this.doc.setFontSize(9);
    this.doc.setFont('helvetica', 'normal');
    this.doc.text(`• Email completed form to: ${facilityEmail}`, this.leftMargin, footerY + 5);
    this.doc.text('• Upload at: [Your Site URL]/form-intake', this.leftMargin, footerY + 10);
    this.doc.text('• Submit in person at the Facilities Office', this.leftMargin, footerY + 15);
    
    // Add required fields note
    this.doc.setFontSize(8);
    this.doc.setTextColor(100, 100, 100);
    this.doc.text('* Required fields', this.leftMargin, footerY + 22);
  }

  private checkPageBreak(requiredSpace: number) {
    if (this.yPos + requiredSpace > this.pageHeight - 40) {
      this.doc.addPage();
      this.yPos = 20;
    }
  }
}

// Export helper function
export async function generatePDFFromTemplate(
  template: FormTemplate,
  facilityEmail: string
): Promise<Blob> {
  const service = new DynamicPDFService(template);
  return service.generatePDF(template, facilityEmail);
}
