import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
 

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// https://vite.dev/config/
export default defineConfig(({mode}) => {
  const env = loadEnv(mode, process.cwd());
  return {
    plugins: [react(), tailwindcss()],
    base:"./", // 👈 CRITICAL for static hosting like Render, change if deploying to a subdirectory
    resolve: {
      alias:{
        "@": resolve(__dirname, "./src"),
      },
    },
    server:{
      proxy: {
      // String shorthand for simple cases
      '/api': {
        target: 'http://localhost:5000', // Your backend port
        changeOrigin: true,
        secure: false,
      }
    },
      host: "0.0.0.0", // allows access from any device on LAN
      port: parseInt(env.VITE_PORT) || 5173,
    },
  }
 
});
