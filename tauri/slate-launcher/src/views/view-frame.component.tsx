import { NavItem, SectionLabel } from '@slate/ui-kit';
import { useState } from 'react';

import { RailActions } from '../rail/rail-actions.component.tsx';
import type { ViewDescriptor, ViewId } from './view.types.ts';

/**
 * The frame every expanded view is drawn in.
 *
 * When a view opens, the application list and the rail unmount and this stands
 * where they were, in a window that has grown by
 * `--slate-chrome-windowExpansion`. The view's own sections run down the left,
 * and **the rail's five buttons move to the foot of that menu** — so a view is
 * a place you can move between rather than a modal you have to back out of.
 *
 * The section a view opens on is held here rather than in the store. It is
 * genuinely local: nothing outside this frame needs to know which settings
 * page is showing, and putting it in the store would mean deciding what
 * happens to it when a different view opens.
 */

type ViewFrameProps = {
	view: ViewDescriptor;
	activeView: ViewId;
	onOpenView: (view: ViewId) => void;
	/** Renders the body for the chosen section. */
	children: (sectionId: string) => React.ReactNode;
};

export function ViewFrame({ view, activeView, onOpenView, children }: ViewFrameProps) {
	const [sectionId, setSectionId] = useState(view.sections[0]?.id ?? '');

	return (
		<div className="flex h-full min-h-0">
			<nav
				aria-label={`${view.title} sections`}
				className="flex w-[var(--slate-chrome-viewNavWidth)] shrink-0 flex-col border-r border-hairline px-3 py-4"
			>
				<SectionLabel className="px-0 pt-0">{view.title}</SectionLabel>

				<div className="flex flex-col">
					{view.sections.map((section) => (
						<NavItem
							key={section.id}
							icon={section.icon}
							label={section.label}
							isUppercase
							isSelected={section.id === sectionId}
							onClick={() => setSectionId(section.id)}
						/>
					))}
				</div>

				<div className="flex-1" />

				<RailActions activeView={activeView} onSelect={onOpenView} />
			</nav>

			<div className="min-w-0 flex-1 overflow-y-auto px-6 py-5">{children(sectionId)}</div>
		</div>
	);
}
