/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async redirects() {
    return [
      { source: "/servicio-limpieza", destination: "https://asespro.com.uy/", permanent: true },
      { source: "/servicio-limpieza.html", destination: "https://asespro.com.uy/", permanent: true },
    ];
  },
};

export default nextConfig;

