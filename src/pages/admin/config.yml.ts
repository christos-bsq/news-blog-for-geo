import type { APIRoute } from "astro";
import { readFileSync } from "fs";
import { join } from "path";

export const GET: APIRoute = () => {
  const configPath = join(process.cwd(), "public", "admin", "config.yml");
  const configContent = readFileSync(configPath, "utf-8");

  return new Response(configContent, {
    headers: {
      "Content-Type": "text/yaml; charset=utf-8",
    },
  });
};

