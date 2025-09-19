document.addEventListener("DOMContentLoaded", async () => {
  const toggle = document.getElementById("toggleDark");
  const brightness = document.getElementById("brightness");
  const resetBtn = document.getElementById("resetBtn");
  const debugBtn = document.getElementById("debugBtn");
  const debugOutput = document.getElementById("debugOutput");

  const tab = (await chrome.tabs.query({ active: true, currentWindow: true }))[0];
  if (!tab.url) return;
  const url = new URL(tab.url);
  const domainKey = `domain:${url.hostname}`;
  const urlKey = `url:${url.origin}${url.pathname}${url.search || ""}`;

  const res = await loadFromAll([urlKey, domainKey, url.hostname]);
  if (res.data) {
    toggle.checked = res.data.enabled;
    brightness.value = res.data.level ?? 80;
    document.querySelector(`input[name=mode][value=${res.data.mode}]`)?.click();
    document.querySelector(`input[name=scope][value=${res.data.scope}]`)?.click();
  }

  async function save() {
    const mode = document.querySelector("input[name=mode]:checked").value;
    const scope = document.querySelector("input[name=scope]:checked").value;
    const enabled = toggle.checked;
    const level = brightness.value;

    const key = scope === "page" ? urlKey : domainKey;
    const payload = { enabled, level, mode, scope };
    await saveToAll(key, payload);

    chrome.scripting.executeScript({
      target: { tabId: tab.id },
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
      args: [enabled, level, mode]
    });
  }

  toggle.addEventListener("change", save);
  brightness.addEventListener("input", save);
  document.querySelectorAll("input[name=mode]").forEach(r => r.addEventListener("change", save));
  document.querySelectorAll("input[name=scope]").forEach(r => r.addEventListener("change", save));

  resetBtn.addEventListener("click", async () => {
    await removeFromAll([domainKey, urlKey, url.hostname]);
    chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => { const s=document.getElementById("custom-dark-style"); if(s) s.textContent=""; }
    });
  });

  debugBtn.addEventListener("click", async () => {
    const resSave = await saveToAll("debug:test", { time: new Date().toISOString() });
    const resLoad = await loadFromAll(["debug:test"]);
    debugOutput.style.display = "block";
    debugOutput.textContent =
      "Saved to:\n" + resSave.join("\n") +
      "\n\nLoaded from:\n" + JSON.stringify(resLoad, null, 2) +
      "\n\nChrome storage path:\n%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Local Extension Settings\\<extension-ID>";
  });
});