import { FolderIcon } from '@slate/icons';

/**
 * The Explorer content area.
 *
 * A template for now, deliberately. It establishes the layout every screen in
 * this application will sit inside — a centred, calm empty state — so the
 * first real feature has somewhere to go rather than starting from a blank
 * file.
 */
export function ContentLayout() {
	return (
		<section className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center">
			<div className="flex size-14 items-center justify-center rounded-xl bg-elevated ring-1 ring-inset ring-hairline">
				<FolderIcon className="size-6 text-secondary" aria-hidden="true" />
			</div>

			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight text-primary">Explorer Template</h1>
				<p className="max-w-sm text-md text-tertiary">
					The shared shell is wired up. Application content belongs here.
				</p>
			</div>
		</section>
	);
}
