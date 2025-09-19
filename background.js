importScripts("commonStorage.js");

function makeKeys(urlString) {
  const url = new URL(urlString);
  const domainKey = `domain:${url.hostname}`;
  const cleanHref = url.origin + url.pathname + (url.search || "");
  const urlKey = `url:${cleanHref}`;
  return { domainKey, urlKey };
}

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url && tab.url.startsWith("http")) {
    const { domainKey, urlKey } = makeKeys(tab.url);
    const res = await loadFromAll([urlKey, domainKey, new URL(tab.url).hostname]);
    const data = res.data;
    if (data && data.enabled) {
      chrome.scripting.executeScript({
        target: { tabId },
        func: (enabled, level, mode) => {
          let style = document.getElementById("custom-dark-style");
          if (!style) {
            style = document.createElement("style");
            style.id = "custom-dark-style";
            document.head.appendChild(style);
          }
          if (!enabled) { style.textContent = ""; return; }
          if (mode === "invert") {
            style.textContent = `html { filter: invert(1) hue-rotate(180deg) brightness(${level}%); }`;
          } else if (mode === "dark") {
            let gray = Math.floor((100 - level) * 2.55);
            style.textContent = `html, body { background: rgb(${gray},${gray},${gray}) !important; color:#fff !important; }`;
          } else if (mode === "sepia") {
            style.textContent = `html { filter: sepia(1) brightness(${level}%); }`;
          } else if (mode === "grayscale") {
            style.textContent = `html { filter: grayscale(1) brightness(${level}%); }`;
          }
        },
        args: [data.enabled, data.level ?? 80, data.mode || "dark"]
      });
    }
  }
});
