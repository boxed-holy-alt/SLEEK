import { css, type Component } from "dreamland/core";

type ChatMessage = {
	role: "assistant" | "user";
	text: string;
	time: string;
};

const initialMessages: ChatMessage[] = [
	{
		role: "assistant",
		text: "Hola, soy Slick. Puedo ayudarte a explorar la web, resumir una página o preparar una investigación.",
		time: "Ahora",
	},
];

const starterPrompts = [
	"Resume esta página",
	"Encuentra inspiración para mi proyecto",
	"Ayúdame a investigar un tema",
];

const ChatView: Component<
	{ onOpenBrowser: () => void },
	{},
	{ messages: ChatMessage[]; draft: string; isThinking: boolean }
> = function () {
	this.messages ??= [...initialMessages];
	this.draft ??= "";
	this.isThinking ??= false;

	const sendMessage = (text = this.draft.trim()) => {
		if (!text || this.isThinking) return;
		this.messages = [...this.messages, { role: "user", text, time: "Ahora" }];
		this.draft = "";
		this.isThinking = true;
		setTimeout(() => {
			this.messages = [
				...this.messages,
				{
					role: "assistant",
					text: "Entendido. Estoy listo para ayudarte con eso. Abre una página en el navegador integrado o dame un poco más de contexto para empezar.",
					time: "Ahora",
				},
			];
			this.isThinking = false;
		}, 650);
	};

	return (
		<div class="chat-shell">
			<aside class="chat-sidebar">
				<div class="sidebar-brand"><div class="sidebar-mark">S</div><strong>Slick</strong><span>AI</span></div>
				<button class="new-chat" type="button" on:click={() => { this.messages = [...initialMessages]; this.draft = ""; }}><b>＋</b> Nueva conversación</button>
				<div class="sidebar-label">Recientes</div>
				<button class="history-item active" type="button"><span>✦</span> Tu primera conversación</button>
				<button class="history-item" type="button"><span>◌</span> Explorar la web</button>
				<button class="history-item" type="button"><span>◌</span> Ideas para mi proyecto</button>
				<div class="sidebar-spacer" />
				<button class="sidebar-link" type="button" on:click={this.onOpenBrowser}><span>⌕</span> Navegador</button>
				<button class="sidebar-link" type="button"><span>⚙</span> Configuración</button>
				<div class="sidebar-user"><div class="user-avatar">T</div><div><strong>Tu espacio</strong><small>Plan local</small></div><span>•••</span></div>
			</aside>
			<section class="chat-main">
				<header class="chat-header">
					<div class="brand-lockup">
						<div><div class="eyebrow">CONVERSACIÓN</div><h1>Tu primera conversación</h1></div>
					</div>
					<div class="header-actions"><button type="button" aria-label="Compartir conversación">↗</button><button type="button" aria-label="Más opciones">•••</button></div>
				</header>

				<div class="conversation" aria-live="polite">
					<div class="conversation-intro">
						<span class="intro-kicker">NUEVA CONVERSACIÓN</span>
						<h2>¿Qué vamos a descubrir hoy?</h2>
						<p>Pregunta, explora y convierte tus ideas en algo concreto.</p>
					</div>
					<div class="message-list">
						{use(this.messages).map((messages) => messages.map((message) => (
							<div class={`message-row ${message.role}`}>
								{message.role === "assistant" ? <div class="assistant-avatar">✦</div> : null}
								<div class="message-content">
									<div class="message-meta">{message.role === "assistant" ? "Slick" : "Tú"}<span>{message.time}</span></div>
									<div class="message-bubble">{message.text}</div>
								</div>
							</div>
						)))}
						{use(this.isThinking).andThen(<div class="message-row assistant"><div class="assistant-avatar">✦</div><div class="thinking"><span /><span /><span /></div></div>)}
					</div>
				</div>

				<div class="composer-zone">
					<div class="suggestions">{starterPrompts.map((prompt) => <button type="button" on:click={() => sendMessage(prompt)}>{prompt}<span>↗</span></button>)}</div>
					<form class="composer" on:submit={(event: SubmitEvent) => { event.preventDefault(); sendMessage(); }}>
						<textarea value={use(this.draft)} placeholder="Escribe lo que estás pensando..." rows={1} on:input={(event: InputEvent) => { this.draft = (event.currentTarget as HTMLTextAreaElement).value; }} on:keydown={(event: KeyboardEvent) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); sendMessage(); } }} />
						<button class="send-button" type="submit" aria-label="Enviar mensaje" title="Enviar mensaje">↑</button>
					</form>
					<div class="composer-footer"><span>Enter para enviar</span><span>Slick puede equivocarse. Verifica la información importante.</span></div>
				</div>
			</section>

			<aside class="context-panel">
				<div class="context-top"><span class="context-label">TU ESPACIO</span><button type="button" class="icon-button" aria-label="Más opciones">•••</button></div>
				<div class="profile-card">
					<div class="profile-orbit"><span>✦</span></div>
					<h3>Explora sin perder el hilo.</h3>
					<p>Slick conecta tus ideas con el mundo que estás navegando.</p>
					<button type="button" class="browser-cta" on:click={this.onOpenBrowser}>Abrir navegador <span>↗</span></button>
				</div>
				<div class="context-section"><div class="section-heading"><span>Actividad reciente</span><button type="button">Ver todo</button></div><div class="activity-item"><span class="activity-icon">⌕</span><div><strong>Tu primera conversación</strong><small>Ahora mismo</small></div></div></div>
				<div class="context-section capabilities"><div class="section-heading"><span>Puede ayudarte a</span></div><div class="capability"><span>⌁</span><div><strong>Explorar la web</strong><small>Busca y compara ideas</small></div></div><div class="capability"><span>◌</span><div><strong>Entender lo complejo</strong><small>Resúmenes claros y útiles</small></div></div></div>
				<div class="context-footer">SLICK <span>v1.0</span></div>
			</aside>
		</div>
	);
};

ChatView.style = css`
	:scope { width: 100%; height: 100%; display: flex; min-width: 0; background: #f6f7f3; color: #202421; font-family: "DM Sans", "Segoe UI", sans-serif; }
	.chat-main { flex: 1; min-width: 0; display: flex; flex-direction: column; }.chat-header { display: flex; justify-content: space-between; align-items: center; padding: 30px 5vw 22px; border-bottom: 1px solid #dfe2dc; }.brand-lockup { display: flex; align-items: center; gap: 13px; }.brand-mark { width: 38px; height: 38px; display: grid; place-items: center; background: #ceff4a; border-radius: 12px; color: #17210e; font: 700 21px Georgia, serif; box-shadow: 0 5px 12px #b9d98266; }.eyebrow, .intro-kicker, .context-label { color: #718070; letter-spacing: .13em; font-size: 10px; font-weight: 700; }h1 { margin: 3px 0 0; font: 500 18px Georgia, serif; letter-spacing: -.02em; }.header-status { display: flex; gap: 8px; align-items: center; color: #718070; font-size: 12px; }.status-dot { width: 7px; height: 7px; background: #9fc735; border-radius: 50%; }
	.conversation { flex: 1; width: min(760px, 90%); margin: 0 auto; padding: 6vh 0 36px; overflow: auto; }.conversation-intro { margin-bottom: 40px; }.conversation-intro h2 { margin: 10px 0 8px; font: 500 clamp(28px, 4vw, 46px) Georgia, serif; letter-spacing: -.045em; line-height: 1.05; color: #293029; }.conversation-intro p { color: #7d877b; margin: 0; font-size: 14px; }.message-list { display: flex; flex-direction: column; gap: 20px; }.message-row { display: flex; gap: 11px; align-items: flex-start; max-width: 85%; animation: rise .3s ease both; }.message-row.user { align-self: flex-end; flex-direction: row-reverse; }.assistant-avatar { width: 27px; height: 27px; flex: 0 0 27px; display: grid; place-items: center; background: #202820; color: #d4fb65; border-radius: 9px; font-size: 13px; }.message-content { min-width: 0; }.message-meta { display: flex; align-items: center; gap: 8px; margin: 0 0 6px 2px; color: #526052; font-size: 11px; font-weight: 700; }.message-meta span { color: #a0aaa0; font-weight: 400; }.message-bubble { padding: 13px 16px; border: 1px solid #e1e5dd; border-radius: 4px 15px 15px 15px; color: #384138; background: #fff; font-size: 14px; line-height: 1.55; box-shadow: 0 4px 16px #34422a0a; }.user .message-bubble { border-color: #d8e7b6; border-radius: 15px 4px 15px 15px; background: #e9f5ca; }.thinking { display: flex; gap: 4px; padding: 12px 15px; background: #fff; border: 1px solid #e1e5dd; border-radius: 4px 15px 15px 15px; }.thinking span { width: 5px; height: 5px; border-radius: 50%; background: #a9b4a5; animation: blink 1s infinite; }.thinking span:nth-child(2) { animation-delay: .15s; }.thinking span:nth-child(3) { animation-delay: .3s; }
	.composer-zone { width: min(760px, 90%); margin: auto auto 0; padding: 0 0 25px; }.suggestions { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 11px; }.suggestions button { white-space: nowrap; padding: 8px 11px; color: #687467; background: transparent; border: 1px solid #d9ded5; border-radius: 20px; font: inherit; font-size: 11px; cursor: pointer; }.suggestions button:hover { border-color: #9bb967; color: #354430; }.suggestions span { margin-left: 9px; color: #94aa70; }.composer { display: flex; align-items: flex-end; gap: 10px; padding: 11px 11px 11px 16px; background: #fff; border: 1px solid #cfd8c6; border-radius: 16px; box-shadow: 0 8px 22px #34422a12; }.composer textarea { flex: 1; resize: none; border: 0; outline: 0; background: transparent; color: #273026; font: inherit; font-size: 14px; line-height: 1.5; max-height: 100px; }.composer textarea::placeholder { color: #abb5aa; }.send-button { width: 31px; height: 31px; border: 0; border-radius: 10px; background: #202820; color: #d4fb65; font-size: 20px; cursor: pointer; }.send-button:hover { background: #344431; }.composer-footer { display: flex; justify-content: space-between; padding: 8px 3px 0; color: #a0aaa0; font-size: 10px; }
	.context-panel { width: 284px; flex: 0 0 284px; display: flex; flex-direction: column; padding: 31px 25px 21px; background: #edf0e9; border-left: 1px solid #dfe2dc; }.context-top, .section-heading { display: flex; justify-content: space-between; align-items: center; }.icon-button { border: 0; background: transparent; color: #788477; cursor: pointer; letter-spacing: 2px; }.profile-card { margin: 29px 0 34px; padding: 20px; background: #dff3aa; border-radius: 17px; }.profile-orbit { width: 45px; height: 45px; display: grid; place-items: center; margin-bottom: 22px; background: #202820; border-radius: 50%; color: #d4fb65; font-size: 20px; }.profile-card h3 { margin: 0 0 9px; font: 500 21px Georgia, serif; line-height: 1.1; letter-spacing: -.03em; }.profile-card p { margin: 0 0 21px; color: #617054; font-size: 12px; line-height: 1.5; }.browser-cta { display: flex; width: 100%; justify-content: space-between; align-items: center; padding: 10px 12px; border: 0; border-radius: 9px; background: #202820; color: #e2ff9a; font: inherit; font-size: 11px; cursor: pointer; }.browser-cta:hover { background: #344431; }.context-section { margin-bottom: 29px; }.section-heading { padding-bottom: 13px; color: #5b6859; font-size: 11px; font-weight: 700; }.section-heading button { border: 0; padding: 0; background: transparent; color: #8a9788; font: inherit; font-size: 10px; cursor: pointer; }.activity-item, .capability { display: flex; gap: 11px; align-items: center; padding: 12px 0; border-top: 1px solid #dce1d9; }.activity-icon, .capability > span { width: 26px; height: 26px; display: grid; place-items: center; border: 1px solid #ccd5c8; border-radius: 8px; color: #65755f; }.activity-item strong, .capability strong { display: block; color: #4f5c4d; font-size: 11px; font-weight: 700; }.activity-item small, .capability small { display: block; margin-top: 3px; color: #929d90; font-size: 10px; }.capability { border-top: 0; padding: 8px 0; }.capabilities { margin-top: 30px; }.context-footer { margin-top: auto; color: #849080; font-size: 10px; letter-spacing: .14em; }.context-footer span { float: right; letter-spacing: 0; color: #a2ada0; }
	@keyframes rise { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } } @keyframes blink { 0%, 100% { opacity: .35; } 50% { opacity: 1; } }
	/* Slick's chat layer: keep the interface quiet and put the conversation first. */
	:scope { background: #171717; color: #ececec; font-family: "DM Sans", "Segoe UI", sans-serif; }
	.chat-sidebar { width: 248px; flex: 0 0 248px; display: flex; flex-direction: column; gap: 5px; padding: 18px 13px 13px; background: #101010; border-right: 1px solid #292929; color: #a9a9a9; }
	.sidebar-brand { display: flex; align-items: center; gap: 9px; padding: 2px 10px 24px; color: #f5f5f5; font-size: 17px; }.sidebar-brand span { color: #baff3d; font-size: 9px; font-weight: 800; letter-spacing: .1em; align-self: flex-start; margin-top: 2px; }.sidebar-mark { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 8px; background: #baff3d; color: #111; font: 700 16px Georgia, serif; }
	.new-chat { display: flex; align-items: center; gap: 9px; width: 100%; padding: 10px 11px; border: 1px solid #363636; border-radius: 8px; background: #202020; color: #ededed; text-align: left; font: inherit; font-size: 12px; cursor: pointer; }.new-chat:hover { background: #292929; border-color: #4a4a4a; }.new-chat b { color: #baff3d; font-size: 17px; font-weight: 400; }
	.sidebar-label { padding: 24px 11px 7px; color: #696969; font-size: 10px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }.history-item, .sidebar-link { display: flex; align-items: center; gap: 10px; width: 100%; padding: 9px 11px; overflow: hidden; border: 0; border-radius: 7px; background: transparent; color: #939393; text-align: left; font: inherit; font-size: 12px; white-space: nowrap; text-overflow: ellipsis; cursor: pointer; }.history-item span, .sidebar-link span { width: 15px; color: #777; text-align: center; }.history-item.active, .history-item:hover, .sidebar-link:hover { background: #252525; color: #e2e2e2; }.history-item.active span { color: #baff3d; }.sidebar-spacer { flex: 1; }.sidebar-link { color: #898989; }.sidebar-user { display: flex; align-items: center; gap: 9px; margin-top: 12px; padding: 11px 8px 4px; border-top: 1px solid #292929; color: #ddd; font-size: 11px; }.sidebar-user strong, .sidebar-user small { display: block; }.sidebar-user small { margin-top: 2px; color: #707070; font-size: 10px; }.sidebar-user > span { margin-left: auto; color: #707070; letter-spacing: 2px; }.user-avatar { width: 27px; height: 27px; display: grid; place-items: center; border-radius: 50%; background: #303030; color: #baff3d; font-size: 11px; }
	.chat-main { background: #171717; }.chat-header { height: 65px; padding: 0 34px; border-bottom: 1px solid #292929; background: #171717; }.brand-mark { display: none; }.eyebrow, .intro-kicker, .context-label { color: #777; font-size: 9px; letter-spacing: .15em; }.chat-header h1 { color: #e6e6e6; font: 500 14px "DM Sans", sans-serif; letter-spacing: 0; }.header-actions { display: flex; gap: 8px; }.header-actions button { width: 29px; height: 29px; border: 1px solid #333; border-radius: 7px; background: transparent; color: #9b9b9b; cursor: pointer; }.header-actions button:hover { color: #eee; background: #242424; }
	.conversation { width: min(780px, calc(100% - 48px)); padding: 8vh 0 42px; }.conversation-intro { text-align: center; margin-bottom: 52px; }.conversation-intro h2 { color: #f0f0f0; font: 500 clamp(29px, 4vw, 43px) Georgia, serif; letter-spacing: -.045em; }.conversation-intro p { color: #777; }.message-list { gap: 28px; }.message-row { max-width: 92%; }.assistant-avatar { background: #baff3d; color: #111; border-radius: 50%; }.message-meta { color: #d0d0d0; }.message-meta span { color: #686868; }.message-bubble { padding: 0; border: 0; border-radius: 0; background: transparent; color: #d0d0d0; box-shadow: none; line-height: 1.7; }.user .message-bubble { padding: 10px 14px; border: 1px solid #363636; border-radius: 12px; background: #252525; color: #e4e4e4; }.thinking { padding: 11px 13px; border-color: #333; background: #242424; }.thinking span { background: #baff3d; }
	.composer-zone { width: min(780px, calc(100% - 48px)); padding-bottom: 25px; }.suggestions { justify-content: center; }.suggestions button { color: #969696; border-color: #353535; background: #1d1d1d; }.suggestions button:hover { color: #d5d5d5; border-color: #657338; background: #242424; }.composer { padding: 13px 13px 13px 17px; border-color: #414141; border-radius: 14px; background: #242424; box-shadow: 0 12px 35px #00000045; }.composer:focus-within { border-color: #6a803b; box-shadow: 0 0 0 1px #6a803b55, 0 12px 35px #00000045; }.composer textarea { color: #eee; }.composer textarea::placeholder { color: #777; }.send-button { background: #baff3d; color: #101010; border-radius: 9px; font-weight: 700; }.send-button:hover { background: #d0ff70; }.composer-footer { color: #626262; }.context-panel { display: none; }
	@media (max-width: 760px) { .chat-sidebar { width: 54px; flex-basis: 54px; padding: 18px 8px; }.sidebar-brand { justify-content: center; padding: 2px 0 24px; }.sidebar-brand strong, .sidebar-brand span, .new-chat:not(:has(b)), .sidebar-label, .history-item:not(.active), .history-item.active, .sidebar-link, .sidebar-user strong, .sidebar-user small, .sidebar-user > span { font-size: 0; }.new-chat { justify-content: center; padding: 9px 0; }.history-item.active { display: none; }.sidebar-user { justify-content: center; padding-left: 0; padding-right: 0; }.chat-header { padding: 0 18px; }.conversation, .composer-zone { width: calc(100% - 32px); }.conversation { padding-top: 45px; }.conversation-intro { margin-bottom: 35px; }.composer-footer span:last-child { display: none; }.suggestions { justify-content: flex-start; } }
`;

export default ChatView;