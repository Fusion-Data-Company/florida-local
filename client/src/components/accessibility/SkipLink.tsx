import React from 'react';
import { motion } from 'framer-motion';

interface SkipLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

export default function SkipLink({ href, children, className = '' }: SkipLinkProps) {
  return (
    <motion.a
      href={href}
      className={`
        sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 
        z-50 px-4 py-2 bg-primary text-white rounded-lg font-medium
        focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
        transition-all duration-200
        ${className}
      `}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 0, y: -10 }}
      whileFocus={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {children}
    </motion.a>
  );
}

// Pre-configured skip links for common sections
export const SkipToMain = () => (
  <SkipLink href="#main-content">Skip to main content</SkipLink>
);

export const SkipToNavigation = () => (
  <SkipLink href="#main-navigation">Skip to navigation</SkipLink>
);

export const SkipToSearch = () => (
  <SkipLink href="#search">Skip to search</SkipLink>
);

export const SkipToFooter = () => (
  <SkipLink href="#footer">Skip to footer</SkipLink>
);
