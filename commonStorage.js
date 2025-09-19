function saveIndexedDB(key, data) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("DarkModeDB", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("settings"); };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readwrite");
      tx.objectStore("settings").put(data, key);
      tx.oncomplete = () => resolve("indexedDB");
      tx.onerror = () => reject("indexedDB");
    };
    req.onerror = () => reject("indexedDB");
  });
}

function loadIndexedDB(keys) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("DarkModeDB", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("settings"); };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readonly");
      const store = tx.objectStore("settings");
      (async () => {
        for (const k of keys) {
          const getReq = store.get(k);
          const result = await new Promise((res) => {
            getReq.onsuccess = () => res(getReq.result);
            getReq.onerror = () => res(null);
          });
          if (result) return resolve({ source: "indexedDB", data: result });
        }
        resolve({ source: "indexedDB", data: null });
      })();
    };
    req.onerror = () => reject("indexedDB");
  });
}

function removeIndexedDB(keys) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("DarkModeDB", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("settings"); };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction("settings", "readwrite");
      const store = tx.objectStore("settings");
      keys.forEach((k) => store.delete(k));
      tx.oncomplete = () => resolve("indexedDB");
      tx.onerror = () => reject("indexedDB");
    };
    req.onerror = () => reject("indexedDB");
  });
}

async function saveToAll(key, payload) {
  let results = [];
  try {
    await chrome.storage.local.set({ [key]: payload });
    results.push("%LOCALAPPDATA%/Google/Chrome/User Data/Default/Local Extension Settings (chrome.storage.local)");
  } catch {}
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(key, JSON.stringify(payload));
      results.push("localStorage");
    }
  } catch {}
  try {
    await saveIndexedDB(key, payload);
    results.push("IndexedDB");
  } catch {}
  return results;
}

async function loadFromAll(keys) {
  try {
    const res = await chrome.storage.local.get(keys);
    for (const k of keys) if (res[k]) return { source: "chrome.storage.local", data: res[k] };
  } catch {}
  try {
    if (typeof localStorage !== "undefined") {
      for (const k of keys) {
        const raw = localStorage.getItem(k);
        if (raw) return { source: "localStorage", data: JSON.parse(raw) };
      }
    }
  } catch {}
  try {
    const res = await loadIndexedDB(keys);
    if (res.data) return res;
  } catch {}
  return { source: "none", data: null };
}

async function removeFromAll(keys) {
  let results = [];
  try { await chrome.storage.local.remove(keys); results.push("chrome.storage.local"); } catch {}
  try { if (typeof localStorage !== "undefined") { keys.forEach((k) => localStorage.removeItem(k)); results.push("localStorage"); } } catch {}
  try { await removeIndexedDB(keys); results.push("IndexedDB"); } catch {}
  return results;
}
