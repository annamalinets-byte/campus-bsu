// Генератор статичных планов уровней корпуса «К. Маркса, 31»
// по данным v2 (data/economics-building.json): уровни с координатами,
// оцифрованными с PDF-стенда. Пишет assets/floor-N.svg и assets/floor-N.5.svg.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const data = JSON.parse(readFileSync(join(root, "data/economics-building.json"), "utf8"));

const W = 1240, H = 680;

const TYPE_COLORS = {
  auditorium: { fill: "#dbeafe", stroke: "#2563eb", text: "#1e3a8a" },
  department: { fill: "#fef3c7", stroke: "#d97706", text: "#78350f" },
  deanery:    { fill: "#fee2e2", stroke: "#dc2626", text: "#7f1d1d" },
  library:    { fill: "#d1fae5", stroke: "#059669", text: "#064e3b" },
  hall:       { fill: "#ede9fe", stroke: "#7c3aed", text: "#4c1d95" },
  lab:        { fill: "#cffafe", stroke: "#0891b2", text: "#155e75" },
  office:     { fill: "#f3f4f6", stroke: "#6b7280", text: "#374151" },
  food:       { fill: "#ffedd5", stroke: "#ea580c", text: "#7c2d12" },
  wc:         { fill: "#e0f2fe", stroke: "#0284c7", text: "#075985" },
  sport:      { fill: "#dcfce8", stroke: "#16a34a", text: "#14532d" },
  wardrobe:   { fill: "#fef9c3", stroke: "#ca8a04", text: "#713f12" },
  turnstile:  { fill: "#f1f5f9", stroke: "#64748b", text: "#334155" },
  yard:       { fill: "#ecfccb", stroke: "#65a30d", text: "#3f6212" },
  entrance:   { fill: "#f3f4f6", stroke: "#6b7280", text: "#374151" }
};
const TYPE_LABELS = {
  auditorium: "аудитория", department: "кафедра", deanery: "деканат",
  library: "библиотека", hall: "актовый зал", lab: "лаборатория",
  office: "офис", food: "фудкорт", wc: "туалет", sport: "спортзал",
  wardrobe: "гардероб/раздев.", turnstile: "турникеты", yard: "дворик", entrance: "вход/вахта"
};
const LEGEND = Object.keys(TYPE_COLORS).map(t => [t, TYPE_LABELS[t]]);

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const clip = (t, n) => (t.length > n ? t.slice(0, Math.max(1, n - 1)) + "…" : t);
const displayNum = (r) => {
  if (/^WC/.test(r.number)) return "WC";
  if (r.number === "ACT") return "АКТ";
  if (["entrance", "wardrobe", "turnstile", "yard", "sport", "hall", "food"].includes(r.type)) return "";
  if (r.number === "ДЕК" || r.number === "КАФ") return "";
  return r.number;
};

function levelSvg(lv) {
  const r = lv.region, rw = r[2] - r[0], rh = r[3] - r[1];
  const s = Math.min(1140 / rw, 500 / rh);
  const ox = (W - rw * s) / 2 - r[0] * s;
  const oy = 130 + (520 - rh * s) / 2 - r[1] * s;

  let inner = `<path d="${lv.outline}" fill="#ffffff" stroke="#111827" stroke-width="45" stroke-linejoin="round"/>`;

  (lv.stairs || []).forEach(st => {
    let lines = "";
    const n = Math.round(st.h / 130);
    for (let i = 1; i < n; i++) {
      const ly = st.y + i * (st.h / n);
      lines += `<line x1="${st.x + 50}" y1="${ly}" x2="${st.x + st.w - 50}" y2="${ly}" stroke="#9ca3af" stroke-width="30"/>`;
    }
    inner += `<rect x="${st.x}" y="${st.y}" width="${st.w}" height="${st.h}" rx="30" fill="#e5e7eb" stroke="#9ca3af" stroke-width="24"/>${lines}` +
      (st.label ? `<text x="${st.x + st.w / 2}" y="${st.y + st.h + 150}" text-anchor="middle" font-size="130" fill="#6b7280">${esc(st.label)}</text>` : "");
  });

  (lv.zoneLabels || []).forEach(z => {
    inner += `<text x="${z.x}" y="${z.y}" text-anchor="middle" font-size="${z.size || 500}" font-weight="700" fill="#a8a29e" opacity="0.55">${esc(z.text)}</text>`;
  });

  lv.rooms.forEach(room => {
    const c = TYPE_COLORS[room.type] || TYPE_COLORS.office;
    const x = room.cx - room.w / 2, y = room.cy - room.h / 2;
    const dashed = room.conf === "hypothesis" ? ' stroke-dasharray="70 45"' : "";
    const num = displayNum(room);
    const maxChars = Math.max(6, Math.floor((room.w - 90) / 95));
    const label = clip(room.name, maxChars);
    const numY = room.h > room.w ? room.cy - 60 : room.cy - 40;
    inner += `<g class="room" data-room="${esc(room.id)}">` +
      `<rect x="${x}" y="${y}" width="${room.w}" height="${room.h}" rx="55" fill="${c.fill}" stroke="${c.stroke}" stroke-width="28"${dashed}/>` +
      (num ? `<text x="${room.cx}" y="${numY}" text-anchor="middle" font-size="250" font-weight="700" fill="${c.text}">${esc(num)}</text>` : "") +
      `<text x="${room.cx}" y="${num ? numY + 210 : room.cy + 60}" text-anchor="middle" font-size="135" fill="${c.text}">${esc(label)}</text>` +
      `</g>`;
  });

  const legendY = H - 18;
  const legend = LEGEND.map(([t, label], i) => {
    const c = TYPE_COLORS[t];
    const lx = 30 + (i % 9) * 133;
    const ly = legendY + Math.floor(i / 9) * 20;
    return `<rect x="${lx}" y="${ly}" width="11" height="11" rx="2" fill="${c.fill}" stroke="${c.stroke}" stroke-width="1.5"/>` +
      `<text x="${lx + 15}" y="${ly + 9}" font-size="10.5" fill="#374151">${label}</text>`;
  }).join("");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="Segoe UI, Arial, sans-serif">
  <rect width="${W}" height="${H}" fill="#fafaf9"/>
  <text x="30" y="42" font-size="19" font-weight="700" fill="#111827">Карла Маркса, 31 — ${esc(lv.title.toLowerCase())}</text>
  <text x="30" y="62" font-size="11" fill="#a8a29e">${lv.mezz ? `полуэтаж между ${Math.floor(lv.id)} и ${Math.floor(lv.id) + 1} этажами` : "основной этаж"} · геометрия со схемы-стенда · пунктир = позиция приблизительная</text>
  <g transform="translate(${ox.toFixed(1)},${oy.toFixed(1)}) scale(${s.toFixed(4)})">${inner}</g>
  ${legend}
  <text x="${W - 30}" y="${H - 24}" text-anchor="end" font-size="10" fill="#a8a29e">данные: data/economics-building.json (v2, оцифровка стенда) · campus-bsu</text>
</svg>`;
}

const fileLabel = (id) => (Number.isInteger(id) ? String(id) : `${Math.floor(id)}.5`);
let n = 0;
for (const lv of data.levels) {
  writeFileSync(join(root, "assets", `floor-${fileLabel(lv.id)}.svg`), levelSvg(lv), "utf8");
  n++;
  console.log(`floor-${fileLabel(lv.id)}.svg (${lv.title}): ${lv.rooms.length} комнат`);
}
console.log(`OK: ${n} схем сгенерировано`);
