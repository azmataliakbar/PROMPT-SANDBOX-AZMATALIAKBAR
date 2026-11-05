/* App wiring: template library, compose and run, split-screen viewer, creator dialog, log,
   tabs and the responsive layout. Runs on load. */
(function () {
  "use strict";
  var Sandbox = window.Sandbox;
  var cfg = Sandbox.config;
  var V = Sandbox.viewer;
  var doc = document.documentElement;

  function $(id) { return document.getElementById(id); }

  var state = {
    section: "compose",
    selected: cfg.builtins[0].id,
    input: "",
    running: false,
    controller: null,
    status: "idle",      // idle | running | ok | error
    output: "",
    message: "",         // one-line status under the run button
    editingId: null,
    audience: cfg.defaultAudience
  };

  var library = Sandbox.templates.create({ namespace: cfg.namespace, max: cfg.customTemplatesMax });
  var log = Sandbox.log.create({ max: cfg.logMax });
  var registry = Sandbox.tools.createRegistry();
  Sandbox.tools.install(registry, {
    templates: library,
    prompt: Sandbox.prompt,
    provider: Sandbox.provider,
    log: log
  });

  function current() {
    return library.get(state.selected) || library.list()[0];
  }

  // ---------- Templates ----------
  function renderTemplates() {
    var list = library.list();
    var box = $("template-list");
    box.textContent = "";
    list.forEach(function (t) {
      var b = V.el("button", "template-btn glass");
      b.type = "button";
      b.setAttribute("data-id", t.id);
      b.setAttribute("aria-pressed", String(t.id === state.selected));
      b.appendChild(V.el("span", "template-name", t.name));
      b.appendChild(V.el("span", "template-desc", t.description || ""));
      b.appendChild(V.el("span", "kind " + (t.builtin ? "builtin" : "custom"), t.builtin ? "Built-in" : "Custom"));
      box.appendChild(b);
    });

    var t = current();
    $("template-count").textContent = list.length + " templates";
    $("edit-template").disabled = !!t.builtin;
    $("delete-template").disabled = !!t.builtin;
    $("template-detail").textContent = t.template;
  }

  // ---------- Compose ----------
  function renderCompose() {
    var t = current();
    var clean = Sandbox.prompt.checkInput(state.input);
    var m = Sandbox.prompt.metrics(t, clean.text, state.audience);
    renderAudience();
    renderTips();

    V.renderMeters($("meters"), m);
    $("token-count").textContent = "~" + m.tokens + " tokens";
    $("token-count").classList.toggle("near", m.limitUsed >= 0.9);
    $("char-count").textContent = m.inputChars + " / " + m.inputLimit;

    var notes = [];
    if (clean.controlRemoved) notes.push("Hidden control characters were removed.");
    if (clean.truncated) notes.push("Your text was cut to " + cfg.inputMax + " characters.");
    if (m.injectionHits > 0) {
      notes.push("This text contains " + m.injectionHits + " phrase(s) that try to override rules. The sandbox will flag it for discussion.");
    }
    $("compose-notes").textContent = notes.join(" ");
    $("chip-injection").hidden = m.injectionHits === 0;

    $("run").disabled = state.running || !clean.text;
    $("stop").disabled = !state.running;
    $("run-card").className = "glass run-card status-" + state.status;
    $("run-message").textContent = state.message;
    $("output").textContent = state.output || "Your reply will appear here.";
    $("output").classList.toggle("placeholder", !state.output);
  }

  // ---------- Preview ----------
  function renderPreview() {
    var t = current();
    var clean = Sandbox.prompt.checkInput(state.input).text;
    var payload = Sandbox.prompt.buildPayload(t, clean, state.audience);
    var m = Sandbox.prompt.metrics(t, clean, state.audience);
    V.renderTemplate($("viewer-template"), t, clean);
    V.renderMatrix($("matrix-body"), payload, m);
    $("viewer-note").textContent = clean
      ? "The highlighted words are the student's text. They replace " + Sandbox.prompt.PLACEHOLDER + " in the template."
      : "Type something on the Compose tab to see it placed into the template.";
  }

  // ---------- Log ----------
  function renderLog() {
    var entries = log.list();
    var box = $("log-list");
    box.textContent = "";
    if (!entries.length) {
      box.appendChild(V.el("li", "empty", "No runs yet."));
      return;
    }
    entries.forEach(function (e) {
      var li = V.el("li", "log-item status-" + (e.status === "ok" ? "ok" : e.status === "error" ? "error" : "idle"));
      var head = V.el("div", "log-head");
      head.appendChild(V.el("span", "log-status", e.status));
      head.appendChild(V.el("span", "log-time", new Date(e.time).toLocaleTimeString()));
      li.appendChild(head);
      li.appendChild(V.el("div", "log-template", e.template + (e.simulated ? " · simulated" : "")));
      if (e.preview) li.appendChild(V.el("div", "log-preview", e.preview));
      box.appendChild(li);
    });
  }

  function renderAll() {
    renderTemplates();
    renderCompose();
    renderPreview();
    renderLog();
  }

  // ---------- Age groups and question tips ----------
  function buildAudienceChips() {
    var box = $("audience-chips");
    box.textContent = "";
    cfg.audiences.forEach(function (a) {
      var b = V.el("button", "chip-btn", a.label);
      b.type = "button";
      b.setAttribute("data-audience", a.id);
      b.addEventListener("click", function () {
        state.audience = a.id;
        renderAll();
      });
      box.appendChild(b);
    });
  }

  function renderAudience() {
    document.querySelectorAll("[data-audience]").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.getAttribute("data-audience") === state.audience));
    });
  }

  function renderTips() {
    var box = $("tips");
    box.textContent = "";
    var tips = state.input.trim() ? Sandbox.tips.analyze(state.input)
      : [{ kind: "tip", text: "Type a question to get tips for asking it well." }];
    tips.forEach(function (t) {
      box.appendChild(V.el("li", t.kind === "good" ? "tip good" : "tip", t.text));
    });
  }

  // ---------- Prompt designer ----------
  var designer = $("designer");

  function fillSelect(id, options) {
    var sel = $(id);
    sel.textContent = "";
    Object.keys(options).forEach(function (k) {
      var o = document.createElement("option");
      o.value = k;
      o.textContent = options[k].label;
      sel.appendChild(o);
    });
  }

  function designerSpec() {
    return {
      task: $("d-task").value,
      format: $("d-format").value,
      tone: $("d-tone").value,
      length: $("d-length").value,
      rules: $("d-rules").value
    };
  }

  function refreshDesigner() {
    registry.call("designer.build", designerSpec()).then(function (built) {
      $("d-preview").textContent = built.template;
    }, function () {
      $("d-preview").textContent = "Fill in the task to see the template.";
    });
  }

  $("open-designer").addEventListener("click", function () {
    fillSelect("d-format", Sandbox.designer.FORMATS);
    fillSelect("d-tone", Sandbox.designer.TONES);
    fillSelect("d-length", Sandbox.designer.LENGTHS);
    $("d-task").value = "";
    $("d-rules").value = "";
    $("designer-error").textContent = "";
    refreshDesigner();
    designer.showModal();
    $("d-task").focus();
  });

  $("designer-form").addEventListener("input", refreshDesigner);
  $("designer-form").addEventListener("change", refreshDesigner);
  $("designer-cancel").addEventListener("click", function () { designer.close(); });

  $("designer-form").addEventListener("submit", function (e) {
    e.preventDefault();
    registry.call("designer.build", designerSpec())
      .then(function (built) { return registry.call("templates.save", built); })
      .then(function (saved) {
        state.selected = saved.id;
        designer.close();
        renderAll();
      }, function (err) {
        $("designer-error").textContent = err.message;
      });
  });

  // ---------- Run ----------
  function runPrompt() {
    if (state.running) return;
    var clean = Sandbox.prompt.checkInput(state.input).text;
    if (!clean) return;

    state.running = true;
    state.status = "running";
    state.message = "Running… (simulated model)";
    state.output = "";
    state.controller = new AbortController();
    renderCompose();

    registry.call("prompt.run", {
      templateId: current().id,
      input: state.input,
      audience: state.audience,
      signal: state.controller.signal,
      onChunk: function (chunk) {
        state.output += chunk;
        $("output").textContent = state.output;
      }
    }).then(function () {
      state.status = "ok";
      state.message = "Done. Simulated reply.";
    }, function (err) {
      if (err && err.name === "AbortError") {
        state.status = "idle";
        state.message = "Stopped.";
      } else {
        state.status = "error";
        state.message = err.message || "Something went wrong.";
      }
    }).then(function () {
      state.running = false;
      state.controller = null;
      renderAll();
    });
  }

  $("run").addEventListener("click", runPrompt);
  $("stop").addEventListener("click", function () {
    if (state.controller) state.controller.abort();
  });

  $("input").addEventListener("input", function (e) {
    state.input = e.target.value;
    state.status = state.running ? "running" : "idle";
    if (!state.running) state.message = "";
    renderAll();
  });

  // ---------- Template selection and actions ----------
  $("template-list").addEventListener("click", function (e) {
    var btn = e.target.closest("[data-id]");
    if (!btn) return;
    state.selected = btn.getAttribute("data-id");
    renderAll();
  });

  $("clear-log").addEventListener("click", function () {
    registry.call("log.clear").then(renderLog);
  });

  // ---------- Template creator ----------
  var dialog = $("creator");
  var form = $("creator-form");

  function checkCreator() {
    var body = $("c-template").value;
    var n = Sandbox.prompt.placeholderCount(body);
    var msg = n === 1 ? "The " + Sandbox.prompt.PLACEHOLDER + " placeholder is in place."
      : "Include " + Sandbox.prompt.PLACEHOLDER + " exactly once (found " + n + ").";
    $("c-hint").textContent = msg;
    $("c-hint").classList.toggle("ok", n === 1);
  }

  function openCreator(template, mode) {
    // mode: "new" | "edit" | "copy"
    var t = template || {};
    state.editingId = mode === "edit" ? t.id : null;
    $("creator-title").textContent = mode === "edit" ? "Edit template" : "New template";
    $("c-name").value = mode === "copy" ? "Copy of " + t.name : (t.name || "");
    $("c-desc").value = t.description || "";
    $("c-template").value = t.template || "Write about: " + Sandbox.prompt.PLACEHOLDER;
    $("c-limit").value = t.limit || "";
    $("creator-error").textContent = "";
    checkCreator();
    dialog.showModal();
    $("c-name").focus();
  }

  $("new-template").addEventListener("click", function () { openCreator(null, "new"); });
  $("edit-template").addEventListener("click", function () { openCreator(current(), "edit"); });
  $("copy-template").addEventListener("click", function () { openCreator(current(), "copy"); });
  $("c-template").addEventListener("input", checkCreator);
  $("creator-cancel").addEventListener("click", function () { dialog.close(); });

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var payload = {
      name: $("c-name").value,
      description: $("c-desc").value,
      template: $("c-template").value,
      limit: $("c-limit").value ? Number($("c-limit").value) : null
    };
    if (state.editingId) payload.id = state.editingId;
    registry.call("templates.save", payload).then(function (saved) {
      state.selected = saved.id;
      dialog.close();
      renderAll();
    }, function (err) {
      $("creator-error").textContent = err.message;
    });
  });

  $("delete-template").addEventListener("click", function () {
    var t = current();
    if (t.builtin || !window.confirm("Delete the template \"" + t.name + "\"?")) return;
    registry.call("templates.delete", { id: t.id }).then(function () {
      state.selected = cfg.builtins[0].id;
      renderAll();
    });
  });

  // ---------- Export and import of custom templates ----------
  $("export-templates").addEventListener("click", function () {
    registry.call("templates.export").then(function (text) {
      var blob = new Blob([text], { type: "application/json" });
      var url = URL.createObjectURL(blob);
      var a = document.createElement("a");
      a.href = url;
      a.download = "sandbox-templates.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
    });
  });

  $("import-templates").addEventListener("click", function () { $("import-file").click(); });
  $("import-file").addEventListener("change", function (e) {
    var file = e.target.files[0];
    if (!file) return;
    file.text().then(function (text) {
      return registry.call("templates.import", { text: text });
    }).then(function (res) {
      $("template-message").textContent = "Imported " + res.added + " template(s). Skipped " + res.skipped + ".";
      renderAll();
    }, function (err) {
      $("template-message").textContent = err.message;
    });
    e.target.value = "";
  });

  // ---------- Tabs and responsive layout ----------
  var mqTablet = window.matchMedia("(min-width: 640px)");
  var mqDesktop = window.matchMedia("(min-width: 1024px)");

  function applySection() {
    document.querySelectorAll("[data-section]").forEach(function (sec) {
      sec.classList.toggle("is-active", sec.getAttribute("data-section") === state.section);
    });
    document.querySelectorAll("[data-target]").forEach(function (btn) {
      var on = btn.getAttribute("data-target") === state.section;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", String(on));
    });
  }

  function applyLayout() {
    doc.dataset.layout = mqDesktop.matches ? "desktop" : mqTablet.matches ? "tablet" : "mobile";
  }

  document.querySelectorAll("[data-target]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      state.section = btn.getAttribute("data-target");
      applySection();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  mqTablet.addEventListener("change", applyLayout);
  mqDesktop.addEventListener("change", applyLayout);
  applyLayout();
  applySection();

  // ---------- Start ----------
  $("mode-badge").textContent = "Simulated model · nothing leaves this browser";
  buildAudienceChips();
  renderAll();
})();
