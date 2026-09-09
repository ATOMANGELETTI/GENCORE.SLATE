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
export { ContextMenu } from './context-menu/context-menu.component.tsx';
export {
	AboutDialog,
	Dialog,
	dialogContentVariants,
	dialogOverlayVariants,
} from './dialog/index.ts';
export { cn } from './lib/cn.util.ts';
export {
	isSeparator,
	type MenuEntry,
	type MenuItemDescriptor,
	type MenuItemTone,
	type MenuSeparatorDescriptor,
} from './menu/menu.types.ts';
export {
	type MenuItemVariants,
	menuItemVariants,
	menuSurfaceVariants,
} from './menu/menu.variants.ts';
export { MenuHeader } from './menu/menu-header.component.tsx';
export { MenuItem } from './menu/menu-item.component.tsx';
export { MenuSeparator } from './menu/menu-separator.component.tsx';
export { MenuShortcut } from './menu/menu-shortcut.component.tsx';
export { MenuSurface } from './menu/menu-surface.component.tsx';
export { StatusBar, StatusItem } from './status-bar/status-bar.component.tsx';
export { TitleBar } from './title-bar/title-bar.component.tsx';
export { TrafficLights } from './title-bar/traffic-lights.component.tsx';
