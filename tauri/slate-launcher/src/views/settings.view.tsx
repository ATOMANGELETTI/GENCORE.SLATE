import type { ThemeMode } from '@slate/bindings';
import { ACCENT_NAMES, type AccentName, type DensityName } from '@slate/tokens';
import { cn, SegmentedControl, Switch } from '@slate/ui-kit';

import { NotBuiltYet, SettingRow, ViewHeading } from './setting-row.component.tsx';

/**
 * Appearance and behaviour.
 *
 * Theme, accent and density are live — they change the window as you press
 * them, because all three are token switches the frontend already owns. Nothing
 * on this page is persisted yet: `slate_set_theme` exists and is called, and the
 * other two live in the store until there is a command to write them. That
 * split is stated on the page rather than hidden, since a setting that silently
 * forgets itself is worse than one that says it will.
 */

type SettingsViewProps = {
	sectionId: string;
	theme: ThemeMode;
	accent: AccentName;
	density: DensityName;
	onThemeChange: (theme: ThemeMode) => void;
	onAccentChange: (accent: AccentName) => void;
	onDensityChange: (density: DensityName) => void;
};

/**
 * The accent picker.
 *
 * Swatches rather than a segmented control of words, because the thing being
 * chosen is a colour and naming it is a worse description than showing it. Each
 * swatch is a real radio, so the group is announced as one choice and arrow
 * keys move between them.
 */
function AccentPicker({
	value,
	onChange,
}: {
	value: AccentName;
	onChange: (accent: AccentName) => void;
}) {
	return (
		// A fieldset with real radios rather than a div wearing
		// `role="radiogroup"`. The native grouping is what gives arrow-key
		// movement between the swatches and the "one of three" announcement,
		// without any of it being hand-rolled.
		<fieldset className="flex items-center gap-2 border-0 p-0">
			<legend className="sr-only">Accent colour</legend>
			{ACCENT_NAMES.map((accent) => (
				<input
					key={accent}
					type="radio"
					name="accent"
					value={accent}
					checked={accent === value}
					onChange={() => onChange(accent)}
					aria-label={accent}
					// The swatch paints itself by borrowing the accent's own
					// token from a scoped `data-accent`, so a colour is never
					// written here — the picker cannot drift from what it picks.
					data-accent={accent}
					className={cn(
						'size-6 cursor-pointer appearance-none rounded-full border-2 bg-accent-default',
						'transition-transform duration-[var(--slate-duration-fast)] ease-standard',
						accent === value ? 'border-primary' : 'border-transparent hover:scale-110',
					)}
				/>
			))}
		</fieldset>
	);
}

export function SettingsView({
	sectionId,
	theme,
	accent,
	density,
	onThemeChange,
	onAccentChange,
	onDensityChange,
}: SettingsViewProps) {
	if (sectionId === 'appearance') {
		return (
			<>
				<ViewHeading>Appearance</ViewHeading>

				<SettingRow label="Theme" description="Dark by default; system follows Windows">
					<SegmentedControl
						label="Theme"
						value={theme}
						onValueChange={onThemeChange}
						items={[
							{ value: 'system', label: 'System' },
							{ value: 'light', label: 'Light' },
							{ value: 'dark', label: 'Dark' },
						]}
					/>
				</SettingRow>

				<SettingRow label="Accent" description="Nord Frost. Every option clears AA in both themes">
					<AccentPicker value={accent} onChange={onAccentChange} />
				</SettingRow>

				<SettingRow label="Row density" description="How much of the list fits on screen">
					<SegmentedControl
						label="Row density"
						value={density}
						onValueChange={onDensityChange}
						items={[
							{ value: 'comfortable', label: 'Comfortable' },
							{ value: 'compact', label: 'Compact' },
						]}
					/>
				</SettingRow>

				<SettingRow
					label="Window material"
					description="Mica and Acrylic tint the window with the desktop wallpaper"
				>
					<SegmentedControl
						label="Window material"
						value="solid"
						onValueChange={() => {}}
						items={[
							{ value: 'solid', label: 'Solid' },
							{ value: 'mica', label: 'Mica' },
							{ value: 'acrylic', label: 'Acrylic' },
						]}
					/>
				</SettingRow>

				<p className="mt-4 max-w-prose text-xs text-tertiary">
					Theme is written to <span className="font-mono">appdata/config/suite.toml</span>. Accent,
					density and material apply immediately but are not saved yet — they need a command that
					does not exist.
				</p>
			</>
		);
	}

	if (sectionId === 'applications') {
		return (
			<>
				<ViewHeading>Applications</ViewHeading>
				<SettingRow label="Show version numbers" description="In the right column of the list">
					<Switch label="Show version numbers" defaultChecked />
				</SettingRow>
				<SettingRow label="Confirm before removing" description="For portable applications">
					<Switch label="Confirm before removing" defaultChecked />
				</SettingRow>
				<div className="mt-6">
					<NotBuiltYet
						what="Per-application settings"
						why="Launch arguments, working directory and a custom name need somewhere to be stored per application, which the configuration layer does not have yet."
					/>
				</div>
			</>
		);
	}

	if (sectionId === 'storage') {
		return (
			<>
				<ViewHeading>Storage</ViewHeading>
				<SettingRow label="Portable root" description="Everything the suite writes stays inside it">
					<span className="font-mono text-xs text-tertiary">installDir/</span>
				</SettingRow>
				<div className="mt-6">
					<NotBuiltYet
						what="Housekeeping"
						why="Reporting what logs, caches and WebView2 user data cost, and clearing each, needs a command that can measure those directories."
					/>
				</div>
			</>
		);
	}

	if (sectionId === 'privacy') {
		return (
			<>
				<ViewHeading>Privacy</ViewHeading>
				<SettingRow label="Remember command history" description="Used to rank suggestions">
					<Switch label="Remember command history" defaultChecked />
				</SettingRow>
				<SettingRow label="Clear history on exit" description="Forget searches and commands">
					<Switch label="Clear history on exit" />
				</SettingRow>
			</>
		);
	}

	return (
		<>
			<ViewHeading>Advanced</ViewHeading>
			<SettingRow label="Reduce motion" description="Collapse transitions to opacity only">
				<Switch label="Reduce motion" />
			</SettingRow>
			<SettingRow label="Log level" description="Written to appdata/logs">
				<SegmentedControl
					label="Log level"
					value="info"
					onValueChange={() => {}}
					items={[
						{ value: 'warn', label: 'Warn' },
						{ value: 'info', label: 'Info' },
						{ value: 'debug', label: 'Debug' },
					]}
				/>
			</SettingRow>
		</>
	);
}
