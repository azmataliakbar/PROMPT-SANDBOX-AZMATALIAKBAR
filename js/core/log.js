/* Run log: a visible, timestamped history of runs and errors (not console output).
   Exposes window.Sandbox.log. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});

  function create(opts) {
    var entries = [];
    var seq = 0;

    return {
      add: function (entry) {
        seq += 1;
        var item = Object.assign({ id: "r" + seq, time: Date.now() }, entry);
        entries.unshift(item);
        if (entries.length > opts.max) entries.length = opts.max;
        return Object.assign({}, item);
      },
      list: function () {
        return entries.map(function (e) { return Object.assign({}, e); });
      },
      clear: function () {
        entries = [];
      }
    };
  }

  Sandbox.log = { create: create };
})();
