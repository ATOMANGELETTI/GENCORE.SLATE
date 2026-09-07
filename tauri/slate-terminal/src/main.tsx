import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { AppRoot } from './app/app.root.tsx';
import './styles/app.css';

const container = document.querySelector('#root');

if (!container) {
	throw new Error('the #root element is missing from index.html');
}

createRoot(container).render(
	<StrictMode>
		<AppRoot />
	</StrictMode>,
);
