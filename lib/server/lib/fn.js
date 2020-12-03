module.exports = function (app, express, agServer) {
  var fs = require("fs");
  var sep = "/";

  function processRoute(req, resp, next) {
    /*
    DECODE AUTH JWT
    */
    var jwt = require("jsonwebtoken");
    var decoded = {
      user: {},
    };

    try {
      decoded = jwt.verify(
        req.headers["authorization"].split(" ")[1],
        global.authKey
      );
      decoded = JSON.parse(decoded);
    } catch (e) {}

    var parseFunction = require("@omneedia/parse-function");
    var parser = parseFunction({
      ecmaVersion: 2017,
    });

    function process_api(d, i, batch, res) {
      if (!d[i]) {
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.write(JSON.stringify(batch, "utf8"));
        return res.end();
      }

      var api = d[i];
      try {
        var name = require.resolve(api.action);
        delete require.cache[name];
      } catch (e) {}
      if (!api.action) return resp.status(400).end("BAD_REQUEST");
      try {
        if (api.action == "__QUERY__") {
          var x = require("@omneedia" + sep + "db" + sep + "__QUERY__.js")();
        } else {
          var x = require(global.project.fn + sep + api.action + ".js");
          //console.log(global.project.api + sep + api.action + ".js");
        }
      } catch (e) {
        //resp.send('console.log("%c API ' + ns.split('.')[0] + ' ERROR ","background-color: red; color: white;font-size: 14px; font-weight: bold",' + JSON.stringify(e.toJSON()) + ');');
        return resp.status(400).end("API_ERROR");
      }

      if (!decoded.user.uid) {
        x.auth = req.session.user;
      } else x.auth = decoded.user;
      x.session = req.session;
      x.io = agServer;
      x.db = require("./db");

      if (req.headers.i18n) x.i18n = req.headers.i18n;

      x._ = function (str, cb) {
        var lang = this.i18n;
        require("fs").readFile(
          global.project.culture + "/" + lang + ".yaml",
          "utf-8",
          function (e, r) {
            if (e) return cb(str);
            var arr = require("yaml").parse(r);
            cb(arr[str]);
          }
        );
      };

      x = Object.assign(x, require(__dirname + "/global.js")());

      var myfn = parser.parse(x[api.method]);
      var response = {};
      response.params = myfn.args;
      var p = [];
      if (response.params.length > 1) {
        for (var e = 0; e < response.params.length - 1; e++) {
          if (!api.data) return resp.status(400).end("BAD_REQUEST");
          p.push(api.data[e]);
        }
      }

      function go() {
        p.push(function (err, response) {
          if (err) {
            batch.push({
              action: api.action,
              method: api.method,
              result: response,
              message: err.message,
              data: err,
              tid: api.tid,
              type: "rpc",
            });
          } else {
            err = null;
            batch.push({
              action: api.action,
              method: api.method,
              result: response,
              tid: api.tid,
              type: "rpc",
            });
          }
          process_api(d, i + 1, batch, res);
        });
        try {
          x[api.method].apply(x, p);
        } catch (e) {
          batch.push({
            type: "exception",
            action: api.action,
            method: api.method,
            message: e.message,
            data: e,
          });
          return process_api(d, i + 1, batch, res);
        }
      }

      if (api.action == "__QUERY__") {
        var decrypt = function (key, data) {
          function keyCharAt(key, i) {
            return key.charCodeAt(Math.floor(i % key.length));
          }
          var arr = Buffer.from(data, "base64").toString("utf-8");
          if (arr.indexOf("|") == -1) return false;
          var _key = arr.split("|")[1];
          if (!_key) return false;
          if (_key != key) return false;
          arr = arr.split("|")[0].match(/.{1,3}/g);
          var decode = [];
          for (var i = 0; i < arr.length; i++) {
            decode.push(String.fromCharCode(arr[i] * 1 - keyCharAt(key, i)));
          }
          return decode.reverse().join("");
        };
        try {
          require(global.project.auth + sep + "api")(
            req.session.user,
            decrypt(global.authKey, api.data[0].__SQL__),
            function (next) {
              if (next) go();
              else {
                batch.push({
                  action: api.action,
                  method: api.method,
                  result: false,
                  message: "ACCESS_DENIED",
                  data: {
                    err: true,
                    msg: "ACCESS_DENIED",
                  },
                  tid: api.tid,
                  type: "rpc",
                });
                return process_api(d, i + 1, batch, res);
              }
            }
          );
        } catch (e) {
          return go();
        }
      } else {
        try {
          require(global.project.auth + sep + "api")(
            req.session.user,
            api.data[0].__SQL__,
            function (next) {
              if (next) go();
              else {
                batch.push({
                  action: api.action,
                  method: api.method,
                  result: false,
                  message: "ACCESS_DENIED",
                  data: {
                    err: true,
                    msg: "ACCESS_DENIED",
                  },
                  tid: api.tid,
                  type: "rpc",
                });
                return process_api(d, i + 1, batch, res);
              }
            }
          );
        } catch (e) {
          return go();
        }
      }
    }

    var data = req.body;

    var d = [];
    if (data instanceof Array) {
      d = data;
    } else {
      d.push(data);
    }

    process_api(d, 0, [], resp);
  }

  app.post("/fn", processRoute);

  app.get("/fn", function (req, res) {
    res.header("Content-Type", "application/json; charset=utf-8");
    var api = {
      api: {
        status: "ok",
      },
    };
    res.end(JSON.stringify(api));
  });

  app.get("/fn/:ns", function (req, res) {
    if (!global.manifest.framework) global.manifest.framework = "omneedia";
    function process_TS() {
      // coding required
    }
    function process_JS() {
      var REMOTE_API = {};
      if (req.connection.encrypted) var s = "s";
      else var s = "";
      REMOTE_API.url = "http" + s + "://" + req.headers.host + "/fn";
      REMOTE_API.type = "remoting";

      if (global.manifest.services) {
        if (global.manifest.services.ns)
          REMOTE_API.namespace = global.manifest.services.ns;
        else REMOTE_API.namespace = "App";
      } else REMOTE_API.namespace = "App";
      REMOTE_API.descriptor = "App.REMOTING_API";
      REMOTE_API.actions = {};
      REMOTE_API.actions[req.params.ns] = [];

      if (req.params.ns.indexOf("__QUERY__") == -1) {
        // MicroAPI
        var ns = req.params.ns;
        if (ns.indexOf(".js") == -1) ns += ".js";
        fs.stat(global.project.fn + sep + ns, function (e, s) {
          try {
            var _api = require(global.project.fn + sep + ns);
          } catch (e) {
            return res.end(
              'console.log("%c API ' +
                ns.split(".")[0] +
                ' ERROR ","background-color: red; color: white;font-size: 14px; font-weight: bold",' +
                JSON.stringify(e.toJSON()) +
                ");"
            );
          }
          for (var e in _api) {
            if (_api[e]) {
              if (_api[e].toString().substr(0, 8) == "function") {
                var obj = {};
                obj.name = e;
                var myfn = _api[e]
                  .toString()
                  .split("function")[1]
                  .split("{")[0]
                  .trim()
                  .split("(")[1]
                  .split(")")[0]
                  .split(",");
                obj.len = myfn.length - 1;
                REMOTE_API.actions[req.params.ns][
                  REMOTE_API.actions[req.params.ns].length
                ] = obj;
              }
            }
          }
          if (global.manifest.services) {
            if (global.manifest.services.ns)
              var NS = global.manifest.services.ns;
            else var NS = "App";
          } else NS = "App";
          if (global.manifest.framework.toLowerCase() == "extjs") {
            var str =
              "if (Ext.syncRequire) Ext.syncRequire('Ext.direct.Manager');Ext.namespace('" +
              NS +
              "');";
            str +=
              "App.REMOTING_API=" +
              JSON.stringify(REMOTE_API, null).replace(
                /"%FINGERPRINT%"/g,
                "window.z"
              ) +
              ";";
            str += "Ext.Direct.addProvider(App.REMOTING_API);";
          } else {
            var str =
              "App.REMOTING_API=" +
              JSON.stringify(REMOTE_API, null).replace(
                /"%FINGERPRINT%"/g,
                "window.z"
              ) +
              ";App.fn.add(App.REMOTING_API);";
          }
          res.header("Content-Type", "application/json; charset=utf-8");

          res.end(str);
        });
      } else {
        // QRL (Query Resource Locator)

        var _api = require("@omneedia" + sep + "db" + sep + "__QUERY__.js")();

        for (var e in _api) {
          if (_api[e]) {
            if (_api[e].toString().substr(0, 8) == "function") {
              var obj = {};
              obj.name = e;
              var myfn = _api[e]
                .toString()
                .split("function")[1]
                .split("{")[0]
                .trim()
                .split("(")[1]
                .split(")")[0]
                .split(",");
              obj.len = myfn.length - 1;
              REMOTE_API.actions[req.params.ns][
                REMOTE_API.actions[req.params.ns].length
              ] = obj;
            }
          }
        }
        if (!global.manifest.framework) global.manifest.framework = "omneedia";
        if (global.manifest.services) {
          if (global.manifest.services.ns) var NS = global.manifest.services.ns;
          else var NS = "App";
        } else NS = "App";
        if (global.manifest.framework.toLowerCase() == "extjs") {
          var str =
            "if (Ext.syncRequire) Ext.syncRequire('Ext.direct.Manager');Ext.namespace('" +
            NS +
            "');";
          str +=
            "App.REMOTING_API=" +
            JSON.stringify(REMOTE_API, null).replace(
              /"%FINGERPRINT%"/g,
              "window.z"
            ) +
            ";";
          str += "Ext.Direct.addProvider(App.REMOTING_API);";
        } else {
          var str =
            "App.REMOTING_API=" +
            JSON.stringify(REMOTE_API, null).replace(
              /"%FINGERPRINT%"/g,
              "window.z"
            ) +
            ";App.fn.add(App.REMOTING_API);";
        }

        res.header("Content-Type", "application/json; charset=utf-8");
        //    res.setHeader('Content-Type', 'text/event-stream');
        //res.setHeader('Cache-Control', 'no-cache');
        res.end(str);
        //  res.flush();

        //res.end(str);
      }
    }
    var url = req.url.split("?");
    if (url.length > 1) {
      if (url[1].indexOf("javascript") > -1) process_JS();
      else return res.status(404).end('console.log("NOT_FOUND");');
    } else {
      if (req.url.indexOf(".js") > -1) return process_JS();
      if (req.url.indexOf(".ts") > -1) return process_TS();
      return res.status(404).end('console.log("NOT_FOUND");');
    }
  });
};
