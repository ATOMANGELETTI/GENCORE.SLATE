import { Button, Tooltip } from '@slate/ui-kit';
import type { ViewId } from '../views/view.types.ts';
import { RAIL_VIEWS } from '../views/views.registry.ts';

/**
 * The five glyphs at the foot of the rail, and again at the foot of an open
 * view's menu.
 *
 * Rendered from `RAIL_VIEWS` rather than written out, so the buttons, the view
 * menu and the title bar's title all read from one description. Writing five
 * buttons by hand here is how the rail ends up offering a view that no longer
 * exists.
 *
 * They move rather than disappear when a view opens. A toolbar that vanished
 * into the thing it opened would leave the only way back out being to close and
 * reopen, which is a worse gesture than the one it saved.
 */

type RailActionsProps = {
	activeView: ViewId | null;
	onSelect: (view: ViewId) => void;
};

export function RailActions({ activeView, onSelect }: RailActionsProps) {
	return (
		<div className="flex items-center justify-between border-t border-hairline pt-3">
			{RAIL_VIEWS.map((view) => {
				const Icon = view.icon;
				const isActive = activeView === view.id;

				return (
					<Tooltip key={view.id} content={view.tooltip}>
						<Button
							variant="ghost"
							size="icon"
							aria-label={view.tooltip}
							aria-pressed={isActive}
							onClick={() => onSelect(view.id)}
							className={isActive ? 'bg-selected text-accent-default' : undefined}
						>
							<Icon strokeWidth={1.5} aria-hidden="true" />
						</Button>
					</Tooltip>
				);
			})}
		</div>
	);
}
