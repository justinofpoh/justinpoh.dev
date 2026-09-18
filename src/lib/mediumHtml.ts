export const SITE_ORIGIN = 'https://www.justinpoh.dev';

export function stripFrontmatter(source: string) {
	return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

export function noteToMediumHtml(markdown: string) {
	const fences: string[] = [];
	let source = markdown.replace(/\r\n/g, '\n').trim();

	source = source.replace(/```[a-zA-Z0-9]*\n([\s\S]*?)```/g, (_, code: string) => {
		const escaped = escapeHtml(code.replace(/\t/g, '  ').replace(/\n$/, ''));
		const index = fences.push(`<pre><code>${escaped}\n</code></pre>`) - 1;
		return `\n\n%%FENCE${index}%%\n\n`;
	});

	source = source.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, href: string) => {
		return `<img src="${escapeAttr(absoluteUrl(href))}" alt="${escapeAttr(alt)}">`;
	});

	const blocks = source
		.split(/\n{2,}/)
		.map((block) => block.trim())
		.filter(Boolean)
		.map((block) => {
			const fence = block.match(/^%%FENCE(\d+)%%$/);
			if (fence) return fences[Number(fence[1])];
			if (block.startsWith('<img ')) return block;

			if (block.split('\n').every((line) => line.startsWith('>'))) {
				const paragraphs = block
					.split('\n')
					.map((line) => line.replace(/^>\s?/, ''))
					.join('\n')
					.split(/\n{2,}/)
					.map((part) => part.replace(/\n/g, ' ').trim())
					.filter(Boolean)
					.map((part) => `<p>${inline(part)}</p>`)
					.join('');
				return `<blockquote>${paragraphs}</blockquote>`;
			}

			return `<p>${inline(block.replace(/\n/g, ' '))}</p>`;
		});

	return blocks.join('\n');
}

function inline(text: string) {
	const codes: string[] = [];
	let source = text.replace(/`([^`]+)`/g, (_, code: string) => {
		const index = codes.push(`<code>${escapeHtml(code)}</code>`) - 1;
		return `%%CODE${index}%%`;
	});

	source = escapeHtml(source);
	source = source.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
	source = source.replace(/\*([^*]+)\*/g, '<em>$1</em>');
	return source.replace(/%%CODE(\d+)%%/g, (_, index: string) => codes[Number(index)]);
}

function absoluteUrl(href: string) {
	if (/^https?:\/\//i.test(href)) return href;
	return `${SITE_ORIGIN}${href.startsWith('/') ? href : `/${href}`}`;
}

function escapeHtml(value: string) {
	return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(value: string) {
	return escapeHtml(value).replace(/"/g, '&quot;');
}
