module.exports = function (args, root) {
  var fs = require("fs");
  var shelljs = require("shelljs");
  fs.stat(__dirname + "/../node_modules/.bin/ng", function (e, s) {
    if (e) {
      var ora = require("ora");
      var spinner = ora("Installing angular... Please wait...").start();
      shelljs.cd(__dirname + "/..", { silent: true });
      shelljs.exec("npm install @angular/cli");
      spinner.succeed("Angular installed successfully.");
    }
    shelljs.exec(__dirname + "/../node_modules/.bin/ng " + args.join(" "));
  });
};
