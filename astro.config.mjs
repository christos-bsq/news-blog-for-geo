import { defineConfig } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";

const isPreviewCommand =
  // The Netlify adapter does not implement `astro preview`, so skip it there.
  process.env.ASTRO_CLI_COMMAND === "preview" ||
  process.argv.some((arg) => arg.includes("preview"));

export default defineConfig({
  site: "https://geo-aeo-experiments.netlify.app",
  ...(isPreviewCommand ? {} : { adapter: netlify() }),
  output: "static",
  vite: {
    plugins: [tailwindcss()],
  },
  markdown: {
    drafts: true,
    shikiConfig: {
      theme: "css-variables",
    },
  },
  shikiConfig: {
    wrap: true,
    skipInline: false,
    drafts: true,
  },
  integrations: [sitemap(), mdx()],
});
