/* Provider: runs a validated payload through the simulator, with a timeout and cancellation.
   A live model would replace only this file's inner call. Exposes window.Sandbox.provider. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var cfg = Sandbox.config;

  function timeoutError() {
    var e = new Error("The model did not respond in time");
    e.name = "TimeoutError";
    return e;
  }

  // payload: { template, messages: [system, user] }
  // opts: { signal, onChunk, timeoutMs }
  function run(payload, opts) {
    opts = opts || {};
    var msgs = payload && payload.messages;
    if (!Array.isArray(msgs) || msgs.length !== 2 || msgs[0].role !== "system" || msgs[1].role !== "user") {
      return Promise.reject(new Error("The prompt payload has an unexpected shape."));
    }
    var topic = msgs[1].content;
    if (!topic) return Promise.reject(new Error("Type something for the student input first."));

    var internal = new AbortController();
    var started = Date.now();
    var timer = setTimeout(function () { internal.abort(); }, opts.timeoutMs || cfg.runTimeoutMs);
    var onOuterAbort = function () { internal.abort(); };
    if (opts.signal) {
      if (opts.signal.aborted) internal.abort();
      else opts.signal.addEventListener("abort", onOuterAbort);
    }

    var text = Sandbox.simulator.generate(payload.template, topic, Sandbox.prompt.injectionHits(topic) > 0);
    return Sandbox.simulator.stream(text, opts.onChunk, internal.signal).then(function (full) {
      clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener("abort", onOuterAbort);
      if (typeof full !== "string" || !full.trim()) throw new Error("The model returned an empty reply.");
      return { text: full, simulated: true, ms: Date.now() - started };
    }, function (err) {
      clearTimeout(timer);
      if (opts.signal) opts.signal.removeEventListener("abort", onOuterAbort);
      if (internal.signal.aborted && !(opts.signal && opts.signal.aborted)) throw timeoutError();
      throw err;
    });
  }

  Sandbox.provider = { run: run };
})();
