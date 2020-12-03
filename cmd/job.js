module.exports = function (args, userdir) {
  var INSTALL = [
    "https://github.com/omneedia/redis-server/raw/master/redis-64bit.zip",
    "https://github.com/omneedia/redis-server/raw/master/redis-32bit.zip",
    "https://github.com/Omneedia/redis-server/raw/master/redis-macos.zip",
  ];
  var sep = require("path").sep;
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

  var ROOT = require("path").normalize(__dirname + "/../");

  console.log(
    boxen(chalk.cyan(" JOB "), {
      borderStyle: "round",
      borderColor: "cyan",
      float: "center",
      borderColor: "cyan",
    })
  );

  function process_args() {
    switch (args[0]) {
      case "install":
        redis_install();
        break;
      case "uninstall":
        redis_uninstall();
        break;
      case "start":
        redis_start();
        break;
      case "stop":
        redis_stop();
        break;
      default:
    }
  }
  function redis_stop(cb) {
    if (isWin) {
      return shelljs.exec("tskill redis-server", { silent: true }, function () {
        console.log(
          "\n\t" + logSymbols.success + chalk.green(" REDIS service stopped.\n")
        );
        if (cb) return cb();
      });
    }
    var pid = userdir + "/.rid";
    fs.readFile(pid, function (e, r) {
      try {
        if (e) return cb();
      } catch (e) {
        return error("REDIS server seems not running");
      }
      function displaymsg() {
        fs.unlink(pid, function () {
          console.log(
            "\n\t" +
              logSymbols.success +
              chalk.green(" REDIS service stopped.\n")
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
  function redis_start() {
    redis_stop(function () {
      if (!isWin) {
        var pid = userdir + "/.rid";
        fs.stat(pid, function (e, s) {
          if (s) error("REDIS is already running.");
          shelljs.cd(userdir);
          fs.unlink(userdir + "/dump.rdb", function () {
            shelljs.exec(
              'nohup "' +
                ROOT +
                '/redis/redis-server" "' +
                ROOT +
                '/redis/redis.conf" &>"' +
                userdir +
                "/redis.log" +
                '" & echo $! > "' +
                pid +
                '"',
              {
                silent: true,
              },
              function () {
                fs.readFile(pid, function (e, r) {
                  if (e) return error(" REDIS server can't be started.");
                  var pido = r.toString("utf-8");
                  fs.writeFile(pid, pido.trim(), function () {
                    var msg =
                      "\n\t" +
                      logSymbols.success +
                      chalk.green(
                        " REDIS server running [PID " + pido.trim() + "]\n"
                      );
                    console.log(msg);
                  });
                });
              }
            );
          });
        });
      } else {
        var cmd =
          `start /b /min ` +
          ROOT +
          `\\redis\\redis-server ` +
          ROOT +
          `\\redis\\redis.windows.conf`;
        fs.writeFile(
          ROOT + sep + "redis" + sep + "rserver.cmd",
          cmd,
          function () {
            fs.unlink(userdir + "/dump.rdb", function () {
              var spawn = require("child_process").spawn;
              spawn(ROOT + sep + "redis" + sep + "rserver.cmd", [], {
                stdio: "ignore",
                windowsHide: true,
                shell: true,
                detached: true,
              });
              var msg =
                "\n\t" +
                logSymbols.success +
                chalk.green(" REDIS server running\n");
              console.log(msg);
            });
          }
        );
      }
    });
  }
  function redis_install() {
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
      ROOT + sep + url.substr(url.lastIndexOf("/") + 1, url.length)
    );

    function setmeup() {
      console.log("\n\tInstalling REDIS...");
      var unzip = require("unzip-stream");

      fs.createReadStream(filename)
        .pipe(
          unzip.Extract({
            path: path.dirname(filename),
          })
        )
        .on("error", function (e) {
          console.log(e);
          fs.unlink(filename, redis_install);
        })
        .on("close", function () {
          fs.unlink(filename, function () {
            var arch = OS.arch();
            if (OS.platform() == "darwin") {
              //shelljs.mv(root + sep + "macos", root + sep + "redis");
              shelljs.chmod(755, ROOT + sep + "redis" + sep + "redis-server");
              redis_start();
            }
            if (OS.platform() == "win32") {
              if (OS.arch() == "x64") {
                rn(ROOT + sep + "64bit", ROOT + sep + "redis", function () {
                  var msg =
                    "\n\t" +
                    logSymbols.success +
                    chalk.green(" REDIS installed.") +
                    " - Don't forget to start server with " +
                    chalk.bold("oa job start") +
                    "\n";
                  console.log(msg);
                });
              } else {
                rn(ROOT + sep + "32bit", ROOT + sep + "redis", function () {
                  var msg =
                    "\n\t" +
                    logSymbols.success +
                    chalk.green(" REDIS installed.") +
                    " - Don't forget to start server with " +
                    chalk.bold("oa job start") +
                    "\n";
                  console.log(msg);
                });
              }
            }
          });
        });
    }

    fs.stat(filename, function (e) {
      if (e) {
        var Request = global.request;

        var progress = require("request-progress");
        var _progress = require("cli-progress");

        var bar1 = new _progress.Bar(
          {
            format:
              "\tDownload REDIS server [ {bar} ] {percentage}% | ETA: {eta}s",
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
  process_args();
};
