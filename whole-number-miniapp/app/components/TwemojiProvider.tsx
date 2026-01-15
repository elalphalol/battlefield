'use client';

import { useEffect } from 'react';
import twemoji from 'twemoji';

interface TwemojiProviderProps {
  children: React.ReactNode;
}

export function TwemojiProvider({ children }: TwemojiProviderProps) {
  useEffect(() => {
    // Parse emojis on initial load
    twemoji.parse(document.body, {
      folder: 'svg',
      ext: '.svg',
      base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
    });

    // Set up a MutationObserver to parse new content
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              twemoji.parse(node as HTMLElement, {
                folder: 'svg',
                ext: '.svg',
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/',
              });
            }
          });
        }
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, []);

  return <>{children}</>;
}
