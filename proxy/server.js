import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import { bootstrap } from "@mercuryworkshop/proxy-bootstrap";

const { routeRequest, routeUpgrade } = await bootstrap();

const app = express();
const publicDirectory = path.join(path.dirname(fileURLToPath(import.meta.url)), "public");
const normalizeSearchText = (value) => String(value || "").toLocaleLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

app.get("/api/music/search", async (req, res) => {
	const query = String(req.query.q || "").trim();
	if (!query) return res.status(400).json({ error: "A search query is required." });
	const apiKey = process.env.YOUTUBE_API_KEY;
	if (!apiKey) return res.status(503).json({ error: "Set YOUTUBE_API_KEY to search YouTube." });

	try {
		const params = new URLSearchParams({ part: "snippet", q: `${query} music`, type: "video", maxResults: "25", safeSearch: "strict", key: apiKey });
		const response = await fetch(`https://www.googleapis.com/youtube/v3/search?${params}`, {
			headers: { Accept: "application/json", "User-Agent": "SLEEKIFY/1.0" },
		});
		const payload = await response.json();
		if (!response.ok) return res.status(response.status).json({ error: payload.error?.message || "YouTube search failed." });
		const normalizedQuery = normalizeSearchText(query);
		const results = (payload.items || []).flatMap((item) => item.id?.videoId ? [{
			id: item.id.videoId,
			title: item.snippet?.title || "Untitled",
			channel: item.snippet?.channelTitle || "YouTube",
			thumbnail: item.snippet?.thumbnails?.medium?.url || item.snippet?.thumbnails?.default?.url || "",
		}]: []).filter((item, index, results) => results.findIndex((candidate) => candidate.id === item.id) === index);
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
