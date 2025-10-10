import * as React from "react"

import { cn } from "@/lib/utils"

type CardSurfaceProps = React.HTMLAttributes<HTMLDivElement> & {
  "data-surface-intensity"?: string
  "data-surface-tone"?: string
}

const Card = React.forwardRef<HTMLDivElement, CardSurfaceProps>(
  ({ className, ...props }, ref) => {
    const {
      "data-surface-intensity": surfaceIntensity = "delicate",
      "data-surface-tone": surfaceTone,
      ...rest
    } = props

    return (
      <div
        ref={ref}
        data-surface-intensity={surfaceIntensity}
        data-surface-tone={surfaceTone}
        className={cn(
          "premium-surface rounded-lg border bg-card text-card-foreground shadow-sm glass-panel hover-lift transition-all duration-300 overflow-hidden relative",
          className
        )}
        {...rest}
      />
    )
  }
)
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
