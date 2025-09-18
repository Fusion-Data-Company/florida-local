import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  Play, 
  Pause, 
  Square,
  Maximize2,
  Download,
  Heart,
  Share2,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface CarouselItem {
  id: string;
  type: 'image' | 'video' | 'content';
  src: string;
  title?: string;
  description?: string;
  alt?: string;
  metadata?: {
    duration?: string;
    size?: string;
    format?: string;
    likes?: number;
    views?: number;
    downloads?: number;
  };
}

export interface MagicCarouselProps {
  items: CarouselItem[];
  autoplay?: boolean;
  autoplayInterval?: number;
  loop?: boolean;
  showControls?: boolean;
  showIndicators?: boolean;
  showThumbnails?: boolean;
  fullscreenEnabled?: boolean;
  downloadEnabled?: boolean;
  socialEnabled?: boolean;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  className?: string;
  onItemClick?: (item: CarouselItem, index: number) => void;
  onSlideChange?: (index: number) => void;
}

export default function MagicCarousel({
  items,
  autoplay = false,
  autoplayInterval = 5000,
  loop = true,
  showControls = true,
  showIndicators = true,
  showThumbnails = false,
  fullscreenEnabled = true,
  downloadEnabled = true,
  socialEnabled = true,
  aspectRatio = 'auto',
  className,
  onItemClick,
  onSlideChange
}: MagicCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoplay);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [dragStart, setDragStart] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  
  const carouselRef = useRef<HTMLDivElement>(null);
  const autoplayRef = useRef<NodeJS.Timeout>();
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Aspect ratio classes
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: ''
  };

  // Auto-play functionality
  useEffect(() => {
    if (isPlaying && items.length > 1) {
      autoplayRef.current = setInterval(() => {
        setCurrentIndex(prev => {
          const nextIndex = loop ? (prev + 1) % items.length : Math.min(prev + 1, items.length - 1);
          onSlideChange?.(nextIndex);
          return nextIndex;
        });
      }, autoplayInterval);
    } else {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    }

    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
      }
    };
  }, [isPlaying, items.length, autoplayInterval, loop, onSlideChange]);

  // Handle slide change
  const goToSlide = useCallback((index: number) => {
    if (index >= 0 && index < items.length) {
      setCurrentIndex(index);
      onSlideChange?.(index);
    }
  }, [items.length, onSlideChange]);

  const nextSlide = useCallback(() => {
    if (loop || currentIndex < items.length - 1) {
      const nextIndex = loop ? (currentIndex + 1) % items.length : currentIndex + 1;
      goToSlide(nextIndex);
    }
  }, [currentIndex, items.length, loop, goToSlide]);

  const prevSlide = useCallback(() => {
    if (loop || currentIndex > 0) {
      const prevIndex = loop ? (currentIndex - 1 + items.length) % items.length : currentIndex - 1;
      goToSlide(prevIndex);
    }
  }, [currentIndex, items.length, loop, goToSlide]);

  const togglePlayPause = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      carouselRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Touch and drag handlers
  const handleDragStart = useCallback((event: any, info: PanInfo) => {
    setDragStart(currentIndex);
    setDragOffset(0);
    setIsDragging(true);
    
    // Pause autoplay during drag
    if (isPlaying) {
      setIsPlaying(false);
    }
  }, [currentIndex, isPlaying]);

  const handleDrag = useCallback((event: any, info: PanInfo) => {
    setDragOffset(info.offset.x);
  }, []);

  const handleDragEnd = useCallback((event: any, info: PanInfo) => {
    setIsDragging(false);
    
    const threshold = 50;
    const velocity = info.velocity.x;
    
    if (Math.abs(info.offset.x) > threshold || Math.abs(velocity) > 500) {
      if (info.offset.x > 0) {
        prevSlide();
      } else {
        nextSlide();
      }
    }
    
    setDragOffset(0);
    
    // Resume autoplay if it was enabled
    if (autoplay) {
      setIsPlaying(true);
    }
  }, [prevSlide, nextSlide, autoplay]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!carouselRef.current?.contains(document.activeElement)) return;
      
      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          prevSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextSlide();
          break;
        case ' ':
          event.preventDefault();
          togglePlayPause();
          break;
        case 'f':
        case 'F':
          if (fullscreenEnabled) {
            event.preventDefault();
            toggleFullscreen();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [prevSlide, nextSlide, togglePlayPause, toggleFullscreen, fullscreenEnabled]);

  // Handle item actions
  const handleItemAction = useCallback((action: string, item: CarouselItem) => {
    switch (action) {
      case 'download':
        if (item.src) {
          const link = document.createElement('a');
          link.href = item.src;
          link.download = item.title || 'download';
          link.click();
        }
        break;
      case 'share':
        if (navigator.share) {
          navigator.share({
            title: item.title,
            text: item.description,
            url: item.src
          });
        }
        break;
    }
  }, []);

  if (items.length === 0) {
    return (
      <div className={cn("flex items-center justify-center bg-slate-100 rounded-2xl", className)}>
        <div className="text-center p-8">
          <Eye className="h-12 w-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600">No items to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={carouselRef}
      className={cn(
        "relative group miami-glass rounded-2xl overflow-hidden miami-card-glow",
        isFullscreen && "fixed inset-0 z-50 rounded-none",
        className
      )}
      tabIndex={0}
    >
      {/* Main Carousel Container */}
      <div className={cn("relative", aspectRatioClasses[aspectRatio])}>
        <motion.div
          className="flex h-full"
          style={{
            x: -currentIndex * 100 + (dragOffset / (carouselRef.current?.offsetWidth || 1)) * 100 + '%'
          }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragStart={handleDragStart}
          onDrag={handleDrag}
          onDragEnd={handleDragEnd}
          animate={{ x: `-${currentIndex * 100}%` }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          {items.map((item, index) => (
            <motion.div
              key={item.id}
              className="flex-shrink-0 w-full h-full relative cursor-pointer"
              onClick={() => onItemClick?.(item, index)}
              whileHover={{ scale: isDragging ? 1 : 1.02 }}
              transition={{ duration: 0.2 }}
            >
              {item.type === 'image' ? (
                <img
                  src={item.src}
                  alt={item.alt || item.title || `Slide ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading={index === currentIndex ? 'eager' : 'lazy'}
                />
              ) : item.type === 'video' ? (
                <video
                  src={item.src}
                  className="w-full h-full object-cover"
                  controls={false}
                  muted
                  loop
                  playsInline
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                  <div className="text-center p-8">
                    <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                    <p className="text-slate-600">{item.description}</p>
                  </div>
                </div>
              )}

              {/* Overlay with metadata */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                  {item.description && (
                    <p className="text-sm opacity-90 mb-4">{item.description}</p>
                  )}
                  
                  {/* Metadata badges */}
                  {item.metadata && (
                    <div className="flex flex-wrap gap-2">
                      {item.metadata.duration && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          {item.metadata.duration}
                        </Badge>
                      )}
                      {item.metadata.likes && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Heart className="h-3 w-3 mr-1" />
                          {item.metadata.likes}
                        </Badge>
                      )}
                      {item.metadata.views && (
                        <Badge variant="secondary" className="bg-white/20 text-white border-white/30">
                          <Eye className="h-3 w-3 mr-1" />
                          {item.metadata.views}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Navigation Controls */}
        {showControls && items.length > 1 && (
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={prevSlide}
              disabled={!loop && currentIndex === 0}
              className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={nextSlide}
              disabled={!loop && currentIndex === items.length - 1}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/20 hover:bg-white/30 text-white border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </>
        )}

        {/* Play/Pause Button */}
        {autoplay && (
          <Button
            variant="ghost"
            size="sm"
            onClick={togglePlayPause}
            className="absolute top-4 left-4 bg-white/20 hover:bg-white/30 text-white border-white/30"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
        )}

        {/* Action Buttons */}
        <div className="absolute top-4 right-4 flex gap-2">
          {downloadEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleItemAction('download', items[currentIndex])}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
          
          {socialEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleItemAction('share', items[currentIndex])}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          )}
          
          {fullscreenEnabled && (
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleFullscreen}
              className="bg-white/20 hover:bg-white/30 text-white border-white/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Indicators */}
      {showIndicators && items.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => goToSlide(index)}
              className={cn(
                "w-2 h-2 rounded-full transition-all duration-300",
                index === currentIndex
                  ? "bg-white scale-125"
                  : "bg-white/50 hover:bg-white/75"
              )}
            />
          ))}
        </div>
      )}

      {/* Thumbnails */}
      {showThumbnails && items.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4">
          <div className="flex gap-2 justify-center overflow-x-auto pb-2">
            {items.map((item, index) => (
              <button
                key={item.id}
                onClick={() => goToSlide(index)}
                className={cn(
                  "flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all duration-300",
                  index === currentIndex
                    ? "border-white scale-110"
                    : "border-white/50 hover:border-white/75"
                )}
              >
                <img
                  src={item.src}
                  alt={item.title || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Slide Counter */}
      <div className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-1 text-white text-sm">
        {currentIndex + 1} / {items.length}
      </div>
    </div>
  );
}
