import { fireEvent } from '@testing-library/react';

/**
 * A deliberately small interaction helper.
 *
 * `@testing-library/user-event` is excellent but simulates a full pointer and
 * keyboard sequence, which is more machinery than a component kit needs and
 * one more dependency to audit. These four cover everything the kit's tests
 * actually do; reach for the real library only when a test genuinely needs
 * realistic event ordering.
 */
export const userEvent = {
	/** Clicks an element. */
	click(element: Element): void {
		fireEvent.click(element);
	},

	/** Double-clicks an element — used for the title bar's zoom gesture. */
	doubleClick(element: Element): void {
		fireEvent.doubleClick(element);
	},

	/** Moves the pointer over an element, to reveal hover-only affordances. */
	hover(element: Element): void {
		fireEvent.mouseOver(element);
		fireEvent.mouseEnter(element);
	},

	/** Presses a key on an element. */
	keyDown(element: Element, key: string): void {
		fireEvent.keyDown(element, { key });
	},
};
