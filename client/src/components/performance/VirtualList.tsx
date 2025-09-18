import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
  onScroll?: (scrollTop: number) => void;
  onItemVisible?: (item: T, index: number) => void;
  onItemInvisible?: (item: T, index: number) => void;
}

export default function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  className,
  overscan = 5,
  onScroll,
  onItemVisible,
  onItemInvisible
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length - 1
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange]);

  // Calculate total height
  const totalHeight = items.length * itemHeight;

  // Calculate offset for visible items
  const offsetY = visibleRange.startIndex * itemHeight;

  // Handle scroll
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    onScroll?.(newScrollTop);
  }, [onScroll]);

  // Intersection Observer for item visibility
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const index = parseInt(entry.target.getAttribute('data-index') || '0');
          const item = items[index];
          
          if (entry.isIntersecting) {
            onItemVisible?.(item, index);
          } else {
            onItemInvisible?.(item, index);
          }
        });
      },
      {
        root: containerRef.current,
        rootMargin: '50px',
        threshold: 0.1
      }
    );

    // Observe all currently rendered items
    itemRefs.current.forEach((element) => {
      observer.observe(element);
    });

    return () => {
      observer.disconnect();
    };
  }, [visibleItems, items, onItemVisible, onItemInvisible]);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height spacer */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          <AnimatePresence>
            {visibleItems.map((item, index) => {
              const actualIndex = visibleRange.startIndex + index;
              
              return (
                <motion.div
                  key={actualIndex}
                  ref={(el) => {
                    if (el) {
                      itemRefs.current.set(actualIndex, el);
                    } else {
                      itemRefs.current.delete(actualIndex);
                    }
                  }}
                  data-index={actualIndex}
                  style={{ height: itemHeight }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.2, delay: index * 0.02 }}
                  className="flex items-center"
                >
                  {renderItem(item, actualIndex)}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// Specialized virtual list components
export const VirtualBusinessList: React.FC<{
  businesses: Array<{
    id: string;
    name: string;
    description: string;
    image?: string;
    rating?: number;
  }>;
  onBusinessClick?: (business: any) => void;
  className?: string;
}> = ({ businesses, onBusinessClick, className }) => {
  const renderBusiness = useCallback((business: any, index: number) => (
    <motion.div
      className="w-full p-4 hover:bg-white/50 transition-colors duration-200 cursor-pointer"
      onClick={() => onBusinessClick?.(business)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
          {business.image ? (
            <img
              src={business.image}
              alt={business.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-lg font-bold text-primary">
              {business.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {business.name}
          </h3>
          <p className="text-sm text-slate-600 truncate">
            {business.description}
          </p>
        </div>
        {business.rating && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <span>★</span>
            <span>{business.rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  ), [onBusinessClick]);

  return (
    <VirtualList
      items={businesses}
      itemHeight={80}
      containerHeight={600}
      renderItem={renderBusiness}
      className={className}
    />
  );
};

export const VirtualProductList: React.FC<{
  products: Array<{
    id: string;
    name: string;
    price: number;
    image?: string;
    rating?: number;
  }>;
  onProductClick?: (product: any) => void;
  className?: string;
}> = ({ products, onProductClick, className }) => {
  const renderProduct = useCallback((product: any, index: number) => (
    <motion.div
      className="w-full p-4 hover:bg-white/50 transition-colors duration-200 cursor-pointer"
      onClick={() => onProductClick?.(product)}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 bg-gradient-to-br from-primary/20 to-accent/20 rounded-lg flex items-center justify-center">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <span className="text-lg font-bold text-primary">
              {product.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-slate-900 truncate">
            {product.name}
          </h3>
          <p className="text-lg font-bold text-primary">
            ${product.price.toFixed(2)}
          </p>
        </div>
        {product.rating && (
          <div className="flex items-center gap-1 text-sm text-yellow-600">
            <span>★</span>
            <span>{product.rating}</span>
          </div>
        )}
      </div>
    </motion.div>
  ), [onProductClick]);

  return (
    <VirtualList
      items={products}
      itemHeight={100}
      containerHeight={600}
      renderItem={renderProduct}
      className={className}
    />
  );
};

// Infinite scroll virtual list
export const InfiniteVirtualList: React.FC<{
  items: any[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  hasMore: boolean;
  isLoading: boolean;
  onLoadMore: () => void;
  className?: string;
}> = ({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  hasMore,
  isLoading,
  onLoadMore,
  className
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback((newScrollTop: number) => {
    setScrollTop(newScrollTop);
    
    // Load more when near bottom
    const scrollPercentage = (newScrollTop + containerHeight) / (items.length * itemHeight);
    if (scrollPercentage > 0.8 && hasMore && !isLoading) {
      onLoadMore();
    }
  }, [containerHeight, items.length, itemHeight, hasMore, isLoading, onLoadMore]);

  return (
    <div className={className}>
      <VirtualList
        items={items}
        itemHeight={itemHeight}
        containerHeight={containerHeight}
        renderItem={renderItem}
        onScroll={handleScroll}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="flex justify-center p-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      
      {/* End of list indicator */}
      {!hasMore && items.length > 0 && (
        <div className="text-center p-4 text-slate-500">
          <p>You've reached the end of the list</p>
        </div>
      )}
    </div>
  );
};
