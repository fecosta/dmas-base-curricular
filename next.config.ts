import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Privacy Notice and Terms surfaces render the authoritative repository
  // documents at request time rather than a forked copy, so those two files
  // must travel with the serverless bundle. Tracing cannot infer them: the read
  // path is composed at runtime.
  outputFileTracingIncludes: {
    "/app/privacidad/aviso": ["./docs/PRIVACY_NOTICE.md"],
    "/app/privacidad/terminos": ["./docs/TERMS_OF_USE.md"],
  },
  async headers() {
    return [{ source: "/:path*", headers: [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "no-referrer" },
      { key: "X-Frame-Options", value: "DENY" },
    ] }];
  },
};

export default nextConfig;
