/* Question tips: simple, friendly checks on a student's question, shown as suggestions.
   Exposes window.Sandbox.tips. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});

  var ACTION_WORDS = /\b(explain|write|list|describe|tell|make|draw|compare|give|summarise|summarize|what|why|how|can|could|please)\b/i;

  // Returns a list of { kind: "tip" | "good", text }.
  function analyze(raw) {
    var text = Sandbox.prompt.sanitize(raw);
    var tips = [];
    if (!text) return tips;

    var words = text.split(/\s+/).filter(Boolean);
    if (words.length < 3) {
      tips.push({ kind: "tip", text: "Add a little more detail: who is it for, and what should the answer cover?" });
    }
    if (!ACTION_WORDS.test(text)) {
      tips.push({ kind: "tip", text: "Say what you want: for example “explain”, “write”, “list” or “compare”." });
    }
    if (words.length > 60) {
      tips.push({ kind: "tip", text: "Shorter questions are often clearer. Keep only the key facts." });
    }
    if (!tips.length) {
      tips.push({ kind: "good", text: "Good: clear and specific." });
    }
    return tips;
  }

  Sandbox.tips = { analyze: analyze };
})();
