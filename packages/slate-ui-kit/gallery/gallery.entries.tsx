import {
	AppearanceIcon,
	CloseIcon,
	DesktopIcon,
	DownloadIcon,
	FileIcon,
	FolderIcon,
	HideIcon,
	InfoIcon,
	LayoutIcon,
	MinimiseIcon,
	MusicIcon,
	PasteIcon,
	PinIcon,
	PlusIcon,
	PrivacyIcon,
	QuitIcon,
	ReloadIcon,
	SearchIcon,
	SettingsIcon,
	TerminalIcon,
	UpdateIcon,
	VideoIcon,
	ZoomIcon,
} from '@slate/icons';
import { useState } from 'react';

import {
	AboutDialog,
	AppShell,
	Button,
	ContextMenu,
	KeyHint,
	type MenuEntry,
	MenuHeader,
	MenuItem,
	MenuSeparator,
	MenuSurface,
	Meter,
	NavItem,
	SectionLabel,
	SegmentedControl,
	StatusItem,
	Switch,
	TextField,
	TitleBar,
	Tooltip,
	TrafficLights,
} from '../src/index.ts';

/**
 * Every component in the kit, rendered for visual review.
 *
 * Chosen over Storybook deliberately: this is a plain Vite page with no extra
 * ecosystem, no addon configuration, and nothing to keep upgraded. It exists
 * to answer one question — "does this still look right, in both themes?" —
 * and a component missing from here will drift without anyone noticing.
 *
 * A component is added to the kit and to this file in the same commit. See
 * `.agents/workflows/add-component.md`.
 */

type GalleryEntry = {
	id: string;
	title: string;
	description: string;
	render: () => React.ReactNode;
};

function Row({ children }: { children: React.ReactNode }) {
	return <div className="flex flex-wrap items-center gap-3">{children}</div>;
}

/**
 * A dialog needs somewhere to hold `open` state, so it gets a small component
 * of its own rather than a bare closure — `useState` inside a plain function
 * called as `entry.render()` would work by accident but reads as a hook
 * violation to anyone skimming it later.
 */
function AboutDialogDemo() {
	const [open, setOpen] = useState(false);

	return (
		<>
			<Button onClick={() => setOpen(true)}>About Launcher…</Button>
			<AboutDialog
				open={open}
				onOpenChange={setOpen}
				appName="Launcher"
				icon={LayoutIcon}
				description="Launches the suite's apps and third-party portable apps. Hosts the IPC broker."
				suiteVersion="0.1.0"
				copyright="Copyright (c) 2026 Dustin Angeletti. All rights reserved."
			/>
		</>
	);
}

/**
 * The settings controls need somewhere to hold their own state, for the same
 * reason the dialog does — a `useState` inside `entry.render()` would work by
 * accident and read as a hook violation to anyone skimming it later.
 */
function SettingsRowsDemo() {
	const [material, setMaterial] = useState('solid');
	const [isReduced, setIsReduced] = useState(false);

	return (
		<div className="w-full max-w-md">
			<SectionLabel className="pt-0">Appearance</SectionLabel>
			<div className="flex items-center justify-between border-b border-hairline py-3">
				<div>
					<div className="text-base text-primary">Window material</div>
					<div className="text-xs text-tertiary">Solid, Mica or Acrylic</div>
				</div>
				<SegmentedControl
					label="Window material"
					value={material}
					onValueChange={setMaterial}
					items={[
						{ value: 'solid', label: 'Solid' },
						{ value: 'mica', label: 'Mica' },
						{ value: 'acrylic', label: 'Acrylic' },
					]}
				/>
			</div>
			<div className="flex items-center justify-between py-3">
				<div>
					<div className="text-base text-primary">Reduce motion</div>
					<div className="text-xs text-tertiary">Collapse transitions to opacity</div>
				</div>
				<Switch
					label="Reduce motion"
					checked={isReduced}
					onCheckedChange={(next) => setIsReduced(next)}
				/>
			</div>
		</div>
	);
}

function TextFieldDemo() {
	const [query, setQuery] = useState('');

	return (
		<div className="flex w-full max-w-md flex-col gap-6">
			<TextField
				label="Search apps"
				isLabelHidden
				icon={SearchIcon}
				placeholder="Search apps"
				value={query}
				onChange={(event) => setQuery(event.target.value)}
				trailing={<span className="font-mono text-xs text-tertiary">16</span>}
			/>
			<TextField label="Working directory" placeholder="storage/documents" size="sm" />
			<TextField label="Disabled" placeholder="Not editable" disabled />
		</div>
	);
}

function NavListDemo() {
	const [selected, setSelected] = useState('downloads');
	const folders = [
		{ id: 'desktop', label: 'Desktop', icon: DesktopIcon },
		{ id: 'downloads', label: 'Downloads', icon: DownloadIcon },
		{ id: 'documents', label: 'Documents', icon: FileIcon },
		{ id: 'pictures', label: 'Pictures', icon: FolderIcon },
		{ id: 'videos', label: 'Videos', icon: VideoIcon },
		{ id: 'music', label: 'Music', icon: MusicIcon },
	];

	return (
		<div className="flex w-full gap-10">
			<div className="w-48">
				<SectionLabel id="gallery-folders" className="pt-0">
					Folders
				</SectionLabel>
				<nav aria-labelledby="gallery-folders" className="flex flex-col">
					{folders.map((folder) => (
						<NavItem
							key={folder.id}
							icon={folder.icon}
							label={folder.label}
							isUppercase
							isSelected={selected === folder.id}
							onClick={() => setSelected(folder.id)}
						/>
					))}
				</nav>
			</div>
			<div className="w-48">
				<SectionLabel className="pt-0">Sentence case</SectionLabel>
				<div className="flex flex-col">
					<NavItem icon={AppearanceIcon} label="Appearance" isSelected />
					<NavItem icon={PrivacyIcon} label="Privacy" />
					<NavItem icon={SettingsIcon} label="Advanced" trailing={<span>›</span>} />
					<NavItem icon={InfoIcon} label="Unavailable" disabled />
				</div>
			</div>
		</div>
	);
}

export const GALLERY_ENTRIES: GalleryEntry[] = [
	{
		id: 'traffic-lights',
		title: 'Traffic lights',
		description:
			'Coloured while the window is focused, grey when it is not. Glyphs reveal on hover of the group, never a single button.',
		render: () => (
			<Row>
				<div className="flex flex-col items-start gap-2">
					<span className="text-xs text-tertiary">Focused</span>
					<TrafficLights
						isFocused
						onClose={() => {}}
						onMinimize={() => {}}
						onToggleMaximize={() => {}}
					/>
				</div>
				<div className="ml-8 flex flex-col items-start gap-2">
					<span className="text-xs text-tertiary">Unfocused</span>
					<TrafficLights
						isFocused={false}
						onClose={() => {}}
						onMinimize={() => {}}
						onToggleMaximize={() => {}}
					/>
				</div>
			</Row>
		),
	},
	{
		id: 'title-bar',
		title: 'Title bar',
		description:
			'Traffic lights left, centred title, trailing action slot. The bar is a drag region.',
		render: () => (
			<div className="overflow-hidden rounded-lg ring-1 ring-inset ring-hairline">
				<TitleBar
					title="Launcher"
					isFocused
					onClose={() => {}}
					onMinimize={() => {}}
					onToggleMaximize={() => {}}
					actions={
						<Button variant="ghost" size="icon" aria-label="Settings">
							<svg
								viewBox="0 0 16 16"
								fill="none"
								stroke="currentColor"
								strokeWidth="1.4"
								aria-hidden="true"
							>
								<circle cx="8" cy="8" r="2.5" />
								<path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2" strokeLinecap="round" />
							</svg>
						</Button>
					}
				/>
				<div className="h-24 bg-canvas" />
			</div>
		),
	},
	{
		id: 'buttons',
		title: 'Buttons',
		description: 'Four variants, four sizes. Every value comes from a token.',
		render: () => (
			<div className="flex flex-col gap-3">
				<Row>
					<Button variant="primary">Primary</Button>
					<Button variant="secondary">Secondary</Button>
					<Button variant="ghost">Ghost</Button>
					<Button variant="danger">Danger</Button>
				</Row>
				<Row>
					<Button size="sm">Small</Button>
					<Button size="md">Medium</Button>
					<Button size="lg">Large</Button>
					<Button disabled>Disabled</Button>
				</Row>
			</div>
		),
	},
	{
		id: 'menu-surface',
		title: 'Menu',
		description:
			'One surface for all three menus. Items are 30px, the leading glyph column and the trailing shortcut column both align, and a rule is full-bleed so groups read as regions.',
		render: () => (
			<MenuSurface className="w-fit">
				<MenuItem
					item={{
						id: 'r',
						label: 'Reload',
						icon: ReloadIcon,
						shortcut: 'Ctrl+R',
						onSelect: () => {},
					}}
				/>
				<MenuItem
					item={{
						id: 'z',
						label: 'Zoom',
						icon: ZoomIcon,
						shortcut: 'Ctrl+Shift+M',
						onSelect: () => {},
					}}
				/>
				<MenuSeparator />
				<MenuItem
					item={{ id: 'p', label: 'Always on Top', isChecked: true, onSelect: () => {} }}
					hasCheckColumn
				/>
				<MenuItem
					item={{ id: 'v', label: 'Full Screen', isChecked: false, onSelect: () => {} }}
					hasCheckColumn
				/>
				<MenuSeparator />
				<MenuItem
					item={{
						id: 'd',
						label: 'Open Terminal',
						icon: PasteIcon,
						disabled: true,
						unavailableReason: 'The process layer is not wired up yet',
						onSelect: () => {},
					}}
				/>
				<MenuItem
					item={{
						id: 'q',
						label: 'Close',
						icon: CloseIcon,
						shortcut: 'Alt+F4',
						tone: 'danger',
						onSelect: () => {},
					}}
				/>
			</MenuSurface>
		),
	},
	{
		id: 'tray-menu',
		title: 'Tray menu',
		description:
			'The same surface with a header, because the tray is the one place a menu appears with no window around it to say which application it belongs to.',
		render: () => (
			<MenuSurface className="w-fit">
				<MenuHeader name="Launcher" version="v0.1.0" icon={LayoutIcon} isRunning />
				<MenuSeparator />
				<MenuItem
					item={{
						id: 'h',
						label: 'Hide Window',
						icon: HideIcon,
						shortcut: 'Ctrl+H',
						onSelect: () => {},
					}}
				/>
				<MenuItem
					item={{
						id: 's',
						label: 'Preferences',
						icon: SettingsIcon,
						shortcut: 'Ctrl+,',
						onSelect: () => {},
					}}
				/>
				<MenuSeparator />
				<MenuItem
					item={{ id: 'u', label: 'Check for Updates', icon: UpdateIcon, onSelect: () => {} }}
				/>
				<MenuSeparator />
				<MenuItem
					item={{
						id: 'q',
						label: 'Quit Launcher',
						icon: QuitIcon,
						shortcut: 'Alt+F4',
						tone: 'danger',
						onSelect: () => {},
					}}
				/>
			</MenuSurface>
		),
	},
	{
		id: 'context-menu',
		title: 'Context menu',
		description:
			'Right-click the panel. Radix owns positioning, focus and dismissal; the kit owns how it looks.',
		render: () => {
			const entries: MenuEntry[] = [
				{
					id: 'min',
					label: 'Minimise',
					icon: MinimiseIcon,
					shortcut: 'Ctrl+M',
					onSelect: () => {},
				},
				{ id: 'zoom', label: 'Zoom', icon: ZoomIcon, shortcut: 'Ctrl+Shift+M', onSelect: () => {} },
				{ id: 's1', kind: 'separator' },
				{ id: 'top', label: 'Always on Top', icon: PinIcon, isChecked: false, onSelect: () => {} },
				{ id: 's2', kind: 'separator' },
				{
					id: 'close',
					label: 'Close',
					icon: CloseIcon,
					shortcut: 'Alt+F4',
					tone: 'danger',
					onSelect: () => {},
				},
			];

			return (
				<ContextMenu label="Window" entries={entries}>
					<div className="flex h-24 w-full items-center justify-center rounded-lg border border-hairline bg-surface text-tertiary">
						Right-click anywhere in here
					</div>
				</ContextMenu>
			);
		},
	},
	{
		id: 'about-dialog',
		title: 'About dialog',
		description:
			'What the content menu\'s "About" opens to. Built on the same Radix Dialog every application reuses, styled to match the menus rather than the browser default.',
		render: () => <AboutDialogDemo />,
	},
	{
		id: 'status-bar',
		title: 'Status bar',
		description: 'Three slots so items line up across applications. Quiet by design.',
		render: () => (
			<div className="overflow-hidden rounded-lg ring-1 ring-inset ring-hairline">
				<div className="h-16 bg-canvas" />
				<div className="flex h-6 items-center justify-between border-t border-hairline bg-surface px-3 text-xs">
					<StatusItem>Ready</StatusItem>
					<StatusItem tone="warning">1 warning</StatusItem>
					<StatusItem>SLATE 0.1.0</StatusItem>
				</div>
			</div>
		),
	},
	{
		id: 'section-label',
		title: 'Section label',
		description:
			'Names a group of rows. Capitals are the house style, and the tracking is what buys back the legibility capitals cost — set one without the other and 10px labels stop being readable. Banded is for a boundary that has to survive being scrolled past.',
		render: () => (
			<div className="flex w-full gap-10">
				<div className="w-48 rounded-lg border border-hairline bg-canvas px-2 pb-2">
					<SectionLabel>Suite</SectionLabel>
					<SectionLabel>Portable apps</SectionLabel>
				</div>
				<div className="w-48 overflow-hidden rounded-lg border border-hairline bg-canvas">
					<SectionLabel tone="banded">Suite</SectionLabel>
					<div className="h-8" />
					<SectionLabel tone="banded">Portable apps</SectionLabel>
				</div>
			</div>
		),
	},
	{
		id: 'nav-item',
		title: 'Nav item',
		description:
			'The row the folder list and every expanded view menu are built from. Real buttons, so they are reachable by keyboard; the selected one carries aria-current, which is how a screen reader user knows which of six similar rows they are on. Switch the density above and watch the heights follow.',
		render: () => <NavListDemo />,
	},
	{
		id: 'text-field',
		title: 'Text field',
		description:
			'Drawn as a ruled line rather than a box — a boxed input inside a window already made of hairline regions adds a second competing border for no information. The rule takes the accent on focus, which is the visible focus indicator.',
		render: () => <TextFieldDemo />,
	},
	{
		id: 'settings-controls',
		title: 'Switch and segmented control',
		description:
			'Both are for settings that apply immediately. The segmented control is chosen over a dropdown wherever there are three or four options, because for a setting you are comparing rather than searching, showing the alternatives is the point.',
		render: () => <SettingsRowsDemo />,
	},
	{
		id: 'key-hint',
		title: 'Key hint',
		description:
			'The strip along the foot of the command bar. The keys are spelled out rather than drawn as glyphs: the suite is Windows-only, so the Mac vocabulary would be wrong, and the bundled font subsets would render most of those glyphs as replacement boxes anyway.',
		render: () => (
			<div className="flex flex-wrap items-center gap-5">
				<KeyHint keys={['↑', '↓']}>Select</KeyHint>
				<KeyHint keys={['TAB']}>Complete</KeyHint>
				<KeyHint keys={['ENTER']}>Run</KeyHint>
				<KeyHint keys={['ESC']}>Exit</KeyHint>
				<KeyHint keys={['CTRL', 'K']}>Focus</KeyHint>
			</div>
		),
	},
	{
		id: 'meter',
		title: 'Meter',
		description:
			'A bounded quantity, not a progress bar — nothing here is in progress, and role="progressbar" would have a screen reader announce "loading" about a disk that is simply 3% full. Three pixels tall, because the number beside it is the information.',
		render: () => (
			<div className="flex w-full max-w-xs flex-col gap-6">
				<Meter
					label="Storage used"
					value={3}
					max={100}
					valueText="557 KB of 16 GB"
					hint="557 KB USED · 16.0 GB FREE"
				/>
				<Meter label="Nearly full" value={92} max={100} hint="14.7 GB USED · 1.3 GB FREE" />
			</div>
		),
	},
	{
		id: 'tooltip',
		title: 'Tooltip',
		description:
			'The name of an icon-only control, for people who are not using a screen reader. Hover or focus any of these. It never carries information that exists nowhere else — a tooltip cannot be reached by touch, cannot be selected, and disappears.',
		render: () => (
			<div className="flex items-center gap-1">
				{[
					{ label: 'Storage', icon: FolderIcon },
					{ label: 'Add application', icon: PlusIcon },
					{ label: 'Console', icon: TerminalIcon },
					{ label: 'Settings', icon: SettingsIcon },
					{ label: 'About', icon: InfoIcon },
				].map(({ label, icon: Icon }) => (
					<Tooltip key={label} content={label}>
						<Button variant="ghost" size="icon" aria-label={label}>
							<Icon strokeWidth={1.5} aria-hidden="true" />
						</Button>
					</Tooltip>
				))}
			</div>
		),
	},
	{
		id: 'app-shell',
		title: 'App shell',
		description: 'The complete window frame every application is built from.',
		render: () => (
			<div className="h-72 w-full max-w-3xl">
				<AppShell
					title="Explorer"
					isFocused
					onClose={() => {}}
					onMinimize={() => {}}
					onToggleMaximize={() => {}}
					status={{
						leading: <StatusItem>Ready</StatusItem>,
						trailing: <StatusItem>SLATE 0.1.0</StatusItem>,
					}}
				>
					<div className="flex h-full items-center justify-center text-tertiary">Content area</div>
				</AppShell>
			</div>
		),
	},
];
