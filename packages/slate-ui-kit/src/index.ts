/**
 * `@slate/ui-kit` — every shared component in the suite.
 *
 * Applications compose from here rather than building their own primitives;
 * that is what makes three binaries look like one product. If something is
 * missing, add it here rather than in an application — see
 * `.agents/workflows/add-component.md`.
 *
 * This package intentionally has **no Tauri dependency**, so the whole kit
 * renders in an ordinary browser for the gallery. Anything that needs the
 * desktop belongs in `@slate/ipc`.
 */

export { AppShell } from './app-shell/app-shell.component.tsx';
export { Button } from './button/button.component.tsx';
export { type ButtonVariants, buttonVariants } from './button/button.variants.ts';
export { cn } from './lib/cn.util.ts';
export { StatusBar, StatusItem } from './status-bar/status-bar.component.tsx';
export { TitleBar } from './title-bar/title-bar.component.tsx';
export { TrafficLights } from './title-bar/traffic-lights.component.tsx';
