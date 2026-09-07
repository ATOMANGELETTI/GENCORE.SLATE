import { slateViteConfig } from '@slate/config-vite';
import { defineConfig } from 'vite';

// Port 1420 is reserved for Launcher; each application needs its own so two
// can run side by side during development.
export default defineConfig(slateViteConfig({ port: 1420 }));
