import * as RadixContextMenu from '@radix-ui/react-context-menu';

import { cn } from '../lib/cn.util.ts';
import { isSeparator, type MenuEntry } from '../menu/menu.types.ts';
import { menuSurfaceVariants } from '../menu/menu.variants.ts';
import { MenuItem } from '../menu/menu-item.component.tsx';
import { MenuSeparator } from '../menu/menu-separator.component.tsx';

/**
 * A right-click menu over an arbitrary region.
 *
 * Built on Radix rather than hand-rolled. Focus trapping, roving tabindex,
 * type-ahead, Escape and outside-click dismissal, and collision-aware
 * positioning near a screen edge are all behaviours that are easy to
 * approximate and very hard to get right — see `.agents/rules/05-react-and-ui.md`.
 *
 * The suite draws its own chrome, so nothing here comes from the operating
 * system: without this, right-clicking a custom title bar does nothing at all,
 * where every other Windows application offers the system menu.
 *
 * Give each region its own `entries`. A menu that offers the same items
 * wherever it is opened is telling the user their click had no meaning.
 */

type ContextMenuProps = {
	/** The region that responds to a right-click. */
	children: React.ReactNode;
	entries: MenuEntry[];
	/** Names the menu for assistive technology, e.g. "Window". */
	label: string;
	/** Stretches the trigger to fill its parent. */
	className?: string;
};

export function ContextMenu({ children, entries, label, className }: ContextMenuProps) {
	// Reserve the checkmark column only when something in this menu is
	// checkable, so menus without one do not carry a ragged left edge.
	const hasCheckColumn = entries.some(
		(entry) => !isSeparator(entry) && entry.isChecked !== undefined,
	);

	return (
		<RadixContextMenu.Root>
			<RadixContextMenu.Trigger className={className} asChild>
				{children}
			</RadixContextMenu.Trigger>

			<RadixContextMenu.Portal>
				<RadixContextMenu.Content
					aria-label={label}
					collisionPadding={8}
					className={cn(
						menuSurfaceVariants(),
						'z-[var(--slate-layer-dropdown)]',
						// Radix reports where it actually landed after collision
						// handling, so the menu grows from the corner nearest the
						// pointer rather than from an assumed top-left.
						'origin-[var(--radix-context-menu-content-transform-origin)]',
						'data-[state=open]:animate-[slate-menu-in_var(--slate-duration-fast)_var(--slate-ease-out)]',
					)}
				>
					{entries.map((entry) => {
						if (isSeparator(entry)) {
							return <MenuSeparator key={entry.id} />;
						}

						// A checkable entry needs Radix's checkbox item, not its plain
						// one: the two announce differently, and only the checkbox
						// version keeps the menu open so a toggle can be seen to
						// happen before it closes.
						if (entry.isChecked !== undefined) {
							return (
								<RadixContextMenu.CheckboxItem
									key={entry.id}
									checked={entry.isChecked}
									disabled={entry.disabled}
									onSelect={entry.onSelect}
									asChild
								>
									<MenuItem item={entry} hasCheckColumn={hasCheckColumn} />
								</RadixContextMenu.CheckboxItem>
							);
						}

						return (
							<RadixContextMenu.Item
								key={entry.id}
								disabled={entry.disabled}
								onSelect={entry.onSelect}
								asChild
							>
								<MenuItem item={entry} hasCheckColumn={hasCheckColumn} />
							</RadixContextMenu.Item>
						);
					})}
				</RadixContextMenu.Content>
			</RadixContextMenu.Portal>
		</RadixContextMenu.Root>
	);
}
