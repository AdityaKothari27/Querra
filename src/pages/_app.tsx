import '../styles/globals.css';
import { AppProps } from 'next/app';
import { ToastProvider } from '../components/Toast';
import { SessionProvider } from '../contexts/SessionContext';

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <SessionProvider>
      <ToastProvider>
        <Component {...pageProps} />
      </ToastProvider>
    </SessionProvider>
  );
}

export default MyApp; 