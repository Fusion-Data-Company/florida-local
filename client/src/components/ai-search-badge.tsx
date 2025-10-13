import { Sparkles, Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AISearchBadgeProps {
  variant?: "inline" | "floating";
  className?: string;
}

/**
 * AI Search Badge Component
 *
 * Displays a visual indicator that search is powered by AI semantic search.
 * Shows tooltip explaining Pinecone-powered intelligent search capabilities.
 *
 * @param variant - "inline" for badge next to search input, "floating" for inside input
 * @param className - Additional Tailwind classes
 */
export default function AISearchBadge({
  variant = "inline",
  className = ""
}: AISearchBadgeProps) {

  if (variant === "floating") {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={200}>
          <TooltipTrigger asChild>
            <div
              className={`
                flex items-center gap-1.5 px-2.5 py-1 rounded-full
                bg-gradient-to-r from-purple-500/20 to-pink-500/20
                border border-purple-400/30
                backdrop-blur-sm
                cursor-help
                animate-pulse-subtle
                ${className}
              `}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span className="text-xs font-semibold text-purple-700">
                AI Search
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-semibold text-sm">Semantic AI Search</p>
              <p className="text-xs text-gray-600">
                Powered by Pinecone vector database. Understands context and meaning,
                not just keywords. Find businesses and products even when you don't
                know the exact terms.
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Inline variant - appears next to search input
  return (
    <TooltipProvider>
      <Tooltip delayDuration={200}>
        <TooltipTrigger asChild>
          <div
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-lg
              bg-gradient-to-r from-purple-500/10 to-pink-500/10
              border border-purple-400/20
              hover:border-purple-400/40 transition-all duration-300
              cursor-help group
              ${className}
            `}
          >
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600 group-hover:text-purple-700 transition-colors" />
              <span className="text-sm font-semibold text-purple-700">
                AI-Powered Search
              </span>
            </div>
            <Info className="w-3.5 h-3.5 text-purple-500 opacity-60 group-hover:opacity-100 transition-opacity" />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-sm z-50">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <p className="font-semibold text-sm">Semantic AI Search</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              Our search understands what you mean, not just what you type.
              Powered by Pinecone vector database with OpenAI embeddings.
            </p>
            <div className="pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500 italic">
                Try: "eco-friendly gifts" or "romantic dinner spots"
              </p>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

/**
 * Search Suggestions Component
 *
 * Shows recent and popular searches with AI-powered suggestions.
 * Intended to be displayed as a dropdown below search input.
 */
interface SearchSuggestionsProps {
  recentSearches?: string[];
  popularSearches?: string[];
  onSelectSearch: (query: string) => void;
  className?: string;
}

export function SearchSuggestions({
  recentSearches = [],
  popularSearches = [],
  onSelectSearch,
  className = ""
}: SearchSuggestionsProps) {

  const hasRecent = recentSearches.length > 0;
  const hasPopular = popularSearches.length > 0;

  if (!hasRecent && !hasPopular) {
    return null;
  }

  return (
    <div
      className={`
        absolute top-full mt-2 w-full
        bg-white rounded-xl shadow-xl border border-gray-200
        overflow-hidden z-50
        entrance-fade-up
        ${className}
      `}
    >
      {/* Recent Searches */}
      {hasRecent && (
        <div className="p-3 border-b border-gray-100">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recent Searches
          </p>
          <div className="space-y-1">
            {recentSearches.slice(0, 3).map((search, index) => (
              <button
                key={`recent-${index}`}
                onClick={() => onSelectSearch(search)}
                className="
                  w-full text-left px-3 py-2 rounded-lg
                  text-sm text-gray-700
                  hover:bg-purple-50 hover:text-purple-700
                  transition-colors duration-200
                  flex items-center gap-2
                "
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-500" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Popular Searches */}
      {hasPopular && (
        <div className="p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Popular Searches
          </p>
          <div className="flex flex-wrap gap-2">
            {popularSearches.slice(0, 5).map((search, index) => (
              <button
                key={`popular-${index}`}
                onClick={() => onSelectSearch(search)}
                className="
                  px-3 py-1.5 rounded-full
                  text-xs font-medium
                  bg-gray-100 text-gray-700
                  hover:bg-purple-100 hover:text-purple-700
                  transition-colors duration-200
                "
              >
                {search}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Attribution */}
      <div className="px-3 py-2 bg-gradient-to-r from-purple-50 to-pink-50 border-t border-purple-100">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="w-3 h-3 text-purple-600" />
          <p className="text-xs text-purple-700 font-medium">
            Powered by Pinecone AI
          </p>
        </div>
      </div>
    </div>
  );
}
