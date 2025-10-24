// components/ui/cta-card.tsx
"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight } from "lucide-react";

// Define the props for the CtaCard component
interface CtaCardProps extends React.HTMLAttributes<HTMLDivElement> {
  imageSrc: string;
  title: string;
  description: string;
  inputPlaceholder?: string;
  buttonText: string;
  onButtonClick?: (email: string) => void;
}

const CtaCard = React.forwardRef<HTMLDivElement, CtaCardProps>(
  (
    {
      className,
      imageSrc,
      title,
      description,
      inputPlaceholder = "Email address",
      buttonText,
      onButtonClick,
      ...props
    },
    ref
  ) => {
    const [email, setEmail] = React.useState("");

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (onButtonClick) {
        onButtonClick(email);
      }
      console.log("Email submitted:", email);
    };

    // Animation variants for Framer Motion
    const containerVariants = {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.2,
          delayChildren: 0.1,
        },
      },
    };

    const itemVariants = {
      hidden: { y: 20, opacity: 0 },
      visible: {
        y: 0,
        opacity: 1,
        transition: {
          type: "spring",
          stiffness: 100,
          damping: 12,
        },
      },
    };

    return (
      <div
        ref={ref}
        className={cn(
          "group relative w-full overflow-hidden rounded-2xl border border-white/10 bg-card text-card-foreground shadow-[0_8px_32px_rgba(0,0,0,0.12),0_2px_8px_rgba(0,0,0,0.08)] hover:shadow-[0_12px_48px_rgba(0,0,0,0.18),0_4px_16px_rgba(0,0,0,0.12),0_0_80px_rgba(255,255,255,0.05)] transition-all duration-500 hover:border-white/20",
          className
        )}
        {...props}
      >
        {/* Background Image */}
        <img
          src={imageSrc}
          alt="Background"
          className="absolute inset-0 h-full w-full object-cover scale-105 group-hover:scale-110 transition-transform duration-700"
          aria-hidden="true"
        />
        {/* Multi-layer Dark Overlay for Cinema Effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/75 to-black/70" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        
        {/* Subtle Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_0%,rgba(0,0,0,0.5)_100%)]" />
        
        {/* Premium Shine Effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700" />

        {/* Content */}
        <motion.div
          className="relative z-10 grid h-full grid-cols-1 items-center gap-10 p-8 md:grid-cols-2 md:gap-12 md:p-12 lg:gap-16 lg:p-20"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col items-start text-left text-white">
            <motion.h2
              className="text-4xl font-extrabold tracking-tight md:text-5xl lg:text-6xl leading-[1.1] text-balance text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]"
              style={{
                textShadow: "0 2px 12px rgba(0,0,0,0.9), 0 4px 24px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,1)"
              }}
              variants={itemVariants}
            >
              {title}
            </motion.h2>
            <motion.p
              className="mt-6 max-w-xl text-lg md:text-xl leading-relaxed text-white font-semibold drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]"
              style={{
                textShadow: "0 2px 8px rgba(0,0,0,0.9), 0 1px 3px rgba(0,0,0,1)"
              }}
              variants={itemVariants}
            >
              {description}
            </motion.p>
          </div>

          <motion.div className="flex w-full max-w-md flex-col items-center justify-center md:items-start md:justify-start" variants={itemVariants}>
            <form
              onSubmit={handleSubmit}
              className="flex w-full flex-col gap-4 sm:flex-row sm:items-center"
            >
              <Input
                type="email"
                placeholder={inputPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="h-14 flex-grow border-2 border-white/30 bg-black/40 backdrop-blur-xl text-white placeholder:text-gray-300 focus:ring-2 focus:ring-[#d4af37]/60 focus:border-[#d4af37]/50 focus:ring-offset-0 transition-all duration-300 shadow-[0_4px_16px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.2)] hover:bg-black/50 hover:border-white/40 text-base font-semibold rounded-xl"
                style={{textShadow: '0 2px 6px rgba(0, 0, 0, 0.8)'}}
                aria-label={inputPlaceholder}
                required
              />
              <Button
                type="submit"
                size="lg"
                className="h-14 px-8 bg-gradient-to-br from-[#008B8B] via-[#00A8A8] to-[#006B6B] text-white font-bold tracking-wide border-2 border-[#d4af37]/50 shadow-[0_4px_20px_rgba(0,139,139,0.5),0_8px_40px_rgba(0,139,139,0.3),inset_0_1px_0_rgba(255,255,255,0.3)] hover:shadow-[0_6px_30px_rgba(0,139,139,0.6),0_12px_50px_rgba(0,139,139,0.4),0_0_40px_rgba(212,175,55,0.4)] hover:border-[#d4af37]/70 hover:-translate-y-0.5 transition-all duration-300 rounded-xl relative before:absolute before:inset-0 before:bg-gradient-to-r before:from-[#d4af37]/20 before:via-transparent before:to-[#d4af37]/20 before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300 before:rounded-xl"
              >
                {buttonText}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    );
  }
);

CtaCard.displayName = "CtaCard";

export { CtaCard };

