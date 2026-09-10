import { KeyHint } from '@slate/ui-kit';

import { COMMAND_SPECS } from '../command/commands.registry.ts';
import { ViewHeading } from './setting-row.component.tsx';

/**
 * Every command, with its arguments and an example.
 *
 * Generated from `COMMAND_SPECS` rather than written beside it. A help page
 * maintained separately from the parser is a help page that is wrong within a
 * month, and wrong documentation is worse than none — it costs the reader the
 * time it takes to find out.
 *
 * This is what both `/help` and the `?` key open, so there is one reference
 * rather than a page and a cheatsheet that disagree.
 */
export function HelpView() {
	return (
		<>
			<ViewHeading>Commands</ViewHeading>
			<p className="mb-5 max-w-prose text-xs text-tertiary">
				Type a slash in the bar at the top to start one. Matching is fuzzy, so{' '}
				<span className="font-mono">/cfg --th</span> finds{' '}
				<span className="font-mono">/config --theme</span>. The bar also does arithmetic and unit
				conversion: try <span className="font-mono">1920*0.75</span> or{' '}
				<span className="font-mono">4gb in mb</span>.
			</p>

			<div className="mb-6 flex flex-wrap items-center gap-4">
				<KeyHint keys={['CTRL', 'K']}>Focus the bar</KeyHint>
				<KeyHint keys={['↑', '↓']}>Select</KeyHint>
				<KeyHint keys={['TAB']}>Complete</KeyHint>
				<KeyHint keys={['ENTER']}>Run</KeyHint>
				<KeyHint keys={['ESC']}>Exit</KeyHint>
			</div>

			<div className="flex flex-col">
				{COMMAND_SPECS.map((spec) => (
					<div key={spec.name} className="border-b border-hairline py-3">
						<div className="flex items-baseline gap-3">
							<span className="font-mono text-base text-primary">/{spec.name}</span>
							<span className="min-w-0 flex-1 truncate text-xs text-tertiary">{spec.summary}</span>
							<span className="shrink-0 font-mono text-2xs text-tertiary">{spec.example}</span>
						</div>

						{spec.unavailableReason ? (
							<p className="mt-1.5 text-xs text-status-warning">{spec.unavailableReason}</p>
						) : null}

						{spec.args.length > 0 ? (
							<div className="mt-2 flex flex-col gap-1 pl-4">
								{spec.args.map((arg) => (
									<div key={arg.flag} className="flex items-baseline gap-3">
										<span className="w-32 shrink-0 font-mono text-xs text-secondary">
											--{arg.flag}
										</span>
										<span className="min-w-0 flex-1 text-xs text-tertiary">{arg.description}</span>
										{arg.values ? (
											<span className="shrink-0 font-mono text-2xs text-tertiary">
												{arg.values.join(' · ')}
											</span>
										) : null}
									</div>
								))}
							</div>
						) : null}
					</div>
				))}
			</div>
		</>
	);
}
