import { slateViteConfig } from '@slate/config-vite';
import { defineConfig } from 'vite';

// Port {{ port }} is reserved for {{ title }}; each application needs its own so two
// can run side by side during development.
export default defineConfig(slateViteConfig({ port: {{ port }} }));
