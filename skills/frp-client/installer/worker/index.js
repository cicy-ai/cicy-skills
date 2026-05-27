var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/index.js
var HELP_TEXT = `CiCy FRP installer

macOS / Linux:
  curl -fsSL https://install.cicy-ai.com/frp | bash

Windows PowerShell:
  $u='https://install.cicy-ai.com/frp'
  $p=Join-Path $env:TEMP 'install-frpc-client.ps1'
  irm $u -OutFile $p; powershell -ExecutionPolicy Bypass -File $p
`;
var index_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed\n", {
        status: 405,
        headers: { Allow: "GET, HEAD" }
      });
    }
    if (url.pathname === "/" || url.pathname === "") {
      return new Response(HELP_TEXT, {
        headers: textHeaders("text/plain; charset=utf-8", env.CACHE_MAX_AGE)
      });
    }
    if (url.pathname === "/frp") {
      const variant = detectVariant(request);
      if (variant === "powershell") {
        return proxyScript(request, env, env.POWERSHELL_SCRIPT_URL, "text/plain; charset=utf-8", ctx, variant);
      }
      return proxyScript(request, env, env.SHELL_SCRIPT_URL, "text/x-shellscript; charset=utf-8", ctx, variant);
    }
    return new Response("Not Found\n", {
      status: 404,
      headers: textHeaders("text/plain; charset=utf-8", env.CACHE_MAX_AGE)
    });
  }
};
async function proxyScript(request, env, upstreamUrl, contentType, ctx, variant) {
  const cache = caches.default;
  const cacheUrl = new URL(request.url);
  cacheUrl.searchParams.set("__variant", variant);
  const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
  const cached = await cache.match(cacheKey);
  if (cached) {
    return cached;
  }
  const upstream = await fetch(upstreamUrl, {
    headers: {
      "User-Agent": "install-cicy-ai-worker"
    },
    cf: {
      cacheTtl: 300,
      cacheEverything: true
    }
  });
  if (!upstream.ok) {
    return new Response(`Upstream fetch failed: ${upstream.status}
`, {
      status: 502,
      headers: textHeaders("text/plain; charset=utf-8", "30")
    });
  }
  const body = rewriteScript(await upstream.text());
  const response = new Response(body, {
    status: 200,
    headers: textHeaders(contentType, env.CACHE_MAX_AGE)
  });
  ctx.waitUntil(cache.put(cacheKey, response.clone()));
  return response;
}
__name(proxyScript, "proxyScript");
function rewriteScript(body) {
  return body.replaceAll(
    "https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-code/main/skills/scripts/frp/install-frpc-client.sh",
    "https://install.cicy-ai.com/frp"
  ).replaceAll(
    "https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-code/main/skills/scripts/frp/install-frpc-client.ps1",
    "https://install.cicy-ai.com/frp"
  ).replaceAll(
    "https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.sh",
    "https://install.cicy-ai.com/frp"
  ).replaceAll(
    "https://gh-proxy.com/https://raw.githubusercontent.com/cicy-ai/cicy-skills/main/scripts/frp/install-frpc-client.ps1",
    "https://install.cicy-ai.com/frp"
  );
}
__name(rewriteScript, "rewriteScript");
function detectVariant(request) {
  const userAgent = (request.headers.get("user-agent") || "").toLowerCase();
  if (userAgent.includes("powershell") || userAgent.includes("windowspowershell")) {
    return "powershell";
  }
  return "shell";
}
__name(detectVariant, "detectVariant");
function textHeaders(contentType, maxAge) {
  return {
    "content-type": contentType,
    "cache-control": `public, max-age=${normalizeSeconds(maxAge)}`,
    "x-content-type-options": "nosniff"
  };
}
__name(textHeaders, "textHeaders");
function normalizeSeconds(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return "300";
  }
  return String(parsed);
}
__name(normalizeSeconds, "normalizeSeconds");
export {
  index_default as default
};
//# sourceMappingURL=index.js.map
