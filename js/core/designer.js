/* Prompt designer: builds a clear template from a few choices, so a teacher does not have to
   write instructions from scratch. The output always has exactly one placeholder, because the
   teacher's text is cleaned of any placeholder before it is used. Exposes window.Sandbox.designer. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var PH = Sandbox.config.placeholder;

  var FORMATS = {
    haiku: { label: "Haiku", text: "a short haiku (three lines)" },
    list: { label: "Short list", text: "a short list of three points" },
    story: { label: "Short story", text: "a very short story with a beginning, middle and end" },
    explain: { label: "Simple explanation", text: "a simple explanation with one everyday example" },
    questions: { label: "Thinking questions", text: "three questions that help the student think" }
  };

  var TONES = {
    friendly: { label: "Friendly and encouraging", text: "friendly and encouraging" },
    formal: { label: "Formal and precise", text: "formal and precise" },
    playful: { label: "Playful and fun", text: "playful and fun" }
  };

  var LENGTHS = {
    short: { label: "One or two sentences", text: "one or two sentences" },
    medium: { label: "One short paragraph", text: "one short paragraph" },
    long: { label: "Three short paragraphs", text: "three short paragraphs" }
  };

  // Removes placeholders and control characters from teacher text, and caps its length.
  function clean(text, max) {
    return Sandbox.prompt.sanitize(text).split(PH).join("").replace(/\s+/g, " ").trim().slice(0, max);
  }

  // spec: { task, format, tone, length, rules }. Returns a template object ready to save.
  function build(spec) {
    var task = clean(spec.task, 240);
    if (!task) throw new Error("Describe the task first, for example: explain a science idea.");
    var format = FORMATS[spec.format];
    if (!format) throw new Error("Choose an answer format.");
    var tone = TONES[spec.tone] || TONES.friendly;
    var length = LENGTHS[spec.length] || LENGTHS.short;
    var rules = clean(spec.rules, 200);

    var lines = [
      "You are a helpful assistant for a classroom.",
      "Task: " + task + ".",
      "Answer as " + format.text + ".",
      "Tone: " + tone.text + ".",
      "Length: " + length.text + "."
    ];
    if (rules) lines.push("Rules: " + rules + ".");
    lines.push("Topic: " + PH);

    var name = "Designed: " + task.split(" ").slice(0, 5).join(" ");
    return {
      name: name.slice(0, Sandbox.config.nameMax),
      description: "Made with the prompt designer",
      template: lines.join("\n"),
      limit: 200
    };
  }

  Sandbox.designer = {
    FORMATS: FORMATS,
    TONES: TONES,
    LENGTHS: LENGTHS,
    build: build
  };
})();
