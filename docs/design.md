
# Design System

## Colors
The application uses a dark theme with specific color tokens:

```css
:root {
  --background: 0 0% 0%;
  --foreground: 0 0% 98%;
  --card: 0 0% 3%;
  --card-foreground: 0 0% 98%;
  --popover: 0 0% 3%;
  --popover-foreground: 0 0% 98%;
  --primary: 0 0% 98%;
  --primary-foreground: 0 0% 3%;
  --secondary: 0 0% 13%;
  --secondary-foreground: 0 0% 98%;
  --muted: 0 0% 13%;
  --muted-foreground: 0 0% 63.9%;
  --accent: 0 0% 13%;
  --accent-foreground: 0 0% 98%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 0 0% 98%;
  --border: 0 0% 14.9%;
  --input: 0 0% 14.9%;
  --ring: 0 0% 83.9%;
  --radius: 0.5rem;
}
```

## Components

### Cards
Used extensively throughout the application for content grouping:
```tsx
<Card className="shadow-md border-border/40">
  <CardHeader>
    <CardTitle>Title</CardTitle>
  </CardHeader>
  <CardContent>
    Content
  </CardContent>
</Card>
```

### Forms
Form components follow a consistent pattern using react-hook-form:
```tsx
<Form {...form}>
  <form className="space-y-4">
    <FormField />
    <Button>Submit</Button>
  </form>
</Form>
```

### Buttons
Various button styles are available:
- Primary: Main actions
- Secondary: Less prominent actions
- Destructive: Dangerous actions
- Ghost: Subtle actions

### Layout
The application uses a responsive grid system:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Content */}
</div>
```

## Typography

### Headings
```tsx
<h1 className="text-3xl font-bold tracking-tight">
<h2 className="text-2xl font-semibold">
<h3 className="text-xl font-medium">
```

### Body Text
```tsx
<p className="text-sm text-muted-foreground">
<span className="text-xs text-muted-foreground">
```

## Spacing
- Component spacing: `space-y-4`, `space-y-6`
- Padding: `p-4`, `px-4`, `py-6`
- Margins: `mt-4`, `mb-6`, `mx-auto`

## Icons
Uses Lucide React icons consistently throughout:
```tsx
import { Link2, Loader2, UserRound } from "lucide-react";
```

## Animations
- Loading spinner: `animate-spin`
- Transitions: `transition-colors`
- Hover effects: `hover:bg-muted/50`

## Responsive Design
- Mobile-first approach
- Breakpoints:
  - md: 768px
  - lg: 1024px
  - xl: 1280px

## Accessibility
- ARIA labels on interactive elements
- Focus management
- Color contrast compliance
