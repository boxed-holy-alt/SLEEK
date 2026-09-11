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
const nowPlaying = document.getElementById("sj-now-playing");
const playerChannel = document.getElementById("sj-player-channel");
const youtubePlayerElement = document.getElementById("sj-youtube-player");
const musicSearch = document.getElementById("sj-music-search");
const musicSubmit = document.getElementById("sj-music-submit");
const musicQuery = document.getElementById("sj-music-query");
const musicStatus = document.getElementById("sj-music-status");
const musicResults = document.getElementById("sj-music-results");
let youtubePlayer;
let youtubeReady;

let controller;
let activeTab;
let tabCounter = 0;
const tabs = [];
let initPromise;
const homeAddress = "sleek://home";
const musicAddress = "sleek://music";
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
	accountClock.textContent = formattedTime;
	homeClock.textContent = formattedTime;
}
function applyLanguage() {
	document.documentElement.lang = language;
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
	musicPage.hidden = true;
	document.body.classList.add("is-home");
	tab.frameElement.src = "about:blank";
	tab.url = "";
	tab.button.querySelector(".sj-tab-title").textContent = "New tab";
	address.value = "";
	tabAddress.value = homeAddress;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
}
function showMusic(tab) {
	if (!tab) return;
	document.body.classList.remove("is-home");
	toolsPanel.hidden = true;
	musicButton.setAttribute("aria-expanded", "false");
	musicPage.hidden = false;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
	tab.frameElement.src = "about:blank";
	tab.url = musicAddress;
	tab.button.querySelector(".sj-tab-title").textContent = "Music";
	address.value = musicAddress;
	tabAddress.value = musicAddress;
	updateBookmarkState();
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
		tab.url = url;
		if (tab === activeTab) address.value = url;
		if (tab === activeTab) tabAddress.value = url;
		if (tab === activeTab) updateBookmarkState();
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
	address.value = tab.url;
	tabAddress.value = tab.url || homeAddress;
	updateBookmarkState();
	document.body.classList.toggle("is-home", !tab.url);
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
	document.body.classList.remove("is-home");
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
	address.value = url;
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
document.querySelectorAll(".settings-info-row").forEach((row) => row.remove());
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
document.getElementById("sj-reset-home").addEventListener("click", () => navigate(homeAddress));

document.getElementById("sj-tab-address-bar").addEventListener("submit", (event) => {
	event.preventDefault();
	address.value = tabAddress.value;
	navigate(tabAddress.value).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
});

backButton.addEventListener("click", () => activeTab?.frame.back());
forwardButton.addEventListener("click", () => activeTab?.frame.forward());
reloadButton.addEventListener("click", () => activeTab?.frame.reload());
homeButton.addEventListener("click", () => navigate(homeAddress));
musicButton.addEventListener("click", () => {
	toolsPanel.hidden = false;
});
for (const page of toolsPanel.querySelectorAll("[data-panel-route]")) {
	page.addEventListener("click", () => {
		const route = page.dataset.panelRoute;
		if (route === musicAddress) {
			showMusic(activeTab || createTab());
			return;
		}
		toolsPanel.hidden = true;
		musicButton.setAttribute("aria-expanded", "false");
		navigate(route).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
	});
}
musicClose.addEventListener("click", () => navigate(homeAddress));
async function playMusicResult(result) {
	nowPlaying.textContent = result.title;
	playerChannel.textContent = `${result.channel} / YouTube full track`;
	const player = await loadYouTubePlayer();
	player.loadVideoById(result.id);
}
function loadYouTubePlayer() {
	if (youtubeReady) return youtubeReady;
	youtubeReady = new Promise((resolve) => {
		const create = () => { youtubePlayer = new YT.Player(youtubePlayerElement, { width: "1", height: "1", playerVars: { autoplay: 0, controls: 0, playsinline: 1 }, events: { onReady: () => resolve(youtubePlayer) } }); };
		if (window.YT?.Player) return create();
		window.onYouTubeIframeAPIReady = create;
		const script = document.createElement("script"); script.id = "yt-iframe-api"; script.src = "https://www.youtube.com/iframe_api"; document.head.append(script);
	});
	return youtubeReady;
}
function renderMusicResults(results) {
	musicResults.replaceChildren();
	for (const result of results) {
		const button = document.createElement("button"); button.type = "button"; button.className = "music-result";
		button.innerHTML = `<img src="${result.thumbnail}" alt=""><span><strong></strong><small></small></span><i>&#9654;</i>`;
		button.querySelector("strong").textContent = result.title; button.querySelector("small").textContent = `${result.channel} / YouTube`;
		button.addEventListener("click", () => playMusicResult(result)); musicResults.append(button);
	}
}
async function searchMusic() {
	if (activeTab) showMusic(activeTab);
	const query = musicQuery.value.trim(); if (!query) return;
	musicStatus.textContent = "Searching music..."; musicResults.replaceChildren();
	try { const response = await fetch(`/api/music/search?q=${encodeURIComponent(query)}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error || "Search failed."); renderMusicResults(payload); musicStatus.textContent = payload.length ? `${payload.length} tracks found` : "No tracks found. Try another search."; } catch (error) { musicStatus.textContent = error instanceof Error ? error.message : "Search failed."; }
}
musicSubmit.addEventListener("click", searchMusic);
musicQuery.addEventListener("keydown", (event) => {
	if (event.key === "Enter") {
		event.preventDefault();
		searchMusic();
	}
});
applyLanguage();
renderAccount();
	setInterval(updateAccountClock, 1000);

init().catch((startupError) => showErrorScreen(startupError.message, startupError.stack));

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	navigate(goto).catch((error) => showErrorScreen(error.message, error.stack));
}
