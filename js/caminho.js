// O caminho do preso: as quatro cenas, desenhadas em SVG (a casa, o portão do DOI-CODI,
// a cela e o corredor). Cada cena mede 1120 × 563: a largura do palco com as margens,
// na escala 1u = 10. Aqui fica só o desenho; os movimentos estão no CSS (classes cm1-…
// a cm4-…), com tempos combinados com os sons do render.js.

import { mulberry32 } from "./util.js";

const f = (v) => Math.round(v * 10) / 10;

/** Pessoa de lado ou de costas, com os pés em (0, 0) e cerca de 110 de altura. */
function boneco(classe, { capuz = false, vestido = false } = {}) {
  const pernas = vestido
    ? `<path class="bn-vestido" d="M-11 -50 L-18 0 L18 0 L11 -50 Z"/>`
    : `<g class="bn-perna bn-pe-e"><rect x="-8.5" y="-48" width="8" height="48" rx="3.5"/></g><g class="bn-perna bn-pe-d"><rect x="0.5" y="-48" width="8" height="48" rx="3.5"/></g>`;
  return `<g class="cm-boneco ${classe}">
    ${pernas}
    <g class="bn-braco bn-br-e"><rect x="-18" y="-85" width="7" height="40" rx="3.5"/></g>
    <path class="bn-tronco" d="M-12.5 -46 L-13.5 -76 C-13.5 -84 -9 -88 0 -88 C9 -88 13.5 -84 13.5 -76 L12.5 -46 Z"/>
    <g class="bn-braco bn-br-d"><rect x="11" y="-85" width="7" height="40" rx="3.5"/></g>
    <rect class="bn-pescoco" x="-3.5" y="-93" width="7" height="7"/>
    <circle class="bn-cabeca" cx="0" cy="-100" r="9.5"/>
    ${vestido ? `<path class="bn-cabelo" d="M-10.5 -101 C-12 -114 12 -114 10.5 -101 C10.5 -95 8.5 -90 6 -88 L-6 -88 C-8.5 -90 -10.5 -95 -10.5 -101 Z"/>` : ""}
    ${capuz ? `<path class="bn-capuz" d="M-12.5 -97 C-12.5 -115 12.5 -115 12.5 -97 L13.5 -86 L-13.5 -86 Z"/>` : ""}
  </g>`;
}

function estrelas(semente, qtd, ymax) {
  const r = mulberry32(semente);
  return Array.from({ length: qtd }, () => `<circle cx="${f(r() * 1120)}" cy="${f(r() * ymax)}" r="${f(0.6 + r() * 1.1)}" fill="#e8e2d2" opacity="${f(0.25 + r() * 0.6)}"/>`).join("");
}

/** Prédios ao longe, com algumas janelas acesas. */
function cidade(semente, topo, base) {
  const r = mulberry32(semente);
  let s = "";
  let x = -10;
  while (x < 1130) {
    const w = 34 + r() * 60;
    const h = 30 + r() * (base - topo - 30);
    const y = base - h;
    s += `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" fill="#0d1119"/>`;
    for (let wy = y + 8; wy < base - 8; wy += 13)
      for (let wx = x + 6; wx < x + w - 8; wx += 11) if (r() < 0.1) s += `<rect x="${f(wx)}" y="${f(wy)}" width="5" height="6" fill="#d8b562" opacity="${f(0.3 + r() * 0.4)}"/>`;
    x += w + 4 + r() * 16;
  }
  return s;
}

const RODA = `<circle r="14" fill="#090909"/><circle r="7.5" fill="#56534d"/><path d="M-7 0 H7 M0 -7 V7" stroke="#2b2926" stroke-width="2.2"/>`;

/** Sedã dos anos 1970 de lado, de frente para a direita. Pneus no chão em y = 78.
    O facho do farol sai do próprio farol (238, 40–48) e desce até a rua. */
function carroLado() {
  return `<g class="cm-carro-lado">
    <ellipse cx="122" cy="79" rx="128" ry="6" fill="#000" opacity=".55"/>
    <polygon points="238,40 640,16 640,78 540,78 238,48" fill="url(#cm1-farol)"/>
    <ellipse cx="470" cy="78" rx="180" ry="7" fill="#fff2c8" opacity=".14"/>
    <circle cx="6" cy="44" r="18" fill="url(#cm1-lanterna)"/>
    <path d="M6 50 C6 42 10 38 20 37 L64 34 L92 12 C96 9 100 8 106 8 L162 8 C168 8 172 10 176 14 L196 34 L226 37 C234 38 238 42 238 50 L238 58 C238 62 235 64 231 64 L10 64 C7 64 6 62 6 58 Z" fill="#1d2127"/>
    <path d="M71 34 L95 14 L128 14 L128 34 Z M134 14 L168 14 C172 14 174 15 176 18 L190 34 L134 34 Z" fill="#0b0f15"/>
    <path d="M100 16 L112 16 L94 32 L82 32 Z M150 16 L158 16 L146 32 L138 32 Z" fill="#26313f" opacity=".55"/>
    <path d="M76 37 V62 M131 37 V62 M190 37 V62" stroke="#111418" stroke-width="1.6"/>
    <path d="M14 46 H232" stroke="#59606a" stroke-width="1.6"/>
    <rect x="114" y="41" width="9" height="2.6" rx="1" fill="#6a717b"/><rect x="172" y="41" width="9" height="2.6" rx="1" fill="#6a717b"/>
    <rect x="232" y="52" width="9" height="6" rx="2" fill="#8b9098"/><rect x="1" y="52" width="9" height="6" rx="2" fill="#8b9098"/>
    <rect x="231" y="39" width="7" height="9" rx="2.5" fill="#fff5d2"/>
    <rect x="4" y="40" width="5" height="8" rx="1.5" fill="#d11f27"/>
    <circle cx="52" cy="64" r="17" fill="#0c0e11"/><circle cx="190" cy="64" r="17" fill="#0c0e11"/>
    <g transform="translate(52 64)"><g class="cm-roda">${RODA}</g></g>
    <g transform="translate(190 64)"><g class="cm-roda">${RODA}</g></g>
  </g>`;
}

/** O mesmo carro visto de trás, com o centro dos pneus traseiros em (0, 0). */
function carroTras() {
  return `<ellipse cx="0" cy="0" rx="114" ry="8" fill="#000" opacity=".6"/>
    <rect x="-96" y="-26" width="30" height="26" rx="5" fill="#080808"/><rect x="66" y="-26" width="30" height="26" rx="5" fill="#080808"/>
    <path d="M-100 -28 L-98 -62 C-97 -70 -92 -74 -84 -75 L84 -75 C92 -74 97 -70 98 -62 L100 -28 C100 -22 96 -18 90 -18 L-90 -18 C-96 -18 -100 -22 -100 -28 Z" fill="#1d2127"/>
    <path d="M-70 -75 L-56 -112 C-54 -117 -50 -119 -44 -119 L44 -119 C50 -119 54 -117 56 -112 L70 -75 Z" fill="#191d22"/>
    <path d="M-60 -79 L-49 -108 L49 -108 L60 -79 Z" fill="#0a0e13"/>
    <path d="M-22 -106 L-6 -106 L-30 -81 L-46 -81 Z" fill="#1f2a36" opacity=".6"/>
    <path d="M-99 -62 H99" stroke="#2a2f36" stroke-width="1.5"/>
    <rect x="-103" y="-35" width="206" height="8" rx="3" fill="#7f848c"/>
    <g class="cm2-freio"><ellipse cx="-81" cy="-52" rx="38" ry="20" fill="url(#cm2-vermelho)"/><ellipse cx="81" cy="-52" rx="38" ry="20" fill="url(#cm2-vermelho)"/></g>
    <rect x="-96" y="-58" width="30" height="12" rx="2" fill="#c41d25"/><rect x="66" y="-58" width="30" height="12" rx="2" fill="#c41d25"/>
    <rect x="-24" y="-52" width="48" height="14" rx="1.5" fill="#d8d1c1"/><path d="M-16 -45 H16" stroke="#6b665d" stroke-width="2"/>`;
}

/* ------------------------------------------------------------ 1 · a casa */

function janela(x, y, classe) {
  const grade = [12, 24, 36, 48, 60].map((d) => `M${x + d} ${y} V${y + 58}`).join(" ");
  return `<rect x="${x}" y="${y}" width="72" height="58" fill="#15120f"/>
    <g class="cm1-jan ${classe}">
      <ellipse cx="${x + 36}" cy="${y + 30}" rx="80" ry="52" fill="url(#cm1-brilho)" opacity=".35"/>
      <rect x="${x}" y="${y}" width="72" height="58" fill="#f1c66b"/>
      <rect x="${x}" y="${y}" width="20" height="58" fill="#c9944a" opacity=".85"/><rect x="${x + 52}" y="${y}" width="20" height="58" fill="#c9944a" opacity=".85"/>
    </g>
    <path d="${grade} M${x} ${y + 29} H${x + 72}" stroke="#241d17" stroke-width="3"/>
    <rect x="${x}" y="${y}" width="72" height="58" fill="none" stroke="#4a4038" stroke-width="4"/>
    <rect x="${x - 6}" y="${y + 58}" width="84" height="6" fill="#3e3732"/>`;
}

function cenaCasa() {
  const telhas = [1, 2, 3, 4].map((k) => {
    const t = k / 5;
    return `M${f(322 + 198 * t)} ${f(334 - 82 * t)} H${f(718 - 198 * t)}`;
  });
  return `<svg viewBox="0 0 1120 563" aria-hidden="true">
  <defs>
    <linearGradient id="cm1-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05080f"/><stop offset=".62" stop-color="#0c1322"/><stop offset="1" stop-color="#1b2232"/></linearGradient>
    <radialGradient id="cm1-lua"><stop offset="0" stop-color="#e9e4d6" stop-opacity=".22"/><stop offset="1" stop-color="#e9e4d6" stop-opacity="0"/></radialGradient>
    <linearGradient id="cm1-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a0" stop-opacity=".3"/><stop offset="1" stop-color="#ffe2a0" stop-opacity=".02"/></linearGradient>
    <linearGradient id="cm1-farol" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff2c8" stop-opacity=".6"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></linearGradient>
    <radialGradient id="cm1-lanterna"><stop offset="0" stop-color="#e2303a" stop-opacity=".55"/><stop offset="1" stop-color="#e2303a" stop-opacity="0"/></radialGradient>
    <radialGradient id="cm1-brilho"><stop offset="0" stop-color="#ffd98a" stop-opacity=".6"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></radialGradient>
    <linearGradient id="cm1-derrame" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd98a" stop-opacity=".55"/><stop offset="1" stop-color="#ffd98a" stop-opacity="0"/></linearGradient>
    <linearGradient id="cm1-parede" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#2a2622"/><stop offset="1" stop-color="#36312b"/></linearGradient>
    <linearGradient id="cm1-rua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161616"/><stop offset="1" stop-color="#0b0b0b"/></linearGradient>
  </defs>
  <rect width="1120" height="563" fill="url(#cm1-ceu)"/>
  ${estrelas(5, 70, 330)}
  <circle cx="1010" cy="262" r="85" fill="url(#cm1-lua)"/><circle cx="1010" cy="262" r="21" fill="#e6e0d0"/>
  ${cidade(1971, 340, 470)}
  <rect x="200" y="352" width="14" height="118" fill="#090b0c"/>
  ${[[207, 318, 46], [168, 342, 34], [248, 338, 36], [214, 286, 30], [184, 300, 28], [242, 300, 26]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#090d0b"/>`).join("")}
  <polygon points="322,334 520,252 718,334" fill="#3a2520"/>
  <path d="${telhas.join(" ")}" stroke="#2a1916" stroke-width="2.5"/>
  <rect x="340" y="334" width="360" height="136" fill="url(#cm1-parede)"/>
  <rect x="340" y="334" width="360" height="7" fill="#000" opacity=".35"/>
  <rect x="340" y="452" width="360" height="18" fill="#26221f"/>
  ${janela(378, 362, "cm1-jan-a")}
  ${janela(590, 362, "cm1-jan-b")}
  <rect x="486" y="368" width="58" height="102" fill="#4a4038"/>
  <rect x="490" y="372" width="50" height="98" fill="#f3d18a"/>
  <rect x="490" y="372" width="50" height="40" fill="#fff0c8" opacity=".5"/>
  <g class="cm1-esposa-g"><g transform="translate(518 470) scale(.8)"><g class="cm1-esposa">${boneco("esposa", { vestido: true })}</g></g></g>
  <g class="cm1-porta-g"><g class="cm1-porta">
    <rect x="490" y="372" width="50" height="98" fill="#3a281c"/>
    <rect x="497" y="380" width="36" height="34" fill="none" stroke="#2c1e15" stroke-width="2.5"/>
    <rect x="497" y="424" width="36" height="38" fill="none" stroke="#2c1e15" stroke-width="2.5"/>
    <circle cx="533" cy="420" r="2.5" fill="#a08a5a"/>
  </g></g>
  <rect x="509" y="350" width="12" height="8" fill="#3c3530"/>
  <circle cx="515" cy="362" r="36" fill="url(#cm1-brilho)"/><circle cx="515" cy="361" r="3.5" fill="#ffe7ab"/>
  <rect x="476" y="470" width="78" height="6" fill="#3b3631"/>
  <rect x="877" y="248" width="6" height="222" fill="#26241f"/>
  <path d="M880 250 Q880 232 858 232 L846 232" stroke="#26241f" stroke-width="5" fill="none"/>
  <rect x="834" y="229" width="24" height="7" rx="2" fill="#3a3631"/>
  <polygon points="838,239 854,239 960,470 732,470" fill="url(#cm1-cone)"/>
  <ellipse cx="846" cy="238" rx="10" ry="3" fill="#ffe7ab"/>
  <rect x="0" y="470" width="1120" height="16" fill="#262420"/>
  <ellipse cx="846" cy="476" rx="130" ry="9" fill="#ffe2a0" opacity=".14"/>
  <rect x="0" y="486" width="1120" height="4" fill="#3a3631"/>
  <rect x="0" y="490" width="1120" height="73" fill="url(#cm1-rua)"/>
  <path d="M0 548 H1120" stroke="#34312c" stroke-width="3" stroke-dasharray="44 34"/>
  <g class="cm1-derrame"><polygon points="490,470 540,470 578,490 452,490" fill="url(#cm1-derrame)"/><circle cx="515" cy="440" r="70" fill="url(#cm1-brilho)" opacity=".55"/></g>
  <g transform="translate(515 470) scale(.82)"><g class="cm1-preso">${boneco("preso", { capuz: true })}</g></g>
  <g transform="translate(566 476) scale(.88)"><g class="cm1-ag cm1-ag1">${boneco("agente")}</g></g>
  <g transform="translate(618 476) scale(.88)"><g class="cm1-ag cm1-ag2">${boneco("agente")}</g></g>
  <g transform="translate(600 452)"><g class="cm1-carro">${carroLado()}</g></g>
</svg>`;
}

/* -------------------------------------------------- 2 · o portão do DOI-CODI */

function cenaPortao() {
  const r = mulberry32(1970);
  let janelas = "";
  for (const y of [160, 200, 240])
    for (let x = 320; x < 800; x += 44) {
      const acesa = r() < 0.2;
      janelas += `<rect x="${x}" y="${y}" width="22" height="22" fill="${acesa ? "#7a6c48" : "#0c0e11"}" opacity="${acesa ? 0.8 : 1}"/>`;
      if (acesa) janelas += `<path d="M${x + 7} ${y} V${y + 22} M${x + 15} ${y} V${y + 22}" stroke="#16181c" stroke-width="2"/>`;
    }
  let arame = "";
  for (let x = 0; x < 1120; x += 22) arame += `<ellipse cx="${x + 11}" cy="282" rx="12" ry="10" fill="none" stroke="#6e6a63" stroke-width="1.2" opacity=".8"/>`;
  for (let x = 30; x < 1120; x += 112) arame += `<path d="M${x} 300 L${x + 6} 266" stroke="#4a4844" stroke-width="3"/>`;
  let juntas = "";
  for (let x = 46; x < 1120; x += 92) juntas += `M${x} 302 V470 `;
  const folha = (x0, classe) => {
    let nervuras = "";
    for (let x = x0 + 6; x < x0 + 110; x += 10) nervuras += `M${x} 320 V468 `;
    return `<g class="${classe}"><rect x="${x0}" y="318" width="110" height="152" fill="#33322e"/><path d="${nervuras}" stroke="#282724" stroke-width="2"/><rect x="${x0}" y="388" width="110" height="7" fill="#3d3c38"/><rect x="${x0 + 2}" y="320" width="106" height="148" fill="none" stroke="#45433e" stroke-width="4"/></g>`;
  };
  const faixas = [
    [474, 482],
    [490, 504],
    [516, 536],
    [550, 563],
  ]
    .map(([a, b]) => {
      const w1 = 3 + (a - 470) * 0.14;
      const w2 = 3 + (b - 470) * 0.14;
      return `<polygon points="${f(560 - w1 / 2)},${a} ${f(560 + w1 / 2)},${a} ${f(560 + w2 / 2)},${b} ${f(560 - w2 / 2)},${b}" fill="#3a3832"/>`;
    })
    .join("");
  return `<svg viewBox="0 0 1120 563" aria-hidden="true">
  <defs>
    <linearGradient id="cm2-ceu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05070c"/><stop offset="1" stop-color="#121826"/></linearGradient>
    <linearGradient id="cm2-muro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e2d2a"/><stop offset="1" stop-color="#1c1c1a"/></linearGradient>
    <linearGradient id="cm2-mancha" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity=".45"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="cm2-cone" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6d8" stop-opacity=".22"/><stop offset="1" stop-color="#fff6d8" stop-opacity=".02"/></linearGradient>
    <linearGradient id="cm2-busca" x1="1" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffbe8" stop-opacity=".35"/><stop offset="1" stop-color="#fffbe8" stop-opacity="0"/></linearGradient>
    <radialGradient id="cm2-farol"><stop offset="0" stop-color="#fff2c8" stop-opacity=".35"/><stop offset="1" stop-color="#fff2c8" stop-opacity="0"/></radialGradient>
    <radialGradient id="cm2-vermelho"><stop offset="0" stop-color="#ff3b30" stop-opacity=".7"/><stop offset="1" stop-color="#ff3b30" stop-opacity="0"/></radialGradient>
    <radialGradient id="cm2-guarita"><stop offset="0" stop-color="#e3c985" stop-opacity=".45"/><stop offset="1" stop-color="#e3c985" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="1120" height="563" fill="url(#cm2-ceu)"/>
  ${estrelas(9, 50, 300)}
  <rect x="292" y="134" width="536" height="10" fill="#1c1e22"/>
  <rect x="300" y="140" width="520" height="170" fill="#16181c"/>
  ${janelas}
  <path d="M760 134 V88 M750 100 H770 M752 112 H768" stroke="#2a2c30" stroke-width="3"/>
  <g class="cm2-torre">
    <path d="M936 470 L950 236 M1016 470 L1002 236" stroke="#1f2024" stroke-width="6"/>
    <path d="M942 420 L1010 330 M1010 420 L942 330" stroke="#1f2024" stroke-width="3"/>
    <rect x="920" y="196" width="112" height="44" fill="#1a1b1e"/>
    <polygon points="908,198 976,176 1044,198" fill="#202125"/>
    <rect x="930" y="208" width="92" height="10" fill="#7a6c48" opacity=".6"/>
  </g>
  <rect x="0" y="300" width="1120" height="170" fill="url(#cm2-muro)"/>
  <path d="${juntas} M0 385 H1120" stroke="#1a1a19" stroke-width="2"/>
  ${[90, 250, 760, 1010].map((x) => `<rect x="${x}" y="302" width="34" height="120" fill="url(#cm2-mancha)"/>`).join("")}
  <rect x="0" y="294" width="1120" height="8" fill="#3c3b37"/>
  ${arame}
  <rect x="450" y="318" width="220" height="152" fill="#050505"/>
  <ellipse cx="560" cy="456" rx="100" ry="20" fill="#d9cfa8" opacity=".06"/>
  <rect x="604" y="404" width="16" height="30" fill="#a8946a" opacity=".3"/>
  ${folha(450, "cm2-folha-e")}
  ${folha(560, "cm2-folha-d")}
  <rect x="426" y="286" width="24" height="184" fill="#3e3d39"/><rect x="670" y="286" width="24" height="184" fill="#3e3d39"/>
  <rect x="422" y="280" width="32" height="8" fill="#4a4945"/><rect x="666" y="280" width="32" height="8" fill="#4a4945"/>
  <rect x="548" y="296" width="24" height="8" fill="#4a4945"/>
  <polygon points="552,308 568,308 780,563 340,563" fill="url(#cm2-cone)"/>
  <ellipse cx="560" cy="306" rx="9" ry="3" fill="#fff6d6"/>
  <ellipse cx="368" cy="417" rx="64" ry="44" fill="url(#cm2-guarita)"/>
  <rect x="330" y="386" width="76" height="84" fill="#22221e"/>
  <rect x="322" y="378" width="92" height="10" fill="#2c2b27"/>
  <rect x="342" y="400" width="52" height="34" fill="#e3c985" opacity=".85"/>
  <circle cx="368" cy="414" r="7.5" fill="#17140f"/><path d="M354 434 C354 424 360 420 368 420 C376 420 382 424 382 434 Z" fill="#17140f"/>
  <rect x="0" y="470" width="1120" height="93" fill="#111110"/>
  <polygon points="450,470 670,470 930,563 190,563" fill="#181816"/>
  <path d="M450 470 L190 563 M670 470 L930 563" stroke="#2d2c29" stroke-width="4"/>
  ${faixas}
  <ellipse cx="560" cy="505" rx="170" ry="26" fill="#fff6d8" opacity=".06"/>
  <ellipse class="cm2-luzfarol" cx="560" cy="420" rx="150" ry="72" fill="url(#cm2-farol)"/>
  <g class="cm2-busca"><polygon points="922,221 922,231 640,563 450,563" fill="url(#cm2-busca)"/></g>
  <circle cx="922" cy="226" r="7" fill="#3a3a38"/><circle cx="918" cy="226" r="3.5" fill="#fffbe8"/>
  <g transform="translate(560 0)"><g class="cm2-carro">${carroTras()}</g></g>
</svg>`;
}

/* ------------------------------------------------------------ 3 · a cela */

function cenaCela() {
  // Sombras das grades da janela na mancha de luz do chão.
  const sombras = [0.16, 0.36, 0.57, 0.77]
    .map((fr) => {
      const tx = 470 + 142 * fr;
      const bx = 440 + 220 * fr;
      return `<polygon points="${f(tx)},472 ${f(tx + 9.6)},472 ${f(bx + 15)},520 ${f(bx)},520" fill="#0b0a09" opacity=".65"/>`;
    })
    .join("");
  // Riscos na parede: dois grupos de cinco, o quinto cortando os outros quatro.
  const riscos = [0, 58]
    .map((dx) => [0, 9, 18, 27].map((x) => `<path class="cm3-m" pathLength="1" d="M${dx + x} 0 L${dx + x + 2} 42"/>`).join("") + `<path class="cm3-m" pathLength="1" d="M${dx - 5} 32 L${dx + 33} 8"/>`)
    .join("");
  const grades = Array.from({ length: 10 }, (_, k) => `<rect x="${15 + 110 * k}" y="-10" width="13" height="580" fill="url(#cm3-barra)"/>`).join("");
  return `<svg viewBox="0 0 1120 563" aria-hidden="true">
  <defs>
    <linearGradient id="cm3-parede" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a1918"/><stop offset="1" stop-color="#121110"/></linearGradient>
    <pattern id="cm3-tijolo" width="64" height="26" patternUnits="userSpaceOnUse"><path d="M0 0.5 H64 M0 13.5 H64 M0.5 0 V13 M32.5 13 V26" stroke="#000" stroke-width="1.5" fill="none"/></pattern>
    <linearGradient id="cm3-chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161514"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>
    <linearGradient id="cm3-noite" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9db4e6" stop-opacity=".24"/><stop offset="1" stop-color="#9db4e6" stop-opacity=".05"/></linearGradient>
    <linearGradient id="cm3-sol" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe0a8" stop-opacity=".34"/><stop offset="1" stop-color="#ffe0a8" stop-opacity=".07"/></linearGradient>
    <linearGradient id="cm3-barra" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#151413"/><stop offset=".45" stop-color="#46433e"/><stop offset="1" stop-color="#121110"/></linearGradient>
    <linearGradient id="cm3-barra-h" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151413"/><stop offset=".45" stop-color="#46433e"/><stop offset="1" stop-color="#121110"/></linearGradient>
    <radialGradient id="cm3-vinheta" cx=".5" cy=".6" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient>
  </defs>
  <rect width="1120" height="470" fill="url(#cm3-parede)"/>
  <rect width="1120" height="470" fill="url(#cm3-tijolo)" opacity=".22"/>
  <rect y="380" width="1120" height="90" fill="#000" opacity=".25"/>
  <rect y="470" width="1120" height="93" fill="url(#cm3-chao)"/>
  <path d="M0 470 H1120" stroke="#232120" stroke-width="3"/>
  <rect x="690" y="232" width="88" height="66" fill="#0a0a0a"/>
  <rect x="697" y="239" width="74" height="52" fill="#24365a"/>
  <rect class="cm3-dia" x="697" y="239" width="74" height="52" fill="#c9d6e0"/>
  <path d="M711.5 239 V291 M726.5 239 V291 M741.5 239 V291 M756.5 239 V291" stroke="#121212" stroke-width="5"/>
  <polygon points="697,291 771,291 612,470 470,470" fill="url(#cm3-noite)"/>
  <polygon class="cm3-dia" points="697,291 771,291 612,470 470,470" fill="url(#cm3-sol)"/>
  <polygon points="470,472 612,472 660,520 440,520" fill="#8fa6d8" opacity=".16"/>
  <polygon class="cm3-dia" points="470,472 612,472 660,520 440,520" fill="#ffdca0" opacity=".26"/>
  ${sombras}
  <rect x="360" y="418" width="280" height="12" rx="3" fill="#3b3631"/>
  <rect x="560" y="410" width="72" height="9" rx="2" fill="#2f2a25"/>
  <rect x="354" y="428" width="292" height="8" fill="#2b2926"/>
  <rect x="362" y="436" width="7" height="34" fill="#232120"/><rect x="631" y="436" width="7" height="34" fill="#232120"/>
  <g class="cm3-preso">
    <path d="M452 360 C447 384 449 408 457 424 L503 424 C506 404 502 382 493 364 C487 354 461 351 452 360 Z" fill="#b9af9e"/>
    <path d="M456 410 L532 412 C540 412 543 420 540 430 L460 432 Z" fill="#2a2724"/>
    <path d="M519 424 L541 424 L546 468 L527 468 Z" fill="#2a2724"/>
    <rect x="524" y="465" width="28" height="6" rx="2" fill="#1a1816"/>
    <path d="M488 366 Q500 394 524 412" stroke="#aea492" stroke-width="11" stroke-linecap="round" fill="none"/>
    <circle cx="526" cy="413" r="5" fill="#7d6e5d"/>
    <circle cx="481" cy="341" r="12" fill="#4f4336"/>
    <path d="M469 338 C469 326 492 324 494 336 Z" fill="#1f1914"/>
  </g>
  <g transform="translate(803 330)" class="cm3-riscos">${riscos}</g>
  ${grades}
  <rect x="0" y="226" width="1120" height="14" fill="url(#cm3-barra-h)"/>
  <rect x="0" y="498" width="1120" height="12" fill="url(#cm3-barra-h)"/>
  <rect x="1000" y="262" width="40" height="64" rx="3" fill="#2b2926"/><circle cx="1020" cy="286" r="5" fill="#0d0c0b"/>
  <text class="cm3-rot" x="803" y="312">INCOMUNICÁVEL</text>
  <text class="cm3-contador" x="803" y="404">DIA 0</text>
  <rect width="1120" height="563" fill="url(#cm3-vinheta)"/>
</svg>`;
}

/* --------------------------------------------------------- 4 · o corredor */

function cenaCorredor() {
  // Corredor em perspectiva: a moldura perto vai de x 160 a 960; o fundo, de 470 a 650.
  const topo = (x) => 40 + (x - 160) * (210 / 310);
  const base = (x) => 563 - (x - 160) * (163 / 310);
  const meia = (x) => base(x) - 0.45 * (base(x) - topo(x));
  const espelho = (pts) => pts.map(([x, y]) => [1120 - x, y]);
  const poli = (pts, attrs) => `<polygon points="${pts.map(([x, y]) => `${f(x)},${f(y)}`).join(" ")}" ${attrs}/>`;
  const porta = (x1, x2) => {
    const t = (x) => base(x) - 0.62 * (base(x) - topo(x));
    return [
      [x1, t(x1)],
      [x2, t(x2)],
      [x2, base(x2)],
      [x1, base(x1)],
    ];
  };
  const parede = (lado) => {
    const m = lado === "d" ? espelho : (p) => p;
    const alta = m([
      [160, 40],
      [470, 250],
      [470, meia(470)],
      [160, meia(160)],
    ]);
    const baixa = m([
      [160, meia(160)],
      [470, meia(470)],
      [470, 400],
      [160, 563],
    ]);
    const faixa = m([
      [160, meia(160)],
      [470, meia(470)],
    ]);
    const portas = [porta(232, 286), porta(350, 380)]
      .map((p) => poli(m(p), 'fill="#2a2622" stroke="#3a352f" stroke-width="3"'))
      .join("");
    return `${poli(alta, 'fill="#22211e"')}${poli(baixa, 'fill="#1b211d"')}<path d="M${f(faixa[0][0])} ${f(faixa[0][1])} L${f(faixa[1][0])} ${f(faixa[1][1])}" stroke="#2e3430" stroke-width="4"/>${portas}`;
  };
  // Lajotas do chão: linhas que fogem para o fundo e linhas atravessadas.
  let chao = "";
  for (let k = 0; k <= 6; k++) {
    const t = k / 6;
    chao += `M${f(470 + 180 * t)} 400 L${f(160 + 800 * t)} 563 `;
  }
  for (const y of [410, 424, 444, 472, 512]) {
    const xe = 160 + ((563 - y) / 163) * 310;
    chao += `M${f(xe)} ${y} H${f(1120 - xe)} `;
  }
  return `<svg viewBox="0 0 1120 563" aria-hidden="true">
  <defs>
    <linearGradient id="cm4-chao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#161513"/><stop offset="1" stop-color="#1e1c19"/></linearGradient>
    <radialGradient id="cm4-brilho"><stop offset="0" stop-color="#ffe9b0" stop-opacity=".32"/><stop offset="1" stop-color="#ffe9b0" stop-opacity="0"/></radialGradient>
    <linearGradient id="cm4-clarao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fbf8ee" stop-opacity=".7"/><stop offset="1" stop-color="#fbf8ee" stop-opacity="0"/></linearGradient>
    <radialGradient id="cm4-halo"><stop offset="0" stop-color="#fbf8ee" stop-opacity=".45"/><stop offset="1" stop-color="#fbf8ee" stop-opacity="0"/></radialGradient>
    <radialGradient id="cm4-vinheta" cx=".5" cy=".62" r=".72"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".8"/></radialGradient>
  </defs>
  <rect width="1120" height="563" fill="#0b0b0a"/>
  <polygon points="160,40 470,250 650,250 960,40" fill="#0d0d0c"/>
  ${parede("e")}
  ${parede("d")}
  <polygon points="160,563 470,400 650,400 960,563" fill="url(#cm4-chao)"/>
  <path d="${chao}" stroke="#0e0d0c" stroke-width="2"/>
  <rect x="470" y="250" width="180" height="150" fill="#1d1c1a"/>
  <rect x="521" y="296" width="78" height="104" fill="#121110"/>
  <rect class="cm4-luzporta" x="525" y="300" width="70" height="100" fill="#f8f4e8"/>
  <g class="cm4-porta">
    <rect x="525" y="300" width="70" height="100" fill="#2e2d2a"/>
    <rect x="545" y="318" width="30" height="6" fill="#0a0a0a"/>
    <rect x="583" y="350" width="6" height="12" rx="2" fill="#4a4741"/>
    <path d="M529 304 H591 V396 H529 Z" fill="none" stroke="#3a3935" stroke-width="2"/>
  </g>
  <rect class="cm4-fresta" x="525" y="397.5" width="70" height="2.5" fill="#f8f4e8"/>
  <g class="cm4-clarao"><polygon points="525,400 595,400 840,563 280,563" fill="url(#cm4-clarao)"/><circle cx="560" cy="350" r="150" fill="url(#cm4-halo)"/></g>
  <path d="M560 168 V228" stroke="#3a3631" stroke-width="2"/>
  <path d="M548 228 L572 228 L582 241 L538 241 Z" fill="#2c2925"/>
  <g class="cm4-lampada"><circle cx="560" cy="250" r="130" fill="url(#cm4-brilho)"/><ellipse cx="560" cy="452" rx="180" ry="22" fill="#ffe9b0" opacity=".1"/><ellipse cx="560" cy="243" rx="7" ry="4" fill="#fff0c4"/></g>
  <g transform="translate(560 400)"><g class="cm4-pessoas">
    <g transform="translate(-16 0)">${boneco("agente")}</g>
    <g transform="translate(16 0)">${boneco("preso", { capuz: true })}</g>
  </g></g>
  <rect width="1120" height="563" fill="url(#cm4-vinheta)"/>
</svg>`;
}

/** As quatro cenas, na ordem do caminho. */
export const cenasCaminho = () => [cenaCasa(), cenaPortao(), cenaCela(), cenaCorredor()];
