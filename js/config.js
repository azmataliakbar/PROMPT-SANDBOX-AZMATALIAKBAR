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

    // Age groups. "level" goes into the system rules; "opener" starts the simulated reply.
    audiences: [
      { id: "little", label: "Ages 4-6", level: "very simple words, short sentences, warm and friendly", opener: "Hi friend! " },
      { id: "kids", label: "Ages 7-10", level: "simple words, clear sentences, encouraging tone", opener: "Hello! " },
      { id: "teens", label: "Ages 11-15", level: "clear and engaging, age-appropriate, no slang", opener: "" },
      { id: "older", label: "Ages 16-18", level: "clear, concise and well organised", opener: "" },
      { id: "adult", label: "Adults", level: "precise and professional", opener: "In brief: " }
    ],
    defaultAudience: "kids",

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
