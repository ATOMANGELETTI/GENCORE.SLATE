import { AppShell, Button, StatusItem, TitleBar, TrafficLights } from '../src/index.ts';

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
