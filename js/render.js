// Monta cada slide e a sua cena animada a partir de content/slides.json.
// Cada renderizador devolve { passos, aoPasso(n, {entrando}), aoEntrar(passo), aoSair() }.
// "entrando" = o slide acabou de aparecer (voltando pela seta, por exemplo):
// nesse caso tudo vai direto para o estado final, sem som nem animação.

import { el, md, mulberry32, clamp, lerp, movimentoReduzido } from "./util.js";
import { Cena, digitar, fixarTexto, contar, embaralhar, Multidao } from "./fx.js";
import * as som from "./som.js";
import { criarTV } from "./tv.js";
import { cenasCaminho } from "./caminho.js";

const COM_CINZAS = new Set(["capa", "abertura", "numeros", "memorial"]);

export function rotuloSlide(s) {
  const t = s.rotulo || s.titulo || s.nome || s.sigla || s.kicker || s.id;
  return String(t).replace(/\*/g, "");
}

export function renderizar(slide, ctx) {
  const section = el("section", {
    class: `slide s-${slide.tipo}`,
    id: `slide-${slide.id}`,
    "data-cinzas": COM_CINZAS.has(slide.tipo) ? "1" : null,
    "aria-label": rotuloSlide(slide),
  });
  const stage = el("div", { class: "stage" });
  add(section, stage);
  const cena = new Cena();
  const fn = RENDER[slide.tipo];
  const api = fn ? fn(slide, stage, ctx, cena, section) || {} : {};
  if (!fn) stage.append(el("p", { class: "aviso", text: `Tipo de slide desconhecido: ${slide.tipo}` }));
  if (slide.fontes?.length) stage.append(linhaFontes(slide.fontes, ctx.fontes));
  return {
    el: section,
    passos: api.passos || 0,
    aoPasso: api.aoPasso,
    aoEntrar: api.aoEntrar,
    aoSair: () => {
      cena.limpar();
      api.aoSair?.();
    },
  };
}

/* ---------------------------------------------------------------- peças */

const kicker = (t, atraso = "0s") => t && el("p", { class: "kicker an-varre", style: { "--atraso": atraso }, html: md(t) });

function linhaFontes(chaves, fontes) {
  const nomes = chaves.map((k) => fontes[k]?.curta || k);
  return el("p", { class: "fontes" }, el("b", { text: "Fontes" }), nomes.join(" · "));
}

const atraso = (s) => ({ "--atraso": s });

/** Foto de arquivo: a imagem e o crédito, escrito na vertical ao lado (como em revista). */
const imagem = (f) => el("img", { src: f.arquivo, alt: f.alt || "", decoding: "async" });
const credito = (f) => f?.credito && el("figcaption", { class: "foto-credito", text: f.credito });

/** append que ignora valores vazios (null/undefined/false). */
const add = (pai, ...filhos) => pai.append(...filhos.flat().filter(Boolean));

/** Lista em que o primeiro item entra com o slide e os outros a cada passo. */
function listaEmPassos(itens, classe, { primeiroNoPasso = false } = {}) {
  return el(
    "ol",
    { class: classe },
    itens.map((t, i) =>
      el("li", {
        class: !primeiroNoPasso && i === 0 ? "an-varre" : "",
        style: atraso("0.9s"),
        "data-passo": !primeiroNoPasso && i === 0 ? null : primeiroNoPasso ? i + 1 : i,
        html: md(t),
      }),
    ),
  );
}

/* Silhuetas desenhadas à mão (SVG) */

const SVG_TANQUE = `<svg viewBox="0 0 124 52" aria-hidden="true">
  <rect x="7" y="33" width="94" height="15" rx="7.5" class="tq-esteira"/>
  <g class="tq-rodas">${[18, 32, 46, 60, 74, 88].map((x) => `<g transform="translate(${x} 40.5)"><circle r="5"/><line x1="-4" y1="0" x2="4" y2="0"/></g>`).join("")}</g>
  <path d="M10 33 L100 33 L106 25 L16 23 Z" class="tq-casco"/>
  <path d="M38 23 L43 12 L73 12 L80 23 Z" class="tq-torre"/>
  <rect x="78" y="15" width="44" height="3.2" class="tq-cano"/>
  <rect x="50" y="8.5" width="10" height="3.5" class="tq-torre"/>
</svg>`;

const SVG_NAVIO = `<svg viewBox="0 0 220 46" aria-hidden="true">
  <path d="M0 24 L220 24 L204 40 L16 40 Z" class="nv-casco"/>
  <rect x="6" y="20" width="200" height="4" class="nv-convoo"/>
  <path d="M132 20 L132 6 L150 6 L152 20 Z" class="nv-ilha"/>
  <line x1="141" y1="6" x2="141" y2="0" class="nv-mastro"/>
</svg>`;

const SVG_SILHUETA = `<svg viewBox="0 0 100 130" aria-hidden="true">
  <circle cx="50" cy="44" r="21"/>
  <path d="M8 130 C10 92 28 76 50 76 C72 76 90 92 92 130 Z"/>
</svg>`;

/* ================================================================ cenas */

/* 0 · Capa: o assunto fica na tela enquanto a turma se acomoda.
   Nada importante anda aqui: a animação começa no slide seguinte, quando a professora aperta →. */
function capa(s, st) {
  add(st,
    kicker(s.kicker, "0.2s"),
    el(
      "h1",
      { class: "cp-titulo" },
      el("span", { class: "cp-grande an-desfoca", style: atraso("0.4s"), text: s.titulo }),
      el("span", { class: "cp-sub an-varre", style: atraso("1.3s"), text: s.subtitulo }),
    ),
    el("div", { class: "cp-linha an-varre", style: atraso("1.8s") }),
    el("p", { class: "cp-periodo an-surge", style: atraso("2.3s"), text: s.periodo }),
    el("p", { class: "cp-comecar an-surge", style: atraso("3.2s") }, "aperte ", el("kbd", { text: "→" }), " para começar"),
    el("p", { class: "cp-aviso an-surge", style: atraso("3.6s"), html: md(s.aviso) }),
  );
}

/* 1 · Abertura: os anos correm de 1964 a 1985. */
function abertura(s, st, ctx, cena) {
  const ano = el("div", { class: "ab-ano an-desfoca", style: atraso("0.3s"), text: String(s.de) });
  add(st,
    kicker(s.kicker),
    ano,
    el("div", { class: "ab-linha" }),
    el("p", { class: "ab-intervalo", text: `${s.de} — ${s.ate}` }),
    el("h1", { class: "ab-titulo", html: md(s.titulo) }),
    el("p", { class: "ab-sub", html: md(s.subtitulo) }),
  );
  return {
    aoEntrar: () => {
      st.classList.remove("contou");
      ano.textContent = s.de;
      if (movimentoReduzido()) {
        ano.textContent = s.ate;
        st.classList.add("contou");
        return;
      }
      let atual = s.de;
      const tique = () => {
        atual++;
        ano.textContent = atual;
        som.clique();
        if (atual < s.ate) cena.depois(80 + (atual - s.de) * 9, tique);
        else {
          som.baque(1.2);
          st.classList.add("contou");
        }
      };
      cena.depois(1700, tique);
    },
  };
}

/* 2 · Um país rachado: os dois lados se afastam e a tela racha. */
function divisao(s, st, ctx, cena) {
  const lado = (l, classe) =>
    el(
      "div",
      { class: `dv-lado ${classe}` },
      el(
        "div",
        { class: "dv-conteudo" },
        el("p", { class: "dv-data", text: l.data }),
        el("h3", { class: "dv-nome", html: md(l.titulo) }),
        el("p", { class: "dv-texto", html: md(l.texto) }),
      ),
    );
  add(st,
    kicker(s.kicker),
    el("h2", { class: "dv-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    el("p", { class: "dv-intro an-surge", style: atraso("0.7s"), html: md(s.intro) }),
    lado(s.esquerda, "dv-esq"),
    lado(s.direita, "dv-dir"),
    el("div", {
      class: "dv-racha",
      "data-passo": 1,
      html: `<svg viewBox="0 0 10 100" preserveAspectRatio="none" aria-hidden="true"><path d="M5 0 L6.6 7 L3.8 14 L6.2 22 L3.4 30 L6 39 L4 47 L6.6 56 L3.6 65 L5.8 73 L3.9 82 L6.1 91 L5 100"/></svg>`,
    }),
    el("p", { class: "dv-rodape", "data-passo": 1, html: md(s.rodape) }),
  );
  return {
    passos: 1,
    aoPasso: (n, { entrando }) => {
      st.classList.toggle("rachado", n >= 1);
      if (n === 1 && !entrando) {
        som.rasgo();
        ctx.fx.tremor();
      }
    },
  };
}

/* 3 · O golpe: tanques, painel de datas, porta-aviões.
   Tudo como num cinejornal antigo: contagem de filme (3, 2, 1), perfurações, riscos e o projetor piscando. */
const LIDER_MS = 2500;

function golpe(s, st, ctx, cena, section) {
  const numero = el("span", { class: "gp-lider-num" });
  const lider = el("div", { class: "gp-lider", "aria-hidden": "true" }, el("i", { class: "gp-lider-varre" }), el("i", { class: "gp-lider-aro" }), numero);
  const filme = el(
    "div",
    { class: "gp-filme", "aria-hidden": "true" },
    el("i", { class: "gp-perf e" }),
    el("i", { class: "gp-perf d" }),
    el("i", { class: "gp-risco r1" }),
    el("i", { class: "gp-risco r2" }),
    el("i", { class: "gp-pisca" }),
  );
  add(section, filme, lider);
  let atual = 0;
  // Enquanto a contagem roda, as animações do palco ficam pausadas (CSS: .lider).
  const terminarLider = () => section.classList.remove("lider");
  const rodarLider = () => {
    section.classList.add("lider");
    [3, 2, 1].forEach((n, i) =>
      cena.depois(i * 760, () => {
        numero.textContent = n;
        lider.classList.remove("gira");
        void lider.offsetWidth;
        lider.classList.add("gira");
        som.clique();
      }),
    );
    cena.depois(LIDER_MS - 200, terminarLider);
  };
  const data = el("div", { class: "gp-data", text: s.datas[0].data });
  const texto = el("p", { class: "gp-texto", html: md(s.datas[0].texto) });
  add(st,
    kicker(s.kicker),
    el("div", { class: "gp-painel an-desfoca", style: atraso("0.4s") }, data),
    texto,
    el("p", { class: "gp-apoio an-surge", style: atraso("2.4s"), html: md(s.apoio) }),
    el("div", { class: "gp-chao" }),
    el("div", { class: "gp-tanques" }, [0, 1, 2].map((i) => el("div", { class: `gp-tanque t${i}`, html: SVG_TANQUE }))),
    el("div", { class: "gp-navio", "data-passo": 2, html: SVG_NAVIO }),
  );
  const mostrar = (n, animar) => {
    const d = s.datas[n];
    if (animar) {
      embaralhar(data, d.data, cena);
      texto.classList.remove("troca");
      void texto.offsetWidth;
      texto.classList.add("troca");
    } else data.textContent = d.data;
    texto.innerHTML = md(d.texto);
  };
  return {
    passos: s.datas.length - 1,
    aoEntrar: (passo) => {
      const comLider = passo === 0 && !movimentoReduzido() && !ctx.previa;
      const t0 = comLider ? LIDER_MS : 0;
      if (comLider) rodarLider();
      cena.depois(t0 + 250, () => som.ronco(6.5));
      if (passo === 0) cena.depois(t0 + 500, () => atual === 0 && embaralhar(data, s.datas[0].data, cena, 1300));
    },
    aoPasso: (n, { entrando }) => {
      atual = n;
      if (n > 0) terminarLider();
      mostrar(n, !entrando);
      st.classList.toggle("mar", n >= 2);
    },
    aoSair: terminarLider,
  };
}

/* 4 · Cinco generais na linha do tempo. */
function generais(s, st, ctx, cena) {
  const ini = 1964;
  const fim = 1985;
  const pos = (a) => `${((a - ini) / (fim - ini)) * 100}%`;
  const eixo = el("div", { class: "gn-eixo" }, el("i", { class: "gn-linha an-varre", style: atraso("0.6s") }));
  [1964, 1970, 1975, 1980, 1985].forEach((a) => eixo.append(el("span", { class: "gn-ano an-surge", style: { left: pos(a), "--atraso": "1s" }, text: String(a) })));
  s.lista.forEach((g, i) => {
    const anos = Math.floor(g.de) === Math.floor(g.ate) ? String(Math.floor(g.de)) : `${Math.floor(g.de)}–${Math.floor(g.ate)}`;
    eixo.append(
      el(
        "div",
        { class: `gn-bloco ${i % 2 ? "par" : "impar"}${g.ate - g.de < 1 ? " estreito" : ""}`, "data-passo": i + 1, style: { left: pos(g.de), width: `calc(${pos(g.ate)} - ${pos(g.de)})` } },
        el("span", { class: "gn-nome", text: g.nome }),
        el("span", { class: "gn-anos", text: anos }),
      ),
    );
  });
  add(st,
    kicker(s.kicker),
    el("h2", { class: "gn-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    eixo,
    el("p", { class: "gn-rodape", "data-passo": s.lista.length, html: md(s.rodape) }),
  );
  return {
    passos: s.lista.length,
    aoPasso: (n, { entrando }) => {
      if (!entrando && n > 0) cena.depois(380, () => som.baque(0.55));
    },
  };
}

/* 5 · Atos Institucionais: documentos caem na mesa. */
function atos(s, st, ctx, cena) {
  const docs = s.documentos.map((d, i) =>
    el(
      "article",
      { class: `at-doc d${i}${d.destaque ? " destaque" : ""}${i === 0 ? " an-cai" : ""}`, "data-passo": i === 0 ? null : i },
      el("p", { class: "at-topo", text: "Presidência da República" }),
      el("p", { class: "at-sigla", text: d.sigla }),
      el("p", { class: "at-data", text: d.data }),
      el("p", { class: "at-texto", html: md(d.texto) }),
      el("span", { class: "at-carimbo", text: "Decretado" }),
    ),
  );
  add(st, kicker(s.kicker), el("h2", { class: "at-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }), el("div", { class: "at-mesa" }, docs));
  const cair = (forca) =>
    cena.depois(560, () => {
      som.baque(forca);
      ctx.fx.tremor();
    });
  return {
    passos: docs.length - 1,
    aoEntrar: (passo) => {
      if (passo === 0) cair(1);
    },
    aoPasso: (n, { entrando }) => {
      if (!entrando && n > 0) cair(s.documentos[n].destaque ? 1.6 : 1);
    },
  };
}

/* 6 · 1968: o grito, depois a multidão. */
function estudante(s, st, ctx, cena) {
  const l1 = el("p", { class: "es-l1" });
  const l2 = el("p", { class: "es-l2" });
  const gritar = () => {
    fixarTexto(l1, s.linhas[0]);
    fixarTexto(l2, s.linhas[1]);
    st.classList.add("gritou");
  };
  const canvas = el("canvas", { class: "es-multidao" });
  const contador = el("span", { class: "es-contador", text: "0" });
  const p = s.passeata;
  add(st,
    canvas,
    kicker(s.kicker),
    el("div", { class: "es-grito" }, l1, l2, el("p", { class: "es-origem", text: s.origem })),
    el("p", { class: "es-texto", html: md(s.texto) }),
    el("p", { class: "es-cartaz" }, `“${s.cartaz}”`, s.cartazOrigem && el("small", { text: s.cartazOrigem })),
    el(
      "div",
      { class: "es-passeata", "data-passo": 1 },
      el("p", { class: "es-data", text: p.data }),
      el("h3", { class: "es-nome", html: md(p.titulo) }),
      el("p", { class: "es-numero" }, contador, el("small", { text: " pessoas" })),
      el("p", { class: "es-ptexto", html: md(p.texto) }),
    ),
    el("div", { class: "es-faixa", "data-passo": 1 }, el("span", { text: p.faixa })),
  );
  const multidao = new Multidao(canvas, { semente: 68, max: 2400 });
  return {
    passos: 1,
    aoEntrar: (passo) => {
      multidao.rodar(cena);
      if (passo > 0) return gritar();
      fixarTexto(l1, "");
      fixarTexto(l2, "");
      st.classList.remove("gritou");
      (async () => {
        await cena.espera(800);
        if (!(await digitar(l1, s.linhas[0], cena, { ms: 75 }))) return;
        await cena.espera(600);
        if (!(await digitar(l2, s.linhas[1], cena, { ms: 65 }))) return;
        st.classList.add("gritou");
      })().catch(() => {});
    },
    aoPasso: (n, { entrando }) => {
      multidao.ate(n >= 1 ? 1 : 0, entrando);
      if (n < 1) return;
      // Avançou no meio da digitação: o grito aparece inteiro.
      if (!st.classList.contains("gritou")) gritar();
      if (entrando) contador.textContent = "100.000";
      else
        contar(contador, 0, 50000, 2200, cena, {
          aoTerminar: () => cena.depois(700, () => contar(contador, 50000, 100000, 3000, cena)),
        });
    },
  };
}

/* 7 · AI-5: a máquina de escrever, o jornal e as portas do Congresso. */
function ai5(s, st, ctx, cena, section) {
  const itens = s.poderes.map((_, i) => el("li", {}, el("span", { class: "a5-num", text: String(i + 1).padStart(2, "0") }), el("span", { class: "a5-txt" })));
  const j = s.jornal;
  const corpo = j.texto.replace(/^Previsão do tempo:\s*/i, "");
  add(st,
    kicker(s.kicker),
    el("div", { class: "a5-sigla an-desfoca", style: atraso("0.3s"), text: s.sigla }),
    el("ol", { class: "a5-poderes" }, itens),
    el(
      "figure",
      { class: "a5-jornal", "data-passo": 1 },
      el("p", { class: "a5-cab", text: j.cabecalho }),
      el("div", { class: "a5-box" }, el("p", { class: "a5-rot", text: "Previsão do tempo" }), el("p", { class: "a5-prev", text: corpo })),
      el("figcaption", { html: md(j.legenda) }),
    ),
  );
  // As portas cobrem a tela inteira, por isso ficam fora do palco.
  add(section, 
    el("div", { class: "a5-portas", "data-passo": 2 }, el("div", { class: "a5-porta e" }), el("div", { class: "a5-porta d" }), el("p", { class: "a5-fechado", html: md(s.fechado) })),
  );
  const preencher = () =>
    itens.forEach((li, i) => {
      fixarTexto(li.querySelector(".a5-txt"), s.poderes[i]);
      li.classList.add("ok");
    });
  return {
    passos: 2,
    aoEntrar: (passo) => {
      itens.forEach((li) => {
        li.classList.remove("ok");
        fixarTexto(li.querySelector(".a5-txt"), "");
      });
      if (passo > 0 || movimentoReduzido()) return preencher();
      (async () => {
        await cena.espera(1700);
        for (let i = 0; i < itens.length; i++) {
          itens[i].classList.add("ok");
          if (!(await digitar(itens[i].querySelector(".a5-txt"), s.poderes[i], cena, { ms: 24 }))) return;
          await cena.espera(280);
        }
      })().catch(() => {});
    },
    aoPasso: (n, { entrando }) => {
      if (entrando) return;
      if (n === 1) {
        preencher();
        som.baque(0.35);
      }
      if (n === 2)
        cena.depois(1000, () => {
          som.baque(1.8);
          ctx.fx.tremor();
        });
    },
  };
}

/* 8 · Censura: as tarjas cobrem a página; no lugar, versos de Camões. */
function censura(s, st, ctx, cena) {
  const versos = s.versos.split(" / ");
  const bloco = (linhas, extra = {}) =>
    el(
      "div",
      { class: `cs-bloco ${extra.classe || ""}` },
      Array.from({ length: linhas }, (_, i) => el("span", { class: "cs-linha", style: { width: `${i === linhas - 1 ? 55 + (linhas * 7) % 30 : 100}%` } })),
      extra.tarja && el("div", { class: "cs-tarja" }),
      extra.verso && el("p", { class: "cs-verso", html: extra.verso }),
      extra.receita && el("p", { class: "cs-receita" }, el("b", { text: "Receita de bolo" }), el("span", { text: "(no Jornal da Tarde)" })),
    );
  const pagina = el(
    "figure",
    { class: "cs-pagina an-desfoca", style: atraso("0.5s") },
    el("p", { class: "cs-cab", text: "Página de jornal · ilustração" }),
    el(
      "div",
      { class: "cs-colunas" },
      el("div", {}, bloco(5), bloco(4, { classe: "c1", tarja: true, verso: `${versos[0]}<br>${versos[1]}` }), bloco(7), bloco(3, { tarja: true }), bloco(6), bloco(5), bloco(4)),
      el("div", {}, bloco(4, { classe: "c2", tarja: true, verso: `${versos[2]}<br>${versos[3]}` }), bloco(5, { classe: "c3", tarja: true, receita: true }), bloco(6), bloco(6), bloco(7), bloco(4)),
    ),
  );
  add(st,
    kicker(s.kicker),
    el("h2", { class: "cs-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    listaEmPassos(s.pontos, "cs-pontos"),
    el("p", { class: "cs-artistas", "data-passo": s.pontos.length, html: md(s.artistas) }),
    pagina,
  );
  const tarjas = [...pagina.querySelectorAll(".cs-tarja")];
  return {
    passos: s.pontos.length,
    aoEntrar: (passo) => {
      tarjas.forEach((t) => t.classList.remove("on"));
      if (passo > 0 || movimentoReduzido()) return tarjas.forEach((t) => t.classList.add("on"));
      tarjas.forEach((t, i) =>
        cena.depois(1900 + i * 650, () => {
          t.classList.add("on");
          som.baque(0.5);
        }),
      );
    },
    aoPasso: (n) => {
      pagina.classList.toggle("camoes", n >= 1);
      pagina.classList.toggle("receita", n >= 2);
    },
  };
}

/* 9 · O milagre e o chumbo: arraste a linha para ver o outro lado. */
function milagre(s, st, ctx, cena, section) {
  const p = s.propaganda;
  const r = s.realidade;
  const tv = criarTV(p.slogans, md(p.legendaTV || ""));
  const rnd = mulberry32(70);
  const confete = el(
    "div",
    { class: "mi-confete", "aria-hidden": "true" },
    Array.from({ length: 46 }, (_, i) =>
      el("span", {
        style: {
          left: `${rnd() * 100}%`,
          animationDelay: `${-rnd() * 7}s`,
          animationDuration: `${5 + rnd() * 5}s`,
          background: ["#f6d23a", "#2fa45c", "#ffffff", "#2b6fd1"][i % 4],
        },
      }),
    ),
  );
  const prop = el(
    "div",
    { class: "mi-camada mi-prop" },
    confete,
    el(
      "div",
      { class: "mi-dentro" },
      el("h2", { class: "mi-titulo", html: md(p.titulo) }),
      el("p", { class: "mi-texto", html: md(p.texto) }),
      tv.el,
    ),
  );
  const real = el(
    "div",
    { class: "mi-camada mi-real" },
    el("div", { class: "mi-dentro" }, el("h2", { class: "mi-titulo", html: md(r.titulo) }), el("p", { class: "mi-texto", html: md(r.texto) })),
  );
  const alca = el("div", { class: "mi-alca", "data-nao-navegar": true, role: "slider", "aria-label": "Arraste para comparar" }, el("span", { class: "mi-dica", text: s.dica }));
  add(section, prop, real, alca);
  add(st, kicker(s.kicker));

  let corte = 100;
  const aplicar = (v) => {
    corte = clamp(v, 0, 100);
    section.style.setProperty("--corte", `${corte}%`);
  };
  aplicar(100);
  const animarPara = (alvo, imediato) => {
    if (imediato || movimentoReduzido()) return aplicar(alvo);
    const de = corte;
    const t0 = performance.now();
    cena.quadro((t) => {
      const k = clamp((t - t0) / 1600, 0, 1);
      aplicar(lerp(de, alvo, 1 - Math.pow(1 - k, 3)));
      return k < 1;
    });
  };
  // Arrastar com o mouse ou o dedo.
  let arrastando = false;
  alca.addEventListener("pointerdown", (e) => {
    arrastando = true;
    alca.setPointerCapture(e.pointerId);
  });
  alca.addEventListener("pointermove", (e) => {
    if (!arrastando) return;
    const box = section.getBoundingClientRect();
    aplicar(((e.clientX - box.left) / box.width) * 100);
  });
  alca.addEventListener("pointerup", () => (arrastando = false));

  return {
    passos: 2,
    aoEntrar: (passo) => tv.ligar(cena, { imediato: passo > 0 }),
    aoPasso: (n, { entrando }) => animarPara([100, 52, 0][n], entrando),
    aoSair: () => tv.desligar(),
  };
}

/* A luta armada: o sequestro do embaixador. Os presos aparecem na pista, embarcam,
   o avião decola para o México; depois, a resposta do regime cai em carimbos. */
const SVG_PESSOA = `<svg viewBox="0 0 20 48" aria-hidden="true"><circle cx="10" cy="6.5" r="5.2"/><path d="M2.5 48 L4 21 C4.6 15 7 13.2 10 13.2 C13 13.2 15.4 15 16 21 L17.5 48 Z"/></svg>`;

const SVG_AVIAO = `<svg viewBox="0 0 240 66" aria-hidden="true">
  <path class="av-leme" d="M16 34 L28 2 L44 2 L52 30 Z"/>
  <path class="av-corpo" d="M12 36 C20 30 40 28 60 28 L200 28 C218 28 232 34 236 42 C232 50 218 54 200 54 L70 54 C48 54 28 48 12 36 Z"/>
  <rect class="av-asa" x="96" y="22" width="70" height="6" rx="3"/>
  <ellipse class="av-motor" cx="118" cy="31" rx="9" ry="3.2"/>
  <ellipse class="av-motor" cx="148" cy="31" rx="9" ry="3.2"/>
  <path class="av-janelas" d="M80 38 H192"/>
  <g class="av-rodas"><circle cx="92" cy="59" r="4.5"/><circle cx="152" cy="59" r="4.5"/><circle cx="214" cy="57" r="3.5"/></g>
</svg>`;

function sequestro(s, st, ctx, cena) {
  const data = el("div", { class: "sq-data", text: s.data });
  const contador = el("span", { class: "sq-num", text: "0" });
  const presos = Array.from({ length: s.presos }, (_, i) => el("i", { class: "sq-preso", style: { "--i": i }, html: SVG_PESSOA }));
  add(st,
    kicker(s.kicker),
    el("h2", { class: "sq-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    el("p", { class: "sq-intro an-surge", style: atraso("0.8s"), html: md(s.intro) }),
    listaEmPassos(s.passos, "sq-passos"),
    el("div", { class: "sq-painel an-desfoca", style: atraso("0.5s") }, data),
    el(
      "div",
      { class: "sq-cena", "aria-hidden": "true" },
      el("i", { class: "sq-pista" }),
      el("p", { class: "sq-contador" }, contador, el("small", { text: "presos políticos" })),
      el("div", { class: "sq-fila" }, presos),
      el("div", { class: "sq-aviao", html: SVG_AVIAO }),
      el("p", { class: "sq-destino", text: `→ ${s.destino}` }),
    ),
    el("div", { class: "sq-atos", "data-passo": 3 }, s.atos.map((a, i) => el("p", { class: `sq-ato a${i}` }, el("b", { text: a.sigla }), el("span", { text: a.texto })))),
  );
  const mostrarPresos = (quantos) => {
    presos.forEach((p, i) => p.classList.toggle("on", i < quantos));
    contador.textContent = String(quantos);
  };
  return {
    passos: s.passos.length - 1,
    aoEntrar: (passo) => {
      if (passo === 0) cena.depois(600, () => embaralhar(data, s.data, cena, 1300));
    },
    aoPasso: (n, { entrando }) => {
      st.classList.toggle("com-presos", n >= 1);
      st.classList.toggle("embarcou", n >= 2);
      st.classList.toggle("respondeu", n >= 3);
      document.body.classList.toggle("vinheta-fechada", n >= 3);
      if (n === 0) return mostrarPresos(0);
      if (entrando || n > 1 || movimentoReduzido()) mostrarPresos(presos.length);
      else
        presos.forEach((_, i) =>
          cena.depois(500 + i * 170, () => {
            mostrarPresos(i + 1);
            som.clique();
          }),
        );
      if (entrando) return;
      if (n === 2) cena.depois(1800, () => som.ronco(4.5));
      if (n === 3)
        [550, 1250].forEach((ms) =>
          cena.depois(ms, () => {
            som.baque(0.9);
            ctx.fx.tremor();
          }),
        );
    },
    aoSair: () => document.body.classList.remove("vinheta-fechada"),
  };
}

/* A máquina da repressão: o organograma e, no passo seguinte, os números. */
function repressao(s, st, ctx, cena) {
  const orgaos = el(
    "div",
    { class: "rp-orgaos" },
    s.orgaos.map((o, i) =>
      el(
        "div",
        { class: "rp-orgao an-surge", style: atraso(`${0.8 + i * 0.7}s`) },
        el("p", { class: "rp-ano", text: o.ano }),
        el("p", { class: "rp-nome", text: o.nome }),
        el("p", { class: "rp-txt", html: md(o.texto) }),
      ),
    ),
    el("div", {
      class: "rp-fios",
      html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M16 50 L84 50"/></svg>`,
    }),
  );
  add(st,
    kicker(s.kicker),
    el("h2", { class: "rp-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    orgaos,
    el("div", { class: "rp-dados", "data-passo": 1 }, s.dados.map((d) => el("p", { html: md(d) }))),
  );
  return { passos: 1 };
}

/* O caminho do preso: quatro cenas de cinema, sem mostrar violência, da prisão até a
   porta da sala de interrogatório (o desenho está em caminho.js). A cada seta, a cena
   anda: o carro chega e batem à porta; o capuz e o carro partindo; o portão do
   DOI-CODI; a cela, com os dias passando pela janela; o corredor e a porta que se fecha. */
const QUADRO_DO_PASSO = [0, 0, 1, 2, 3, 3];

function caminho(s, st, ctx, cena) {
  const etapas = s.etapas;
  const total = etapas.length;
  const legendas = etapas.map((e) => el("p", { html: md(e.texto) }));
  const rota = el("ol", { class: "cm-rota an-surge", style: atraso("1s") }, etapas.map((e) => el("li", { text: e.rotulo })));
  const quadros = cenasCaminho().map((html, i) => el("div", { class: `cm-t cm-t${i + 1}`, html }));
  const riscos = [...quadros[2].querySelectorAll(".cm3-m")];
  const contador = quadros[2].querySelector(".cm3-contador");
  const dias = (n) => {
    riscos.forEach((m, i) => m.classList.toggle("on", i < n));
    contador.textContent = `DIA ${n}`;
  };
  add(st,
    el("div", { class: "cm-cena", "aria-hidden": "true" }, quadros),
    kicker(s.kicker),
    el("h2", { class: "cm-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    rota,
    el("div", { class: "cm-legenda" }, legendas),
    el(
      "div",
      { class: "cm-caso", "data-passo": total },
      el("p", { class: "cm-caso-nome", text: s.caso.nome }),
      el("p", { class: "cm-caso-datas", text: s.caso.datas }),
      el("p", { class: "cm-caso-texto", html: md(s.caso.texto) }),
    ),
  );
  let vez = 0;
  return {
    passos: total,
    aoPasso: (n, { entrando }) => {
      const minha = ++vez;
      const depois = (ms, fn) => cena.depois(ms, () => minha === vez && fn());
      const e = Math.min(n, total - 1);
      st.style.setProperty("--cam", e);
      for (let i = 0; i <= total; i++) {
        st.classList.toggle(`p${i}`, n >= i);
        st.classList.toggle(`agora-${i}`, n === i);
      }
      quadros.forEach((q, i) => q.classList.toggle("on", i === QUADRO_DO_PASSO[n]));
      legendas.forEach((l, i) => l.classList.toggle("on", i === e));
      [...rota.children].forEach((li, i) => {
        li.classList.toggle("feito", i < e);
        li.classList.toggle("agora", i === e);
      });
      document.body.classList.toggle("vinheta-fechada", n >= total);
      // A cela: um risco na parede a cada noite, dez dias sem ver ninguém.
      if (n < 3) dias(0);
      else if (n > 3 || entrando || movimentoReduzido()) dias(10);
      else {
        dias(0);
        for (let i = 1; i <= 10; i++)
          depois(1400 + (i - 1) * 720 + 650, () => {
            dias(i);
            som.clique();
          });
      }
      if (entrando || movimentoReduzido()) return;
      if (n === 0) {
        depois(100, () => som.ronco(3.2));
        [5500, 5780, 6060].forEach((ms) => depois(ms, () => som.baque(0.22)));
      }
      if (n === 1) {
        depois(2950, () => som.baque(0.45));
        depois(3300, () => som.ronco(3.5));
      }
      if (n === 2) {
        depois(0, () => som.ronco(3));
        depois(7000, () => {
          som.baque(1);
          ctx.fx.tremor();
        });
      }
      if (n === 4) {
        for (let k = 0; k < 9; k++) depois(800 + k * 420, () => som.clique());
        depois(6600, () => {
          som.baque(1.1);
          ctx.fx.tremor();
        });
      }
      if (n === total) [700, 2400].forEach((ms) => depois(ms, () => som.coracao()));
    },
    aoSair: () => document.body.classList.remove("vinheta-fechada"),
  };
}

/* A tortura: uma lâmpada balança sobre uma cadeira vazia. Os números, os métodos
   (um a um, com o coração batendo), um caso e a conclusão da Comissão da Verdade. */
const SVG_LAMPADA = `<svg viewBox="0 0 60 40" aria-hidden="true">
  <path class="lp-cupula" d="M23 2 H37 L57 30 H3 Z"/>
  <ellipse class="lp-bulbo" cx="30" cy="31" rx="7.5" ry="5"/>
</svg>`;

const SVG_CADEIRA = `<svg viewBox="0 0 60 92" aria-hidden="true">
  <rect x="11" y="2" width="5" height="88" rx="1.5"/>
  <rect x="44" y="2" width="5" height="88" rx="1.5"/>
  <rect x="11" y="6" width="38" height="5"/>
  <rect x="11" y="20" width="38" height="3.5"/>
  <path d="M8 46 H52 L56 54 H4 Z"/>
  <rect x="6" y="54" width="5" height="36" rx="1"/>
  <rect x="49" y="54" width="5" height="36" rx="1"/>
</svg>`;

function tortura(s, st, ctx, cena) {
  const valores = s.numeros.map(() => el("span", { class: "tt-valor", text: "0" }));
  const metodos = s.metodos.map((m) => el("li", { html: md(m) }));
  add(st,
    el(
      "div",
      { class: "tt-sala", "aria-hidden": "true" },
      el("div", { class: "tt-pendulo" }, el("i", { class: "tt-fio" }), el("div", { class: "tt-lampada", html: SVG_LAMPADA }), el("i", { class: "tt-luz" })),
      el("i", { class: "tt-chao" }),
      el("i", { class: "tt-sombra" }),
      el("div", { class: "tt-cadeira", html: SVG_CADEIRA }),
    ),
    kicker(s.kicker),
    el("h2", { class: "tt-titulo an-desfoca", style: atraso("0.4s"), html: md(s.titulo) }),
    el(
      "div",
      { class: "tt-numeros" },
      s.numeros.map((n, i) => el("p", { class: "tt-numero an-surge", style: atraso(`${1.2 + i * 0.5}s`) }, valores[i], el("span", { class: "tt-txt", html: md(n.texto) }))),
    ),
    el("ul", { class: "tt-metodos", "data-passo": 1 }, metodos),
    el("p", { class: "tt-caso", "data-passo": 2, html: md(s.caso) }),
    el("p", { class: "tt-conclusao", "data-passo": 3, html: md(s.conclusao) }),
  );
  const fixarNumeros = () => valores.forEach((v, i) => (v.textContent = s.numeros[i].valor.toLocaleString("pt-BR")));
  return {
    passos: 3,
    aoEntrar: (passo) => {
      if (passo > 0 || movimentoReduzido()) return fixarNumeros();
      valores.forEach((v) => (v.textContent = "0"));
      s.numeros.forEach((n, i) => cena.depois(1500 + i * 500, () => contar(valores[i], 0, n.valor, 2400, cena)));
    },
    aoPasso: (n, { entrando }) => {
      document.body.classList.toggle("vinheta-fechada", n >= 1);
      if (n === 0) return metodos.forEach((m) => m.classList.remove("on"));
      if (entrando || n > 1) return metodos.forEach((m) => m.classList.add("on"));
      metodos.forEach((m, i) =>
        cena.depois(600 + i * 1500, () => {
          m.classList.add("on");
          som.coracao();
          ctx.fx.pulso();
        }),
      );
    },
    aoSair: () => document.body.classList.remove("vinheta-fechada"),
  };
}

/* Retrato: a foto se revela como no laboratório e o carimbo cai.
   Opcionais: apagar (no fim a foto some, como um desaparecido), placa (uma placa
   de rua num passo) e poema (versos no último passo). */
function retrato(s, st, ctx, cena) {
  const ultimo = s.passos.length - 1;
  const carimboPasso = s.carimboPasso ?? 1;
  add(st,
    kicker(s.kicker),
    el(
      "figure",
      { class: `rt-moldura an-desfoca${s.foto ? " com-foto" : ""}`, style: atraso("0.3s") },
      el("div", { class: "rt-silhueta", html: s.foto ? null : SVG_SILHUETA }, s.foto && imagem(s.foto)),
      el("span", { class: "rt-carimbo", "data-passo": carimboPasso, text: s.carimbo }),
      credito(s.foto),
    ),
    s.placa && el("div", { class: "rt-placa", "data-passo": s.placa.passo }, el("span", { class: "rt-placa-rua", text: s.placa.rua }), el("span", { class: "rt-placa-data", text: s.placa.data })),
    el("h2", { class: "rt-nome an-espaca", style: atraso("0.9s"), text: s.nome }),
    el("p", { class: "rt-sub an-surge", style: atraso("1.4s"), html: md(s.subtitulo) }),
    listaEmPassos(s.passos, "rt-passos"),
    s.extra && el("p", { class: "rt-extra", "data-passo": ultimo, html: md(s.extra) }),
    s.poema && el("blockquote", { class: "rt-poema", "data-passo": ultimo }, s.poema.versos.map((v) => el("span", { text: v })), el("cite", { text: s.poema.fonte })),
  );
  return {
    passos: ultimo,
    aoPasso: (n, { entrando }) => {
      if (s.apagar !== false) st.classList.toggle("apagando", n >= ultimo);
      if (entrando) return;
      if (n === carimboPasso)
        cena.depois(450, () => {
          som.baque(1.3);
          ctx.fx.tremor();
        });
      if (s.placa && n === s.placa.passo) cena.depois(550, () => som.baque(0.5));
    },
  };
}

/* A farsa do suicídio: o retrato, o laudo riscado e, num passo só dela, a foto
   do próprio laudo oficial, com a prova marcada em vermelho. */
function farsa(s, st, ctx, cena) {
  const verdade = el("p", { class: "fs-verdade" });
  const doc = s.documento;
  const marca = doc?.marca;
  const pDoc = doc ? 2 : -1;
  const pDepois = doc ? 3 : 2;
  add(st,
    kicker(s.kicker),
    s.foto && el("figure", { class: "foto fs-foto", style: atraso("0.3s") }, imagem(s.foto), credito(s.foto)),
    el("h2", { class: "fs-nome an-espaca", style: atraso("0.3s"), text: s.nome }),
    el("p", { class: "fs-sub an-surge", style: atraso("0.9s"), html: md(s.subtitulo) }),
    el("p", { class: "fs-texto an-surge", style: atraso("1.4s"), html: md(s.texto) }),
    el(
      "div",
      { class: "fs-laudo an-desfoca", style: atraso("1.8s") },
      el("p", { class: "fs-rot", text: "Causa da morte, segundo o Exército" }),
      el(
        "p",
        { class: "fs-oficial" },
        el("span", { text: s.oficial }),
        el("span", { class: "fs-risco", "data-passo": 1, html: `<svg viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M0 6 L100 3"/></svg>` }),
      ),
      el("div", { "data-passo": 1 }, verdade, el("p", { class: "fs-prova", html: md(s.prova) })),
    ),
    doc &&
      el(
        "figure",
        { class: "fs-documento" },
        el(
          "div",
          { class: "fs-doc-papel" },
          imagem(doc),
          marca && el("div", { class: "fs-marca", style: { left: `${marca.x}%`, top: `${marca.y}%`, width: `${marca.r * 2}%` }, html: `<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="46" pathLength="1"/></svg>` }),
          marca && el("span", { class: "fs-marca-txt", style: { left: `${marca.tx}%`, top: `${marca.ty}%` }, text: marca.texto }),
        ),
        credito(doc),
      ),
    el("ul", { class: "fs-depois", "data-passo": pDepois }, s.depois.map((d) => el("li", { html: md(d) }))),
    el("p", { class: "fs-fiel", "data-passo": pDepois + 1, html: md(s.fiel) }),
  );
  return {
    passos: pDepois + 1,
    aoPasso: (n, { entrando }) => {
      // A foto do laudo fica na tela só no passo dela.
      st.classList.toggle("com-documento", n === pDoc);
      if (n === pDoc && !entrando) cena.depois(150, () => som.baque(0.35));
      if (n < 1) return fixarTexto(verdade, "");
      if (entrando || n > 1) return fixarTexto(verdade, s.verdade);
      cena.depois(250, () => som.rasgo());
      fixarTexto(verdade, "");
      cena.depois(1300, () => digitar(verdade, s.verdade, cena, { ms: 45 }).catch(() => {}));
    },
  };
}

/* 13 · Zuzu Angel: uma linha de costura desenha a moldura. */
function zuzu(s, st, ctx, cena) {
  const total = s.passos.length;
  const costura = el("div", {
    class: "zz-costura",
    html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
      <defs><mask id="zz-mascara"><rect x="0" y="0" width="100" height="100" fill="black"/><rect class="zz-trilha" pathLength="1" x="1" y="1" width="98" height="98" fill="none" stroke="white" stroke-width="3"/></mask></defs>
      <rect class="zz-ponto" x="1" y="1" width="98" height="98" fill="none" mask="url(#zz-mascara)"/>
    </svg>`,
  });
  add(st,
    kicker(s.kicker),
    costura,
    el("h2", { class: "zz-nome an-espaca", style: atraso("0.3s"), text: s.nome }),
    el("p", { class: "zz-sub an-surge", style: atraso("0.9s"), html: md(s.subtitulo) }),
    s.foto && el("figure", { class: "foto zz-foto", style: atraso("1.1s") }, imagem(s.foto), credito(s.foto)),
    listaEmPassos(s.passos, "zz-passos"),
    el("div", { class: "zz-farois", "data-passo": total, "aria-hidden": "true" }, el("span"), el("span")),
    el("p", { class: "zz-tunel", "data-passo": total, html: md(s.tunel) }),
  );
  const trilha = costura.querySelector(".zz-trilha");
  return {
    passos: total,
    aoPasso: (n) => {
      trilha.style.strokeDashoffset = String(1 - Math.min(1, (n + 1) / total));
    },
  };
}

/* Araguaia: a mata à noite, à beira do rio. Cada luz é um guerrilheiro que não voltou.
   Os helicópteros passam com o holofote e as luzes se apagam; chove; sobe a fumaça da
   Operação Limpeza na serra; no fim, só anéis vazios e duas luzes brancas, os únicos
   identificados. Medidas em u (o palco tem 100u × 56,25u). */
const AR = {
  rio: 48.5, // altura da linha d'água
  // As duas passagens dos helicópteros (ms) e o x (u) em que entram e saem.
  passagens: [
    { t0: 600, dur: 8000, de: -14, ate: 114 },
    { t0: 4200, dur: 8000, de: 114, ate: -14 },
  ],
};

const SVG_HELICOPTERO = `<svg viewBox="0 0 120 46" aria-hidden="true">
  <rect class="hl-rotor" x="6" y="2" width="96" height="2.4" rx="1.2"/>
  <rect x="52" y="3" width="4" height="8"/>
  <path d="M30 14 C30 9 40 9 58 9 C74 9 84 13 88 22 C90 28 86 32 76 32 L42 32 C34 32 30 26 30 20 Z"/>
  <path d="M32 18 L2 15 L2 20 L32 25 Z"/>
  <rect x="0" y="8" width="4" height="14" rx="1.5"/>
  <path class="hl-vidro" d="M64 12 C74 12 82 16 85 23 L64 23 Z"/>
  <path class="hl-esqui" d="M38 32 L40 38 M70 32 L68 38 M30 39 L84 39"/>
  <circle class="hl-luz" cx="40" cy="31" r="1.8"/>
</svg>`;

const SVG_SERRA = `<svg viewBox="0 0 200 40" preserveAspectRatio="none" aria-hidden="true">
  <path d="M0 40 L0 30 C20 27 35 29 50 26 C65 23 78 27 92 24 C104 21 112 18 124 13 C132 10 140 9 148 11 C158 14 166 20 178 22 C188 24 196 26 200 27 L200 40 Z"/>
</svg>`;

/** Silhueta de mata: copas redondas, castanheiras acima da mata e babaçus. */
function copas(semente, { altura, base, varia, raio, emergentes, palmeiras }) {
  const r = mulberry32(semente);
  const n = (v) => v.toFixed(1);
  let s = `<rect x="-5" y="${n(base + varia / 2)}" width="210" height="${altura}"/>`;
  for (let x = -4; x < 204; x += 1.4 + r() * 2.4) s += `<circle cx="${n(x)}" cy="${n(base + r() * varia)}" r="${n(raio + r() * raio)}"/>`;
  // Árvores emergentes da Amazônia (como a castanheira): tronco alto e copa larga e irregular.
  for (let k = 0; k < emergentes; k++) {
    const x = 6 + r() * 188;
    const topo = base - 5 - r() * 5;
    const larg = 3.5 + r() * 2.5;
    s += `<rect x="${n(x - 0.45)}" y="${n(topo)}" width="0.9" height="${n(base - topo + 4)}"/>`;
    s += `<g class="ar-palha"><path d="M${n(x)} ${n(topo + 3)} L${n(x - larg * 0.6)} ${n(topo + 0.6)} M${n(x)} ${n(topo + 2.2)} L${n(x + larg * 0.55)} ${n(topo + 0.4)}"/></g>`;
    for (let c = 0; c < 6; c++) s += `<circle cx="${n(x + (r() - 0.5) * 2 * larg)}" cy="${n(topo - 0.6 + (r() - 0.5) * 2)}" r="${n(1.3 + r() * 1.3)}"/>`;
  }
  // Babaçus: tronco levemente torto e folhas que sobem e caem nas pontas.
  for (let k = 0; k < palmeiras; k++) {
    const x = 4 + r() * 192;
    const topo = base - 3.5 - r() * 5;
    const torto = (r() - 0.5) * 1.6;
    const folhas = Array.from({ length: 9 }, (_, j) => {
      const a = -1 + j / 4 + (r() - 0.5) * 0.12;
      const len = 4.6 + r() * 1.8;
      return `<path d="M${n(x + torto)} ${n(topo)} Q ${n(x + torto + a * len * 0.45)} ${n(topo - 2.8 - (1 - Math.abs(a)) * 1.6)} ${n(x + torto + a * len)} ${n(topo + 0.2 + Math.abs(a) * 2.2)}"/>`;
    }).join("");
    s += `<g class="ar-palha"><path class="ar-estipe" d="M${n(x)} ${n(base + 3)} Q ${n(x + torto * 0.2)} ${n((base + topo) / 2)} ${n(x + torto)} ${n(topo)}"/>${folhas}</g>`;
  }
  return `<svg viewBox="0 0 200 ${altura}" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}

function araguaia(s, st, ctx, cena) {
  const r = mulberry32(1972);
  // 60 luzes na mata, sem encostar umas nas outras. As duas identificadas têm lugar fixo.
  const pts = s.identificados.map((p) => ({ ...p }));
  while (pts.length < s.luzes) {
    const p = { x: 3 + r() * 94, y: 40.2 + r() * 6.2 };
    if (pts.every((q) => Math.hypot(q.x - p.x, (q.y - p.y) * 2.2) > 2.6)) pts.push(p);
  }
  // Ordem em que acendem: aleatória, mas sempre a mesma.
  const ordem = pts.map((_, i) => i).sort(() => r() - 0.5);
  const u = (v) => `calc(var(--u) * ${v.toFixed(2)})`;
  const luzes = pts.map((p, i) =>
    el("i", { class: `ar-luz${p.nome ? " achado" : ""}`, style: { left: u(p.x), top: u(p.y), "--ordem": ordem.indexOf(i), "--pisca": `${(1.6 + r() * 2.4).toFixed(2)}s` } }),
  );
  const reflexos = pts.map((p) => el("i", { class: `ar-reflexo${p.nome ? " achado" : ""}`, style: { left: u(p.x), top: u(AR.rio + (AR.rio - p.y) * 0.55) } }));
  const nomes = pts.filter((p) => p.nome).map((p) => el("p", { class: "ar-nome", style: { left: u(p.x + 6), top: u(p.y) } }, el("b", { text: p.nome }), el("span", { text: p.ano })));
  const napalm = [18, 52, 86].map((x, k) => el("i", { class: `ar-napalm n${k}`, style: { left: u(x + 6) } }));
  const fases = s.fases.map((f) => el("p", {}, el("b", { class: "ar-rot", text: f.rotulo }), el("span", { html: md(f.texto) })));
  const heli = (classe, facho = true) => el("div", { class: `ar-heli ${classe}` }, el("div", { class: "ar-heli-corpo", html: SVG_HELICOPTERO }), facho && el("i", { class: "ar-facho" }));
  const cenario = el(
    "div",
    { class: "ar-cena", "aria-hidden": "true" },
    el("i", { class: "ar-ceu" }),
    el("i", { class: "ar-crepusculo" }),
    el("i", { class: "ar-alvorada" }),
    el("i", { class: "ar-estrelas" }),
    el("div", { class: "ar-serra", html: SVG_SERRA }),
    el("div", { class: "ar-fumaca" }, el("i", { class: "ar-brasa" }), Array.from({ length: 7 }, (_, k) => el("i", { class: "ar-sopro", style: { "--k": k } }))),
    el("p", { class: "ar-serra-nome", text: "Serra das Andorinhas" }),
    napalm,
    el("div", { class: "ar-mata-fundo", html: copas(1967, { altura: 40, base: 14, varia: 8, raio: 2, emergentes: 7, palmeiras: 6 }) }),
    el("div", { class: "ar-luzes" }, luzes),
    el("i", { class: "ar-nevoa" }),
    el("div", { class: "ar-mata-frente", html: copas(1974, { altura: 20, base: 13, varia: 3, raio: 1.2, emergentes: 0, palmeiras: 5 }) }),
    el("i", { class: "ar-rio" }),
    el("div", { class: "ar-reflexos" }, reflexos),
    el("div", { class: "ar-ondas" }, Array.from({ length: 9 }, (_, k) => el("i", { style: { left: u(4 + ((k * 37) % 92)), top: u(AR.rio + 1.2 + ((k * 13) % 6)), "--k": k } }))),
    el("i", { class: "ar-chuva" }),
    heli("a"),
    heli("b"),
    heli("c", false),
    nomes,
  );
  add(st,
    cenario,
    kicker(s.kicker),
    el("h2", { class: "ar-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    el("div", { class: "ar-fases" }, fases),
    el("p", { class: "ar-legenda an-surge", style: atraso("2.6s") }, el("span", { class: "l-luz", text: "cada luz: um guerrilheiro que não voltou" }), el("span", { class: "l-anel", text: "desaparecido" }), el("span", { class: "l-achado", text: "identificado" })),
  );

  let vez = 0;
  const estado = (i, classe) => [luzes[i], reflexos[i]].forEach((n) => n.classList.add(classe));
  const acenderTodas = () => [...luzes, ...reflexos].forEach((n) => n.classList.remove("off", "apagando"));
  const apagarTodas = () =>
    [...luzes, ...reflexos].forEach((n) => {
      n.classList.remove("apagando");
      n.classList.add("off");
    });
  return {
    passos: s.fases.length - 1,
    aoPasso: (n, { entrando }) => {
      const minha = ++vez;
      for (let i = 0; i < s.fases.length; i++) {
        st.classList.toggle(`f${i}`, n >= i);
        st.classList.toggle(`agora-${i}`, n === i);
      }
      fases.forEach((p, i) => p.classList.toggle("on", i === n));
      napalm.forEach((x) => x.classList.remove("on"));
      if (n === 0) return acenderTodas();
      if (n > 1 || entrando || movimentoReduzido()) {
        apagarTodas();
        if (entrando) return;
        if (n === 2) som.chuva(11);
        if (n === 3) cena.depois(300, () => som.helicoptero(7));
        return;
      }
      // Passo 1: a caçada. Cada luz se apaga quando um holofote passa por cima dela.
      acenderTodas();
      AR.passagens.forEach((p) => cena.depois(p.t0 - 200, () => minha === vez && som.helicoptero(p.dur / 1000 + 0.6)));
      pts.forEach((pt, i) => {
        const p = AR.passagens[i % 2];
        const quando = p.t0 + ((pt.x - p.de) / (p.ate - p.de)) * p.dur + 250 + r() * 500;
        cena.depois(quando, () => minha === vez && estado(i, "apagando"));
      });
      [2600, 6100, 9300].forEach((ms, k) =>
        cena.depois(ms, () => {
          if (minha !== vez) return;
          napalm[k].classList.add("on");
          som.baque(0.25);
        }),
      );
    },
  };
}

/* 15 · A abertura: o céu clareia aos poucos. O Riocentro explode. */
function amanhecer(s, st, ctx, cena, section) {
  section.prepend(el("div", { class: "am-ceu", "aria-hidden": "true" }), el("div", { class: "am-fumaca", "aria-hidden": "true" }));
  const lista = listaEmPassos(s.passos, "am-passos");
  add(st, kicker(s.kicker), el("h2", { class: "am-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }), lista, el("div", { class: "am-horizonte" }));
  const ultimo = s.passos.length - 1;
  return {
    passos: ultimo,
    aoPasso: (n, { entrando }) => {
      section.style.setProperty("--luz", String(Math.min(n, ultimo - 1) / (ultimo - 1)));
      [...lista.children].forEach((li, i) => li.classList.toggle("passado", i < n));
      section.classList.toggle("explodiu", n >= ultimo);
      if (n === ultimo && !entrando)
        // Sem som de explosão: só o clarão e a tela tremendo.
        cena.depois(400, () => {
          ctx.fx.flash();
          ctx.fx.tremor();
        });
    },
  };
}

/* 16 · Diretas Já: a multidão, a votação que não chega lá. */
function diretas(s, st, ctx, cena) {
  const canvas = el("canvas", { class: "dj-multidao" });
  const multidao = new Multidao(canvas, { semente: 1984, max: 3200, cor: "242,214,120", destaque: "235,228,214" });
  const data = el("p", { class: "dj-data" });
  const lugar = el("p", { class: "dj-lugar" });
  const contador = el("p", { class: "dj-contador", text: "0" });
  const rotulo = el("p", { class: "dj-rotulo" });
  const v = s.votacao;
  const barra = el("div", { class: "dj-barra" }, el("span", { class: "dj-sim", style: { "--sim": v.sim / v.total } }), el("span", { class: "dj-marca", style: { left: `${(v.precisava / v.total) * 100}%` } }, el("em", { text: `${v.precisava} necessários` })));
  add(st,
    canvas,
    kicker(s.kicker),
    el("h2", { class: "dj-titulo an-espaca", style: atraso("0.2s"), html: md(s.titulo) }),
    el("div", { class: "dj-comicio" }, data, lugar, contador, rotulo),
    el(
      "div",
      { class: "dj-votacao", "data-passo": 2 },
      el("p", { class: "dj-vdata", text: `${v.data} · ${v.titulo}` }),
      barra,
      el("p", { class: "dj-placar" }, el("b", { text: String(v.sim) }), " votos a favor"),
      el("p", { class: "dj-vtexto", html: md(v.texto) }),
      el("span", { class: "dj-carimbo", text: "Rejeitada" }),
    ),
    el("p", { class: "dj-depois", "data-passo": 3, html: md(s.depois) }),
  );
  const mostrarComicio = (i, animar) => {
    const c = s.comicios[i];
    data.textContent = c.data;
    lugar.textContent = c.lugar;
    rotulo.textContent = c.texto;
    const de = i === 0 ? 0 : s.comicios[0].valor;
    if (animar) contar(contador, de, c.valor, 3600, cena);
    else contador.textContent = c.valor.toLocaleString("pt-BR");
  };
  return {
    passos: 3,
    aoEntrar: (passo) => {
      multidao.rodar(cena);
      if (passo === 0 && !movimentoReduzido()) {
        multidao.ate(0, true);
        contador.textContent = "0";
        cena.depois(400, () => {
          multidao.ate(0.62);
          mostrarComicio(0, true);
        });
      }
    },
    aoPasso: (n, { entrando }) => {
      multidao.ate(n === 0 ? 0.62 : 1, entrando);
      multidao.apagar = n >= 2 ? 0.75 : 0;
      st.classList.toggle("votou", n >= 2);
      mostrarComicio(Math.min(n, 1), !entrando && n === 1);
      if (n === 2 && !entrando) cena.depois(2900, () => som.baque(1.4));
    },
  };
}

/* 17 · A frase de Ulysses, letra por letra. */
function citacao(s, st, ctx, cena) {
  const texto = el("blockquote", { class: "ct-texto" });
  const marcar = () => (texto.innerHTML = md(s.citacao).replace("Ódio e nojo.", '<span class="ct-forte">Ódio e nojo.</span>'));
  add(st,
    kicker(s.kicker),
    el("h2", { class: "ct-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    texto,
    el("p", { class: "ct-autor", text: `— ${s.autor}` }),
  );
  return {
    aoEntrar: () => {
      st.classList.remove("pronto");
      fixarTexto(texto, "");
      if (movimentoReduzido()) {
        marcar();
        return st.classList.add("pronto");
      }
      (async () => {
        await cena.espera(1200);
        if (!(await digitar(texto, s.citacao, cena, { ms: 48 }))) return;
        marcar();
        st.classList.add("pronto");
      })().catch(() => {});
    },
  };
}

/* 18 · Os números, um a um. */
function numeros(s, st, ctx, cena) {
  const valores = s.itens.map(() => el("span", { class: "nm-valor", text: "0" }));
  add(st,
    kicker(s.kicker),
    el("h2", { class: "nm-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    el(
      "div",
      { class: "nm-lista" },
      s.itens.map((it, i) => el("div", { class: `nm-item${i === 0 ? " an-surge" : ""}`, style: atraso("0.9s"), "data-passo": i === 0 ? null : i }, valores[i], el("p", { class: "nm-texto", html: md(it.texto) }))),
    ),
  );
  return {
    passos: s.itens.length - 1,
    aoEntrar: (passo) => {
      if (passo === 0) {
        valores[0].textContent = "0";
        cena.depois(1100, () => contar(valores[0], 0, s.itens[0].valor, 2600, cena));
      }
    },
    aoPasso: (n, { entrando }) => {
      s.itens.forEach((it, i) => {
        if (i > n) valores[i].textContent = "0";
        else if (entrando || i < n) valores[i].textContent = it.valor.toLocaleString("pt-BR");
        else if (i === n && n > 0) contar(valores[i], 0, it.valor, 2600, cena);
      });
    },
  };
}

/* 19 · Memorial: os nomes passam devagar, a vela não apaga. */
function memorial(s, st, ctx, cena) {
  const nomes = (ctx.vitimas || []).map((v) =>
    el("li", { class: v.desaparecido ? "desap" : "" }, el("span", { class: "mm-n", text: v.nome }), el("span", { class: "mm-a", text: v.desaparecido ? `${v.ano ?? ""} · † desaparecido` : String(v.ano ?? "") })),
  );
  const lista = () => el("ul", { class: "mm-lista" }, nomes.map((n) => n.cloneNode(true)));
  const rolo = el("div", { class: "mm-rolo", style: { "--duracao": `${Math.max(120, nomes.length * 0.55)}s` } }, lista(), lista());
  const final = el("p", { class: "mm-final" });
  add(st,
    el("div", { class: "mm-janela" }, rolo),
    el("h2", { class: "mm-titulo an-desfoca", style: atraso("0.4s"), html: md(s.titulo) }),
    el("p", { class: "mm-texto an-surge", style: atraso("1.2s"), html: md(s.texto) }),
    el("p", { class: "mm-total an-surge", style: atraso("1.8s"), text: `${nomes.length} nomes` }),
    el("div", { class: "mm-vela", "aria-hidden": "true" }, el("span", { class: "mm-halo" }), el("span", { class: "mm-chama" }), el("span", { class: "mm-cera" })),
    el("div", { "data-passo": 1 }, final),
    s.assinatura && el("p", { class: "mm-assinatura an-surge", style: atraso("2.6s") }, el("span", { text: s.assinatura.rotulo }), el("b", { text: s.assinatura.nome })),
  );
  return {
    passos: 1,
    aoPasso: (n, { entrando }) => {
      if (n < 1) return fixarTexto(final, "");
      if (entrando) return fixarTexto(final, s.final);
      digitar(final, s.final, cena, { ms: 70 }).catch(() => {});
    },
  };
}

const RENDER = {
  capa,
  sequestro,
  caminho,
  tortura,
  abertura,
  divisao,
  golpe,
  generais,
  atos,
  estudante,
  ai5,
  censura,
  milagre,
  repressao,
  retrato,
  farsa,
  zuzu,
  araguaia,
  amanhecer,
  diretas,
  citacao,
  numeros,
  memorial,
};
