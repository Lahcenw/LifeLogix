// telling Next.js to inject a header into the pages that allows connections to the backend's specific address
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "connect-src 'self' http://localhost:5000;",
          },
        ],
      },
    ];
  },
};