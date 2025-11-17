import { defineConfig } from "astro/config";
import { fileURLToPath } from "node:url";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import netlify from "@astrojs/netlify";
import tailwind from "@astrojs/tailwind";

const isPreviewCommand =
  // The Netlify adapter does not implement `astro preview`, so skip it there.
  process.env.ASTRO_CLI_COMMAND === "preview" ||
  process.argv.some((arg) => arg.includes("preview"));

export default defineConfig({
  site: "https://signal-north-daily.netlify.app",
  ...(isPreviewCommand ? {} : { adapter: netlify() }),
  output: "static",
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
  integrations: [sitemap(), mdx(), tailwind()],
  vite: {
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json", ".astro"],
    },
  },
});
