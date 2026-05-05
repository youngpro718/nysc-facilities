// Shared admin staff data — used by both the web view and PDF export
export interface AdminStaffMember {
  title: string;
  name: string;
  phone: string;
  room: string;
}

export const ADMIN_STAFF: AdminStaffMember[] = [
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
