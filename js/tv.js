// A TV do "milagre": um televisor dos anos 1970 que liga sozinho, mostra as barras
// coloridas e passa os slogans da propaganda, um por canal. Clicar na TV muda de
// canal (o seletor gira e a tela chia). Todos os tempos passam pela Cena do slide,
// então tudo para quando o slide sai.

import { el, escapeHtml, movimentoReduzido } from "./util.js";
import * as som from "./som.js";

const BARRAS = ["#c9c9c9", "#d6c21c", "#1fb5b5", "#22a83a", "#b52aa4", "#c3262b", "#2a3fb8"];

export function criarTV(slogans, legenda) {
  const slogan = el("p", { class: "tv-slogan" });
  const programa = el("div", { class: "tv-programa" }, el("i", { class: "tv-fundo", "aria-hidden": "true" }), slogan);
  const chiado = el("canvas", { class: "tv-chiado", width: 160, height: 120, "aria-hidden": "true" });
  const seletor = el("span", { class: "tv-botao seletor" });
  const raiz = el(
    "figure",
    { class: "mi-tv desligada", "data-nao-navegar": true, title: "Clique para mudar de canal" },
    el("div", { class: "tv-antena", "aria-hidden": "true" }, el("i"), el("i")),
    el(
      "div",
      { class: "tv-movel" },
      el(
        "div",
        { class: "tv-moldura" },
        el(
          "div",
          { class: "tv-tela" },
          el("div", { class: "tv-imagem" }, el("div", { class: "tv-barras", "aria-hidden": "true" }, BARRAS.map((c) => el("i", { style: { background: c } }))), programa),
          chiado,
          el("i", { class: "tv-linhas", "aria-hidden": "true" }),
          el("i", { class: "tv-brilho", "aria-hidden": "true" }),
        ),
      ),
      el("div", { class: "tv-painel", "aria-hidden": "true" }, seletor, el("span", { class: "tv-botao" }), el("span", { class: "tv-grade" }), el("span", { class: "tv-luz" })),
    ),
    el("div", { class: "tv-pes", "aria-hidden": "true" }, el("i"), el("i")),
    legenda && el("figcaption", { html: legenda }),
  );

  const g = chiado.getContext("2d");
  let canal = 0;
  let cena = null;
  let vez = 0; // muda a cada (re)início, para descartar agendamentos antigos

  const mostrar = (n) => {
    canal = (n + slogans.length) % slogans.length;
    // Palavras com hífen não quebram ("DEIXE-/O").
    slogan.innerHTML = `“${escapeHtml(slogans[canal])}”`.replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');
    programa.dataset.canal = String(canal % 3);
    seletor.style.setProperty("--giro", `${canal * 40 - 40}deg`);
  };

  const pintarChiado = () => {
    const img = g.createImageData(160, 120);
    for (let k = 0; k < img.data.length; k += 4) {
      const v = (Math.random() * 255) | 0;
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v;
      img.data[k + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  };

  /** Chiado por alguns quadros e, no fim, o próximo canal. */
  const chiar = (quadros, depois) => {
    if (movimentoReduzido()) return depois();
    raiz.classList.add("chiando");
    let q = 0;
    cena.quadro(() => {
      pintarChiado();
      if (++q < quadros) return true;
      raiz.classList.remove("chiando");
      depois();
      return false;
    });
  };

  const agendar = () => {
    const minha = vez;
    cena.depois(3400, () => {
      if (minha !== vez) return;
      chiar(9, () => mostrar(canal + 1));
      agendar();
    });
  };

  raiz.addEventListener("click", () => {
    if (!cena || raiz.classList.contains("desligada")) return;
    som.clique();
    vez++;
    chiar(9, () => mostrar(canal + 1));
    agendar();
  });

  mostrar(0);

  return {
    el: raiz,
    /** Liga a TV: a imagem abre numa linha, mostra as barras e entra no primeiro canal. */
    ligar(cenaDoSlide, { imediato = false } = {}) {
      cena = cenaDoSlide;
      vez++;
      mostrar(0);
      raiz.classList.remove("desligada", "barras", "ligando", "chiando");
      if (imediato || movimentoReduzido()) return agendar();
      raiz.classList.add("desligada");
      cena.depois(900, () => {
        raiz.classList.remove("desligada");
        raiz.classList.add("ligando", "barras");
      });
      cena.depois(2700, () =>
        chiar(10, () => {
          raiz.classList.remove("barras", "ligando");
          agendar();
        }),
      );
    },
    desligar() {
      vez++;
      raiz.classList.remove("ligando", "barras", "chiando");
      raiz.classList.add("desligada");
    },
  };
}
