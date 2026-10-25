// Ponto de entrada: carrega o conteúdo, monta as cenas e liga navegação, som e efeitos.
// index.html?previa → modo prévia (os quadros do modo apresentador).

import { $, el } from "./util.js";
import { renderizar } from "./render.js";
import { Deck } from "./deck.js";
import { Cinzas } from "./fx.js";
import { abrirCanal } from "./sync.js";
import * as som from "./som.js";

const previa = new URLSearchParams(location.search).has("previa");

async function ler(url) {
  let r;
  try {
    r = await fetch(url, { cache: "no-cache" });
  } catch {
    throw Object.assign(new Error("Não foi possível ler o arquivo. Abra o site por um servidor (npx serve .) ou pelo link publicado."), { arquivo: url });
  }
  if (!r.ok) throw Object.assign(new Error(`Arquivo não encontrado (HTTP ${r.status}).`), { arquivo: url });
  const texto = await r.text();
  try {
    return JSON.parse(texto);
  } catch (e) {
    throw Object.assign(new Error(`JSON inválido: ${e.message}\nConfira vírgulas no fim de listas e aspas duplas.`), { arquivo: url });
  }
}

async function iniciar() {
  if (previa) document.body.classList.add("previa");
  let conteudo;
  try {
    const [roteiro, fontes, vitimas] = await Promise.all([ler("content/slides.json"), ler("content/fontes.json"), ler("content/vitimas.json")]);
    conteudo = { slides: roteiro.slides, fontes, vitimas: vitimas.vitimas };
  } catch (e) {
    return mostrarErro(e);
  }

  // Efeitos de tela usados pelas cenas.
  const fx = {
    flash() {
      const f = $("#flash");
      f.classList.remove("ativo");
      void f.offsetWidth;
      f.classList.add("ativo");
    },
    tremor() {
      const d = $("#deck");
      d.classList.remove("tremor");
      void d.offsetWidth;
      d.classList.add("tremor");
    },
    pulso() {
      document.body.classList.remove("pulso");
      void document.body.offsetWidth;
      document.body.classList.add("pulso");
    },
  };
  const ctx = { ...conteudo, fx, previa };

  const deckEl = $("#deck");
  const renders = conteudo.slides.map((s) => {
    try {
      const r = renderizar(s, ctx);
      deckEl.append(r.el);
      return r;
    } catch (e) {
      console.error(`[slide ${s.id}]`, e);
      const falha = el("section", { class: "slide" }, el("div", { class: "stage" }, el("p", { class: "aviso", text: `Erro no slide "${s.id}": ${e.message}` })));
      deckEl.append(falha);
      return { el: falha, passos: 0 };
    }
  });

  const cinzas = previa ? null : new Cinzas($("#cinzas"));

  let deck;
  const canal = previa
    ? null
    : abrirCanal((m) => {
        if (!deck || !m) return;
        if (m.tipo === "ola") {
          canal.enviar({ tipo: "roteiro", slides: deck.roteiro() });
          deck.publicar();
          canal.enviar({ tipo: "som", ligado: som.estaLigado() });
        } else if (m.tipo === "nav") {
          if (m.acao === "proximo") deck.proximo();
          else if (m.acao === "anterior") deck.anterior();
          else if (m.acao === "ir") deck.irPara(m.index, m.passo || 0);
        } else if (m.tipo === "som") {
          som.alternar();
        } else if (m.tipo === "blackout") {
          deck.alternarBlackout();
        }
      });

  deck = new Deck({ slides: conteudo.slides, renders, canal, previa, cinzas });
  deck.iniciar();

  if (!previa) {
    const botao = $(".som");
    const atualizarSom = (ligado) => {
      botao.classList.toggle("mudo", !ligado);
      botao.querySelector(".som-txt").textContent = ligado ? "som" : "mudo";
      botao.setAttribute("aria-label", ligado ? "Desligar os efeitos de som (M)" : "Ligar os efeitos de som (M)");
      canal?.enviar({ tipo: "som", ligado });
    };
    botao.addEventListener("click", () => {
      som.desbloquear();
      som.alternar();
      botao.blur();
    });
    som.aoMudar(atualizarSom);
    atualizarSom(som.estaLigado());
    setTimeout(() => $(".dica")?.classList.add("some"), 10000);
    registrarSW();
  }
  document.body.classList.remove("carregando");
}

function mostrarErro(e) {
  console.error(e);
  const caixa = $("#erro");
  caixa.replaceChildren(
    el("h1", { text: "O conteúdo precisa de um ajuste" }),
    e.arquivo && el("p", {}, "Arquivo: ", el("strong", { text: e.arquivo })),
    el("pre", { text: e.message || String(e) }),
  );
  caixa.classList.add("visivel");
  document.body.classList.remove("carregando");
}

// Guarda uma cópia para funcionar sem internet depois da primeira visita (sempre tenta a rede antes).
function registrarSW() {
  if (!("serviceWorker" in navigator)) return;
  if (new URLSearchParams(location.search).has("semcache")) {
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister()));
    window.caches?.keys().then((ks) => ks.forEach((k) => caches.delete(k)));
    return;
  }
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

iniciar();
