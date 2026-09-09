/**
 * Draws each application's tray icon — in both the light and dark ink it
 * needs, since Windows never tints a tray icon to match its own taskbar
 * theme.
 *
 * A tray icon is 32 pixels of monochrome glyph, which is small enough that
 * hand-setting the pixels produces a better result than scaling a vector down
 * — at this size an SVG renderer spends its time deciding which stems to blur.
 * Setting them by hand also means the icons match the pixel-set typeface the
 * rest of the interface uses.
 *
 * The PNG is assembled directly rather than through an image library: the
 * suite has no rasteriser and adding one to draw six 32×32 glyphs would be a
 * dependency for something Bun already does (`.agents/rules/04-typescript.md`).
 * `Bun.deflateSync` supplies the one non-trivial part.
 *
 * Run: `bun run scripts/bun-tray-icons.ts`
 */

/** Every glyph is drawn on this grid. */
const SIZE = 32;

/**
 * Two inks, because Windows never tints a tray icon to match its own theme:
 * a single colour is invisible against half of the two taskbar backgrounds it
 * has to sit on.
 *
 * Confirmed with Dustin: a light taskbar (Windows light theme) wants the dark
 * ink; a dark taskbar (Windows dark theme) wants the light one — the ordinary
 * convention, and the one that actually fixes a disappearing icon rather than
 * reproducing it under the other theme.
 */
const INK_FOR_DARK_THEME = [0xec, 0xef, 0xf4] as const; // Snow Storm — nord6
const INK_FOR_LIGHT_THEME = [0x2e, 0x34, 0x40] as const; // Polar Night — nord0

/**
 * The glyphs, drawn as text so a reviewer can see the shape in the diff.
 *
 * `#` is ink, a space is transparent. Each row must be `SIZE` characters and
 * there must be `SIZE` rows; `parseGlyph` checks both rather than silently
 * producing a skewed image.
 */
const GLYPHS: Record<string, string[]> = {
	// Launcher — four rounded tiles, echoing the app grid it presents.
	'slate-launcher': [
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'    ##########    ##########    ',
		'   ############  ############   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ############  ############   ',
		'    ##########    ##########    ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'    ##########    ##########    ',
		'   ############  ############   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ###      ###  ###      ###   ',
		'   ############  ############   ',
		'    ##########    ##########    ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
	],
	// Terminal — a prompt chevron and a caret, the two marks that say "shell".
	'slate-terminal': [
		'                                ',
		'                                ',
		'  ############################  ',
		'  ############################  ',
		'  ##                        ##  ',
		'  ##                        ##  ',
		'  ##                        ##  ',
		'  ##   ###                  ##  ',
		'  ##   #####                ##  ',
		'  ##     #####              ##  ',
		'  ##       #####            ##  ',
		'  ##         #####          ##  ',
		'  ##         #####          ##  ',
		'  ##       #####            ##  ',
		'  ##     #####              ##  ',
		'  ##   #####                ##  ',
		'  ##   ###                  ##  ',
		'  ##                        ##  ',
		'  ##      ###########       ##  ',
		'  ##      ###########       ##  ',
		'  ##                        ##  ',
		'  ##                        ##  ',
		'  ##                        ##  ',
		'  ############################  ',
		'  ############################  ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
	],
	// Explorer — a folder with a raised tab.
	'slate-explorer': [
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'   #########                    ',
		'   ###########                  ',
		'   ###     ####                 ',
		'   ###      #################   ',
		'   ###      #################   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ###                    ###   ',
		'   ##########################   ',
		'   ##########################   ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
		'                                ',
	],
};

/** Rejects a grid that is not exactly `SIZE` by `SIZE`. */
function assertWellFormed(name: string, rows: string[]): void {
	if (rows.length !== SIZE) {
		throw new Error(`${name}: expected ${SIZE} rows, found ${rows.length}`);
	}

	for (const [index, row] of rows.entries()) {
		if (row.length !== SIZE) {
			throw new Error(`${name}: row ${index} is ${row.length} characters, expected ${SIZE}`);
		}
	}
}

/** Turns a validated glyph into PNG scanlines, in the given ink colour. */
function toScanlines(rows: string[], ink: readonly [number, number, number]): Uint8Array {
	// One filter byte per scanline, then RGBA per pixel.
	const raw = new Uint8Array(SIZE * (1 + SIZE * 4));
	let at = 0;

	for (const row of rows) {
		// Filter type 0 (None). The images are tiny; a smarter filter would
		// save bytes nobody is counting and make this harder to read.
		raw[at] = 0;
		at += 1;

		for (const cell of row) {
			const isInk = cell === '#';
			raw[at] = isInk ? ink[0] : 0;
			raw[at + 1] = isInk ? ink[1] : 0;
			raw[at + 2] = isInk ? ink[2] : 0;
			raw[at + 3] = isInk ? 0xff : 0x00;
			at += 4;
		}
	}

	return raw;
}

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let c = 0xffffffff;
	for (const byte of bytes) {
		c = (CRC_TABLE[(c ^ byte) & 0xff] ?? 0) ^ (c >>> 8);
	}
	return (c ^ 0xffffffff) >>> 0;
}

/** One PNG chunk: length, type, payload, CRC. */
function chunk(type: string, payload: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const body = new Uint8Array(typeBytes.length + payload.length);
	body.set(typeBytes);
	body.set(payload, typeBytes.length);

	const out = new Uint8Array(4 + body.length + 4);
	const view = new DataView(out.buffer);
	view.setUint32(0, payload.length);
	out.set(body, 4);
	view.setUint32(4 + body.length, crc32(body));

	return out;
}

/**
 * Wraps raw DEFLATE output in a zlib stream.
 *
 * PNG's IDAT is a zlib stream (RFC 1950), not bare DEFLATE: a two-byte header
 * and a trailing Adler-32 of the *uncompressed* bytes. `Bun.deflateSync`
 * produces the bare form regardless of `windowBits`, and a PNG built from it
 * has a valid signature, valid chunk CRCs, and correct dimensions — so it
 * looks fine to anything that only reads the header, and fails to decode in
 * every actual viewer.
 *
 * `0x78 0x01` is 32K-window DEFLATE with the check bits chosen so the header
 * is divisible by 31, as the format requires.
 */
function zlib(raw: Uint8Array): Uint8Array {
	const deflated = Bun.deflateSync(raw);

	let a = 1;
	let b = 0;
	for (const byte of raw) {
		a = (a + byte) % 65521;
		b = (b + a) % 65521;
	}

	const out = new Uint8Array(2 + deflated.length + 4);
	out[0] = 0x78;
	out[1] = 0x01;
	out.set(deflated, 2);
	new DataView(out.buffer).setUint32(2 + deflated.length, ((b << 16) | a) >>> 0);

	return out;
}

/** Assembles a 32-bit RGBA PNG from raw scanlines. */
function encodePng(raw: Uint8Array): Uint8Array {
	const header = new Uint8Array(13);
	const view = new DataView(header.buffer);
	view.setUint32(0, SIZE);
	view.setUint32(4, SIZE);
	header[8] = 8; // bit depth
	header[9] = 6; // colour type: RGBA
	header[10] = 0; // deflate
	header[11] = 0; // adaptive filtering
	header[12] = 0; // no interlace

	const parts = [
		new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', header),
		chunk('IDAT', zlib(raw)),
		chunk('IEND', new Uint8Array(0)),
	];

	const total = parts.reduce((sum, part) => sum + part.length, 0);
	const png = new Uint8Array(total);
	let at = 0;
	for (const part of parts) {
		png.set(part, at);
		at += part.length;
	}

	return png;
}

for (const [app, rows] of Object.entries(GLYPHS)) {
	assertWellFormed(app, rows);

	// Named for the taskbar theme each is shown against, not for its own ink
	// colour — that is the mapping `slate_runtime::tray` actually needs, and
	// naming by ink would leave the light/dark correspondence to be
	// remembered correctly at every call site instead of stated once, here.
	const variants = {
		'tray-dark-theme.png': INK_FOR_DARK_THEME,
		'tray-light-theme.png': INK_FOR_LIGHT_THEME,
	} as const;

	for (const [file, ink] of Object.entries(variants)) {
		const path = `tauri/${app}/src-tauri/icons/${file}`;
		await Bun.write(path, encodePng(toScanlines(rows, ink)));
		console.log(`tray-icons — wrote ${path}`);
	}
}
