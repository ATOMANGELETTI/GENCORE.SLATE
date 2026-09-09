import { slateViteConfig } from '@slate/config-vite';
import { defineConfig } from 'vite';

// Port 1421 is reserved for Terminal; each application needs its own so two
// can run side by side during development.
export default defineConfig(slateViteConfig({ port: 1421, entries: ['tray.html'] }));
