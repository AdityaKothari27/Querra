import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" href="/images/Querralogo.png" />
        <meta name="application-name" content="Querra" />
        <meta name="apple-mobile-web-app-title" content="Querra" />
      </Head>
      <body>
        {/* Script to prevent dark mode flash */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var mode = localStorage.getItem('theme');
                if (mode === 'dark' || (!mode && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            })();
          `
        }} />
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 