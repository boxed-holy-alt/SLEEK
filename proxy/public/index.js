const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const frameWrapper = document.getElementById("sj-frame-wrapper");
const loadingScreen = document.getElementById("sj-loading");
const tabsElement = document.getElementById("sj-tabs");
const framesElement = document.getElementById("sj-frames");
const newTabButton = document.getElementById("sj-new-tab");
const settingsButton = document.getElementById("sj-settings");
const settingsPanel = document.getElementById("sj-settings-panel");
const accountButton = document.getElementById("sj-account");
const accountPanel = document.getElementById("sj-account-panel");
const accountName = document.getElementById("sj-account-name");
const accountNameLabel = document.getElementById("sj-account-name-label");
const accountAvatar = document.getElementById("sj-account-avatar");
const accountAvatarFile = document.getElementById("sj-account-avatar-file");
const historyList = document.getElementById("sj-history-list");
const historyToggle = document.getElementById("sj-history-toggle");
const homeClock = document.getElementById("sj-home-clock");
const incognitoToggle = document.getElementById("sj-incognito-toggle");
const languageSelect = document.getElementById("sj-language-select");
const clockSelect = document.getElementById("sj-clock-select");
const accountClock = document.getElementById("sj-account-clock");
const particlesToggle = document.getElementById("sj-particles-toggle");
const animationsToggle = document.getElementById("sj-animations-toggle");
const compactToggle = document.getElementById("sj-compact-toggle");
const brandName = document.getElementById("sj-brand-name");
const themeUpload = document.getElementById("sj-theme-upload");
const themeUploadStatus = document.getElementById("sj-theme-upload-status");
const closeSettings = () => (settingsPanel.hidden = true);
const cloakOptions = [
	{ id: "sleek", name: "SLEEK", title: "SLEEK", favicon: "/sleek-logo.png" },
	{ id: "google", name: "Google", title: "Google", favicon: "https://www.google.com/favicon.ico" },
	{ id: "khan", name: "Khan Academy", title: "Khan Academy", favicon: "https://www.khanacademy.org/favicon.ico" },
	{ id: "coursera", name: "Coursera", title: "Coursera", favicon: "https://www.coursera.org/favicon.ico" },
	{ id: "Canvas", name: "Canvas", title: "Dashboard", favicon: "https://parents.canvaslms.com/favicon.ico" },
	{ id: "wikipedia", name: "Wikipedia", title: "Wikipedia", favicon: "https://www.wikipedia.org/static/favicon/wikipedia.ico" },
	{ id: "ixl", name: "IXL", title: "Student Dashboard", favicon: "https://www.ixl.com/favicon.ico" },
	{ id: "desmos", name: "Desmos", title: "Desmos | Beautiful Math", favicon: "https://www.desmos.com/favicon.ico" },
	{ id: "quizlet", name: "Quizlet", title: "Quizlet", favicon: "https://quizlet.com/favicon.ico" },
	{ id: "kahoot", name: "Kahoot!", title: "Kahoot!", favicon: "https://favicon.run/favicon?domain=kahoot.com&sz=32" },
	{ id: "edpuzzle", name: "Edpuzzle", title: "Edpuzzle", favicon: "https://favicon.run/favicon?domain=edpuzzle.com&sz=32" },
	{ id: "schoology", name: "Schoology", title: "Schoology", favicon: "https://favicon.run/favicon?domain=schoology.com&sz=32" },
];
const applyCloak = (cloakId) => {
	const option = cloakOptions.find((item) => item.id === cloakId) || cloakOptions[0];
	document.title = option.title;
	let favicon = document.querySelector('link[data-sleek-favicon], link[rel="icon"]');
	if (!favicon) {
		favicon = document.createElement("link");
		favicon.rel = "icon";
		favicon.dataset.sleekFavicon = "true";
		document.head.append(favicon);
	}
	favicon.type = option.id === "sleek" ? "image/png" : "image/x-icon";
	favicon.href = option.favicon;
	localStorage.setItem("sleek-cloak", option.id);
	document.querySelectorAll("[data-cloak]").forEach((item) => item.classList.toggle("active", item.dataset.cloak === option.id));
};
const tabAddress = document.getElementById("sj-tab-address");
const tabSearchEngine = document.getElementById("sj-tab-search-engine");
const backButton = document.getElementById("sj-back");
const forwardButton = document.getElementById("sj-forward");
const reloadButton = document.getElementById("sj-reload");
const homeButton = document.getElementById("sj-home");
const bookmarkButton = document.getElementById("sj-bookmark");
const error = document.getElementById("sj-error");
const errorCode = document.getElementById("sj-error-code");
const searchEngine = document.getElementById("sj-search-engine");
const quickLinks = document.getElementById("sj-quick-links");
const savedBar = document.getElementById("sj-saved-bar");
const savedLinks = document.getElementById("sj-saved-links");
const musicButton = document.getElementById("sj-music-button");
const toolsPanel = document.getElementById("sj-tools-panel");
const musicPage = document.getElementById("sj-music-page");
const musicClose = document.getElementById("sj-music-close");
const gamesPage = document.getElementById("sj-games-page");
const slickPage = document.getElementById("sj-slick-page");
const slickClose = document.getElementById("sj-slick-close");
const slickForm = document.getElementById("sj-slick-form");
const slickInput = document.getElementById("sj-slick-input");
const slickImage = document.getElementById("sj-slick-image");
const slickAttachment = document.getElementById("sj-slick-attachment");
const slickAttachmentPreview = document.getElementById("sj-slick-attachment-preview");
const slickAttachmentName = document.getElementById("sj-slick-attachment-name");
const slickAttachmentRemove = document.getElementById("sj-slick-attachment-remove");
const slickMessages = document.getElementById("sj-slick-messages");
const slickStatus = document.getElementById("sj-slick-status");
const slickChatList = document.getElementById("sj-slick-chat-list");
const slickNewChat = document.getElementById("sj-slick-new-chat");
const slickSidebarToggle = document.getElementById("sj-slick-sidebar-toggle");
const slickChatSearch = document.getElementById("sj-slick-search");
const slickGreeting = document.getElementById("sj-slick-greeting");
const gamesClose = document.getElementById("sj-games-close");
const gamesQuery = document.getElementById("sj-games-query");
const gamesStatus = document.getElementById("sj-games-status");
const gamesGrid = document.getElementById("sj-games-grid");
const gameStage = document.getElementById("sj-game-stage");
const gameStageFrame = document.getElementById("sj-game-stage-frame");
const gameStageTitle = document.getElementById("sj-game-stage-title");
const gameStageBack = document.getElementById("sj-game-stage-back");
const gameStageFullscreen = document.getElementById("sj-game-stage-fullscreen");
const nowPlaying = document.getElementById("sj-now-playing");
const playerChannel = document.getElementById("sj-player-channel");
const youtubePlayerElement = document.getElementById("sj-youtube-player");
const musicSearch = document.getElementById("sj-music-search");
const musicSubmit = document.getElementById("sj-music-submit");
const musicQuery = document.getElementById("sj-music-query");
const musicStatus = document.getElementById("sj-music-status");
const musicResults = document.getElementById("sj-music-results");
const miniPlayer = document.getElementById("sj-mini-player");
const miniPlayerHandle = document.getElementById("sj-mini-player-handle");
const miniClose = document.getElementById("sj-mini-close");
const miniPlayerFab = document.getElementById("sj-mini-player-fab");
const miniTitle = document.getElementById("sj-mini-title");
const miniArtist = document.getElementById("sj-mini-artist");
const miniCurrentTime = document.getElementById("sj-mini-current-time");
const miniTotalTime = document.getElementById("sj-mini-total-time");
const miniProgressFill = document.getElementById("sj-mini-progress-fill");
const miniToggle = document.getElementById("sj-mini-toggle");
const miniPrev = document.getElementById("sj-mini-prev");
const miniNext = document.getElementById("sj-mini-next");
const playlistContainer = document.getElementById("sj-playlists");
const newPlaylistButton = document.getElementById("sj-create-playlist");
const playlistPrompt = document.getElementById("sj-playlist-prompt");
const playlistNameInput = document.getElementById("sj-playlist-name-input");
const playlistConfirmButton = document.getElementById("sj-playlist-confirm");
const playlistCancelButton = document.getElementById("sj-playlist-cancel");
let youtubePlayer;
let youtubeReady;
let musicQueue = [];
let musicQueueIndex = -1;
let miniPlayerTicker = null;
const PLAYLISTS_KEY = "sleek-playlists";
const LIKED_SONGS_KEY = "sleek-liked-songs";
let playlists = [];
let likedSongs = [];

let controller;
let activeTab;
let tabCounter = 0;
const tabs = [];
let initPromise;
const homeAddress = "sleek://home";
const musicAddress = "sleek://music";
const gamesAddress = "sleek://games";
const slickAddress = "sleek://slick";
const fallbackControllerIcon = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-controller" viewBox="0 0 16 16" aria-hidden="true"><path d="M11.5 6.027a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-1.5 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m2.5-.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0m-1.5 1.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1m-6.5-3h1v1h1v1h-1v1h-1v-1h-1v-1h1z"/><path d="M3.051 3.26a.5.5 0 0 1 .354-.613l1.932-.518a.5.5 0 0 1 .62.39c.655-.079 1.35-.117 2.043-.117.72 0 1.443.041 2.12.126a.5.5 0 0 1 .622-.399l1.932.518a.5.5 0 0 1 .306.729q.211.136.373.297c.408.408.78 1.05 1.095 1.772.32.733.599 1.591.805 2.466s.34 1.78.364 2.606c.024.816-.059 1.602-.328 2.21a1.42 1.42 0 0 1-1.445.83c-.636-.067-1.115-.394-1.513-.773-.245-.232-.496-.526-.739-.808-.126-.148-.25-.292-.368-.423-.728-.804-1.597-1.527-3.224-1.527s-2.496.723-3.224 1.527c-.119.131-.242.275-.368.423-.243.282-.494.575-.739.808-.398.38-.877.706-1.513.773a1.42 1.42 0 0 1-1.445-.83c-.27-.608-.352-1.395-.329-2.21.024-.826.16-1.73.365-2.606.206-.875.486-1.733.805-2.466.315-.722.687-1.364 1.094-1.772a2.3 2.3 0 0 1 .433-.335l-.028-.079zm2.036.412c-.877.185-1.469.443-1.733.708-.276.276-.587.783-.885 1.465a14 14 0 0 0-.748 2.295 12.4 12.4 0 0 0-.339 2.406c-.022.755.062 1.368.243 1.776a.42.42 0 0 0 .426.24c.327-.034.61-.199.929-.502.212-.202.4-.423.615-.674.133-.156.276-.323.44-.504C4.861 9.969 5.978 9.027 8 9.027s3.139.942 3.965 1.855c.164.181.307.348.44.504.214.251.403.472.615.674.318.303.601.468.929.503a.42.42 0 0 0 .426-.241c.18-.408.265-1.02.243-1.776a12.4 12.4 0 0 0-.339-2.406 14 14 0 0 0-.748-2.295c-.298-.682-.61-1.19-.885-1.465-.264-.265-.856-.523-1.733-.708-.85-.179-1.877-.27-2.913-.27s-2.063.091-2.913.27"/></svg>';
const ACCOUNT_KEY = "sleek-account";
const HISTORY_KEY = "sleek-history";
const HISTORY_ENABLED_KEY = "sleek-history-enabled";
const LANGUAGE_KEY = "sleek-language";
const CLOCK_FORMAT_KEY = "sleek-clock-format";
let account;
let browsingHistory;
let historyEnabled = localStorage.getItem(HISTORY_ENABLED_KEY) !== "false";
let incognitoMode = false;
let language = localStorage.getItem(LANGUAGE_KEY) || "en";
let clockFormat = localStorage.getItem(CLOCK_FORMAT_KEY) || "24";
try {
	account = JSON.parse(localStorage.getItem(ACCOUNT_KEY) || '{"name":"Guest","avatar":"\\uF4D7"}');
	if (!account || typeof account !== "object") throw new Error();
} catch {
	account = { name: "Guest", avatar: "\uF4D7" };
}
try {
	browsingHistory = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
	if (!Array.isArray(browsingHistory)) throw new Error();
} catch {
	browsingHistory = [];
}
const defaultQuickLinks = [
	{ title: "YouTube", url: "https://www.youtube.com", favicon: "https://www.youtube.com/favicon.ico" },
	{ title: "GitHub", url: "https://github.com", favicon: "https://github.com/favicon.ico" },
	{ title: "Incinerate+", url: "https://incinerateplus.opik.net/", favicon: "https://incinerateplus.opik.net/favicon.png" },
	{ title: "TikTok", url: "https://www.tiktok.com", favicon: "https://www.tiktok.com/favicon.ico" },
	{ title: "Discord", url: "https://discord.com", favicon: "https://favicon.run/favicon?domain=discord.com&sz=32" },
	{ title: "Spotify", url: "https://open.spotify.com", favicon: "https://open.spotify.com/favicon.ico" },
	{ title: "Reddit", url: "https://www.reddit.com", favicon: "https://www.reddit.com/favicon.ico" },
	{ title: "Google", url: "https://www.google.com", favicon: "https://www.google.com/favicon.ico" },
];
const favoriteUrls = new Map();
function canonicalizeUrl(url) {
	try {
		const parsed = new URL(url);
		parsed.hash = "";
		if (parsed.pathname === "/") parsed.pathname = "/";
		return parsed.href;
	} catch {
		return url;
	}
}
try {
	const savedFavorites = JSON.parse(localStorage.getItem("sleek-favorites") || "[]");
	if (Array.isArray(savedFavorites)) {
		for (const favorite of savedFavorites) {
			if (Array.isArray(favorite) && favorite.length === 2 && favorite[1]?.url) {
				const url = canonicalizeUrl(favorite[1].url);
				favoriteUrls.set(url, { ...favorite[1], url });
			} else if (favorite?.url) {
				const url = canonicalizeUrl(favorite.url);
				favoriteUrls.set(url, { ...favorite, url });
			}
		}
	}
} catch {
	localStorage.removeItem("sleek-favorites");
}
function toggleBookmark(event) {
	event.preventDefault();
	event.stopPropagation();
	const url = canonicalizeUrl(getBookmarkUrl() || "");
	if (!url) return;
	if (favoriteUrls.has(url)) favoriteUrls.delete(url);
	else {
		const details = siteDetails(url);
		favoriteUrls.set(url, { title: details.title, url, favicon: details.favicon });
	}
	saveFavorites();
	updateBookmarkState();
	renderQuickLinks();
}
bookmarkButton.addEventListener("click", toggleBookmark);
function saveFavorites() {
	localStorage.setItem("sleek-favorites", JSON.stringify([...favoriteUrls]));
}
const friendlySiteNames = {
	"youtube.com": "YouTube",
	"github.com": "GitHub",
	"google.com": "Google",
	"discord.com": "Discord",
	"spotify.com": "Spotify",
	"reddit.com": "Reddit",
	"tiktok.com": "TikTok",
};
function siteDetails(url, fallbackTitle = "") {
	try {
		const parsed = new URL(url);
		const hostname = parsed.hostname.replace(/^www\./i, "");
		return {
			title:
				friendlySiteNames[hostname] ||
				(fallbackTitle && fallbackTitle !== parsed.hostname
					? fallbackTitle
					: hostname),
			favicon: `${parsed.origin}/favicon.ico`,
		};
	} catch {
		return { title: fallbackTitle || "Saved page", favicon: "" };
	}
}
function saveAccount() {
	localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
}
function saveHistory() {
	localStorage.setItem(HISTORY_KEY, JSON.stringify(browsingHistory));
}
function updateAccountClock() {
	const now = new Date();
	const formattedTime = now.toLocaleTimeString(language === "es" ? "es-ES" : "en-US", {
		hour: "2-digit",
		minute: "2-digit",
		hour12: clockFormat === "12",
	});
	if (accountClock) accountClock.textContent = formattedTime;
	if (homeClock) homeClock.textContent = formattedTime;
}
function startClockUpdates() {
	if (window.__sleekClockInterval) return;
	window.__sleekClockInterval = window.setInterval(() => {
		updateAccountClock();
	}, 1000);
}
function applyLanguage() {
	document.documentElement.lang = language;
}
function sanitizePlaylistList(value) {
	if (!Array.isArray(value)) return [];
	return value.filter((playlist) => {
		if (!playlist || typeof playlist !== "object") return false;
		if (typeof playlist.name !== "string") return false;
		const normalizedName = playlist.name.trim();
		return normalizedName && !["Liked songs", "Your likes"].includes(normalizedName) && Array.isArray(playlist.tracks);
	});
}
function loadPlaylists() {
	try {
		const raw = localStorage.getItem(PLAYLISTS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		playlists = sanitizePlaylistList(parsed);
		localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
	} catch {
		playlists = [];
		localStorage.setItem(PLAYLISTS_KEY, JSON.stringify([]));
	}
}
function savePlaylists() {
	localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}
function loadLikedSongs() {
	try {
		const raw = localStorage.getItem(LIKED_SONGS_KEY);
		const parsed = raw ? JSON.parse(raw) : [];
		likedSongs = Array.isArray(parsed) ? parsed : [];
	} catch {
		likedSongs = [];
	}
}
function saveLikedSongs() {
	localStorage.setItem(LIKED_SONGS_KEY, JSON.stringify(likedSongs));
}
function isTrackLiked(track) {
	return Boolean(track && likedSongs.some((entry) => entry?.id === track.id));
}
function toggleLikedSong(track) {
	if (!track) return false;
	const index = likedSongs.findIndex((entry) => entry?.id === track.id);
	if (index >= 0) {
		likedSongs.splice(index, 1);
		saveLikedSongs();
		return false;
	}
	likedSongs.unshift({ id: track.id, title: track.title, channel: track.channel, thumbnail: track.thumbnail || "" });
	saveLikedSongs();
	return true;
}
function createPlaylist(name) {
	const safeName = String(name || "").trim();
	if (!safeName) return;
	if (playlists.some((playlist) => playlist.name.toLowerCase() === safeName.toLowerCase())) return;
	playlists.unshift({ name: safeName, tracks: [] });
	savePlaylists();
	renderPlaylists();
}
function addTrackToPlaylist(playlistName, track) {
	const target = playlists.find((playlist) => playlist.name === playlistName);
	if (!target || !track) return;
	if (target.tracks.some((item) => item.id === track.id)) return;
	target.tracks.push({
		id: track.id,
		title: track.title,
		channel: track.channel,
		thumbnail: track.thumbnail || "",
	});
	savePlaylists();
	renderPlaylists();
}
function renderPlaylists() {
	if (!playlistContainer) return;
	playlistContainer.replaceChildren();
	if (!playlists.length) {
		const empty = document.createElement("div");
		empty.className = "playlist-card";
		empty.innerHTML = "<h4>No playlists yet</h4><small>Create one to save tracks.</small>";
		playlistContainer.append(empty);
		return;
	}
	for (const playlist of playlists) {
		const card = document.createElement("div");
		card.className = "playlist-card";
		card.innerHTML = `
			<h4>${playlist.name}</h4>
			<small>${playlist.tracks.length} track${playlist.tracks.length === 1 ? "" : "s"}</small>
			<div class="playlist-card-actions">
				<button type="button" data-playlist-name="${playlist.name}">Play</button>
				<button type="button" data-save-current="${playlist.name}">Save current</button>
			</div>
		`;
		const playButton = card.querySelector("[data-playlist-name]");
		const saveButton = card.querySelector("[data-save-current]");
		playButton.addEventListener("click", () => {
			if (!playlist.tracks.length) return;
			musicQueue = playlist.tracks;
			musicQueueIndex = 0;
			playMusicResult(playlist.tracks[0], playlist.tracks);
		});
		saveButton.addEventListener("click", () => {
			if (!musicQueue.length || musicQueueIndex < 0) return;
			addTrackToPlaylist(playlist.name, musicQueue[musicQueueIndex]);
		});
		playlistContainer.append(card);
	}
}
function renderAccount() {
	accountName.value = account.name || "Guest";
	accountNameLabel.textContent = account.name || "Guest";
	accountAvatar.textContent = account.avatar?.startsWith("data:") ? "" : "\uF4D7";
	accountAvatar.parentElement.style.backgroundImage = account.avatar?.startsWith("data:")
		? `url(${account.avatar})`
		: "none";
	accountAvatar.parentElement.classList.toggle("has-image", account.avatar?.startsWith("data:") === true);
	historyToggle.checked = historyEnabled;
	incognitoToggle.checked = incognitoMode;
	languageSelect.value = language;
	clockSelect.value = clockFormat;
	updateAccountClock();
	historyList.replaceChildren();
	if (!browsingHistory.length) {
		const empty = document.createElement("span");
		empty.className = "history-empty";
		empty.textContent = "No browsing history yet";
		historyList.append(empty);
		return;
	}
	for (const item of browsingHistory) {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "history-item";
		button.title = item.url;
		button.innerHTML = `<strong>${item.title}</strong><small>${new URL(item.url).hostname}</small>`;
		button.addEventListener("click", () => {
			accountPanel.hidden = true;
			navigate(item.url).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
		});
		historyList.append(button);
	}
}
function recordHistory(url) {
	if (!historyEnabled || incognitoMode) return;
	const details = siteDetails(url);
	browsingHistory = [
		{ url, title: details.title, visitedAt: Date.now() },
		...browsingHistory.filter((item) => item.url !== url),
	].slice(0, 50);
	saveHistory();
}
function addSiteLink(container, link) {
	const details = siteDetails(link.url, link.title);
	const button = document.createElement("button");
	button.type = "button";
	button.className = container === savedLinks ? "saved-link" : "quick-link";
	button.title = link.url;
	button.dataset.quickUrl = link.url;
	const icon = document.createElement("img");
	icon.className = "quick-link-icon";
	icon.src = link.favicon || details.favicon;
	icon.alt = "";
	icon.onerror = () => {
		const fallback = document.createElement("span");
		fallback.className = "site-fallback-icon";
		fallback.textContent = "🌐";
		icon.replaceWith(fallback);
	};
	button.append(icon, document.createTextNode(details.title));
	if (container === savedLinks) {
		const item = document.createElement("div");
		item.className = "saved-item";
		const remove = document.createElement("button");
		remove.type = "button";
		remove.className = "saved-remove";
		remove.title = "Remove from Saved";
		remove.setAttribute("aria-label", `Remove ${details.title} from Saved`);
		remove.textContent = "×";
		remove.addEventListener("click", (event) => {
			event.preventDefault();
			event.stopPropagation();
			favoriteUrls.delete(canonicalizeUrl(link.url));
			saveFavorites();
			renderQuickLinks();
			updateBookmarkState();
		});
		item.append(button, remove);
		container.append(item);
	} else {
		container.append(button);
	}
}
function renderQuickLinks() {
	quickLinks.replaceChildren();
	const heading = document.createElement("p");
	heading.className = "quick-links-heading";
	heading.textContent = "Quick links";
	quickLinks.append(heading);
	const list = document.createElement("div");
	list.className = "quick-links-list";
	defaultQuickLinks.forEach((link) => {
		addSiteLink(list, link);
	});
	quickLinks.append(list);
	renderSavedLinks();
}
function renderSavedLinks() {
	savedLinks.replaceChildren();
	const hasSaved = favoriteUrls.size > 0;
	savedBar.hidden = !hasSaved;
	document.body.classList.toggle("has-saved", hasSaved);
	for (const link of favoriteUrls.values()) {
		addSiteLink(savedLinks, link);
	}
	requestAnimationFrame(() => {
		document.body.style.setProperty(
			"--saved-bar-height",
			hasSaved ? `${savedBar.getBoundingClientRect().bottom}px` : "120px",
		);
	});
}
function getBookmarkUrl() {
	const rawUrl = activeTab?.url || tabAddress.value;
	if (!/^https?:\/\//i.test(rawUrl)) return null;
	try {
		return canonicalizeUrl(rawUrl);
	} catch {
		return null;
	}
}
function updateBookmarkState() {
	const url = getBookmarkUrl();
	const saved = Boolean(url && favoriteUrls.has(url));
	bookmarkButton.classList.toggle("saved", saved);
	bookmarkButton.textContent = saved ? "★" : "☆";
	bookmarkButton.setAttribute("aria-pressed", String(saved));
}
const openQuickLink = (event) => {
	const link = event.target.closest("[data-quick-url]");
	if (!link) return;
	event.preventDefault();
	navigate(link.dataset.quickUrl).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
};
quickLinks.addEventListener("click", openQuickLink);
savedLinks.addEventListener("click", openQuickLink);
document.body.classList.add("is-home");
renderQuickLinks();
function showHome(tab) {
	const targetTab = tab || activeTab || createTab();
	musicPage.hidden = true;
	gamesPage.hidden = true;
	slickPage.hidden = true;
	gameStage.hidden = true;
	gameStageFrame.src = "about:blank";
	document.body.classList.add("is-home");
	document.body.classList.remove("music-open", "games-open");
	if (targetTab.frameElement) targetTab.frameElement.src = "about:blank";
	targetTab.url = homeAddress;
	targetTab.button.querySelector(".sj-tab-title").textContent = "New tab";
	address.value = "";
	tabAddress.value = homeAddress;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
	activeTab = targetTab;
	updateBookmarkState();
}
function showMusic(tab) {
	const targetTab = tab || activeTab || createTab();
	gamesPage.hidden = true;
	slickPage.hidden = true;
	gameStage.hidden = true;
	gameStageFrame.src = "about:blank";
	document.body.classList.remove("is-home", "games-open");
	document.body.classList.add("music-open");
	toolsPanel.hidden = true;
	musicButton.setAttribute("aria-expanded", "false");
	musicPage.hidden = false;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
	if (targetTab.frameElement) targetTab.frameElement.src = "about:blank";
	targetTab.url = musicAddress;
	targetTab.button.querySelector(".sj-tab-title").textContent = "Music";
	address.value = "";
	tabAddress.value = musicAddress;
	activeTab = targetTab;
	updateBookmarkState();
}
function showGamesPage(tab) {
	const targetTab = tab || activeTab || createTab();
	document.body.classList.remove("is-home", "music-open");
	document.body.classList.add("games-open");
	toolsPanel.hidden = true;
	musicButton.setAttribute("aria-expanded", "false");
	musicPage.hidden = true;
	slickPage.hidden = true;
	gamesPage.hidden = false;
	gameStage.hidden = true;
	gameStageFrame.src = "about:blank";
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
	if (targetTab.frameElement) targetTab.frameElement.src = "about:blank";
	targetTab.url = gamesAddress;
	targetTab.button.querySelector(".sj-tab-title").textContent = "Games";
	address.value = "";
	tabAddress.value = gamesAddress;
	activeTab = targetTab;
	updateBookmarkState();
	renderGames();
	void loadGamesCatalog();
}
function showSlick(tab) {
	const targetTab = tab || activeTab || createTab();
	document.body.classList.remove("is-home", "music-open", "games-open");
	document.body.classList.add("slick-open");
	toolsPanel.hidden = true;
	musicButton.setAttribute("aria-expanded", "false");
	musicPage.hidden = true;
	gamesPage.hidden = true;
	slickPage.hidden = false;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
	if (targetTab.frameElement) targetTab.frameElement.src = "about:blank";
	targetTab.url = slickAddress;
	targetTab.button.querySelector(".sj-tab-title").textContent = "Slick";
	address.value = "";
	tabAddress.value = slickAddress;
	activeTab = targetTab;
	updateBookmarkState();
	resizeSlickWaves();
	if (!slickWaveFrame) slickWaveFrame = window.requestAnimationFrame(animateSlickWaves);
}
let realGames = Array.isArray(window.__SLEEK_GAMES_CATALOG__) ? window.__SLEEK_GAMES_CATALOG__ : [];
function syncGamesMenuIcon() {
	const menuIcon = document.querySelector('[data-panel-route="sleek://games"] .tool-icon');
	if (menuIcon) menuIcon.innerHTML = '<i class="bi bi-controller" aria-hidden="true"></i>';
}
syncGamesMenuIcon();
async function loadGamesCatalog() {
	if (realGames.length) {
		if (gamesStatus) gamesStatus.textContent = `${realGames.length} ported games available locally in SLEEK.`;
		syncGamesMenuIcon();
		renderGames();
		return;
	}
	try {
		const response = await fetch("/api/games/catalog");
		if (!response.ok) throw new Error(`Games catalog returned ${response.status}`);
		const catalog = await response.json();
		if (Array.isArray(catalog) && catalog.length) {
			realGames = catalog;
			syncGamesMenuIcon();
			if (gamesStatus) gamesStatus.textContent = `${catalog.length} ported games available locally in SLEEK.`;
			renderGames();
		}
	} catch (error) {
		console.warn("Could not load the extended games catalog", error);
	}
}
function launchGame(game) {
	if (!gameStage || !gameStageFrame) return;
	gamesGrid.hidden = true;
	gameStage.hidden = false;
	gameStageTitle.textContent = game.title;
	gamesStatus.textContent = `${game.title} is running locally inside SLEEK.`;
	gameStageFrame.src = game.path;
	gameStageFrame.focus();
}
function closeGame() {
	if (document.fullscreenElement) void document.exitFullscreen?.();
	gameStage.hidden = true;
	gameStageFrame.src = "about:blank";
	gamesGrid.hidden = false;
	gamesStatus.textContent = "Choose a game. Every title runs from SLEEK's local game library.";
}
function renderGames() {
	if (!gamesGrid) return;
	const query = String(gamesQuery?.value || "").trim().toLocaleLowerCase();
	const selectedFilter = document.querySelector(".games-filter.active")?.dataset.gameFilter || "all";
	const visibleGames = realGames.filter((game) => {
		const matchesFilter = selectedFilter === "all" || game.category === selectedFilter;
		const searchText = `${game.title} ${game.description} ${game.label}`.toLocaleLowerCase();
		return matchesFilter && (!query || searchText.includes(query));
	});
	gamesGrid.replaceChildren();
	if (!visibleGames.length) {
		const empty = document.createElement("p");
		empty.className = "games-empty";
		empty.textContent = "No games match that search.";
		gamesGrid.append(empty);
		return;
	}
	for (const game of visibleGames) {
		const card = document.createElement("article");
		card.className = "game-card";
		card.tabIndex = 0;
		card.setAttribute("role", "button");
		card.setAttribute("aria-label", `Play ${game.title}`);
		const cover = document.createElement("div");
		cover.className = "game-card-cover";
		const showGameIcon = () => {
			cover.replaceChildren();
			cover.innerHTML = '<i class="bi bi-controller" aria-hidden="true"></i>';
		};
		if (game.cover) {
			const image = document.createElement("img");
			image.src = game.cover;
			image.alt = `${game.title} cover`;
			image.loading = "lazy";
			image.addEventListener("error", showGameIcon, { once: true });
			cover.append(image);
		} else {
			showGameIcon();
		}
		const category = document.createElement("span");
		category.className = "game-card-category";
		category.textContent = game.label;
		const title = document.createElement("h3");
		title.textContent = game.title;
		const description = document.createElement("p");
		description.textContent = game.description;
		card.addEventListener("click", () => launchGame(game));
		card.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				launchGame(game);
			}
		});
		card.append(cover, title, category, description);
		gamesGrid.append(card);
	}
}
function showLoading() {
	loadingScreen.hidden = false;
}
async function init() {
	if (initPromise) return initPromise;
	initPromise = (async () => {
		if (!activeTab) createTab();
		controller = await initBootstrap();
		for (const tab of tabs) attachFrame(tab);
	})().catch((startupError) => {
		initPromise = null;
		throw startupError;
	});
	return initPromise;
}

function attachFrame(tab) {
	if (tab.frame) return;
	const watcher = new $scramjetUtils.UrlWatcherPlugin((url) => {
		const resolvedUrl = String(url || "");
		const isCustomRoute = tab.url === homeAddress || tab.url === musicAddress || tab.url === gamesAddress;
		if (!resolvedUrl || /^about:blank$/i.test(resolvedUrl)) {
			if (isCustomRoute) {
				if (tab === activeTab) {
					address.value = "";
					tabAddress.value = tab.url;
					updateBookmarkState();
				}
				return;
			}
			tab.url = "";
			if (tab === activeTab) {
				address.value = "";
				tabAddress.value = homeAddress;
			}
			return;
		}
		tab.url = resolvedUrl;
		if (tab === activeTab) {
			address.value = "";
			tabAddress.value = resolvedUrl;
			updateBookmarkState();
		}
	});
	tab.frame = controller.createFrame(tab.frameElement, { plugins: [new $scramjetUtils.HttpCachePlugin(), watcher, new $scramjetUtils.CatchEscapedLinksPlugin((url) => new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin))] });
	tab.frameElement.addEventListener("load", () => { loadingScreen.hidden = true; }, { once: false });
}

function createTab() {
	const button = tabs.length === 0 ? document.getElementById("sj-home-tab") : document.createElement("button");
	const tab = { button, frameElement: document.createElement("iframe"), frame: null, url: "" };
	tab.button.className = "sj-tab";
	tab.button.type = "button";
	tab.button.innerHTML = '<span class="sj-tab-title">New tab</span><span class="sj-tab-close" aria-label="Close tab">&times;</span>';
	tab.button.addEventListener("click", (event) => {
		if (event.target.closest(".sj-tab-close")) return closeTab(tab);
		selectTab(tab);
	});
	if (!tab.button.isConnected) tabsElement.insertBefore(tab.button, newTabButton);
	tab.frameElement.title = "SLEEK tab";
	framesElement.append(tab.frameElement);
	tabs.push(tab);
	selectTab(tab);
	showHome(tab);
	if (controller) attachFrame(tab);
	return tab;
}

function selectTab(tab) {
	activeTab = tab;
	for (const item of tabs) {
		item.button.classList.toggle("active", item === tab);
		item.frameElement.classList.toggle("active", item === tab);
	}
	const route = tab?.url || homeAddress;
	address.value = "";
	tabAddress.value = route;
	updateBookmarkState();
	document.body.classList.toggle("is-home", route === homeAddress || !tab?.url);
}

function closeTab(tab) {
	if (tabs.length === 1) return;
	const index = tabs.indexOf(tab);
	tabs.splice(index, 1);
	tab.button.remove();
	tab.frameElement.remove();
	if (tab === activeTab) selectTab(tabs[Math.max(0, index - 1)]);
}

function showErrorScreen(message, details) {
	frameWrapper.style.display = "none";
	error.textContent = message;
	errorCode.textContent = details;
}

async function navigate(url) {
	if (!controller) {
		await init();
	}
	if (!activeTab) createTab();
	url = url.trim();
	if (!url || incognitoMode) return;
	if (url.toLowerCase() === homeAddress) {
		showHome(activeTab);
		return;
	}
	if (url.toLowerCase() === musicAddress) {
		showMusic(activeTab);
		return;
	}
	if (url.toLowerCase() === gamesAddress) {
		showGamesPage(activeTab);
		return;
	}
	if (url.toLowerCase() === slickAddress) {
		showSlick(activeTab);
		return;
	}
	gamesPage.hidden = true;
	document.body.classList.remove("is-home", "games-open");
	if (!/^[a-z][a-z\d+.-]*:\/\//i.test(url)) {
		const looksLikeHost = url.includes(".") || url.startsWith("localhost:") || url.startsWith("[");
		if (looksLikeHost) url = `https://${url}`;
		else url = (searchEngine?.value || tabSearchEngine?.value || "https://duckduckgo.com/?q=%s").replace("%s", encodeURIComponent(url));
	}
	if (!activeTab.frame) {
		showErrorScreen("The browser is still starting. Try again in a moment.", "Scramjet frame is not ready.");
		return;
	}
	activeTab.url = url;
	recordHistory(url);
	address.value = "";
	tabAddress.value = url;
	activeTab.frame.go(url);
	activeTab.button.querySelector(".sj-tab-title").textContent = new URL(url).hostname;
	frameWrapper.style.display = "flex";
	showLoading();
}

form.addEventListener("submit", (event) => {
	event.preventDefault();
	void navigate(address.value).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
});

newTabButton.addEventListener("click", () => {
	createTab();
});

settingsButton.addEventListener("click", () => {
	settingsPanel.hidden = !settingsPanel.hidden;
});
accountButton.addEventListener("click", () => {
	accountPanel.hidden = !accountPanel.hidden;
	if (!accountPanel.hidden) renderAccount();
});
document.getElementById("sj-account-close").addEventListener("click", () => {
	accountPanel.hidden = true;
});
accountPanel.addEventListener("click", (event) => {
	if (event.target === accountPanel) accountPanel.hidden = true;
});
accountName.addEventListener("input", () => {
	account.name = accountName.value.trim() || "Guest";
	accountNameLabel.textContent = account.name;
	slickGreeting.textContent = getSlickGreeting();
	saveAccount();
});
historyToggle.addEventListener("change", () => {
	historyEnabled = historyToggle.checked;
	localStorage.setItem(HISTORY_ENABLED_KEY, String(historyEnabled));
});
incognitoToggle.addEventListener("change", () => {
	incognitoMode = incognitoToggle.checked;
	document.body.classList.toggle("incognito-mode", incognitoMode);
	updateBookmarkState();
});
languageSelect.addEventListener("change", () => {
	language = languageSelect.value;
	localStorage.setItem(LANGUAGE_KEY, language);
	applyLanguage();
	updateAccountClock();
});
clockSelect.addEventListener("change", () => {
	clockFormat = clockSelect.value;
	localStorage.setItem(CLOCK_FORMAT_KEY, clockFormat);
	updateAccountClock();
});
accountAvatarFile.addEventListener("change", () => {
	const file = accountAvatarFile.files?.[0];
	if (!file || !file.type.startsWith("image/")) return;
	const reader = new FileReader();
	reader.addEventListener("load", () => {
		if (typeof reader.result !== "string") return;
		account.avatar = reader.result;
		saveAccount();
		renderAccount();
	});
	reader.readAsDataURL(file);
});
document.getElementById("sj-clear-history").addEventListener("click", () => {
	browsingHistory = [];
	saveHistory();
	renderAccount();
});
document.getElementById("sj-settings-close").addEventListener("click", closeSettings);
settingsPanel.addEventListener("click", (event) => {
	if (event.target === settingsPanel) closeSettings();
});
particlesToggle.addEventListener("change", () => {
	document.body.classList.toggle("particles-off", !particlesToggle.checked);
});
animationsToggle.addEventListener("change", () => document.body.classList.toggle("animations-off", !animationsToggle.checked));
compactToggle.addEventListener("change", () => document.body.classList.toggle("compact-home", compactToggle.checked));
const settingsNav = document.querySelector(".settings-nav");
const settingsPages = document.querySelector(".settings-pages");
const resetHomeButton = document.getElementById("sj-reset-home");
if (resetHomeButton) {
	resetHomeButton.closest(".settings-info-row")?.removeAttribute("hidden");
}
settingsNav.insertAdjacentHTML("afterbegin", '<button class="settings-nav-item" type="button" data-settings-page="general">General</button>');
settingsPages.insertAdjacentHTML("afterbegin", `<section class="settings-page" data-settings-page-content="general"><p class="settings-page-label">General</p><h3>Cloaking</h3><p class="settings-about">Choose a familiar identity for this tab.</p><div class="cloak-options">${cloakOptions.map((item) => `<button class="cloak-choice" type="button" data-cloak="${item.id}"><img src="${item.favicon}" alt="" /> <span>${item.name}</span></button>`).join("")}</div><div class="panic-settings"><div class="panic-setting"><span><strong>Panic key</strong><small>Press any key to leave this page instantly.</small></span><button id="sj-panic-key" class="settings-action" type="button">Set key</button></div><label class="panic-setting panic-destination"><span><strong>Panic destination</strong><small>Where the panic key should send you.</small></span><input id="sj-panic-url" type="url" placeholder="https://www.google.com" /></label><p id="sj-panic-status" class="settings-status">No panic key set.</p></div></section>`);
for (const button of document.querySelectorAll("[data-settings-page]")) { button.addEventListener("click", () => { const page = button.dataset.settingsPage; document.querySelectorAll("[data-settings-page]").forEach((item) => item.classList.toggle("active", item === button)); document.querySelectorAll("[data-settings-page-content]").forEach((item) => item.classList.toggle("active", item.dataset.settingsPageContent === page)); }); }
for (const button of document.querySelectorAll("[data-theme-choice]")) { button.addEventListener("click", () => { document.body.dataset.theme = button.dataset.themeChoice; document.querySelectorAll("[data-theme-choice]").forEach((item) => item.classList.toggle("active", item === button)); }); }
for (const button of document.querySelectorAll("[data-accent]")) { button.addEventListener("click", () => { const accent = button.dataset.accent; document.body.style.setProperty("--accent", accent); document.querySelectorAll(".logo-wrapper h1").forEach((item) => { item.style.color = accent; }); document.querySelectorAll("[data-accent]").forEach((item) => item.classList.toggle("active", item === button)); }); }
brandName.addEventListener("input", () => { document.querySelectorAll(".logo-wrapper h1").forEach((item) => item.textContent = brandName.value.trim() || "SLEEK"); });
themeUpload.addEventListener("change", () => { const file = themeUpload.files[0]; if (!file) return; themeUploadStatus.textContent = `${file.name} ready to import.`; if (file.name.endsWith(".json")) { const reader = new FileReader(); reader.onload = () => { try { const theme = JSON.parse(reader.result); if (theme.accent) document.body.style.setProperty("--accent", theme.accent); if (theme.name) { brandName.value = theme.name; document.querySelectorAll(".logo-wrapper h1").forEach((item) => item.textContent = theme.name); } themeUploadStatus.textContent = `${file.name} applied.`; } catch { themeUploadStatus.textContent = "Invalid theme JSON."; } }; reader.readAsText(file); } });
for (const button of document.querySelectorAll("[data-density-choice]")) { button.addEventListener("click", () => { document.body.dataset.density = button.dataset.densityChoice; document.querySelectorAll("[data-density-choice]").forEach((item) => item.classList.toggle("active", item === button)); }); }
for (const button of document.querySelectorAll("[data-cloak]")) button.addEventListener("click", () => applyCloak(button.dataset.cloak));
applyCloak(localStorage.getItem("sleek-cloak") || "sleek");
const panicKeyButton = document.getElementById("sj-panic-key");
const panicUrlInput = document.getElementById("sj-panic-url");
const panicStatus = document.getElementById("sj-panic-status");
let panicKey = localStorage.getItem("sleek-panic-key") || "";
panicUrlInput.value = localStorage.getItem("sleek-panic-url") || "https://www.google.com";
const updatePanicStatus = () => { panicStatus.textContent = panicKey ? `Panic key: ${panicKey}` : "No panic key set."; panicKeyButton.textContent = panicKey || "Set key"; };
panicUrlInput.addEventListener("change", () => { try { const url = new URL(panicUrlInput.value); if (!/^https?:$/.test(url.protocol)) throw new Error(); localStorage.setItem("sleek-panic-url", url.href); panicStatus.textContent = `Destination saved: ${url.hostname}`; } catch { panicStatus.textContent = "Use a valid http:// or https:// URL."; } });
panicKeyButton.addEventListener("click", () => { panicKeyButton.textContent = "Press any key..."; panicStatus.textContent = "Press the key you want to use."; const capture = (event) => { event.preventDefault(); event.stopPropagation(); panicKey = event.key; localStorage.setItem("sleek-panic-key", panicKey); updatePanicStatus(); window.removeEventListener("keydown", capture, true); }; window.addEventListener("keydown", capture, true); });
window.addEventListener("keydown", (event) => { if (panicKey && event.key === panicKey && !event.repeat) { const destination = localStorage.getItem("sleek-panic-url") || panicUrlInput.value; try { const url = new URL(destination); if (/^https?:$/.test(url.protocol)) window.location.assign(url.href); } catch {} } });
updatePanicStatus();
const engineButtons = document.querySelectorAll("[data-engine]");
const savedEngine = localStorage.getItem("sleek-search-engine");
const initialEngine = savedEngine && [...engineButtons].some((button) => button.dataset.engine === savedEngine) ? savedEngine : searchEngine.value;
searchEngine.value = initialEngine;
tabSearchEngine.value = initialEngine;
for (const button of engineButtons) {
	button.classList.toggle("active", button.dataset.engine === initialEngine);
	button.addEventListener("click", () => {
		const engine = button.dataset.engine;
		searchEngine.value = engine;
		tabSearchEngine.value = engine;
		localStorage.setItem("sleek-search-engine", engine);
		engineButtons.forEach((item) => item.classList.toggle("active", item === button));
	});
}
if (resetHomeButton) {
	resetHomeButton.addEventListener("click", () => navigate(homeAddress));
}
const tabAddressBar = document.getElementById("sj-tab-address-bar");
if (tabAddressBar) {
	tabAddressBar.addEventListener("submit", (event) => {
		event.preventDefault();
		address.value = tabAddress.value;
		navigate(tabAddress.value).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
	});
}

backButton.addEventListener("click", () => activeTab?.frame.back());
forwardButton.addEventListener("click", () => activeTab?.frame.forward());
reloadButton.addEventListener("click", () => activeTab?.frame.reload());
homeButton.addEventListener("click", () => openSleekPage(homeAddress));
if (musicButton) {
	musicButton.addEventListener("click", () => {
		toolsPanel.hidden = !toolsPanel.hidden;
		musicButton.setAttribute("aria-expanded", String(!toolsPanel.hidden));
	});
}
function openSleekPage(route) {
	const nextRoute = String(route || "").trim();
	if (!nextRoute) return;
	if (nextRoute === homeAddress) {
		showHome(activeTab || createTab());
		toolsPanel.hidden = true;
		musicButton.setAttribute("aria-expanded", "false");
		return;
	}
	if (nextRoute === musicAddress) {
		showMusic(activeTab || createTab());
		toolsPanel.hidden = true;
		musicButton.setAttribute("aria-expanded", "false");
		return;
	}
	if (nextRoute === gamesAddress) {
		showGamesPage(activeTab || createTab());
		toolsPanel.hidden = true;
		musicButton.setAttribute("aria-expanded", "false");
		return;
	}
	if (nextRoute === slickAddress) {
		showSlick(activeTab || createTab());
		toolsPanel.hidden = true;
		musicButton.setAttribute("aria-expanded", "false");
		return;
	}
	toolsPanel.hidden = true;
	musicButton.setAttribute("aria-expanded", "false");
	navigate(nextRoute).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
}
for (const page of toolsPanel.querySelectorAll("[data-panel-route]")) {
	page.addEventListener("click", () => {
		const route = page.dataset.panelRoute;
		openSleekPage(route);
	});
}
musicClose.addEventListener("click", () => openSleekPage(homeAddress));
gamesClose.addEventListener("click", () => openSleekPage(homeAddress));
slickClose?.addEventListener("click", () => openSleekPage(homeAddress));

const slickMenuButton = document.createElement("button");
slickMenuButton.type = "button";
slickMenuButton.dataset.panelRoute = slickAddress;
slickMenuButton.innerHTML = '<span class="tool-icon"><i class="bi bi-stars" aria-hidden="true"></i></span><span><strong>Slick</strong><small>Ask AI</small></span>';
toolsPanel.insertBefore(slickMenuButton, toolsPanel.querySelector('[data-panel-route="sleek://music"]'));
slickMenuButton.addEventListener("click", () => openSleekPage(slickAddress));

let slickConversation = [];
const slickChats = [];
let activeSlickChat = null;
let slickImageData = null;
const slickWaves = document.getElementById("sj-slick-waves");
const slickWaveContext = slickWaves?.getContext("2d");
let slickWaveFrame = 0;
let slickWaveSize = { width: 0, height: 0 };
let slickWaveFrameTime = 0;
const slickStars = Array.from({ length: 320 }, (_, index) => ({
	x: (((index * 47) % 110) - 55) / 100,
	y: (((index * 83) % 110) - 55) / 100,
	z: 0.65 + ((index * 37) % 35) / 100,
	speed: 0.22 + (index % 5) * 0.035,
}));
function resizeSlickWaves() {
	if (!slickWaves || !slickWaveContext) return;
	const bounds = slickWaves.getBoundingClientRect();
	const ratio = Math.min(window.devicePixelRatio || 1, 2);
	slickWaveSize = { width: bounds.width, height: bounds.height };
	slickWaves.width = Math.max(1, Math.floor(bounds.width * ratio));
	slickWaves.height = Math.max(1, Math.floor(bounds.height * ratio));
	slickWaveContext.setTransform(ratio, 0, 0, ratio, 0, 0);
}
function animateSlickWaves(time) {
	if (!slickWaveContext || !slickWaves || !document.body.classList.contains("slick-open")) {
		slickWaveFrame = 0;
		return;
	}
	const { width, height } = slickWaveSize;
	if (!width || !height) resizeSlickWaves();
	slickWaveContext.clearRect(0, 0, width, height);
	const frameDelta = Math.min(40, slickWaveFrameTime ? time - slickWaveFrameTime : 16);
	slickWaveFrameTime = time;
	const centerX = width / 2;
	const centerY = height / 2;
	const perspective = Math.min(width, height) * 0.9;
	for (const star of slickStars) {
		const previousZ = Math.min(1, star.z + star.speed * 0.055);
		star.z -= star.speed * frameDelta / 1000;
		const projectedX = centerX + (star.x / star.z) * perspective;
		const projectedY = centerY + (star.y / star.z) * perspective;
		if (star.z <= 0.03 || projectedX < -120 || projectedX > width + 120 || projectedY < -120 || projectedY > height + 120) {
			star.z = 1;
			star.x = (((star.x * 173 + 41) % 110) - 55) / 100;
			star.y = (((star.y * 137 + 67) % 110) - 55) / 100;
		}
		if (projectedX < -80 || projectedX > width + 80 || projectedY < -80 || projectedY > height + 80) continue;
		const previousX = centerX + (star.x / previousZ) * perspective;
		const previousY = centerY + (star.y / previousZ) * perspective;
		const depth = 1 - star.z;
		const radius = 0.65 + depth * 2.4;
		slickWaveContext.beginPath();
		slickWaveContext.moveTo(previousX, previousY);
		slickWaveContext.lineTo(projectedX, projectedY);
		slickWaveContext.strokeStyle = `rgba(255, 255, 255, ${0.18 + depth * 0.62})`;
		slickWaveContext.lineWidth = radius;
		slickWaveContext.stroke();
	}
	slickWaveFrame = window.requestAnimationFrame(animateSlickWaves);
}
function ensureSlickStarfield() {
	resizeSlickWaves();
	if (!slickWaveFrame) slickWaveFrame = window.requestAnimationFrame(animateSlickWaves);
}
window.addEventListener("resize", resizeSlickWaves);
ensureSlickStarfield();
function clearSlickAttachment() {
	if (slickImage) slickImage.value = "";
	slickImageData = null;
	if (slickAttachment) slickAttachment.hidden = true;
	if (slickAttachmentPreview) slickAttachmentPreview.removeAttribute("src");
	if (slickAttachmentName) slickAttachmentName.textContent = "";
}
slickAttachmentRemove?.addEventListener("click", () => {
	clearSlickAttachment();
	slickStatus.textContent = "Powered by OpenRouter";
});
slickImage?.addEventListener("change", () => {
	const file = slickImage.files?.[0];
	if (!file) {
		clearSlickAttachment();
		slickStatus.textContent = "Powered by OpenRouter";
		return;
	}
	if (!file.type.startsWith("image/")) {
		clearSlickAttachment();
		slickStatus.textContent = "Please choose an image file.";
		return;
	}
	const reader = new FileReader();
	reader.addEventListener("load", () => {
		slickImageData = { name: file.name, dataUrl: String(reader.result || "") };
		if (slickAttachmentPreview) slickAttachmentPreview.src = slickImageData.dataUrl;
		if (slickAttachmentName) slickAttachmentName.textContent = file.name;
		if (slickAttachment) slickAttachment.hidden = false;
		slickStatus.textContent = `Image attached: ${file.name}`;
	});
	reader.readAsDataURL(file);
});
function renderSlickMarkdown(text) {
	const escaped = text.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character]));
	const inlineMarkdown = (line) => line
		.replace(/`([^`]+)`/g, "<code>$1</code>")
		.replace(/\*\*([^*\n]+)\*\*/g, "<strong>$1</strong>")
		.replace(/__([^_\n]+)__/g, "<strong>$1</strong>")
		.replace(/\*([^*\n]+)\*/g, "<em>$1</em>")
		.replace(/_([^_\n]+)_/g, "<em>$1</em>");
	return escaped.split("\n").map((line) => {
		const heading = line.match(/^(#{1,6})\s+(.+)$/);
		if (heading) return `<h${heading[1].length}>${inlineMarkdown(heading[2])}</h${heading[1].length}>`;
		return inlineMarkdown(line);
	}).join("\n");
}
function addSlickMessage(role, text, imageData = null) {
	const message = document.createElement("div");
	message.className = `slick-message slick-message-${role}`;
	const label = document.createElement("strong");
	label.textContent = role === "user" ? "You" : "Slick";
	const content = document.createElement("div");
	content.className = "slick-message-content";
	const textNode = document.createElement("div");
	if (role === "assistant") textNode.innerHTML = renderSlickMarkdown(text);
	else textNode.textContent = text;
	content.append(textNode);
	message.append(label, content);
	if (imageData && role === "user") {
		const group = document.createElement("div");
		group.className = "slick-message-user-group";
		const image = document.createElement("img");
		image.className = "slick-message-image";
		image.src = imageData.dataUrl;
		image.alt = imageData.name ? `Attached image: ${imageData.name}` : "Attached image";
		group.append(image, message);
		slickMessages.append(group);
	} else {
		slickMessages.append(message);
	}
	slickMessages.scrollTop = slickMessages.scrollHeight;
}
function addSlickThinking() {
	const message = document.createElement("div");
	message.className = "slick-message slick-message-assistant slick-thinking";
	const label = document.createElement("strong");
	label.textContent = "Slick";
	const content = document.createElement("div");
	content.className = "slick-message-content";
	content.innerHTML = '<span class="slick-thinking-label">Slick is thinking</span><span class="slick-thinking-dots" aria-label="Loading"><i></i><i></i><i></i></span>';
	message.append(label, content);
	slickMessages.append(message);
	slickMessages.scrollTop = slickMessages.scrollHeight;
	return message;
}
function resetSlickChatView() {
	slickMessages.replaceChildren();
	slickMessages.classList.add("slick-messages-empty");
	slickPage.classList.remove("slick-has-messages");
}
function getSlickGreeting() {
	return "Hi, what's on your mind?";
}
function renderSlickChatList() {
	slickChatList.replaceChildren();
	const query = slickChatSearch?.value.trim().toLowerCase() || "";
	for (const chat of slickChats.filter((item) => !query || item.title.toLowerCase().includes(query))) {
		const button = document.createElement("button");
		button.className = `slick-chat-item${chat === activeSlickChat ? " active" : ""}`;
		button.type = "button";
		button.innerHTML = '<i class="bi bi-chat-left-text" aria-hidden="true"></i><span></span>';
		button.querySelector("span").textContent = chat.title;
		button.addEventListener("click", () => selectSlickChat(chat));
		slickChatList.append(button);
	}
}
function selectSlickChat(chat) {
	if (!chat || chat === activeSlickChat && slickConversation === chat.messages) return;
	activeSlickChat = chat;
	slickConversation = chat.messages;
	slickMessages.replaceChildren();
	if (!chat.messages.length) {
		resetSlickChatView();
	} else {
		slickMessages.classList.remove("slick-messages-empty");
		slickPage.classList.add("slick-has-messages");
		for (const message of chat.messages) {
			if (message.role === "assistant") {
				addSlickMessage("assistant", message.content);
				continue;
			}
			if (Array.isArray(message.content)) {
				const textPart = message.content.find((part) => part.type === "text");
				const imagePart = message.content.find((part) => part.type === "image_url");
				addSlickMessage("user", textPart?.text || "Analyze this image.", imagePart ? { dataUrl: imagePart.image_url.url, name: "Attached image" } : null);
			} else {
				addSlickMessage("user", message.content);
			}
		}
	}
	renderSlickChatList();
}
function startSlickChat() {
	const chat = { id: crypto.randomUUID?.() || String(Date.now()), title: "New chat", messages: [] };
	slickChats.unshift(chat);
	selectSlickChat(chat);
}
slickGreeting.textContent = getSlickGreeting();
const firstSlickChat = { id: "first", title: "New chat", messages: slickConversation };
activeSlickChat = firstSlickChat;
slickChats.push(firstSlickChat);
renderSlickChatList();
slickNewChat.addEventListener("click", startSlickChat);
slickSidebarToggle?.addEventListener("click", () => {
	const collapsed = slickPage.classList.toggle("slick-sidebar-collapsed");
	slickSidebarToggle.setAttribute("aria-label", collapsed ? "Expand sidebar" : "Collapse sidebar");
	slickSidebarToggle.setAttribute("title", collapsed ? "Expand sidebar" : "Collapse sidebar");
});
slickChatSearch?.addEventListener("input", renderSlickChatList);
document.querySelectorAll("[data-slick-prompt]").forEach((prompt) => {
	prompt.addEventListener("click", () => {
		slickInput.value = prompt.dataset.slickPrompt || "";
		slickInput.focus();
	});
});
slickForm.addEventListener("submit", async (event) => {
	event.preventDefault();
	const content = slickInput.value.trim();
	if ((!content && !slickImageData) || slickForm.dataset.busy === "true") return;
	slickForm.dataset.busy = "true";
	slickMessages.classList.remove("slick-messages-empty");
	slickPage.classList.add("slick-has-messages");
	ensureSlickStarfield();
	slickInput.value = "";
	const attachedImage = slickImageData;
	clearSlickAttachment();
	addSlickMessage("user", content || (attachedImage ? "Analyze this image" : ""), attachedImage);
	const userMessage = attachedImage
		? { role: "user", content: [{ type: "text", text: content || "Analyze this image." }, { type: "image_url", image_url: { url: attachedImage.dataUrl } }] }
		: { role: "user", content };
	slickConversation.push(userMessage);
	if (activeSlickChat && activeSlickChat.title === "New chat") {
		activeSlickChat.title = (content || "Image conversation").slice(0, 32);
		renderSlickChatList();
	}
	const thinkingMessage = addSlickThinking();
	slickStatus.textContent = "Slick is thinking...";
	try {
		const response = await fetch("/api/slick/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: slickConversation }) });
		const payload = await response.json();
		if (!response.ok) throw new Error(payload.error || "Slick could not answer.");
		thinkingMessage.remove();
		addSlickMessage("assistant", payload.reply);
		slickConversation.push({ role: "assistant", content: payload.reply });
		slickStatus.textContent = "Powered by OpenRouter";
	} catch (error) {
		thinkingMessage.remove();
		addSlickMessage("assistant", error instanceof Error ? error.message : "Slick could not answer.");
		slickStatus.textContent = "Check your OpenRouter settings in .env.";
	} finally {
		slickForm.dataset.busy = "false";
		slickInput.focus();
	}
});
gameStageBack.addEventListener("click", closeGame);
gameStageFullscreen.addEventListener("click", () => {
		void (gameStage.requestFullscreen?.() || gameStageFrame.requestFullscreen?.());
});
gamesQuery.addEventListener("input", renderGames);
for (const filter of document.querySelectorAll(".games-filter")) {
	filter.addEventListener("click", () => {
		document.querySelectorAll(".games-filter").forEach((item) => item.classList.toggle("active", item === filter));
		renderGames();
	});
}
function formatDuration(seconds) {
	const safeSeconds = Number.isFinite(seconds) ? Math.max(0, seconds) : 0;
	const total = Math.floor(safeSeconds);
	const mins = Math.floor(total / 60);
	const secs = total % 60;
	return `${mins}:${String(secs).padStart(2, "0")}`;
}
let miniPlayerCollapsed = false;
let miniPlayerDragState = null;
function clampMiniPlayerToViewport(element, nextLeft, nextTop) {
	if (!element) return { left: nextLeft, top: nextTop };
	const rect = element.getBoundingClientRect();
	const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
	const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
	return {
		left: Math.min(Math.max(8, nextLeft), maxLeft),
		top: Math.min(Math.max(8, nextTop), maxTop),
	};
}
function positionMiniPlayerFabToPlayer() {
	if (!miniPlayer || !miniPlayerFab) return;
	const rect = miniPlayer.getBoundingClientRect();
	miniPlayerFab.style.left = `${rect.left + rect.width - 42}px`;
	miniPlayerFab.style.top = `${rect.top}px`;
	miniPlayerFab.style.right = "auto";
}
function setMiniPlayerCollapsed(collapsed) {
	miniPlayerCollapsed = collapsed;
	if (!miniPlayer) return;
	miniPlayer.classList.toggle("is-collapsed", collapsed);
	if (collapsed) {
		positionMiniPlayerFabToPlayer();
		miniPlayerFab.hidden = false;
		miniPlayer.hidden = true;
		return;
	}
	if (miniPlayerFab) miniPlayerFab.hidden = true;
	if (musicQueue.length && musicQueueIndex >= 0) {
		miniPlayer.hidden = false;
	}
}
function onMiniPlayerPointerDown(event, target) {
	if (!target) return;
	const element = target === miniPlayerFab ? miniPlayerFab : miniPlayer;
	if (!element) return;
	const rect = element.getBoundingClientRect();
	miniPlayerDragState = {
		pointerId: event.pointerId,
		element,
		offsetX: event.clientX - rect.left,
		offsetY: event.clientY - rect.top,
	};
	element.setPointerCapture?.(event.pointerId);
}
function attachMiniPlayerDrag(handle, target) {
	if (!handle || !target) return;
	let dragMoved = false;
	handle.addEventListener("pointerdown", (event) => {
		event.preventDefault();
		dragMoved = false;
		const clickedButton = event.target.closest("button");
		if (clickedButton && handle !== target) return;
		onMiniPlayerPointerDown(event, target);
	});
	window.addEventListener("pointermove", (event) => {
		if (!miniPlayerDragState || miniPlayerDragState.pointerId !== event.pointerId) return;
		dragMoved = true;
		const { element, offsetX, offsetY } = miniPlayerDragState;
		const nextLeft = event.clientX - offsetX;
		const nextTop = event.clientY - offsetY;
		const clamped = clampMiniPlayerToViewport(element, nextLeft, nextTop);
		element.style.left = `${clamped.left}px`;
		element.style.top = `${clamped.top}px`;
		element.style.right = "auto";
	});
	window.addEventListener("pointerup", () => {
		miniPlayerDragState = null;
		if (handle === miniPlayerFab) {
			handle.dataset.dragged = dragMoved ? "true" : "false";
		}
	});
}
function updateMiniPlayerUI() {
	if (!miniPlayer) return;
	if (!musicQueue.length || musicQueueIndex < 0) {
		miniPlayer.hidden = true;
		if (miniPlayerFab) miniPlayerFab.hidden = true;
		return;
	}
	const active = musicQueue[musicQueueIndex];
	if (!active) {
		miniPlayer.hidden = true;
		if (miniPlayerFab) miniPlayerFab.hidden = true;
		return;
	}
	if (miniPlayerCollapsed) {
		miniPlayer.hidden = true;
		if (miniPlayerFab) miniPlayerFab.hidden = false;
		return;
	}
	miniPlayer.hidden = false;
	if (miniPlayerFab) miniPlayerFab.hidden = true;
	miniTitle.textContent = active.title || "Untitled";
	miniArtist.textContent = active.channel || "YouTube";
	nowPlaying.textContent = active.title || "Untitled";
	playerChannel.textContent = `${active.channel || "YouTube"} / YouTube full track`;
	miniCurrentTime.textContent = formatDuration(youtubePlayer && typeof youtubePlayer.getCurrentTime === "function" ? youtubePlayer.getCurrentTime() : 0);
	const duration = youtubePlayer && typeof youtubePlayer.getDuration === "function" ? youtubePlayer.getDuration() : 0;
	miniTotalTime.textContent = formatDuration(duration);
	const pct = Number.isFinite(duration) && duration > 0 ? (Math.min((youtubePlayer && typeof youtubePlayer.getCurrentTime === "function" ? youtubePlayer.getCurrentTime() : 0) / duration, 1) * 100) : 0;
	miniProgressFill.style.width = `${pct}%`;
	if (youtubePlayer && typeof youtubePlayer.getPlayerState === "function") {
		const state = youtubePlayer.getPlayerState();
		const isPlaying = state === window.YT?.PlayerState?.PLAYING;
		miniToggle.textContent = isPlaying ? "⏸" : "▶";
		miniToggle.setAttribute("aria-label", isPlaying ? "Pause track" : "Play track");
	} else {
		miniToggle.textContent = "⏸";
	}
}
function startMiniPlayerTicker() {
	if (miniPlayerTicker) return;
	miniPlayerTicker = window.setInterval(() => {
		updateMiniPlayerUI();
	}, 1000);
}
function stopMiniPlayerTicker() {
	if (miniPlayerTicker) {
		window.clearInterval(miniPlayerTicker);
		miniPlayerTicker = null;
	}
}
function showMiniPlayer(isVisible) {
	if (!miniPlayer) return;
	if (!isVisible) {
		setMiniPlayerCollapsed(false);
		miniPlayer.hidden = true;
		if (miniPlayerFab) miniPlayerFab.hidden = true;
		stopMiniPlayerTicker();
		return;
	}
	if (miniPlayerCollapsed) {
		miniPlayer.hidden = true;
		positionMiniPlayerFabToPlayer();
		if (miniPlayerFab) miniPlayerFab.hidden = false;
		return;
	}
	miniPlayer.hidden = false;
	if (miniPlayerFab) miniPlayerFab.hidden = true;
	startMiniPlayerTicker();
}
function playQueueRelative(offset) {
	if (!musicQueue.length) return;
	if (musicQueueIndex < 0) musicQueueIndex = 0;
	const nextIndex = (musicQueueIndex + offset + musicQueue.length) % musicQueue.length;
	playMusicResult(musicQueue[nextIndex], musicQueue);
}
async function playMusicResult(result, queue = []) {
	if (result) {
		const requestedQueue = Array.isArray(queue) && queue.length ? queue : [result];
		musicQueue = requestedQueue;
		musicQueueIndex = requestedQueue.findIndex((entry) => entry?.id === result.id);
		if (musicQueueIndex < 0) musicQueueIndex = 0;
		if (typeof window.rememberRecentTrack === "function") {
			try {
				window.rememberRecentTrack(result);
			} catch {}
		}
	}
	nowPlaying.textContent = result.title;
	playerChannel.textContent = `${result.channel} / YouTube full track`;
	miniTitle.textContent = result.title;
	miniArtist.textContent = result.channel || "YouTube";
	showMiniPlayer(true);
	const player = await loadYouTubePlayer();
	if (player && typeof player.stopVideo === "function" && typeof player.getPlayerState === "function") {
		try {
			const state = player.getPlayerState();
			if (state !== window.YT?.PlayerState?.UNSTARTED && state !== window.YT?.PlayerState?.ENDED) {
				player.stopVideo();
			}
		} catch {}
	}
	if (player && typeof player.loadVideoById === "function") {
		player.loadVideoById(result.id);
		updateMiniPlayerUI();
		return;
	}
	if (youtubePlayerElement) {
		youtubePlayerElement.src = `https://www.youtube.com/embed/${encodeURIComponent(result.id)}?autoplay=1&playsinline=1&controls=1`;
	}
	updateMiniPlayerUI();
}
function loadYouTubePlayer() {
	window.loadYouTubePlayer = loadYouTubePlayer;
	if (youtubeReady) return youtubeReady;
	youtubeReady = new Promise((resolve) => {
		const create = () => {
			try {
				youtubePlayer = new YT.Player(youtubePlayerElement, {
					width: "1",
					height: "1",
					playerVars: { autoplay: 0, controls: 0, playsinline: 1 },
					events: { onReady: () => { window.youtubePlayer = youtubePlayer; resolve(youtubePlayer); } },
				});
				window.youtubePlayer = youtubePlayer;
			} catch {
				resolve(null);
			}
		};
		if (window.YT?.Player) return create();
		window.onYouTubeIframeAPIReady = create;
		const script = document.createElement("script");
		script.id = "yt-iframe-api";
		script.src = "https://www.youtube.com/iframe_api";
		script.async = true;
		document.head.append(script);
		window.setTimeout(() => {
			if (!youtubePlayer && !window.YT?.Player) resolve(null);
		}, 5000);
	});
	return youtubeReady;
}
function openTrackPlaylistMenu(track, trigger) {
	const existingMenu = document.querySelector(".music-result-menu.active");
	if (existingMenu) existingMenu.remove();
	if (!playlists.length) {
		musicStatus.textContent = "Create a playlist first to save tracks.";
		openPlaylistPrompt();
		return;
	}
	const menu = document.createElement("div");
	menu.className = "music-result-menu active";
	menu.setAttribute("role", "menu");
	menu.innerHTML = `
		<p class="music-result-menu-title">Add to playlist</p>
		${playlists.map((playlist) => `<button type="button" class="music-result-menu-item" data-playlist-name="${playlist.name}">${playlist.name}</button>`).join("")}
		<button type="button" class="music-result-menu-item" data-create-from-menu="true">Create playlist</button>
	`;
	menu.querySelectorAll(".music-result-menu-item").forEach((button) => {
		button.addEventListener("click", () => {
			if (button.dataset.createFromMenu === "true") {
				menu.remove();
				openPlaylistPrompt();
				return;
			}
			addTrackToPlaylist(button.dataset.playlistName, track);
			musicStatus.textContent = `Added to “${button.dataset.playlistName}”`;
			menu.remove();
		});
	});
	const rect = trigger.getBoundingClientRect();
	menu.style.top = `${Math.min(rect.top + 8, window.innerHeight - 160)}px`;
	menu.style.left = `${Math.max(16, rect.left - 140)}px`;
	document.body.append(menu);
	const removeOnOutsideClick = (event) => {
		if (!menu.contains(event.target) && event.target !== trigger) {
			menu.remove();
			document.removeEventListener("click", removeOnOutsideClick);
		}
	};
	document.addEventListener("click", removeOnOutsideClick);
}
function renderMusicResults(results) {
	musicResults.replaceChildren();
	for (const result of results) {
		const card = document.createElement("div");
		card.className = "music-result-card";
		const button = document.createElement("button"); button.type = "button"; button.className = "music-result";
		button.innerHTML = `<img src="${result.thumbnail}" alt=""><span><strong></strong><small></small></span><i>&#9654;</i>`;
		button.querySelector("strong").textContent = result.title; button.querySelector("small").textContent = `${result.channel} / YouTube`;
		button.addEventListener("click", () => playMusicResult(result, results));
		const moreButton = document.createElement("button");
		moreButton.type = "button";
		moreButton.className = "music-result-more";
		moreButton.setAttribute("aria-label", `Add ${result.title} to a playlist`);
		moreButton.title = `Add ${result.title} to a playlist`;
		moreButton.textContent = "+";
		moreButton.addEventListener("click", (event) => {
			event.stopPropagation();
			if (!playlists.length) {
				musicStatus.textContent = "Create a playlist first to save tracks.";
				openPlaylistPrompt();
				return;
			}
			openTrackPlaylistMenu(result, moreButton);
		});
		const likeButton = document.createElement("button");
		likeButton.type = "button";
		likeButton.className = `music-result-like${isTrackLiked(result) ? " active" : ""}`;
		likeButton.textContent = isTrackLiked(result) ? "♥" : "♡";
		likeButton.title = isTrackLiked(result) ? `Unlike ${result.title}` : `Like ${result.title}`;
		likeButton.setAttribute("aria-label", isTrackLiked(result) ? `Unlike ${result.title}` : `Like ${result.title}`);
		likeButton.addEventListener("click", (event) => {
			event.stopPropagation();
			const liked = toggleLikedSong(result);
			likeButton.classList.toggle("active", liked);
			likeButton.textContent = liked ? "♥" : "♡";
			likeButton.setAttribute("aria-label", liked ? `Unlike ${result.title}` : `Like ${result.title}`);
			musicStatus.textContent = liked ? `Added “${result.title}” to liked songs.` : `Removed “${result.title}” from liked songs.`;
		});
		card.append(button, moreButton, likeButton);
		musicResults.append(card);
	}
}
function openPlaylistPrompt() {
	if (!playlistPrompt || !playlistNameInput || !playlistConfirmButton || !playlistCancelButton) return;
	playlistPrompt.hidden = false;
	playlistNameInput.value = `My Playlist ${playlists.length + 1}`;
	playlistNameInput.focus();
	playlistNameInput.select();
}

function closePlaylistPrompt() {
	if (!playlistPrompt) return;
	playlistPrompt.hidden = true;
	if (playlistNameInput) playlistNameInput.value = "";
}

if (newPlaylistButton) {
	newPlaylistButton.addEventListener("click", openPlaylistPrompt);
}
if (playlistConfirmButton) {
	playlistConfirmButton.addEventListener("click", () => {
		const name = playlistNameInput?.value ?? "";
		closePlaylistPrompt();
		createPlaylist(name);
	});
}
if (playlistCancelButton) {
	playlistCancelButton.addEventListener("click", closePlaylistPrompt);
}
if (playlistPrompt) {
	playlistPrompt.addEventListener("click", (event) => {
		if (event.target === playlistPrompt) closePlaylistPrompt();
	});
}
if (playlistNameInput) {
	playlistNameInput.addEventListener("keydown", (event) => {
		if (event.key === "Enter") {
			event.preventDefault();
			playlistConfirmButton?.click();
		}
		if (event.key === "Escape") {
			event.preventDefault();
			closePlaylistPrompt();
		}
	});
}

async function searchMusic() {
	if (activeTab) showMusic(activeTab);
	const query = musicQuery.value.trim(); if (!query) return;
	musicStatus.textContent = "Searching music..."; musicResults.replaceChildren();
	try {
		const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`);
		const payload = await response.json();
		if (!response.ok) throw new Error(payload.error || "Search failed.");
		musicQueue = payload || [];
		if (musicQueue.length) musicQueueIndex = 0;
		renderMusicResults(payload);
		musicStatus.textContent = payload.length ? `${payload.length} tracks found` : "No tracks found. Try another search.";
	} catch (error) { musicStatus.textContent = error instanceof Error ? error.message : "Search failed."; }
}
miniToggle.addEventListener("click", () => {
	if (!youtubePlayer || typeof youtubePlayer.getPlayerState !== "function") return;
	const state = youtubePlayer.getPlayerState();
	if (state === window.YT?.PlayerState?.PLAYING) youtubePlayer.pauseVideo();
	else if (state === window.YT?.PlayerState?.PAUSED || state === window.YT?.PlayerState?.ENDED) youtubePlayer.playVideo();
});
if (miniClose) {
	miniClose.addEventListener("click", () => {
		setMiniPlayerCollapsed(true);
	});
}
if (miniPlayerFab) {
	miniPlayerFab.addEventListener("click", () => {
		if (miniPlayerFab.dataset.dragged === "true") {
			miniPlayerFab.dataset.dragged = "false";
			return;
		}
		setMiniPlayerCollapsed(false);
		if (musicQueue.length && musicQueueIndex >= 0) {
			miniPlayer.hidden = false;
			startMiniPlayerTicker();
		}
	});
	attachMiniPlayerDrag(miniPlayerFab, miniPlayerFab);
}
if (miniPlayerHandle) attachMiniPlayerDrag(miniPlayerHandle, miniPlayer);
miniPrev.addEventListener("click", () => playQueueRelative(-1));
miniNext.addEventListener("click", () => playQueueRelative(1));
musicSubmit.addEventListener("click", searchMusic);
musicQuery.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		searchMusic();
	}
});
applyLanguage();
loadPlaylists();
renderAccount();
renderPlaylists();
startClockUpdates();

init().catch((startupError) => showErrorScreen(startupError.message, startupError.stack));

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	navigate(goto).catch((error) => showErrorScreen(error.message, error.stack));
}
