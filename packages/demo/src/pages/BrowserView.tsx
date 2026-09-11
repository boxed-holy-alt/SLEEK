import {
  css,
  type Delegate,
  type Component,
  createState,
} from "dreamland/core";
import {
  CatchEscapedLinksPlugin,
  UrlWatcherPlugin,
} from "@mercuryworkshop/scramjet-utils";
import { versionInfo } from "@mercuryworkshop/scramjet";
import { cachePlugin, controller } from "..";
import { demoSettingsStore } from "../store";
import homepage from "./homepage.html?raw";
import type { Frame } from "@mercuryworkshop/scramjet-controller";

const SAVED_URLS_KEY = "scramjet-demo-saved-urls";

export const browserState = createState({
  url: demoSettingsStore.homeUrl,
  frame: null! as Frame,
  savedUrls: loadSavedUrls(),
});

function loadSavedUrls(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(SAVED_URLS_KEY) ?? "[]");
    return Array.isArray(saved)
      ? saved.filter((url): url is string => typeof url === "string")
      : [];
  } catch {
    return [];
  }
}

function saveUrls(urls: string[]) {
  localStorage.setItem(SAVED_URLS_KEY, JSON.stringify(urls));
}

function getSavedLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

export const Omnibox: Component = function (cx) {
  const navigate = () => {
    if (!browserState.url.startsWith("http")) {
      browserState.url = `https://${browserState.url}`;
    }
    demoSettingsStore.homeUrl = browserState.url;
    browserState.frame?.go(browserState.url);
  };
  const toggleSaved = () => {
    const url = browserState.url.trim();
    if (!url) return;
    const savedUrls = browserState.savedUrls.includes(url)
      ? browserState.savedUrls.filter((savedUrl) => savedUrl !== url)
      : [...browserState.savedUrls, url];
    browserState.savedUrls = savedUrls;
    saveUrls(savedUrls);
  };
  const openSaved = (url: string) => {
    browserState.url = url;
    browserState.frame?.go(url);
  };
  return (
    <div class="omnibox-area">
      <form
        class="url-form"
        on:submit={(e: SubmitEvent) => {
          e.preventDefault();
          navigate();
        }}
      >
        <div class="browser-omnibox-shell">
          <div class="omnibox-nav" aria-label="Browser navigation">
            <button
              type="button"
              class="nav-btn"
              on:click={() => browserState.frame?.back()}
            >
              <span class="material-symbols-outlined">arrow_back</span>
            </button>
            <button
              type="button"
              class="nav-btn"
              on:click={() => browserState.frame?.forward()}
            >
              <span class="material-symbols-outlined">arrow_forward</span>
            </button>
            <button
              type="button"
              class="nav-btn"
              on:click={() => browserState.frame?.reload()}
            >
              <span class="material-symbols-outlined">refresh</span>
            </button>
          </div>
          <input
            id="search"
            class="url-input"
            type="text"
            value={use(browserState.url)}
            on:input={(e: InputEvent) => {
              browserState.url = (e.currentTarget as HTMLInputElement).value;
            }}
            spellcheck="false"
            placeholder="Enter URL or search..."
          />
          <button
            type="button"
            class={use(browserState.url)
              .zip(use(browserState.savedUrls))
              .map(([url, urls]) =>
                urls.includes(url.trim()) ? "save-btn saved" : "save-btn",
              )}
            on:click={toggleSaved}
            aria-label="Save this page"
            title="Save this page"
          >
            <span class="material-symbols-outlined">star</span>
          </button>
        </div>
      </form>
      <div class="saved-bar">
        <span class="saved-label">Saved</span>
        <div class="saved-links">
          {use(browserState.savedUrls).map((urls) =>
            urls.length ? (
              urls.map((url) => (
                <button
                  type="button"
                  class="saved-link"
                  on:click={() => openSaved(url)}
                  title={url}
                >
                  <span class="material-symbols-outlined">bookmark</span>
                  {getSavedLabel(url)}
                </button>
              ))
            ) : (
              <span class="saved-empty">No saved pages yet</span>
            ),
          )}
        </div>
      </div>
    </div>
  );
};
Omnibox.style = css`
  :scope {
    display: flex;
    flex-direction: column;
    background: #0f0f0f;
    border-bottom: 1px solid #2a2a2a;
    min-width: 0;
    width: 100%;
  }
  .omnibox-area,
  .url-form {
    width: 100%;
  }
  .browser-omnibox-shell {
    display: flex;
    width: 100%;
    align-items: center;
    gap: 0.35em;
    min-width: 0;
    border: 0;
    background: transparent;
    padding: 0;
    flex: 1;
  }
  .omnibox-nav {
    display: flex;
    align-items: center;
    gap: 0.15em;
    padding-right: 0.25em;
    border-right: 1px solid #2a2a2a;
  }
  .nav-btn {
    border: 0;
    background: transparent;
    color: #8f8f8f;
    width: 1.5em;
    height: 1.5em;
    padding: 0;
    border-radius: 3px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .nav-btn:hover {
    background: #1f1f1f;
    color: #d0d0d0;
  }
  .save-btn {
    border: 0;
    background: transparent;
    color: #8f8f8f;
    width: 2em;
    height: 2em;
    padding: 0;
    border-radius: 3px;
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .save-btn:hover,
  .save-btn.saved {
    color: #f5c451;
  }
  .save-btn.saved .material-symbols-outlined {
    font-variation-settings:
      "FILL" 1,
      "wght" 400,
      "GRAD" 0,
      "opsz" 20;
  }
  .saved-bar {
    display: flex;
    align-items: center;
    gap: 0.65em;
    min-height: 28px;
    padding: 0.1em 0.55em;
    border-top: 1px solid #202020;
    background: #121212;
    overflow-x: auto;
  }
  .saved-label {
    color: #a5a5a5;
    font-size: 0.76em;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .saved-links {
    display: flex;
    align-items: center;
    gap: 0.25em;
    min-width: 0;
  }
  .saved-link {
    display: inline-flex;
    align-items: center;
    gap: 0.25em;
    max-width: 180px;
    border: 0;
    border-radius: 3px;
    padding: 0.22em 0.45em;
    background: transparent;
    color: #c7c7c7;
    cursor: pointer;
    font-size: 0.78em;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .saved-link:hover {
    background: #242424;
    color: #fff;
  }
  .saved-empty {
    color: #686868;
    font-size: 0.78em;
  }
  .browser-omnibox-shell .material-symbols-outlined {
    font-size: 15px !important;
    line-height: 1 !important;
    font-variation-settings:
      "OPSZ" 20,
      "wght" 300,
      "FILL" 0,
      "GRAD" 0;
  }
  .url-input {
    box-sizing: border-box;
    width: 100%;
    padding: 0.22em 0.18em;
    font-size: 0.9em;
    border: 1px solid transparent;
    border-radius: 3px;
    background: transparent;
    color: #e5e7eb;
    outline: none;
  }
  .url-input::placeholder {
    color: #6f7680;
  }
`;

const BrowserView: Component<
  {
    active: boolean;
  },
  {},
  {
    frameel: HTMLIFrameElement;
  }
> = function (cx) {
  cx.mount = async () => {
    await controller.wait();

    let urlWatcher = new UrlWatcherPlugin((url) => {
      browserState.url = url;
    });
    let catchEscapedLinks = new CatchEscapedLinksPlugin(
      (url) =>
        new URL(`/?goto=${encodeURIComponent(url.href)}`, location.origin),
    );
    browserState.frame = controller.createFrame(this.frameel, {
      plugins: [cachePlugin, urlWatcher, catchEscapedLinks],
    });
    let realHomepage = homepage;
    realHomepage = realHomepage.replaceAll(
      "{{SCRAMJET_VERSION}}",
      String(versionInfo.version),
    );
    realHomepage = realHomepage.replaceAll(
      "{{SCRAMJET_BUILD}}",
      String(versionInfo.build),
    );
    realHomepage = realHomepage.replaceAll(
      "{{SCRAMJET_DATE_PRETTY}}",
      new Date(versionInfo.date).toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      }),
    );
    this.frameel.src = `data:text/html;base64,${btoa(realHomepage)}`;

    let goto = new URL(location.href).searchParams.get("goto");
    if (goto) {
      browserState.frame?.go(goto);
      history.replaceState(null, "", location.href.split("?")[0]);
    }
  };

  return (
    <div
      class={use(this.active).map(
        (active) => `tab-panel browser-view ${active ? "active" : ""}`,
      )}
    >
      <iframe this={use(this.frameel)}></iframe>
    </div>
  );
};

BrowserView.style = css`
  :scope {
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 0;
    display: none;
    flex-direction: column;
  }
  :scope.active {
    display: flex;
  }

  iframe {
    background: white;
    flex: 1;
    border: none;
  }
`;

export default BrowserView;
