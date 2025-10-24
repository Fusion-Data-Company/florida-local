import { useEffect, useState, useMemo } from 'react';

interface YouTubeBackgroundProps {
  youtubeUrl: string;
  overlayOpacity?: number;
  className?: string;
}

export default function YouTubeBackground({
  youtubeUrl,
  overlayOpacity = 0,
  className = ''
}: YouTubeBackgroundProps) {
  const [videoId, setVideoId] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  useEffect(() => {
    // Extract video ID from YouTube URL
    try {
      setIsLoading(true);
      const url = new URL(youtubeUrl);
      let id = '';
      
      if (url.hostname === 'youtu.be') {
        id = url.pathname.slice(1);
      } else if (url.hostname.includes('youtube.com')) {
        id = url.searchParams.get('v') || '';
      }
      
      if (id) {
        setVideoId(id);
        setHasError(false);
        console.log('✅ YouTube video loaded:', id, 'from URL:', youtubeUrl);
      } else {
        throw new Error('Invalid YouTube URL');
      }
    } catch (error) {
      console.error('❌ Failed to parse YouTube URL:', youtubeUrl, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [youtubeUrl]);

  // YouTube embed URL with visible controls for user interaction
  const embedUrl = useMemo(() => {
    if (!videoId) return '';
    
    // Parameters for visible, interactive YouTube player
    const params = new URLSearchParams({
      autoplay: '0', // Don't autoplay - let user click
      mute: '0', // Allow sound when user plays
      loop: '1',
      playlist: videoId, // Required for loop to work
      controls: '1', // SHOW controls so users can click play
      showinfo: '1', // Show video info
      rel: '0', // Don't show related videos
      modestbranding: '1', // Minimal YouTube branding
      playsinline: '1',
      enablejsapi: '1',
      iv_load_policy: '3', // Hide annotations
      fs: '1', // Allow fullscreen
      origin: window.location.origin, // Security best practice
    });
    
    return `https://www.youtube.com/embed/${videoId}?${params.toString()}`;
  }, [videoId]);

  // Handle iframe load events
  const handleIframeLoad = () => {
    console.log('✅ YouTube iframe loaded successfully for video:', videoId);
    setIsLoading(false);
  };

  return (
    <div
      className={`video-overlay-passthrough fixed inset-0 w-full h-full overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    >
      {/* Loading/Fallback gradient background */}
      {(hasError || !videoId || isLoading) && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #1a5f7a 0%, #0a2540 50%, #1a5f7a 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 15s ease infinite',
          }}
        />
      )}
      
      {/* YouTube iframe - Fullscreen background */}
      {!hasError && videoId && (
        <>
          <iframe
            src={embedUrl}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
              isLoading ? 'opacity-0' : 'opacity-100'
            }`}
            style={{
              width: '100vw',
              height: '100vh',
              objectFit: 'cover',
              pointerEvents: 'auto', // Allow user interaction!
              border: 'none',
              // Don't scale - show full player
              transform: 'none',
              transformOrigin: 'center center',
            }}
            allow="autoplay; encrypted-media; fullscreen"
            allowFullScreen={true}
            title="Background Video - Click to Play"
            onLoad={handleIframeLoad}
            loading="lazy"
          />
          
          {/* Click to play instruction overlay - hide after interaction */}
          {!hasUserInteracted && (
            <div 
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 text-center"
              style={{
                display: isLoading ? 'none' : 'block',
              }}
            >
              <div className="bg-black/70 text-white px-6 py-4 rounded-lg backdrop-blur-sm animate-pulse">
                <svg 
                  className="w-16 h-16 mx-auto mb-2 opacity-80"
                  fill="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path d="M8 5v14l11-7z"/>
                </svg>
                <p className="text-lg font-semibold">Click to Play Background Video</p>
                <p className="text-sm opacity-80 mt-1">Enhance your experience with video backgrounds</p>
              </div>
            </div>
          )}
          
          {/* Invisible click detector to hide instructions */}
          <div 
            className="absolute inset-0 z-5"
            style={{ pointerEvents: hasUserInteracted ? 'none' : 'auto' }}
            onClick={() => setHasUserInteracted(true)}
          />
        </>
      )}

      {/* Optional overlay for darkening */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      <style>{`
        @keyframes gradient-shift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
      `}</style>
    </div>
  );
}