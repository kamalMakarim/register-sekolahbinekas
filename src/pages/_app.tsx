import type { AppProps } from 'next/app'
import Head from 'next/head'
// @ts-ignore
import '../styles/global.css'

export default function MyApp({ Component, pageProps }: AppProps) {

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.png" type="image/png" />
        <title>Sekolah Bhinekas</title>
        <meta name="description" content="Parent dashboard and registration system for Sekolah Bhinekas" />
      </Head>
      <Component {...pageProps} />
    </>
  );

}
