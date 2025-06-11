import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* PWA primary color */}
        <meta name="theme-color" content="#CEFF00" />
        
        {/* PWA compatibility */}
        <meta name="application-name" content="GDY UP" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="GDY UP" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* Control iOS behavior */}
        <meta name="apple-touch-fullscreen" content="yes" />
        
        {/* Viewport setup for better mobile handling */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        
        {/* Icons for PWA */}
        <link
          rel="apple-touch-icon"
          sizes="152x152"
          href="/icons/gdyup-icon-192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/icons/gdyup-icon-192.png"
        />
        <link
          rel="apple-touch-icon"
          sizes="167x167"
          href="/icons/gdyup-icon-192.png"
        />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icons/gdyup-icon-512.png" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
} 