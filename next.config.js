/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  i18n: {
    /**
     * Provide the locales you want to support in your application
     */
    locales: ["en", "es"],
    /**
     * This is the default locale you want to be used when visiting
     * a non-locale prefixed path.
     */
    defaultLocale: "es",
  },
};

module.exports = nextConfig;
