import type { AppProps } from 'next/app';

// NOTE: import path includes "src" because your css is at src/styles/globals.css
import '../src/styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
