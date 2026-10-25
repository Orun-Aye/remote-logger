import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-sm border px-1.5 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-[color,box-shadow] overflow-hidden data-[pulse=true]:animate-[badge-pulse_2s_ease-in-out_infinite]",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-status-danger/10 text-status-danger [a&]:hover:bg-status-danger/15",
        outline:
          "border-border-subtle text-text-secondary [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        // State badges: a pale tint of the state colour, no border
        signal:
          "border-transparent bg-gs-100 text-text-primary",
        "status-ok":
          "border-transparent bg-status-ok/10 text-status-ok",
        "status-warn":
          "border-transparent bg-status-warn/10 text-status-warn",
        "status-danger":
          "border-transparent bg-status-danger/10 text-status-danger",
        "level-error":
          "border-transparent bg-level-error/10 text-level-error",
        "level-warn":
          "border-transparent bg-level-warn/10 text-level-warn",
        "level-info":
          "border-transparent bg-level-info/10 text-level-info",
        "level-debug":
          "border-transparent bg-gs-100 text-level-debug",
        "level-trace":
          "border-transparent bg-gs-50 text-level-trace",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
