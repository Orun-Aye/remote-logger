import { LoadingSpinner } from "./LoadingSpinner";

// Full page loading overlay
export function LoadingOverlay({ message = "Loading..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-background/80 flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <LoadingSpinner size="large" />
        <p className="text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}