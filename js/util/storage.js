/* Safe localStorage wrapper with an in-memory fallback. Exposes window.Sandbox.storage. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var memory = {};

  function get(key, fallback) {
    try {
      var raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return key in memory ? memory[key] : fallback;
    }
  }

  function set(key, value) {
    memory[key] = value;
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) {
      return false;
    }
  }

  Sandbox.storage = { get: get, set: set };
})();
