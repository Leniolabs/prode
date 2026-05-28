import Head from "next/head";
import React from "react";
import { useLocalizedText } from "../../../locale";
import { ANALYTICS_MEASUREMENT_ID } from "@/config/settings";

interface MetaProps {
  title?: string;
  description?: string;
  image?: string;
}

export function Meta(props: React.PropsWithChildren<MetaProps>) {
  const i18n = useLocalizedText();

  const title = React.useMemo(() => {
    return props.title || i18n.metaTitle;
  }, [props.title]);

  const description = React.useMemo(() => {
    return props.description || i18n.metaDescription;
  }, [props.description]);

  const image = React.useMemo(() => {
    return props.image || "https://prode.leniolabs.com/meta.jpg";
  }, [props.image]);

  return (
    <Head key="my-head">
      <title>{title}</title>
      <meta property="og:title" content={title} key="title" />
      <link rel="icon" href="/favicon.png" />

      <meta name="canonical" content={i18n.metaCanonical} />

      <meta name="description" content={description} />
      <meta name="author" content={"Leniolabs_ LLC"} />

      <meta name="og:type" content="website" />
      <meta name="og:url" content={i18n.metaCanonical} />
      <meta name="og:title" content={title} />
      <meta name="og:description" content={description} />
      <meta name="og:image" content={image} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={i18n.metaCanonical} />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:creator" content={"Leniolabs_ LLC"} />

      <script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_MEASUREMENT_ID}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${ANALYTICS_MEASUREMENT_ID}');
          `,
        }}
      />
      {props.children}
    </Head>
  );
}
