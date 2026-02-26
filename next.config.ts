import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Produces a minimal standalone build for Docker
	output: "standalone",

	async headers() {
		return [
			{
				source: "/(.*)",
				headers: [
					{ key: "X-Content-Type-Options", value: "nosniff" },
					{ key: "X-Frame-Options", value: "DENY" },
				],
			},
		];
	},
};

export default nextConfig;
