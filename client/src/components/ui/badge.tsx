import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 relative overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        
        // Luxury variants
        glass: "glass-panel backdrop-blur-md bg-slate-50/80 border border-slate-200 text-slate-900 hover:bg-slate-100/80 hover:border-slate-300 hover:shadow-lg hover:shadow-primary/20 hover:scale-105 transform transition-all duration-300",
        
        refined: "bg-transparent border border-primary text-primary hover:bg-primary/10 hover:border-primary hover:shadow-md hover:scale-105 transform transition-all duration-300",
        
        refined_magenta: "bg-transparent border border-accent text-accent hover:bg-accent/10 hover:border-accent hover:shadow-md hover:scale-105 transform transition-all duration-300",
        
        refined_gold: "bg-transparent border border-secondary text-secondary hover:bg-secondary/10 hover:border-secondary hover:shadow-md hover:scale-105 transform transition-all duration-300",
        
        gradient: "border-transparent bg-gradient-to-r from-primary via-accent to-secondary text-primary-foreground hover:shadow-lg hover:shadow-primary/25 hover:scale-105 transform transition-all duration-300 font-bold",
        
        metallic: "metallic border-transparent text-primary-foreground hover:shadow-lg hover:shadow-secondary/30 hover:scale-105 transform transition-all duration-300 font-bold",
        
        pill: "rounded-full bg-gradient-to-r from-accent/20 via-primary/20 to-secondary/20 border border-primary/30 text-foreground hover:from-accent/30 hover:via-primary/30 hover:to-secondary/30 hover:border-primary/50 hover:scale-105 transform transition-all duration-300",
        
        premium: "bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground border-transparent hover:shadow-xl hover:shadow-accent/25 hover:scale-110 transform transition-all duration-300 font-bold relative before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300"
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
