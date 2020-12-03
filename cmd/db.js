module.exports = function (args, userdir) {
  var INSTALL = [
    "https://github.com/Omneedia/mysql-server/raw/master/mysql-server-win64.zip",
    "https://github.com/Omneedia/mysql-server/raw/master/mysql-server-win32.zip",
    "https://github.com/Omneedia/mysql-server/raw/master/mysql-server-macos.zip",
  ];
  var ora = require("ora");
  var chalk = require("chalk");
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

  var userdirdata = userdir + "/db";
  userdirdata += "/" + pro;
  var data = userdirdata + "/data";

  var root = require("path").normalize(__dirname + "/../");

  console.log(
    boxen(chalk.cyan(" DB "), {
      borderStyle: "round",
      borderColor: "cyan",
      float: "center",
      borderColor: "cyan",
    })
  );

  function mysql_stop(cb) {
    if (isWin) {
      return shelljs.exec("tskill mysqld", { silent: true }, function () {
        console.log(
          "\n\t" + logSymbols.success + chalk.green(" mySQL service stopped.\n")
        );
        if (cb) return cb();
      });
    }
    var pid = userdirdata + "/.pid";
    fs.readFile(pid, function (e, r) {
      try {
        if (e) return cb();
      } catch (e) {
        return error("mySQL server seems not running");
      }

      function displaymsg() {
        fs.unlink(pid, function () {
          console.log(
            "\n\t" +
              logSymbols.success +
              chalk.green(" mySQL service stopped.\n")
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
  function mysql_start() {
    mysql_stop(function () {
      if (!isWin) {
        var pid = userdirdata + "/.pid";
        fs.stat(pid, function (e, s) {
          if (s) error("MySQL is already running.");
          shelljs.exec(
            'nohup "' +
              root +
              '/mysql/bin/mysqld" --defaults-file="' +
              userdirdata +
              '/my.ini" --log-bin="' +
              data +
              '/binlog" -b "' +
              root +
              '/mysql" --datadir="' +
              data +
              '" &>"' +
              userdirdata +
              "/my.log" +
              '" & echo $! > "' +
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
                      " MySQL server running [PID " + pido.trim() + "]\n"
                    );
                  console.log(msg);
                });
              });
            }
          );
        });
      } else {
        var _cmd =
          root +
          "/mysql/bin/mysqld --defaults-file=" +
          userdirdata +
          "/my.ini -b " +
          root +
          "/mysql --datadir=" +
          data;
        var cmd = "start /b " + _cmd;
        fs.writeFileSync(userdirdata + "/mysql.cmd", cmd);
        shelljs.exec(
          userdirdata + "/mysql.cmd",
          {
            silent: true,
          },
          function () {
            var msg =
              "\t" +
              logSymbols.success +
              chalk.green(" mySQL server running \n");
            console.log(msg);
          }
        );
      }
    });
  }
  function mysql_create() {
    var ndx = args.indexOf("create");
    var dbname = args[ndx + 1];
    if (!dbname) error("No database name provided");
    var mysql = require("mysql2");
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
    });
    var spinner = ora("Creating database").start();
    con.connect(function (err) {
      if (err) return spinner.fail("connection failed.\n");
      con.query("CREATE DATABASE " + dbname, function (err, result) {
        con.close();
        if (err)
          return spinner.fail(
            "creating database " + chalk.bold(dbname) + " failed.\n"
          );
        spinner.succeed("Database " + chalk.bold(dbname) + " created\n");
      });
    });
  }
  function mysql_link() {
    var yaml = require("yaml");
    require("find-up")("manifest.yaml").then(function (filename) {
      if (!filename)
        return error("You must be inside an omneedia project directory");
      var manifest = yaml.parse(fs.readFileSync(filename, "utf-8"));
      var config = JSON.parse(
        fs.readFileSync(global.dir + "/config/settings.json", "utf-8")
      );
      if (!manifest.db) manifest.db = [];

      var ndx = args.indexOf("link");
      var dbname = args[ndx + 1];
      if (!dbname) error("No database name provided");
      if (manifest.db.indexOf(dbname) > -1) error("database already linked.");
      var spinner = ora("linking " + dbname).start();
      var mysql = require("mysql2");
      var con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: dbname,
      });
      return con.connect(function (err) {
        con.close();
        if (err) return spinner.fail("Database not found.\n");
        for (var i = 0; i < config.db.length; i++) {
          if (config.db[i].uri.indexOf("/" + dbname) > -1)
            return spinner.fail("Database already linked.\n");
        }
        config.db.push({
          name: dbname,
          uri: "mysql://root@localhost/" + dbname,
        });
        fs.writeFileSync(
          global.dir + "/config/settings.json",
          JSON.stringify(config, null, 4)
        );
        manifest.db.push(dbname);
        fs.writeFile(filename, yaml.stringify(manifest), function () {
          spinner.succeed("Database " + chalk.bold(dbname) + " linked\n");
        });
      });
    });
  }

  function mysql_unlink() {
    var yaml = require("yaml");
    require("find-up")("manifest.yaml").then(function (filename) {
      if (!filename)
        return error("You must be inside an omneedia project directory");
      var manifest = yaml.parse(fs.readFileSync(filename, "utf-8"));
      var config = JSON.parse(
        fs.readFileSync(global.dir + "/config/settings.json", "utf-8")
      );
      var ndx = args.indexOf("unlink");
      var dbname = args[ndx + 1];
      if (!dbname) error("No database name provided");
      if (manifest.db.indexOf(dbname) == -1) error("database not linked.");
      var spinner = ora("unlinking " + dbname).start();

      for (var i = 0; i < config.db.length; i++) {
        if (config.db[i].uri.indexOf("/" + dbname) > -1) {
          config.db.splice(i, 1);
          fs.writeFileSync(
            global.dir + "/config/settings.json",
            JSON.stringify(config, null, 4)
          );
          manifest.db.remove(dbname);
          fs.writeFile(filename, yaml.stringify(manifest), function () {
            spinner.succeed("Database " + chalk.bold(dbname) + " unlinked\n");
          });
          return;
        }
      }
      return spinner.fail("Database not linked\n");
    });
  }
  function mysql_import() {
    var ndx = args.indexOf("import");
    var fs = require("fs");
    var unzip = require("unzip-stream");
    var mysql = require("mysql2");
    var dbname = args[ndx + 1];
    var dbdest = args[ndx + 2];

    if (!dbname) error("NO DATABASE BACKUP PROVIDED");
    if (!dbdest) {
      error("NO DATABASE NAME PROVIDED");
    }
    var SQL = [];

    var counter = 0;

    function execSQL(t, ndx, cb) {
      if (!t[ndx]) return cb();
      var sql = __dirname + '/../mysql/bin/mysql -u root < "%s"';
      var item = userdir + "/" + t[ndx];
      fs.readFile(item, "utf-8", function (e, r) {
        var o = r.split("\n");
        for (var i = 0; i < o.length; i++) {
          if (o[i].indexOf("CREATE SCHEMA") > -1) {
            o[i] = "CREATE SCHEMA " + dbdest + ";";
          }
          if (o[i].indexOf("CREATE DATABASE") > -1) {
            o[i] = "CREATE DATABASE " + dbdest + ";";
          }
          if (o[i].indexOf("USE") == 0) {
            o[i] = "USE " + dbdest + ";";
          }
        }
        fs.writeFile(item, o.join("\n"), function (e) {
          shelljs.exec(
            require("util").format(sql, item),
            { silent: true },
            function () {
              fs.unlink(item, function () {
                execSQL(t, ndx + 1, cb);
              });
            }
          );
        });
      });
    }

    function restore_sql(SQL, x) {
      if (x) fs.unlinkSync(x);
      var sqls = [];
      var spinner = ora("Importing " + dbname + " to " + dbdest).start();
      for (var i = 0; i < SQL.length; i++) {
        if (SQL[i].indexOf("-schema") > -1) sqls.push(SQL[i]);
      }
      for (var i = 0; i < SQL.length; i++) {
        if (SQL[i].indexOf("-data") > -1) sqls.push(SQL[i]);
      }
      if (sqls.length == 0) {
        for (var i = 0; i < SQL.length; i++) sqls.push(SQL[i]);
      }
      execSQL(sqls, 0, function () {
        spinner.succeed("Database " + dbdest + " created.\n");
      });
    }

    async function openZip(x) {
      var SQLS = [];
      var zip = fs
        .createReadStream(
          dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length)
        )
        .pipe(unzip.Parse());
      for await (var entry of zip) {
        if (entry.path.indexOf(".sql") > -1) {
          SQLS.push(
            entry.path.substr(
              entry.path.lastIndexOf("/") + 1,
              entry.path.length
            )
          );
        }
        entry.autodrain();
      }
      var counter = 0;
      zip = fs
        .createReadStream(
          dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length)
        )
        .pipe(unzip.Parse());
      for await (var entry of zip) {
        var filePath = entry.path;
        if (filePath.indexOf(".sql") > -1) {
          var filename = filePath.substr(
            filePath.lastIndexOf("/") + 1,
            filePath.length
          );
          entry
            .pipe(fs.createWriteStream(userdir + "/" + filename))
            .on("finish", function () {
              counter++;
              if (counter == SQLS.length)
                return restore_sql(
                  SQLS,
                  dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length)
                );
            });
        } else entry.autodrain();
      }
    }
    if (dbname.indexOf(".zip") == -1)
      return error("ONLY ZIP FILES ARE ALLOWED BY NOW.");
    if (dbname.indexOf("http") > -1) {
      var spinner = ora(
        "Downloading " +
          dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length)
      ).start();
      global
        .request(dbname)
        .pipe(
          fs.createWriteStream(
            dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length)
          )
        )
        .on("close", async function () {
          spinner.succeed(
            dbname.substr(dbname.lastIndexOf("/") + 1, dbname.length) +
              " downloaded."
          );
          openZip(1);
        });
    } else {
      if (dbname.indexOf(".zip") > -1) return openZip();
    }
  }
  function mysql_uninstall() {
    fs.rmdir(root + "/mysql", { recursive: true }, (err) => {
      if (err) {
        console.log(
          "\t" +
            logSymbols.error +
            chalk.red(
              " MySQL Server can't been uninstalled. Check if service is running..."
            )
        );
      }
      console.log(
        "\t" +
          logSymbols.success +
          chalk.green(" MySQL Server has been uninstalled.\n")
      );
    });
  }
  function init_db() {
    fs.stat(data + "/auto.cnf", function (e, r) {
      if (e) {
        console.log(
          "\t" + logSymbols.success + chalk.green(" Init MySQL Server")
        );
        shelljs.exec(
          root +
            '/mysql/bin/mysqld --defaults-file="' +
            userdirdata +
            '/my.ini" -b "' +
            root +
            '/mysql" --datadir="' +
            data +
            '" --initialize-insecure',
          {
            silent: true,
          },
          function () {
            var msg =
              "\n\t" +
              logSymbols.success +
              chalk.green(" MySQL installed.") +
              " - Don't forget to start server with " +
              chalk.bold("oa db start") +
              "\n";
            console.log(msg);
          }
        );
      } else {
        var msg =
          "\n\t" +
          logSymbols.success +
          chalk.green(" MySQL installed.") +
          " - Don't forget to start server with " +
          chalk.bold("oa db start") +
          "\n";
        console.log(msg);
      }
    });
  }
  function conf_db() {
    var myini = [
      "[mysqld]",
      "sql_mode=NO_ENGINE_SUBSTITUTION,STRICT_TRANS_TABLES",
      "max_allowed_packet=160M",
      "innodb_force_recovery=0",
      "port=3306",
      "federated",
      "show_compatibility_56 = ON",
      "server-id = 1",
    ];
    fs.writeFile(userdirdata + "/my.ini", myini.join("\r\n"), init_db);
  }
  function mysql_install() {
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
      console.log("\n\tInstalling MySQL...");
      var unzip = require("unzip-stream");
      fs.createReadStream(filename)
        .pipe(
          unzip.Extract({
            path: path.dirname(filename),
          })
        )
        .on("error", function (e) {
          console.log(e);
          fs.unlink(filename, mysql_install);
        })
        .on("close", function () {
          fs.unlink(filename, function () {
            var arch = OS.arch();
            if (OS.platform() == "darwin") {
              shelljs.mv(root + sep + "macos", root + sep + "mysql");
              shelljs.chmod(
                755,
                root + sep + "mysql" + sep + "bin" + sep + "mysqld"
              );
              fs.mkdir(data, { recursive: true }, conf_db);
            }
            if (OS.platform() == "win32") {
              if (OS.arch() == "x64") {
                rn(root + sep + "win64", root + sep + "mysql", function () {
                  fs.mkdir(data, { recursive: true }, conf_db);
                });
              } else {
                rn(root + sep + "win32", root + sep + "mysql", function () {
                  fs.mkdir(data, { recursive: true }, conf_db);
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
              "\tDownload MySQL server [ {bar} ] {percentage}% | ETA: {eta}s",
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
  function mysql_api() {
    var model = `
      description: "",
      routes: {
        "/%": [
          {
            get: function (req, res) {},
            description: "retourne la liste des 100 derniers marchés publics",
          },
        ],
      },
    `;
    var config = JSON.parse(
      fs.readFileSync(global.dir + "/config/settings.json", "utf-8")
    );
    var ndx = args.indexOf("api");
    var dbname = args[ndx + 1];
    var table = args[ndx + 2];
    if (!dbname) error("No database name provided");
    var spinner = ora("linking " + dbname).start();
    var mysql = require("mysql2");
    var con = mysql.createConnection({
      host: "localhost",
      user: "root",
      password: "",
      database: dbname,
    });
    return con.connect(function (err) {
      con.close();
      if (err) return spinner.fail("Database not found.\n");
      var routes = {};
      routes["/" + dbname + "/" + table] = [
        {
          get: function (req, res) {},
          description: "",
        },
        {
          post: function (req, res) {},
          description: "",
        },
        {
          put: function (req, res) {},
          description: "",
        },
        {
          delete: function (req, res) {},
          description: "",
        },
      ];
      var model = {
        description: "CRUD",
        routes: routes,
      };
      var str =
        "module.exports=function(app,express) {\nreturn " +
        JSON.stringify(model, null, 4) +
        "\n}";
      fs.writeFile(
        global.dir + "/src/api/" + table + ".js",
        str,
        function () {}
      );
    });
  }
  function process_args() {
    switch (args[0]) {
      case "api":
        mysql_api();
        break;
      case "start":
        mysql_start();
        break;
      case "stop":
        mysql_stop();
        break;
      case "create":
        mysql_create();
        break;
      case "remove":
        mysql_remove();
        break;
      case "link":
        mysql_link();
        break;
      case "unlink":
        mysql_unlink();
        break;
      case "update":
        mysql_update();
        break;
      case "install":
        mysql_install();
        break;
      case "uninstall":
        mysql_uninstall();
        break;
      case "import":
        mysql_import();
        break;
      default:
    }
  }
  process_args();
};
