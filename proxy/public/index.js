const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const frameWrapper = document.getElementById("sj-frame-wrapper");
const loadingScreen = document.getElementById("sj-loading");
const tabsElement = document.getElementById("sj-tabs");
const framesElement = document.getElementById("sj-frames");
const newTabButton = document.getElementById("sj-new-tab");
const settingsButton = document.getElementById("sj-settings");
const settingsPanel = document.getElementById("sj-settings-panel");
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

let controller;
let activeTab;
let tabCounter = 0;
const tabs = [];
let initPromise;
const homeAddress = "sleek://home";
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
try {
	const savedFavorites = JSON.parse(localStorage.getItem("sleek-favorites") || "[]");
	if (Array.isArray(savedFavorites)) {
		for (const favorite of savedFavorites) {
			if (Array.isArray(favorite) && favorite.length === 2 && favorite[1]?.url) favoriteUrls.set(favorite[0], favorite[1]);
			else if (favorite?.url) favoriteUrls.set(favorite.url, favorite);
		}
	}
} catch {
	localStorage.removeItem("sleek-favorites");
}
function saveFavorites() {
	localStorage.setItem("sleek-favorites", JSON.stringify([...favoriteUrls]));
}
function renderQuickLinks() {
	quickLinks.replaceChildren();
	const heading = document.createElement("p");
	heading.className = "quick-links-heading";
	heading.textContent = "Quick links";
	quickLinks.append(heading);
	const list = document.createElement("div");
	list.className = "quick-links-list";
	[...defaultQuickLinks, ...favoriteUrls.values()].forEach((link) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "quick-link";
		button.title = link.url;
		button.dataset.quickUrl = link.url;
		button.innerHTML = `<img class="quick-link-icon" src="${link.favicon || "/sleek-logo.png"}" alt="" /><span>${link.title}</span>`;
		list.append(button);
	});
	quickLinks.append(list);
}
quickLinks.addEventListener("click", (event) => {
	const link = event.target.closest("[data-quick-url]");
	if (!link) return;
	event.preventDefault();
	navigate(link.dataset.quickUrl).catch((navigationError) => showErrorScreen(navigationError.message, navigationError.stack));
});
function showHome(tab) {
	tab.frameElement.src = "about:blank";
	tab.url = "";
	tab.button.querySelector(".sj-tab-title").textContent = "New tab";
	address.value = "";
	tabAddress.value = homeAddress;
	frameWrapper.style.display = "none";
	loadingScreen.hidden = true;
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
	bookmarkButton.classList.toggle("saved", Boolean(tab.url && favoriteUrls.has(tab.url)));
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
	if (!url) return;
	if (url.toLowerCase() === homeAddress) {
		showHome(activeTab);
		return;
	}
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
bookmarkButton.addEventListener("click", () => {
	const url = activeTab?.url || tabAddress.value;
	if (!/^https?:\/\//i.test(url)) return;
	if (favoriteUrls.has(url)) favoriteUrls.delete(url);
	else favoriteUrls.set(url, { title: new URL(url).hostname, url });
	saveFavorites();
	bookmarkButton.classList.toggle("saved", favoriteUrls.has(url));
	renderQuickLinks();
});

renderQuickLinks();

init().catch((startupError) => showErrorScreen(startupError.message, startupError.stack));

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	navigate(goto).catch((error) => showErrorScreen(error.message, error.stack));
}
