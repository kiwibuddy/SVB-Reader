import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every web page during static rendering.
 * The contents of this function only run in Node.js environments and do not have access to the DOM or browser APIs.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        
        {/* SEO Meta Tags */}
        <title>SourceView Together - Group Bible Reading App</title>
        <meta name="description" content="Transform your Bible study with friends! Join up to 4 people for interactive group Bible reading using our unique speech bubble format. Features role-based reading, real-time emoji reactions, reading plans, challenges, and progress tracking. Perfect for small groups, families, and Bible study communities." />
        <meta name="keywords" content="bible, bible study, bible reading, group bible study, christian app, scripture, bible app, reading plans, sourceview together, group reading, family bible study, small group" />
        <meta name="author" content="SourceView Together" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="SourceView Together - Group Bible Reading App" />
        <meta property="og:description" content="Transform your Bible study with friends! Join up to 4 people for interactive group Bible reading using our unique speech bubble format." />
        <meta property="og:site_name" content="SourceView Together" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="SourceView Together - Group Bible Reading App" />
        <meta name="twitter:description" content="Transform your Bible study with friends! Join up to 4 people for interactive group Bible reading." />
        
        {/* Apple App Store Meta Tags - Helps with App Store indexing */}
        <meta name="apple-itunes-app" content="app-id=YOUR_APP_STORE_ID" />
        <meta name="apple-mobile-web-app-title" content="SourceView Together" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        
        {/* Canonical URL - Update with your actual website URL if you have one */}
        {/* <link rel="canonical" href="https://yourwebsite.com" /> */}
        
        {/* App Links for Deep Linking */}
        <meta property="al:ios:app_name" content="SourceView Together" />
        <meta property="al:ios:app_store_id" content="YOUR_APP_STORE_ID" />
        <meta property="al:ios:url" content="myapp://" />
        <meta property="al:android:app_name" content="SourceView Together" />
        <meta property="al:android:package" content="com.sourceview.together" />
        <meta property="al:android:url" content="myapp://" />

        {/*
          Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        {/* Using raw CSS styles as an escape-hatch to ensure the background color never flickers in dark-mode. */}
        <style dangerouslySetInnerHTML={{ __html: responsiveBackground }} />
        {/* Add any additional <head> elements that you want globally available on web... */}
      </head>
      <body>{children}</body>
    </html>
  );
}

const responsiveBackground = `
body {
  background-color: #fff;
}
@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}`;
