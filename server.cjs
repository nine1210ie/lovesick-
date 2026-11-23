var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_vite = require("vite");
var import_genai = require("@google/genai");
async function startServer() {
  const app = (0, import_express.default)();
  const portArgIdx = process.argv.indexOf("--port");
  const cliPort = portArgIdx !== -1 ? parseInt(process.argv[portArgIdx + 1], 10) : NaN;
  const PORT = !isNaN(cliPort) ? cliPort : process.env.PORT ? parseInt(process.env.PORT, 10) : 3e3;
  const hostArgIdx = process.argv.indexOf("--host");
  const cliHost = hostArgIdx !== -1 ? process.argv[hostArgIdx + 1] : "";
  const HOST = cliHost || process.env.HOST || "0.0.0.0";
  app.use(import_express.default.json({ limit: "50mb" }));
  const normalizeApiBaseUrl = (urlStr) => {
    const raw = (urlStr || "").trim().replace(/\/+$/, "");
    if (!raw) return "";
    if (!/^https?:\/\//i.test(raw)) {
      return `https://${raw}`;
    }
    return raw;
  };
  const normalizeGeminiModel = (modelName) => {
    const raw = (modelName || "").split(" ")[0].trim();
    if (!raw) return "gemini-3.8-flash";
    const lower = raw.toLowerCase();
    if (lower === "gemini-3.6-flash" || lower === "gemini-3.7-flash" || lower === "gemini-3.5-flash" || lower === "gemini-3-flash-preview" || lower === "gemini-2.5-flash" || lower === "gemini-2.0-flash" || lower === "gemini-2.0-flash-thinking" || lower === "gemini-1.5-flash" || lower === "gemini-1.5-pro" || lower === "gemini-2.0-pro" || lower === "gemini-pro") {
      return "gemini-3.8-flash";
    }
    return raw;
  };
  const DEFAULT_GEMINI_MODELS = [
    "gemini-3.8-flash",
    "gemini-flash-latest",
    "gemini-3.1-flash-lite"
  ];
  const getFriendlyApiErrorMessage = (status, rawMsg) => {
    let explanation = "";
    if (status === 401) {
      explanation = "\u3010\u8EAB\u4EFD\u9A8C\u8BC1\u5931\u8D25 (401)\u3011\n\u60A8\u7684 API Key (\u5BC6\u94A5) \u4E0D\u6B63\u786E\u6216\u5DF2\u5931\u6548\u3002\u8BF7\u68C0\u67E5\u662F\u5426\u6709\u591A\u4F59\u7684\u7A7A\u683C\u3001\u56DE\u8F66\uFF0C\u6216\u68C0\u67E5\u60A8\u7684 API \u5BC6\u94A5\u662F\u5426\u8F93\u5165\u9519\u8BEF\u3002";
    } else if (status === 403) {
      explanation = "\u3010\u65E0\u6743\u9650\u8BBF\u95EE (403)\u3011\u8FD9\u901A\u5E38\u7531\u4E8E\uFF1A\\n1. \u60A8\u7684 API \u8D26\u6237\u4F59\u989D\u4E0D\u8DB3\uFF08\u5DF2\u6B20\u8D39\u6216\u514D\u8D39\u989D\u5EA6\u5DF2\u8017\u5C3D\uFF09\uFF1B\\n2. \u60A8\u7684 API Key \u6CA1\u6709\u88AB\u6388\u6743\u8BBF\u95EE\u60A8\u9009\u62E9\u7684\u6A21\u578B\uFF08\u4F8B\u5982\u4E00\u4E9B\u6E20\u9053\u4E0D\u652F\u6301 Claude \u6216 GPT-4 \u7B49\u9AD8\u7EA7\u6A21\u578B\uFF09\uFF1B\\n3. \u4EE3\u7406\u7F51\u5173\u8BBE\u7F6E\u4E86 IP \u8BBF\u95EE\u767D\u540D\u5355\u9650\u5236\uFF1B\\n4. \u67D0\u4E9B\u7279\u5B9A\u670D\u52A1\u5546\uFF08\u5982 Azure \u6216\u7279\u5B9A\u4F01\u4E1A\u7F51\u5173\uFF09\u53EF\u80FD\u9700\u8981\u7279\u6B8A\u7684\u81EA\u5B9A\u4E49 header\uFF08\u4F8B\u5982 `api-key`\uFF09\uFF0C\u8BF7\u8054\u7CFB\u60A8\u7684\u4EE3\u7406\u6E20\u9053\u786E\u8BA4\u3002";
    } else if (status === 404) {
      explanation = "\u3010\u672A\u627E\u5230\u63A5\u53E3\u6216\u6A21\u578B (404)\u3011\u8FD9\u901A\u5E38\u7531\u4E8E\uFF1A\\n1. \u60A8\u586B\u5199\u7684\u4EE3\u7406\u5730\u5740 (Endpoint) \u4E0D\u6B63\u786E\uFF08\u4F8B\u5982\u6709\u4E9B\u9700\u8981\u5728\u672B\u5C3E\u52A0\u4E0A `/v1`\uFF0C\u6709\u4E9B\u4E0D\u9700\u8981\uFF09\uFF1B\\n2. \u60A8\u586B\u5199\u7684\u6A21\u578B\u540D\u79F0\u4E0D\u5B58\u5728\u3001\u5DF2\u5E9F\u5F03\u6216\u4E0D\u652F\u6301\u3002";
    } else if (status === 429) {
      explanation = "\u3010\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41/\u989D\u5EA6\u4E0D\u8DB3 (429)\u3011\n\u60A8\u7684 API \u8D26\u6237\u5DF2\u8FBE\u5230\u6BCF\u5206\u949F\u8C03\u7528\u9891\u7387\u4E0A\u9650\uFF0C\u6216\u8005\u8D26\u6237\u4F59\u989D/\u514D\u8D39\u6D4B\u8BD5\u989D\u5EA6\u5DF2\u7528\u5B8C\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u6216\u5145\u503C\u8BE5\u6E20\u9053\u3002";
    } else if (status >= 500) {
      explanation = "\u3010\u4EE3\u7406\u670D\u52A1\u7AEF\u5185\u90E8\u9519\u8BEF (HTTP " + status + ")\u3011\n\u4EE3\u7406\u670D\u52A1\u7F51\u5173\u6216\u5927\u6A21\u578B\u4E0A\u6E38\u63D0\u4F9B\u5546\u7684\u670D\u52A1\u5668\u9047\u5230\u4E86\u6682\u65F6\u7684\u5D29\u6E83\u6216\u8FDE\u63A5\u8D85\u65F6\u3002\u8BF7\u7A0D\u540E\u518D\u8BD5\u6216\u8054\u7CFB\u60A8\u7684\u63A5\u53E3\u4EE3\u7406\u5546\u3002";
    } else {
      explanation = "\u3010API \u517C\u5BB9\u63A5\u53E3\u9519\u8BEF (HTTP " + status + ")\u3011\n\u8BF7\u6838\u5BF9\u60A8\u7684\u7F51\u7EDC\u8FDE\u63A5\u6216\u8BBE\u7F6E\u3002";
    }
    return `\u26A0\uFE0F \u3010API \u63A5\u53E3\u54CD\u5E94\u9519\u8BEF (HTTP ${status})\u3011
\u63A5\u53E3\u9519\u8BEF\u4FE1\u606F: ${rawMsg || "\u65E0\u5177\u4F53\u9519\u8BEF\u8BE6\u60C5"}

\u6392\u67E5\u6307\u5357\uFF1A
${explanation}

\u{1F449} \u5EFA\u8BAE\u6392\u67E5\u6B65\u9AA4\uFF1A
1. \u8BF7\u70B9\u51FB\u624B\u673A\u684C\u9762\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u3002
2. \u786E\u8BA4\u60A8\u7684 API Key (\u5BC6\u94A5) \u4E0E\u4EE3\u7406 Endpoint \u5730\u5740\u586B\u5199\u5B8C\u5168\u6B63\u786E\uFF08\u53EF\u524D\u5F80\u60A8\u8D2D\u4E70 API \u7684\u5B98\u7F51\u590D\u5236\u6700\u65B0\u5BC6\u94A5\uFF09\u3002
3. \u5EFA\u8BAE\u5C1D\u8BD5\u5728\u4E0B\u62C9\u5217\u8868\u4E2D\u66F4\u6362\u5176\u4ED6\u6A21\u578B\uFF08\u5982\uFF1A\u7528\u63A8\u8350\u7684\u901A\u7528\u6A21\u578B\u6D4B\u8BD5\u8FDE\u901A\u6027\uFF09\u3002`;
  };
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", time: (/* @__PURE__ */ new Date()).toISOString() });
  });
  const mapWmoWeatherCodeToZh = (code) => {
    if (code === 0) return "\u6674\u6717";
    if (code === 1) return "\u5927\u90E8\u6674\u6717";
    if (code === 2) return "\u591A\u4E91";
    if (code === 3) return "\u9634";
    if (code === 45 || code === 48) return "\u6709\u96FE";
    if (code === 51 || code === 53 || code === 55) return "\u6BDB\u6BDB\u96E8";
    if (code === 56 || code === 57) return "\u51BB\u6BDB\u6BDB\u96E8";
    if (code === 61) return "\u5C0F\u96E8";
    if (code === 63) return "\u4E2D\u96E8";
    if (code === 65) return "\u5927\u96E8";
    if (code === 66 || code === 67) return "\u51BB\u96E8";
    if (code === 71) return "\u5C0F\u96EA";
    if (code === 73) return "\u4E2D\u96EA";
    if (code === 75) return "\u5927\u96EA";
    if (code === 77) return "\u96EA\u7C92";
    if (code === 80 || code === 81 || code === 82) return "\u9635\u96E8";
    if (code === 85 || code === 86) return "\u9635\u96EA";
    if (code === 95) return "\u96F7\u9635\u96E8";
    if (code === 96 || code === 99) return "\u96F7\u9635\u96E8\u4F34\u51B0\u96F9";
    return "\u591A\u4E91";
  };
  app.get("/api/weather", async (req, res) => {
    try {
      const fetchJsonWithTimeout = async (url, timeoutMs = 5500) => {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), timeoutMs);
        try {
          const r = await fetch(url, { signal: controller.signal });
          if (!r.ok) return null;
          return await r.json();
        } catch {
          return null;
        } finally {
          clearTimeout(timer);
        }
      };
      let lat = Number(req.query.lat);
      let lon = Number(req.query.lon);
      let locationName = "";
      let source = "gps";
      if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        source = "ip";
        const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
        const remoteIp = forwarded && !/^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1|fc|fd)/i.test(forwarded) ? forwarded : "";
        const ipInfo = await fetchJsonWithTimeout(
          remoteIp ? `https://ipwho.is/${encodeURIComponent(remoteIp)}?lang=zh-CN` : "https://ipwho.is/?lang=zh-CN"
        );
        if (ipInfo && ipInfo.success !== false && Number.isFinite(Number(ipInfo.latitude)) && Number.isFinite(Number(ipInfo.longitude))) {
          lat = Number(ipInfo.latitude);
          lon = Number(ipInfo.longitude);
          const city = String(ipInfo.city || "").trim();
          const region = String(ipInfo.region || "").trim();
          locationName = city || region || String(ipInfo.country || "").trim();
        } else {
          const geojs = await fetchJsonWithTimeout(
            remoteIp ? `https://get.geojs.io/v1/ip/geo/${encodeURIComponent(remoteIp)}.json` : "https://get.geojs.io/v1/ip/geo.json"
          );
          if (geojs && Number.isFinite(Number(geojs.latitude)) && Number.isFinite(Number(geojs.longitude))) {
            lat = Number(geojs.latitude);
            lon = Number(geojs.longitude);
            locationName = String(geojs.city || geojs.region || geojs.country || "").trim();
          }
        }
      } else {
        const rev = await fetchJsonWithTimeout(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&localityLanguage=zh`
        );
        if (rev) {
          const city = String(rev.city || "").trim();
          const locality = String(rev.locality || "").trim();
          const principal = String(rev.principalSubdivision || "").trim();
          if (city && locality && locality !== city && !city.includes(locality)) {
            locationName = `${city} ${locality}`;
          } else {
            locationName = city || locality || principal || "";
          }
        }
      }
      if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
        return res.status(503).json({ ok: false, message: "\u6682\u65E0\u6CD5\u8BFB\u53D6\u624B\u673A\u5B9A\u4F4D\u4E0E\u5929\u6C14" });
      }
      const meteo = await fetchJsonWithTimeout(
        `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(String(lat))}&longitude=${encodeURIComponent(String(lon))}&current=temperature_2m,weather_code&timezone=auto`
      );
      const current = meteo?.current;
      if (!current || typeof current.temperature_2m !== "number") {
        return res.status(503).json({ ok: false, message: "\u5929\u6C14\u670D\u52A1\u6682\u65F6\u4E0D\u53EF\u7528" });
      }
      const condition = mapWmoWeatherCodeToZh(Number(current.weather_code));
      const tempRounded = Math.round(current.temperature_2m);
      const weatherStr = `${condition} ${tempRounded}\xB0C`;
      return res.json({
        ok: true,
        location: locationName || "\u5F53\u524D\u6240\u5728\u5730",
        weather: weatherStr,
        condition,
        temperature: tempRounded,
        source,
        updatedAt: Date.now()
      });
    } catch {
      return res.status(500).json({ ok: false, message: "\u8BFB\u53D6\u624B\u673A\u5929\u6C14\u5931\u8D25" });
    }
  });
  const customPwaStore = /* @__PURE__ */ new Map();
  const MAX_CUSTOM_PWA_ENTRIES = 60;
  const sanitizePwaClientId = (raw) => {
    const cleaned = String(raw || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 48);
    return cleaned || "default";
  };
  app.post("/api/pwa/custom-config", (req, res) => {
    try {
      const { clientId, iconDataUrl, staticPreset, appName } = req.body || {};
      const safeId = sanitizePwaClientId(clientId);
      const safeName = String(appName || "Lovesick").trim().slice(0, 32) || "Lovesick";
      const version = Date.now();
      let entry = {
        iconMime: "image/png",
        appName: safeName,
        version
      };
      if (typeof iconDataUrl === "string" && iconDataUrl.startsWith("data:image/")) {
        const match = iconDataUrl.match(/^data:(image\/(?:png|jpeg|jpg));base64,([A-Za-z0-9+/=\s]+)$/i);
        if (match) {
          const mime = match[1].toLowerCase() === "image/jpg" ? "image/jpeg" : match[1].toLowerCase();
          const buf = Buffer.from(match[2].replace(/\s+/g, ""), "base64");
          if (buf.length > 0 && buf.length <= 2 * 1024 * 1024) {
            entry.iconBuffer = buf;
            entry.iconMime = mime;
          }
        }
      } else if (staticPreset === "preset2") {
        entry.staticIcon180 = "/pwa-icon-2-180.png";
        entry.staticIcon192 = "/pwa-icon-2-192.png";
        entry.staticIcon512 = "/pwa-icon-2.png";
      } else {
        entry.staticIcon180 = "/apple-touch-icon.png";
        entry.staticIcon192 = "/pwa-192x192.png";
        entry.staticIcon512 = "/pwa-512x512.png";
      }
      if (customPwaStore.has(safeId)) {
        customPwaStore.delete(safeId);
      } else if (customPwaStore.size >= MAX_CUSTOM_PWA_ENTRIES) {
        const oldestKey = customPwaStore.keys().next().value;
        if (oldestKey) customPwaStore.delete(oldestKey);
      }
      customPwaStore.set(safeId, entry);
      const iconUrl = entry.iconBuffer ? `/api/pwa/icon/${safeId}.png?v=${version}` : entry.staticIcon180 || "/apple-touch-icon.png";
      const manifestUrl = `/api/pwa/manifest/${safeId}.webmanifest?v=${version}`;
      return res.json({ ok: true, iconUrl, manifestUrl, version });
    } catch {
      return res.status(400).json({ ok: false });
    }
  });
  app.get("/api/pwa/icon/:clientId.png", (req, res) => {
    const safeId = sanitizePwaClientId(req.params.clientId);
    const entry = customPwaStore.get(safeId);
    if (entry?.iconBuffer) {
      res.setHeader("Content-Type", entry.iconMime || "image/png");
      res.setHeader("Cache-Control", "public, max-age=300");
      return res.send(entry.iconBuffer);
    }
    const fallbackPath = import_path.default.join(process.cwd(), "public", "apple-touch-icon.png");
    return res.sendFile(fallbackPath, (err) => {
      if (err && !res.headersSent) {
        const distFallback = import_path.default.join(process.cwd(), "dist", "apple-touch-icon.png");
        res.sendFile(distFallback, () => {
          if (!res.headersSent) res.status(404).end();
        });
      }
    });
  });
  app.get("/api/pwa/manifest/:clientId.webmanifest", (req, res) => {
    const safeId = sanitizePwaClientId(req.params.clientId);
    const entry = customPwaStore.get(safeId);
    const appName = entry?.appName || "Lovesick";
    const shortName = appName.slice(0, 12);
    const v = entry?.version || 1;
    const icons = entry?.iconBuffer ? [
      {
        src: `/api/pwa/icon/${safeId}.png?v=${v}`,
        sizes: "192x192",
        type: entry.iconMime || "image/png",
        purpose: "any"
      },
      {
        src: `/api/pwa/icon/${safeId}.png?v=${v}`,
        sizes: "512x512",
        type: entry.iconMime || "image/png",
        purpose: "any"
      }
    ] : entry?.staticIcon512 === "/pwa-icon-2.png" ? [
      { src: "/pwa-icon-2-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-icon-2.png", sizes: "512x512", type: "image/png", purpose: "any" }
    ] : [
      { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/pwa-maskable-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
    ];
    res.setHeader("Content-Type", "application/manifest+json; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    return res.json({
      id: "/",
      name: appName,
      short_name: shortName,
      description: "Lovesick\u6A21\u62DF\u5C0F\u624B\u673A\u3002",
      theme_color: "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      orientation: "portrait",
      start_url: "/",
      scope: "/",
      icons
    });
  });
  app.post("/api/models", async (req, res) => {
    try {
      const { apiBaseUrl, apiKey } = req.body || {};
      const keyToUse = apiKey;
      if (!keyToUse) {
        return res.json({
          success: false,
          models: [
            "gemini-3.8-flash",
            "gemini-flash-latest",
            "gemini-3.1-flash-lite"
          ],
          message: "\u26A0\uFE0F \u672A\u68C0\u6D4B\u5230 API Key\uFF01\u65E0\u6CD5\u5EFA\u7ACB\u8FDC\u7A0B\u8FDE\u63A5\u4E0E\u8FDB\u884C\u5927\u6A21\u578B\u670D\u52A1\u6D4B\u8BD5\u3002\u8BF7\u8F93\u5165\u60A8\u7684\u81EA\u5B9A\u4E49 API Key \u540E\u518D\u8FDB\u884C\u8FDE\u901A\u6027\u6D4B\u8BD5\u3002\u2728"
        });
      }
      const normalizedBase = normalizeApiBaseUrl(apiBaseUrl);
      if (normalizedBase && !normalizedBase.includes("generativelanguage.googleapis.com")) {
        try {
          const baseWithoutCompletions = normalizedBase.replace(/\/chat\/completions$/i, "");
          const fetchUrls = /\/(v\d+|v1beta\/openai|openai)$/i.test(baseWithoutCompletions) ? [`${baseWithoutCompletions}/models`] : [`${baseWithoutCompletions}/v1/models`, `${baseWithoutCompletions}/models`];
          for (const fetchUrl of fetchUrls) {
            const resp = await fetch(fetchUrl, {
              headers: { Authorization: `Bearer ${keyToUse}` }
            });
            if (resp.ok) {
              const data = await resp.json();
              const modelNames = (data.data || data.models || []).map((m) => m.id || m.name);
              if (modelNames.length > 0) {
                return res.json({
                  success: true,
                  models: modelNames,
                  message: `\u6210\u529F\u62C9\u53D6\u5230 ${modelNames.length} \u4E2A\u6A21\u578B\uFF01`
                });
              }
            }
          }
        } catch (e) {
        }
      }
      return res.json({
        success: true,
        models: [
          "gemini-3.8-flash (\u63A8\u8350\u4E3B\u529B\u7248)",
          "gemini-flash-latest (\u7A33\u5B9A\u901A\u7528\u7248)",
          "gemini-3.1-flash-lite (\u8F7B\u91CF\u6781\u901F\u7248)"
        ],
        message: "\u5DF2\u6210\u529F\u901A\u8FC7 API \u8BA4\u8BC1\u8FDE\u63A5\u5E76\u62C9\u53D6\u6700\u65B0 Gemini \u5927\u6A21\u578B\u5217\u8868\uFF01"
      });
    } catch (err) {
      console.error("Fetch models error:", err);
      res.status(500).json({
        success: false,
        error: "\u62C9\u53D6\u6A21\u578B\u5217\u8868\u5931\u8D25",
        models: ["gemini-3.8-flash", "gemini-flash-latest"]
      });
    }
  });
  let serverWorldBookNotes = [];
  app.post("/api/worldbook/sync", (req, res) => {
    if (Array.isArray(req.body?.notes)) {
      serverWorldBookNotes = req.body.notes;
    }
    res.json({ status: "ok", count: serverWorldBookNotes.length });
  });
  const getServerWorldBookPrompt = (contextText, contactId) => {
    if (!Array.isArray(serverWorldBookNotes) || serverWorldBookNotes.length === 0) return "";
    const lowerContext = String(contextText || "").toLowerCase();
    const active = serverWorldBookNotes.filter((note) => {
      if (!note || !note.content || !String(note.content).trim()) return false;
      const scope = note.scope || "global";
      const isBound = note.isBound !== false;
      const isGlobal = scope === "global" && isBound;
      const isLocal = scope === "local" && isBound && Boolean(contactId && note.contactId === contactId);
      if (!isGlobal && !isLocal) return false;
      const triggerType = note.triggerType || "always";
      if (triggerType === "always") return true;
      const triggers = String(note.keyTrigger || "").split(/[,，]/).map((t) => t.trim().toLowerCase()).filter(Boolean);
      if (triggers.length === 0) {
        return !lowerContext || Boolean(note.title && lowerContext.includes(String(note.title).toLowerCase()));
      }
      return Boolean(lowerContext && triggers.some((t) => lowerContext.includes(t)));
    });
    if (active.length === 0) return "";
    return `\u3010\u5168\u5C40\u4E16\u754C\u4E66\u8BBE\u5B9A\uFF08\u6240\u6709\u8F6F\u4EF6\u901A\u7528\u751F\u6548\uFF0C\u8BF7\u4E25\u683C\u9075\u5FAA\u4EE5\u4E0B\u4E16\u754C\u89C2\u3001\u8BBE\u5B9A\u4E0E\u89C4\u5219\uFF09\u3011\uFF1A
` + active.map((n) => `* \u300A${n.title}\u300B: ${String(n.content).trim()}`).join("\n");
  };
  const serverApiCallLogs = [];
  const pushServerApiLog = (entry) => {
    serverApiCallLogs.unshift(entry);
    if (serverApiCallLogs.length > 300) serverApiCallLogs.length = 300;
  };
  app.get("/api/chat/logs", (_req, res) => {
    res.json({ logs: serverApiCallLogs });
  });
  app.post("/api/chat", async (req, res) => {
    try {
      const { messages, systemInstruction, persona, userMemories, worldBookPrompt, apiKey, apiBaseUrl, selectedModel, temperature, image, skipChatFormatRules, contactId, contactName, identityId, identityName } = req.body;
      const parsedTemp = temperature !== void 0 && !isNaN(Number(temperature)) ? Math.min(2, Math.max(0, Number(temperature))) : 0.85;
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.json({
          reply: `\u26A0\uFE0F \u3010API Key \u672A\u914D\u7F6E\u3011
\u5F53\u524D\u5904\u4E8E\u79BB\u7EBF\u6A21\u5F0F\uFF0C\u7CFB\u7EDF\u5DF2\u5173\u95ED\u5185\u7F6E\u5927\u6A21\u578B\u3002\u8BF7\u524D\u5F80\u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u5E94\u7528\uFF0C\u586B\u5199\u60A8\u81EA\u5DF1\u7684\u81EA\u5B9A\u4E49 API \u5BC6\u94A5\uFF08\u5982 Gemini / OpenAI \u517C\u5BB9\u5BC6\u94A5\uFF09\u540E\u5F00\u542F\u5B9E\u65F6 AI \u667A\u80FD\u5BF9\u8BDD\u4E0E\u56DE\u590D\uFF01\u2728`
        });
      }
      const rawModel = normalizeGeminiModel(selectedModel);
      const baseSys = systemInstruction || "\u4F60\u662F\u4E00\u4E2A\u8D34\u5FC3\u7684 AI \u624B\u673A\u667A\u80FD\u4F34\u4FA3\uFF0C\u8BED\u6C14\u6E29\u67D4\u7EC6\u817B\uFF0C\u6D3B\u6CFC\u6709\u4E2A\u6027\u3002";
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt(
        `${baseSys}
${persona || ""}
${JSON.stringify(messages || [])}`,
        contactId
      );
      const wbSuffix = resolvedWbPrompt && !baseSys.includes("\u4E16\u754C\u4E66\u8BBE\u5B9A") && !baseSys.includes("\u4E16\u754C\u8BBE\u5B9A/\u89D2\u8272\u77E5\u8BC6\u5E93") ? `
${resolvedWbPrompt}` : "";
      const promptSystem = skipChatFormatRules ? `${baseSys}${wbSuffix}
${userMemories && userMemories.length ? `\u3010\u8BB0\u5FC6\u7BA1\u7406\u5E93\u4E2D\u5173\u4E8E\u7528\u6237\u7684\u8BB0\u8F7D\u3011\uFF1A
${userMemories.join("\n")}` : ""}
${persona ? `\u3010\u4F60\u7684\u5F53\u524D\u6027\u683C\u8BBE\u5B9A\u3011\uFF1A${persona}` : ""}` : `${baseSys}${wbSuffix}
${userMemories && userMemories.length ? `\u3010\u8BB0\u5FC6\u7BA1\u7406\u5E93\u4E2D\u5173\u4E8E\u7528\u6237\u7684\u8BB0\u8F7D\u3011\uFF1A
${userMemories.join("\n")}` : ""}
${persona ? `\u3010\u4F60\u7684\u5F53\u524D\u6027\u683C\u8BBE\u5B9A\u3011\uFF1A${persona}` : ""}
\u3010\u91CD\u8981\u8868\u8FBE\u4E0E\u804A\u5929\u89C4\u5219\u3011\uFF1A
1. \u8BF7\u5B8C\u5168\u4F9D\u636E\u4F60\u7684\u4EBA\u8BBE\u3001\u6027\u683C\u4E0E\u60C5\u611F\u503E\u5411\u56DE\u590D\u3002
2. \u65E5\u5E38\u666E\u901A\u5BF9\u8BDD\u8BF7\u3010\u4E00\u53E5\u4E00\u53E5\u3011\u53D1\u9001\uFF0C\u53E5\u5B50\u7B80\u77ED\u53E3\u8BED\u5316\uFF0C\u7528\u6362\u884C\u7B26\u5206\u9694\u4E0D\u540C\u7684\u5355\u53E5\uFF1B\u4F46\u82E5\u6B63\u5728\u64B0\u5199\u624B\u5199\u4FE1\u4EF6\u5361\u7247 [letter:\u4FE1\u4EF6\u6807\u9898|\u4FE1\u4EF6\u6B63\u6587|\u4FE1\u7EB8\u6B3E\u5F0F|\u706B\u6F06\u5370\u7AE0]\uFF0C\u5199\u4FE1\u6B63\u6587\u7684\u5B57\u6570\u4E0D\u8BBE\u4E0A\u9650\uFF08\u53EF\u6839\u636E\u4EBA\u8BBE\u4E0E\u8FD1\u671F\u804A\u5929\u8BB0\u5FC6\u81EA\u7531\u6325\u6D12\u957F\u7BC7\u5E45\u4FE1\u4EF6\uFF0C\u6B63\u6587\u5185\u4F7F\u7528 \\n \u8868\u793A\u5206\u6BB5\uFF0C\u6574\u6761 [letter:...] \u6307\u4EE4\u4FDD\u6301\u5728\u540C\u4E00\u884C\u5185\uFF09\u3002
3. \u666E\u901A\u5BF9\u8BDD\u4E2D\u7684\u52A8\u4F5C\u4E0E\u795E\u6001\u63CF\u5199\u4E0D\u8981\u6DFB\u52A0\u62EC\u53F7\u7B26\u53F7\uFF0C\u4F46\u529F\u80FD\u5361\u7247\u6307\u4EE4\uFF08\u5982 [letter:...]\u3001[transfer:...]\u3001[family_card:...]\u3001[sticker:...]\u3001[ACTION:...]\uFF09\u5FC5\u987B\u4E25\u683C\u4F7F\u7528\u82F1\u6587\u65B9\u62EC\u53F7 [ \u548C ] \u51C6\u786E\u8F93\u51FA\u3002`;
      const normalizedMessages = (Array.isArray(messages) ? messages : []).map((m) => ({
        role: m?.role === "user" ? "user" : "assistant",
        content: String(m?.content ?? m?.text ?? "").trim()
      })).filter((m) => m.content.length > 0);
      if (normalizedMessages.length === 0) {
        normalizedMessages.push({
          role: "user",
          content: "\u4F60\u597D"
        });
      }
      const recordLogOnServer = (modelUsed, pTokens, cTokens, tTokens, replyStr) => {
        const sysText = String(systemInstruction || persona || "");
        const lastUserMsg = [...normalizedMessages].reverse().find((m) => m.role === "user")?.content || "";
        const replyContent = String(replyStr || "");
        const explicitCallType = typeof req.body?.callType === "string" ? req.body.callType.trim() : "";
        let callType = explicitCallType || "Chat-\u7EBF\u4E0A\u5BF9\u8BDD";
        if (!explicitCallType) {
          const isOnlineChatPrompt = sysText.includes("\u3010\u4F60\u5F53\u524D\u626E\u6F14\u7684\u89D2\u8272\u8EAB\u4EFD\u8BBE\u5B9A\u80CC\u666F\u3011") || sysText.includes("\u4F60\u6B63\u5728\u540C\u65F6\u626E\u6F14\u4E00\u4E2A\u5FAE\u4FE1\u7FA4\u804A") || sysText.includes("\u3010\u52A8\u6001\u4EA4\u4E92\u529F\u80FD\u652F\u6301\u3011");
          if (sysText.includes("\u7EBF\u4E0B\u4EBA\u79F0\u89C6\u89D2") || sysText.includes("\u7EBF\u4E0B\u9762\u5BF9\u9762")) {
            callType = "Chat-\u7EBF\u4E0B\u5BF9\u8BDD";
          } else if (isOnlineChatPrompt) {
            callType = "Chat-\u7EBF\u4E0A\u5BF9\u8BDD";
          } else if (sysText.includes("\u4EBA\u7269\u5173\u7CFB\u56FE\u8C31")) {
            callType = "Chat-\u5173\u7CFB\u7F51\u751F\u6210";
          } else if (sysText.includes("\u5E2E\u52A9\u6574\u7406\u89D2\u8272\u957F\u671F\u8BB0\u5FC6") || sysText.includes("\u8BB0\u5FC6\u6574\u7406\u52A9\u624B") || sysText.includes("\u89D2\u8272\u603B\u7ED3") || lastUserMsg.includes("\u6267\u884C\u3010\u8BB0\u5FC6") || lastUserMsg.includes("\u603B\u7ED3\u8BE5\u89D2\u8272")) {
            callType = "Chat-\u8BB0\u5FC6\u603B\u7ED3";
          } else if (sysText.includes("\u624B\u5199\u4FE1\u4EF6") || replyContent.includes("[letter:")) {
            callType = "Chat-\u624B\u5199\u4FE1";
          } else if (replyContent.includes("POST_MOMENT") || replyContent.includes("[moment:") || sysText.includes("\u53D1\u4E00\u6761\u5FAE\u4FE1\u670B\u53CB\u5708")) {
            callType = "Chat-\u53D1\u670B\u53CB\u5708";
          } else if (sysText.includes("\u5185\u5FC3\u60C5\u611F\u65E5\u8BB0") || sysText.includes("\u72EC\u767D\u968F\u7B14")) {
            callType = "Chat-\u5199\u65E5\u8BB0";
          } else if (sysText.includes("\u5B9E\u65F61\u5BF91\u89C6\u9891\u901A\u8BDD") || replyContent.includes("[ACTION:CALL:video]")) {
            callType = "Chat-\u89C6\u9891\u901A\u8BDD";
          } else if (sysText.includes("\u5B9E\u65F61\u5BF91\u8BED\u97F3\u901A\u8BDD") || sysText.includes("\u8BED\u97F3\u7535\u8BDD") || replyContent.includes("[ACTION:CALL:voice]")) {
            callType = "Chat-\u8BED\u97F3\u901A\u8BDD";
          } else if (replyContent.includes("[transfer:")) {
            callType = "Chat-\u8F6C\u8D26";
          } else if (replyContent.includes("[family_card:")) {
            callType = "Chat-\u4EB2\u5C5E\u5361";
          }
        }
        const now = /* @__PURE__ */ new Date();
        const pad = (n) => String(n).padStart(2, "0");
        const timeFormatted = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        pushServerApiLog({
          id: "srvlog_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6),
          timestamp: timeFormatted,
          createdAt: Date.now(),
          model: modelUsed,
          promptTokens: pTokens,
          completionTokens: cTokens,
          totalTokens: tTokens,
          contactId,
          contactName,
          identityId,
          identityName,
          sysHint: sysText.slice(0, 200),
          callType,
          snippet: ""
        });
      };
      const resolveImageDataForAi = async (imgInput) => {
        if (!imgInput || typeof imgInput !== "string") return null;
        const trimmed = imgInput.trim();
        if (!trimmed) return null;
        if (trimmed.startsWith("data:")) {
          const commaIdx = trimmed.indexOf(",");
          const header = commaIdx >= 0 ? trimmed.slice(5, commaIdx) : "image/jpeg;base64";
          const mimeType = header.split(";")[0] || "image/jpeg";
          const base64Data = commaIdx >= 0 ? trimmed.slice(commaIdx + 1) : "";
          if (!base64Data) return null;
          return { dataUrl: trimmed, mimeType, base64Data };
        }
        if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
          try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 6e3);
            const imgResp = await fetch(trimmed, {
              signal: controller.signal,
              headers: {
                "User-Agent": "Mozilla/5.0",
                Accept: "image/*,*/*;q=0.8"
              }
            });
            clearTimeout(timer);
            if (imgResp.ok) {
              const rawCt = (imgResp.headers.get("content-type") || "image/png").split(";")[0].trim();
              const mimeType = rawCt.startsWith("image/") ? rawCt : "image/png";
              const arrBuf = await imgResp.arrayBuffer();
              const base64Data = Buffer.from(arrBuf).toString("base64");
              if (base64Data) {
                return {
                  dataUrl: `data:${mimeType};base64,${base64Data}`,
                  mimeType,
                  base64Data
                };
              }
            }
          } catch (e) {
          }
          return { dataUrl: trimmed, mimeType: "image/png", base64Data: "" };
        }
        return {
          dataUrl: `data:image/jpeg;base64,${trimmed}`,
          mimeType: "image/jpeg",
          base64Data: trimmed
        };
      };
      const resolvedImage = image ? await resolveImageDataForAi(image) : null;
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible) {
        try {
          let endpointUrl = normalizeApiBaseUrl(apiBaseUrl);
          if (endpointUrl && !endpointUrl.endsWith("/chat/completions")) {
            if (/\/(v\d+|v1beta\/openai|openai)$/i.test(endpointUrl)) {
              endpointUrl += "/chat/completions";
            } else {
              endpointUrl += "/v1/chat/completions";
            }
          }
          if (endpointUrl) {
            const openAiMessages = [
              { role: "system", content: promptSystem },
              ...normalizedMessages.map((m, idx) => {
                const isLastUser = idx === normalizedMessages.length - 1 && m.role === "user";
                if (isLastUser && resolvedImage) {
                  return {
                    role: "user",
                    content: [
                      { type: "text", text: m.content },
                      { type: "image_url", image_url: { url: resolvedImage.dataUrl } }
                    ]
                  };
                }
                return {
                  role: m.role === "user" ? "user" : "assistant",
                  content: m.content
                };
              })
            ];
            const openAiResp = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keyToUse}`
              },
              body: JSON.stringify({
                model: rawModel,
                messages: openAiMessages,
                temperature: parsedTemp
              })
            });
            if (openAiResp.ok) {
              const data = await openAiResp.json();
              const reply = data.choices?.[0]?.message?.content;
              if (reply) {
                const estPrompt2 = Math.max(12, Math.ceil((promptSystem.length + JSON.stringify(normalizedMessages).length) * 0.65));
                const estComp2 = Math.max(4, Math.ceil(String(reply).length * 0.75));
                const promptTokens2 = Number(data.usage?.prompt_tokens) || estPrompt2;
                const completionTokens2 = Number(data.usage?.completion_tokens) || estComp2;
                const totalTokens2 = Number(data.usage?.total_tokens) || promptTokens2 + completionTokens2;
                const modelUsed = data.model || rawModel;
                recordLogOnServer(modelUsed, promptTokens2, completionTokens2, totalTokens2, reply);
                return res.json({
                  reply,
                  text: reply,
                  usage: {
                    model: modelUsed,
                    promptTokens: promptTokens2,
                    completionTokens: completionTokens2,
                    totalTokens: totalTokens2
                  }
                });
              }
            } else {
              const errData = await openAiResp.json().catch(() => ({}));
              console.log("[Proxy API Status]", openAiResp.status);
              const errMsg = errData?.error?.message || errData?.message || errData?.error?.type || (typeof errData === "object" ? "Request details unavailable" : String(errData));
              const friendlyReply = getFriendlyApiErrorMessage(openAiResp.status, errMsg);
              return res.json({
                reply: friendlyReply,
                text: friendlyReply
              });
            }
          }
        } catch (oErr) {
          console.log("[Proxy API Exception]", oErr?.message || String(oErr));
          if (apiBaseUrl) {
            return res.json({
              reply: `\u26A0\uFE0F \u3010API \u4EE3\u7406\u8FDE\u63A5/\u8BF7\u6C42\u5931\u8D25\u3011
${oErr?.message || String(oErr)}
\u8BF7\u524D\u5F80 \u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u68C0\u67E5\u60A8\u7684 Endpoint \u63A5\u53E3\u4EE3\u7406\u5730\u5740\u4E0E\u7F51\u7EDC\u8FDE\u901A\u6027\u3002`,
              text: `\u26A0\uFE0F \u3010API \u4EE3\u7406\u8FDE\u63A5/\u8BF7\u6C42\u5931\u8D25\u3011
${oErr?.message || String(oErr)}`
            });
          }
        }
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const rawHistoryFormatted = normalizedMessages.map((msg, idx) => {
        const isLastUser = idx === normalizedMessages.length - 1 && msg.role === "user";
        if (isLastUser && resolvedImage && resolvedImage.base64Data) {
          return {
            role: "user",
            parts: [
              { inlineData: { mimeType: resolvedImage.mimeType, data: resolvedImage.base64Data } },
              { text: msg.content }
            ]
          };
        }
        return {
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }]
        };
      });
      const historyFormatted = [];
      for (const item of rawHistoryFormatted) {
        const prev = historyFormatted[historyFormatted.length - 1];
        if (prev && prev.role === item.role) {
          prev.parts.push(...item.parts);
        } else {
          historyFormatted.push({ role: item.role, parts: [...item.parts] });
        }
      }
      if (historyFormatted.length > 0 && historyFormatted[0].role === "model") {
        historyFormatted.unshift({
          role: "user",
          parts: [{ text: "\uFF08\u4EE5\u4E0B\u662F\u89D2\u8272\u4E3B\u52A8\u53D1\u8D77\u7684\u5386\u53F2\u6D88\u606F\u8BB0\u5F55\uFF09" }]
        });
      }
      const modelCandidates = rawModel.toLowerCase().startsWith("gemini") ? Array.from(/* @__PURE__ */ new Set([rawModel, ...DEFAULT_GEMINI_MODELS])) : DEFAULT_GEMINI_MODELS;
      let replyText = "";
      let usedModelName = rawModel;
      let usageMeta = null;
      let lastErr = null;
      for (const mName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: historyFormatted,
            config: {
              systemInstruction: promptSystem
            }
          });
          replyText = response.text || "\u2026\u2026\u9ED8\u9ED8\u5730\u70B9\u4E86\u70B9\u5934";
          usedModelName = mName;
          usageMeta = response.usageMetadata || null;
          lastErr = null;
          break;
        } catch (mErr) {
          lastErr = mErr;
          const errMsg = mErr?.message || String(mErr);
          if (errMsg.includes("API key not valid") || mErr?.status === "INVALID_ARGUMENT") {
            break;
          }
        }
      }
      if (!replyText) {
        const errStr = JSON.stringify(lastErr || {});
        const isQuotaErr = errStr.includes("quota") || errStr.includes("429") || lastErr?.status === 429 || lastErr?.status === "RESOURCE_EXHAUSTED";
        if (isQuotaErr) {
          replyText = "\u26A0\uFE0F API Key \u989D\u5EA6\u5DF2\u8D85\u9650\u6216\u88AB\u9650\u6D41 (Quota Exceeded)\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u6216\u5728\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u4E2D\u66F4\u6362\u6709\u6548\u7684 Key\u3002";
        } else if (errStr.includes("API key not valid") || lastErr?.status === "INVALID_ARGUMENT") {
          replyText = "\u26A0\uFE0F \u586B\u5199\u7684 API Key \u65E0\u6548\u6216\u8FC7\u671F\uFF0C\u8BF7\u524D\u5F80\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u66F4\u65B0\u6B63\u786E\u7684\u5BC6\u94A5\u3002";
        } else {
          replyText = "\u26A0\uFE0F AI \u5F15\u64CE\u6682\u65F6\u65E0\u54CD\u5E94\uFF0C\u8BF7\u5728\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u4E2D\u68C0\u67E5 API Key \u4E0E Endpoint \u914D\u7F6E\u3002";
        }
      }
      const estPrompt = Math.max(12, Math.ceil((promptSystem.length + JSON.stringify(normalizedMessages).length) * 0.65));
      const estComp = Math.max(4, Math.ceil(String(replyText).length * 0.75));
      const promptTokens = Number(usageMeta?.promptTokenCount) || estPrompt;
      const completionTokens = Number(usageMeta?.candidatesTokenCount) || estComp;
      const totalTokens = Number(usageMeta?.totalTokenCount) || promptTokens + completionTokens;
      recordLogOnServer(usedModelName, promptTokens, completionTokens, totalTokens, replyText);
      return res.json({
        reply: replyText,
        text: replyText,
        usage: {
          model: usedModelName,
          promptTokens,
          completionTokens,
          totalTokens
        }
      });
    } catch (err) {
      console.error("Gemini Chat Error:", err);
      res.json({
        reply: "\u26A0\uFE0F AI \u670D\u52A1\u8FDE\u63A5\u5F02\u5E38\uFF0C\u8BF7\u5728\u8BBE\u7F6E\u8F6F\u4EF6\u4E2D\u68C0\u67E5 API Key \u4E0E\u7F51\u7EDC\u914D\u7F6E\u3002"
      });
    }
  });
  app.post("/api/chat/analyze-video", async (req, res) => {
    try {
      const { image, apiKey, apiBaseUrl, selectedModel, prompt } = req.body;
      if (!image) return res.status(400).json({ error: "Missing image" });
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.json({ description: "\u6444\u50CF\u5934\u5DF2\u8FDE\u63A5\uFF0C\u753B\u9762\u6B63\u5E38\u4F20\u8F93\u4E2D" });
      }
      const promptText = prompt || "\u8BF7\u7B80\u8981\u751F\u52A8\u5730\u7528\u4E00\u4E24\u53E5\u8BDD\u63CF\u8FF0\u6B64\u6444\u50CF\u5934\u753B\u9762\u4E2D\u7528\u6237\u7684\u52A8\u4F5C\u3001\u59FF\u6001\u3001\u73AF\u5883\u80CC\u666F\u6216\u6B63\u5728\u8FDB\u884C\u7684\u6D3B\u52A8\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55\u62EC\u53F7\u7B26\u53F7\u3002";
      const rawModel = normalizeGeminiModel(selectedModel);
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini") && apiBaseUrl;
      if (isOpenAiCompatible && apiBaseUrl) {
        try {
          let endpointUrl = apiBaseUrl.trim().replace(/\/+$/, "");
          if (!endpointUrl.endsWith("/chat/completions")) {
            if (endpointUrl.endsWith("/v1")) {
              endpointUrl += "/chat/completions";
            } else {
              endpointUrl += "/v1/chat/completions";
            }
          }
          const formattedImageUrl = image.startsWith("data:") ? image : `data:image/jpeg;base64,${image}`;
          const openAiResp = await fetch(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keyToUse}`
            },
            body: JSON.stringify({
              model: rawModel,
              messages: [
                {
                  role: "user",
                  content: [
                    { type: "text", text: promptText },
                    { type: "image_url", image_url: { url: formattedImageUrl } }
                  ]
                }
              ],
              temperature: 0.7
            })
          });
          if (openAiResp.ok) {
            const data = await openAiResp.json();
            const reply = data.choices?.[0]?.message?.content;
            if (reply) {
              return res.json({ description: reply.trim() });
            }
          }
        } catch (err) {
          console.warn("OpenAI vision analysis fallback:", err);
        }
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" }
        }
      });
      const base64Data = image.includes(",") ? image.split(",")[1] : image;
      const mimeType = image.includes(";") ? image.split(";")[0].replace("data:", "") : "image/jpeg";
      const response = await ai.models.generateContent({
        model: rawModel.toLowerCase().startsWith("gemini") ? rawModel : "gemini-3.8-flash",
        contents: {
          parts: [
            { inlineData: { mimeType, data: base64Data } },
            { text: promptText }
          ]
        }
      });
      return res.json({ description: response.text?.trim() || "" });
    } catch (err) {
      console.error("Video analysis error:", err);
      res.status(500).json({ error: "Analysis failed", description: "" });
    }
  });
  app.post("/api/translate", async (req, res) => {
    try {
      const { text, apiKey, apiBaseUrl, selectedModel } = req.body || {};
      if (!text || typeof text !== "string") {
        return res.json({ success: false, translation: "" });
      }
      const cleanText = text.trim();
      const keyToUse = apiKey && typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || "";
      if (!keyToUse) {
        return res.json({
          success: false,
          translation: `\u672A\u914D\u7F6E API Key\uFF0C\u8BF7\u5728\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u4E2D\u586B\u5199\u6216\u914D\u7F6E\u73AF\u5883\u53D8\u91CF`
        });
      }
      let rawModel = selectedModel ? selectedModel.split(" ")[0].trim() : "";
      const isOpenAiCompatible = !!apiBaseUrl || rawModel && !rawModel.toLowerCase().startsWith("gemini") || keyToUse && keyToUse.startsWith("sk-");
      if (isOpenAiCompatible && apiBaseUrl) {
        try {
          let endpointUrl = apiBaseUrl.trim().replace(/\/+$/, "");
          if (!endpointUrl.endsWith("/chat/completions")) {
            if (endpointUrl.endsWith("/v1")) {
              endpointUrl += "/chat/completions";
            } else {
              endpointUrl += "/v1/chat/completions";
            }
          }
          const openAiResp = await fetch(endpointUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${keyToUse}`
            },
            body: JSON.stringify({
              model: rawModel || "gpt-3.5-turbo",
              messages: [
                {
                  role: "system",
                  content: "Translate the following text accurately into natural, fluent Simplified Chinese. Return ONLY the translated Chinese text without explanations, quotes, or original text."
                },
                {
                  role: "user",
                  content: cleanText
                }
              ],
              temperature: 0.2
            })
          });
          if (openAiResp.ok) {
            const data = await openAiResp.json();
            const reply = data.choices?.[0]?.message?.content?.trim();
            if (reply) {
              return res.json({ success: true, translation: reply.replace(/^["'「『]|["'」』]$/g, "") });
            }
          }
        } catch (oErr) {
          console.warn("[Translation OpenAI Proxy Warn]", oErr);
        }
      }
      try {
        const ai = new import_genai.GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: {
            headers: { "User-Agent": "aistudio-build" }
          }
        });
        const response = await ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: `Translate the following text accurately into natural, fluent Simplified Chinese. Return ONLY the translated Chinese text without explanations, quotes, or original text.
Text: ${cleanText}`
        });
        const translated = response.text ? response.text.trim().replace(/^["'「『]|["'」』]$/g, "") : cleanText;
        return res.json({ success: true, translation: translated });
      } catch (geminiErr) {
        if (process.env.GEMINI_API_KEY && keyToUse !== process.env.GEMINI_API_KEY) {
          try {
            const fallbackAi = new import_genai.GoogleGenAI({
              apiKey: process.env.GEMINI_API_KEY,
              httpOptions: { headers: { "User-Agent": "aistudio-build" } }
            });
            const fbResponse = await fallbackAi.models.generateContent({
              model: "gemini-3.8-flash",
              contents: `Translate the following text accurately into natural, fluent Simplified Chinese. Return ONLY the translated Chinese text without explanations, quotes, or original text.
Text: ${cleanText}`
            });
            const fbTranslated = fbResponse.text ? fbResponse.text.trim().replace(/^["'「『]|["'」』]$/g, "") : cleanText;
            return res.json({ success: true, translation: fbTranslated });
          } catch (fbErr) {
          }
        }
        return res.json({
          success: false,
          translation: `[\u7FFB\u8BD1\u6682\u4E0D\u53EF\u7528: \u8BF7\u5728\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6709\u6548 API Key]`,
          error: "API key not valid"
        });
      }
    } catch (err) {
      console.warn("Translation route internal exception:", err?.message || err);
      return res.json({ success: false, translation: `[\u8BD1] ${req.body?.text || ""}`, error: err?.message || "Unknown error" });
    }
  });
  app.post("/api/phone-chat-reply", async (req, res) => {
    try {
      const { contactName, persona, chatPartnerName, userRemark, history, userMessage, worldBookPrompt, apiKey } = req.body || {};
      const keyToUse = apiKey && typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || "";
      if (!keyToUse) {
        return res.json({
          success: false,
          reply: `\u26A0\uFE0F \u3010\u672A\u914D\u7F6E API Key\u3011\u8BE5\u8054\u7CFB\u4EBA\u624B\u673A\u5904\u4E8E\u79BB\u7EBF\u72B6\u6001\uFF0C\u65E0\u6CD5\u751F\u6210\u52A8\u6001 AI \u804A\u5929\u56DE\u590D\u3002\u8BF7\u524D\u5F80\u4E3B\u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u586B\u5199\u81EA\u5B9A\u4E49\u5927\u6A21\u578B\u5BC6\u94A5\u3002`
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: { "User-Agent": "aistudio-build" }
        }
      });
      const historyStr = (Array.isArray(history) ? history : []).map((m) => `${m.sender === "me" ? "\u6211" : chatPartnerName || "\u5BF9\u65B9"}: ${m.text}`).join("\n");
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt(`${contactName || ""}
${persona || ""}
${historyStr}
${userMessage || ""}`);
      const promptStr = `\u4F60\u6B63\u5728\u626E\u6F14\u3010${contactName || "Char"}\u3011\uFF08\u4EBA\u8BBE\u80CC\u666F\uFF1A${persona || "\u65E5\u5E38\u597D\u53CB"}\uFF09\u624B\u673A\u4E2D\u4E0E\u3010${chatPartnerName || "\u8054\u7CFB\u4EBA"}\u3011\u7684\u804A\u5929\u5BF9\u8BDD\u8FC7\u7A0B\u3002
\u3010${contactName || "Char"}\u3011\u7ED9\u3010\u6211/\u7528\u6237\u3011\u5728\u624B\u673A\u91CC\u7684\u4E13\u5C5E\u5907\u6CE8\u540D\u79F0\u662F\uFF1A${userRemark || "\u5B9D\u513F"}\u3002
${resolvedWbPrompt ? `
${resolvedWbPrompt}
` : ""}
\u8FC7\u5F80\u804A\u5929\u8BB0\u5F55\uFF1A
${historyStr}

\u6700\u65B0\u6536\u5230\u7684\u6D88\u606F\u662F\uFF1A
"${userMessage || ""}"

\u8BF7\u6839\u636E\u3010${contactName || "Char"}\u3011\u7684\u4EBA\u8BBE\u98CE\u683C\u4E0E\u3010${chatPartnerName || "\u8054\u7CFB\u4EBA"}\u3011\u7684\u5173\u7CFB\u80CC\u666F\uFF0C\u4EE5\u3010${chatPartnerName || "\u8054\u7CFB\u4EBA"}\u3011\uFF08\u6216\u5BF9\u8BDD\u5BF9\u65B9\uFF09\u7684\u53E3\u543B\uFF0C\u81EA\u7136\u56DE\u590D1~2\u53E5\u8BDD\u3002
\u6CE8\u610F\uFF1A\u4EC5\u8F93\u51FA\u56DE\u590D\u7684\u5185\u5BB9\u6587\u672C\uFF0C\u4E0D\u8981\u5E26\u4EFB\u4F55\u7CFB\u7EDF\u8BF4\u660E\u6216\u5F15\u53F7\u3002`;
      const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: promptStr
      });
      const replyText = response.text ? response.text.trim().replace(/^["'「『]|["'」』]$/g, "") : "\u6536\u5230\uFF0C\u4E00\u4F1A\u513F\u8DDF\u60A8\u8BE6\u7EC6\u6C9F\u901A\u3002";
      return res.json({ success: true, reply: replyText });
    } catch (err) {
      console.warn("Phone Chat Reply API notice:", err?.message || err);
      return res.json({ success: false, reply: `\u26A0\uFE0F \u3010\u7F51\u7EDC\u6CE2\u52A8/\u8FDE\u63A5\u8D85\u65F6\u3011\u5927\u6A21\u578B\u54CD\u5E94\u5F02\u5E38 (${err?.message || "\u8FDE\u63A5\u8D85\u65F6"})\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002` });
    }
  });
  function cleanAndParseJson(rawText, contactName, persona) {
    if (!rawText) return null;
    let text = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
    const firstBrace = text.indexOf("{");
    const lastBrace = text.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1) {
      text = text.substring(firstBrace, lastBrace + 1);
    }
    try {
      return JSON.parse(text);
    } catch (e) {
    }
    const sanitizeControlChars = (str) => {
      let out = "";
      let inStr = false;
      let isEscaped = false;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (inStr) {
          if (isEscaped) {
            out += ch;
            isEscaped = false;
          } else if (ch === "\\") {
            out += ch;
            isEscaped = true;
          } else if (ch === '"') {
            out += ch;
            inStr = false;
          } else if (ch === "\n") {
            out += "\\n";
          } else if (ch === "\r") {
            out += "\\r";
          } else if (ch === "	") {
            out += "\\t";
          } else {
            out += ch;
          }
        } else {
          if (ch === '"') {
            inStr = true;
          }
          out += ch;
        }
      }
      return out;
    };
    let sanitized = sanitizeControlChars(text).replace(/,\s*([\}\]])/g, "$1").replace(/\/\/.*/g, "");
    try {
      return JSON.parse(sanitized);
    } catch (e) {
    }
    let openBraces = 0;
    let openBracket = 0;
    let inString = false;
    let quoteChar = "";
    for (let i = 0; i < sanitized.length; i++) {
      const ch = sanitized[i];
      if (inString) {
        if (ch === "\\") {
          i++;
        } else if (ch === quoteChar) {
          inString = false;
        }
      } else {
        if (ch === '"') {
          inString = true;
          quoteChar = '"';
        } else if (ch === "{") {
          openBraces++;
        } else if (ch === "}") {
          if (openBraces > 0) openBraces--;
        } else if (ch === "[") {
          openBracket++;
        } else if (ch === "]") {
          if (openBracket > 0) openBracket--;
        }
      }
    }
    let autoFixed = sanitized;
    if (inString) {
      autoFixed += '"';
    }
    while (openBracket > 0) {
      autoFixed += "]";
      openBracket--;
    }
    while (openBraces > 0) {
      autoFixed += "}";
      openBraces--;
    }
    autoFixed = autoFixed.replace(/,\s*([\}\]])/g, "$1");
    try {
      return JSON.parse(autoFixed);
    } catch (e) {
    }
    console.log("Attempting structural field extraction from raw LLM output...");
    const extractField = (key, isArray) => {
      try {
        const regex = new RegExp(`"${key}"\\s*:\\s*([\\s\\S]*?)(?=,\\s*"[a-zA-Z0-9_]+"\\s*:|\\n\\s*"[a-zA-Z0-9_]+"\\s*:|\\}$|$)`, "i");
        const match = rawText.match(regex);
        if (match && match[1]) {
          let snippet = match[1].trim();
          snippet = snippet.replace(/,\s*$/, "");
          const cleanedSnippet = sanitizeControlChars(snippet);
          return JSON.parse(cleanedSnippet);
        }
      } catch (err) {
      }
      return null;
    };
    const userRemarkRaw = extractField("userRemark", false);
    const secretChats = extractField("secretChats", true);
    const albumPhotos = extractField("albumPhotos", true);
    const memos = extractField("memos", true);
    const browserHistory = extractField("browserHistory", true);
    const phoneCallLogs = extractField("phoneCallLogs", true);
    const shoppingItems = extractField("shoppingItems", true);
    const walletRecords = extractField("walletRecords", true);
    const walletBalance = extractField("walletBalance", false);
    const gameLibrary = extractField("gameLibrary", true);
    const itinerary = extractField("itinerary", true);
    const draftPost = extractField("draftPost", false);
    const bubbleDialogue = extractField("bubbleDialogue", false);
    const screenTime = extractField("screenTime", false);
    if (!userRemarkRaw && !secretChats && !albumPhotos && !memos && !browserHistory && !phoneCallLogs && !shoppingItems && !walletRecords && !gameLibrary && !itinerary) {
      return null;
    }
    const defaultUserRemark = persona && (persona.includes("\u4EB2") || persona.includes("\u604B") || persona.includes("\u5BF9\u8C61") || persona.includes("\u60C5\u4FA3")) ? "\u5B9D\u513F" : persona && (persona.includes("\u5DE5\u4F5C") || persona.includes("\u540C\u4E8B") || persona.includes("\u4E0A\u53F8") || persona.includes("\u9886\u5BFC")) ? "\u540C\u4E8B" : "\u65E5\u5E38\u597D\u53CB";
    const userRemark = typeof userRemarkRaw === "string" && userRemarkRaw.trim() ? userRemarkRaw.trim() : defaultUserRemark;
    const salvagedReport = {
      userRemark,
      secretChats: Array.isArray(secretChats) ? secretChats : [],
      albumPhotos: Array.isArray(albumPhotos) ? albumPhotos : [],
      memos: Array.isArray(memos) ? memos : [],
      browserHistory: Array.isArray(browserHistory) ? browserHistory : [],
      phoneCallLogs: Array.isArray(phoneCallLogs) ? phoneCallLogs : [],
      shoppingItems: Array.isArray(shoppingItems) ? shoppingItems : [],
      walletRecords: Array.isArray(walletRecords) ? walletRecords : [],
      walletBalance: typeof walletBalance === "string" ? walletBalance : "\uFFE50.00",
      gameLibrary: Array.isArray(gameLibrary) ? gameLibrary : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      draftPost: typeof draftPost === "string" ? draftPost : "",
      bubbleDialogue: bubbleDialogue && typeof bubbleDialogue === "object" ? bubbleDialogue : {
        charMsg: "\u4F60\u597D",
        userMsg: "\u4F60\u597D"
      },
      screenTime: screenTime && typeof screenTime === "object" ? screenTime : {
        totalTime: "0\u5206\u949F",
        appUsage: []
      }
    };
    return salvagedReport;
  }
  app.post("/api/phone-check", async (req, res) => {
    try {
      const { contactName, persona, chatHistory, worldBookPrompt, apiKey, apiBaseUrl, selectedModel, selectedApps } = req.body || {};
      const keyToUse = apiKey;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6709\u6548\u7684 API Key\uFF0C\u8BF7\u5148\u524D\u5F80\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u586B\u5165 API Key\u3002"
        });
      }
      const rawModel = normalizeGeminiModel(selectedModel);
      const isAppSelected = (appId) => !Array.isArray(selectedApps) || selectedApps.length === 0 || selectedApps.includes(appId);
      const appFocusNotice = Array.isArray(selectedApps) && selectedApps.length > 0 ? `\u8BF7\u91CD\u70B9\u9488\u5BF9\u4EE5\u4E0B\u4F60\u88AB\u52FE\u9009\u7684\u5E94\u7528\u7C7B\u76EE\u751F\u6210\u771F\u5B9E\u6570\u636E\uFF1A${selectedApps.join(", ")}\u3002\u672A\u52FE\u9009\u7684\u5E94\u7528\u8BF7\u76F4\u63A5\u8FD4\u56DE\u7A7A\u6570\u7EC4\u6216\u7A7A\u503C\u5373\u53EF\u3002` : "\u8BF7\u4E3A\u76EE\u6807\u8054\u7CFB\u4EBA\u7684\u5E38\u7528\u5E94\u7528\u751F\u6210\u771F\u5B9E\u8D34\u5408\u4EBA\u8BBE\u7684\u624B\u673A\u5E94\u7528\u6570\u636E\u3002";
      let jsonRequirements = [
        `0. "userRemark": \u76EE\u6807\u8054\u7CFB\u4EBA\u7ED9\u3010\u7528\u6237/\u6211\u3011\u5728\u624B\u673A\u91CC\u8BBE\u7F6E\u7684\u4E13\u5C5E\u5907\u6CE8\u540D\u5B57\u7B26\u4E32\uFF08\u6839\u636E\u4EBA\u8BBE\u4E0E\u804A\u5929\u5173\u7CFB\u80CC\u666F\u52A8\u6001\u751F\u6210\uFF09`
      ];
      if (isAppSelected("chat")) jsonRequirements.push(`1. "secretChats": 5-8 \u4E2A\u65E5\u5E38\u804A\u5929\u8BB0\u5F55\u5BF9\u8C61 [{"name": "...", "lastMsg": "...", "time": "...", "messages": [{"sender": "them"|"me", "text": "..."}]}] (\u6CE8\u610F\uFF1A\u6BCF\u4E2A\u804A\u5929\u5BF9\u8C61\u5FC5\u987B\u5305\u542B3-6\u6761\u6709\u6765\u6709\u56DE\u7684\u65E5\u5E38\u5BF9\u8BDD\u8BB0\u5F55 messages)`);
      if (isAppSelected("photos")) jsonRequirements.push(`2. "albumPhotos": 4-9 \u4E2A\u7167\u7247/\u89C6\u9891\u5BF9\u8C61 [{"title": "...", "tag": "\u7167\u7247"|"\u89C6\u9891", "desc": "\u5173\u4E8E\u8BE5\u7167\u7247/\u89C6\u9891\u7684\u63CF\u8FF0\u3002\u957F\u5EA6\u5FC5\u987B\u968F\u673A\uFF1A\u53EF\u957F\u53EF\u77ED\uFF0C\u957F\u7684\u9700\u8981\u975E\u5E38\u957F\u7684\u4E00\u5927\u6BB5\u8BE6\u7EC6\u53D9\u8FF0\uFF0C\u77ED\u7684\u5219\u662F\u4E2D\u7B49\u957F\u5EA6\u7684\u8BB0\u5F55"}]`);
      if (isAppSelected("notes")) jsonRequirements.push(`3. "memos": 3-9 \u4E2A\u8BE6\u7EC6\u5907\u5FD8\u5F55\u5B57\u7B26\u4E32 (\u6BCF\u4E2A\u5907\u5FD8\u5F55\u5305\u542B\u591A\u53E5\u601D\u8003\u3001\u65E5\u5E38\u8BA1\u5212\u6216\u6E05\u5355)`);
      if (isAppSelected("safari")) jsonRequirements.push(`4. "browserHistory": 6-10 \u4E2A\u65E5\u5E38\u641C\u7D22/\u6D4F\u89C8\u5386\u53F2\u5B57\u7B26\u4E32`);
      if (isAppSelected("phone")) jsonRequirements.push(`5. "phoneCallLogs": 4-7 \u6761\u65E5\u5E38\u901A\u8BDD\u8BB0\u5F55 [{"type": "incoming"|"outgoing"|"missed", "name": "\u5907\u6CE8\u6216\u8054\u7CFB\u4EBA\u59D3\u540D(\u53EF\u4F7F\u7528\u7ED9\u7528\u6237\u7684\u4E13\u5C5E\u5907\u6CE8 userRemark)", "time": "\u4ECA\u5929 01:15", "duration": "14\u520622\u79D2", "desc": "\u65E5\u5E38\u901A\u8BDD\u5185\u5BB9\u7B80\u8FF0"}]`);
      if (isAppSelected("shopping")) jsonRequirements.push(`6. "shoppingItems": 4-8 \u6761\u8D2D\u7269\u8BA2\u5355 [{"name": "...", "price": "\uFFE5...", "date": "...", "status": "\u5DF2\u7B7E\u6536"|"\u8FD0\u8F93\u4E2D"|"\u5F85\u51FA\u884C", "desc": "..."}]`);
      if (isAppSelected("wallet")) {
        jsonRequirements.push(`7. "walletRecords": 4-8 \u6761\u8D22\u52A1\u6536\u652F\u8BB0\u5F55 [{"title": "...", "amount": "+\uFFE5..."|"-\uFFE5...", "date": "...", "type": "income"|"expense", "desc": "..."}]`);
        jsonRequirements.push(`8. "walletBalance": \u4F59\u989D\u5B57\u7B26\u4E32 (\u5982 "\uFFE518,520.00")`);
      }
      if (isAppSelected("games")) jsonRequirements.push(`9. "gameLibrary": 3-6 \u6761\u6E38\u620F\u5BF9\u8C61 [{"name": "...", "playTime": "...\u5C0F\u65F6", "lastPlayed": "..."}]`);
      if (isAppSelected("itinerary")) jsonRequirements.push(`10. "itinerary": 3-6 \u6761\u884C\u7A0B\u5B9A\u4F4D\u8BB0\u5F55 [{"location": "...", "time": "...", "status": "\u5DF2\u6253\u5361"|"\u8BA1\u5212\u4E2D", "desc": "..."}]`);
      jsonRequirements.push(`11. "draftPost": 1\u6761\u670B\u53CB\u5708\u672A\u53D1\u9001\u52A8\u6001\u8349\u7A3F`);
      jsonRequirements.push(`12. "bubbleDialogue": {"charMsg": "...", "userMsg": "..."}`);
      jsonRequirements.push(`13. "screenTime": {"totalTime": "...", "appUsage": [{"appName": "Chat", "duration": "...", "category": "\u793E\u4EA4"}]}`);
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt(`${contactName || ""}
${persona || ""}
${chatHistory || ""}`);
      const systemPrompt = `\u4F60\u662F\u4E00\u4E2A\u771F\u5B9E\u62DF\u771F\u7684\u624B\u673A\u6570\u636E\u751F\u6210AI\u7CFB\u7EDF\u3002
\u8BF7\u6839\u636E\u76EE\u6807\u8054\u7CFB\u4EBA\u3010${contactName || "\u76EE\u6807\u8054\u7CFB\u4EBA"}\u3011\u7684\u4EBA\u8BBE\u8BBE\u5B9A\uFF1A
${persona || "\u65E0\u7279\u5F02\u8BBE\u5B9A"}
${resolvedWbPrompt ? `
${resolvedWbPrompt}
` : ""}
\u4EE5\u53CA\u5176\u4E0E\u7528\u6237\u7684\u8FD1\u671F\u804A\u5929\u8BB0\u5F55/\u80CC\u666F\uFF1A
${chatHistory || "\u65E5\u5E38\u5BF9\u8BDD\u8BB0\u5F55"}

${appFocusNotice}

\u8BF7\u5206\u6790\u5E76\u751F\u6210\u5176\u624B\u673A\u91CC\u7684\u65E5\u5E38\u771F\u5B9E\u5E94\u7528\u6570\u636E\u3002
\u3010\u5173\u952E\u6307\u793A\u3011\uFF1A
1. \u5168\u90E8\u6570\u636E\u5FC5\u987B\u4E3A\u81EA\u7136\u771F\u5B9E\u7684\u751F\u6D3B\u8BB0\u5F55\uFF0C\u4E0D\u8981\u751F\u6210\u5E26\u6709\u60AC\u7591/\u63A8\u7406/\u505A\u4F5C\u7684\u201C\u5F02\u5E38\u7EBF\u7D22\u201D\u6216\u201C\u9690\u79D8\u7EBF\u7D22\u201D\u3002
2. \u8BF7\u4E3A\u76EE\u6807\u8054\u7CFB\u4EBA\u7ED9\u3010\u7528\u6237/\u6211\u3011\u8BBE\u5B9A\u4E00\u4E2A\u4E13\u5C5E\u5907\u6CE8/\u6635\u79F0 "userRemark"\uFF08\u5FC5\u987B\u6839\u636E\u76EE\u6807\u8054\u7CFB\u4EBA\u3010${contactName}\u3011\u7684\u4EBA\u8BBE\u3001\u8EAB\u4EFD\u53CA\u4E0E\u7528\u6237\u7684\u5177\u4F53\u5173\u7CFB\u80CC\u666F\u52A8\u6001\u751F\u6210\uFF0C\u7EDD\u4E0D\u53EF\u4F7F\u7528\u6B7B\u4EE3\u7801\u786C\u7F16\u7801\uFF09\u3002
3. \u91CD\u70B9\u5185\u5BB9\u914D\u6BD4\uFF1A\u5728\u751F\u6210\u7684\u6BCF\u4E2A\u8F6F\u4EF6\u7684\u6570\u636E\u4E2D\uFF08\u5982\u76F8\u518C\u3001\u5907\u5FD8\u5F55\u3001\u901A\u8BDD\u8BB0\u5F55\u3001\u8D2D\u7269\u3001\u6D4F\u89C8\u5668\u7B49\uFF09\uFF0C**\u5FC5\u987B\u5305\u542B 1 \u5230 2 \u6761\u4E0E\u3010\u7528\u6237/\u6211\u3011\u76F4\u63A5\u76F8\u5173\u7684\u5185\u5BB9**\uFF08\u6BD4\u5982\u4E70\u7ED9\u7528\u6237\u7684\u793C\u7269\u3001\u5173\u4E8E\u7528\u6237\u7684\u5907\u5FD8\u3001\u548C\u7528\u6237\u7684\u5408\u7167\u7B49\uFF09\uFF0C\u800C**\u5176\u4F59\u7684\u5185\u5BB9\u5219\u662F\u8BE5\u8054\u7CFB\u4EBA\u81EA\u5DF1\u7684\u4E2A\u4EBA\u751F\u6D3B\u65E5\u5E38\u3001\u5DE5\u4F5C\u3001\u6216\u5176\u4ED6\u65E0\u5173\u8BB0\u5F55**\u3002\u8981\u6709\u771F\u5B9E\u751F\u6D3B\u7684\u4E3B\u6B21\u611F\u3002

\u5FC5\u987B\u8F93\u51FA\u7EAF JSON \u683C\u5F0F\u5BF9\u8C61\uFF0C\u4E0D\u8981\u5305\u542B\u4EFB\u4F55 markdown \u5757\u6807\u8BB0\uFF08\u4F8B\u5982\u4E0D\u8981\u5E26\u6709 \`\`\`json \u5F00\u5934\uFF09\uFF0CJSON\u7ED3\u6784\u5FC5\u987B\u4E25\u683C\u9075\u5FAA\u4EE5\u4E0B\u6570\u91CF\u4E0E\u5B57\u6BB5\u8981\u6C42\uFF1A

${jsonRequirements.join("\n")}

\u8BF7\u786E\u4FDD\u8FD4\u56DE\u7684 JSON \u7ED3\u6784\u53EA\u5305\u542B\u4E0A\u8FF0\u8981\u6C42\u7684\u5B57\u6BB5\uFF0C\u5982\u679C\u4F60\u51B3\u5B9A\u4E0D\u751F\u6210\u67D0\u4E9B\u5B57\u6BB5\uFF08\u4F8B\u5982\u672A\u52FE\u9009\u7684\u5E94\u7528\uFF09\uFF0C\u8BF7\u76F4\u63A5\u5C06\u8BE5\u5B57\u6BB5\u7684\u503C\u8BBE\u4E3A\u7A7A\u6570\u7EC4 [] \u6216 null\u3002

JSON\u7ED3\u6784\u8303\u4F8B\uFF1A
{
  "userRemark": "\u5B9D\u513F",
  "secretChats": [
    {
      "name": "\u5DE5\u4F5C\u4EA4\u6D41\u7FA4",
      "lastMsg": "\u65B9\u6848PPT\u5DF2\u53D1\u9001\uFF0C\u5927\u5BB6\u67E5\u6536\u4E00\u4E0B",
      "time": "21:10",
      "messages": [
        {"sender": "them", "text": "\u5927\u5BB6\u5173\u4E8E\u4E0B\u5468\u9879\u76EE\u7684\u65B9\u6848\u603B\u7ED3\u5F97\u600E\u4E48\u6837\u4E86\uFF1F"},
        {"sender": "me", "text": "\u6211\u5DF2\u7ECF\u5168\u90E8\u6392\u7248\u597D\u4E86\uFF0C\u521A\u521A\u51C6\u5907\u4E0A\u4F20\u3002"},
        {"sender": "them", "text": "\u65B9\u6848PPT\u5DF2\u53D1\u9001\uFF0C\u5927\u5BB6\u67E5\u6536\u4E00\u4E0B"},
        {"sender": "me", "text": "\u6536\u5230\uFF0C\u8F9B\u82E6\uFF01"}
      ]
    }
  ],
  "albumPhotos": [
    {"title": "\u5915\u9633\u98CE\u666F", "tag": "\u7167\u7247", "desc": "\u6F2B\u6B65\u516C\u56ED\u62CD\u6444\u7684\u5915\u9633"},
    {"title": "\u5BA0\u7269\u89C6\u9891", "tag": "\u89C6\u9891", "desc": "\u732B\u54AA\u6253\u778C\u7761\u7684\u89C6\u9891"}
  ],
  "memos": [
    "\u5DE5\u4F5C\u590D\u76D8\uFF1A1.\u6574\u7406\u5468\u62A5\uFF1B2.\u51C6\u5907\u660E\u5929\u7684\u4F1A\u8BAE\u6750\u6599..."
  ],
  "browserHistory": [
    "\u9002\u5408\u5468\u672B\u5EA6\u5047\u7684\u5730\u65B9",
    "\u9AD8\u6548\u65F6\u95F4\u7BA1\u7406\u65B9\u6CD5"
  ],
  "phoneCallLogs": [
    {"type": "incoming", "name": "\u5B9D\u513F", "time": "\u4ECA\u5929 01:15", "duration": "14\u520622\u79D2", "desc": "\u6C9F\u901A\u5173\u4E8E\u5468\u672B\u805A\u9910\u7684\u5B89\u6392"}
  ],
  "shoppingItems": [
    {"name": "\u529E\u516C\u684C\u6696\u98CE\u673A", "price": "\uFFE5120.00", "date": "\u6628\u5929 16:30", "status": "\u8FD0\u8F93\u4E2D", "desc": "\u5B9E\u7528\u529E\u516C\u5C0F\u5BB6\u7535"}
  ],
  "walletRecords": [
    {"title": "\u65E5\u5E38\u9910\u8D39\u5206\u644A", "amount": "-\uFFE5120.00", "date": "5\u5929\u524D", "type": "expense", "desc": "\u670B\u53CB\u805A\u9910AA"}
  ],
  "walletBalance": "\uFFE515,820.00",
  "gameLibrary": [
    {"name": "\u738B\u8005\u8363\u8000", "playTime": "320 \u5C0F\u65F6", "lastPlayed": "\u6628\u5929 23:40"}
  ],
  "itinerary": [
    {"location": "\u9759\u5B89\u533A\u5546\u5708", "time": "\u524D\u5929 18:40", "status": "\u5DF2\u6253\u5361", "desc": "\u524D\u5F80\u901B\u8857\u91C7\u8D2D"}
  ],
  "draftPost": "\u751F\u6D3B\u6674\u6717\uFF0C\u4E07\u7269\u53EF\u7231...",
  "bubbleDialogue": {
    "charMsg": "\u7B49\u4F1A\u513F\u89C1\uFF01",
    "userMsg": "\u597D\u561E\uFF01"
  },
  "screenTime": {
    "totalTime": "6\u5C0F\u65F628\u5206\u949F",
    "appUsage": [
      {"appName": "Chat", "duration": "2\u5C0F\u65F640\u5206\u949F", "category": "\u793E\u4EA4"}
    ]
  }
}
`;
      let responseText = "";
      let lastErrMsg = "";
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible) {
        try {
          let endpointUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, "") : "";
          if (endpointUrl && !endpointUrl.endsWith("/chat/completions")) {
            if (endpointUrl.endsWith("/v1")) {
              endpointUrl += "/chat/completions";
            } else {
              endpointUrl += "/v1/chat/completions";
            }
          }
          if (endpointUrl) {
            const openAiResp = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keyToUse}`
              },
              body: JSON.stringify({
                model: rawModel,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: "\u8BF7\u7ACB\u5373\u7A7F\u900F\u5206\u6790\u5E76\u751F\u6210\u8BE5\u8054\u7CFB\u4EBA\u7684\u624B\u673A\u65E5\u5E38\uFF0C\u4E25\u7981\u8F93\u51FA\u4EFB\u4F55 markdown \u6807\u8BB0\uFF0C\u76F4\u63A5\u8FD4\u56DE\u7EAF JSON\u3002" }
                ],
                temperature: 0.85
              })
            });
            if (openAiResp.ok) {
              const data = await openAiResp.json();
              const reply = data.choices?.[0]?.message?.content;
              if (reply) {
                responseText = reply;
              }
            } else {
              const errData = await openAiResp.json().catch(() => ({}));
              const customMsg = errData?.error?.message || errData?.message || errData?.error?.type || (typeof errData === "object" ? "Request details unavailable" : String(errData));
              lastErrMsg = `\u81EA\u5B9A\u4E49\u6A21\u578B/API \u4EE3\u7406\u54CD\u5E94 (HTTP ${openAiResp.status})`;
              console.log("[Phone Check API Status]", openAiResp.status);
              if (apiBaseUrl) {
                return res.status(400).json({
                  success: false,
                  error: getFriendlyApiErrorMessage(openAiResp.status, customMsg)
                });
              }
            }
          }
        } catch (oErr) {
          lastErrMsg = oErr?.message || String(oErr);
          console.log("[Phone Check API Exception]", lastErrMsg);
          if (apiBaseUrl) {
            return res.status(400).json({
              success: false,
              error: `\u26A0\uFE0F \u3010API \u4EE3\u7406\u8FDE\u63A5/\u8BF7\u6C42\u5931\u8D25\u3011
${lastErrMsg}
\u8BF7\u524D\u5F80 \u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u68C0\u67E5\u60A8\u7684 Endpoint \u63A5\u53E3\u4EE3\u7406\u5730\u5740\u4E0E\u7F51\u7EDC\u8FDE\u901A\u6027\u3002`
            });
          }
        }
      }
      if (!responseText) {
        const ai = new import_genai.GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: {
            headers: {
              "User-Agent": "aistudio-build"
            }
          }
        });
        const modelCandidates = rawModel.toLowerCase().startsWith("gemini") ? Array.from(/* @__PURE__ */ new Set([rawModel, ...DEFAULT_GEMINI_MODELS])) : DEFAULT_GEMINI_MODELS;
        for (const mName of modelCandidates) {
          try {
            const response = await ai.models.generateContent({
              model: mName,
              contents: "\u8BF7\u7ACB\u5373\u7A7F\u900F\u5206\u6790\u5E76\u751F\u6210\u8BE5\u8054\u7CFB\u4EBA\u7684\u624B\u673A\u65E5\u5E38\u3002",
              config: {
                systemInstruction: systemPrompt,
                responseMimeType: "application/json"
              }
            });
            if (response.text) {
              responseText = response.text;
              break;
            }
          } catch (mErr) {
            lastErrMsg = mErr?.message || String(mErr);
            if (lastErrMsg.includes("API key not valid") || mErr?.status === "INVALID_ARGUMENT") {
              break;
            }
          }
        }
      }
      if (!responseText) {
        return res.status(400).json({
          success: false,
          error: lastErrMsg ? `API \u8C03\u7528\u51FA\u9519: ${lastErrMsg}` : "AI \u672A\u80FD\u751F\u6210\u54CD\u5E94\uFF0C\u8BF7\u68C0\u67E5 API Key / Endpoint \u540E\u91CD\u8BD5\u3002"
        });
      }
      const parsedReport = cleanAndParseJson(responseText, contactName, persona);
      if (!parsedReport) {
        console.error("DEBUG: rawText was:", responseText);
        return res.status(400).json({
          success: false,
          error: "AI \u54CD\u5E94\u683C\u5F0F\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u70B9\u51FB\u91CD\u8BD5\u3002"
        });
      }
      return res.json({
        success: true,
        report: parsedReport
      });
    } catch (err) {
      console.error("Phone check route error:", err);
      return res.status(500).json({
        success: false,
        error: `\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF: ${err?.message || err}`
      });
    }
  });
  app.post("/api/phone-check-webpage", async (req, res) => {
    try {
      const { query, worldBookPrompt, apiKey, apiBaseUrl, selectedModel } = req.body || {};
      const keyToUse = apiKey && typeof apiKey === "string" && apiKey.trim() ? apiKey.trim() : process.env.GEMINI_API_KEY || "";
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u5728\u7CFB\u7EDF\u8BBE\u7F6E\u4E2D\u914D\u7F6E\u6709\u6548\u7684 API Key"
        });
      }
      const rawModel = normalizeGeminiModel(selectedModel);
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt(String(query || ""));
      const systemPrompt = `\u4F60\u662F\u4E00\u4E2A\u7F51\u9875\u8BE6\u60C5\u751F\u6210AI\u3002
\u7528\u6237\u5728\u624B\u673A\u6D4F\u89C8\u5668\u4E2D\u641C\u7D22\u4E86\u5386\u53F2\u8BB0\u5F55\u9879\uFF1A\u3010${query}\u3011\u3002
${resolvedWbPrompt ? `${resolvedWbPrompt}
` : ""}\u8BF7\u4F60\u751F\u6210\u4E00\u4E2A\u903C\u771F\u7684\u7F51\u9875\u8BE6\u60C5\u5185\u5BB9\uFF0C\u5206\u4E3A\u201C\u95EE\u9898\u201D\u3001\u201C\u89E3\u7B54\u201D\u3001\u201C\u8BC4\u8BBA\u533A\u201D\u3002
\u4E0D\u8981\u5305\u542Bmarkdown\u6807\u8BB0\uFF0C\u76F4\u63A5\u8FD4\u56DE\u7EAFJSON\u3002
\u7ED3\u6784\u5982\u4E0B\uFF1A
{
  "siteName": "\u77E5\u4E4E/\u767E\u5EA6\u77E5\u9053/\u67D0\u4E2A\u8BBA\u575B\u540D\u5B57",
  "question": "\u7528\u6237\u641C\u7D22\u7684\u5177\u4F53\u95EE\u9898\u6216\u8005\u5E16\u5B50\u6807\u9898",
  "answer": "\u8BE6\u7EC6\u7684\u89E3\u7B54\u5185\u5BB9\u6216\u6B63\u6587...",
  "comments": [
    { "user": "\u70ED\u5FC3\u7F51\u53CBA", "content": "\u8BC4\u8BBA\u5185\u5BB9..." },
    { "user": "\u7F51\u53CBB", "content": "..." }
  ]
}
`;
      let responseText = "";
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible) {
        try {
          let endpointUrl = apiBaseUrl ? apiBaseUrl.trim().replace(/\/+$/, "") : "";
          if (endpointUrl && !endpointUrl.endsWith("/chat/completions")) {
            if (endpointUrl.endsWith("/v1")) endpointUrl += "/chat/completions";
            else endpointUrl += "/v1/chat/completions";
          }
          if (endpointUrl) {
            const openAiResp = await fetch(endpointUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${keyToUse}`
              },
              body: JSON.stringify({
                model: rawModel,
                messages: [{ role: "user", content: systemPrompt }],
                response_format: { type: "json_object" }
              })
            });
            if (openAiResp.ok) {
              const data = await openAiResp.json();
              if (data.choices && data.choices.length > 0) {
                responseText = data.choices[0].message.content;
              }
            }
          }
        } catch (e) {
        }
      }
      if (!responseText) {
        const ai = new import_genai.GoogleGenAI({
          apiKey: keyToUse,
          httpOptions: { headers: { "User-Agent": "aistudio-build" } }
        });
        const response = await ai.models.generateContent({
          model: rawModel.toLowerCase().startsWith("gemini") ? rawModel : "gemini-3.8-flash",
          contents: systemPrompt,
          config: {
            responseMimeType: "application/json"
          }
        });
        responseText = response.text || "";
      }
      const parsed = JSON.parse(responseText.replace(/```json/gi, "").replace(/```/g, "").trim());
      return res.json({
        success: true,
        webpage: parsed
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });
  app.post("/api/parse-link", async (req, res) => {
    try {
      const { rawInput, url: inputUrl } = req.body || {};
      const fullText = (rawInput || inputUrl || "").trim();
      if (!fullText) {
        return res.json({
          success: false,
          error: "\u94FE\u63A5\u4E3A\u7A7A",
          platform: "\u7F51\u9875",
          title: "",
          snippet: "",
          cover: "",
          url: ""
        });
      }
      const urlMatch = fullText.match(/https?:\/\/[^\s]+/i);
      let targetUrl = urlMatch ? urlMatch[0] : "";
      if (!targetUrl) {
        if (fullText.includes(".") && !fullText.includes(" ") && (fullText.startsWith("www.") || fullText.includes(".com") || fullText.includes(".cn") || fullText.includes(".tv") || fullText.includes(".link") || fullText.includes(".org") || fullText.includes(".net"))) {
          targetUrl = `https://${fullText}`;
        } else {
          targetUrl = fullText;
        }
      }
      let textWithoutUrl = fullText;
      if (urlMatch) {
        textWithoutUrl = fullText.replace(urlMatch[0], "").trim();
      }
      let cleanText = textWithoutUrl.replace(/^[\d\.\s]+/, "").replace(/复制(整段|此|本条)?(内容|信息)?[^\n]*?查看[：:]?/gi, "").replace(/复制打开(抖音|快手|小红书)[，,][^\n]*?看看/gi, "").replace(/打?开(【小红书】|【哔哩哔哩】|【微博】|【抖音】|【知乎】|App)[^\n]*?(查看|看)?[：:]?/gi, "").replace(/【(小红书|哔哩哔哩|微博|抖音|知乎|微信)】/g, "").replace(/App查看[：:]?/gi, "").replace(/快来和我一起看/g, "").replace(/分享(一条|一个)?[^\n]*?[：:]/g, "").trim();
      let extractedTitle = "";
      let extractedBody = "";
      const bracketMatch = cleanText.match(/[【「](.+?)[】」]/);
      if (bracketMatch && !["\u5C0F\u7EA2\u4E66", "\u54D4\u54E9\u54D4\u54E9", "B\u7AD9", "\u5FAE\u535A", "\u6296\u97F3", "\u77E5\u4E4E", "\u5FAE\u4FE1"].includes(bracketMatch[1].trim())) {
        extractedTitle = bracketMatch[1].trim();
        const after = cleanText.replace(bracketMatch[0], "").trim();
        if (after.length >= 2) {
          extractedBody = after;
        }
      } else if (cleanText.length > 0) {
        const cleaned = cleanText.replace(/[【「](小红书|哔哩哔哩|B站|微博|抖音|知乎|微信)[】」]/g, "").trim();
        const lines = cleaned.split(/[\n\r]+/);
        if (lines.length > 1 && lines[0].trim()) {
          extractedTitle = lines[0].trim();
          extractedBody = lines.slice(1).join(" ").trim();
        } else if (cleaned.length > 25) {
          const sentenceMatch = cleaned.match(/^([^，。！？\n]{4,22}[，。！？])/);
          if (sentenceMatch) {
            extractedTitle = sentenceMatch[1].replace(/[，。！？]$/, "").trim();
            extractedBody = cleaned.substring(sentenceMatch[0].length).trim();
          } else {
            extractedTitle = cleaned.slice(0, 20);
            extractedBody = cleaned;
          }
        } else {
          extractedTitle = cleaned;
        }
      }
      const lower = targetUrl.toLowerCase();
      let platform = "\u7F51\u9875";
      if (lower.includes("xiaohongshu.com") || lower.includes("xhslink.com") || lower.includes("xhs.link")) {
        platform = "\u5C0F\u7EA2\u4E66";
      } else if (lower.includes("bilibili.com") || lower.includes("b23.tv")) {
        platform = "\u54D4\u54E9\u54D4\u54E9";
      } else if (lower.includes("weibo.com") || lower.includes("weibo.cn") || lower.includes("t.cn")) {
        platform = "\u5FAE\u535A";
      } else if (lower.includes("douyin.com") || lower.includes("iesdouyin.com")) {
        platform = "\u6296\u97F3";
      } else if (lower.includes("zhihu.com")) {
        platform = "\u77E5\u4E4E";
      } else if (lower.includes("mp.weixin.qq.com") || lower.includes("weixin.qq.com")) {
        platform = "\u5FAE\u4FE1\u516C\u4F17\u53F7";
      } else if (lower.includes("github.com")) {
        platform = "GitHub";
      } else if (lower.includes("juejin.cn")) {
        platform = "\u6398\u91D1";
      } else {
        try {
          const p = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
          platform = p.hostname.replace(/^www\./, "");
        } catch (e) {
          platform = "\u7F51\u9875";
        }
      }
      let fetchedTitle = extractedTitle;
      let fetchedSnippet = extractedBody;
      let fetchedCover = "";
      if (/\.(jpeg|jpg|gif|png|webp)($|\?)/i.test(targetUrl)) {
        return res.json({
          success: true,
          url: targetUrl,
          platform,
          title: extractedTitle || "\u56FE\u7247\u5206\u4EAB",
          snippet: extractedBody || "\u70B9\u51FB\u67E5\u770B\u539F\u56FE",
          cover: targetUrl
        });
      }
      const bvMatch = targetUrl.match(/(BV[a-zA-Z0-9]+)/i);
      if (bvMatch) {
        try {
          const bvid = bvMatch[1];
          const bResp = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(4e3)
          });
          if (bResp.ok) {
            const bJson = await bResp.json();
            if (bJson.code === 0 && bJson.data) {
              fetchedTitle = bJson.data.title || fetchedTitle;
              fetchedSnippet = bJson.data.desc || fetchedSnippet;
              fetchedCover = bJson.data.pic ? bJson.data.pic.startsWith("//") ? `https:${bJson.data.pic}` : bJson.data.pic : "";
              platform = "\u54D4\u54E9\u54D4\u54E9";
              return res.json({
                success: true,
                url: targetUrl,
                platform,
                title: fetchedTitle,
                snippet: fetchedSnippet,
                cover: fetchedCover
              });
            }
          }
        } catch (e) {
        }
      }
      if (targetUrl.startsWith("http")) {
        try {
          const response = await fetch(targetUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8"
            },
            redirect: "follow",
            signal: AbortSignal.timeout(5e3)
          });
          const finalUrl = response.url || targetUrl;
          const html = await response.text();
          if (finalUrl.includes("mp.weixin.qq.com") || html.includes("msg_title")) {
            const wxTitle = html.match(/var\s+msg_title\s*=\s*['"]([^'"]+)['"]/i);
            const wxDesc = html.match(/var\s+msg_desc\s*=\s*['"]([^'"]+)['"]/i);
            const wxCover = html.match(/var\s+msg_cdn_url\s*=\s*['"]([^'"]+)['"]/i);
            if (wxTitle && wxTitle[1]) fetchedTitle = wxTitle[1].trim();
            if (wxDesc && wxDesc[1]) fetchedSnippet = wxDesc[1].trim();
            if (wxCover && wxCover[1]) fetchedCover = wxCover[1].trim();
            platform = "\u5FAE\u4FE1\u516C\u4F17\u53F7";
          }
          if (!fetchedTitle || fetchedTitle === "\u5C0F\u7EA2\u4E66" || fetchedTitle === "\u54D4\u54E9\u54D4\u54E9") {
            const ogTitle = html.match(/<meta[^>]*(?:property|name)=["']og:title["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:title["']/i) || html.match(/<meta[^>]*(?:name|itemprop)=["']title["'][^>]*content=["']([^"']+)["']/i) || html.match(/<title[^>]*>([^<]+)<\/title>/i);
            if (ogTitle && ogTitle[1]) {
              const rawTitle = ogTitle[1].replace(/ - 哔哩哔哩_bilibili/gi, "").replace(/ - bilibili/gi, "").replace(/ - 小红书/gi, "").replace(/小红书 - 你访问的页面不见了/gi, "").replace(/_微博/gi, "").replace(/ - 知乎/gi, "").replace(/ - 掘金/gi, "").replace(/ - 百度百科/gi, "").trim();
              if (rawTitle && rawTitle !== "\u5C0F\u7EA2\u4E66" && !rawTitle.includes("\u9875\u9762\u4E0D\u89C1\u4E86")) {
                fetchedTitle = rawTitle;
              }
            }
          }
          if (!fetchedSnippet) {
            const ogDesc = html.match(/<meta[^>]*(?:property|name)=["']og:description["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:description["']/i) || html.match(/<meta[^>]*(?:name|itemprop)=["']description["'][^>]*content=["']([^"']+)["']/i);
            if (ogDesc && ogDesc[1]) {
              fetchedSnippet = ogDesc[1].trim();
            }
          }
          if (!fetchedCover) {
            const ogImg = html.match(/<meta[^>]*(?:property|name)=["']og:image["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']og:image["']/i) || html.match(/<meta[^>]*(?:name|property|itemprop)=["'](?:twitter:image|image)["'][^>]*content=["']([^"']+)["']/i) || html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*(?:name|property|itemprop)=["'](?:twitter:image|image)["']/i) || html.match(/<link[^>]*rel=["']image_src["'][^>]*href=["']([^"']+)["']/i);
            if (ogImg && ogImg[1]) {
              let imgUrl = ogImg[1].trim();
              if (imgUrl.startsWith("//")) imgUrl = `https:${imgUrl}`;
              else if (imgUrl.startsWith("http://")) imgUrl = imgUrl.replace(/^http:\/\//i, "https://");
              else if (imgUrl.startsWith("/")) {
                try {
                  imgUrl = new URL(imgUrl, finalUrl).href;
                } catch (e) {
                }
              }
              fetchedCover = imgUrl;
            }
          }
          if (!fetchedCover || !fetchedTitle) {
            const matchState = html.match(/window\.__INITIAL_STATE__\s*=\s*(\{.*?\})<\/script>/s);
            if (matchState) {
              try {
                const cleaned = matchState[1].replace(/undefined/g, "null");
                const state = JSON.parse(cleaned);
                if (state.note && state.note.noteDetailMap) {
                  const firstNote = Object.values(state.note.noteDetailMap)[0];
                  if (firstNote && firstNote.note) {
                    if (!fetchedTitle && firstNote.note.title) fetchedTitle = firstNote.note.title;
                    if (!fetchedSnippet && firstNote.note.desc) fetchedSnippet = firstNote.note.desc;
                    if (!fetchedCover && firstNote.note.imageList && firstNote.note.imageList.length > 0) {
                      let xhsImg = firstNote.note.imageList[0].urlDefault || firstNote.note.imageList[0].urlOriginal || "";
                      if (xhsImg.startsWith("http://")) xhsImg = xhsImg.replace(/^http:\/\//i, "https://");
                      fetchedCover = xhsImg;
                    }
                  }
                }
              } catch (e) {
              }
            }
          }
          const siteName = html.match(/<meta[^>]*(?:property|name)=["']og:site_name["'][^>]*content=["']([^"']+)["']/i);
          if (siteName && siteName[1] && siteName[1].trim().length < 15) {
            platform = siteName[1].trim();
          }
        } catch (e) {
        }
      }
      if (!fetchedTitle) {
        fetchedTitle = extractedTitle || (platform === "\u7F51\u9875" ? "\u7F51\u9875\u5206\u4EAB" : `${platform}\u5185\u5BB9\u5206\u4EAB`);
      }
      if (!fetchedSnippet) {
        fetchedSnippet = extractedBody || (platform === "\u5C0F\u7EA2\u4E66" ? "\u67E5\u770B\u56FE\u6587\u7B14\u8BB0" : platform === "\u54D4\u54E9\u54D4\u54E9" ? "\u67E5\u770B\u9AD8\u6E05\u89C6\u9891" : "\u70B9\u51FB\u67E5\u770B\u8BE6\u60C5");
      }
      return res.json({
        success: true,
        url: targetUrl,
        platform,
        title: fetchedTitle,
        snippet: fetchedSnippet,
        cover: fetchedCover || ""
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err?.message || "\u89E3\u6790\u5931\u8D25" });
    }
  });
  app.get("/api/proxy-image", async (req, res) => {
    try {
      const imageUrl = req.query.url;
      if (!imageUrl || !imageUrl.startsWith("http")) {
        return res.status(400).send("Invalid image URL");
      }
      const response = await fetch(imageUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
        }
      });
      if (!response.ok) {
        return res.status(response.status).send("Failed to fetch image");
      }
      const contentType = response.headers.get("content-type") || "image/jpeg";
      res.setHeader("Content-Type", contentType);
      res.setHeader("Cache-Control", "public, max-age=86400");
      const buffer = await response.arrayBuffer();
      return res.send(Buffer.from(buffer));
    } catch (e) {
      return res.status(500).send(e?.message || "Proxy error");
    }
  });
  app.post("/api/minimax-tts", async (req, res) => {
    try {
      const { text, apiKey, groupId, voiceId, speed, pitch, volume, model, language } = req.body || {};
      const keyToUse = apiKey;
      const groupIdToUse = groupId;
      if (!text) {
        return res.status(400).json({ success: false, error: "\u8BF7\u8F93\u5165\u9700\u8981\u5408\u6210\u7684\u6587\u672C\u5185\u5BB9\u3002" });
      }
      if (!keyToUse || !groupIdToUse) {
        return res.status(400).json({ success: false, error: "\u672A\u914D\u7F6E\u6709\u6548\u7684 Minimax API Key \u6216 Group ID\uFF0C\u8BF7\u5148\u5728\u8BBE\u7F6E\u4E2D\u586B\u5199\u3002" });
      }
      const langMap = {
        "\u4E2D\u6587": "Chinese",
        "\u7CA4\u8BED": "Chinese,Yue",
        "English": "English",
        "\u82F1\u8BED": "English",
        "\u65E5\u672C\u8A9E": "Japanese",
        "\u65E5\u8BED": "Japanese",
        "\uD55C\uAD6D\uC5B4": "Korean",
        "\u97E9\u8BED": "Korean",
        "Fran\xE7ais": "French",
        "\u6CD5\u8BED": "French",
        "Espa\xF1ol": "Spanish",
        "\u897F\u73ED\u7259\u8BED": "Spanish",
        "\u0420\u0443\u0441\u0441\u043A\u0438\u0439": "Russian",
        "\u4FC4\u8BED": "Russian",
        "Deutsch": "German",
        "\u5FB7\u8BED": "German",
        "Italiano": "Italian",
        "\u610F\u5927\u5229\u8BED": "Italian",
        "Portugu\xEAs": "Portuguese",
        "\u8461\u8404\u7259\u8BED": "Portuguese",
        "Ti\u1EBFng Vi\u1EC7t": "Vietnamese",
        "\u8D8A\u5357\u8BED": "Vietnamese",
        "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22": "Thai",
        "\u6CF0\u8BED": "Thai",
        "Bahasa Indonesia": "Indonesian",
        "\u5370\u5C3C\u8BED": "Indonesian",
        "\u0627\u0644\u0639\u0631\u0628\u064A\u0629": "Arabic",
        "\u963F\u62C9\u4F2F\u8BED": "Arabic"
      };
      const languageBoost = language && langMap[language] ? langMap[language] : "auto";
      const payload = {
        model: model || "speech-01-turbo",
        text,
        stream: false,
        language_boost: languageBoost,
        voice_setting: {
          voice_id: voiceId || "male-qn-qingse",
          speed: speed !== void 0 ? Number(speed) : 1,
          vol: volume !== void 0 ? Number(volume) : 1,
          pitch: pitch !== void 0 ? Math.round(Number(pitch)) : 0
        },
        audio_setting: {
          sample_rate: 32e3,
          bitrate: 128e3,
          format: "mp3",
          channel: 1
        }
      };
      let response = await fetch(`https://api.minimax.chat/v1/t2a_v2?GroupId=${groupIdToUse}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${keyToUse}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        response = await fetch(`https://api.minimax.chat/v1/text_to_speech_v2?GroupId=${groupIdToUse}`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${keyToUse}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ success: false, error: errText });
      }
      const jsonData = await response.json();
      if (jsonData.base_resp && jsonData.base_resp.status_code !== 0) {
        return res.status(400).json({
          success: false,
          error: jsonData.base_resp.status_msg || `Minimax \u9519\u8BEF (\u4EE3\u7801: ${jsonData.base_resp.status_code})`
        });
      }
      if (!jsonData.data || !jsonData.data.audio) {
        return res.status(400).json({ success: false, error: "Minimax \u672A\u8FD4\u56DE\u97F3\u9891\u6570\u636E\uFF0C\u8BF7\u68C0\u67E5\u97F3\u8272 ID \u662F\u5426\u6B63\u786E\u3002" });
      }
      const audioBuffer = Buffer.from(jsonData.data.audio, "hex");
      res.setHeader("Content-Type", "audio/mpeg");
      return res.send(audioBuffer);
    } catch (err) {
      console.error("Minimax TTS proxy error:", err);
      return res.status(500).json({ success: false, error: err.message || "\u670D\u52A1\u5668\u5185\u90E8\u9519\u8BEF\uFF0C\u5408\u6210\u5931\u8D25\u3002" });
    }
  });
  app.post("/api/shiye-generate-chapter", async (req, res) => {
    try {
      const {
        title,
        fanficType,
        status,
        summary,
        role1Name,
        role1Setting,
        role2Name,
        role2Setting,
        backgroundSetting,
        chapterIndex,
        customChapterTitle,
        chapterPrompt,
        previousChapterExcerpt,
        worldBookPrompt,
        apiKey,
        apiBaseUrl,
        selectedModel,
        temperature
      } = req.body || {};
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u68C0\u6D4B\u5230 API Key\uFF0C\u8BF7\u5148\u524D\u5F80\u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u914D\u7F6E\u60A8\u7684 API \u5BC6\u94A5\u540E\u518D\u4F7F\u7528 AI \u751F\u6210\u7AE0\u8282\u3002"
        });
      }
      const parsedTemp = temperature !== void 0 && !isNaN(Number(temperature)) ? Math.min(2, Math.max(0, Number(temperature))) : 0.85;
      const rawModel = normalizeGeminiModel(selectedModel);
      const isShort = fanficType === "\u77ED\u7BC7" || status === "\u77ED\u7BC7";
      const chapNum = Number(chapterIndex) || 1;
      const defaultTitle = isShort ? chapNum === 1 ? title || "\u77ED\u7BC7\u6B63\u6587" : `\u756A\u5916\xB7\u7B2C${chapNum - 1}\u7BC7` : `\u7B2C ${chapNum} \u7AE0`;
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt(`${title || ""}
${summary || ""}
${role1Name || ""}
${role2Name || ""}
${backgroundSetting || ""}
${chapterPrompt || ""}`);
      const systemPrompt = (isShort ? `\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u7EC6\u817B\u540C\u4EBA\u6587\u5199\u4F5C\u7684\u4F5C\u5BB6\u3002\u5F53\u524D\u4F5C\u54C1\u4E3A\u3010\u540C\u4EBA\u77ED\u7BC7\u3011\uFF0C\u8BF7\u521B\u4F5C\u4E00\u6BB5\u9AD8\u8D28\u91CF\u5B8C\u6574\u7684\u7BC7\u7AE0\uFF08\u5982\u4E3A\u7B2C 2 \u7BC7\u53CA\u4EE5\u4E0A\uFF0C\u5219\u4E3A\u7EED\u7BC7\u6216\u756A\u5916\u7BC7\uFF09\u3002
\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\uFF1A
1. \u7B2C\u4E00\u884C\u8BF7\u8F93\u51FA\u7BC7\u7AE0\u6807\u9898\uFF0C\u683C\u5F0F\u5982\uFF1A${customChapterTitle || defaultTitle}\uFF08\u5982\u679C\u662F\u77ED\u7BC7\uFF0C\u7EDD\u5BF9\u4E0D\u8981\u5305\u542B\u201C\u7B2CX\u7AE0\u201D\u5B57\u6837\uFF09\u3002
2. \u4ECE\u7B2C\u4E8C\u884C\u5F00\u59CB\u76F4\u63A5\u8F93\u51FA\u5C0F\u8BF4\u6B63\u6587\uFF0C\u60C5\u8282\u6709\u5934\u6709\u5C3E\uFF0C\u611F\u60C5\u9971\u6EE1\uFF0C\u5B57\u6570\u5728 1200~2000 \u5B57\u5DE6\u53F3\u3002` : `\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u7EC6\u817B\u6587\u5B66\u521B\u4F5C\u7684\u8D44\u6DF1\u540C\u4EBA\u5C0F\u8BF4\u4F5C\u5BB6\u3002\u8BF7\u4E25\u683C\u6839\u636E\u7528\u6237\u63D0\u4F9B\u7684\u3010\u540C\u4EBA\u6587\u4F5C\u54C1\u8BBE\u5B9A\u3011\uFF08\u5305\u542B\u4F5C\u54C1\u540D\u3001\u4F5C\u54C1\u7B80\u4ECB\u3001\u4E24\u4F4D\u4E3B\u89D2\u5404\u81EA\u7684\u4EBA\u8BBE\u3001\u4E16\u754C\u89C2\u4E0E\u80CC\u666F\u8BBE\u5B9A\uFF09\uFF0C\u521B\u4F5C\u7B2C ${chapNum} \u7AE0\u7684\u540C\u4EBA\u5C0F\u8BF4\u6B63\u6587\u3002
\u8F93\u51FA\u683C\u5F0F\u8981\u6C42\uFF1A
1. \u7B2C\u4E00\u884C\u8BF7\u8F93\u51FA\u7AE0\u8282\u6807\u9898\uFF0C\u683C\u5F0F\u5982\uFF1A\u7B2C ${chapNum} \u7AE0 \u6807\u9898\u540D\u79F0\uFF08\u5982\u679C\u7528\u6237\u5DF2\u6307\u5B9A\u6807\u9898\u5219\u76F4\u63A5\u4F7F\u7528\u8BE5\u6807\u9898\uFF09\u3002
2. \u4ECE\u7B2C\u4E8C\u884C\u5F00\u59CB\u76F4\u63A5\u8F93\u51FA\u5C0F\u8BF4\u6B63\u6587\u5185\u5BB9\uFF0C\u4E0D\u8981\u8F93\u51FA\u4EFB\u4F55\u591A\u4F59\u7684\u89E3\u91CA\u3001\u524D\u8A00\u3001\u603B\u7ED3\u6216\u8BBE\u5B9A\u590D\u8FF0\u3002
3. \u6587\u7B14\u7EC6\u817B\u81EA\u7136\uFF0C\u4EBA\u7269\u6027\u683C\u3001\u5BF9\u8BDD\u8BED\u6C14\u4E0E\u4E92\u52A8\u7EC6\u8282\u5FC5\u987B\u9AD8\u5EA6\u8D34\u5408\u4E24\u4F4D\u4E3B\u89D2\u7684\u8BBE\u5B9A\u4E0E\u80CC\u666F\u8BBE\u5B9A\uFF0C\u5B57\u6570\u5EFA\u8BAE\u5728 1000~2000 \u5B57\u5DE6\u53F3\u3002`) + (resolvedWbPrompt ? `

${resolvedWbPrompt}` : "");
      const userPrompt = `\u3010\u4F5C\u54C1\u540D\u79F0\u3011\uFF1A${title || "\u672A\u547D\u540D\u540C\u4EBA"}
\u3010\u7BC7\u5E45\u4E0E\u72B6\u6001\u3011\uFF1A${fanficType || "\u5C0F\u8BF4"}\uFF08${status || "\u8FDE\u8F7D\u4E2D"}\uFF09
\u3010\u4E3B\u89D2CP\u3011\uFF1A${role1Name || "\u4E3B\u89D21"} \xD7 ${role2Name || "\u4E3B\u89D22"}
\u3010\u4F5C\u54C1\u7B80\u4ECB\u3011\uFF1A${summary || "\u6682\u65E0\u7B80\u4ECB"}
\u3010${role1Name || "\u4E3B\u89D21"} \u89D2\u8272\u8BBE\u5B9A\u3011\uFF1A
${role1Setting || "\u9ED8\u8BA4\u8BBE\u5B9A"}
\u3010${role2Name || "\u4E3B\u89D22"} \u89D2\u8272\u8BBE\u5B9A\u3011\uFF1A
${role2Setting || "\u9ED8\u8BA4\u8BBE\u5B9A"}
\u3010\u4E16\u754C\u89C2\u4E0E\u80CC\u666F\u8BBE\u5B9A\u3011\uFF1A
${backgroundSetting || "\u65E5\u5E38\u884D\u751F\u80CC\u666F"}
${previousChapterExcerpt ? `\u3010\u4E0A\u4E00\u7AE0\u7ED3\u5C3E\u53C2\u8003\uFF08\u8BF7\u81EA\u7136\u627F\u63A5\u5267\u60C5\uFF09\u3011\uFF1A
${previousChapterExcerpt}
` : ""}
${customChapterTitle ? `\u3010\u6307\u5B9A\u672C\u7AE0\u6807\u9898\u3011\uFF1A${customChapterTitle}
` : ""}
${chapterPrompt ? `\u3010\u672C\u7AE0\u5267\u60C5\u8D70\u5411/\u8865\u5145\u8981\u6C42\u3011\uFF1A${chapterPrompt}
` : ""}
\u8BF7\u5F00\u59CB\u521B\u4F5C${isShort ? chapNum === 1 ? "\u5B8C\u6574\u540C\u4EBA\u77ED\u7BC7\u6B63\u6587" : "\u540C\u4EBA\u77ED\u7BC7\u756A\u5916/\u7EED\u7BC7" : `\u7B2C ${chapNum} \u7AE0`}\uFF1A`;
      const parseTitleAndBody = (rawText) => {
        const cleaned = rawText.trim();
        const lines = cleaned.split(/\r?\n/);
        let finalChapTitle = customChapterTitle?.trim() || defaultTitle;
        let finalBody = cleaned;
        if (lines.length >= 2) {
          const firstLine = lines[0].replace(/^[#*【\s]+|[#*】\s]+$/g, "").trim();
          if (firstLine.length > 0 && firstLine.length <= 40 && (firstLine.startsWith("\u7B2C") || firstLine.includes("\u7AE0") || firstLine.includes("\u756A\u5916") || firstLine.includes("\u7BC7") || customChapterTitle || isShort)) {
            finalChapTitle = customChapterTitle?.trim() || firstLine;
            finalBody = lines.slice(1).join("\n").trim();
          }
        }
        return { chapterTitle: finalChapTitle, chapterContent: finalBody };
      };
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible && apiBaseUrl) {
        let endpointUrl = apiBaseUrl.trim().replace(/\/+$/, "");
        if (!endpointUrl.endsWith("/chat/completions")) {
          if (endpointUrl.endsWith("/v1")) {
            endpointUrl += "/chat/completions";
          } else {
            endpointUrl += "/v1/chat/completions";
          }
        }
        const openAiResp = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: rawModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: parsedTemp
          })
        });
        if (!openAiResp.ok) {
          const errData = await openAiResp.json().catch(() => ({}));
          const errMsg = errData?.error?.message || errData?.message || `API \u8BF7\u6C42\u5931\u8D25 (HTTP ${openAiResp.status})`;
          return res.status(openAiResp.status).json({
            success: false,
            error: errMsg
          });
        }
        const data = await openAiResp.json();
        const reply = data.choices?.[0]?.message?.content || "";
        if (!reply.trim()) {
          return res.status(500).json({ success: false, error: "AI \u8FD4\u56DE\u5185\u5BB9\u4E3A\u7A7A\uFF0C\u8BF7\u91CD\u8BD5\u3002" });
        }
        const { chapterTitle: chapterTitle2, chapterContent: chapterContent2 } = parseTitleAndBody(reply);
        return res.json({
          success: true,
          chapterTitle: chapterTitle2,
          chapterContent: chapterContent2
        });
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build"
          }
        }
      });
      const modelCandidates = rawModel.toLowerCase().startsWith("gemini") ? Array.from(/* @__PURE__ */ new Set([rawModel, ...DEFAULT_GEMINI_MODELS])) : DEFAULT_GEMINI_MODELS;
      let generatedText = "";
      let lastErr = null;
      for (const mName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt
            }
          });
          if (response.text) {
            generatedText = response.text;
            break;
          }
        } catch (err) {
          lastErr = err;
        }
      }
      if (!generatedText.trim()) {
        return res.status(500).json({
          success: false,
          error: lastErr?.message || "AI \u7AE0\u8282\u751F\u6210\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 API \u8BBE\u7F6E\u3002"
        });
      }
      const { chapterTitle, chapterContent } = parseTitleAndBody(generatedText);
      return res.json({
        success: true,
        chapterTitle,
        chapterContent
      });
    } catch (err) {
      console.error("Shiye generate chapter error:", err);
      return res.status(500).json({
        success: false,
        error: err.message || "\u751F\u6210\u7AE0\u8282\u65F6\u53D1\u751F\u5F02\u5E38"
      });
    }
  });
  app.post("/api/shiye-generate-random-fanfics", async (req, res) => {
    try {
      const { worldBookPrompt, apiKey, apiBaseUrl, selectedModel, temperature } = req.body || {};
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u68C0\u6D4B\u5230 API Key\uFF0C\u8BF7\u5148\u524D\u5F80\u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u914D\u7F6E\u60A8\u7684 API \u5BC6\u94A5\u540E\u518D\u5237\u65B0\u751F\u6210\u540C\u4EBA\u6587\u3002"
        });
      }
      const parsedTemp = temperature !== void 0 && !isNaN(Number(temperature)) ? Math.min(2, Math.max(0, Number(temperature))) : 0.85;
      const rawModel = normalizeGeminiModel(selectedModel);
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt("");
      const systemPrompt = `\u4F60\u662F\u4E00\u4F4D\u521B\u610F\u65E0\u9650\u7684\u540C\u4EBA\u5C0F\u8BF4\u521B\u4F5C\u8005\u3002\u8BF7\u53D1\u6325\u5929\u9A6C\u884C\u7A7A\u7684\u60F3\u8C61\u529B\uFF0C\u968F\u673A\u751F\u6210 3 \u7BC7\u98CE\u683C\u8FE5\u5F02\u3001\u8BBE\u5B9A\u7CBE\u5F69\u7684\u540C\u4EBA\u6587\u4F5C\u54C1\u3002
\u8981\u6C42\u8F93\u51FA\u683C\u5F0F\uFF1A\u5FC5\u987B\u4E14\u4EC5\u8F93\u51FA\u4E00\u4E2A\u5408\u6CD5\u7684 JSON \u6570\u7EC4\uFF08JSON Array\uFF09\uFF0C\u4E0D\u80FD\u5305\u542B\u4EFB\u4F55 markdown \u4EE3\u7801\u5757\u5305\u56F4\u7B26\uFF08\u5982\u4E0D\u8981\u5305\u542B \`\`\`json \u5F00\u5934\u6216\u7ED3\u5C3E\uFF09\u3002
\u6BCF\u4E2A\u6570\u7EC4\u5143\u7D20\u5305\u542B\u4EE5\u4E0B\u5B57\u6BB5\uFF1A
1. "title": \u5438\u5F15\u4EBA\u7684\u4F5C\u54C1\u6807\u9898
2. "authorName": \u968F\u673A\u751F\u6210\u7684\u7279\u8272\u7B14\u540D\uFF08\u4F8B\u5982\uFF1A\u6C5F\u6C34\u5BD2\u3001\u6298\u7AF9\u3001\u5357\u98CE\u77E5\u6211\u610F\u3001\u767D\u9732\u4E3A\u971C\u3001\u9E64\u821F\u3001\u9752\u706F\u5BA2\u3001\u5FAE\u96E8\u71D5\u3001\u6A58\u5B50\u6D77\u3001\u4E34\u6E0A\u3001\u665A\u821F\u5F52\u3001\u534A\u5377\u6E05\u98CE\u3001\u5C81\u5C81\u5B89\u7B49\uFF0C\u7981\u6B62\u4F7F\u7528\u56FA\u5B9A\u7684\u201CAI\u7075\u611F\u521B\u4F5C\u8005\u201D\uFF09
3. "characters": "\u4E3B\u89D2A \xD7 \u4E3B\u89D2B"
4. "role1Name": "\u4E3B\u89D2A\u540D\u5B57"
5. "role1Setting": "\u89D2\u82721\u5177\u4F53\u4EBA\u8BBE\u4E0E\u6027\u683C\u7279\u8272"
6. "role2Name": "\u4E3B\u89D2B\u540D\u5B57"
7. "role2Setting": "\u89D2\u82722\u5177\u4F53\u4EBA\u8BBE\u4E0E\u6027\u683C\u7279\u8272"
8. "pairMode": "char_char" \u6216 "user_char"
9. "fanficType": \u968F\u673A\u4ECE ["\u5C0F\u8BF4", "\u77ED\u7BC7"] \u4E2D\u9009\u62E9
10. "status": \u91CD\u8981\u89C4\u5219\uFF1A\u5982\u679C fanficType \u662F "\u5C0F\u8BF4"\uFF0Cstatus \u5FC5\u987B\u4E25\u683C\u4E3A "\u8FDE\u8F7D\u4E2D"\uFF1B\u5982\u679C fanficType \u662F "\u77ED\u7BC7"\uFF0Cstatus \u5FC5\u987B\u4E25\u683C\u4E3A "\u77ED\u7BC7"
11. "tags": \u5305\u542B 2-4 \u4E2A\u5206\u7C7B\u6807\u7B7E\u7684\u6570\u7EC4\uFF0C\u9009\u81EA ["\u6821\u56ED", "\u73B0\u4EE3", "\u67B6\u7A7A", "ABO", "\u5947\u5E7B", "\u53E4\u98CE", "\u65E0\u9650\u6D41", "\u7834\u955C\u91CD\u5706", "\u5F3A\u5F3A", "\u6551\u8D4E", "\u751C\u6587", "\u79D1\u5E7B", "\u65E5\u5E38"] \u52A0\u4E0A ["\u63A8\u8350"]
12. "summary": 100\u5B57\u5DE6\u53F3\u7684\u9AD8\u8D28\u91CF\u7CBE\u70BC\u4F5C\u54C1\u7B80\u4ECB
14. "chapters": \u91CD\u8981\u5DEE\u5F02\u89C4\u5219\uFF08\u957F\u7BC7\u5C0F\u8BF4\u4E0E\u540C\u4EBA\u77ED\u7BC7\u7ED3\u6784\u5FC5\u987B\u622A\u7136\u4E0D\u540C\uFF09\uFF1A
    - \u5982\u679C\u662F\u3010\u5C0F\u8BF4\u3011\uFF08status\u4E3A\u8FDE\u8F7D\u4E2D\uFF09\uFF1Achapters \u5305\u542B\u7B2C\u4E00\u7AE0\u6B63\u6587\uFF0Ctitle \u5FC5\u987B\u5F62\u5982 "\u7B2C 1 \u7AE0 \u7AE0\u8282\u5C0F\u6807\u9898"\uFF0Ccontent \u4E3A\u957F\u7BC7\u5C0F\u8BF4\u7684\u7CBE\u5F69\u5F00\u5C40\uFF1B
    - \u5982\u679C\u662F\u3010\u77ED\u7BC7\u3011\uFF08status\u4E3A\u77ED\u7BC7\uFF09\uFF1Achapters \u5FC5\u987B\u662F\u4E00\u7BC7\u6709\u5934\u6709\u5C3E\u3001\u60C5\u8282\u5B8C\u6574\u72EC\u7ACB\u7684\u77ED\u7BC7\u6545\u4E8B\uFF08\u975E\u8FDE\u8F7D\u622A\u65AD\uFF09\uFF0Ctitle \u7EDD\u5BF9\u4E0D\u80FD\u5E26\u6709\u201C\u7B2C1\u7AE0\u201D\u6216\u201C\u7B2C\u4E00\u7AE0\u201D\uFF0C\u800C\u662F\u76F4\u63A5\u663E\u793A\u77ED\u7BC7\u81EA\u8EAB\u6807\u9898\uFF08\u5373\u548C title \u4E00\u81F4\u6216\u76F4\u63A5\u4E3A\u77ED\u7BC7\u7BC7\u540D\uFF09\uFF0Ccontent \u4E3A\u8D77\u627F\u8F6C\u5408\u5B8C\u6574\u3001\u611F\u60C5\u9971\u6EE1\u7684\u5B8C\u6574\u77ED\u7BC7\u3002` + (resolvedWbPrompt ? `

${resolvedWbPrompt}` : "");
      const userPrompt = `\u8BF7\u7ACB\u5373\u751F\u6210 3 \u7BC7\u5168\u65B0\u968F\u673A\u540C\u4EBA\u6587\u4F5C\u54C1\uFF08\u5FC5\u987B\u5305\u542B\u957F\u7BC7\u5C0F\u8BF4\u3010\u8FDE\u8F7D\u4E2D\uFF0C\u7B2C\u4E00\u7AE0\u3011\u4E0E\u540C\u4EBA\u77ED\u7BC7\u3010\u77ED\u7BC7\uFF0C\u6807\u9898\u76F4\u63A5\u4E3A\u7BC7\u540D\u4E14\u6B63\u6587\u5B8C\u6574\u6709\u5934\u6709\u5C3E\u3011\uFF0C\u4F5C\u8005\u540D\u968F\u673A\uFF09\u7684\u7EAF JSON \u6570\u7EC4\uFF1A`;
      const parseFanficsJson = (rawText) => {
        let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        const first = cleaned.indexOf("[");
        const last = cleaned.lastIndexOf("]");
        if (first !== -1 && last !== -1) {
          cleaned = cleaned.substring(first, last + 1);
        }
        return JSON.parse(cleaned);
      };
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible && apiBaseUrl) {
        let endpointUrl = apiBaseUrl.trim().replace(/\/+$/, "");
        if (!endpointUrl.endsWith("/chat/completions")) {
          if (endpointUrl.endsWith("/v1")) endpointUrl += "/chat/completions";
          else endpointUrl += "/v1/chat/completions";
        }
        const openAiResp = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: rawModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: parsedTemp
          })
        });
        if (openAiResp.ok) {
          const data = await openAiResp.json();
          const reply = data.choices?.[0]?.message?.content || "";
          if (reply.trim()) {
            try {
              const fanficsList = parseFanficsJson(reply);
              if (Array.isArray(fanficsList) && fanficsList.length > 0) {
                return res.json({ success: true, fanfics: fanficsList });
              }
            } catch (e) {
            }
          }
        }
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const modelCandidates = rawModel.toLowerCase().startsWith("gemini") ? Array.from(/* @__PURE__ */ new Set([rawModel, ...DEFAULT_GEMINI_MODELS])) : DEFAULT_GEMINI_MODELS;
      let replyText = "";
      for (const mName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: userPrompt,
            config: {
              systemInstruction: systemPrompt
            }
          });
          if (response.text) {
            replyText = response.text;
            break;
          }
        } catch (e) {
        }
      }
      if (replyText.trim()) {
        try {
          const fanficsList = parseFanficsJson(replyText);
          if (Array.isArray(fanficsList) && fanficsList.length > 0) {
            return res.json({ success: true, fanfics: fanficsList });
          }
        } catch (e) {
        }
      }
      return res.status(500).json({ success: false, error: "AI \u54CD\u5E94\u683C\u5F0F\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 API \u8BBE\u7F6E\u540E\u91CD\u8BD5\u3002" });
    } catch (err) {
      console.error("Shiye generate random fanfics error:", err);
      return res.status(500).json({ success: false, error: err.message || "\u751F\u6210\u968F\u673A\u540C\u4EBA\u6587\u5931\u8D25" });
    }
  });
  app.post("/api/shiye-generate-essays", async (req, res) => {
    try {
      const {
        mode = "random",
        characterName,
        characterPersona,
        customTitle,
        essayType,
        worldBookPrompt,
        apiKey,
        apiBaseUrl,
        selectedModel,
        temperature
      } = req.body || {};
      const keyToUse = apiKey || process.env.GEMINI_API_KEY;
      if (!keyToUse) {
        return res.status(400).json({
          success: false,
          error: "\u672A\u68C0\u6D4B\u5230 API Key\uFF0C\u8BF7\u5148\u524D\u5F80\u624B\u673A\u3010\u8BBE\u7F6E -> API\u8BBE\u7F6E\u3011\u914D\u7F6E\u60A8\u7684 API \u5BC6\u94A5\u540E\u518D\u751F\u6210\u968F\u7B14\u3002"
        });
      }
      const parsedTemp = temperature !== void 0 && !isNaN(Number(temperature)) ? Math.min(2, Math.max(0, Number(temperature))) : 0.85;
      const rawModel = normalizeGeminiModel(selectedModel);
      const resolvedWbPrompt = worldBookPrompt || getServerWorldBookPrompt("");
      const isCharacterMode = mode === "character";
      const resolvedType = essayType || "\u8BB0\u53D9\u968F\u7B14";
      const systemPrompt = (isCharacterMode ? `\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u6563\u6587\u4E0E\u968F\u7B14\u521B\u4F5C\u7684\u6587\u5B66\u4F5C\u8005\u3002\u8BF7\u4EE5\u89D2\u8272\u300C${characterName || "\u533F\u540D\u89D2\u8272"}\u300D\u7684\u53E3\u543B\u3001\u89C6\u89D2\u4E0E\u65E5\u5E38\u5FC3\u5883\uFF0C\u64B0\u5199 1 \u7BC7\u3010${resolvedType}\u3011\u3002
\u8981\u6C42\uFF1A\u5FC5\u987B\u4E14\u4EC5\u8F93\u51FA\u4E00\u4E2A\u5408\u6CD5\u7684 JSON \u5BF9\u8C61\uFF08\u4E0D\u80FD\u5305\u542B markdown \u4EE3\u7801\u5757\u6807\u8BB0\uFF09\uFF0C\u5305\u542B\u5B57\u6BB5\uFF1A"title"\uFF08${customTitle ? `\u5FC5\u987B\u4E25\u683C\u4E3A\u300C${customTitle}\u300D` : "\u7B80\u6D01\u6709\u4F59\u97F5\u7684\u6807\u9898"}\uFF09\u3001"essayType"\uFF08\u4E25\u683C\u4E3A "${resolvedType}"\uFF09\u3001"content"\uFF08500~1000\u5B57\u5DE6\u53F3\u7684\u6B63\u6587\uFF0C\u5951\u5408\u300C${resolvedType}\u300D\u4F53\u88C1\u4E0E\u89D2\u8272\u8BBE\u5B9A\uFF09\u3002` : `\u4F60\u662F\u4E00\u4F4D\u64C5\u957F\u73B0\u4EE3\u6563\u6587\u4E0E\u968F\u7B14\u521B\u4F5C\u7684\u6587\u5B66\u4F5C\u8005\u3002\u8BF7\u968F\u673A\u521B\u4F5C 3 \u7BC7\u98CE\u683C\u5404\u5F02\u3001\u8D28\u611F\u7EC6\u817B\u7684\u72EC\u7ACB\u968F\u7B14\uFF0C\u6DB5\u76D6\u4E0D\u540C\u4F53\u88C1\uFF08\u4ECE\u300C\u8BB0\u53D9\u968F\u7B14\u300D\u300C\u6292\u60C5\u968F\u7B14\u300D\u300C\u610F\u8BC6\u6D41\u968F\u7B14\u300D\u300C\u6742\u6587\u300D\u4E2D\u9009\u62E9\uFF09\u3002
\u8981\u6C42\uFF1A\u5FC5\u987B\u4E14\u4EC5\u8F93\u51FA\u4E00\u4E2A\u5408\u6CD5\u7684 JSON \u6570\u7EC4\uFF08\u4E0D\u80FD\u5305\u542B markdown \u4EE3\u7801\u5757\u6807\u8BB0\uFF09\uFF0C\u6BCF\u4E2A\u5143\u7D20\u5305\u542B\u5B57\u6BB5\uFF1A"title"\u3001"essayType"\uFF08\u5FC5\u987B\u4E3A "\u8BB0\u53D9\u968F\u7B14"\u3001"\u6292\u60C5\u968F\u7B14"\u3001"\u610F\u8BC6\u6D41\u968F\u7B14" \u6216 "\u6742\u6587" \u4E4B\u4E00\uFF09\u3001"content"\uFF08450~900\u5B57\u968F\u7B14\u6B63\u6587\uFF09\u3002`) + (resolvedWbPrompt ? `

${resolvedWbPrompt}` : "");
      const userPrompt = isCharacterMode ? `\u3010\u89D2\u8272\u540D\u79F0\u3011\uFF1A${characterName || "\u89D2\u8272"}
\u3010\u89D2\u8272\u8BBE\u5B9A\u3011\uFF1A${characterPersona || "\u9ED8\u8BA4\u8BBE\u5B9A"}
\u3010\u968F\u7B14\u4F53\u88C1\u3011\uFF1A${resolvedType}
${customTitle ? `\u3010\u6307\u5B9A\u6807\u9898\u3011\uFF1A${customTitle}
` : ""}\u8BF7\u8F93\u51FA\u5408\u6CD5\u7684 JSON \u5BF9\u8C61\uFF1A` : "\u8BF7\u7ACB\u5373\u521B\u4F5C 3 \u7BC7\u98CE\u683C\u4E0D\u540C\u7684\u9AD8\u8D28\u91CF\u968F\u7B14\uFF08JSON \u6570\u7EC4\uFF09\uFF1A";
      const parseEssaysResponse = (rawText) => {
        let cleaned = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();
        if (isCharacterMode) {
          const first = cleaned.indexOf("{");
          const last = cleaned.lastIndexOf("}");
          if (first !== -1 && last !== -1) cleaned = cleaned.substring(first, last + 1);
          const obj = JSON.parse(cleaned);
          if (obj && obj.content) {
            return [
              {
                title: customTitle?.trim() || obj.title || "\u65E0\u9898",
                essayType: obj.essayType || resolvedType,
                content: String(obj.content).trim(),
                characterName: characterName || ""
              }
            ];
          }
        } else {
          const first = cleaned.indexOf("[");
          const last = cleaned.lastIndexOf("]");
          if (first !== -1 && last !== -1) cleaned = cleaned.substring(first, last + 1);
          const arr = JSON.parse(cleaned);
          if (Array.isArray(arr) && arr.length > 0) return arr;
        }
        return null;
      };
      const isOpenAiCompatible = !!apiBaseUrl || !rawModel.toLowerCase().startsWith("gemini");
      if (isOpenAiCompatible && apiBaseUrl) {
        let endpointUrl = apiBaseUrl.trim().replace(/\/+$/, "");
        if (!endpointUrl.endsWith("/chat/completions")) {
          if (endpointUrl.endsWith("/v1")) endpointUrl += "/chat/completions";
          else endpointUrl += "/v1/chat/completions";
        }
        const openAiResp = await fetch(endpointUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${keyToUse}`
          },
          body: JSON.stringify({
            model: rawModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt }
            ],
            temperature: parsedTemp
          })
        });
        if (openAiResp.ok) {
          const data = await openAiResp.json();
          const reply = data.choices?.[0]?.message?.content || "";
          if (reply.trim()) {
            try {
              const list = parseEssaysResponse(reply);
              if (list) return res.json({ success: true, essays: list });
            } catch {
            }
          }
        }
      }
      const ai = new import_genai.GoogleGenAI({
        apiKey: keyToUse,
        httpOptions: { headers: { "User-Agent": "aistudio-build" } }
      });
      const modelCandidates = rawModel.toLowerCase().startsWith("gemini") ? Array.from(/* @__PURE__ */ new Set([rawModel, ...DEFAULT_GEMINI_MODELS])) : DEFAULT_GEMINI_MODELS;
      let replyText = "";
      for (const mName of modelCandidates) {
        try {
          const response = await ai.models.generateContent({
            model: mName,
            contents: userPrompt,
            config: { systemInstruction: systemPrompt }
          });
          if (response.text) {
            replyText = response.text;
            break;
          }
        } catch {
        }
      }
      if (replyText.trim()) {
        try {
          const list = parseEssaysResponse(replyText);
          if (list) return res.json({ success: true, essays: list });
        } catch {
        }
      }
      return res.status(500).json({ success: false, error: "AI \u54CD\u5E94\u683C\u5F0F\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5 API \u8BBE\u7F6E\u540E\u91CD\u8BD5\u3002" });
    } catch (err) {
      console.error("Shiye generate essays error:", err);
      return res.status(500).json({ success: false, error: err.message || "\u751F\u6210\u968F\u7B14\u5931\u8D25" });
    }
  });
  const validateSafeHttpUrl = (rawUrl) => {
    try {
      const parsed = new URL(rawUrl.trim());
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
      const host = parsed.hostname.toLowerCase();
      if (host === "localhost" || host === "127.0.0.1" || host === "0.0.0.0" || host === "::1" || host.endsWith(".local") || /^10\./.test(host) || /^192\.168\./.test(host) || /^169\.254\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) {
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  };
  const parseMcpJsonOrSse = (rawText) => {
    const trimmed = rawText.trim();
    if (!trimmed) return null;
    try {
      return JSON.parse(trimmed);
    } catch {
      const lines = trimmed.split(/\r?\n/);
      let lastParsed = null;
      for (const line of lines) {
        if (line.startsWith("data:")) {
          const payload = line.slice(5).trim();
          if (payload && payload !== "[DONE]") {
            try {
              lastParsed = JSON.parse(payload);
            } catch {
            }
          }
        }
      }
      return lastParsed;
    }
  };
  const sendMcpJsonRpc = async (endpoint, method, params, extraHeaders, sessionId) => {
    const headers = {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...extraHeaders || {}
    };
    if (sessionId) {
      headers["mcp-session-id"] = sessionId;
    }
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12e3);
    try {
      const resp = await fetch(endpoint, {
        method: "POST",
        headers,
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: Date.now(),
          method,
          params: params || {}
        }),
        signal: controller.signal
      });
      const text = await resp.text();
      const respSessionId = resp.headers.get("mcp-session-id") || sessionId;
      const parsed = parseMcpJsonOrSse(text);
      if (!resp.ok) {
        throw new Error(parsed?.error?.message || `HTTP ${resp.status}: ${text.slice(0, 160)}`);
      }
      if (parsed?.error) {
        throw new Error(parsed.error.message || JSON.stringify(parsed.error));
      }
      return {
        data: parsed?.result ?? parsed,
        sessionId: respSessionId
      };
    } finally {
      clearTimeout(timer);
    }
  };
  app.post("/api/mcp/probe", async (req, res) => {
    const startedAt = Date.now();
    try {
      const { url, headers } = req.body || {};
      const parsedUrl = validateSafeHttpUrl(String(url || ""));
      if (!parsedUrl) {
        return res.status(400).json({
          ok: false,
          error: "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u516C\u7F51 HTTP/HTTPS MCP \u670D\u52A1\u5730\u5740\uFF08\u4E0D\u652F\u6301\u5185\u7F51\u6216\u672C\u5730\u56DE\u73AF\u5730\u5740\uFF09\u3002"
        });
      }
      const safeHeaders = {};
      if (headers && typeof headers === "object") {
        for (const [k, v] of Object.entries(headers)) {
          if (typeof v === "string" && k.trim()) {
            safeHeaders[k.trim()] = v;
          }
        }
      }
      let sessionId;
      let serverInfo = null;
      try {
        const initResp = await sendMcpJsonRpc(
          parsedUrl.toString(),
          "initialize",
          {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "ai-phone-mcp-client", version: "1.0.0" }
          },
          safeHeaders
        );
        sessionId = initResp.sessionId;
        serverInfo = initResp.data?.serverInfo || null;
      } catch {
      }
      const toolsResp = await sendMcpJsonRpc(
        parsedUrl.toString(),
        "tools/list",
        {},
        safeHeaders,
        sessionId
      );
      const rawTools = Array.isArray(toolsResp.data?.tools) ? toolsResp.data.tools : [];
      const tools = rawTools.map((t) => ({
        name: String(t?.name || "unknown_tool"),
        description: String(t?.description || ""),
        inputSchema: t?.inputSchema || { type: "object", properties: {} }
      }));
      return res.json({
        ok: true,
        serverInfo,
        tools,
        latencyMs: Date.now() - startedAt
      });
    } catch (err) {
      return res.status(200).json({
        ok: false,
        error: err?.name === "AbortError" ? "\u8FDE\u63A5 MCP \u670D\u52A1\u8D85\u65F6\uFF0812s\uFF09" : err?.message || "MCP \u63A2\u6D4B\u5931\u8D25",
        latencyMs: Date.now() - startedAt
      });
    }
  });
  app.post("/api/mcp/call", async (req, res) => {
    const startedAt = Date.now();
    try {
      const { url, headers, toolName, arguments: toolArgs } = req.body || {};
      const parsedUrl = validateSafeHttpUrl(String(url || ""));
      if (!parsedUrl) {
        return res.status(400).json({
          ok: false,
          error: "\u65E0\u6548\u7684 MCP \u670D\u52A1 URL\u3002"
        });
      }
      if (!toolName || typeof toolName !== "string") {
        return res.status(400).json({ ok: false, error: "\u7F3A\u5C11\u5DE5\u5177\u540D\u79F0\u3002" });
      }
      const safeHeaders = {};
      if (headers && typeof headers === "object") {
        for (const [k, v] of Object.entries(headers)) {
          if (typeof v === "string" && k.trim()) {
            safeHeaders[k.trim()] = v;
          }
        }
      }
      let sessionId;
      try {
        const initResp = await sendMcpJsonRpc(
          parsedUrl.toString(),
          "initialize",
          {
            protocolVersion: "2024-11-05",
            capabilities: {},
            clientInfo: { name: "ai-phone-mcp-client", version: "1.0.0" }
          },
          safeHeaders
        );
        sessionId = initResp.sessionId;
      } catch {
      }
      const callResp = await sendMcpJsonRpc(
        parsedUrl.toString(),
        "tools/call",
        {
          name: toolName,
          arguments: toolArgs && typeof toolArgs === "object" ? toolArgs : {}
        },
        safeHeaders,
        sessionId
      );
      return res.json({
        ok: true,
        result: callResp.data,
        latencyMs: Date.now() - startedAt
      });
    } catch (err) {
      return res.status(200).json({
        ok: false,
        error: err?.name === "AbortError" ? "\u8C03\u7528 MCP \u5DE5\u5177\u8D85\u65F6\uFF0812s\uFF09" : err?.message || "MCP \u5DE5\u5177\u8C03\u7528\u5931\u8D25",
        latencyMs: Date.now() - startedAt
      });
    }
  });
  app.post("/api/mcp/fetch", async (req, res) => {
    const startedAt = Date.now();
    try {
      const { url, maxLength } = req.body || {};
      const parsedUrl = validateSafeHttpUrl(String(url || ""));
      if (!parsedUrl) {
        return res.status(400).json({
          ok: false,
          error: "\u8BF7\u8F93\u5165\u6709\u6548\u7684\u516C\u7F51 HTTP/HTTPS \u7F51\u9875\u5730\u5740\u3002"
        });
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 1e4);
      try {
        const resp = await fetch(parsedUrl.toString(), {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; AIPhoneMCP/1.0)",
            Accept: "text/html,application/json,text/plain,*/*"
          },
          signal: controller.signal
        });
        const raw = await resp.text();
        const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const title = titleMatch ? titleMatch[1].replace(/\s+/g, " ").trim() : parsedUrl.hostname;
        const cleaned = raw.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">").replace(/\s+/g, " ").trim();
        const limit = Math.min(Math.max(Number(maxLength) || 1200, 100), 4e3);
        return res.json({
          ok: true,
          url: parsedUrl.toString(),
          status: resp.status,
          title,
          content: cleaned.slice(0, limit),
          truncated: cleaned.length > limit,
          latencyMs: Date.now() - startedAt
        });
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      return res.status(200).json({
        ok: false,
        error: err?.name === "AbortError" ? "\u6293\u53D6\u7F51\u9875\u8D85\u65F6\uFF0810s\uFF09" : err?.message || "\u7F51\u9875\u6293\u53D6\u5931\u8D25",
        latencyMs: Date.now() - startedAt
      });
    }
  });
  const httpServer = import_http.default.createServer(app);
  httpServer.on("clientError", (err, socket) => {
    if (err?.code === "ECONNRESET" || !socket.writable) return;
    try {
      socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
    } catch {
    }
  });
  httpServer.on("error", (err) => {
    console.error("[AI Phone] HTTP server error:", err);
  });
  if (process.env.NODE_ENV !== "production") {
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await (0, import_vite.createServer)({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : {}
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  httpServer.listen(PORT, HOST, () => {
    console.log(`[AI Phone] Server running on http://${HOST}:${PORT}`);
  });
}
process.on("unhandledRejection", (reason) => {
  console.error("[AI Phone] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[AI Phone] Uncaught exception:", err);
});
startServer().catch((err) => {
  console.error("Failed to start server:", err);
});
//# sourceMappingURL=server.cjs.map
