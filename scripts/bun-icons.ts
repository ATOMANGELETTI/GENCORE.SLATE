#!/usr/bin/env bun
/**
 * Generates the application icons.
 *
 *   bun run scripts/bun-icons.ts
 *
 * Tauri needs PNGs and a Windows `.ico` before it will build, and a scaffold
 * that cannot build is not a scaffold. Rather than committing opaque binaries
 * nobody can regenerate, the marks are drawn here in code: each application
 * gets the same rounded-square silhouette in its own accent colour, so the
 * suite reads as one product in the taskbar.
 *
 * The PNG writer below is deliberately minimal — a single uncompressed
 * (stored) deflate block. Icons are a few kilobytes at these sizes, so paying
 * for real compression would mean adding a dependency to save nothing.
 *
 * Replace these with designed artwork when it exists; the script and the
 * output paths stay the same.
 */

import { join } from 'node:path';

const REPO_ROOT = join(import.meta.dir, '..');

/** One accent per application, drawn from the token palette. */
const APPS = [
	{ name: 'slate-launcher', color: [10, 132, 255] as const },
	{ name: 'slate-terminal', color: [48, 209, 88] as const },
	{ name: 'slate-explorer', color: [255, 214, 10] as const },
];

const SIZES = [32, 128, 256];

type Rgb = readonly [number, number, number];

// ── PNG encoding ─────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
	const table = new Uint32Array(256);
	for (let n = 0; n < 256; n += 1) {
		let c = n;
		for (let k = 0; k < 8; k += 1) {
			c = c & 1 ? 0xed_b8_83_20 ^ (c >>> 1) : c >>> 1;
		}
		table[n] = c >>> 0;
	}
	return table;
})();

function crc32(bytes: Uint8Array): number {
	let crc = 0xff_ff_ff_ff;
	for (const byte of bytes) {
		crc = (CRC_TABLE[(crc ^ byte) & 0xff] as number) ^ (crc >>> 8);
	}
	return (crc ^ 0xff_ff_ff_ff) >>> 0;
}

function adler32(bytes: Uint8Array): number {
	let a = 1;
	let b = 0;
	for (const byte of bytes) {
		a = (a + byte) % 65_521;
		b = (b + a) % 65_521;
	}
	return ((b << 16) | a) >>> 0;
}

function chunk(type: string, data: Uint8Array): Uint8Array {
	const typeBytes = new TextEncoder().encode(type);
	const body = new Uint8Array(typeBytes.length + data.length);
	body.set(typeBytes, 0);
	body.set(data, typeBytes.length);

	const out = new Uint8Array(8 + data.length + 4);
	const view = new DataView(out.buffer);
	view.setUint32(0, data.length);
	out.set(body, 4);
	view.setUint32(out.length - 4, crc32(body));

	return out;
}

/** Wraps raw bytes in a zlib stream using stored (uncompressed) blocks. */
function zlibStore(raw: Uint8Array): Uint8Array {
	const blocks: Uint8Array[] = [];
	const MAX = 65_535;

	for (let offset = 0; offset < raw.length; offset += MAX) {
		const slice = raw.subarray(offset, Math.min(offset + MAX, raw.length));
		const isLast = offset + MAX >= raw.length;
		const header = new Uint8Array(5);
		header[0] = isLast ? 1 : 0;
		new DataView(header.buffer).setUint16(1, slice.length, true);
		new DataView(header.buffer).setUint16(3, ~slice.length & 0xff_ff, true);
		blocks.push(header, slice);
	}

	const bodyLength = blocks.reduce((total, block) => total + block.length, 0);
	const out = new Uint8Array(2 + bodyLength + 4);
	out[0] = 0x78;
	out[1] = 0x01;

	let cursor = 2;
	for (const block of blocks) {
		out.set(block, cursor);
		cursor += block.length;
	}
	new DataView(out.buffer).setUint32(cursor, adler32(raw));

	return out;
}

/** Encodes RGBA pixels as a PNG. */
function encodePng(width: number, height: number, pixels: Uint8Array): Uint8Array {
	const raw = new Uint8Array((width * 4 + 1) * height);
	for (let y = 0; y < height; y += 1) {
		raw[y * (width * 4 + 1)] = 0; // filter: none
		raw.set(pixels.subarray(y * width * 4, (y + 1) * width * 4), y * (width * 4 + 1) + 1);
	}

	const ihdr = new Uint8Array(13);
	const view = new DataView(ihdr.buffer);
	view.setUint32(0, width);
	view.setUint32(4, height);
	ihdr[8] = 8; // bit depth
	ihdr[9] = 6; // colour type: RGBA

	const parts = [
		new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
		chunk('IHDR', ihdr),
		chunk('IDAT', zlibStore(raw)),
		chunk('IEND', new Uint8Array(0)),
	];

	const total = parts.reduce((sum, part) => sum + part.length, 0);
	const png = new Uint8Array(total);
	let cursor = 0;
	for (const part of parts) {
		png.set(part, cursor);
		cursor += part.length;
	}

	return png;
}

// ── The mark ─────────────────────────────────────────────────────────────────

/**
 * Draws a rounded square with a lighter diagonal band across it.
 *
 * Edges are supersampled four ways so the curve does not look ragged at 32px,
 * which is the size the taskbar actually shows.
 */
function drawMark(size: number, color: Rgb): Uint8Array {
	const pixels = new Uint8Array(size * size * 4);
	const radius = size * 0.22;
	const inset = size * 0.08;
	const [r, g, b] = color;

	const coverage = (x: number, y: number): number => {
		let hits = 0;
		for (const dx of [0.25, 0.75]) {
			for (const dy of [0.25, 0.75]) {
				if (insideRoundedSquare(x + dx, y + dy, size, inset, radius)) {
					hits += 1;
				}
			}
		}
		return hits / 4;
	};

	for (let y = 0; y < size; y += 1) {
		for (let x = 0; x < size; x += 1) {
			const alpha = coverage(x, y);
			if (alpha === 0) {
				continue;
			}

			// A soft diagonal band, brighter towards the top-left.
			const diagonal = (x + y) / (size * 2);
			const lift = 1 - diagonal * 0.45;

			const index = (y * size + x) * 4;
			pixels[index] = Math.round(Math.min(255, r * lift + 30 * (1 - diagonal)));
			pixels[index + 1] = Math.round(Math.min(255, g * lift + 30 * (1 - diagonal)));
			pixels[index + 2] = Math.round(Math.min(255, b * lift + 30 * (1 - diagonal)));
			pixels[index + 3] = Math.round(alpha * 255);
		}
	}

	return pixels;
}

function insideRoundedSquare(
	x: number,
	y: number,
	size: number,
	inset: number,
	radius: number,
): boolean {
	const min = inset;
	const max = size - inset;

	if (x < min || y < min || x > max || y > max) {
		return false;
	}

	const cx = Math.min(Math.max(x, min + radius), max - radius);
	const cy = Math.min(Math.max(y, min + radius), max - radius);

	return (x - cx) ** 2 + (y - cy) ** 2 <= radius ** 2;
}

// ── ICO ──────────────────────────────────────────────────────────────────────

/**
 * Wraps PNGs in an ICO container.
 *
 * PNG-in-ICO is supported by every Windows version this suite targets, which
 * avoids hand-rolling the older BMP-with-AND-mask encoding.
 */
function encodeIco(images: Array<{ size: number; png: Uint8Array }>): Uint8Array {
	const headerSize = 6 + images.length * 16;
	const total = images.reduce((sum, image) => sum + image.png.length, headerSize);

	const out = new Uint8Array(total);
	const view = new DataView(out.buffer);

	view.setUint16(0, 0, true);
	view.setUint16(2, 1, true); // type: icon
	view.setUint16(4, images.length, true);

	let offset = headerSize;
	images.forEach((image, index) => {
		const entry = 6 + index * 16;
		// 256 is encoded as 0 in the directory entry.
		out[entry] = image.size >= 256 ? 0 : image.size;
		out[entry + 1] = image.size >= 256 ? 0 : image.size;
		view.setUint16(entry + 4, 1, true); // colour planes
		view.setUint16(entry + 6, 32, true); // bits per pixel
		view.setUint32(entry + 8, image.png.length, true);
		view.setUint32(entry + 12, offset, true);

		out.set(image.png, offset);
		offset += image.png.length;
	});

	return out;
}

// ── Entry point ──────────────────────────────────────────────────────────────

let written = 0;

for (const app of APPS) {
	const directory = join(REPO_ROOT, 'tauri', app.name, 'src-tauri', 'icons');
	const rendered = SIZES.map((size) => ({
		size,
		png: encodePng(size, size, drawMark(size, app.color)),
	}));

	for (const image of rendered) {
		await Bun.write(join(directory, `${image.size}x${image.size}.png`), image.png);
		written += 1;
	}

	const square = rendered.find((image) => image.size === 128);
	if (square) {
		await Bun.write(join(directory, 'icon.png'), square.png);
		written += 1;
	}

	// The 256px image is kept on disk for other uses but left out of the .ico:
	// stored-deflate PNGs are large, and a quarter-megabyte icon resource in
	// each of three executables is real weight in a zip a user downloads.
	const icoImages = rendered.filter((image) => image.size < 256);
	await Bun.write(join(directory, 'icon.ico'), encodeIco(icoImages));
	written += 1;
}

console.warn(`icons — wrote ${written} files for ${APPS.length} applications.`);
