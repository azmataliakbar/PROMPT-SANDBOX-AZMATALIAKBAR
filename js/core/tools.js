/* Tool layer (MCP-style). The UI calls named tools with validated arguments and never
   touches the template store, the prompt core or the provider directly. Exposes
   window.Sandbox.tools.

   A real MCP server runs as a separate process, which a static page cannot start. This is
   the same interface shape, running in the page. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});

  function createRegistry() {
    var tools = {};

    function validate(schema, args) {
      Object.keys(schema || {}).forEach(function (key) {
        var spec = schema[key];
        var v = args[key];
        if (spec.required && (v === undefined || v === null)) throw new Error("Missing argument: " + key);
        if (v !== undefined && v !== null && typeof v !== spec.type) {
          throw new Error("Argument " + key + " must be " + spec.type);
        }
      });
    }

    return {
      register: function (name, def) {
        if (tools[name]) throw new Error("Tool already registered: " + name);
        tools[name] = def;
      },
      call: function (name, args) {
        var tool = tools[name];
        if (!tool) return Promise.reject(new Error("Unknown tool: " + name));
        try {
          validate(tool.input, args || {});
        } catch (e) {
          return Promise.reject(e);
        }
        return Promise.resolve().then(function () { return tool.run(args || {}); });
      },
      list: function () {
        return Object.keys(tools).map(function (n) { return { name: n, description: tools[n].description }; });
      }
    };
  }

  // ctx: { templates, prompt, provider, log }
  function install(registry, ctx) {
    var T = ctx.templates;

    registry.register("templates.list", {
      description: "All templates: built-in first, then custom",
      input: {},
      run: function () { return T.list(); }
    });

    registry.register("templates.get", {
      description: "One template by id",
      input: { id: { type: "string", required: true } },
      run: function (a) {
        var t = T.get(a.id);
        if (!t) throw new Error("Template not found");
        return t;
      }
    });

    registry.register("templates.save", {
      description: "Create or update a custom template",
      input: {
        id: { type: "string" },
        name: { type: "string", required: true },
        description: { type: "string" },
        template: { type: "string", required: true },
        limit: { type: "number" }
      },
      run: function (a) { return T.save(a); }
    });

    registry.register("templates.delete", {
      description: "Delete a custom template",
      input: { id: { type: "string", required: true } },
      run: function (a) { return T.remove(a.id); }
    });

    registry.register("templates.export", {
      description: "Custom templates as JSON text",
      input: {},
      run: function () { return T.exportJson(); }
    });

    registry.register("templates.import", {
      description: "Import custom templates from JSON text",
      input: { text: { type: "string", required: true } },
      run: function (a) { return T.importJson(a.text); }
    });

    registry.register("prompt.validate", {
      description: "Clean and check a student's input",
      input: { input: { type: "string", required: true } },
      run: function (a) {
        var c = ctx.prompt.checkInput(a.input);
        return {
          ok: c.text.length > 0,
          text: c.text,
          truncated: c.truncated,
          controlRemoved: c.controlRemoved,
          injectionHits: ctx.prompt.injectionHits(c.text)
        };
      }
    });

    registry.register("prompt.build", {
      description: "Role-separated payload and metrics for a template and input",
      input: { templateId: { type: "string", required: true }, input: { type: "string", required: true } },
      run: function (a) {
        var t = T.get(a.templateId);
        if (!t) throw new Error("Template not found");
        var clean = ctx.prompt.checkInput(a.input).text;
        return {
          payload: ctx.prompt.buildPayload(t, clean),
          metrics: ctx.prompt.metrics(t, clean)
        };
      }
    });

    registry.register("prompt.run", {
      description: "Run a prompt through the provider (simulated)",
      input: { templateId: { type: "string", required: true }, input: { type: "string", required: true } },
      run: function (a) {
        var t = T.get(a.templateId);
        if (!t) throw new Error("Template not found");
        var clean = ctx.prompt.checkInput(a.input).text;
        var payload = ctx.prompt.buildPayload(t, clean);
        return ctx.provider.run(payload, { signal: a.signal, onChunk: a.onChunk }).then(function (result) {
          ctx.log.add({ template: t.name, status: "ok", ms: result.ms, simulated: true, preview: result.text.slice(0, 80) });
          return result;
        }, function (err) {
          if (err && err.name === "AbortError") {
            ctx.log.add({ template: t.name, status: "stopped", ms: 0, simulated: true, preview: "" });
          } else {
            ctx.log.add({ template: t.name, status: "error", ms: 0, simulated: true, preview: err.message });
          }
          throw err;
        });
      }
    });

    registry.register("log.list", {
      description: "Run history, newest first",
      input: {},
      run: function () { return ctx.log.list(); }
    });

    registry.register("log.clear", {
      description: "Clear the run history",
      input: {},
      run: function () {
        ctx.log.clear();
        return { ok: true };
      }
    });
  }

  Sandbox.tools = {
    createRegistry: createRegistry,
    install: install
  };
})();
