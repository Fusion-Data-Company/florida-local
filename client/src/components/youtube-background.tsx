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

  // YouTube embed URL with autoplay, loop, muted, no controls - optimized for backgrounds
  const embedUrl = useMemo(() => {
    if (!videoId) return '';
    
    // Enhanced parameters for better background video experience
    const params = new URLSearchParams({
      autoplay: '1',
      mute: '1',
      loop: '1',
      playlist: videoId, // Required for loop to work
      controls: '0',
      showinfo: '0',
      rel: '0',
      modestbranding: '1',
      playsinline: '1',
      enablejsapi: '1',
      iv_load_policy: '3', // Hide annotations
      disablekb: '1', // Disable keyboard controls
      fs: '0', // Hide fullscreen button
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
              pointerEvents: 'none',
              border: 'none',
              // Adjust positioning to ensure video fills the viewport
              transform: 'scale(1.2)',
              transformOrigin: 'center center',
            }}
            allow="autoplay; encrypted-media"
            allowFullScreen={false}
            title="Background Video"
            onLoad={handleIframeLoad}
            loading="lazy"
          />
          
          {/* Additional overlay to ensure YouTube UI is hidden */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(to bottom, transparent 0%, transparent 70%, rgba(0,0,0,0.3) 100%)',
            }}
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