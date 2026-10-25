// Ferramentas de animação: cena (cancela tudo ao sair do slide), digitação,
// contador, embaralhar, cinzas caindo e multidão.

import { clamp, lerp, mulberry32, movimentoReduzido } from "./util.js";
import * as som from "./som.js";

/** Agrupa timers e laços de um slide para cancelar tudo de uma vez. */
export class Cena {
  constructor() {
    this.ids = new Set();
    this.rafs = new Set();
    this.geracao = 0;
  }
  espera(ms) {
    const g = this.geracao;
    return new Promise((ok, falha) => {
      const id = setTimeout(() => {
        this.ids.delete(id);
        g === this.geracao ? ok() : falha(new Error("cena encerrada"));
      }, ms);
      this.ids.add(id);
    });
  }
  depois(ms, fn) {
    const id = setTimeout(() => {
      this.ids.delete(id);
      fn();
    }, ms);
    this.ids.add(id);
  }
  quadro(fn) {
    const passo = (t) => {
      this.rafs.delete(id);
      if (fn(t) !== false) {
        id = requestAnimationFrame(passo);
        this.rafs.add(id);
      }
    };
    let id = requestAnimationFrame(passo);
    this.rafs.add(id);
  }
  limpar() {
    this.geracao++;
    this.ids.forEach(clearTimeout);
    this.rafs.forEach(cancelAnimationFrame);
    this.ids.clear();
    this.rafs.clear();
  }
}

/** Escreve o texto letra a letra, com som de máquina de escrever. */
// Cada elemento guarda a digitação em curso; escrever o texto direto (fixarTexto) a cancela.
const digitando = new WeakMap();

/** Escreve o texto de uma vez, cancelando qualquer digitação em curso no elemento. */
export function fixarTexto(el, texto) {
  digitando.delete(el);
  el.classList.remove("cursor");
  el.textContent = texto;
}

/** Máquina de escrever. Devolve false se foi cancelada no meio. */
export async function digitar(el, texto, cena, { ms = 32, som: comSom = true, cursor = true } = {}) {
  if (movimentoReduzido()) {
    fixarTexto(el, texto);
    return true;
  }
  const vez = {};
  digitando.set(el, vez);
  el.textContent = "";
  if (cursor) el.classList.add("cursor");
  try {
    for (let i = 0; i < texto.length; i++) {
      if (digitando.get(el) !== vez) return false;
      el.textContent = texto.slice(0, i + 1);
      if (comSom && texto[i] !== " " && i % 2 === 0) som.tecla();
      await cena.espera(texto[i] === "." || texto[i] === "," ? ms * 6 : ms);
    }
    return digitando.get(el) === vez;
  } finally {
    if (digitando.get(el) === vez) {
      digitando.delete(el);
      if (cursor) cena.depois(1200, () => el.classList.remove("cursor"));
    }
  }
}

const formatar = (n) => Math.round(n).toLocaleString("pt-BR");

/** Conta de um número a outro, desacelerando no fim. */
export function contar(el, de, ate, ms, cena, { formato = formatar, aoTerminar } = {}) {
  if (movimentoReduzido() || ms <= 0) {
    el.textContent = formato(ate);
    aoTerminar?.();
    return;
  }
  const t0 = performance.now();
  cena.quadro((t) => {
    const k = clamp((t - t0) / ms, 0, 1);
    const e = 1 - Math.pow(1 - k, 3);
    el.textContent = formato(lerp(de, ate, e));
    if (k >= 1) {
      aoTerminar?.();
      return false;
    }
  });
}

/** Painel de datas: os caracteres embaralham e assentam da esquerda para a direita. */
export function embaralhar(el, alvo, cena, ms = 900) {
  if (movimentoReduzido()) {
    el.textContent = alvo;
    return;
  }
  const chars = "0123456789";
  const t0 = performance.now();
  let ultimo = 0;
  cena.quadro((t) => {
    const k = clamp((t - t0) / ms, 0, 1);
    const fixos = Math.floor(k * alvo.length);
    let s = "";
    for (let i = 0; i < alvo.length; i++) {
      s += i < fixos || !/\d/.test(alvo[i]) ? alvo[i] : chars[(Math.random() * 10) | 0];
    }
    el.textContent = s;
    if (t - ultimo > 55) {
      som.clique();
      ultimo = t;
    }
    if (k >= 1) {
      el.textContent = alvo;
      return false;
    }
  });
}

/* ------------------------------------------------------------- cinzas */

/** Cinzas e brasas caindo devagar atrás dos slides. */
export class Cinzas {
  constructor(canvas) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    this.ativo = false;
    const r = mulberry32(64);
    this.p = Array.from({ length: 140 }, () => this.nova(r, true));
    this.r = r;
    this.ajustar();
    addEventListener("resize", () => this.ajustar());
    requestAnimationFrame(this.laco);
  }
  nova(r, espalhar) {
    const brasa = r() < 0.12;
    return {
      x: r(),
      y: espalhar ? r() : -0.05,
      v: 0.00012 + r() * 0.00028,
      deriva: (r() - 0.5) * 0.00012,
      fase: r() * Math.PI * 2,
      tam: brasa ? 1 + r() * 1.6 : 0.6 + r() * 2.4,
      brasa,
      alfa: brasa ? 0.5 + r() * 0.5 : 0.15 + r() * 0.35,
    };
  }
  ajustar() {
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = innerWidth * this.dpr;
    this.canvas.height = innerHeight * this.dpr;
  }
  ligar(sim) {
    this.ativo = sim && !movimentoReduzido();
    document.body.classList.toggle("com-cinzas", this.ativo);
  }
  laco = (t) => {
    requestAnimationFrame(this.laco);
    if (!this.ativo && !document.body.classList.contains("com-cinzas")) return;
    const { g, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);
    const dt = 16;
    for (const p of this.p) {
      p.y += p.v * dt;
      p.x += p.deriva * dt + Math.sin(t * 0.0006 + p.fase) * 0.00008;
      if (p.y > 1.05) Object.assign(p, this.nova(this.r, false));
      const x = p.x * W;
      const y = p.y * H;
      const s = p.tam * this.dpr;
      if (p.brasa) {
        const piscar = 0.6 + 0.4 * Math.sin(t * 0.004 + p.fase);
        g.fillStyle = `rgba(226, 90, 50, ${p.alfa * piscar})`;
      } else {
        g.fillStyle = `rgba(200, 192, 180, ${p.alfa})`;
      }
      g.beginPath();
      g.ellipse(x, y, s, s * 0.7, p.fase, 0, Math.PI * 2);
      g.fill();
    }
  };
}

/* ------------------------------------------------------------ multidão */

/** Uma multidão de pontos que entra pela parte de baixo e se adensa. */
export class Multidao {
  constructor(canvas, { semente = 7, max = 2600, cor = "235,228,214", destaque = "226,48,58" } = {}) {
    this.canvas = canvas;
    this.g = canvas.getContext("2d");
    this.max = max;
    this.cor = cor;
    this.destaque = destaque;
    const r = mulberry32(semente);
    // Pontos já ordenados de trás para a frente da multidão.
    this.p = Array.from({ length: max }, () => {
      const fundo = Math.pow(r(), 0.7);
      return {
        x: r(),
        y: 0.35 + fundo * 0.63,
        tam: 0.6 + fundo * 1.6,
        atraso: r() * 1400,
        fase: r() * 6.28,
        verm: r() < 0.03,
      };
    });
    this.densidade = 0;
    this.alvo = 0;
    this.visiveis = 0;
    this.imediato = false;
    this.apagar = 0;
    new ResizeObserver(() => this.ajustar()).observe(canvas);
  }
  ajustar() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = this.canvas.clientWidth * dpr;
    this.canvas.height = this.canvas.clientHeight * dpr;
    this.desenhar(performance.now());
  }
  /** densidade 0..1; instantaneo: sem animação. */
  ate(densidade, instantaneo = false) {
    this.alvo = densidade;
    if (instantaneo || movimentoReduzido()) {
      this.densidade = densidade;
      this.imediato = true;
    }
  }
  rodar(cena) {
    cena.quadro((t) => {
      this.densidade += (this.alvo - this.densidade) * 0.025;
      this.desenhar(t);
    });
  }
  desenhar(t) {
    const { g, canvas } = this;
    const W = canvas.width;
    const H = canvas.height;
    g.clearRect(0, 0, W, H);
    const n = Math.floor(this.max * this.densidade);
    // Quem entra agora ganha uma hora de chegada; quem já estava fica.
    while (this.visiveis < n) {
      const p = this.p[this.visiveis++];
      p.chegada = this.imediato ? -1e9 : t + p.atraso;
    }
    this.visiveis = Math.min(this.visiveis, n);
    this.imediato = false;
    for (let i = 0; i < n; i++) {
      const p = this.p[i];
      // cada ponto sobe de baixo até o seu lugar
      const k = clamp((t - p.chegada) / 1600, 0, 1);
      const y = lerp(1.15, p.y, 1 - Math.pow(1 - k, 3));
      const balanco = Math.sin(t * 0.002 + p.fase) * 0.0025;
      const x = (p.x + balanco) * W;
      const s = p.tam * (W / 1400);
      const alfa = (0.35 + 0.55 * (p.y - 0.35)) * (1 - this.apagar);
      g.fillStyle = `rgba(${p.verm ? this.destaque : this.cor}, ${alfa})`;
      g.beginPath();
      g.arc(x, y * H, Math.max(0.8, s * 2.2), 0, Math.PI * 2);
      g.fill();
    }
  }
}
