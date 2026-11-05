/* Synthetic model: produces a reply for a prompt and streams it word by word.
   It is deterministic for the same input, so it can be tested and it teaches well.
   When a student's input contains an injection-like phrase, the reply says it will keep
   to the task. Exposes window.Sandbox.simulator. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var cfg = Sandbox.config;

  function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  // topic: the student's cleaned input. rulesKept: true when an override phrase was found.
  // audienceId: the age group. Its opener sets the tone of the reply.
  function generate(templateId, topic, rulesKept, audienceId) {
    var t = topic || "this";
    var opener = "";
    cfg.audiences.forEach(function (a) { if (a.id === audienceId) opener = a.opener; });
    var body;
    if (templateId === "haiku") {
      body = [cap(t) + " at first light,", "soft words drift past the window", "and the page is quiet."].join("\n");
    } else if (templateId === "explain") {
      body = "Imagine " + t + " is like a small adventure. It has a few simple parts that work together. " +
        "Think of it like building with blocks, one piece at a time. That is the big idea!";
    } else {
      body = "Here is a simple take on " + t + ": it has a few clear parts that work together, " +
        "and you can learn them one step at a time.";
    }
    body = opener + body;
    return rulesKept ? "I will keep to the task. " + body : body;
  }

  // Emits the reply word by word. Rejects with AbortError when the signal aborts.
  function stream(text, onChunk, signal) {
    var parts = text.split(/(\s+)/).filter(function (p) { return p.length; });
    return new Promise(function (resolve, reject) {
      var i = 0;
      var acc = "";
      function abortError() {
        var e = new Error("Stopped");
        e.name = "AbortError";
        return e;
      }
      if (signal && signal.aborted) return reject(abortError());
      function next() {
        if (signal && signal.aborted) return reject(abortError());
        if (i >= parts.length) return resolve(acc);
        acc += parts[i];
        if (onChunk) onChunk(parts[i]);
        i += 1;
        setTimeout(next, cfg.streamDelayMs);
      }
      next();
    });
  }

  Sandbox.simulator = {
    generate: generate,
    stream: stream
  };
})();
