const form = document.getElementById("sj-form");
const address = document.getElementById("sj-address");
const frameWrapper = document.getElementById("sj-frame-wrapper");
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

let controller;
let activeTab;
let tabCounter = 0;
const tabs = [];
let initPromise;
const homeAddress = "sleek://home";

async function init() {
	if (initPromise) return initPromise;
	initPromise = (async () => {
		controller = await initBootstrap();
		createTab();
	})();
	return initPromise;
}


function createTab() {
	const tab = { button: document.createElement("button"), frameElement: document.createElement("iframe"), frame: null, url: "" };
	tab.button.className = "sj-tab";
	tab.button.type = "button";
	tab.button.innerHTML = '<span class="sj-tab-title">New tab</span><span class="sj-tab-close" aria-label="Close tab">&times;</span>';
	tab.button.addEventListener("click", (event) => {
		if (event.target.closest(".sj-tab-close")) return closeTab(tab);
		selectTab(tab);
	});
	tabsElement.insertBefore(tab.button, newTabButton);
	tab.frameElement.title = "SLEEK tab";
	framesElement.append(tab.frameElement);
	const watcher = new $scramjetUtils.UrlWatcherPlugin((url) => {
		tab.url = url;
		if (tab === activeTab) address.value = url;
		if (tab === activeTab) tabAddress.value = url;
	});
	tab.frame = controller.createFrame(tab.frameElement, {
		plugins: [new $scramjetUtils.HttpCachePlugin(), watcher, new $scramjetUtils.CatchEscapedLinksPlugin((url) => new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin))],
	});
	tabs.push(tab);
	selectTab(tab);
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
}

function closeTab(tab) {
	if (tabs.length === 1) return;
	const index = tabs.indexOf(tab);
	tabs.splice(index, 1);
	tab.button.remove();
	tab.frameElement.remove();
	if (tab === activeTab) selectTab(tabs[Math.max(0, index - 1)]);
}

function showErrorScreen(error, details) {
	frameWrapper.style.display = "none";
	error.textContent = error;
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
		activeTab.frameElement.src = "about:blank";
		activeTab.url = "";
		activeTab.button.querySelector(".sj-tab-title").textContent = "New Tab";
		tabAddress.value = homeAddress;
		return;
	}
	if (!/^[a-z][a-z\d+.-]*:\/\//i.test(url)) {
		const looksLikeHost =
			url.includes(".") || url.startsWith("localhost:") || url.startsWith("[");
		if (looksLikeHost) {
			url = `https://${url}`;
		} else {
			const template = searchEngine?.value || tabSearchEngine?.value || "https://duckduckgo.com/?q=%s";
			url = template.replace("%s", encodeURIComponent(url));
		}
	}
	activeTab.frame.go(url);
	activeTab.button.querySelector(".sj-tab-title").textContent = new URL(url).hostname;
	frameWrapper.style.display = "flex";
}

newTabButton.addEventListener("click", () => {
	if (controller) createTab();
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
for (const button of document.querySelectorAll("[data-settings-page]")) {
	button.addEventListener("click", () => {
		const page = button.dataset.settingsPage;
		document.querySelectorAll("[data-settings-page]").forEach((item) => item.classList.toggle("active", item === button));
		document.querySelectorAll("[data-settings-page-content]").forEach((item) => item.classList.toggle("active", item.dataset.settingsPageContent === page));
	});
}
for (const button of document.querySelectorAll("[data-theme-choice]")) {
	button.addEventListener("click", () => {
		document.body.dataset.theme = button.dataset.themeChoice;
		document.querySelectorAll("[data-theme-choice]").forEach((item) => item.classList.toggle("active", item === button));
	});
}
for (const button of document.querySelectorAll("[data-accent]")) {
	button.addEventListener("click", () => {
		const accent = button.dataset.accent;
		document.body.style.setProperty("--accent", accent);
		document.querySelectorAll(".logo-wrapper h1").forEach((item) => {
			item.style.color = accent;
		});
		document.querySelectorAll("[data-accent]").forEach((item) => item.classList.toggle("active", item === button));
	});
}
for (const button of document.querySelectorAll("[data-theme-choice]")) {
	button.addEventListener("click", () => {
		document.body.dataset.theme = button.dataset.themeChoice;
		document.querySelectorAll("[data-theme-choice]").forEach((item) => item.classList.toggle("active", item === button));
	});
}
brandName.addEventListener("input", () => { document.querySelectorAll(".logo-wrapper h1").forEach((item) => item.textContent = brandName.value.trim() || "SLEEK"); });
themeUpload.addEventListener("change", () => {
	const file = themeUpload.files[0];
	if (!file) return;
	themeUploadStatus.textContent = `${file.name} ready to import.`;
	if (file.name.endsWith(".json")) {
		const reader = new FileReader();
		reader.onload = () => { try { const theme = JSON.parse(reader.result); if (theme.accent) document.body.style.setProperty("--accent", theme.accent); if (theme.name) brandName.value = theme.name; themeUploadStatus.textContent = `${file.name} applied.`; } catch { themeUploadStatus.textContent = "Invalid theme JSON."; } };
		reader.readAsText(file);
	}
});
for (const button of document.querySelectorAll("[data-density-choice]")) {
	button.addEventListener("click", () => {
		document.body.dataset.density = button.dataset.densityChoice;
		document.querySelectorAll("[data-density-choice]").forEach((item) => item.classList.toggle("active", item === button));
	});
}
for (const button of document.querySelectorAll("[data-engine]")) {
	button.addEventListener("click", () => {
		const engine = button.dataset.engine;
		searchEngine.value = engine;
		tabSearchEngine.value = engine;
		document.querySelectorAll("[data-engine]").forEach((item) => item.classList.toggle("active", item === button));
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
	bookmarkButton.classList.toggle("saved");
});

init().catch((startupError) => showErrorScreen(startupError.message, startupError.stack));

form.addEventListener("submit", async (e) => {
	e.preventDefault();
	try {
		await navigate(address.value);
	} catch (error) {
		showErrorScreen(error.message, error.stack);
	}
});

const goto = new URL(location.href).searchParams.get("goto");
if (goto) {
	history.replaceState(null, "", location.pathname);
	address.value = goto;
	navigate(goto).catch((error) => showErrorScreen(error.message, error.stack));
}
