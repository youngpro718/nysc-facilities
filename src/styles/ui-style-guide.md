
# NYSC Facilities Hub - UI Style Guide

## Colors

The application uses a dark theme with specific color tokens. These colors are used throughout the application to maintain a consistent look and feel.

### Base Colors
- Background: hsl(0, 0%, 0%)
- Foreground: hsl(0, 0%, 98%)
- Card: hsl(0, 0%, 3%)
- Card Foreground: hsl(0, 0%, 98%)
- Primary: hsl(0, 0%, 98%)
- Secondary: hsl(0, 0%, 13%)
- Muted: hsl(0, 0%, 13%)
- Accent: hsl(0, 0%, 13%)
- Border: hsl(0, 0%, 14.9%)

### Status Colors
- Success: #10b981
- Warning: #f59e0b
- Danger: hsl(0, 84.2%, 60.2%)
- Info: #3b82f6

## Typography

### Font Family
The application uses a system font stack:
```css
system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif
```

### Font Sizes
- xs: 0.75rem (12px)
- sm: 0.875rem (14px)
- base: 1rem (16px)
- lg: 1.125rem (18px)
- xl: 1.25rem (20px)
- 2xl: 1.5rem (24px)
- 3xl: 1.875rem (30px)
- 4xl: 2.25rem (36px)

### Font Weights
- Normal: 400
- Medium: 500
- Semibold: 600
- Bold: 700

## Spacing

The application uses a consistent spacing scale for margins, paddings, and gaps:
- 0: 0rem (0px)
- 1: 0.25rem (4px)
- 2: 0.5rem (8px)
- 3: 0.75rem (12px)
- 4: 1rem (16px)
- 5: 1.25rem (20px)
- 6: 1.5rem (24px)
- 8: 2rem (32px)
- 10: 2.5rem (40px)
- 12: 3rem (48px)
- 16: 4rem (64px)
- 20: 5rem (80px)
- 24: 6rem (96px)
- 32: 8rem (128px)

## Components

### Layout Components

#### PageContainer
Used to wrap page content with consistent padding and maximum width:
```jsx
<PageContainer>
  <PageContent />
</PageContainer>
```

#### PageHeader
Used for consistent page headers with title, optional description, and actions:
```jsx
<PageHeader 
  title="Page Title" 
  description="Optional page description"
>
  <Button>Action</Button>
</PageHeader>
```

#### PageSection
For dividing content into logical sections:
```jsx
<PageSection title="Section Title" description="Section description">
  <Content />
</PageSection>
```

### Forms

#### FormSection
For grouping related form fields:
```jsx
<FormSection title="Personal Information" description="Enter your personal details">
  <FormField />
  <FormField />
</FormSection>
```

#### Input Styles
Form inputs should use consistent styling with clear labels and help text.

### Data Display

#### DataTable
For displaying structured data:
```jsx
<DataTable 
  columns={columns}
  data={data}
  emptyMessage="No data available"
/>
```

#### CardGrid
For grid-based card layouts:
```jsx
<CardGrid 
  columns={{ default: 1, sm: 2, lg: 3 }}
  gap="medium"
>
  <Card />
  <Card />
</CardGrid>
```

### Responsive Components

#### ResponsiveDialog
Changes between Dialog and Drawer based on screen size:
```jsx
<ResponsiveDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  title="Dialog Title"
>
  <DialogContent />
</ResponsiveDialog>
```

## Icons

Use Lucide React icons consistently throughout the application:
- Use appropriate icon size based on context (16px for inline, 20px for buttons, 24px for features)
- Maintain consistent color with text or use muted colors for secondary icons
- Commonly used icons: Search, Filter, Plus, Edit, Trash, etc.

## Responsive Design

The application follows a mobile-first approach with these breakpoints:
- Default: Mobile (0px and up)
- sm: Small screens (640px and up)
- md: Medium screens (768px and up)
- lg: Large screens (1024px and up)
- xl: Extra-large screens (1280px and up)
- 2xl: Super-large screens (1536px and up)

### Mobile Best Practices
- Use a single column layout
- Use drawer components instead of modals
- Ensure touch targets are at least 44x44px
- Stack form fields vertically
- Use simplified tables or card alternatives

## Accessibility

- Maintain color contrast ratios (WCAG AA compliance)
- Use semantic HTML elements
- Include proper ARIA attributes where needed
- Ensure keyboard navigation
- Provide focus indicators
