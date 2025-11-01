export interface ReceiptData {
  receiptNumber: string;
  receiptType: 'confirmation' | 'pickup' | 'final';
  generatedAt: string;
  request: {
    id: string;
    title: string;
    status: string;
    priority: string;
    submittedAt: string;
  };
  requester: {
    name: string;
    email: string;
    department: string;
  };
  items: {
    name: string;
    quantityRequested: number;
    quantityApproved?: number;
    quantityFulfilled?: number;
    unit: string;
  }[];
  timeline: {
    submitted: string;
    approved?: string;
    ready?: string;
    completed?: string;
  };
  notes?: string;
  completedBy?: string;
}
