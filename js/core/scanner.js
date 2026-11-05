/* Scanner: finds attempts to override a teacher's rules, grouped into named categories.
   It flags and explains; it never blocks. Each category lists the phrasings it catches.
   Exposes window.Sandbox.scanner. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});

  var CATEGORIES = [
    {
      id: "developer-mode",
      label: "Developer or debug mode",
      patterns: [
        /\bdeveloper mode\b/i,
        /\bdebug mode\b/i,
        /\bmaintenance mode\b/i
      ]
    },
    {
      id: "persona-jailbreak",
      label: "Jailbreak persona (DAN and similar)",
      patterns: [
        /\bDAN\b/,                       // capitals only, so the name "Dan" is not flagged
        /\bdo anything now\b/i,
        /\bjailbr(eak|oken|eaking)\b/i,
        /\b(STAN|DUDE|AIM)\b/
      ]
    },
    {
      id: "system-override",
      label: "System override",
      patterns: [
        /\bsystem (override|update|command|message)\b/i,
        /\boverride (your|the|all) (rules|instructions|settings|safety)\b/i
      ]
    },
    {
      id: "ignore-rules",
      label: "Ignore the rules",
      patterns: [
        /\bignore (all |the |any |your )?(previous |prior |above |earlier |original )?(instructions|rules|guidelines|messages|restrictions|directions|safety)\b/i,
        /\bignore (your |the )?guidelines\b/i,
        /\bdisregard (all |the |any )?(previous|above|prior|your)\b/i,
        /\bforget (all |your |the )?(rules|instructions|guidelines|restrictions)\b/i
      ]
    },
    {
      id: "persona-swap",
      label: "Persona swap (you are now...)",
      patterns: [
        /\byou are now (a|an|the|my)\b/i,
        /\bact as (an? )?(unrestricted|unfiltered|jailbroken|evil)\b/i,
        /\bpretend (you are|to be|you're) (an? )?(unrestricted|unfiltered|evil|without)\b/i
      ]
    },
    {
      id: "no-restrictions",
      label: "No restrictions claim",
      patterns: [
        /\b(no|without|zero) (restrictions|rules|limits|filters|guidelines|censorship)\b/i,
        /\bpretend you have no\b/i
      ]
    },
    {
      id: "reveal-instructions",
      label: "Reveal hidden instructions",
      patterns: [
        /\b(reveal|print|repeat|display|dump) (your|the) (system )?(prompt|instructions|hidden rules)\b/i,
        /\bshow (me )?your (system )?(prompt|instructions)\b/i,
        /\bsystem prompt\b/i
      ]
    }
  ];

  var LABELS = {};
  CATEGORIES.forEach(function (c) { LABELS[c.id] = c.label; });

  // Returns { categories: [ids], labels: [names] } for the cleaned text.
  function scan(raw) {
    var text = Sandbox.prompt.sanitize(raw);
    var found = CATEGORIES.filter(function (c) {
      return c.patterns.some(function (re) { return re.test(text); });
    });
    return {
      categories: found.map(function (c) { return c.id; }),
      labels: found.map(function (c) { return c.label; })
    };
  }

  function labelOf(id) {
    return LABELS[id] || id;
  }

  Sandbox.scanner = {
    CATEGORIES: CATEGORIES,
    scan: scan,
    labelOf: labelOf
  };
})();
