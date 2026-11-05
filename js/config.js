/* Configuration: placeholder, limits, timing and the built-in templates.
   Exposes window.Sandbox.config. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});

  Sandbox.config = {
    placeholder: "{{input}}",
    inputMax: 500,            // characters a student may type
    templateMax: 2000,        // characters in a template
    nameMax: 60,
    descMax: 200,
    customTemplatesMax: 30,   // per browser
    namespace: "sandbox.v1",  // localStorage keys start with this
    runTimeoutMs: 15000,
    logMax: 100,
    tokenCharsPerToken: 4,    // rough estimate only, shown as "about"
    streamDelayMs: 60,        // delay between streamed words

    builtins: [
      {
        id: "haiku",
        name: "Haiku",
        description: "A short poem about a topic",
        template: "Write a short haiku about: {{input}}",
        limit: 200,
        builtin: true
      },
      {
        id: "explain",
        name: "Explain like I am 5",
        description: "A simple explanation for a young child",
        template: "Explain this topic like I am 5 years old: {{input}}",
        limit: 200,
        builtin: true
      }
    ]
  };
})();
