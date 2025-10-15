import * as React from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight, Tag } from "lucide-react";
import { cn } from "@/lib/utils"; // Your utility for merging Tailwind classes

// Define the type for a single offer item
export interface Offer {
  id: string | number;
  imageSrc: string;
  imageAlt: string;
  tag: string;
  title: string;
  description: string;
  brandLogoSrc: string;
  brandName: string;
  promoCode?: string;
  href: string;
}

// Props for the OfferCard component
interface OfferCardProps {
  offer: Offer;
}

// The individual card component with hover animation
const OfferCard = React.forwardRef<HTMLAnchorElement, OfferCardProps>(({ offer }, ref) => (
  <motion.a
    ref={ref}
    href={offer.href}
    className="relative flex-shrink-0 w-[320px] h-[420px] rounded-3xl overflow-hidden group snap-start cursor-pointer"
    whileHover={{ y: -12, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ type: "spring", stiffness: 300, damping: 20 }}
    style={{
      perspective: "1000px",
      transformStyle: "preserve-3d"
    }}
  >
    {/* Outer glass border with shimmer */}
    <div className="absolute inset-0 rounded-3xl p-[2px] bg-gradient-to-br from-white/40 via-white/10 to-white/40 group-hover:from-white/60 group-hover:via-white/30 group-hover:to-white/60 transition-all duration-500">
      <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-500/20 via-pink-500/10 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl" />
    </div>

    {/* Background Image with overlay gradient */}
    <div className="absolute inset-0 w-full h-[55%] overflow-hidden rounded-t-3xl">
      <img
        src={offer.imageSrc}
        alt={offer.imageAlt}
        className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
      />
      {/* Gradient overlay on image */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/40 group-hover:to-black/30 transition-all duration-500" />

      {/* Animated light reflection */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/20 to-white/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 translate-x-[-100%] group-hover:translate-x-[100%] transform" style={{ transition: "transform 1.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.7s" }} />
    </div>

    {/* Glass card content */}
    <div
      className="absolute bottom-0 left-0 right-0 h-[45%] p-6 flex flex-col justify-between backdrop-blur-[24px] bg-white/95 dark:bg-gray-900/95 border-t border-white/20"
      style={{
        boxShadow: "0 -4px 30px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6)"
      }}
    >
      {/* Inner glass highlight */}
      <div className="absolute inset-0 bg-gradient-to-b from-white/40 via-transparent to-transparent opacity-50 pointer-events-none" />

      <div className="space-y-2 relative z-10">
        {/* Tag with glassmorphism */}
        <div className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-md border border-white/30 text-purple-700 dark:text-purple-300 group-hover:from-purple-500/30 group-hover:to-pink-500/30 transition-all duration-300">
          <Tag className="w-3.5 h-3.5 mr-1.5" />
          <span>{offer.tag}</span>
        </div>

        {/* Title & Description */}
        <h3 className="text-2xl font-bold bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-100 dark:to-white bg-clip-text text-transparent leading-tight tracking-tight">{offer.title}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">{offer.description}</p>
      </div>

      {/* Footer with premium glass styling */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200/50 dark:border-gray-700/50 relative z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={offer.brandLogoSrc}
              alt={`${offer.brandName} logo`}
              className="w-10 h-10 rounded-full border-2 border-white/50 shadow-lg transition-transform duration-300 group-hover:scale-110"
            />
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-900 dark:text-white tracking-wide">{offer.brandName}</p>
            {offer.promoCode && (
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">{offer.promoCode}</p>
            )}
          </div>
        </div>

        {/* Premium arrow button with glass effect */}
        <div
          className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/50 transform transition-all duration-500 group-hover:rotate-[-45deg] group-hover:shadow-xl group-hover:shadow-purple-500/70 group-hover:scale-110"
          style={{
            boxShadow: "0 4px 20px rgba(168, 85, 247, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.4)"
          }}
        >
          <ArrowRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  </motion.a>
));
OfferCard.displayName = "OfferCard";

// Props for the OfferCarousel component
export interface OfferCarouselProps extends React.HTMLAttributes<HTMLDivElement> {
  offers: Offer[];
}

// The main carousel component with scroll functionality
const OfferCarousel = React.forwardRef<HTMLDivElement, OfferCarouselProps>(
  ({ offers, className, ...props }, ref) => {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    const scroll = (direction: "left" | "right") => {
      if (scrollContainerRef.current) {
        const { current } = scrollContainerRef;
        const scrollAmount = current.clientWidth * 0.8; // Scroll by 80% of the container width
        current.scrollBy({
          left: direction === "left" ? -scrollAmount : scrollAmount,
          behavior: "smooth",
        });
      }
    };

    return (
      <div ref={ref} className={cn("relative w-full group", className)} {...props}>
        {/* Left Scroll Button - Premium Glass */}
        <button
          onClick={() => scroll("left")}
          className="absolute top-1/2 -translate-y-1/2 -left-6 z-20 w-14 h-14 rounded-full backdrop-blur-[20px] bg-white/90 dark:bg-gray-900/90 border-2 border-white/40 flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-0 active:scale-95"
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.5)"
          }}
          aria-label="Scroll Left"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-60" />
          <ChevronLeft className="w-7 h-7 relative z-10 transition-transform duration-300 group-hover:translate-x-[-2px]" />
        </button>

        {/* Scrollable Container with enhanced spacing */}
        <div
          ref={scrollContainerRef}
          className="flex space-x-8 overflow-x-auto pb-6 px-4 scrollbar-hide snap-x snap-mandatory scroll-smooth"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none"
          }}
        >
          {offers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>

        {/* Right Scroll Button - Premium Glass */}
        <button
          onClick={() => scroll("right")}
          className="absolute top-1/2 -translate-y-1/2 -right-6 z-20 w-14 h-14 rounded-full backdrop-blur-[20px] bg-white/90 dark:bg-gray-900/90 border-2 border-white/40 flex items-center justify-center text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110 hover:shadow-2xl hover:shadow-purple-500/30 disabled:opacity-0 active:scale-95"
          style={{
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.12), inset 0 2px 0 rgba(255, 255, 255, 0.5)"
          }}
          aria-label="Scroll Right"
        >
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/50 via-transparent to-transparent opacity-60" />
          <ChevronRight className="w-7 h-7 relative z-10 transition-transform duration-300 group-hover:translate-x-[2px]" />
        </button>
      </div>
    );
  }
);
OfferCarousel.displayName = "OfferCarousel";

export { OfferCarousel, OfferCard };
