import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { ToastProvider } from '@/context/ToastContext';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ToastProvider>
      <Component {...pageProps} />
    </ToastProvider>
  );
}

// =====================================
// apps/frontend/src/pages/index.tsx
// =====================================
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const router = useRouter();
  useEffect(() => { router.replace('/login'); }, [router]);
  return null;
}