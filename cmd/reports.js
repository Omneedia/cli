module.exports = function (args, userdir) {
  var INSTALL = [
    "https://github.com/jsreport/jsreport/releases/download/2.10.0/jsreport-win.zip",
    "https://github.com/jsreport/jsreport/releases/download/2.10.0/jsreport-win.zip",
    "https://github.com/jsreport/jsreport/releases/download/2.10.0/jsreport-osx.tar.gz",
  ];
  var prettyjson = require("prettyjson");
  var shelljs = require("shelljs");
  const logSymbols = require("log-symbols");
  var chalk = require("chalk");
  var fs = require("fs");
  var boxen = require("boxen");
  var yaml = require("yaml");
  var error = require("../lib/utils/error");

  var isWin = /^win/.test(process.platform);

  var pro = "default";

  var userdirdata = userdir + "/";

  var root = require("path").normalize(__dirname + "/../");

  console.log(
    boxen(chalk.cyan(" REPORTS "), {
      borderStyle: "round",
      borderColor: "cyan",
      float: "center",
      borderColor: "cyan",
    })
  );

  function reports_stop(cb) {
    var sep = "\\";
    var ROOT = __dirname + "\\..";
    if (isWin) {
      return shelljs.exec("tskill jsreport", { silent: true }, function () {
        console.log(
          "\n\t" +
            logSymbols.success +
            chalk.green(" REPORTS service stopped.\n")
        );
        if (cb) return cb();
      });
    }
    var pid = userdirdata + "/.zid";
    fs.readFile(pid, function (e, r) {
      try {
        if (e) return cb();
      } catch (e) {
        return error("Reports server seems not running");
      }

      function displaymsg() {
        fs.unlink(pid, function () {
          console.log(
            "\n\t" +
              logSymbols.success +
              chalk.green(" Reports service stopped.\n")
          );
          if (cb) return cb();
        });
      }

      var PID = r.toString("utf-8");
      if (!isWin) {
        shelljs.exec("kill -9 " + PID, {
          silent: true,
        });
        fs.unlink(pid, displaymsg);
      } else {
        shelljs.exec("taskkill /F /PID " + PID, {
          silent: true,
        });
        fs.unlink(pid, displaymsg);
      }
    });
  }

  function reports_start() {
    var sep = "\\";
    var ROOT = __dirname + "\\..";
    if (isWin) {
      return reports_stop(function () {
        var cmd = `start /b /min ` + ROOT + `\\reports\\jsreport start`;
        fs.writeFile(
          ROOT + sep + "reports" + sep + "start.cmd",
          cmd,
          function () {
            var spawn = require("child_process").spawn;
            spawn(ROOT + sep + "reports" + sep + "start.cmd", [], {
              stdio: "ignore",
              windowsHide: true,
              shell: true,
              detached: true,
            });
            var msg =
              "\n\t" +
              logSymbols.success +
              chalk.green(" REPORTS server running\n");
            console.log(msg);
          }
        );
      });
    }

    reports_stop(function () {
      var pid = userdirdata + "/.zid";
      fs.stat(pid, function (e, s) {
        if (s) error("Reports server is already running.");
        shelljs.exec(
          'nohup "' +
            root +
            'reports/jsreport" start &>"' +
            userdirdata +
            '/reports.log" & echo $! > "' +
            pid +
            '"',
          {
            silent: true,
          },
          function () {
            fs.readFile(pid, function (e, r) {
              var pido = r.toString("utf-8");
              fs.writeFile(pid, pido.trim(), function () {
                var msg =
                  "\n\t" +
                  logSymbols.success +
                  chalk.green(
                    " Reports server running [PID " + pido.trim() + "]\n"
                  );
                console.log(msg);
              });
            });
          }
        );
      });
    });
  }

  function reports_install() {
    function rn(src, dest, cb) {
      fs.rename(src, dest, function (e) {
        if (e)
          return setTimeout(function () {
            rn(src, dest, cb);
          }, 1000);
        cb();
      });
    }
    var OS = require("os");
    var path = require("path");
    var sep = "/";
    console.log("\n");
    var arch = OS.arch();

    if (OS.platform() == "darwin") var url = INSTALL[2];
    if (OS.platform() == "win32") {
      if (OS.arch() == "x64") var url = INSTALL[0];
      else var url = INSTALL[1];
    }

    var filename = path.resolve(
      root + sep + url.substr(url.lastIndexOf("/") + 1, url.length)
    );

    function setmeup() {
      console.log("\n\tInstalling Reports server...");
      if (OS.platform() == "darwin") {
        var shelljs = require("shelljs");
        shelljs.exec(
          'tar -xzvf "' + filename + '"',
          { silent: true },
          function () {
            fs.unlink(filename, function () {
              fs.mkdir(path.dirname(filename) + "/reports", function () {
                fs.rename(
                  path.dirname(filename) + "/jsreport",
                  path.dirname(filename) + "/reports/jsreport",
                  function () {
                    var msg =
                      "\n\t" +
                      logSymbols.success +
                      chalk.green(" Reports Server installed.") +
                      " - Don't forget to start server with " +
                      chalk.bold("oa reports start") +
                      "\n";
                    console.log(msg);
                  }
                );
              });
            });
          }
        );
      } else {
        var unzip = require("unzip-stream");
        fs.createReadStream(filename)
          .pipe(
            unzip.Extract({
              path: path.dirname(filename),
            })
          )
          .on("error", function (e) {
            console.log(e);
            fs.unlink(filename, reports_install);
          })
          .on("close", function () {
            fs.unlink(filename, function () {
              fs.mkdir(path.dirname(filename) + "/reports", function () {
                fs.rename(
                  path.dirname(filename) + "/jsreport.exe",
                  path.dirname(filename) + "/reports/jsreport.exe",
                  function () {
                    var msg =
                      "\n\t" +
                      logSymbols.success +
                      chalk.green(" Reports Server installed.") +
                      " - Don't forget to start server with " +
                      chalk.bold("oa reports start") +
                      "\n";
                    console.log(msg);
                  }
                );
              });
            });
          });
      }
    }

    fs.stat(filename, function (e) {
      if (e) {
        var Request = global.request;

        var progress = require("request-progress");
        var _progress = require("cli-progress");

        var bar1 = new _progress.Bar(
          {
            format:
              "\tDownload Reports server [ {bar} ] {percentage}% | ETA: {eta}s",
          },
          _progress.Presets.shades_classic
        );
        bar1.start(100, 0, {
          speed: "N/A",
          barCompleteChar: "\u2588",
          barIncompleteChar: "\u2591",
        });

        progress(Request(url), {})
          .on("progress", function (state) {
            bar1.update(Math.trunc(state.percent * 100), {
              speed: state.speed,
            });
          })
          .on("error", function (err) {
            error(err);
          })
          .on("end", function () {
            bar1.update(100, {
              speed: 0,
            });
            bar1.stop();
            setmeup();
          })
          .pipe(fs.createWriteStream(filename));
      } else setmeup();
    });
  }

  function reports_uninstall() {}

  function process_args() {
    switch (args[0]) {
      case "start":
        reports_start();
        break;
      case "stop":
        reports_stop();
        break;
      case "install":
        reports_install();
        break;
      case "uninstall":
        reports_uninstall();
        break;
      default:
    }
  }
  process_args();
};
