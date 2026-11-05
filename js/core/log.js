/* Security log: records each run (short excerpt, signals, result, estimated tokens) in
   localStorage under sandbox.v1.securitylog. Privacy rules: excerpts only (80 characters),
   entries older than 30 days are removed, the user can switch recording off, and nothing
   leaves the browser. Writes are batched, so typing and running do not stall.
   Exposes window.Sandbox.log. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var cfg = Sandbox.config;

  var EXCERPT_MAX = 80;
  var RETENTION_DAYS = 30;
  var MAX_ENTRIES = 500;
  var FLUSH_MS = 300;
  var DAY = 24 * 60 * 60 * 1000;

  function excerptOf(text) {
    var s = String(text || "").replace(/\s+/g, " ").trim();
    return s.length > EXCERPT_MAX ? s.slice(0, EXCERPT_MAX) + "…" : s;
  }

  function copy(e) {
    return Object.assign({}, e, { signals: (e.signals || []).slice() });
  }

  // CSV cell: spreadsheets run cells that start with = + - @ or a tab as formulas, so those
  // get a leading apostrophe. Cells with commas, quotes or line breaks are quoted.
  function csvCell(value) {
    var s = String(value == null ? "" : value);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    if (/[",\n\r]/.test(s)) s = '"' + s.replace(/"/g, '""') + '"';
    return s;
  }

  function prune(list) {
    var cutoff = Date.now() - RETENTION_DAYS * DAY;
    return list.filter(function (e) { return e && e.time >= cutoff; }).slice(0, MAX_ENTRIES);
  }

  function create() {
    var keyLog = cfg.namespace + ".securitylog";
    var keySettings = cfg.namespace + ".securitysettings";

    var settings = Sandbox.storage.get(keySettings, { enabled: true });
    var enabled = !(settings && settings.enabled === false);
    var data = Sandbox.storage.get(keyLog, { version: 1, entries: [] });
    var entries = prune(data && Array.isArray(data.entries) ? data.entries : []);
    var timer = 0;

    function flush() {
      clearTimeout(timer);
      timer = 0;
      Sandbox.storage.set(keyLog, { version: 1, entries: entries });
    }

    function schedule() {
      if (!timer) timer = setTimeout(flush, FLUSH_MS);
    }

    // entry: { template, audience, status ("ok" | "stopped" | "error"), input, signals, tokens }
    function add(entry) {
      if (!enabled) return null;
      var item = {
        id: "s" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
        time: Date.now(),
        template: String(entry.template || "").slice(0, 60),
        audience: String(entry.audience || ""),
        status: entry.status || "ok",
        signals: Array.isArray(entry.signals) ? entry.signals.slice(0, 10) : [],
        excerpt: excerptOf(entry.input),
        tokens: Number(entry.tokens) || 0
      };
      entries.unshift(item);
      if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
      schedule();
      return copy(item);
    }

    function list() {
      return entries.map(copy);
    }

    function metrics() {
      var m = { total: entries.length, safe: 0, flagged: 0, stopped: 0, errors: 0, tokens: 0 };
      entries.forEach(function (e) {
        var flagged = e.signals && e.signals.length > 0;
        m.tokens += e.tokens || 0;
        if (flagged) m.flagged += 1;
        if (e.status === "stopped") m.stopped += 1;
        else if (e.status === "error") m.errors += 1;
        else if (!flagged) m.safe += 1;
      });
      return m;
    }

    function clear() {
      entries = [];
      flush();
    }

    function setEnabled(value) {
      enabled = !!value;
      Sandbox.storage.set(keySettings, { enabled: enabled });
    }

    // The spreadsheet summary. Starts with a byte-order mark so Excel reads the UTF-8 correctly.
    function csv() {
      var head = ["time", "template", "age group", "result", "signals", "excerpt", "estimated tokens"];
      var rows = entries.map(function (e) {
        return [
          new Date(e.time).toISOString(),
          e.template,
          e.audience,
          e.status,
          (e.signals || []).map(Sandbox.scanner.labelOf).join("; "),
          e.excerpt,
          e.tokens
        ];
      });
      return "﻿" + [head].concat(rows).map(function (r) {
        return r.map(csvCell).join(",");
      }).join("\r\n") + "\r\n";
    }

    window.addEventListener("pagehide", flush);

    return {
      add: add,
      list: list,
      metrics: metrics,
      clear: clear,
      setEnabled: setEnabled,
      isEnabled: function () { return enabled; },
      csv: csv,
      flush: flush
    };
  }

  Sandbox.log = { create: create, excerptOf: excerptOf, csvCell: csvCell };
})();
