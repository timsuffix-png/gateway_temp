/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === "production";

const nextConfig = {
  reactStrictMode: true,
  ...(isProd
    ? {
        // ใช้ตอน build exe
        output: "export",
        assetPrefix: "./",
        trailingSlash: true,
      }
    : {
        // ใช้ตอน dev
        async headers() {
          return [
            {
              source: "/(.*)",
              headers: [
                {
                  key: "Content-Security-Policy",
                  value:
                    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:;",
                },
              ],
            },
          ];
        },
      }),
};

module.exports = nextConfig;
