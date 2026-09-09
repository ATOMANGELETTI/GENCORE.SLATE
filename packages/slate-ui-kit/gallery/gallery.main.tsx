import { applyTheme, type ThemePreference } from '@slate/tokens';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';

import { Button } from '../src/index.ts';
import { GALLERY_ENTRIES } from './gallery.entries.tsx';
import './gallery.css';

/**
 * The UI kit gallery.
 *
 * Every component, in both themes, in a browser. Run it with
 * `bun run gallery`.
 */
function Gallery() {
	const [theme, setTheme] = useState<ThemePreference>('dark');

	const choose = (next: ThemePreference) => {
		setTheme(next);
		applyTheme(next, document.documentElement);
	};

	return (
		// `h-screen`, not `min-h-screen`: the token base layer sets
		// `body { overflow: hidden }`, which is correct for an application
		// window and would otherwise clip everything below the fold here.
		<div className="h-screen overflow-auto bg-canvas text-primary">
			<header className="sticky top-0 z-30 flex items-center justify-between border-b border-hairline bg-surface/90 px-6 py-3 backdrop-blur">
				<div>
					<h1 className="text-lg font-bold tracking-tight">SLATE UI Kit</h1>
					<p className="text-xs text-tertiary">
						{GALLERY_ENTRIES.length} components · switch themes to check both
					</p>
				</div>

				<div className="flex gap-1">
					{(['dark', 'light', 'system'] as const).map((option) => (
						<Button
							key={option}
							size="sm"
							variant={theme === option ? 'primary' : 'ghost'}
							onClick={() => choose(option)}
						>
							{option}
						</Button>
					))}
				</div>
			</header>

			<main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
				{GALLERY_ENTRIES.map((entry) => (
					<section key={entry.id} className="flex flex-col gap-4">
						<div className="space-y-1">
							<h2 className="text-md font-bold text-primary">{entry.title}</h2>
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
		<Gallery />
	</StrictMode>,
);
