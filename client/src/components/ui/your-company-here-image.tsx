export default function YourCompanyHereImage({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-full aspect-video bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden ${className}`}>
      {/* Blue and Orange Paint Splashes Background */}
      <div className="absolute inset-0">
        {/* Blue splash on left */}
        <div className="absolute -left-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500 rounded-full blur-3xl opacity-60" />
        <div className="absolute left-0 top-1/4 w-64 h-64 bg-blue-400 rounded-full blur-2xl opacity-50" />
        <div className="absolute left-10 bottom-1/4 w-48 h-48 bg-cyan-400 rounded-full blur-xl opacity-40" />

        {/* Orange splash on right */}
        <div className="absolute -right-20 top-1/2 -translate-y-1/2 w-96 h-96 bg-orange-500 rounded-full blur-3xl opacity-60" />
        <div className="absolute right-0 bottom-1/4 w-64 h-64 bg-orange-400 rounded-full blur-2xl opacity-50" />
        <div className="absolute right-10 top-1/4 w-48 h-48 bg-amber-400 rounded-full blur-xl opacity-40" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 h-full flex flex-col items-center justify-center">
        {/* Metallic Text Effect */}
        <div className="text-center">
          <h2
            className="text-5xl md:text-7xl font-black mb-2"
            style={{
              background: 'linear-gradient(180deg, #e8e8e8 0%, #a8a8a8 50%, #666666 51%, #d4d4d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '0.05em'
            }}
          >
            YOUR
          </h2>
          <h2
            className="text-5xl md:text-7xl font-black mb-2"
            style={{
              background: 'linear-gradient(180deg, #e8e8e8 0%, #a8a8a8 50%, #666666 51%, #d4d4d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '0.05em'
            }}
          >
            COMPANY
          </h2>
          <h2
            className="text-5xl md:text-7xl font-black mb-8"
            style={{
              background: 'linear-gradient(180deg, #e8e8e8 0%, #a8a8a8 50%, #666666 51%, #d4d4d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              letterSpacing: '0.05em'
            }}
          >
            HERE
          </h2>
        </div>

        {/* Florida Local Logo */}
        <div className="absolute bottom-4 right-4">
          <img
            src="/I-am-the-logo.webp"
            alt="THE FLORIDA LOCAL"
            className="h-12 md:h-16 w-auto opacity-90"
            style={{
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }}
          />
        </div>
      </div>

      {/* Paint texture overlay */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="w-full h-full"
          style={{
            backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,0.1) 35px, rgba(255,255,255,0.1) 70px)`,
          }}
        />
      </div>
    </div>
  );
}