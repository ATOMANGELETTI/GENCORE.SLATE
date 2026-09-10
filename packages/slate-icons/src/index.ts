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
 *
 * # Stroke width
 *
 * Lucide draws at a 2px stroke, which is correct at 24px and heavy at the 16px
 * the suite actually renders. Pass `strokeWidth={1.5}` at the call site where a
 * lighter line is wanted, rather than wrapping every icon here: the right
 * weight depends on the size it is rendered at, which is the calling
 * component's decision, not this file's.
 */

export type { LucideIcon as SlateIcon } from 'lucide-react';
export {
	AppWindow as WindowIcon,
	ArrowDown as ArrowDownIcon,
	ArrowDownToLine as UpdateIcon,
	ArrowUp as ArrowUpIcon,
	Check as CheckIcon,
	ChevronDown as ChevronDownIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	Circle as CircleIcon,
	CircleArrowUp as UpdateAvailableIcon,
	CircleHelp as HelpIcon,
	ClipboardPaste as PasteIcon,
	Clock as RecentIcon,
	CodeXml as CodeIcon,
	Copy as CopyIcon,
	Download as DownloadIcon,
	Eject as EjectIcon,
	EyeOff as HideIcon,
	FileText as FileIcon,
	Folder as FolderIcon,
	FolderOpen as FolderOpenIcon,
	Globe as GlobeIcon,
	Grid2x2 as GridIcon,
	HardDrive as DriveIcon,
	Image as ImageIcon,
	Info as InfoIcon,
	LayoutGrid as LayoutIcon,
	Lock as LockIcon,
	Maximize2 as ZoomIcon,
	Minimize2 as RestoreIcon,
	Minus as MinimiseIcon,
	Monitor as DesktopIcon,
	Moon as MoonIcon,
	Music as MusicIcon,
	Package as PackageIcon,
	Palette as AppearanceIcon,
	Pin as PinIcon,
	Play as PlayIcon,
	Plus as PlusIcon,
	Power as QuitIcon,
	RefreshCw as RefreshIcon,
	RotateCw as ReloadIcon,
	Search as SearchIcon,
	Settings as SettingsIcon,
	Shield as PrivacyIcon,
	SlidersHorizontal as AdvancedIcon,
	Square as SquareIcon,
	SquareTerminal as TerminalIcon,
	Star as FavouriteIcon,
	Sun as SunIcon,
	TriangleAlert as WarningIcon,
	Usb as RemovableDriveIcon,
	Video as VideoIcon,
	X as CloseIcon,
	ZoomIn as ZoomInIcon,
	ZoomOut as ZoomOutIcon,
} from 'lucide-react';
