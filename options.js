const DEFAULT_SERVICES_OPT = [
  { name: "Google", url: "https://www.google.com/search?q={q}" },
  { name: "Gmaps", url: "https://www.google.com/maps/search/{q}" },
  { name: "Wikipedia", url: "https://it.wikipedia.org/wiki/Speciale:Search?search={q}" },
  { name: "YouTube", url: "https://www.youtube.com/results?search_query={q}" },
  { name: "Stack Overflow", url: "https://stackoverflow.com/search?q={q}" }
];

const servicesEl = document.getElementById("services");
const addBtn = document.getElementById("add");
const saveBtn = document.getElementById("save");
const resetBtn = document.getElementById("reset");

function render(services) {
  servicesEl.innerHTML = "";
  services.forEach((svc, idx) => {
    const wrap = document.createElement("div");
    wrap.className = "svc";
    wrap.innerHTML = `
      <div class="row">
        <label>Nome</label>
        <input type="text" value="${svc.name || ""}" data-field="name" data-idx="${idx}" placeholder="Es. Google" />
        <button data-action="remove" data-idx="${idx}">Rimuovi</button>
      </div>
      <div class="row">
        <label>URL</label>
        <input type="text" value="${svc.url || ""}" data-field="url" data-idx="${idx}" placeholder="https://…{q}" />
        <span></span>
      </div>
    `;
    servicesEl.appendChild(wrap);
  });
}

function collect() {
  const inputs = servicesEl.querySelectorAll("input[data-field]");
  const map = new Map();
  inputs.forEach((inp) => {
    const idx = parseInt(inp.dataset.idx, 10);
    const field = inp.dataset.field;
    if (!map.has(idx)) map.set(idx, {});
    map.get(idx)[field] = inp.value.trim();
  });
  return Array.from(map.values()).filter(s => s.name && s.url && s.url.includes("{q}"));
}

function load() {
  chrome.storage.sync.get({ services: DEFAULT_SERVICES_OPT }, (items) => {
    render(items.services || DEFAULT_SERVICES_OPT);
  });
}

servicesEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action=remove]");
  if (btn) {
    const idx = parseInt(btn.dataset.idx, 10);
    const data = collect();
    data.splice(idx, 1);
    render(data);
  }
});

addBtn.addEventListener("click", () => {
  const data = collect();
  data.push({ name: "Nuovo servizio", url: "https://example.com/search?q={q}" });
  render(data);
});

saveBtn.addEventListener("click", () => {
  const data = collect();
  if (!data.length) {
    alert("Aggiungi almeno un servizio valido (l'URL deve contenere {q}).");
    return;
  }
  chrome.storage.sync.set({ services: data }, () => {
    // La modifica attiverà storage.onChanged nel service worker,
    // che ricostruirà il menu.
    alert("Servizi salvati.");
  });
});

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.set({ services: DEFAULT_SERVICES_OPT }, () => {
    load();
    alert("Ripristinati i servizi predefiniti.");
  });
});

load();
