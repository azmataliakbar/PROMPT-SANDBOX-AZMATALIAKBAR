/* Template library. Built-in templates are read-only. Custom templates are saved under a
   namespaced localStorage key (sandbox.v1.templates), so they never collide with other apps.
   Exposes window.Sandbox.templates. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var cfg = Sandbox.config;

  function newId() {
    return "t" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  // opts: { namespace, max }
  function create(opts) {
    var key = opts.namespace + ".templates";
    var max = opts.max;

    function readCustom() {
      var doc = Sandbox.storage.get(key, { version: 1, templates: [] });
      return doc && Array.isArray(doc.templates) ? doc.templates : [];
    }

    function writeCustom(list) {
      Sandbox.storage.set(key, { version: 1, templates: list });
    }

    function builtins() {
      return cfg.builtins.map(function (t) { return Object.assign({}, t); });
    }

    function clean(t) {
      return {
        id: t.id,
        name: String(t.name).trim(),
        description: String(t.description || "").trim(),
        template: String(t.template),
        limit: t.limit === null || t.limit === undefined || t.limit === "" ? null : Number(t.limit),
        builtin: false,
        updatedAt: Date.now()
      };
    }

    function list() {
      return builtins().concat(readCustom());
    }

    function get(id) {
      var all = list();
      for (var i = 0; i < all.length; i++) if (all[i].id === id) return Object.assign({}, all[i]);
      return null;
    }

    function isBuiltin(id) {
      return cfg.builtins.some(function (t) { return t.id === id; });
    }

    // Creates a template when t.id is missing, or updates the custom template with that id.
    function save(t) {
      if (t.id && isBuiltin(t.id)) throw new Error("Built-in templates cannot be changed. Copy it as a new template.");
      var errors = Sandbox.prompt.validateTemplate(t);
      if (errors.length) throw new Error(errors.join(" "));

      var custom = readCustom();
      var item = clean(t);
      var idx = -1;
      if (t.id) {
        for (var i = 0; i < custom.length; i++) if (custom[i].id === t.id) idx = i;
      }
      if (idx >= 0) {
        item.id = t.id;
        custom[idx] = item;
      } else {
        if (custom.length >= max) throw new Error("You can save up to " + max + " custom templates. Delete one first.");
        item.id = newId();
        custom.push(item);
      }
      writeCustom(custom);
      return Object.assign({}, item);
    }

    function remove(id) {
      if (isBuiltin(id)) throw new Error("Built-in templates cannot be deleted.");
      writeCustom(readCustom().filter(function (t) { return t.id !== id; }));
      return { ok: true };
    }

    function exportJson() {
      return JSON.stringify({ format: "sandbox-templates", version: 1, templates: readCustom() }, null, 2);
    }

    // Adds valid templates from a JSON export. Invalid entries are skipped and counted.
    function importJson(text) {
      var doc;
      try {
        doc = JSON.parse(text);
      } catch (e) {
        throw new Error("That file is not valid JSON.");
      }
      if (!doc || !Array.isArray(doc.templates)) throw new Error("That file has no templates list.");
      var custom = readCustom();
      var added = 0, skipped = 0;
      doc.templates.forEach(function (t) {
        if (!t || typeof t !== "object" || Sandbox.prompt.validateTemplate(t).length || custom.length >= max) {
          skipped += 1;
          return;
        }
        var item = clean(t);
        item.id = newId();
        custom.push(item);
        added += 1;
      });
      writeCustom(custom);
      return { added: added, skipped: skipped };
    }

    return {
      list: list,
      get: get,
      save: save,
      remove: remove,
      isBuiltin: isBuiltin,
      exportJson: exportJson,
      importJson: importJson,
      storageKey: key
    };
  }

  Sandbox.templates = { create: create };
})();
