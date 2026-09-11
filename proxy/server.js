import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
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
