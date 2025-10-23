import { useEffect, useRef, useState } from 'react';

// Video file mapping for local videos in /Videos/ folder
const VIDEO_SOURCES = {
  discover: '/Videos/discover-bg.mp4',
  cityscape: '/Videos/cityscape-georgia-1.mp4',
  jacksonville: '/Videos/Jacksonville-FL-bg.mp4',
  fountain: '/Videos/Trees-Fountain-Trees-bg.mp4'
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
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [currentVideoSrc, setCurrentVideoSrc] = useState<string>('');

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

  useEffect(() => {
    if (!currentVideoSrc) return;
    
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      console.log('✅ Video can play:', currentVideoSrc);
      setIsLoaded(true);
      setHasError(false);
      // Attempt to play with error handling
      video.play().catch(err => {
        console.warn('Video autoplay prevented:', err);
        // Try muted autoplay as fallback
        video.muted = true;
        video.play().catch(e => console.error('Video play failed:', e));
      });
    };

    const handleError = (e: Event) => {
      console.warn('❌ Video failed to load (using fallback background):', currentVideoSrc, e);
      setHasError(true);
      setIsLoaded(false);
    };

    const handleLoadStart = () => {
      console.log('⏳ Loading video:', currentVideoSrc);
      setIsLoaded(false);
      setHasError(false);
    };

    video.addEventListener('loadstart', handleLoadStart);
    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('error', handleError);

    // Force reload the video source
    video.load();

    return () => {
      video.removeEventListener('loadstart', handleLoadStart);
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('error', handleError);
    };
  }, [currentVideoSrc]);

  return (
    <div
      className="video-overlay-passthrough fixed inset-0 w-full h-full overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Fallback gradient background when video unavailable (production without Videos folder) */}
      {(hasError || !currentVideoSrc) && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #1a5f7a 0%, #0a2540 50%, #1a5f7a 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 15s ease infinite',
          }}
        />
      )}
      
      {/* Video - Optimized for web with preload and compression hints */}
      {!hasError && currentVideoSrc && (
        <video
          ref={videoRef}
          key={currentVideoSrc} // Force re-render when source changes
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          style={{
            objectPosition: 'center',
            filter: 'brightness(1.0)',
            transition: 'opacity 0.5s ease-in-out',
            pointerEvents: 'none' // Ensure video doesn't capture mouse events
          }}
        >
          <source src={currentVideoSrc} type="video/mp4" />
          <source src={currentVideoSrc} type="video/quicktime" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Loading state with animated gradient while video loads */}
      {!isLoaded && !hasError && currentVideoSrc && (
        <div
          className="absolute inset-0 w-full h-full"
          style={{
            background: 'linear-gradient(135deg, #1a5f7a 0%, #0a2540 50%, #1a5f7a 100%)',
            backgroundSize: '200% 200%',
            animation: 'gradient-shift 15s ease infinite',
          }}
        />
      )}

      {/* Optional overlay - disabled for night video */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}

      <style jsx>{`
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