import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import fs from "fs";

// Testa se os arquivos PEM existem
const hasHttps = fs.existsSync("./localhost-key.pem") && fs.existsSync("./localhost.pem");

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === "development" && {
      name: "inject-chef-dev",
      transform(code: string, id: string) {
        if (id.includes("main.tsx")) {
          return {
            code: `${code}
/* Added by Vite plugin inject-chef-dev */
window.addEventListener('message', async (message) => {
  if (message.source !== window.parent) return;
  if (message.data.type !== 'chefPreviewRequest') return;
  const worker = await import('https://chef.convex.dev/scripts/worker.bundled.mjs');
  await worker.respondToMessage(message);
});
          `,
            map: null,
          };
        }
        return null;
      },
    },
  ].filter(Boolean),
  server: {
    port: 5173,
    host: true,
     allowedHosts: ["my-books-my-loves.onrender.com"],
    ...(mode === "development" && hasHttps
      ? {
          https: {
            key: fs.readFileSync("./localhost-key.pem"),
            cert: fs.readFileSync("./localhost.pem"),
          },
        }
      : {}),
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
