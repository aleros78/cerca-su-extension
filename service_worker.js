const PARENT_ID = "cerca_su_parent";

// Servizi di default (modificabili da opzioni)
const DEFAULT_SERVICES = [
  { name: "Google", url: "https://www.google.com/search?q={q}" },
  { name: "Wikipedia", url: "https://it.wikipedia.org/wiki/Speciale:Search?search={q}" },
  { name: "YouTube", url: "https://www.youtube.com/results?search_query={q}" },
  { name: "Stack Overflow", url: "https://stackoverflow.com/search?q={q}" }
];

async function getServices() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ services: DEFAULT_SERVICES }, (items) => {
      resolve(items.services || DEFAULT_SERVICES);
    });
  });
}

function safeEncode(text) {
  try { return encodeURIComponent(text); } catch (e) { return text; }
}

async function rebuildMenus() {
  // Pulisce tutto per evitare duplicati
  chrome.contextMenus.removeAll(() => {
    // Crea il padre visibile solo quando c'è selezione
    chrome.contextMenus.create({
      id: PARENT_ID,
      title: "Cerca su…",
      contexts: ["selection"]
    });

    // Aggiunge voci figlie leggendo i servizi salvati
    getServices().then((services) => {
      services.forEach((svc, idx) => {
        chrome.contextMenus.create({
          id: `svc_${idx}`,
          parentId: PARENT_ID,
          title: svc.name,
          contexts: ["selection"]
        });
      });
    });
  });
}

chrome.runtime.onInstalled.addListener(async () => {
  await rebuildMenus();
});

// Ricostruisce menu quando cambiano i servizi dalle opzioni
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.services) {
    rebuildMenus();
  }
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!info.selectionText) return;

  const services = await getServices();
  const svcIdx = parseInt((info.menuItemId + "").replace("svc_", ""), 10);
  const svc = services[svcIdx];
  if (!svc) return;

  const encoded = safeEncode(info.selectionText);
  const targetUrl = svc.url.replace("{q}", encoded);

  chrome.tabs.create({ url: targetUrl, index: tab ? tab.index + 1 : undefined });
});
