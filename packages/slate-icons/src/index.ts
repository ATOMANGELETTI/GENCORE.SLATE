/**
 * `@slate/icons` — the suite's icon set.
 *
 * A curated re-export rather than a pass-through of the whole Lucide library.
 * Two reasons, both practical:
 *
 * 1. Importing from one place means a later switch of icon library touches
 *    this file instead of every component.
 * 2. A named set keeps the visual language coherent. When three applications
 *    each pick their own "settings" icon, the suite stops looking like one
 *    product.
 *
 * Add an icon here before using it. Icons inherit `currentColor` and are sized
 * by the component that renders them, never by a hard-coded `size` prop.
 */

export type { LucideIcon as SlateIcon } from 'lucide-react';
export {
	AppWindow as WindowIcon,
	ChevronDown as ChevronDownIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	Circle as CircleIcon,
	Copy as CopyIcon,
	FileText as FileIcon,
	Folder as FolderIcon,
	FolderOpen as FolderOpenIcon,
	Grid2x2 as GridIcon,
	Info as InfoIcon,
	LayoutGrid as LayoutIcon,
	Moon as MoonIcon,
	Package as PackageIcon,
	Play as PlayIcon,
	Plus as PlusIcon,
	RefreshCw as RefreshIcon,
	Search as SearchIcon,
	Settings as SettingsIcon,
	Square as SquareIcon,
	SquareTerminal as TerminalIcon,
	Sun as SunIcon,
	TriangleAlert as WarningIcon,
	X as CloseIcon,
} from 'lucide-react';
