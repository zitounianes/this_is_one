/** @type {import('next').NextConfig} */
const nextConfig = {
  // تفعيل الملفات الستاتيكية من مجلد public (افتراضي، لكن للتأكيد)
  reactStrictMode: true,
  // السماح بـ Body Parser أكبر للصور base64 إذا لزم الأمر
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;
