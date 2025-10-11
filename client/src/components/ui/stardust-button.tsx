export const StardustButton = ({ 
  children = "Get Started", 
  onClick, 
  className = "",
  variant = "teal",
  size = "default",
  as = "button",
  href,
  ...props 
}: {
  children?: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "teal" | "gold";
  size?: "default" | "lg";
  as?: "button" | "a";
  href?: string;
  [key: string]: any;
}) => {
  const Component = as === "a" ? "a" : "button";
  
  // Color schemes based on Florida Local palette
  const colors = {
    teal: {
      bg: '#0a1929',
      textColor: 'rgba(0, 216, 216, 0.9)', // Teal variant
      glowBefore: 'rgba(0, 180, 180, 0.15)',
      glowAfter1: 'rgba(0, 216, 216, 0.6)',
      glowAfter2: 'rgba(0, 180, 180, 0.25)',
      maskGradient: 'linear-gradient(to bottom, rgba(0, 216, 216, 1) 40%, transparent)',
      hoverShadow1: 'rgba(0, 216, 216, 0.4)',
      hoverShadow2: 'rgba(0, 180, 180, 0.6)',
      activeShadow: 'rgba(0, 216, 216, 0.5)',
    },
    gold: {
      bg: '#1a1410',
      textColor: 'rgba(255, 200, 87, 0.9)', // Gold variant
      glowBefore: 'rgba(255, 180, 64, 0.15)',
      glowAfter1: 'rgba(255, 200, 87, 0.6)',
      glowAfter2: 'rgba(255, 180, 64, 0.25)',
      maskGradient: 'linear-gradient(to bottom, rgba(255, 200, 87, 1) 40%, transparent)',
      hoverShadow1: 'rgba(255, 200, 87, 0.4)',
      hoverShadow2: 'rgba(255, 180, 64, 0.6)',
      activeShadow: 'rgba(255, 200, 87, 0.5)',
    },
  };

  const colorScheme = colors[variant];
  const uniqueClass = `pearl-button-${variant}`;

  const buttonStyle = {
    '--bg': colorScheme.bg,
    '--radius': size === "lg" ? '100px' : '100px',
    outline: 'none',
    cursor: 'pointer',
    border: 0,
    position: 'relative' as const,
    borderRadius: 'var(--radius)',
    backgroundColor: 'var(--bg)',
    transition: 'all 0.2s ease',
    boxShadow: `
      inset 0 0.3rem 0.9rem rgba(255, 255, 255, 0.3),
      inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
      inset 0 -0.4rem 0.9rem rgba(255, 255, 255, 0.5),
      0 3rem 3rem rgba(0, 0, 0, 0.3),
      0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8)
    `,
  };

  const wrapStyle = {
    fontSize: size === "lg" ? '28px' : '20px',
    fontWeight: 500,
    color: colorScheme.textColor,
    padding: size === "lg" ? '28px 50px' : '20px 40px',
    borderRadius: 'inherit',
    position: 'relative' as const,
    overflow: 'hidden',
  };

  const pStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    margin: 0,
    transition: 'all 0.2s ease',
    transform: 'translateY(2%)',
    maskImage: colorScheme.maskGradient,
  };

  const beforeAfterStyles = `
    .${uniqueClass} .wrap::before,
    .${uniqueClass} .wrap::after {
      content: "";
      position: absolute;
      transition: all 0.3s ease;
    }
    
    .${uniqueClass} .wrap::before {
      left: -15%;
      right: -15%;
      bottom: 25%;
      top: -100%;
      border-radius: 50%;
      background-color: ${colorScheme.glowBefore};
    }
    
    .${uniqueClass} .wrap::after {
      left: 6%;
      right: 6%;
      top: 12%;
      bottom: 40%;
      border-radius: 22px 22px 0 0;
      box-shadow: inset 0 10px 8px -10px ${colorScheme.glowAfter1};
      background: linear-gradient(
        180deg,
        ${colorScheme.glowAfter2} 0%,
        rgba(0, 0, 0, 0) 50%,
        rgba(0, 0, 0, 0) 100%
      );
    }
    
    .${uniqueClass} .wrap p span:nth-child(2) {
      display: none;
    }
    
    .${uniqueClass}:hover .wrap p span:nth-child(1) {
      display: none;
    }
    
    .${uniqueClass}:hover .wrap p span:nth-child(2) {
      display: inline-block;
    }
    
    .${uniqueClass}:hover {
      box-shadow:
        inset 0 0.3rem 0.5rem ${colorScheme.hoverShadow1},
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.7),
        inset 0 -0.4rem 0.9rem ${colorScheme.hoverShadow2},
        0 3rem 3rem rgba(0, 0, 0, 0.3),
        0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
    }
    
    .${uniqueClass}:hover .wrap::before {
      transform: translateY(-5%);
    }
    
    .${uniqueClass}:hover .wrap::after {
      opacity: 0.4;
      transform: translateY(5%);
    }
    
    .${uniqueClass}:hover .wrap p {
      transform: translateY(-4%);
    }
    
    .${uniqueClass}:active {
      transform: translateY(4px);
      box-shadow:
        inset 0 0.3rem 0.5rem ${colorScheme.activeShadow},
        inset 0 -0.1rem 0.3rem rgba(0, 0, 0, 0.8),
        inset 0 -0.4rem 0.9rem ${colorScheme.hoverShadow2},
        0 3rem 3rem rgba(0, 0, 0, 0.3),
        0 1rem 1rem -0.6rem rgba(0, 0, 0, 0.8);
    }
  `;

  const componentProps = {
    className: `${uniqueClass} ${className}`,
    style: buttonStyle,
    onClick,
    ...(as === "a" && href ? { href } : {}),
    ...props,
  };

  return (
    <>
      <style>{beforeAfterStyles}</style>
      <Component {...componentProps} data-testid={props['data-testid'] || 'button-stardust'}>
        <div className="wrap" style={wrapStyle}>
          <p style={pStyle}>
            <span>✧</span>
            <span>✦</span>
            {children}
          </p>
        </div>
      </Component>
    </>
  );
};
