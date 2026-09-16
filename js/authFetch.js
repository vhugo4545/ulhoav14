/**
 * authFetch.js
 * Intercepta window.fetch e injeta Authorization: Bearer <token>
 * automaticamente em todas as chamadas para os backends protegidos,
 * exceto rotas públicas de autenticação.
 */
(function () {
  const PROTECTED_ORIGINS = [
    "https://ulhoa-0a02024d350a.herokuapp.com",
    "https://kommo-server-9f1243cbe450.herokuapp.com",
    "https://ulhoa-servico-ec4e1aa95355.herokuapp.com",
    "https://ulhoa-vidros-1ae0adcf5f73.herokuapp.com",
  ];

  // Rotas que NÃO exigem token (login, register, refresh)
  const PUBLIC_PATHS = [
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/refresh",
    "/api/autenticacao",
  ];

  function getToken() {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("accessToken") ||
      ""
    );
  }

  function isPublic(urlStr) {
    return PUBLIC_PATHS.some((p) => urlStr.includes(p));
  }

  const _origFetch = window.fetch.bind(window);

  window.fetch = function (url, options) {
    try {
      const urlStr =
        typeof url === "string"
          ? url
          : url instanceof Request
          ? url.url
          : String(url);

      if (PROTECTED_ORIGINS.some(o => urlStr.startsWith(o)) && !isPublic(urlStr)) {
        const token = getToken();
        if (token) {
          options = options ? { ...options } : {};
          const existing =
            options.headers instanceof Headers
              ? Object.fromEntries(options.headers.entries())
              : options.headers || {};
          options.headers = {
            ...existing,
            Authorization: "Bearer " + token,
          };
        }
      }
    } catch (_) {
      // em caso de erro na interceptação, deixa o fetch original passar
    }

    return _origFetch(url, options);
  };
})();
