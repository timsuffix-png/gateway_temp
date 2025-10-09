/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  assetPrefix: './',      // ✅ ให้ไฟล์ _next ใช้ path relative
  trailingSlash: true,    // ✅ ให้ทุกเพจเป็น index.html
};

module.exports = nextConfig;
