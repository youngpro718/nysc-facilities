import {
  BookOpen,
  Building2,
  AlertTriangle,
  Zap,
  Gavel,
  KeyRound,
  Package2,
  LucideIcon,
} from 'lucide-react';

export interface GuideItem {
  question: string;
  answer: string;
}

export interface GuideSection {
  id: string;
  title: string;
  icon: LucideIcon;
  items: GuideItem[];
}

export const guideSections: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    items: [
      {
        question: 'How do I navigate the app?',
        answer: 'Use the navigation bar at the top. Each icon is a module — hover to see the name, click to navigate. On mobile, use the bottom tab bar or hamburger menu.',
      },
      {
        question: 'What can I do based on my role?',
        answer: 'Admin: Full access to all modules. CMC: Court operations and term management. Court Aide: Tasks, supply room, and inventory. Standard User: Submit requests, report issues, view activity.',
      },
      {
        question: 'How do I switch between light and dark mode?',
        answer: 'Click the sun/moon icon in the top navigation bar. Your preference is saved automatically.',
      },
      {
        question: 'How do I update my profile?',
        answer: 'Click your avatar in the top-right corner to go to your Profile page. Update your name, contact info, and preferences there.',
      },
    ],
  },
  {
    id: 'lighting',
    title: 'Lighting Inspections',
    icon: Zap,
    items: [
      {
        question: 'How do I inspect lights on a floor?',
        answer: 'Go to Lighting > Floor View tab. Expand a floor to see hallway sections. Each dot is a fixture: Green = Working, Red = Out, Amber = Ballast. Tap any dot to cycle its status.',
      },
      {
        question: 'How do I add a new hallway section?',
        answer: 'In Floor View, expand a floor and click "+ Add Section." Enter the name (or tap a direction preset like North, Southwest), set fixture count, choose bulb technology, and click Add.',
      },
      {
        question: 'What is Walkthrough Mode?',
        answer: 'Click "Walkthrough" on any hallway to step through fixtures one by one. Designed for physical inspections where you walk the hallway and mark each light.',
      },
    ],
  },
  {
    id: 'operations',
    title: 'Issues & Operations',
    icon: AlertTriangle,
    items: [
      {
        question: 'How do I report a facility issue?',
        answer: 'Go to Operations > click "Report Issue." Select issue type, location (building/floor/room), priority, and add a description. You can also report from the User Dashboard.',
      },
      {
        question: 'How do I update an issue status?',
        answer: 'Click any issue card to open details. Use the status dropdown (Open > In Progress > Resolved > Closed). Add notes to document what was done.',
      },
      {
        question: 'How do I filter issues?',
        answer: 'Use the filter bar at the top of Operations. Filter by building, status, priority, or search by keyword.',
      },
    ],
  },
  {
    id: 'court',
    title: 'Court Operations',
    icon: Gavel,
    items: [
      {
        question: 'How do I upload a term sheet?',
        answer: 'Go to Court Operations > click "Upload Term" or "Upload Daily Report." Select the PDF and the system parses it automatically.',
      },
      {
        question: 'How do I assign personnel to courtrooms?',
        answer: 'In the Assignments section, use dropdown selectors to assign judges and staff to each courtroom. Changes save automatically.',
      },
      {
        question: 'How do I track courtroom shutdowns?',
        answer: 'Shutdowns are tracked in Court Operations. See which courtrooms are under maintenance and their expected return dates.',
      },
    ],
  },
  {
    id: 'keys',
    title: 'Keys & Access',
    icon: KeyRound,
    items: [
      {
        question: 'How do I process a key request?',
        answer: 'Go to Keys > Requests tab. Review each pending request and click Approve or Reject. Approved keys are automatically assigned.',
      },
      {
        question: 'How do I create a new key?',
        answer: 'In Keys, click "Create Key." Enter key type, number, building, and notes. It appears in inventory as available.',
      },
    ],
  },
  {
    id: 'inventory',
    title: 'Inventory & Supplies',
    icon: Package2,
    items: [
      {
        question: 'How do I add inventory items?',
        answer: 'Go to Inventory > click "Add Item." Fill in name, category, quantity, reorder point, and unit cost. Low stock alerts trigger when stock drops below the reorder point.',
      },
      {
        question: 'How do I fulfill a supply request?',
        answer: 'Go to Supply Room. Find an approved request, click "Claim." Pick items, update status: Picking > Ready > Completed.',
      },
      {
        question: 'How do I export inventory data?',
        answer: 'Click "Export CSV" on the Inventory page to download a spreadsheet of all items with quantities and details.',
      },
    ],
  },
  {
    id: 'spaces',
    title: 'Spaces & Floor Plans',
    icon: Building2,
    items: [
      {
        question: 'How do I add a new room?',
        answer: 'Go to Spaces, select building and floor, click "+". Fill in room details (name, number, type, capacity) and save.',
      },
      {
        question: 'How do I view floor plans?',
        answer: 'In Spaces, select building and floor, click "Floor Plan" tab. Toggle between 2D and 3D views. In 2D, drag objects to rearrange.',
      },
      {
        question: 'How do I assign someone to a room?',
        answer: 'Go to Access & Assignments, find the person, click their card, select "Assign Room." Choose building, floor, and room.',
      },
    ],
  },
];
