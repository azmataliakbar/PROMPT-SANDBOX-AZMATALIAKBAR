/* Prompt core: safe substitution, input cleaning, validation, the role-separated payload,
   and text metrics. Pure functions, no DOM. Exposes window.Sandbox.prompt. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var cfg = Sandbox.config;
  var PH = cfg.placeholder;

  var CONTROL_G = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
  var CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/;

  // Phrases that try to override a teacher's rules. Used to flag and explain, not to block.
  var INJECTION = [
    /ignore (all |the |any )?(previous|above|prior) (instructions|rules|messages)/i,
    /disregard (all |the |any )?(previous|above|prior)/i,
    /(reveal|show|print|repeat) (your|the) (system )?(prompt|instructions|rules)/i,
    /you are now/i,
    /system prompt/i,
    /act as (an? )?(unrestricted|jailbroken|developer mode)/i
  ];

  function placeholderCount(template) {
    return String(template).split(PH).length - 1;
  }

  // Literal replacement of every placeholder. split/join never reads "$&" or "$$" in the value.
  function fill(template, value) {
    return String(template).split(PH).join(String(value));
  }

  function sanitize(raw) {
    return String(raw == null ? "" : raw)
      .replace(/\r\n?/g, "\n")
      .replace(CONTROL_G, "")
      .trim();
  }

  // Cleans a student's input and reports what was changed.
  function checkInput(raw) {
    var original = String(raw == null ? "" : raw);
    var clean = sanitize(original);
    return {
      text: clean.slice(0, cfg.inputMax),
      truncated: clean.length > cfg.inputMax,
      controlRemoved: CONTROL.test(original)
    };
  }

  function injectionHits(text) {
    var n = 0;
    INJECTION.forEach(function (re) { if (re.test(text)) n += 1; });
    return n;
  }

  // Returns a list of problems. An empty list means the template is valid.
  function validateTemplate(t) {
    var errors = [];
    var name = String(t.name == null ? "" : t.name).trim();
    var body = String(t.template == null ? "" : t.template);
    if (!name) errors.push("Give the template a name.");
    if (name.length > cfg.nameMax) errors.push("The name can be at most " + cfg.nameMax + " characters.");
    if (String(t.description || "").length > cfg.descMax) {
      errors.push("The description can be at most " + cfg.descMax + " characters.");
    }
    if (!body.trim()) errors.push("Write the template instructions.");
    if (body.length > cfg.templateMax) errors.push("The template can be at most " + cfg.templateMax + " characters.");
    var n = placeholderCount(body);
    if (body.trim() && n !== 1) {
      errors.push("Include the " + PH + " placeholder exactly once (found " + n + ").");
    }
    if (t.limit !== null && t.limit !== undefined && t.limit !== "") {
      var lim = Number(t.limit);
      if (!isFinite(lim) || lim < 1 || lim > cfg.inputMax) {
        errors.push("The input limit must be between 1 and " + cfg.inputMax + ".");
      }
    }
    return errors;
  }

  function estimateTokens(chars) {
    return Math.ceil(chars / cfg.tokenCharsPerToken);
  }

  // Role-separated payload: the teacher's rules go in the system message, the student's
  // words go in the user message. The system copy shows "[student input]" where the words
  // would have been, so the structure is visible without repeating the student's text.
  function buildPayload(template, input) {
    var system = fill(template.template, "[student input]");
    return {
      template: template.id,
      messages: [
        { role: "system", content: system },
        { role: "user", content: input }
      ]
    };
  }

  function metrics(template, input) {
    var payload = buildPayload(template, input);
    var sysChars = payload.messages[0].content.length;
    var userChars = input.length;
    var limit = Math.min(Number(template.limit) || cfg.inputMax, cfg.inputMax);
    var total = sysChars + userChars;
    return {
      templateChars: String(template.template).length,
      systemChars: sysChars,
      inputChars: userChars,
      totalChars: total,
      tokens: estimateTokens(total),
      inputTokens: estimateTokens(userChars),
      templateTokens: estimateTokens(sysChars),
      inputLimit: limit,
      limitUsed: Math.min(1, userChars / limit),
      studentShare: total ? userChars / total : 0,
      injectionHits: injectionHits(input)
    };
  }

  Sandbox.prompt = {
    PLACEHOLDER: PH,
    placeholderCount: placeholderCount,
    fill: fill,
    sanitize: sanitize,
    checkInput: checkInput,
    injectionHits: injectionHits,
    validateTemplate: validateTemplate,
    estimateTokens: estimateTokens,
    buildPayload: buildPayload,
    metrics: metrics
  };
})();
