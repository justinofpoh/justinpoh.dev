import type { CollectionEntry } from 'astro:content';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatNoteDateISO(date: Date) {
	return date.toISOString().slice(0, 10);
}

export function formatNoteDate(date: Date) {
	return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

export function formatNoteTags(tags: string[]) {
	return tags.map((tag) => `#${tag}`).join(', ');
}

export function noteHref(note: CollectionEntry<'notes'>) {
	return note.data.external ?? `/notes/${note.id}`;
}

export function noteExcerpt(body: string, sentenceCount = 2) {
	const paragraph = body
		.replace(/\r\n/g, '\n')
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.find((block) => block && !/^[#>`!\-\[]/.test(block) && !block.startsWith('```'));

	if (!paragraph) return '';

	const text = paragraph.replace(/\s+/g, ' ');
	const sentences = text.match(/[^.!?]+[.!?]+/g);
	if (!sentences) return text;
	return sentences.slice(0, sentenceCount).map((sentence) => sentence.trim()).join(' ');
}

export function pickFeaturedNote(notes: CollectionEntry<'notes'>[]) {
	const dated = [...notes].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());
	return dated.find((note) => note.data.featured) ?? dated[0];
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
