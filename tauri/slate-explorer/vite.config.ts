import { slateViteConfig } from '@slate/config-vite';
import { defineConfig } from 'vite';

// Port 1422 is reserved for Explorer; each application needs its own so two
// can run side by side during development.
export default defineConfig(slateViteConfig({ port: 1422, entries: ['tray.html'] }));
