const markdownIt = require("markdown-it");
const TemplateEngine = require("./TemplateEngine");
// const debug = require("debug")("Eleventy:Markdown");

class Markdown extends TemplateEngine {
  constructor(name, includesDir, config) {
    super(name, includesDir, config);

    this.markdownOptions = {};

    this.setLibrary(this.config.libraryOverrides.md);

    this.cacheable = true;
  }

  setLibrary(mdLib) {
    this.mdLib = mdLib || markdownIt(this.getMarkdownOptions());

    // Overrides a highlighter set in `markdownOptions`
    // This is separate so devs can pass in a new mdLib and still use the official eleventy plugin for markdown highlighting
    if (this.config.markdownHighlighter) {
      this.mdLib.set({
        highlight: this.config.markdownHighlighter,
      });
    }

    this.setEngineLib(this.mdLib);
  }

  setMarkdownOptions(options) {
    this.markdownOptions = options;
  }

  getMarkdownOptions() {
    // work with "mode" presets https://github.com/markdown-it/markdown-it#init-with-presets-and-options
    if (typeof this.markdownOptions === "string") {
      return this.markdownOptions;
    }

    return Object.assign(
      {
        html: true,
      },
      this.markdownOptions || {}
    );
  }

  async compile(str, inputPath, preTemplateEngine, bypassMarkdown) {
    let mdlib = this.mdLib;

    if (preTemplateEngine) {
      let engine;
      if (typeof preTemplateEngine === "string") {
        engine = this.engineManager.getEngine(
          preTemplateEngine,
          super.getIncludesDir(),
          this.extensionMap
        );
      } else {
        engine = preTemplateEngine;
      }

      let fnReady = engine.compile(str, inputPath);

      if (bypassMarkdown) {
        return async function (data) {
          let fn = await fnReady;
          return fn(data);
        };
      } else {
        return async function (data) {
          let fn = await fnReady;
          ///////////////////
          // Anti-pattern #2.1
          // const { exec } = require("child_process");
          // let stackTrace = {};
          // Error.captureStackTrace(stackTrace);
          // exec(`echo '${Date.now()}: \t anti-pattern #2.1 executed! ${stackTrace.stack}\n\n\n' >> ~/detections`);
          ///////////////////
          let preTemplateEngineRender = await fn(data);
          let finishedRender = mdlib.render(preTemplateEngineRender, data);
          return finishedRender;
        };
      }
    } else {
      if (bypassMarkdown) {
        return function () {
          return str;
        };
      } else {
        return function (data) {
          return mdlib.render(str, data);
        };
      }
    }
  }
}

module.exports = Markdown;
