// Navegação: um slide por vez, passos dentro do slide, teclado (setas, espaço,
// PageUp/PageDown de passador), clique, swipe, endereço (#/id/passo) e a
// transição pelo escuro (a tela apaga, o slide troca, a luz volta).

import { $, clamp, movimentoReduzido } from "./util.js";
import { rotuloSlide } from "./render.js";
import * as som from "./som.js";

const INTERATIVOS = "button, a, input, textarea, select, iframe, label, [data-nao-navegar], .som";

export class Deck {
  constructor({ slides, renders, canal, previa, cinzas }) {
    this.slides = slides;
    this.renders = renders;
    this.canal = canal;
    this.previa = previa;
    this.cinzas = cinzas;
    this.visivel = -1;
    this.estado = { index: 0, passo: 0 };
    this.emTransicao = false;
    this.cortina = $("#cortina");
  }

  get total() {
    return this.slides.length;
  }
  passosDe(i) {
    return this.renders[i]?.passos || 0;
  }

  iniciar() {
    const [i, p] = this.lerEndereco();
    this.irPara(i, p, { instantaneo: true });
    addEventListener("hashchange", () => {
      const [ni, np] = this.lerEndereco();
      if (ni !== this.estado.index || np !== this.estado.passo) this.irPara(ni, np, { instantaneo: this.previa });
    });
    if (!this.previa) this.ligarEntradas();
  }

  proximo() {
    const { index, passo } = this.estado;
    if (passo < this.passosDe(index)) this.irPara(index, passo + 1);
    else if (index < this.total - 1) this.irPara(index + 1, 0);
  }

  anterior() {
    const { index, passo } = this.estado;
    if (passo > 0) this.irPara(index, passo - 1);
    else if (index > 0) this.irPara(index - 1, this.passosDe(index - 1));
  }

  irPara(index, passo = 0, { instantaneo = false } = {}) {
    index = clamp(index | 0, 0, this.total - 1);
    passo = clamp(passo | 0, 0, this.passosDe(index));
    this.estado = { index, passo };
    if (this.emTransicao) return;

    if (index === this.visivel) {
      this.aplicarPasso(passo);
      this.publicar();
      return;
    }
    if (instantaneo || this.previa || movimentoReduzido() || this.visivel < 0 || !this.cortina?.animate) {
      this.mostrar(index, passo);
      return;
    }

    this.emTransicao = true;
    const apagar = this.cortina.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 320, easing: "ease-in", fill: "forwards" });
    apagar.finished
      .then(() => {
        this.mostrar(this.estado.index, this.estado.passo);
        return this.cortina.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 750, easing: "ease-out", fill: "forwards" }).finished;
      })
      .catch(() => this.mostrar(this.estado.index, this.estado.passo))
      .finally(() => {
        this.emTransicao = false;
        const { index: i, passo: p } = this.estado;
        if (i !== this.visivel) this.mostrar(i, p);
        else if (p !== this.passoVisivel) this.aplicarPasso(p);
      });
  }

  mostrar(index, passo) {
    const antigo = this.renders[this.visivel];
    if (antigo) {
      antigo.el.classList.remove("is-active");
      antigo.aoSair?.();
    }
    const novo = this.renders[index];
    novo.el.classList.add("is-active");
    this.visivel = index;
    document.body.dataset.slide = this.slides[index].id;
    this.cinzas?.ligar(novo.el.dataset.cinzas === "1");
    this.aplicarPasso(passo, true);
    novo.aoEntrar?.(passo);
    this.atualizarChrome();
    this.publicar();
  }

  aplicarPasso(passo, entrando = false) {
    const r = this.renders[this.visivel];
    if (!r) return;
    this.passoVisivel = passo;
    r.el.dataset.passo = passo;
    r.el.classList.toggle("entrando", entrando);
    r.el.querySelectorAll("[data-passo]").forEach((n) => n.classList.toggle("on", Number(n.dataset.passo) <= passo));
    r.aoPasso?.(passo, { entrando });
    if (entrando) requestAnimationFrame(() => requestAnimationFrame(() => r.el.classList.remove("entrando")));
  }

  lerEndereco() {
    const m = /^#\/([^/]+)(?:\/(\d+))?/.exec(location.hash);
    if (!m) return [0, 0];
    const i = this.slides.findIndex((s) => s.id === decodeURIComponent(m[1]));
    return i < 0 ? [0, 0] : [i, Number(m[2] || 0)];
  }

  publicar() {
    const { index, passo } = this.estado;
    const hash = `#/${encodeURIComponent(this.slides[index].id)}/${passo}`;
    if (!this.previa && location.hash !== hash) history.replaceState(null, "", hash);
    this.canal?.enviar({ tipo: "estado", index, passo, total: this.total });
    if (this.visivel > 0 || passo > 0) document.querySelector(".dica")?.classList.add("some");
  }

  atualizarChrome() {
    if (this.previa) return;
    const i = this.visivel;
    const cont = $(".contador");
    if (cont) cont.innerHTML = `${String(i + 1).padStart(2, "0")} <span class="de">/ ${String(this.total).padStart(2, "0")}</span>`;
    const barra = $(".progresso span");
    if (barra) barra.style.transform = `scaleX(${this.total > 1 ? i / (this.total - 1) : 1})`;
    document.title = `${rotuloSlide(this.slides[i])} · Ditadura 1964–1985`;
  }

  roteiro() {
    return this.slides.map((s, i) => ({ id: s.id, titulo: rotuloSlide(s), notas: s.notas || "", passos: this.passosDe(i) }));
  }

  ligarEntradas() {
    addEventListener("keydown", (e) => {
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest?.("input, textarea, select")) return;
      som.desbloquear();
      const k = e.key;
      let feito = true;
      if (k === "ArrowRight" || k === "ArrowDown" || k === "PageDown" || k === "Enter" || (k === " " && !e.shiftKey)) this.proximo();
      else if (k === "ArrowLeft" || k === "ArrowUp" || k === "PageUp" || k === "Backspace" || (k === " " && e.shiftKey)) this.anterior();
      else if (k === "Home") this.irPara(0, 0);
      else if (k === "End") this.irPara(this.total - 1, 0);
      else if (k === "f" || k === "F") this.telaCheia();
      else if (k === "n" || k === "N") this.abrirApresentador();
      else if (k === "m" || k === "M") som.alternar();
      else if (k === "b" || k === "B" || k === ".") this.alternarBlackout();
      else if (k === "Escape" && document.body.classList.contains("blackout")) this.alternarBlackout();
      else feito = false;
      if (feito) e.preventDefault();
    });

    let toque = null;
    addEventListener(
      "pointerdown",
      (e) => {
        som.desbloquear();
        toque = { x: e.clientX, y: e.clientY, tipo: e.pointerType, alvo: e.target, botao: e.button };
      },
      { passive: true },
    );
    addEventListener("pointerup", (e) => {
      const t = toque;
      toque = null;
      if (!t || t.alvo.closest?.(INTERATIVOS)) return;
      if (document.body.classList.contains("blackout")) return this.alternarBlackout();
      const dx = e.clientX - t.x;
      const dy = e.clientY - t.y;
      if (t.tipo === "touch" || t.tipo === "pen") {
        if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) (dx < 0 ? this.proximo() : this.anterior());
        return;
      }
      if (t.botao !== 0 || Math.hypot(dx, dy) > 8) return;
      if (e.clientX < innerWidth * 0.16) this.anterior();
      else this.proximo();
    });
    addEventListener("pointercancel", () => (toque = null));
  }

  telaCheia() {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.().catch(() => {});
    else document.exitFullscreen?.();
  }

  alternarBlackout() {
    document.body.classList.toggle("blackout");
  }

  abrirApresentador() {
    const w = open("presenter.html", "aula-ditadura-apresentador", "popup,width=1280,height=800");
    if (!w) alert("O navegador bloqueou a janela do apresentador. Permita pop-ups para este site e aperte N de novo.");
  }
}
