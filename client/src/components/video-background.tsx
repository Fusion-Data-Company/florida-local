import { useEffect, useRef, useState, useMemo } from 'react';

// Video sources mapping - now supports both YouTube URLs and local files
const VIDEO_SOURCES = {
  discover: 'https://youtu.be/Z8ioWqthS-o',
  cityscape: 'https://youtu.be/5xnaoI0cXjs', 
  jacksonville: 'https://youtu.be/I0qV37ezBJc',
  fountain: 'https://youtu.be/5RVvKpX9eBU',
  riga: 'https://youtu.be/3dKLJCz-T5Y'
} as const;

type VideoKey = keyof typeof VIDEO_SOURCES;

interface VideoBackgroundProps {
  videoKey?: VideoKey;
  videoSrc?: string; // Optional custom video source (backwards compatibility)
  overlayOpacity?: number;
  randomize?: boolean; // If true, randomly select a video on mount
}

export default function VideoBackground({
  videoKey,
  videoSrc,
  overlayOpacity = 0,
  randomize = false
}: VideoBackgroundProps) {
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize video source on mount
  useEffect(() => {
    let selectedSrc = '';
    
    // Priority: custom videoSrc > videoKey > random selection > default
    if (videoSrc) {
      selectedSrc = videoSrc;
    } else if (videoKey && VIDEO_SOURCES[videoKey]) {
      selectedSrc = VIDEO_SOURCES[videoKey];
    } else if (randomize) {
      const keys = Object.keys(VIDEO_SOURCES) as VideoKey[];
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      selectedSrc = VIDEO_SOURCES[randomKey];
    } else {
      // Default to discover video
      selectedSrc = VIDEO_SOURCES.discover;
    }
    
    setCurrentVideoSrc(selectedSrc);
    console.log('🎬 Video source selected:', selectedSrc);
  }, [videoSrc, videoKey, randomize]);

  // Extract YouTube video ID from URL
  useEffect(() => {
    if (!currentVideoSrc) return;
    
    try {
      setIsLoading(true);
      
      // Check if it's a YouTube URL
      if (currentVideoSrc.includes('youtu.be') || currentVideoSrc.includes('youtube.com')) {
        const url = new URL(currentVideoSrc);
        let id = '';
        
        if (url.hostname === 'youtu.be') {
          id = url.pathname.slice(1);
        } else if (url.hostname.includes('youtube.com')) {
          id = url.searchParams.get('v') || '';
        }
        
        if (id) {
          setVideoId(id);
          setHasError(false);
          console.log('✅ YouTube video ID extracted:', id);
        } else {
          throw new Error('Invalid YouTube URL');
        }
      } else {
        // Not a YouTube URL - treat as local file (legacy support)
        setVideoId('');
        console.log('📁 Using local video file:', currentVideoSrc);
      }
    } catch (error) {
      console.error('❌ Failed to process video URL:', currentVideoSrc, error);
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentVideoSrc]);

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
      className="video-overlay-passthrough fixed inset-0 w-full h-full overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Loading/Fallback gradient background */}
      {(hasError || (!videoId && !currentVideoSrc) || isLoading) && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #1a5f7a 0%, #0a2540 50%, #1a5f7a 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 15s ease infinite',
          }}
        />
      )}
      
      {/* YouTube iframe for YouTube URLs */}
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
              // Scale up to fill screen and hide YouTube UI elements
              transform: 'scale(1.5)',
              transformOrigin: 'center',
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

// Export video keys for use in other components
export { VIDEO_SOURCES, type VideoKey };