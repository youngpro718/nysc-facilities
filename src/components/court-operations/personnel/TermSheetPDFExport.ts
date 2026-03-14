import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '@/lib/supabase';

export interface TermAssignmentForPDF {
  part: string;
  justice: string;
  room: string;
  fax: string;
  tel: string;
  sergeant: string;
  clerks: string[];
}

interface TermInfo {
  name: string;
  startDate: string;
  endDate: string;
}

// ── Constants ────────────────────────────────────────────────────────────────
const PW = 210;      // page width  (A4 portrait, mm)
const PH = 297;      // page height
const ML = 12;       // left/right margin
const CW = PW - ML * 2; // content width (186mm)

// Colour helpers
type RGB = [number, number, number];
const BLACK:  RGB = [0,   0,   0];
const RED:    RGB = [178,  34,  52];
const GRAY:   RGB = [110, 110, 110];
const FLAG_R: RGB = [178,  34,  52];
const FLAG_B: RGB = [ 60,  59, 110];
const FLAG_W: RGB = [255, 255, 255];

// ── Hardcoded admin staff (user chose static for now) ─────────────────────
const ADMIN_STAFF: { title: string; name: string; phone: string; room: string }[] = [
  { title: 'ADMINISTRATIVE JUDGE',       name: 'ELLEN BIBEN',              phone: '646-386-4083', room: '1600'    },
  { title: 'CHIEF CLERK',                name: 'CHRISTOPHER DISANTO ESQ.', phone: '646-386-3900', room: '1010'    },
  { title: 'FIRST DEPUTY CHIEF CLERK',   name: 'LISA WHITE TINGLING',      phone: '646-386-4162', room: '1004'    },
  { title: 'DEPUTY CHIEF CLERK',         name: 'JENNIFER BITKOWER',        phone: '646-386-4305', room: '1131'    },
  { title: 'COURT CLERK SPECIALIST',     name: 'LAWRENCE SALVATO*',        phone: '646-386-4192', room: '927'     },
  { title: 'COURT CLERK SPECIALIST',     name: 'LISSETTE GARCIA',          phone: '646-386-4164', room: '1006A'   },
  { title: 'COURT CLERK SPECIALIST',     name: 'ERICA DAVID-GIL',          phone: '646-386-5036', room: '1002'    },
  { title: 'PRINCIPAL COURT REPORTER',   name: 'SUSAN PEARCE - BATES*',    phone: '646-386-4480', room: '921'     },
  { title: 'SENIOR COURT INTERPRETER',   name: 'ANNERY MARTE-MCNULTY',     phone: '646-386-4141', room: '17TH FL.'},
  { title: 'PRINCIPAL LAW LIBRARIAN',    name: 'IAN USTICK',               phone: '718-298-1971', room: '17TH FL.'},
  { title: 'MAJOR',                      name: 'MICHAEL MCKEE',            phone: '646-386-4444', room: '1610'    },
  { title: 'CAPTAIN',                    name: 'BRENDAN MULLANEY',         phone: '646-386-4444', room: '1610'    },
  { title: 'CAPTAIN',                    name: 'JAVIER AGOSTO',            phone: '646-386-4111', room: '933'     },
];

// Height the compact (no-staff) header occupies, used as margin.top for
// subsequent pages so autoTable leaves room for it.
const COMPACT_HDR_H = 32; // mm

// ── Drawing helpers ──────────────────────────────────────────────────────────
function drawFlag(doc: jsPDF, x: number, y: number, w: number, h: number) {
  const sh = h / 13;
  for (let i = 0; i < 13; i++) {
    doc.setFillColor(...(i % 2 === 0 ? FLAG_R : FLAG_W));
    doc.rect(x, y + i * sh, w, sh, 'F');
  }
  doc.setFillColor(...FLAG_B);
  doc.rect(x, y, w * 0.38, sh * 7, 'F');
  doc.setDrawColor(160, 160, 160);
  doc.setLineWidth(0.2);
  doc.rect(x, y, w, h, 'S');
}

/** Draw the full header with flags and court title block.
 *  Returns the Y position immediately below the header box. */
function drawFullHeader(doc: jsPDF, term: TermInfo): number {
  const flagW = 30;
  const flagH = 20;
  const bY = ML;       // box top
  const bH = flagH + 6;

  doc.setDrawColor(100, 100, 100);
  doc.setLineWidth(0.5);
  doc.rect(ML, bY, CW, bH, 'S');

  drawFlag(doc, ML + 2,           bY + 3, flagW, flagH);
  drawFlag(doc, PW - ML - flagW - 2, bY + 3, flagW, flagH);

  const cx = PW / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...BLACK);

  const lines = [
    'SUPREME COURT - CRIMINAL TERM',
    '100 CENTRE STREET & 111 CENTRE STREET',
    term.name.toUpperCase(),
    `${term.startDate} – ${term.endDate}`,
  ];
  const lineSpacing = bH / (lines.length + 1);
  lines.forEach((l, i) => doc.text(l, cx, bY + lineSpacing * (i + 1), { align: 'center' }));

  return bY + bH + 3;
}

/** Compact header (flags + title only, no staff list) for continuation pages. */
function drawCompactHeader(doc: jsPDF, term: TermInfo) {
  drawFullHeader(doc, term);
}

/** Draw the admin staff section. Returns Y below the section. */
function drawAdminStaff(doc: jsPDF, startY: number): number {
  let y = startY + 1;

  // Column x positions
  const xTitle = ML;
  const xName  = ML + 50;
  const xPhone = ML + 110;
  const xRoom  = ML + 155;

  for (const s of ADMIN_STAFF) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...BLACK);
    doc.text(s.title, xTitle, y);

    doc.setFont('helvetica', 'normal');
    doc.text(s.name, xName, y);

    doc.setTextColor(...RED);
    doc.text(s.phone, xPhone, y);

    doc.setTextColor(...BLACK);
    doc.text(s.room, xRoom, y);

    y += 5.2;
  }

  return y + 2;
}

function drawPageFooter(doc: jsPDF, pageNum: number) {
  const y = PH - 7;
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(...GRAY);
  doc.text('*LOCATED AT 111 CENTRE ST.', ML, y);
  doc.text(`PAGE No. ${pageNum}`, PW - ML, y, { align: 'right' });
}

/** Contact / instructions block rendered on the final page. */
function drawContactBlock(doc: jsPDF, startY: number) {
  let y = startY + 8;
  const col1 = ML;
  const col2 = ML + 46;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...BLACK);
  doc.text("General Clerk's Office", col1, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  ['100 Centre Street - Room 1000 (4000)', '111 Centre Street - Room 927 (4300)'].forEach(l => {
    doc.text(l, col2, y);
    y += 4.5;
  });

  y += 4;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('Case Management Coordinators', col1, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  const cmcLines = [
    '100 Centre Street - DOC matters:',
    '111 Centre Street - Bailey (4197)',
    '100 Centre Street - Linea (4127)',
    '100 Centre Street -',
    '111 Centre Street - Wilson (3652)',
    '100 Centre Street - Leary (5524)',
  ];
  cmcLines.forEach(l => { doc.text(l, col2, y); y += 4.5; });

  y += 6;

  const fax = 'Attorneys and representatives of criminal justice agencies are encouraged to fax documents to the Court Parts which have fax numbers associated with the Part. Documents can also be faxed to 212-374-3177 for Parts at 100 Centre Street and 212-374-2637 for Parts at 111 Centre Street.';
  doc.setFontSize(7.5);
  const faxLines = doc.splitTextToSize(fax, CW);
  doc.text(faxLines, ML, y);
  y += faxLines.length * 4.3 + 8;

  const email = 'Please be advised that over 250 Supreme Court employees have E-Mail access. The E-Mail address for Supreme Court employees is usually the first initial of the first name of the employee followed by the first seven letters of the last name of the employee followed by @NYCOURTS.GOV For example for The Chief Clerk Christopher DiSanto is CDiSanto@NYCOURTS.GOV';
  const emailLines = doc.splitTextToSize(email, CW);
  doc.text(emailLines, ML, y);
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase();
  } catch {
    return dateStr.toUpperCase();
  }
}

// ── Main export function ─────────────────────────────────────────────────────
export async function generateTermSheetPDF(assignments: TermAssignmentForPDF[]): Promise<void> {
  // Fetch the latest term from DB; fall back to sensible defaults
  let term: TermInfo = {
    name: 'TERM III',
    startDate: 'MARCH 2, 2026',
    endDate: 'MARCH 29, 2026',
  };

  try {
    const { data: terms } = await supabase
      .from('court_terms')
      .select('term_name, start_date, end_date')
      .order('start_date', { ascending: false })
      .limit(1);

    if (terms && terms.length > 0) {
      const t = terms[0];
      term = {
        name: t.term_name || term.name,
        startDate: t.start_date ? formatDate(t.start_date) : term.startDate,
        endDate: t.end_date   ? formatDate(t.end_date)   : term.endDate,
      };
    }
  } catch {
    // use defaults
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let pageCount = 1;

  // ── Page 1: full header + admin staff ─────────────────────────────────────
  let y = drawFullHeader(doc, term);
  y = drawAdminStaff(doc, y);

  // Divider line
  doc.setDrawColor(60, 60, 60);
  doc.setLineWidth(0.6);
  doc.line(ML, y, PW - ML, y);
  y += 3;

  drawPageFooter(doc, 1);

  // ── Parts table ───────────────────────────────────────────────────────────
  const head = [['PART', 'JUSTICE', 'ROOM', 'FAX\n(212)', '*TEL#\n646-386-', 'SGT.', 'CLERKS']];
  const body = assignments.map(a => [
    a.part     !== '—' ? a.part     : '',
    a.justice  !== '—' ? a.justice  : 'VACANT',
    a.room     !== '—' ? a.room     : '',
    a.fax      !== '—' ? a.fax      : '',
    a.tel      !== '—' ? a.tel      : '',
    a.sergeant !== '—' ? a.sergeant : '',
    a.clerks.length > 0 ? a.clerks.join('\n') : '',
  ]);

  autoTable(doc, {
    head,
    body,
    startY: y,
    margin: {
      left:  ML,
      right: ML,
      top:   ML + COMPACT_HDR_H + 2, // space for compact header on subsequent pages
    },
    tableWidth: CW,
    styles: {
      fontSize: 7,
      cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 },
      lineColor: [180, 180, 180],
      lineWidth: 0.2,
      overflow: 'linebreak',
    },
    headStyles: {
      fillColor:  [255, 255, 255] as RGB,
      textColor:  BLACK,
      fontStyle:  'bold',
      fontSize:   7.5,
      halign:     'center',
      lineColor:  [60, 60, 60] as RGB,
      lineWidth:  0.5,
    },
    alternateRowStyles: { fillColor: [255, 255, 255] as RGB },
    columnStyles: {
      0: { cellWidth: 18, halign: 'center', fontStyle: 'bold' },
      1: { cellWidth: 38 },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 22, halign: 'center' },
      4: { cellWidth: 26, halign: 'center' },
      5: { cellWidth: 26 },
      6: { cellWidth: CW - 18 - 38 - 14 - 22 - 26 - 26 }, // fill remaining
    },
    willDrawPage: (data) => {
      if (data.pageNumber > 1) {
        pageCount++;
        drawCompactHeader(doc, term);
      }
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        drawPageFooter(doc, data.pageNumber);
      }
    },
  });

  // ── Contact block on final page ───────────────────────────────────────────
  const finalY: number = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;
  const needsNewPage = finalY + 75 > PH - 15;

  if (needsNewPage) {
    doc.addPage();
    pageCount++;
    drawCompactHeader(doc, term);
    drawContactBlock(doc, ML + COMPACT_HDR_H + 2);
  } else {
    drawContactBlock(doc, finalY);
  }
  drawPageFooter(doc, pageCount);

  // ── Save ──────────────────────────────────────────────────────────────────
  const slug = term.name.replace(/\s+/g, '-').toLowerCase();
  doc.save(`criminal-term-sheet-${slug}.pdf`);
}
