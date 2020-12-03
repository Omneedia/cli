module.exports = function (args, root) {
  var shelljs = require("shelljs");
  var fs = require("fs");
  var findUp = require("find-up");
  var path = require("path");
  function exec(cmd, ndx, cb) {
    if (!cmd[ndx]) return cb();
    shelljs.exec(
      __dirname +
        "/../node_modules/.bin/mocha " +
        global.rootdir +
        "/src/test/" +
        cmd[ndx]
    );
    exec(cmd, ndx + 1, cb);
  }
  findUp("manifest.yaml").then(function (test) {
    if (!test) return error("You must be inside an omneedia app directory");
    global.rootdir = path.dirname(test);
    if (args.length == 0) {
      fs.readdir(global.rootdir + "/src/test", function (e, s) {
        if (e) return error("No testing found.");
        exec(s, 0, function () {
          console.log("\n");
        });
      });
    } else
      shelljs.exec(__dirname + "/../node_modules/.bin/mocha " + args.join(" "));
  });
};
