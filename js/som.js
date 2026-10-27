// Efeitos sonoros sintetizados na hora (Web Audio): nenhum arquivo de áudio.
// Baixinhos de propósito: quem fala é a professora. Tecla M liga e desliga.

let ctx = null;
let mestre = null;
let ligado = true;
try {
  ligado = localStorage.getItem("aula-som") !== "0";
} catch {
  /* sem armazenamento: fica ligado */
}

const ouvintes = new Set();

/** O navegador só libera áudio depois de um clique ou tecla. */
export function desbloquear() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    mestre = ctx.createGain();
    mestre.gain.value = 0.55;
    mestre.connect(ctx.destination);
  }
  ctx.resume?.();
}

export function estaLigado() {
  return ligado;
}
export function alternar() {
  ligado = !ligado;
  try {
    localStorage.setItem("aula-som", ligado ? "1" : "0");
  } catch {
    /* ignora */
  }
  ouvintes.forEach((fn) => fn(ligado));
}
export function aoMudar(fn) {
  ouvintes.add(fn);
}

const pronto = () => ligado && ctx && ctx.state === "running";

function ruido(seg) {
  const n = Math.floor(ctx.sampleRate * seg);
  const buf = ctx.createBuffer(1, n, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  return src;
}

function envelope(no, t0, pico, ataque, queda) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(pico, t0 + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ataque + queda);
  no.connect(g);
  g.connect(mestre);
  return g;
}

/** Tecla de máquina de escrever. */
export function tecla() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(0.05);
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2200 + Math.random() * 1600;
  f.Q.value = 1.4;
  src.connect(f);
  envelope(f, t, 0.35, 0.002, 0.04);
  src.start(t);
  src.stop(t + 0.06);
}

/** Baque surdo: carimbo, documento caindo, porta fechando. */
export function baque(forca = 1) {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  o.type = "sine";
  o.frequency.setValueAtTime(95, t);
  o.frequency.exponentialRampToValueAtTime(38, t + 0.25);
  envelope(o, t, 0.9 * forca, 0.004, 0.32);
  o.start(t);
  o.stop(t + 0.4);
  const src = ruido(0.08);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 900;
  src.connect(f);
  envelope(f, t, 0.35 * forca, 0.002, 0.07);
  src.start(t);
}

/** Batida de coração: tum-tum. */
export function coracao() {
  if (!pronto()) return;
  [0, 0.19].forEach((dt, i) => {
    const t = ctx.currentTime + dt;
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(i ? 52 : 60, t);
    o.frequency.exponentialRampToValueAtTime(30, t + 0.16);
    envelope(o, t, i ? 0.55 : 0.8, 0.006, 0.18);
    o.start(t);
    o.stop(t + 0.3);
  });
}

/** Ronco grave de motores (tanques). */
export function ronco(seg = 5) {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(seg);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 140;
  src.connect(f);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.9, t + seg * 0.35);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seg);
  f.connect(g);
  g.connect(mestre);
  src.start(t);
}

/** Estalo de placa virando (painel de datas). */
export function clique() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(0.02);
  const f = ctx.createBiquadFilter();
  f.type = "highpass";
  f.frequency.value = 3000;
  src.connect(f);
  envelope(f, t, 0.18, 0.001, 0.015);
  src.start(t);
}

/** Rachadura. */
export function rasgo() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(0.6);
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.setValueAtTime(400, t);
  f.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
  src.connect(f);
  envelope(f, t, 0.45, 0.01, 0.55);
  src.start(t);
}

/** Explosão abafada. */
export function explosao() {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(2.2);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.setValueAtTime(2400, t);
  f.frequency.exponentialRampToValueAtTime(120, t + 1.8);
  src.connect(f);
  envelope(f, t, 1, 0.005, 2);
  src.start(t);
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(70, t);
  o.frequency.exponentialRampToValueAtTime(25, t + 1.2);
  envelope(o, t, 0.9, 0.005, 1.3);
  o.start(t);
  o.stop(t + 1.5);
}

/** Helicóptero passando: ruído grave cortado pelas pás (um "tchop" ~11 vezes por segundo). */
export function helicoptero(seg = 8) {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(seg);
  const f = ctx.createBiquadFilter();
  f.type = "lowpass";
  f.frequency.value = 380;
  const pas = ctx.createGain();
  pas.gain.value = 0.5;
  const lfo = ctx.createOscillator();
  lfo.type = "square";
  lfo.frequency.value = 11;
  const fundo = ctx.createGain();
  fundo.gain.value = 0.5;
  lfo.connect(fundo);
  fundo.connect(pas.gain);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.7, t + seg * 0.45);
  g.gain.exponentialRampToValueAtTime(0.0001, t + seg);
  src.connect(f);
  f.connect(pas);
  pas.connect(g);
  g.connect(mestre);
  src.start(t);
  lfo.start(t);
  lfo.stop(t + seg);
}

/** Chuva fina: chiado agudo e baixo que entra e sai devagar. */
export function chuva(seg = 10) {
  if (!pronto()) return;
  const t = ctx.currentTime;
  const src = ruido(seg);
  const f = ctx.createBiquadFilter();
  f.type = "bandpass";
  f.frequency.value = 2600;
  f.Q.value = 0.5;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(0.07, t + 2);
  g.gain.setValueAtTime(0.07, t + seg - 2.5);
  g.gain.linearRampToValueAtTime(0.0001, t + seg);
  src.connect(f);
  f.connect(g);
  g.connect(mestre);
  src.start(t);
}
