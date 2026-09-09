import { CheckIcon } from '@slate/icons';

import { cn } from '../lib/cn.util.ts';
import type { MenuItemDescriptor } from './menu.types.ts';
import { type MenuItemVariants, menuItemVariants } from './menu.variants.ts';
import { MenuShortcut } from './menu-shortcut.component.tsx';

/**
 * One row in a menu.
 *
 * Rendered as a `<div>` with a menu role rather than a `<button>` because both
 * callers already own the roving-tabindex and activation behaviour — Radix in
 * the context menus, the tray popup's own key handler in the tray window — and
 * a nested native button would fight both for focus.
 */

type MenuItemProps = {
	item: MenuItemDescriptor;
	/**
	 * Reserves room for a checkmark so labels line up down the menu. Set when
	 * any item in the same group is checkable, not just this one.
	 */
	hasCheckColumn?: boolean;
} & MenuItemVariants &
	Omit<React.ComponentPropsWithRef<'div'>, 'onSelect'>;

/** The label, glyphs and shortcut, identical for both roles below. */
function MenuItemContent({
	item,
	hasCheckColumn,
}: {
	item: MenuItemDescriptor;
	hasCheckColumn: boolean;
}) {
	const Icon = item.icon;

	return (
		<>
			{hasCheckColumn ? (
				<span className="flex size-4 shrink-0 items-center justify-center">
					{item.isChecked ? <CheckIcon aria-hidden="true" /> : null}
				</span>
			) : null}

			{Icon ? <Icon aria-hidden="true" /> : null}

			<span className="flex-1 truncate">{item.label}</span>

			{item.shortcut ? <MenuShortcut>{item.shortcut}</MenuShortcut> : null}
		</>
	);
}

export function MenuItem({ item, hasCheckColumn = false, className, ...props }: MenuItemProps) {
	const shared = {
		'aria-disabled': item.disabled || undefined,
		title: item.disabled ? item.unavailableReason : undefined,
		'data-disabled': item.disabled ? '' : undefined,
		className: cn(menuItemVariants({ tone: item.tone }), className),
		...props,
	};

	/*
	 * The two roles are written out separately rather than computed, because
	 * `aria-checked` is only valid on the checkbox role and a computed role
	 * hides that from both the reader and the linter. An item that merely
	 * *can* be checked and currently is not still needs the checkbox role, or
	 * its off state is never announced at all.
	 *
	 * `tabIndex` is repeated on each branch rather than folded into `shared`
	 * for the same reason: a menu is a roving-tabindex widget, and a static
	 * analyser cannot see focusability arriving through a spread.
	 */
	if (item.isChecked === undefined) {
		return (
			<div role="menuitem" tabIndex={-1} {...shared}>
				<MenuItemContent item={item} hasCheckColumn={hasCheckColumn} />
			</div>
		);
	}

	return (
		<div role="menuitemcheckbox" tabIndex={-1} aria-checked={item.isChecked} {...shared}>
			<MenuItemContent item={item} hasCheckColumn={hasCheckColumn} />
		</div>
	);
}
