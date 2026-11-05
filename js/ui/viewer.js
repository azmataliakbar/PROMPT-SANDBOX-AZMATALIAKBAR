/* Viewer: shows the template with the student's text in place, the role-separated payload
   matrix, and the metric meters. Everything is written with textContent, never innerHTML,
   so student text cannot inject markup. Exposes window.Sandbox.viewer. */
(function () {
  "use strict";
  var Sandbox = (window.Sandbox = window.Sandbox || {});
  var PH = Sandbox.config.placeholder;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  // The template, with the student's words highlighted where they land.
  function renderTemplate(container, template, input) {
    container.textContent = "";
    var parts = String(template.template).split(PH);
    parts.forEach(function (part, i) {
      if (part) container.appendChild(el("span", "tpl-text", part));
      if (i < parts.length - 1) {
        if (input) {
          container.appendChild(el("span", "inserted", input));
        } else {
          container.appendChild(el("span", "slot", "[student input]"));
        }
      }
    });
  }

  // Rows of the outgoing payload: system (the teacher's rules) and user (the student's words).
  function renderMatrix(tbody, payload, metrics) {
    tbody.textContent = "";
    payload.messages.forEach(function (m, i) {
      var tr = el("tr", m.role === "user" ? "row-user" : "row-system");
      tr.appendChild(el("th", "role", m.role));
      var content = el("td", "content");
      content.appendChild(el("code", "", m.content || "(empty)"));
      tr.appendChild(content);
      var chars = i === 0 ? metrics.systemChars : metrics.inputChars;
      tr.appendChild(el("td", "num", String(chars)));
      tr.appendChild(el("td", "num", "~" + Sandbox.prompt.estimateTokens(chars)));
      tbody.appendChild(tr);
    });
    var total = el("tr", "row-total");
    total.appendChild(el("th", "role", "total"));
    total.appendChild(el("td", "content", "Both messages sent together"));
    total.appendChild(el("td", "num", String(metrics.totalChars)));
    total.appendChild(el("td", "num", "~" + metrics.tokens));
    tbody.appendChild(total);
  }

  function meter(label, percent, caption, tone) {
    var row = el("div", "meter");
    var head = el("div", "meter-head");
    head.appendChild(el("span", "meter-label", label));
    head.appendChild(el("span", "meter-caption", caption));
    row.appendChild(head);
    var track = el("div", "meter-track");
    var fill = el("div", "meter-fill " + (tone || ""));
    fill.style.width = Math.round(Math.max(0, Math.min(1, percent)) * 100) + "%";
    track.appendChild(fill);
    row.appendChild(track);
    return row;
  }

  // Interactive bars for the text structure: limit used, template vs student share.
  function renderMeters(container, metrics) {
    container.textContent = "";
    var limitTone = metrics.limitUsed >= 0.9 ? "hot" : metrics.limitUsed >= 0.7 ? "warm" : "cool";
    container.appendChild(meter("Input length", metrics.limitUsed,
      metrics.inputChars + " / " + metrics.inputLimit + " characters", limitTone));
    container.appendChild(meter("Student share of prompt", metrics.studentShare,
      Math.round(metrics.studentShare * 100) + "% of the message is the student's words", "violet"));
    container.appendChild(meter("Template share of prompt", 1 - metrics.studentShare,
      Math.round((1 - metrics.studentShare) * 100) + "% is the teacher's rules", "cool"));
  }

  Sandbox.viewer = {
    renderTemplate: renderTemplate,
    renderMatrix: renderMatrix,
    renderMeters: renderMeters,
    el: el
  };
})();
