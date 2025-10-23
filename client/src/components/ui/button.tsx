import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-all duration-350 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 relative overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        
        // === FLORIDA LOCAL LUXURY BUTTON VARIANTS ===
        
        // Florida Gold - Metallic gold primary button with shine effects
        "fl-gold": "bg-gradient-to-br from-[#d4af37] via-[#ffd700] to-[#cd7f32] text-white font-bold tracking-wide border-2 border-white/30 shadow-[0_4px_20px_rgba(212,175,55,0.5),0_8px_40px_rgba(212,175,55,0.3),0_2px_10px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(212,175,55,0.6),0_12px_50px_rgba(212,175,55,0.4),0_0_40px_rgba(255,215,0,0.4),inset_0_1px_0_rgba(255,255,255,0.8)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/40 before:via-white/10 before:to-white/40 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 active:translate-y-0",
        
        // Florida Teal - Primary teal gradient with gold accents
        "fl-teal": "bg-gradient-to-br from-[#008B8B] via-[#00A8A8] to-[#006B6B] text-white font-bold tracking-wide border-2 border-[#d4af37]/40 shadow-[0_4px_20px_rgba(0,139,139,0.4),0_8px_40px_rgba(0,139,139,0.25),inset_0_1px_0_rgba(255,255,255,0.4)] transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-[0_8px_32px_rgba(0,139,139,0.5),0_12px_50px_rgba(0,139,139,0.35),0_0_40px_rgba(212,175,55,0.3),inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-[#d4af37]/60 before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#d4af37]/20 before:via-transparent before:to-[#d4af37]/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        // Florida Glass - Glass morphism with teal-gold gradient border
        "fl-glass": "bg-white/40 backdrop-blur-xl border-2 border-transparent bg-origin-border bg-clip-padding text-[#008B8B] font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-300 ease-out before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:bg-gradient-to-br before:from-[#008B8B] before:via-[#d4af37] before:to-[#008B8B] before:-z-10 before:opacity-50 hover:bg-white/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12),0_0_30px_rgba(0,139,139,0.2),0_0_30px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-1 hover:before:opacity-100",
        
        // === ORIGINAL LUXURY ELITE VARIANTS ===
        
        // Primary Metallic Button - Full gold/bronze gradient with multi-layer shadows
        "metallic-primary": "bg-gradient-to-br from-[#d4af37] via-[#ffd700] via-[#f4e5c3] via-[#cd7f32] to-[#b8860b] text-white font-bold tracking-wide border-2 border-white/30 shadow-[0_4px_12px_rgba(212,175,55,0.4),0_2px_6px_rgba(0,0,0,0.15),0_1px_3px_rgba(0,0,0,0.1),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-350 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(212,175,55,0.5),0_4px_12px_rgba(212,175,55,0.3),0_2px_6px_rgba(0,0,0,0.2),0_0_30px_rgba(255,215,0,0.3),inset_0_1px_0_rgba(255,255,255,0.8)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:via-white/10 before:to-white/30 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-350 active:translate-y-0",
        
        // Secondary Glass Button - Glass morphism with metallic gradient border
        "glass-secondary": "bg-white/40 backdrop-blur-xl border-2 border-transparent bg-origin-border bg-clip-padding text-slate-900 font-semibold shadow-[0_4px_12px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.8)] transition-all duration-350 ease-out before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:bg-gradient-to-br before:from-[#d4af37] before:via-[#ffd700] before:to-[#cd7f32] before:-z-10 before:opacity-50 hover:bg-white/60 hover:shadow-[0_8px_20px_rgba(0,0,0,0.12),0_0_25px_rgba(212,175,55,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] hover:-translate-y-1 hover:before:opacity-100 after:absolute after:inset-0 after:bg-[url('@assets/generated_images/White_Carrara_Marble_Texture_e43e4cf1.png')] after:bg-cover after:mix-blend-soft-light after:opacity-0 hover:after:opacity-30 after:pointer-events-none after:transition-opacity after:duration-350",
        
        // Outline Refined - Transparent with metallic border, fills on hover
        "outline-refined": "bg-transparent border-2 border-transparent bg-origin-border text-slate-800 font-semibold shadow-[0_2px_6px_rgba(0,0,0,0.06)] transition-all duration-350 ease-out before:absolute before:inset-0 before:rounded-[inherit] before:p-[2px] before:bg-gradient-to-br before:from-[#d4af37] before:via-[#ffd700] before:to-[#cd7f32] before:-z-10 before:opacity-70 hover:bg-gradient-to-br hover:from-[#d4af37]/10 hover:via-[#ffd700]/10 hover:to-[#cd7f32]/10 hover:shadow-[0_6px_16px_rgba(212,175,55,0.2),0_0_20px_rgba(212,175,55,0.15)] hover:-translate-y-1 hover:before:opacity-100",
        
        // Icon Glass - Small glass morphism for icon buttons
        "icon-glass": "rounded-full bg-white/30 backdrop-blur-lg border border-white/40 text-slate-700 shadow-[0_2px_8px_rgba(0,0,0,0.08),inset_0_1px_0_rgba(255,255,255,0.6)] transition-all duration-350 ease-out hover:bg-white/50 hover:border-[#d4af37]/40 hover:text-slate-900 hover:shadow-[0_4px_16px_rgba(0,0,0,0.12),0_0_20px_rgba(212,175,55,0.2),inset_0_1px_0_rgba(255,255,255,0.8)] hover:scale-110 active:scale-105",
        
        // Danger Luxury - Red/amber with luxury treatment
        "danger-luxury": "bg-gradient-to-br from-red-500 via-red-400 to-amber-500 text-white font-bold border-2 border-white/30 shadow-[0_4px_12px_rgba(239,68,68,0.4),0_2px_6px_rgba(0,0,0,0.15),inset_0_1px_0_rgba(255,255,255,0.5)] transition-all duration-350 ease-out hover:-translate-y-1 hover:shadow-[0_8px_24px_rgba(239,68,68,0.5),0_4px_12px_rgba(239,68,68,0.3),0_0_30px_rgba(251,146,60,0.3),inset_0_1px_0_rgba(255,255,255,0.7)] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-350",
        
        // Original luxury variants (kept for compatibility)
        lux: "bg-gradient-to-br from-primary via-accent to-secondary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:shadow-primary/25 hover:scale-105 transform transition-all duration-300 ease-out before:absolute before:inset-0 before:bg-gradient-to-br before:from-white/20 before:to-transparent before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        glass: "glass-panel backdrop-blur-md bg-slate-50/80 border border-slate-200 text-slate-900 hover:bg-slate-100/80 hover:border-slate-300 hover:shadow-lg hover:shadow-primary/20 transform hover:scale-105 transition-all duration-300 ease-out",
        
        metal: "metallic text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:shadow-secondary/30 hover:scale-105 transform transition-all duration-300 ease-out active:scale-95 active:shadow-inner",
        
        refined: "bg-transparent border-2 border-primary text-primary hover:bg-primary/10 hover:text-primary hover:shadow-md transform hover:scale-105 transition-all duration-300 ease-out",
        
        premium: "bg-gradient-to-r from-accent via-primary to-secondary text-primary-foreground font-semibold shadow-lg hover:shadow-xl hover:shadow-accent/25 hover:scale-105 transform transition-all duration-300 ease-out relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/30 before:via-white/10 before:to-white/30 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300",
        
        // Rainbow Button - Bright shiny animated rainbow effect
        rainbow: "relative animate-rainbow cursor-pointer bg-[length:200%] text-white font-medium transition-colors [background-clip:padding-box,border-box,border-box] [background-origin:border-box] [border:calc(0.08*1rem)_solid_transparent] before:absolute before:bottom-[-20%] before:left-1/2 before:z-0 before:h-1/5 before:w-3/5 before:-translate-x-1/2 before:animate-rainbow before:bg-[linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] before:bg-[length:200%] before:[filter:blur(calc(0.8*1rem))] bg-[linear-gradient(#121213,#121213),linear-gradient(#121213_50%,rgba(18,18,19,0.6)_80%,rgba(18,18,19,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))] dark:bg-[linear-gradient(#fff,#fff),linear-gradient(#fff_50%,rgba(255,255,255,0.6)_80%,rgba(0,0,0,0)),linear-gradient(90deg,hsl(var(--color-1)),hsl(var(--color-5)),hsl(var(--color-3)),hsl(var(--color-4)),hsl(var(--color-2)))]"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12",
        xl: "h-14 rounded-lg px-12 text-lg"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
