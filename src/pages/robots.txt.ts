import type { APIRoute } from "astro";

export const GET: APIRoute = ({ site }) => {
  const origin = site?.toString() ?? "https://geo-aeo-experiments.netlify.app";
  const sitemap = new URL("/sitemap.xml", origin).href;
  const body = `User-agent: *\nAllow: /\n\nSitemap: ${sitemap}`;
  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};
