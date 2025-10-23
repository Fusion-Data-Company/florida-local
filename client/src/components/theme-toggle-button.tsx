import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export default function ThemeToggleButton({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative overflow-hidden rounded-2xl p-3 transition-all duration-500 group ${className}`}
      style={{
        background: theme === 'dark'
          ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)'
          : 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
        boxShadow: theme === 'dark'
          ? '0 4px 20px rgba(30, 41, 59, 0.5), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 4px 20px rgba(253, 230, 138, 0.5), inset 0 1px 0 rgba(255,255,255,0.8)',
      }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {/* Shimmer effect */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.6) 0%, transparent 50%, rgba(255,255,255,0.6) 100%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite',
        }}
      />

      {/* Icon with rotation animation */}
      <div className="relative z-10 transform transition-all duration-500 group-hover:scale-110 group-hover:rotate-180">
        {theme === 'dark' ? (
          <Sun className="h-5 w-5 text-yellow-400" />
        ) : (
          <Moon className="h-5 w-5 text-indigo-600" />
        )}
      </div>
    </button>
  );
}
