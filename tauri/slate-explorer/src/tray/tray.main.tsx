import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { TrayMenuRoot } from './tray.root.tsx';
import '../styles/app.css';

/**
 * Entry point for the tray-menu window.
 *
 * A second entry rather than a route inside the main window: this renders in a
 * different OS window entirely, which is what lets it float above everything
 * and sit over the notification area.
 */
const container = document.getElementById('root');

if (!container) {
	throw new Error('the tray menu has no mount point');
}

createRoot(container).render(
	<StrictMode>
		<TrayMenuRoot />
	</StrictMode>,
);
