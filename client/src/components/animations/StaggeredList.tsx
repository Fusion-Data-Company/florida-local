import React from 'react';
import { motion } from 'framer-motion';
import { staggerContainer, staggerItem } from '@/lib/animations';

interface StaggeredListProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  delayChildren?: number;
}

export default function StaggeredList({ 
  children, 
  className, 
  staggerDelay = 0.1,
  delayChildren = 0.1 
}: StaggeredListProps) {
  const customStaggerContainer = {
    initial: {},
    animate: {
      transition: {
        staggerChildren: staggerDelay,
        delayChildren
      }
    }
  };

  return (
    <motion.div
      className={className}
      variants={customStaggerContainer}
      initial="initial"
      animate="animate"
    >
      {React.Children.map(children, (child, index) => (
        <motion.div key={index} variants={staggerItem}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Specialized staggered components
export const StaggeredCards: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <StaggeredList className={className} staggerDelay={0.15}>
    {children}
  </StaggeredList>
);

export const StaggeredText: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <StaggeredList className={className} staggerDelay={0.05}>
    {children}
  </StaggeredList>
);

export const StaggeredButtons: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className 
}) => (
  <StaggeredList className={className} staggerDelay={0.1}>
    {children}
  </StaggeredList>
);
