import React, { useEffect, useState } from 'react';

interface LiveRegionProps {
  message: string;
  politeness?: 'polite' | 'assertive' | 'off';
  className?: string;
}

export default function LiveRegion({ 
  message, 
  politeness = 'polite',
  className = ''
}: LiveRegionProps) {
  const [currentMessage, setCurrentMessage] = useState('');
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (message && message !== currentMessage) {
      setCurrentMessage(message);
      setKey(prev => prev + 1);
    }
  }, [message, currentMessage]);

  if (politeness === 'off') {
    return null;
  }

  return (
    <div
      key={key}
      className={`sr-only ${className}`}
      role="status"
      aria-live={politeness}
      aria-atomic="true"
    >
      {currentMessage}
    </div>
  );
}

// Hook for managing live regions
export function useLiveRegion(politeness: 'polite' | 'assertive' = 'polite') {
  const [message, setMessage] = useState('');
  const [key, setKey] = useState(0);

  const announce = (newMessage: string) => {
    if (newMessage !== message) {
      setMessage(newMessage);
      setKey(prev => prev + 1);
    }
  };

  const clear = () => {
    setMessage('');
  };

  return {
    message,
    key,
    announce,
    clear,
    LiveRegion: () => (
      <LiveRegion message={message} politeness={politeness} />
    )
  };
}

// Pre-configured live regions for common use cases
export const StatusAnnouncer = ({ message }: { message: string }) => (
  <LiveRegion message={message} politeness="polite" />
);

export const AlertAnnouncer = ({ message }: { message: string }) => (
  <LiveRegion message={message} politeness="assertive" />
);

export const LoadingAnnouncer = ({ isLoading }: { isLoading: boolean }) => (
  <LiveRegion 
    message={isLoading ? 'Loading content' : 'Content loaded'} 
    politeness="polite" 
  />
);

export const ErrorAnnouncer = ({ error }: { error: string | null }) => (
  <LiveRegion 
    message={error || ''} 
    politeness="assertive" 
  />
);
