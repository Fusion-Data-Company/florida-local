import { Sparkles, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";

interface AIGeneratedBadgeProps {
  variant?: "subtle" | "prominent" | "minimal";
  size?: "sm" | "md" | "lg";
  className?: string;
  showTooltip?: boolean;
  customText?: string;
}

/**
 * AI Generated Badge Component
 *
 * Visual indicator that content was created with AI assistance.
 * Can be displayed in different variants and sizes.
 *
 * @param variant - Visual style: "subtle" (small, low-key), "prominent" (eye-catching), "minimal" (icon only)
 * @param size - Badge size: "sm", "md", "lg"
 * @param className - Additional Tailwind classes
 * @param showTooltip - Whether to show info tooltip (default: true)
 * @param customText - Custom text instead of "AI Generated"
 */
export default function AIGeneratedBadge({
  variant = "subtle",
  size = "sm",
  className = "",
  showTooltip = true,
  customText
}: AIGeneratedBadgeProps) {

  // Minimal variant - icon only
  if (variant === "minimal") {
    const iconSize = size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5";

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              <div className={`inline-flex items-center cursor-help ${className}`}>
                <Sparkles className={`${iconSize} text-purple-600`} />
              </div>
            </TooltipTrigger>
            <TooltipContent side="top">
              <p className="text-xs">AI-assisted content</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <div className={`inline-flex items-center ${className}`}>
        <Sparkles className={`${iconSize} text-purple-600`} />
      </div>
    );
  }

  // Subtle variant - small, discrete badge
  if (variant === "subtle") {
    const badge = (
      <Badge
        variant="outline"
        className={`
          flex items-center gap-1
          bg-purple-500/5 text-purple-700 border-purple-300/40
          hover:bg-purple-500/10 hover:border-purple-400/50
          transition-all duration-200
          ${size === "sm" ? "text-xs px-2 py-0.5" : size === "md" ? "text-sm px-2.5 py-1" : "text-base px-3 py-1.5"}
          ${className}
        `}
      >
        <Sparkles className={size === "sm" ? "w-3 h-3" : size === "md" ? "w-3.5 h-3.5" : "w-4 h-4"} />
        <span>{customText || "AI"}</span>
        {showTooltip && <Info className="w-3 h-3 opacity-60" />}
      </Badge>
    );

    if (showTooltip) {
      return (
        <TooltipProvider>
          <Tooltip delayDuration={200}>
            <TooltipTrigger asChild>
              {badge}
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              <p className="text-xs">
                This content was created with AI assistance using advanced language models.
              </p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return badge;
  }

  // Prominent variant - eye-catching, full badge
  const badge = (
    <Badge
      variant="outline"
      className={`
        flex items-center gap-1.5
        bg-gradient-to-r from-purple-500/10 to-pink-500/10
        text-purple-700 border-purple-400/40
        hover:from-purple-500/15 hover:to-pink-500/15
        hover:border-purple-400/60 hover:shadow-md
        transition-all duration-300
        ${size === "sm" ? "text-xs px-2.5 py-1" : size === "md" ? "text-sm px-3 py-1.5" : "text-base px-4 py-2"}
        ${className}
      `}
    >
      <Sparkles className={size === "sm" ? "w-3.5 h-3.5" : size === "md" ? "w-4 h-4" : "w-5 h-5"} />
      <span className="font-medium">{customText || "AI Generated"}</span>
      {showTooltip && <Info className="w-3 h-3 opacity-60" />}
    </Badge>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-sm">
            <div className="space-y-1">
              <p className="font-semibold text-xs">AI-Assisted Content</p>
              <p className="text-xs text-gray-600">
                This content was created using AI technology powered by advanced language models.
                Human oversight and editing ensure quality and accuracy.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return badge;
}

/**
 * AI Content Tag Component
 *
 * Alternative presentation as a tag/chip for inline content marking.
 * Useful for product descriptions, post captions, etc.
 */
interface AIContentTagProps {
  type?: "post" | "description" | "product" | "response";
  className?: string;
  onClick?: () => void;
}

export function AIContentTag({
  type = "post",
  className = "",
  onClick
}: AIContentTagProps) {

  const typeLabels = {
    post: "AI Post",
    description: "AI Description",
    product: "AI Product",
    response: "AI Response"
  };

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      className={`
        inline-flex items-center gap-1.5
        px-2.5 py-1 rounded-full
        text-xs font-medium
        bg-purple-100 text-purple-700
        border border-purple-200
        hover:bg-purple-200 hover:border-purple-300
        transition-all duration-200
        ${onClick ? "cursor-pointer" : "cursor-default"}
        ${className}
      `}
    >
      <Sparkles className="w-3 h-3" />
      {typeLabels[type]}
    </button>
  );
}

/**
 * AI Watermark Component
 *
 * Discrete watermark for images or media generated by AI.
 * Appears as a subtle overlay in the corner of content.
 */
interface AIWatermarkProps {
  position?: "top-left" | "top-right" | "bottom-left" | "bottom-right";
  className?: string;
}

export function AIWatermark({
  position = "bottom-right",
  className = ""
}: AIWatermarkProps) {

  const positionClasses = {
    "top-left": "top-2 left-2",
    "top-right": "top-2 right-2",
    "bottom-left": "bottom-2 left-2",
    "bottom-right": "bottom-2 right-2"
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={`
              absolute ${positionClasses[position]}
              flex items-center gap-1
              px-2 py-1 rounded
              bg-black/60 backdrop-blur-sm
              text-white text-xs font-medium
              opacity-70 hover:opacity-100
              transition-opacity duration-200
              cursor-help
              ${className}
            `}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="text-xs">AI-generated content</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
