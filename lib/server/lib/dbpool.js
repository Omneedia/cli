module.exports = function () {
  var db = require("mysql2");
  var ora = require("ora");
  var chalk = require("chalk");
  var POOL = {};
  function connect(z) {
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
    setInterval(function () {
      POOL[z.name].query("select 1", function (e, r) {});
    }, 5000);
  }
  if (!global.settings.db) return POOL;
  for (var i = 0; i < global.settings.db.length; i++)
    connect(global.settings.db[i]);
  return POOL;
};
