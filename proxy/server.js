import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const gnMathAssetsDirectory = "/tmp/sleek-games-sources/gn-assets";
const gnMathCoversDirectory = "/tmp/sleek-games-sources/gn-covers";
const gnMathHtmlDirectory = "/tmp/sleek-games-sources/gn-html";
const defaultExternalGamesDirectories = [
	"/tmp/sleek-games-sources/seraph/games",
	"/tmp/sleek-games-sources/selenite-old",
	...Array.from({ length: 7 }, (_value, index) => `/tmp/sleek-games-sources/part${index + 1}`),
];
const configuredGamesDirectories = String(process.env.SLEEK_GAMES_DIRECTORIES || "")
	.split(path.delimiter)
	.map((directory) => directory.trim())
	.filter(Boolean);
const gamesDirectories = [...new Set([
	...configuredGamesDirectories,
	...defaultExternalGamesDirectories.filter((directory) => fs.existsSync(directory)),
	path.join(publicDirectory, "games"),
])].filter((directory) => fs.existsSync(directory));

function findGameEntry(directory) {
	const candidates = ["index.html", "game.html", "play.html"];
	for (const candidate of candidates) {
		if (fs.existsSync(path.join(directory, candidate))) return candidate;
	}
	const htmlFile = fs.readdirSync(directory, { withFileTypes: true })
		.find((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".html"));
	return htmlFile?.name || null;
}

	function findGameCover(directory, entryFile, rootDirectory) {
	const preferredNames = /cover|splash|thumb|thumbnail|poster|preview|screenshot|title|logo|portrait|landscape/i;
	const genericNames = /unity|webgl|crewmate|sheet|favicon|apple|touch|sprite|loading|progress|background|^icon(?:[-_.]|$)|logo[-_]?dark|appicon|titlebg|tittle/i;
	const imageFiles = [];
	const entryPath = path.join(directory, entryFile);
	const entryHtml = fs.readFileSync(entryPath, "utf8");
	const rootCandidates = [
		path.join(directory, "images", "thumbnails"),
		path.join(rootDirectory, "images", "thumbnails"),
		path.join(path.dirname(rootDirectory), "images", "thumbnails"),
	];
	for (const thumbnailsDirectory of rootCandidates) {
		for (const extension of [".png", ".jpg", ".jpeg", ".webp", ".svg"]) {
			const candidate = path.join(thumbnailsDirectory, `${path.basename(directory)}${extension}`);
			if (fs.existsSync(candidate)) return candidate;
		}
	}
	const catalogCover = findCatalogCover(rootDirectory, path.basename(directory));
	if (catalogCover && !genericNames.test(path.basename(catalogCover))) return catalogCover;
	const metadataReferences = [];
	for (const match of entryHtml.matchAll(/<(?:meta|link)\b[^>]*(?:property|name|rel)=["'][^"']*(?:image|thumbnail|cover|poster)[^"']*["'][^>]*(?:content|href)=["']([^"']+)["'][^>]*>/gi)) {
		metadataReferences.push(match[1]);
	}
	for (const match of entryHtml.matchAll(/<(?:meta|link)\b[^>]*(?:content|href)=["']([^"']+\.(?:png|jpe?g|webp|svg)(?:\?[^"']*)?)["'][^>]*>/gi)) {
		metadataReferences.push(match[1]);
	}
	for (const reference of metadataReferences) {
		if (/^(?:https?:|data:|\/\/)/i.test(reference)) continue;
		const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]).replace(/^\.\//, "").replace(/^\//, "");
		if (genericNames.test(path.basename(cleanReference))) continue;
		const candidate = path.resolve(directory, cleanReference);
			const allowedRoots = [directory, rootDirectory, path.dirname(rootDirectory)].map((value) => `${path.resolve(value)}${path.sep}`);
			if (allowedRoots.some((allowedRoot) => candidate.startsWith(allowedRoot)) && fs.existsSync(candidate)) return candidate;
	}
	function visit(currentDirectory, depth) {
		if (depth > 2) return;
		for (const entry of fs.readdirSync(currentDirectory, { withFileTypes: true })) {
			if (entry.name.startsWith(".")) continue;
			const entryPath = path.join(currentDirectory, entry.name);
			if (entry.isDirectory()) visit(entryPath, depth + 1);
			else if (/\.(png|jpe?g|webp|svg)$/i.test(entry.name)) imageFiles.push(entryPath);
		}
	}
	visit(directory, 0);
	const usableImages = imageFiles.filter((image) => !genericNames.test(path.basename(image)));
	return usableImages.sort((left, right) => {
		const leftName = path.basename(left);
		const rightName = path.basename(right);
		const leftScore = genericNames.test(leftName) ? 3 : preferredNames.test(leftName) ? 0 : 1;
		const rightScore = genericNames.test(rightName) ? 3 : preferredNames.test(rightName) ? 0 : 1;
		return leftScore - rightScore || left.localeCompare(right);
	})[0] || null;
}

const catalogCoverCache = new Map();
function findCatalogCover(rootDirectory, directoryName) {
	if (!catalogCoverCache.has(rootDirectory)) {
		const catalog = new Map();
		const gamesIndex = path.join(rootDirectory, "index.html");
		if (fs.existsSync(gamesIndex)) {
			const html = fs.readFileSync(gamesIndex, "utf8");
			for (const match of html.matchAll(/href=["']([^"']+)\/[^"']*["'][\s\S]{0,700}?background-image:\s*url\((?:["']?)([^)"']+)/gi)) {
				catalog.set(decodeURIComponent(match[1].replace(/\/$/, "")), match[2]);
			}
		}
		const gamesJson = path.join(rootDirectory, "games.json");
		if (fs.existsSync(gamesJson)) {
			try {
				for (const game of JSON.parse(fs.readFileSync(gamesJson, "utf8"))) {
					if (game?.directory && game?.image) catalog.set(game.directory, game.image);
				}
			} catch {}
		}
		catalogCoverCache.set(rootDirectory, catalog);
	}
	const reference = catalogCoverCache.get(rootDirectory).get(directoryName);
	if (!reference || /^(?:https?:|data:|\/\/)/i.test(reference)) return null;
	const cleanReference = decodeURIComponent(reference.split(/[?#]/)[0]).replace(/^\.\//, "");
	const candidates = [
		path.resolve(rootDirectory, directoryName, cleanReference),
		path.resolve(rootDirectory, cleanReference),
		path.resolve(path.dirname(rootDirectory), cleanReference),
	];
	return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

function discoverGames() {
	const games = [];
	for (const [sourceIndex, rootDirectory] of gamesDirectories.entries()) {
		for (const entry of fs.readdirSync(rootDirectory, { withFileTypes: true })) {
			if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
			const entryFile = findGameEntry(path.join(rootDirectory, entry.name));
			if (!entryFile) continue;
			const gameDirectory = path.join(rootDirectory, entry.name);
			const coverFile = findGameCover(gameDirectory, entryFile, rootDirectory);
			const isBundled = rootDirectory === path.join(publicDirectory, "games");
			const relativePath = isBundled
				? `/games/${entry.name}/${entryFile}`
				: `/games-source/${sourceIndex}/${encodeURIComponent(entry.name)}/${entryFile}`;
			const coverFileRoot = coverFile && path.resolve(coverFile).startsWith(`${path.resolve(rootDirectory)}${path.sep}`)
				? rootDirectory
				: coverFile && path.dirname(rootDirectory);
			const coverPath = coverFile
				? isBundled
					? `/games/${entry.name}/${path.relative(gameDirectory, coverFile).split(path.sep).map(encodeURIComponent).join("/")}`
					: coverFileRoot === rootDirectory
						? `/games-source/${sourceIndex}/${encodeURIComponent(entry.name)}/${path.relative(gameDirectory, coverFile).split(path.sep).map(encodeURIComponent).join("/")}`
						: `/games-source-assets/${sourceIndex}/${path.relative(path.dirname(rootDirectory), coverFile).split(path.sep).map(encodeURIComponent).join("/")}`
				: null;
			games.push({
				title: entry.name.replace(/[-_]+/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
				description: "Ported HTML game from the SLEEK library.",
				category: "library",
				label: "Ported",
				path: relativePath,
				cover: coverPath,
				icon: "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"16\" height=\"16\" fill=\"currentColor\" class=\"bi bi-controller\" viewBox=\"0 0 16 16\">",
			});
		}
	}
	return games;
}

function discoverGnMathGames() {
	const zonesPath = path.join(gnMathAssetsDirectory, "zones.json");
	if (!fs.existsSync(zonesPath) || !fs.existsSync(gnMathHtmlDirectory) || !fs.existsSync(gnMathCoversDirectory)) return [];
	let zones;
	try {
		zones = JSON.parse(fs.readFileSync(zonesPath, "utf8"));
	} catch {
		return [];
	}
	return zones.flatMap((zone) => {
		if (!zone || zone.id < 0 || typeof zone.name !== "string") return [];
		const htmlFile = String(zone.url || "").replace("{HTML_URL}/", "");
		const coverFile = String(zone.cover || "").replace("{COVER_URL}/", "");
		if (!htmlFile || !coverFile || !fs.existsSync(path.join(gnMathHtmlDirectory, htmlFile)) || !fs.existsSync(path.join(gnMathCoversDirectory, coverFile))) return [];
		return [{
			title: zone.name,
			description: zone.author ? `Ported by ${zone.author}.` : "Gn-Math ported game.",
			category: "gn-math",
			label: "Gn-Math",
			path: `/gn-math-games/${htmlFile.split(path.sep).map(encodeURIComponent).join("/")}`,
			cover: `/gn-math-covers/${coverFile.split(path.sep).map(encodeURIComponent).join("/")}`,
			icon: "<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-controller" viewBox="0 0 16 16">",
		}];
	});
}

const gnMathCatalog = discoverGnMathGames();
const gamesCatalog = gnMathCatalog.length ? gnMathCatalog : discoverGames();

for (const [sourceIndex, directory] of gamesDirectories.entries()) {
	if (directory === path.join(publicDirectory, "games")) continue;
	app.use(`/games-source/${sourceIndex}`, express.static(directory, { index: false }));
	app.use(`/games-source-assets/${sourceIndex}`, express.static(path.dirname(directory), { index: false }));
}
if (gnMathCatalog.length) {
	app.use("/gn-math-games", express.static(gnMathHtmlDirectory, { index: false }));
	app.use("/gn-math-covers", express.static(gnMathCoversDirectory, { index: false }));
}
app.get(["/", "/index.html"], (_req, res) => {
	const indexPath = path.join(publicDirectory, "index.html");
	const html = fs.readFileSync(indexPath, "utf8");
	const catalogScript = `<script>window.__SLEEK_GAMES_CATALOG__=${JSON.stringify(gamesCatalog)};</script>`;
	res.set("Cache-Control", "no-store, no-cache, must-revalidate");
	res.type("html").send(html.replace("</head>", `${catalogScript}</head>`));
});
app.get("/api/games/catalog", (_req, res) => res.json(gamesCatalog));
const normalizeSearchText = (value) => String(value || "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

const extractYouTubeVideoRenderer = (value) => {
	if (!value || typeof value !== "object") return [];
	const renderers = [];
	if (Array.isArray(value)) {
		for (const item of value) renderers.push(...extractYouTubeVideoRenderer(item));
		return renderers;
	}
	if (value.videoRenderer) renderers.push(value.videoRenderer);
	for (const item of Object.values(value)) renderers.push(...extractYouTubeVideoRenderer(item));
	return renderers;
};

const parseYouTubeSearchFallback = (html) => {
	const match = html.match(/ytInitialData\s*=\s*(\{.*?\});?<\//s) || html.match(/var ytInitialData\s*=\s*(\{.*?\});?\s*<\/script>/s);
	if (!match) return [];
	try {
		const data = JSON.parse(match[1]);
		const renderers = extractYouTubeVideoRenderer(data);
		return renderers
			.filter((renderer) => renderer?.videoId)
			.map((renderer) => ({
				id: renderer.videoId,
				title: renderer.title?.runs?.map((run) => run.text).join("") || renderer.title?.accessibility?.accessibilityData?.label || "Untitled",
				channel: renderer.longBylineText?.runs?.map((run) => run.text).join("") || renderer.ownerText?.runs?.map((run) => run.text).join("") || "YouTube",
				thumbnail: renderer.thumbnail?.thumbnails?.at(-1)?.url || renderer.thumbnail?.thumbnails?.[0]?.url || "",
			}))
			.filter((item, index, items) => items.findIndex((candidate) => candidate.id === item.id) === index);
	} catch {
		return [];
	}
};

const searchYouTubeFallback = async (query) => {
	const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} music`)}`;
	const response = await fetch(searchUrl, {
		headers: {
			Accept: "text/html,application/xhtml+xml",
			"User-Agent": "Mozilla/5.0 (compatible; SLEEK/1.0; +https://localhost)",
		},
	});
	if (!response.ok) throw new Error(`YouTube search failed with status ${response.status}`);
	const html = await response.text();
	const results = parseYouTubeSearchFallback(html);
	if (!results.length) return [];
	const normalizedQuery = normalizeSearchText(query);
	return results
		.map((item) => ({ ...item, title: item.title || "Untitled", channel: item.channel || "YouTube" }))
		.sort((left, right) => {
			const score = (item) => {
				const title = normalizeSearchText(item.title);
				const artist = normalizeSearchText(item.channel);
				if (title === normalizedQuery) return 0;
				if (title.startsWith(normalizedQuery)) return 1;
				if (title.includes(normalizedQuery)) return 2;
				if (artist === normalizedQuery) return 3;
				if (artist.includes(normalizedQuery)) return 4;
				return 5;
			};
			return score(left) - score(right);
		});
};

app.get("/api/music/search", async (req, res) => {
	const query = String(req.query.q || "").trim();
	if (!query) return res.status(400).json({ error: "A search query is required." });
	const apiKey = process.env.YOUTUBE_API_KEY;

	try {
		let results;
		if (apiKey) {
			const params = new URLSearchParams({ part: "snippet", q: `${query} music`, type: "video", maxResults: "25", safeSearch: "strict", key: apiKey });
			const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
				headers: { Accept: "application/json", "User-Agent": "SLEEKIFY/1.0" },
			});
			const payload = await response.json();
			if (!response.ok) return res.status(response.status).json({ error: payload.error?.message || "YouTube search failed." });
			results = (payload.items || []).flatMap((item) => item.id?.videoId ? [{
				id: item.id.videoId,
				title: item.snippet?.title || "Untitled",
				channel: item.snippet?.channelTitle || "YouTube",
				thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
			}] : []).filter((item, index, list) => list.findIndex((candidate) => candidate.id === item.id) === index);
		} else {
			results = await searchYouTubeFallback(query);
			if (!results.length) return res.status(404).json({ error: "No music results found." });
		}
		const normalizedQuery = normalizeSearchText(query);
		results.sort((left, right) => {
			const score = (item) => {
				const title = normalizeSearchText(item.title);
				const artist = normalizeSearchText(item.channel);
				if (title === normalizedQuery) return 0;
				if (title.startsWith(normalizedQuery)) return 1;
				if (title.includes(normalizedQuery)) return 2;
				if (artist === normalizedQuery) return 3;
				if (artist.includes(normalizedQuery)) return 4;
				return 5;
			};
			return score(left) - score(right);
		});
		res.json(results);
	} catch (error) {
		res.status(502).json({ error: error instanceof Error ? error.message : "Music search failed." });
	}
});

app.use((req, res, next) => {
	if (routeRequest(req, res)) return;
	next();
});
app.use(express.static(publicDirectory));

const server = http.createServer(app);

server.on("upgrade", routeUpgrade);

const port = Number(process.env.PORT || 3030);

server.listen(port, () => {
	console.log(`Server is running on port ${port}`);
});
