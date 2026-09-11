<h1 align="center">SLEEK</h1>

<div align="center">
  <img src="proxy/public/sleek-logo.png" height="200" alt="SLEEK logo" />
</div>

<div align="center">

A simple, fast, and **SLEEK** web proxy.

</div>

---

## What is SLEEK?

SLEEK is a web proxy focused on keeping browsing simple.

It comes with a clean interface, multiple tabs, search, favorites, quick links, themes, cloaking options, and a panic key — without trying to turn the browser into something unnecessarily complicated.

SLEEK is powered by **Scramjet v2** and **Wisp** for its proxy engine and transport.

## Features

* Multiple tabs
* Search and URL navigation
* Favorites and quick links
* Custom themes
* Cloaking options
* Panic key
* Responsive interface
* Fast page loading
* Support for many modern websites

## Supported Websites

SLEEK can access many websites through its proxy, including:

* [Google](https://google.com)
* [YouTube](https://youtube.com)
* [Instagram](https://instagram.com)
* [ChatGPT](https://chatgpt.com)
* [Reddit](https://reddit.com)
* [Twitter](https://twitter.com)
* [Discord](https://discord.com)
* [Spotify](https://spotify.com)
* [GeForce NOW](https://play.geforcenow.com/)
* [now.gg](https://now.gg)

Support can vary depending on the website and how it handles proxied traffic.

## Built With

SLEEK uses a few projects that make the proxy possible:

* **[Scramjet](https://github.com/MercuryWorkshop/scramjet)** — web proxy engine
* **Wisp** — transport layer
* **SLEEK** — the interface, features, and everything built around them


## Development
**We made Sleek in a way so its EXTREMELY easy to develop!**

Clone the repository and run:

```sh
pnpm i
pnpm build
pnpm start
```

Once started, SLEEK will be available at:

```text
http://localhost:3030
```

### SLEEKIFY music search

SLEEKIFY uses YouTube Data API v3 for search and the YouTube IFrame API for full-track playback. The API key is read only from the server environment; it is never bundled into the browser.

#### Local setup

Copy `.env.example` to `.env`, put the key after `YOUTUBE_API_KEY=`, and start the server:

```sh
cp .env.example .env
pnpm start
```

Do not commit `.env`. It is ignored by Git.

#### Render setup

In the Render service dashboard, open **Environment**, choose **Add Environment Variable**, and add:

```text
Key: YOUTUBE_API_KEY
Value: your_new_youtube_api_key
```

Use `pnpm start` as the Start Command. Render injects the variable before starting the server, so no terminal `export` is needed. After saving the variable, trigger a redeploy.

## Status

SLEEK is still being worked on.

Things may change, break, or get replaced as development continues.

More features are planned.
