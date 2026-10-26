/* Hypernet — a map link becomes a place name and coordinates.
   One list of providers. A new one is an id, the hosts it owns, and parse(url) →
   { provider, name, lat, lng } or null. Short links are not parsed here: the server
   follows them and this file parses the page they land on. The link the person pasted
   is what "Open in Maps" keeps. */
(function (root) {
  "use strict";

  function num(s) {
    if (s == null || s === "") return null;
    var n = Number(String(s).trim());
    return Number.isFinite(n) ? n : null;
  }
  function pair(a, b) {
    var lat = num(a), lng = num(b);
    if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
    return { lat: lat, lng: lng };
  }
  function decodeName(s) {
    if (s == null) return null;
    var t = String(s).replace(/\+/g, " ");
    try { t = decodeURIComponent(t); } catch (e) { /* leave the text as it was */ }
    t = t.replace(/\s+/g, " ").trim();
    return t || null;
  }
  function isPairString(s) {
    var m = String(s || "").trim().match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);
    return m ? pair(m[1], m[2]) : null;
  }
  function firstPair(url, keys) {
    var found = null;
    keys.some(function (k) {
      var p = isPairString(url.searchParams.get(k));
      if (p) found = p;
      return !!p;
    });
    return found;
  }
  function firstName(url, keys) {
    var found = null;
    keys.some(function (k) {
      var v = url.searchParams.get(k);
      if (v && !isPairString(v)) found = decodeName(v);
      return !!found;
    });
    return found;
  }

  function parseGoogle(url) {
    var host = url.hostname.toLowerCase();
    if (host !== "google.com" && host !== "www.google.com" && host !== "maps.google.com") return null;
    if (!/^\/maps(\/|$)/.test(url.pathname)) return null;
    var pin = null;
    var exact = url.href.match(/!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/);
    if (exact) pin = pair(exact[1], exact[2]);
    if (!pin) {
      var at = url.href.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
      if (at) pin = pair(at[1], at[2]);
    }
    if (!pin) pin = firstPair(url, ["q", "query", "ll", "center"]);
    var name = null;
    var place = url.pathname.match(/\/place\/([^/@?#]+)/);
    if (place) name = decodeName(place[1]);
    if (!name) name = firstName(url, ["q", "query"]);
    if (!pin && !name) return null;
    return { provider: "google", name: name, lat: pin ? pin.lat : null, lng: pin ? pin.lng : null };
  }

  function parseApple(url) {
    var host = url.hostname.toLowerCase();
    if (host !== "maps.apple.com") return null;
    var pin = firstPair(url, ["ll", "coordinate"]);
    if (!pin) pin = firstPair(url, ["q"]);
    var name = firstName(url, ["q", "name"]);
    if (!name) name = firstName(url, ["address"]);
    if (!name) {
      var path = url.pathname.match(/\/place\/([^/?#]+)/);
      if (path) name = decodeName(path[1]);
    }
    if (!pin && !name) return null;
    return { provider: "apple", name: name, lat: pin ? pin.lat : null, lng: pin ? pin.lng : null };
  }

  function parseOsm(url) {
    var host = url.hostname.toLowerCase();
    if (host !== "openstreetmap.org" && host !== "www.openstreetmap.org") return null;
    var pin = null;
    var hash = (url.hash || "").replace(/^#/, "");
    var hm = hash.match(/(?:^|&)map=\d+(?:\.\d+)?\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/);
    if (hm) pin = pair(hm[1], hm[2]);
    if (!pin && (url.searchParams.has("mlat") || url.searchParams.has("mlon"))) {
      pin = pair(url.searchParams.get("mlat"), url.searchParams.get("mlon"));
    }
    var name = firstName(url, ["query"]);
    if (!pin && !name) return null;
    return { provider: "osm", name: name, lat: pin ? pin.lat : null, lng: pin ? pin.lng : null };
  }

  var PROVIDERS = [
    { id: "google", hosts: ["google.com", "www.google.com", "maps.google.com"], parse: parseGoogle },
    { id: "apple", hosts: ["maps.apple.com"], parse: parseApple },
    { id: "osm", hosts: ["openstreetmap.org", "www.openstreetmap.org"], parse: parseOsm },
  ];

  var HOP_HOSTS = {
    "google.com": 1, "www.google.com": 1, "maps.google.com": 1,
    "maps.apple.com": 1, "maps.apple": 1,
    "openstreetmap.org": 1, "www.openstreetmap.org": 1,
    "maps.app.goo.gl": 1, "goo.gl": 1,
  };

  function parseMapLink(urlString) {
    var url;
    try { url = new URL(String(urlString).trim()); } catch (e) { return null; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    for (var i = 0; i < PROVIDERS.length; i++) {
      var pin = PROVIDERS[i].parse(url);
      if (pin) return pin;
    }
    return null;
  }

  function isShort(url) {
    var host = url.hostname.toLowerCase();
    if (host === "maps.app.goo.gl") return true;
    if (host === "goo.gl" && /^\/maps(\/|$)/.test(url.pathname)) return true;
    if (host === "maps.apple") return true;
    if (host === "maps.apple.com" && !parseApple(url)) {
      if (url.search && url.search.length > 1) return false;
      var path = url.pathname.replace(/\/+$/, "") || "/";
      if (/^\/p(\/|$)/.test(path)) return true;
      if (/^\/[^/]+$/.test(path)) return true;
    }
    return false;
  }

  function unsafe(raw) {
    var s = String(raw || "").trim();
    if (!s) return false;
    if (/^(javascript|data|vbscript|file):/i.test(s)) return true;
    try {
      var u = new URL(s);
      if (u.protocol !== "http:" && u.protocol !== "https:") return true;
    } catch (e) { return false; }
    return false;
  }

  function classifyMapInput(raw) {
    var s = String(raw == null ? "" : raw).trim();
    if (!s) return { kind: "empty" };
    if (unsafe(s)) return { kind: "unsafe" };
    var url;
    try { url = new URL(s); } catch (e) { return { kind: "text" }; }
    if (url.protocol !== "http:" && url.protocol !== "https:") return { kind: "unsafe" };
    var pin = parseMapLink(url.href);
    if (pin) return { kind: "pin", url: s, pin: pin };
    if (isShort(url)) return { kind: "short", url: s };
    return { kind: "text" };
  }

  function allowedHop(host) {
    return !!HOP_HOSTS[String(host || "").toLowerCase().replace(/\.$/, "")];
  }

  function coordLabel(pin) {
    if (!pin || pin.lat == null || pin.lng == null) return "";
    return pin.lat.toFixed(4) + ", " + pin.lng.toFixed(4);
  }

  function mapFail(status, code, message) {
    var err = new Error(message);
    err.status = status;
    err.code = code;
    return err;
  }

  /* Follow a short https link across allowlisted hosts. Returns the final URL.
     Does not read the body. `check` is the public-address test (injected in tests). */
  function followMapRedirects(raw, opts) {
    opts = opts || {};
    var fetchImpl = opts.fetch;
    var check = opts.check || function () { return Promise.resolve(); };
    var signal = opts.signal;
    var url;
    try { url = new URL(String(raw || "").trim()); }
    catch (e) { return Promise.reject(mapFail(400, "bad_url", "That doesn't look like a link.")); }
    if (url.protocol !== "https:") return Promise.reject(mapFail(400, "bad_url", "Only https map links."));
    if (classifyMapInput(url.href).kind !== "short") return Promise.reject(mapFail(400, "bad_url", "Paste a short map link."));
    var hop = 0;
    function step() {
      if (hop > 5) return Promise.reject(mapFail(422, "unreachable", "Too many redirects."));
      hop += 1;
      if (url.protocol !== "https:") return Promise.reject(mapFail(400, "bad_url", "Only https map links."));
      if (!allowedHop(url.hostname)) return Promise.reject(mapFail(400, "bad_url", "That link isn't a map."));
      return Promise.resolve()
        .then(function () { return check(url); })
        .then(function () {
          return Promise.resolve(fetchImpl(url, { redirect: "manual", signal: signal })).then(function (res) {
            if (res.body && res.body.cancel) { try { res.body.cancel(); } catch (e2) { /* already closed */ } }
            if (res.status >= 300 && res.status < 400) {
              var loc = res.headers && res.headers.get && res.headers.get("location");
              if (!loc) return Promise.reject(mapFail(422, "unreachable", "The map link didn't say where it goes."));
              url = new URL(loc, url);
              return step();
            }
            if (res.status >= 200 && res.status < 300) {
              if (parseMapLink(url.href)) return url.href;
              return Promise.reject(mapFail(422, "not_a_map", "That link didn't open a place."));
            }
            return Promise.reject(mapFail(422, "unreachable", "The map link didn't open."));
          }, function () {
            return Promise.reject(mapFail(422, "unreachable", "The map link didn't answer in time."));
          });
        });
    }
    return step();
  }

  var api = {
    PROVIDERS: PROVIDERS,
    parseMapLink: parseMapLink,
    classifyMapInput: classifyMapInput,
    allowedHop: allowedHop,
    coordLabel: coordLabel,
    followMapRedirects: followMapRedirects,
  };
  root.HN_MAP = api;
  if (typeof module === "object" && module.exports) module.exports = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
