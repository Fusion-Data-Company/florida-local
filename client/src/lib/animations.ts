import { Variants, Transition } from 'framer-motion';

// Base animation configurations
export const springConfig: Transition = {
  type: 'spring',
  stiffness: 300,
  damping: 30,
  mass: 0.8
};

export const smoothConfig: Transition = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1]
};

export const bouncyConfig: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 25,
  mass: 0.8
};

export const elasticConfig: Transition = {
  type: 'spring',
  stiffness: 200,
  damping: 20,
  mass: 1
};

// Page transition animations
export const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1
  },
  out: {
    opacity: 0,
    y: -20,
    scale: 1.02
  }
};

export const pageTransition: Transition = {
  type: 'tween',
  ease: 'anticipate',
  duration: 0.4
};

// Stagger animations for lists
export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  initial: {
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: smoothConfig
  }
};

// Card animations
export const cardVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    rotateX: -15
  },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    transition: springConfig
  },
  hover: {
    y: -8,
    scale: 1.02,
    rotateX: 5,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
};

// Modal animations
export const modalVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    y: 50
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    y: 50,
    transition: smoothConfig
  }
};

export const modalBackdropVariants: Variants = {
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: smoothConfig
  },
  exit: {
    opacity: 0,
    transition: smoothConfig
  }
};

// Button animations
export const buttonVariants: Variants = {
  initial: {
    scale: 1
  },
  hover: {
    scale: 1.05,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

// Loading animations
export const loadingVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.2
    }
  }
};

export const spinnerVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'linear'
    }
  }
};

// Text animations
export const textVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

export const titleVariants: Variants = {
  initial: {
    opacity: 0,
    y: 30,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springConfig
  }
};

// Slide animations
export const slideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    y: -50,
    transition: smoothConfig
  }
};

export const slideDownVariants: Variants = {
  initial: {
    opacity: 0,
    y: -50
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    y: 50,
    transition: smoothConfig
  }
};

export const slideLeftVariants: Variants = {
  initial: {
    opacity: 0,
    x: 50
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    x: -50,
    transition: smoothConfig
  }
};

export const slideRightVariants: Variants = {
  initial: {
    opacity: 0,
    x: -50
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    x: 50,
    transition: smoothConfig
  }
};

// Scale animations
export const scaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    transition: smoothConfig
  }
};

export const scaleInVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: elasticConfig
  },
  exit: {
    opacity: 0,
    scale: 0,
    transition: smoothConfig
  }
};

// Rotation animations
export const rotateVariants: Variants = {
  initial: {
    opacity: 0,
    rotate: -180,
    scale: 0.8
  },
  animate: {
    opacity: 1,
    rotate: 0,
    scale: 1,
    transition: springConfig
  },
  exit: {
    opacity: 0,
    rotate: 180,
    scale: 0.8,
    transition: smoothConfig
  }
};

// Floating animations
export const floatVariants: Variants = {
  animate: {
    y: [-10, 10, -10],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const floatSlowVariants: Variants = {
  animate: {
    y: [-5, 5, -5],
    transition: {
      duration: 4,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Pulse animations
export const pulseVariants: Variants = {
  animate: {
    scale: [1, 1.05, 1],
    opacity: [0.8, 1, 0.8],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

export const heartbeatVariants: Variants = {
  animate: {
    scale: [1, 1.2, 1],
    transition: {
      duration: 1,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Shake animations
export const shakeVariants: Variants = {
  animate: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.5,
      ease: 'easeInOut'
    }
  }
};

// Bounce animations
export const bounceVariants: Variants = {
  animate: {
    y: [0, -20, 0],
    transition: {
      duration: 0.6,
      ease: 'easeOut'
    }
  }
};

// Wobble animations
export const wobbleVariants: Variants = {
  animate: {
    rotate: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.8,
      ease: 'easeInOut'
    }
  }
};

// Flip animations
export const flipVariants: Variants = {
  initial: {
    rotateY: -90,
    opacity: 0
  },
  animate: {
    rotateY: 0,
    opacity: 1,
    transition: springConfig
  },
  exit: {
    rotateY: 90,
    opacity: 0,
    transition: smoothConfig
  }
};

// Glow animations
export const glowVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(59, 130, 246, 0.3)',
      '0 0 40px rgba(59, 130, 246, 0.6)',
      '0 0 20px rgba(59, 130, 246, 0.3)'
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Morphing animations
export const morphVariants: Variants = {
  initial: {
    borderRadius: '50%',
    scale: 0
  },
  animate: {
    borderRadius: ['50%', '20%', '50%'],
    scale: [0, 1, 1.1, 1],
    transition: {
      duration: 1.5,
      ease: 'easeInOut'
    }
  }
};

// Complex orchestrated animations
export const revealVariants: Variants = {
  initial: {
    opacity: 0,
    y: 50,
    rotateX: -15,
    scale: 0.9
  },
  animate: {
    opacity: 1,
    y: 0,
    rotateX: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      staggerChildren: 0.1
    }
  }
};

export const revealItemVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: springConfig
  }
};

// Magic MCP specific animations
export const magicEntranceVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.8,
    rotateZ: -10,
    y: 30
  },
  animate: {
    opacity: 1,
    scale: 1,
    rotateZ: 0,
    y: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 25,
      mass: 0.8
    }
  }
};

export const magicHoverVariants: Variants = {
  hover: {
    scale: 1.05,
    rotateZ: 2,
    y: -5,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  tap: {
    scale: 0.95,
    transition: {
      duration: 0.1
    }
  }
};

export const magicGlowVariants: Variants = {
  animate: {
    boxShadow: [
      '0 0 20px rgba(25, 182, 246, 0.3)',
      '0 0 40px rgba(25, 182, 246, 0.6)',
      '0 0 60px rgba(25, 182, 246, 0.8)',
      '0 0 40px rgba(25, 182, 246, 0.6)',
      '0 0 20px rgba(25, 182, 246, 0.3)'
    ],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
};

// Utility functions for custom animations
export const createStaggerAnimation = (staggerDelay: number = 0.1): Variants => ({
  animate: {
    transition: {
      staggerChildren: staggerDelay
    }
  }
});

export const createDelayAnimation = (delay: number = 0): Variants => ({
  initial: {
    opacity: 0
  },
  animate: {
    opacity: 1,
    transition: {
      delay,
      duration: 0.3
    }
  }
});

export const createCustomSpring = (stiffness: number, damping: number): Transition => ({
  type: 'spring',
  stiffness,
  damping
});

// Animation presets for common use cases
export const animationPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: smoothConfig
  },
  slideInFromBottom: slideUpVariants,
  slideInFromTop: slideDownVariants,
  slideInFromLeft: slideRightVariants,
  slideInFromRight: slideLeftVariants,
  scaleIn: scaleVariants,
  rotateIn: rotateVariants,
  flipIn: flipVariants,
  bounceIn: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: bouncyConfig
  },
  elasticIn: {
    initial: { scale: 0 },
    animate: { scale: 1 },
    transition: elasticConfig
  }
};
