import jsPDF from 'jspdf';

export class PDFGenerationService {
  private static addHeader(doc: jsPDF, title: string) {
    // Header
    doc.setFontSize(20);
    doc.setTextColor(37, 99, 235);
    doc.text('NYSC Facilities Hub', 20, 20);
    
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(title, 20, 35);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Form Date: ${new Date().toLocaleDateString()}`, 20, 45);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 50, 190, 50);
  }

  private static addFooter(doc: jsPDF) {
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('Submit completed form via email to facilities@nysc.gov or upload at Form Intake', 105, pageHeight - 15, { align: 'center' });
    doc.text('All submissions are tracked in the NYSC Facilities system', 105, pageHeight - 10, { align: 'center' });
  }

  private static addField(doc: jsPDF, label: string, yPos: number, required: boolean = true): number {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${label}${required ? ' *' : ''}:`, 20, yPos);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, yPos + 2, 190, yPos + 2);
    
    return yPos + 12;
  }

  private static addTextArea(doc: jsPDF, label: string, yPos: number, lines: number = 3): number {
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text(`${label} *:`, 20, yPos);
    
    doc.setDrawColor(200, 200, 200);
    for (let i = 0; i < lines; i++) {
      doc.line(20, yPos + 2 + (i * 8), 190, yPos + 2 + (i * 8));
    }
    
    return yPos + (lines * 8) + 8;
  }

  static generateKeyElevatorPassForm(): jsPDF {
    const doc = new jsPDF();
    this.addHeader(doc, 'Key & Elevator Pass Request Form');

    let yPos = 60;

    // Instructions
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Complete all required fields (*). This form will be tracked in the system.', 20, yPos);
    yPos += 15;

    // Request Type
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Request Type *:', 20, yPos);
    doc.rect(20, yPos + 2, 5, 5);
    doc.text('Key', 28, yPos + 6);
    doc.rect(60, yPos + 2, 5, 5);
    doc.text('Elevator Pass', 68, yPos + 6);
    yPos += 15;

    // Fields
    yPos = this.addField(doc, 'Room Number or Elevator Access', yPos);
    yPos = this.addTextArea(doc, 'Reason for Access', yPos, 3);
    yPos = this.addField(doc, 'Quantity', yPos);
    yPos = this.addField(doc, 'Requestor Name', yPos);
    yPos = this.addField(doc, 'Email', yPos);
    yPos = this.addField(doc, 'Phone', yPos);
    yPos = this.addField(doc, 'Department/Office', yPos, false);

    this.addFooter(doc);
    return doc;
  }

  static generateMajorWorkRequestForm(): jsPDF {
    const doc = new jsPDF();
    this.addHeader(doc, 'Major Work Request Form');

    let yPos = 60;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('For significant facility changes: new outlets, flooring, painting, etc.', 20, yPos);
    yPos += 15;

    // Work Type
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Work Type *:', 20, yPos);
    yPos += 8;
    const workTypes = ['Electrical', 'Flooring', 'Painting', 'Plumbing', 'HVAC', 'Other'];
    workTypes.forEach((type, index) => {
      const col = index % 2;
      const row = Math.floor(index / 2);
      doc.rect(20 + (col * 90), yPos + (row * 8), 5, 5);
      doc.text(type, 28 + (col * 90), yPos + (row * 8) + 4);
    });
    yPos += 30;

    yPos = this.addField(doc, 'Work Title/Description', yPos);
    yPos = this.addTextArea(doc, 'Detailed Scope of Work', yPos, 4);
    yPos = this.addField(doc, 'Room/Location Number', yPos);
    yPos = this.addTextArea(doc, 'Justification for Work', yPos, 3);
    yPos = this.addField(doc, 'Budget Estimate (if known)', yPos, false);
    yPos = this.addField(doc, 'Requestor Name', yPos);
    yPos = this.addField(doc, 'Email', yPos);
    yPos = this.addField(doc, 'Phone', yPos);

    this.addFooter(doc);
    return doc;
  }

  static generateFacilityChangeLogForm(): jsPDF {
    const doc = new jsPDF();
    this.addHeader(doc, 'Facility Change Log Form');

    let yPos = 60;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Document major facility modifications and improvements for tracking.', 20, yPos);
    yPos += 15;

    yPos = this.addTextArea(doc, 'Change Description', yPos, 4);
    yPos = this.addField(doc, 'Location Affected', yPos);
    yPos = this.addField(doc, 'Date of Change', yPos);
    yPos = this.addTextArea(doc, 'Reason for Change', yPos, 3);
    yPos = this.addField(doc, 'Before/After Photos', yPos, false);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('(Attach separately or include links)', 25, yPos - 8);
    yPos += 5;
    yPos = this.addField(doc, 'Submitted By', yPos);
    yPos = this.addField(doc, 'Email', yPos);
    yPos = this.addField(doc, 'Department', yPos);

    this.addFooter(doc);
    return doc;
  }

  static generateExternalRequestForm(): jsPDF {
    const doc = new jsPDF();
    this.addHeader(doc, 'General Request Form');

    let yPos = 60;

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('For any facility-related request. All submissions tracked in the system.', 20, yPos);
    yPos += 15;

    yPos = this.addField(doc, 'Request Type/Category', yPos);
    yPos = this.addTextArea(doc, 'Detailed Description', yPos, 5);
    yPos = this.addField(doc, 'Location/Room Number', yPos);
    
    // Priority
    doc.setFontSize(11);
    doc.setTextColor(0, 0, 0);
    doc.text('Priority *:', 20, yPos);
    yPos += 8;
    const priorities = ['Low', 'Medium', 'High', 'Urgent'];
    priorities.forEach((priority, index) => {
      doc.rect(20 + (index * 40), yPos, 5, 5);
      doc.text(priority, 28 + (index * 40), yPos + 4);
    });
    yPos += 15;

    yPos = this.addField(doc, 'Requestor Name', yPos);
    yPos = this.addField(doc, 'Email', yPos);
    yPos = this.addField(doc, 'Phone', yPos);
    yPos = this.addField(doc, 'Preferred Contact Method', yPos, false);

    this.addFooter(doc);
    return doc;
  }

  static downloadForm(formType: string) {
    let doc: jsPDF;
    let filename: string;

    switch (formType) {
      case 'key-request':
        doc = this.generateKeyElevatorPassForm();
        filename = 'Key_Elevator_Pass_Request.pdf';
        break;
      case 'major-work-request':
        doc = this.generateMajorWorkRequestForm();
        filename = 'Major_Work_Request.pdf';
        break;
      case 'facility-change-log':
        doc = this.generateFacilityChangeLogForm();
        filename = 'Facility_Change_Log.pdf';
        break;
      case 'external-request':
        doc = this.generateExternalRequestForm();
        filename = 'General_Request_Form.pdf';
        break;
      default:
        throw new Error('Unknown form type');
    }

    doc.save(filename);
  }
}
