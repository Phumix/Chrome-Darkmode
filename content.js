const domainKey = `domain:${location.hostname}`;
const urlKey = `url:${location.origin}${location.pathname}${location.search || ""}`;

loadFromAll([urlKey, domainKey, location.hostname]).then((res) => {
  const data = res.data;
  if (data && data.enabled) {
    (function (enabled, level, mode) {
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
    })(data.enabled, data.level ?? 80, data.mode || "dark");
  }
});
