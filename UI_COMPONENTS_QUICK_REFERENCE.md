# 🎨 SocialVibe UI Components - Quick Reference Guide

## 📚 Table of Contents
1. [Typography](#typography)
2. [Buttons](#buttons)
3. [Inputs](#inputs)
4. [Badges](#badges)
5. [Avatars](#avatars)
6. [Alerts](#alerts)
7. [Progress Bars](#progress-bars)
8. [Skeletons](#skeletons)
9. [Empty States](#empty-states)
10. [Icons](#icons)

---

## 📝 Typography

### Headings
```jsx
<h1 className="text-display">Display Text</h1>     {/* Largest */}
<h1 className="text-hero">Hero Text</h1>           {/* Very Large */}
<h1 className="text-h1">Heading 1</h1>
<h2 className="text-h2">Heading 2</h2>
<h3 className="text-h3">Heading 3</h3>
<h4 className="text-h4">Heading 4</h4>
<h5 className="text-h5">Heading 5</h5>
<h6 className="text-h6">Heading 6</h6>
```

### Body Text
```jsx
<p className="text-body-lg">Large body text</p>
<p className="text-body">Standard body text</p>
<p className="text-body-sm">Small body text</p>
<p className="text-caption">Caption text</p>
<p className="text-overline">OVERLINE TEXT</p>
```

### Text Hierarchy
```jsx
<p className="text-hierarchy-primary">Most important</p>
<p className="text-hierarchy-secondary">Secondary importance</p>
<p className="text-hierarchy-tertiary">Least important</p>
```

---

## 🔘 Buttons

### Basic Usage
```jsx
import { Button } from "@/components/ui/button"

<Button>Click me</Button>
```

### Variants
```jsx
<Button variant="default">Default</Button>
<Button variant="destructive">Delete</Button>
<Button variant="outline">Outline</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button variant="success">Success</Button>
```

### Sizes
```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="xl">Extra Large</Button>

{/* Icon buttons */}
<Button size="icon-sm"><Icon /></Button>
<Button size="icon"><Icon /></Button>
<Button size="icon-lg"><Icon /></Button>
```

### Loading State
```jsx
<Button loading={true}>Loading...</Button>
<Button loading={isSubmitting}>Submit</Button>
```

---

## 📝 Inputs

### Basic Usage
```jsx
import { Input } from "@/components/ui/input"

<Input placeholder="Enter text" />
```

### With Error
```jsx
<Input 
  error={true}
  helperText="This field is required"
  placeholder="Email"
/>
```

### With Success
```jsx
<Input 
  success={true}
  helperText="Email is valid"
  placeholder="Email"
/>
```

### With Helper Text Only
```jsx
<Input 
  helperText="We'll never share your email"
  placeholder="Email"
/>
```

---

## 🏷️ Badges

### Variants
```jsx
import { Badge } from "@/components/ui/badge"

<Badge variant="default">Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="info">Info</Badge>
<Badge variant="outline">Outline</Badge>
<Badge variant="pulse">Pulse</Badge>
```

### Subtle Variants
```jsx
<Badge variant="success-subtle">Success</Badge>
<Badge variant="warning-subtle">Warning</Badge>
<Badge variant="error-subtle">Error</Badge>
<Badge variant="info-subtle">Info</Badge>
```

### Sizes
```jsx
<Badge size="sm">Small</Badge>
<Badge size="default">Default</Badge>
<Badge size="lg">Large</Badge>
```

### With Dot Indicator
```jsx
<Badge variant="success" dot={true}>Online</Badge>
<Badge variant="warning" dot={true}>Away</Badge>
<Badge variant="destructive" dot={true}>Busy</Badge>
```

---

## 👤 Avatars

### Basic Usage
```jsx
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

<Avatar>
  <AvatarImage src="/avatar.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Sizes
```jsx
<Avatar size="xs">...</Avatar>      {/* 24px */}
<Avatar size="sm">...</Avatar>      {/* 32px */}
<Avatar size="default">...</Avatar> {/* 40px */}
<Avatar size="lg">...</Avatar>      {/* 48px */}
<Avatar size="xl">...</Avatar>      {/* 64px */}
<Avatar size="2xl">...</Avatar>     {/* 80px */}
```

### With Status
```jsx
<Avatar status="online">...</Avatar>
<Avatar status="away">...</Avatar>
<Avatar status="busy">...</Avatar>
<Avatar status="offline">...</Avatar>
```

### With Ring
```jsx
<Avatar ring={true}>...</Avatar>
```

### Complete Example
```jsx
<Avatar status="online" size="lg" ring={true}>
  <AvatarImage src="/user.jpg" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

---

## ⚠️ Alerts

### Basic Usage
```jsx
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert"

<Alert>
  <AlertTitle>Heads up!</AlertTitle>
  <AlertDescription>
    You can add components to your app.
  </AlertDescription>
</Alert>
```

### Variants
```jsx
<Alert variant="default">...</Alert>
<Alert variant="destructive">...</Alert>
<Alert variant="success">...</Alert>
<Alert variant="warning">...</Alert>
<Alert variant="info">...</Alert>
```

### Dismissible
```jsx
<Alert 
  variant="info" 
  dismissible={true}
  onDismiss={() => console.log('dismissed')}
>
  <AlertTitle>Info</AlertTitle>
  <AlertDescription>This can be dismissed.</AlertDescription>
</Alert>
```

---

## 📊 Progress Bars

### Basic Usage
```jsx
import { Progress, ProgressIndeterminate } from "@/components/ui/progress"

<Progress value={60} />
```

### Variants
```jsx
<Progress value={60} variant="default" />
<Progress value={80} variant="success" />
<Progress value={50} variant="warning" />
<Progress value={30} variant="error" />
<Progress value={70} variant="info" />
```

### Sizes
```jsx
<Progress value={60} size="sm" />
<Progress value={60} size="default" />
<Progress value={60} size="lg" />
```

### With Value Display
```jsx
<Progress value={75} showValue={true} />
```

### Indeterminate (Loading)
```jsx
<ProgressIndeterminate />
<ProgressIndeterminate size="lg" />
```

---

## 💀 Skeletons

### Pre-built Variants
```jsx
import { 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar,
  SkeletonButton,
  SkeletonCard
} from "@/components/ui/skeleton"

<SkeletonText />
<SkeletonTitle />
<SkeletonAvatar />
<SkeletonButton />
<SkeletonCard />
```

### Custom Skeleton
```jsx
import { Skeleton } from "@/components/ui/skeleton"

<Skeleton className="h-12 w-12 rounded-full" />
<Skeleton className="h-4 w-full" />
```

### Loading State Example
```jsx
function LoadingState() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <SkeletonAvatar />
        <div className="flex-1 space-y-2">
          <SkeletonText />
          <SkeletonText className="w-2/3" />
        </div>
      </div>
      <SkeletonCard />
    </div>
  );
}
```

---

## 📭 Empty States

### Basic Usage
```jsx
import { EmptyState } from "@/components/ui/empty-state"
import { Inbox } from "lucide-react"

<EmptyState
  icon={Inbox}
  title="No messages yet"
  description="When you receive messages, they will appear here."
/>
```

### With Action
```jsx
<EmptyState
  icon={FolderOpen}
  title="No files found"
  description="Upload your first file to get started."
  action={() => handleUpload()}
  actionLabel="Upload File"
/>
```

---

## 🎨 Icons

### Icon Sizes
```jsx
import { Heart } from "lucide-react"

<Heart className="icon-xs" />   {/* 12px */}
<Heart className="icon-sm" />   {/* 16px */}
<Heart className="icon-md" />   {/* 20px */}
<Heart className="icon-lg" />   {/* 24px */}
<Heart className="icon-xl" />   {/* 32px */}
<Heart className="icon-2xl" />  {/* 40px */}
<Heart className="icon-3xl" />  {/* 48px */}
```

### Icon Animations
```jsx
<Heart className="icon-hover-pulse" />
<Bookmark className="icon-flip" />
<Share className="icon-hover-rotate" />
<MessageCircle className="icon-hover-bounce" />
```

---

## 🎯 Common Patterns

### Form with Validation
```jsx
function MyForm() {
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  
  return (
    <form className="space-y-4">
      <Input 
        error={errors.email}
        helperText={errors.email ? "Email is required" : ""}
        placeholder="Email"
      />
      
      <Input 
        error={errors.password}
        helperText={errors.password ? "Password is required" : ""}
        type="password"
        placeholder="Password"
      />
      
      <Button loading={loading} size="lg" className="w-full">
        Sign In
      </Button>
    </form>
  );
}
```

### User Card
```jsx
function UserCard({ user }) {
  return (
    <div className="flex items-center gap-3 card-premium p-4">
      <Avatar status={user.status} size="lg" ring={true}>
        <AvatarImage src={user.avatar} />
        <AvatarFallback>{user.initials}</AvatarFallback>
      </Avatar>
      
      <div className="flex-1">
        <h3 className="text-h5">{user.name}</h3>
        <p className="text-body-sm text-hierarchy-secondary">
          {user.role}
        </p>
      </div>
      
      <Badge 
        variant={user.status === 'online' ? 'success' : 'secondary'} 
        dot={true}
      >
        {user.status}
      </Badge>
    </div>
  );
}
```

### Loading State
```jsx
function ContentLoader() {
  return (
    <div className="space-y-6">
      {[1, 2, 3].map((i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-center gap-3">
            <SkeletonAvatar />
            <div className="flex-1 space-y-2">
              <SkeletonTitle />
              <SkeletonText className="w-3/4" />
            </div>
          </div>
          <SkeletonCard />
        </div>
      ))}
    </div>
  );
}
```

### Upload Progress
```jsx
function UploadProgress({ progress }) {
  const variant = 
    progress === 100 ? "success" : 
    progress > 50 ? "info" : 
    "default";
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-hierarchy-secondary">Uploading...</span>
        <span className="text-hierarchy-primary font-medium">
          {progress}%
        </span>
      </div>
      <Progress value={progress} variant={variant} showValue={false} />
      {progress === 100 && (
        <Alert variant="success">
          <AlertDescription>Upload complete!</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
```

---

## 🎨 Utility Classes

### Text Utilities
```jsx
// Typography
className="text-display"     // Largest heading
className="text-hero"        // Hero text
className="text-h1"          // H1 heading
className="text-body"        // Body text
className="text-caption"     // Small caption

// Hierarchy
className="text-hierarchy-primary"    // Most important
className="text-hierarchy-secondary"  // Less important
className="text-hierarchy-tertiary"   // Least important

// Contrast
className="text-contrast-high"   // High contrast
className="text-contrast-medium" // Medium contrast
className="text-contrast-low"    // Low contrast
```

### Component Utilities
```jsx
// Cards
className="card-premium"           // Premium card with shadow
className="card-premium-hover"     // Card with hover effect
className="card-hover-float"       // Floating hover animation

// Shadows
className="shadow-sm-premium"      // Small premium shadow
className="shadow-md-premium"      // Medium premium shadow
className="shadow-lg-premium"      // Large premium shadow

// Interactions
className="hover-lift-sm"          // Small lift on hover
className="hover-lift-md"          // Medium lift on hover
className="hover-lift-lg"          // Large lift on hover
className="hover-scale"            // Scale on hover
className="active-scale"           // Scale on active
```

---

## 📱 Responsive Design

All components are responsive by default. Use Tailwind breakpoints:

```jsx
// Mobile-first approach
className="text-sm sm:text-base lg:text-lg"
className="p-4 sm:p-6 lg:p-8"
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
```

---

## ♿ Accessibility

### Reduced Motion
All animations respect user's motion preferences automatically.

### Focus States
All interactive elements have enhanced focus states:
```jsx
className="focus-visible-refined"
className="focus-ring-enhanced"
```

### ARIA Labels
Always include appropriate ARIA labels:
```jsx
<Button aria-label="Close dialog">
  <X className="icon-md" />
</Button>
```

---

## 🎨 Color System

### Primary Colors
- Primary: Cyan (`--primary`)
- Success: Green
- Warning: Yellow
- Error/Destructive: Red
- Info: Blue

### Surface Layers
- `surface-900`: Main background
- `surface-800`: Elevated surfaces
- `surface-700`: Cards
- `surface-600`: Hover states

---

## 📚 Additional Resources

- Full Documentation: `/app/PHASE_2D_2E_2F_COMPLETE.md`
- Animation Showcase: `/app/ANIMATION_SHOWCASE.md`
- Design System: `/app/DESIGN_SYSTEM.md`
- Mobile UX Guide: `/app/MOBILE_UX_IMPROVEMENTS.md`

---

**Last Updated**: Phase 2D, 2E, 2F Implementation
**Version**: 1.7
**Status**: Production Ready ✅
