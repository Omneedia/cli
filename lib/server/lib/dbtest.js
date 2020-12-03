module.exports = function (cb) {
  var db = require("mysql2");
  var ora = require("ora");
  var chalk = require("chalk");
  var POOL = {};

  function connect(gs, ndx, cb) {
    if (!gs[ndx]) return cb();
    var z = gs[ndx];
    var spinner = ora("Connecting to database: " + chalk.bold(z.name)).start();

    var name = z.uri;
    var host = name.split("://")[1];
    host = host.split("@")[1].split(":")[0];
    if (host.indexOf("/") > -1) host = host.split("/")[0];

    try {
      var port = name.split("://")[1].split("@")[1].split(":")[1].split("/")[0];
    } catch (e) {
      var port = 3306;
    }
    var user = name.split("://")[1].split("@")[0].split(":")[0];
    var password = name.split("://")[1].split("@")[0].split(":")[1];

    var config = {
      connectionLimit: 1500,
      host: host,
      user: user,
      port: port,
      password: password,
      waitForConnections: true,
      database: name.split("://")[1].split("@")[1].split("/")[1],
    };

    POOL[z.name] = db.createPool(config);

    POOL[z.name].getConnection(function (err, conn) {
      if (err) {
        spinner.fail("Database failed: " + chalk.bold(z.name));
        setTimeout(function () {
          connect(gs, ndx, cb);
        }, 1000);
      } else {
        POOL[z.name].releaseConnection(conn);
        spinner.succeed("Database connected: " + chalk.bold(z.name));

        connect(gs, ndx + 1, cb);
      }
    });
  }
  if (!global.settings) throw "NO_SETTINGS";
  if (typeof global.settings === "string" || global.settings instanceof String)
    global.settings = JSON.parse(global.settings);

  if (!global.settings.db) return cb();

  connect(global.settings.db, 0, cb);
};
