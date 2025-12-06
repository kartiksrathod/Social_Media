import { cn } from "@/lib/utils"

function Skeleton({
  className,
  shimmer = true,
  variant = "default",
  ...props
}) {
  const variants = {
    default: "rounded-md",
    text: "h-4 w-full rounded skeleton-text",
    title: "h-6 w-3/4 rounded skeleton-title",
    avatar: "w-10 h-10 rounded-full skeleton-avatar",
    button: "h-10 w-24 rounded-lg skeleton-button",
    card: "h-48 w-full rounded-xl skeleton-card",
    circle: "rounded-full",
  };

  return (
    <div
      className={cn(
        "surface-600 skeleton-refined",
        shimmer ? "skeleton-shimmer" : "skeleton-pulse",
        variants[variant],
        className
      )}
      {...props} />
  );
}

// Convenience components
function SkeletonText({ className, ...props }) {
  return <Skeleton variant="text" className={className} {...props} />;
}

function SkeletonTitle({ className, ...props }) {
  return <Skeleton variant="title" className={className} {...props} />;
}

function SkeletonAvatar({ className, ...props }) {
  return <Skeleton variant="avatar" className={className} {...props} />;
}

function SkeletonButton({ className, ...props }) {
  return <Skeleton variant="button" className={className} {...props} />;
}

function SkeletonCard({ className, ...props }) {
  return <Skeleton variant="card" className={className} {...props} />;
}

export { 
  Skeleton, 
  SkeletonText, 
  SkeletonTitle, 
  SkeletonAvatar, 
  SkeletonButton, 
  SkeletonCard 
}
