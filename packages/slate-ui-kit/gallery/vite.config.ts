import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `new URL(...).pathname` yields "/C:/..." on Windows, which then resolves to
// "C:\C:\...". fileURLToPath is the only correct conversion.
const packageRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * The gallery is an ordinary browser page, not a Tauri window — which is
 * exactly the point. If a component needs the desktop to render, it belongs in
 * an application rather than in the shared kit.
 */
export default defineConfig({
	root: packageRoot,
	plugins: [react(), tailwindcss()],
	server: { port: 1430, strictPort: true, open: '/gallery/' },
});
