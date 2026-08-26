import type { CollectionEntry } from 'astro:content';

export const NOTE_CATEGORY_EMOJI = {
	Essay: '📝',
	Tech: '💻',
	'Lab Notes': '🧪',
	Micropost: '🍪',
	'Twitter Archive': '🐣',
} as const;

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatNoteDateISO(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function formatNoteDate(date: Date) {
	return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function noteHref(note: CollectionEntry<'notes'>) {
	return note.data.external ?? `/notes/${note.id}`;
}

export function groupNotesByYear(notes: CollectionEntry<'notes'>[]) {
	const grouped = new Map<number, CollectionEntry<'notes'>[]>();

	for (const note of [...notes].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf())) {
		const year = note.data.date.getUTCFullYear();
		const bucket = grouped.get(year) ?? [];
		bucket.push(note);
		grouped.set(year, bucket);
	}

	return [...grouped.entries()];
}
