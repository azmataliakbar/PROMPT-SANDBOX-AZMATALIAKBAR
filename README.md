# Prompt Sandbox

An interactive classroom sandbox that shows how a teacher's template and a student's words combine into a prompt. Plain HTML, CSS and JavaScript, with no build step and no npm.

- **Templates:** two built-in templates (haiku and "explain like I am 5") and your own custom templates
- **Age groups:** choose Ages 4-6, 7-10, 11-15, 16-18 or Adults. The rules and the reply’s tone change to suit.
- **Prompt designer:** answer a few questions (task, format, tone, length, rules) and get a ready template, saved with one click.
- **Question tips:** friendly suggestions for asking a better question, such as adding detail or saying what you want.
- **Compose:** type a topic, see the length and token meters, and run the prompt
- **Preview:** the template with the student's words highlighted where they land, and the payload as two role-separated messages
- **Run log:** a visible history of runs, including errors and stops
- **Template creator:** save custom templates in this browser, with export and import as JSON
- **Responsive:** from 270px up to large laptops. On phones, four tabs at the bottom: Templates, Compose, Preview and Log
- **Watermark:** "Idea By: Azmat Ali" fixed at the bottom

## Run locally

Double-click `index.html`. No server is needed.

## Simulated model

The sandbox runs a built-in simulator. It makes no network calls, so no data leaves the browser. Replies are deterministic for the same input, which makes them useful for teaching. A reply that notices an override phrase says it will keep to the task.

## Safety notes

- Student text is inserted with literal replacement, so characters such as `$&` are never interpreted.
- Control characters are removed, and input is capped at 500 characters.
- The student's words and the teacher's rules are sent as separate messages.
- Phrases that try to override the rules are flagged for discussion. They are not blocked, and a flag does not stop a determined person from writing such text. The sandbox shows the risk so it can be discussed; it does not claim to prevent it.
- All text is written with `textContent`, never `innerHTML`.

## Run the tests

Open `tests/index.html`. Every line starts with PASS or FAIL, and the last line gives the total. The tests use no network and do not touch saved templates.

## Structure

```
index.html            page structure and script order
css/app.css           layout, breakpoints, neon status borders, meters, watermark
js/config.js          limits, timing, namespace and built-in templates
js/util/storage.js    safe localStorage with an in-memory fallback
js/core/prompt.js     literal substitution, cleaning, validation, payload, metrics
js/core/templates.js  template library under the namespace sandbox.v1.templates
js/core/simulator.js  synthetic model and word-by-word streaming
js/core/provider.js   runs a payload through the provider, with timeout and cancel
js/core/log.js        run history
js/core/tools.js      named tools with argument checks (MCP-style interface)
js/ui/viewer.js       split view, payload matrix and meters (text only, no innerHTML)
js/app.js             wiring: tabs, compose, run, creator, import and export
tests/                browser unit tests
```

## Tool layer

The UI calls named tools: `templates.*`, `prompt.validate`, `prompt.build`, `prompt.run` and `log.*`. A real MCP server runs as a separate process, which a static page cannot start, so the tools run in the page. Connecting a live model would need a small backend that keeps the API key secret.

## Deploy to Netlify

- **Drag and drop:** drag the `prompt-sandbox` folder onto https://app.netlify.com/drop
- **From GitHub:** connect the repository in Netlify. Build command: empty. Publish directory: `.`

The only external request is the calligraphy font from Google Fonts. The app works without it, using the system cursive font.
