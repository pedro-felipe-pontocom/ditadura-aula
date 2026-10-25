// Monta cada slide e a sua cena animada a partir de content/slides.json.
// Cada renderizador devolve { passos, aoPasso(n, {entrando}), aoEntrar(passo), aoSair() }.
// "entrando" = o slide acabou de aparecer (voltando pela seta, por exemplo):
// nesse caso tudo vai direto para o estado final, sem som nem animação.

import { el, md, escapeHtml, mulberry32, clamp, lerp, movimentoReduzido } from "./util.js";
import { Cena, digitar, fixarTexto, contar, embaralhar, Multidao } from "./fx.js";
import * as som from "./som.js";

const COM_CINZAS = new Set(["abertura", "numeros", "memorial"]);

export function rotuloSlide(s) {
  const t = s.titulo || s.nome || s.sigla || s.kicker || s.id;
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

/* 3 · O golpe: tanques, painel de datas, porta-aviões. */
function golpe(s, st, ctx, cena) {
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
      cena.depois(250, () => som.ronco(6.5));
      if (passo === 0) cena.depois(500, () => embaralhar(data, s.datas[0].data, cena, 1300));
    },
    aoPasso: (n, { entrando }) => {
      mostrar(n, !entrando);
      st.classList.toggle("mar", n >= 2);
    },
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
    el("div", { class: "es-grito" }, l1, l2),
    el("p", { class: "es-texto", html: md(s.texto) }),
    el("p", { class: "es-cartaz", text: `“${s.cartaz}”` }),
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
  // Palavras com hífen não quebram ("DEIXE-/O").
  const textoSlogan = (i) => `“${escapeHtml(p.slogans[i])}”`.replace(/(\S+-\S+)/g, '<span class="nw">$1</span>');
  const slogan = el("p", { class: "mi-slogan", html: textoSlogan(0) });
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
      slogan,
      el("p", { class: "mi-texto", html: md(p.texto) }),
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
    aoEntrar: () => {
      let i = 0;
      const trocar = () => {
        i = (i + 1) % p.slogans.length;
        slogan.classList.remove("troca");
        void slogan.offsetWidth;
        slogan.classList.add("troca");
        slogan.innerHTML = textoSlogan(i);
        cena.depois(2600, trocar);
      };
      cena.depois(2600, trocar);
    },
    aoPasso: (n, { entrando }) => animarPara([100, 52, 0][n], entrando),
  };
}

/* 10 · A máquina da repressão: organograma, depois os métodos, com o coração batendo. */
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
  const metodos = s.metodos.map((m) => el("li", { html: md(m) }));
  add(st, 
    kicker(s.kicker),
    el("h2", { class: "rp-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    orgaos,
    el("ul", { class: "rp-metodos", "data-passo": 1 }, metodos),
    el("div", { class: "rp-dados", "data-passo": 2 }, s.dados.map((d) => el("p", { html: md(d) }))),
  );
  return {
    passos: 2,
    aoPasso: (n, { entrando }) => {
      document.body.classList.toggle("vinheta-fechada", n >= 1);
      if (n === 0) return metodos.forEach((m) => m.classList.remove("on"));
      if (entrando || n > 1) return metodos.forEach((m) => m.classList.add("on"));
      metodos.forEach((m, i) =>
        cena.depois(700 + i * 1700, () => {
          m.classList.add("on");
          som.coracao();
          ctx.fx.pulso();
        }),
      );
    },
    aoSair: () => document.body.classList.remove("vinheta-fechada"),
  };
}

/* 11 · Retrato de um desaparecido. */
function retrato(s, st, ctx, cena) {
  add(st, 
    kicker(s.kicker),
    el(
      "figure",
      { class: "rt-moldura an-desfoca", style: atraso("0.3s") },
      el("div", { class: "rt-silhueta", html: SVG_SILHUETA }),
      el("span", { class: "rt-carimbo", "data-passo": 1, text: s.carimbo }),
    ),
    el("h2", { class: "rt-nome an-espaca", style: atraso("0.9s"), text: s.nome }),
    el("p", { class: "rt-sub an-surge", style: atraso("1.4s"), html: md(s.subtitulo) }),
    listaEmPassos(s.passos, "rt-passos"),
    el("p", { class: "rt-extra", "data-passo": s.passos.length - 1, html: md(s.extra) }),
  );
  return {
    passos: s.passos.length - 1,
    aoPasso: (n, { entrando }) => {
      st.classList.toggle("apagando", n >= s.passos.length - 1);
      if (n === 1 && !entrando)
        cena.depois(450, () => {
          som.baque(1.3);
          ctx.fx.tremor();
        });
    },
  };
}

/* 12 · A farsa do suicídio. */
function farsa(s, st, ctx, cena) {
  const verdade = el("p", { class: "fs-verdade" });
  add(st, 
    kicker(s.kicker),
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
    el("ul", { class: "fs-depois", "data-passo": 2 }, s.depois.map((d) => el("li", { html: md(d) }))),
    el("p", { class: "fs-fiel", "data-passo": 3, html: md(s.fiel) }),
  );
  return {
    passos: 3,
    aoPasso: (n, { entrando }) => {
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

/* 14 · Araguaia: a floresta, o rio e os pontos que se apagam. */
function araguaia(s, st, ctx, cena) {
  const r = mulberry32(1972);
  const arvores = Array.from({ length: 150 }, () => {
    const x = r() * 100;
    const h = 18 + r() * 26;
    return `<line x1="${x.toFixed(2)}" y1="100" x2="${(x + (r() - 0.5) * 0.8).toFixed(2)}" y2="${(100 - h).toFixed(2)}"/>`;
  }).join("");
  const pontos = Array.from({ length: 60 }, (_, i) => {
    const x = 6 + r() * 88;
    const y = 64 + r() * 32;
    return { x, y, i };
  });
  const identificados = { 17: "Lúcia Petit · 1996", 42: "Bergson Gurjão Farias · 2009" };
  const mata = el("div", {
    class: "ar-mata",
    html: `<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><g class="ar-arvores">${arvores}</g></svg>
      <div class="ar-rio"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="M-2 82 C 12 76, 20 90, 34 84 S 56 74, 66 86 S 88 92, 102 80"/></svg></div>`,
  });
  const camadaPontos = el(
    "div",
    { class: "ar-pontos" },
    pontos.map((p) =>
      el(
        "span",
        {
          class: `ar-ponto${identificados[p.i] ? " achado" : ""}`,
          style: { left: `${p.x}%`, top: `${p.y}%`, "--i": p.i },
        },
        identificados[p.i] && el("em", { text: identificados[p.i] }),
      ),
    ),
  );
  add(st, 
    mata,
    camadaPontos,
    kicker(s.kicker),
    el("h2", { class: "ar-titulo an-varre", style: atraso("0.2s"), html: md(s.titulo) }),
    el(
      "div",
      { class: "ar-texto" },
      el("p", { class: "an-surge", style: atraso("0.8s"), html: md(s.pontos[0]) }),
      el("p", { class: "an-surge", style: atraso("1.4s"), html: md(s.pontos[1]) }),
      el("p", { "data-passo": 1, html: md(s.pontos[2]) }),
      el("p", { "data-passo": 2, html: md(s.pontos[3]) }),
    ),
  );
  return {
    passos: 2,
    aoPasso: (n) => st.classList.toggle("apagados", n >= 1),
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
        cena.depois(400, () => {
          ctx.fx.flash();
          som.explosao();
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

/* 20 · Fontes. */
function referencias(s, st, ctx) {
  const itens = Object.entries(ctx.fontes)
    .filter(([k]) => !k.startsWith("_"))
    .map(([, f]) => el("li", {}, el("span", { html: md(f.completa) }), f.url && el("a", { href: f.url, target: "_blank", rel: "noopener", text: encurtar(f.url) })));
  add(st, 
    el("h2", { class: "rf-titulo an-varre", text: s.titulo }),
    el("ol", { class: "rf-lista" }, itens),
    el("p", { class: "rf-creditos", html: md(s.creditos) }),
  );
}

function encurtar(url) {
  try {
    const u = new URL(url);
    const t = u.hostname.replace(/^www\d*\./, "") + decodeURIComponent(u.pathname).replace(/\/$/, "");
    return t.length > 70 ? `${t.slice(0, 67)}…` : t;
  } catch {
    return url;
  }
}

const RENDER = {
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
  referencias,
};
