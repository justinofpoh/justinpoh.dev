import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TEAM_URL = 'https://protege.vc/our-team/';
const outputPath = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'public',
	'protege-team.html',
);

const redirectHtml = `<!doctype html>
<meta charset="utf-8" />
<meta http-equiv="refresh" content="0;url=${TEAM_URL}" />
<title>Protégé Ventures</title>
<script>location.replace(${JSON.stringify(TEAM_URL)})</script>
`;

function stripScripts(html) {
	return html.replace(/<script\b[\s\S]*?<\/script>/gi, '');
}

function activateTeamTab(html) {
	const teamTab = html.match(
		/<a href="#([^"]+)" role="tab" data-toggle="tab">The Team<\/a>/,
	);
	const foundersTab = html.match(
		/<a href="#([^"]+)" role="tab" data-toggle="tab">Founders<\/a>/,
	);
	if (!teamTab || !foundersTab) return html;

	const teamId = teamTab[1];
	const foundersId = foundersTab[1];

	html = html.replace(
		`<li class="active"><a href="#${foundersId}" role="tab" data-toggle="tab">Founders</a></li>`,
		`<li><a href="#${foundersId}" role="tab" data-toggle="tab">Founders</a></li>`,
	);
	html = html.replace(
		`<li ><a href="#${teamId}" role="tab" data-toggle="tab">The Team</a></li>`,
		`<li class="active"><a href="#${teamId}" role="tab" data-toggle="tab">The Team</a></li>`,
	);
	html = html.replace(
		`id="${foundersId}" class="tab-pane transition fade in active"`,
		`id="${foundersId}" class="tab-pane transition fade"`,
	);
	html = html.replace(
		`id="${teamId}" class="tab-pane transition fade"`,
		`id="${teamId}" class="tab-pane transition fade in active"`,
	);
	return html;
}

function markJustinCard(html) {
	return html.replace(
		/<div class="wpsm_team_2_member_wrapper">(\s*<img\b[^>]*\balt="Justin Poh")/,
		'<div class="wpsm_team_2_member_wrapper" id="justin-poh">$1',
	);
}

function injectJump(html) {
	const extras = `
<base href="${TEAM_URL}">
<meta name="robots" content="noindex, nofollow" />
<style>
	.loading-screen { display: none !important; }
	.page-wrap,
	.site-header,
	.site-header.navbar-lateral { opacity: 1 !important; visibility: visible !important; }
	body { overflow-y: auto !important; }
	.tab-pane { display: none !important; }
	.tab-pane.active { display: block !important; }
	#justin-poh { scroll-margin-top: 7rem; }
</style>
<script>
	function jumpToJustinPoh() {
		var card = document.getElementById('justin-poh');
		if (!card) {
			var headings = document.querySelectorAll('h3');
			for (var i = 0; i < headings.length; i++) {
				if (headings[i].textContent.replace(/\\s+/g, ' ').trim() === 'Justin Poh') {
					card = headings[i].closest('.wpsm_team_2_member_wrapper') || headings[i];
					break;
				}
			}
		}
		if (card) card.scrollIntoView({ block: 'center' });
	}
	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', jumpToJustinPoh);
	} else {
		jumpToJustinPoh();
	}
	window.addEventListener('load', function () {
		jumpToJustinPoh();
		setTimeout(jumpToJustinPoh, 400);
	});
</script>
`;
	if (html.includes('</head>')) {
		return html.replace('</head>', `${extras}</head>`);
	}
	return extras + html;
}

try {
	const response = await fetch(TEAM_URL, {
		headers: {
			'user-agent':
				'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36',
			accept: 'text/html',
		},
	});
	if (!response.ok) {
		throw new Error(`Failed to fetch team page: ${response.status}`);
	}

	let html = await response.text();
	html = stripScripts(html);
	html = activateTeamTab(html);
	html = markJustinCard(html);
	html = injectJump(html);

	if (!html.includes('id="justin-poh"')) {
		throw new Error('Could not find Justin Poh profile card');
	}

	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, html);
	console.log(`Wrote ${outputPath}`);
} catch (error) {
	console.warn(error instanceof Error ? error.message : error);
	await mkdir(dirname(outputPath), { recursive: true });
	await writeFile(outputPath, redirectHtml);
	console.warn('Falling back to a redirect to the live team page');
}
