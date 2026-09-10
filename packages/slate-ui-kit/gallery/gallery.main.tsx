import {
	ACCENT_NAMES,
	type AccentName,
	applyAccent,
	applyDensity,
	applyTheme,
	DEFAULT_ACCENT,
	type DensityName,
	type ThemePreference,
} from '@slate/tokens';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { SegmentedControl, TooltipProvider } from '../src/index.ts';
import { GALLERY_ENTRIES } from './gallery.entries.tsx';
import './gallery.css';

/**
 * The UI kit gallery.
 *
 * Every component, in every theme, density and accent, in a browser. Run it
 * with `bun run gallery`.
 *
 * The three switches at the top are not a convenience. Theme, density and
 * accent are the three axes a component can look correct on one setting of and
 * wrong on another, and a kit whose gallery only ever renders the defaults will
 * ship a component that has never been seen in compact light teal.
 */
function Gallery() {
	const [theme, setTheme] = useState<ThemePreference>('dark');
	const [density, setDensity] = useState<DensityName>('comfortable');
	const [accent, setAccent] = useState<AccentName>(DEFAULT_ACCENT);

	const chooseTheme = (next: ThemePreference) => {
		setTheme(next);
		applyTheme(next, document.documentElement);
	};

	const chooseDensity = (next: DensityName) => {
		setDensity(next);
		applyDensity(next, document.documentElement);
	};

	const chooseAccent = (next: AccentName) => {
		setAccent(next);
		applyAccent(next, document.documentElement);
	};

	return (
		// `h-screen`, not `min-h-screen`: the token base layer sets
		// `body { overflow: hidden }`, which is correct for an application
		// window and would otherwise clip everything below the fold here.
		<div className="h-screen overflow-auto bg-canvas text-primary">
			<header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-4 border-b border-hairline bg-surface/90 px-6 py-3 backdrop-blur">
				<div>
					<h1 className="text-lg font-semibold tracking-tight">SLATE UI Kit</h1>
					<p className="text-xs text-tertiary">
						{GALLERY_ENTRIES.length} components · check every axis below
					</p>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<SegmentedControl
						label="Theme"
						value={theme}
						onValueChange={chooseTheme}
						items={[
							{ value: 'dark', label: 'Dark' },
							{ value: 'light', label: 'Light' },
							{ value: 'system', label: 'System' },
						]}
					/>
					<SegmentedControl
						label="Density"
						value={density}
						onValueChange={chooseDensity}
						items={[
							{ value: 'comfortable', label: 'Comfortable' },
							{ value: 'compact', label: 'Compact' },
						]}
					/>
					<SegmentedControl
						label="Accent"
						value={accent}
						onValueChange={chooseAccent}
						items={ACCENT_NAMES.map((name) => ({ value: name, label: name }))}
					/>
				</div>
			</header>

			<main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
				{GALLERY_ENTRIES.map((entry) => (
					<section key={entry.id} className="flex flex-col gap-4">
						<div className="space-y-1">
							<h2 className="text-md font-semibold text-primary">{entry.title}</h2>
							<p className="max-w-2xl text-sm text-tertiary">{entry.description}</p>
						</div>

						<div className="rounded-xl border border-hairline bg-surface p-6">{entry.render()}</div>
					</section>
				))}
			</main>
		</div>
	);
}

const container = document.querySelector('#root');

if (!container) {
	throw new Error('the #root element is missing from gallery/index.html');
}

createRoot(container).render(
	<StrictMode>
		{/* One provider for the page, so moving between neighbouring tooltips
		    skips the delay the way it does in a real window. */}
		<TooltipProvider>
			<Gallery />
		</TooltipProvider>
	</StrictMode>,
);
