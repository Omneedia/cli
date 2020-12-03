module.exports = function (args, root) {
  var opn = require("open");
  var browser = {};

  if (global.config) {
    if (global.config.browser) {
      var b = global.config.browser.default;
      // a écrire et a tester pour windows et linux... Les racourcis ne sont pas les mêmes.
      if (require("os").platform() == "win32") {
        if (b == "google") browser.app = "chrome";
        if (b == "chrome") browser.app = "chrome";
        if (b == "safari") browser.app = "safari";
        if (b == "opera") browser.app = "opera";
        if (b == "firefox") browser.app = "firefox";
      } else {
        if (b == "canary") browser.app = "google chrome canary";
        if (b == "google") browser.app = "google chrome";
        if (b == "chrome") browser.app = "google chrome";
        if (b == "safari") browser.app = "safari";
        if (b == "opera") browser.app = "opera";
        if (b == "firefoxdev") browser.app = "firefox developer edition";
      }
    }
  }

  opn(
    "https://www.notion.so/stephanezucatti/Omneedia-Docs-c0b4b8c14f1f4dd295813475973975d5",
    {
      app: browser.app,
    }
  );
};
