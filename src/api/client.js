import { getApiUrl } from "./config.js";
import { getToken, getRefreshToken, setToken, setRefreshToken, clearToken } from "./token.js";

let onUnauthorized = () => {};
let refreshInFlight = null;

export function setOnUnauthorized(fn) {
  onUnauthorized = fn;
}

function isAuthPublicRequest(path) {
  return path.includes("/api/v1/auth/login") || path.includes("/api/v1/auth/refresh");
}

function unwrapApiResponse(payload) {
  if (!payload || typeof payload !== "object") return payload;

  const success = payload.success ?? payload.Success;
  const data = payload.data ?? payload.Data;
  const message = (payload.message ?? payload.Message) || "Error de API";

  if (Object.prototype.hasOwnProperty.call(payload, "success") || Object.prototype.hasOwnProperty.call(payload, "Success")) {
    if (!success) {
      const err = new Error(message);
      err.data = data;
      throw err;
    }
    return data;
  }
  
  return payload;
}

async function runRefreshTokenFlow() {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    const url = `${getApiUrl()}/api/v1/auth/refresh`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const data = unwrapApiResponse(json);
    if (!data?.accessToken) return null;
    setToken(data.accessToken);
    if (data.refreshToken) setRefreshToken(data.refreshToken);
    return data.accessToken;
  })();

  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function parseApiErrorMessageFromBody(text) {
  if (text == null || typeof text !== "string") return "";
  let errMsg = text;
  try {
    const data = JSON.parse(text);
    errMsg =
      data.message ||
      data.Message ||
      data.error ||
      data.Error ||
      data.title ||
      data.Title ||
      (typeof data.errors === "string" ? data.errors : null) ||
      text;
  } catch (_) {}
  return typeof errMsg === "string" && errMsg.trim() ? errMsg.trim() : "";
}

function throwHttpError(status, bodyText) {
  const msg = parseApiErrorMessageFromBody(bodyText) || `Error HTTP ${status}`;
  const err = new Error(msg);
  err.status = status;
  throw err;
}

async function request(path, options = {}, retryOnUnauthorized = true, withEnvelope = false) {
  const url = `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  let headers = {
    ...options.headers,
  };
  
  // Agregar Content-Type solo si no es FormData
  if (!(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (!isAuthPublicRequest(path) && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const config = {
    ...options,
    headers,
  };
  if (options.body !== undefined && options.body !== null && !(options.body instanceof FormData)) {
    config.body = JSON.stringify(options.body);
  }
  const res = await fetch(url, config);
  if (res.status === 401) {
    if (retryOnUnauthorized && !isAuthPublicRequest(path)) {
      const newAccessToken = await runRefreshTokenFlow();
      if (newAccessToken) return request(path, options, false, withEnvelope);
    }
    clearToken();
    onUnauthorized();
    throw new Error("No autorizado");
  }
  if (!res.ok) {
    const text = await res.text();
    throwHttpError(res.status, text);
  }
  if (res.status === 204) return null;
  const json = await res.json();
  if (withEnvelope) {
    const message =
      json && typeof json === "object"
        ? json.message || json.Message || ""
        : "";
    const data = unwrapApiResponse(json);
    return { data, message: typeof message === "string" ? message : String(message || "") };
  }
  return unwrapApiResponse(json);
}

/**
 * GET con Authorization y refresh de token (respuesta no JSON: PDF, binarios).
 */
export async function fetchWithAuth(path, options = {}, retryOnUnauthorized = true) {
  const url = `${getApiUrl()}${path.startsWith("/") ? path : `/${path}`}`;
  const token = getToken();
  let headers = { ...options.headers };
  if (!(options.body instanceof FormData) && options.body != null && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  if (!isAuthPublicRequest(path) && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  let res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    if (retryOnUnauthorized && !isAuthPublicRequest(path)) {
      const newAccessToken = await runRefreshTokenFlow();
      if (newAccessToken) {
        headers.Authorization = `Bearer ${newAccessToken}`;
        res = await fetch(url, { ...options, headers });
      } else {
        clearToken();
        onUnauthorized();
      }
    } else if (!isAuthPublicRequest(path)) {
      clearToken();
      onUnauthorized();
    }
  }
  return res;
}

/**
 * Descarga binaria (p. ej. ticket PDF). Errores JSON de ApiResponse se convierten en Error con mensaje.
 */
export async function fetchBlob(path) {
  const res = await fetchWithAuth(path, { method: "GET" });
  const ct = (res.headers.get("content-type") || "").toLowerCase();
  if (!res.ok) {
    const text = await res.text();
    throwHttpError(res.status, text);
  }
  if (ct.includes("application/json")) {
    const json = await res.json();
    return unwrapApiResponse(json);
  }
  return res.blob();
}

function isLikelyZipOrOfficeBinary(bytes) {
  if (!bytes || bytes.length < 2) return false;
  if (bytes[0] === 0x50 && bytes[1] === 0x4b) return true;
  if (bytes[0] === 0xd0 && bytes[1] === 0xcf) return true;
  return false;
}

/**
 * Exportaciones Excel: distingue .xlsx (ZIP) de JSON envuelto o respuestas erróneas tipo «OK».
 */
export async function fetchExportBlob(path) {
  const res = await fetchWithAuth(path, { method: "GET" });
  const buf = await res.arrayBuffer();
  const bytes = new Uint8Array(buf);

  if (!res.ok) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    throwHttpError(res.status, text);
  }

  if (isLikelyZipOrOfficeBinary(bytes)) {
    return new Blob([buf], {
      type:
        res.headers.get("content-type") ||
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const trimmed = text.trimStart();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const data = JSON.parse(text);
      const success = data.success ?? data.Success;
      const msg = String(data.message ?? data.Message ?? "").trim();
      if (success === false) {
        throw new Error(msg || "Error al exportar.");
      }
      throw new Error(
        msg ||
          "El servidor respondió JSON en lugar del archivo. Revisar endpoint de exportación o Content-Type."
      );
    } catch (e) {
      if (e instanceof SyntaxError) {
        return new Blob([buf], { type: res.headers.get("content-type") || "application/octet-stream" });
      }
      if (e instanceof Error && e.message) throw e;
      throw new Error("El servidor devolvió JSON en lugar del archivo de exportación.");
    }
  }

  if (!isLikelyZipOrOfficeBinary(bytes) && bytes.length > 0 && bytes.length < 512) {
    const flat = text.trim();
    if (flat.length < 120 && !/[\r\n]/.test(flat)) {
      const lower = flat.toLowerCase();
      if (
        lower === "ok" ||
        lower === "okay" ||
        lower === "success" ||
        lower === "true" ||
        lower === "false" ||
        lower === "1" ||
        lower === "0"
      ) {
        throw new Error(
          `El servidor respondió «${flat}» en lugar de un archivo Excel. Suele indicar proxy o ruta que no devuelve el .xlsx.`
        );
      }
    }
  }

  return new Blob([buf], { type: res.headers.get("content-type") || "application/octet-stream" });
}

export const api = {
  /** Opciones extra de `fetch` (p. ej. `{ signal }` para AbortController). */
  get: (path, fetchOptions = {}) => request(path, { method: "GET", ...fetchOptions }),
  post: (path, body) => request(path, { method: "POST", body }),
  put: (path, body) => request(path, { method: "PUT", body }),
  patch: (path, body) => request(path, { method: "PATCH", body }),
  patchWithEnvelope: (path, body) => request(path, { method: "PATCH", body }, true, true),
  delete: (path) => request(path, { method: "DELETE" }),
};
