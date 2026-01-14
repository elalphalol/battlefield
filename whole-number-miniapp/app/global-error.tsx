'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '1rem',
          backgroundColor: '#0a0a0a',
          color: '#fff',
          fontFamily: 'system-ui, sans-serif',
        }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Something went wrong!</h2>
          <p style={{ color: '#888', marginBottom: '1rem' }}>{error.message}</p>
          <button
            onClick={reset}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#f7931a',
              color: '#000',
              border: 'none',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
