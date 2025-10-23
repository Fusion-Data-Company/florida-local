import { useEffect, useState } from 'react';

interface YouTubeBackgroundProps {
  youtubeUrl: string;
  overlayOpacity?: number;
}

export default function YouTubeBackground({
  youtubeUrl,
  overlayOpacity = 0
}: YouTubeBackgroundProps) {
  const [videoId, setVideoId] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    // Extract video ID from YouTube URL
    try {
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
        console.log('✅ YouTube video loaded:', id);
      } else {
        throw new Error('Invalid YouTube URL');
      }
    } catch (error) {
      console.error('❌ Failed to parse YouTube URL:', youtubeUrl, error);
      setHasError(true);
    }
  }, [youtubeUrl]);

  // YouTube embed URL with autoplay, loop, muted, no controls
  const embedUrl = videoId
    ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`
    : '';

  return (
    <div
      className="video-overlay-passthrough fixed inset-0 w-full h-full overflow-hidden"
      style={{ zIndex: 0 }}
    >
      {/* Fallback gradient background when video unavailable */}
      {(hasError || !videoId) && (
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
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            width: '100vw',
            height: '100vh',
            objectFit: 'cover',
            pointerEvents: 'none',
            border: 'none',
            // Scale up to fill screen and hide controls
            transform: 'scale(1.5)',
            transformOrigin: 'center',
          }}
          allow="autoplay; encrypted-media"
          allowFullScreen
          title="Background Video"
        />
      )}

      {/* Optional overlay */}
      {overlayOpacity > 0 && (
        <div
          className="absolute inset-0 bg-black pointer-events-none"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  );
}
