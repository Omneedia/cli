const { fstat } = require("fs");

module.exports = function (app, express, io) {
  var sep = "/";
  var multer = require("multer");
  function getData() {
    if (process.argv.indexOf("--prod") == -1) {
      var userdir = require("os").homedir();
      var data = userdir + "/oa-cli/app/" + global.manifest.uid;
      require("fs").mkdirSync(data, { recursive: true }, function (e) {});
      return data;
    } else {
      if (process.argv.indexOf("--dev") > -1) return "./data";
      return "/data";
    }
  }

  var _App = require(global.project.system + sep + "app.js");
  _App.upload = multer({ dest: getData() + "/uploads/" });
  _App = Object.assign(_App, require(__dirname + "/global.js")());

  function getLicense(type, cb) {
    var licensefile = __dirname + "/../../license.lic";
    if (process.env.ENV == "prod") licensefile = __dirname + "/license.lic";
    require("fs").readFile(licensefile, "utf-8", function (e, r) {
      var lics = [];
      var lic = {};
      var text = r.split("\n");
      for (var i = 0; i < text.length; i++) {
        lics.push(text[i].split("\t")[0]);
        lic[text[i].split("\t")[0]] = text[i].split("\t")[1];
      }
      if (lics.indexOf(type) > -1)
        return cb({
          name: type,
          url: lic[type],
        });
      else
        cb({
          name: "???",
          url: "-",
        });
    });
  }

  app.get("/_/swagger-init.js", function (req, res) {
    var URL = req.protocol + "://" + req.get("host") + "/api/swagger.json";
    var script = `window.init=function() {
      const ui = SwaggerUIBundle({
        url: "${URL}",
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset.slice(1)
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout"
      })
      // End Swagger UI call region

      window.ui = ui;
      window.title="API";
    }`;
    res.setHeader("Content-Type", "application/javascript");
    res.end(script);
  });

  function swagger(req, cb) {
    // array, boolean, integer, number, object, string
    var fs = require("fs");
    var yaml = require("yaml");
    var mail = { email: global.manifest.author.mail };
    var tags = [];
    var paths = {};
    var producer = ["application/json"];
    var consumer = ["application/json"];
    var tags = [];
    var paths = {};
    if (global.api) {
      for (var i = 0; i < global.api.length; i++) {
        tags.push({
          name: global.api[i].tag,
          description: global.api[i].description,
        });
        for (var el in global.api[i].routes) {
          var item;
          var inpath = [];
          if (el.indexOf(":") > -1) {
            var it = el.split("/");
            for (var k = 0; k < it.length; k++) {
              if (it[k].indexOf(":") > -1) {
                if (inpath.indexOf(it[k].split(":")[1]) == -1)
                  inpath.push(it[k].split(":")[1]);
                it[k] = "{" + it[k].split(":")[1] + "}";
              }
            }
            item = it.join("/");
          } else item = el;
          var route = global.api[i].routes[el];
          if (!paths[item]) paths[item] = {};
          for (var j = 0; j < route.length; j++) {
            if (!route[j].params) var params = [];
            else var params = route[j].params;
            var parameters = [];
            for (var k = 0; k < params.length; k++) {
              var px = {
                name: params[k].name,
              };
              if (params[k].description) px.description = params[k].description;
              px.required = false;
              if (params[k].required) px.required = true;
              if (inpath.indexOf(px.name) > -1) {
                px.required = true;
                px.in = "path";
              } else {
                if (!px.in) {
                  if (route[j].post) px.in = "body";
                }
              }
              if (params[k].type)
                px.schema = {
                  type: params[k].type,
                };
              else
                px.schema = {
                  type: "string",
                };
              parameters.push(px);
            }

            if (route[j].tags) var tag = global.api[i].tags;
            else var tag = [];

            if (tags.indexOf(global.api[i].tag) == -1)
              tag.push(global.api[i].tag);
            var o = {
              tags: tag,
              summary: route[j].description,
              parameters: parameters,
              responses: { 200: { description: "successful operation" } },
            };
            if (route[j].secure) o.security = ["JWT"];
            if (route[j].get) paths[item]["get"] = o;
            if (route[j].post) paths[item]["post"] = o;
            if (route[j].put) paths[item]["put"] = o;
            if (route[j].delete) paths[item]["delete"] = o;
          }
        }
      }
    }

    getLicense(global.manifest.license, function (lic) {
      var url = req.protocol + "://" + req.get("host") + "/auth/letmein";
      var config = {
        swagger: "2.0",
        info: {
          description: global.manifest.description,
          version: global.manifest.version,
          title: global.manifest.title,
          termsOfService: "-",
          contact: mail,
          license: lic,
        },
        host: req.get("host"),
        basePath: "/api",
        tags: tags,
        schemes: [req.protocol],
        consumes: consumer,
        produces: producer,
        paths: paths,
        securityDefinitions: {
          JWT: {
            type: "apiKey",
            in: "header",
            name: "access_token",
            authorizationUrl: url,
          },
          OAuth2: {
            type: "oauth2",
            authorizationUrl: url,
            //flow: "accessCode",
            flow: "implicit",
            scopes: {
              /* "read:pets": "read your pets",
              "write:pets": "modify pets in your account",*/
            },
          },
        },
      };
      return cb(config);
    });
  }
  app.get("/api/swagger.json", function (req, res) {
    swagger(req, function (config) {
      res.json(config);
    });
  });
  app.get("/api/swagger.yaml", function (req, res) {
    swagger(req, function (config) {
      res.set({ "content-type": "application/yaml; charset=utf-8" });
      res.end(require("yaml").stringify(config));
    });
  });
  app.get("/api/_/config.js", function (req, res) {
    res.set("text/javascript");
    swagger(req, function (config) {
      res.end("var config=" + JSON.stringify(config));
    });
  });

  app.use("/api", express.static(__dirname + "/swagger"));

  try {
    var d = require("fs").readdirSync(global.project.api);
  } catch (e) {
    return _App.init(app, express, io);
  }

  function set_module(d, ndx, cb) {
    if (!d[ndx]) return cb();
    if (d[ndx].indexOf(".js") == -1) return set_module(d, ndx + 1, cb);
    var obj = require(global.project.api + "/" + d[ndx]);
    var o = obj(app, express);
    if (!global.api) global.api = [];
    global.api.push({
      tag: d[ndx].split(".js")[0],
      description: o.description,
      routes: o.routes,
    });
    for (var el in o.routes) {
      var z = o.routes[el];
      if (z.length) {
        for (var i = 0; i < z.length; i++) {
          if (z[i].get) {
            if (z[i].secure) {
              app.get("/api" + el, z[i].secure, z[i].get);
            } else app.get("/api" + el, z[i].get);
          }
          if (z[i].post) {
            if (z[i].secure) {
              app.post("/api" + el, z[i].secure, z[i].get);
            } else app.post("/api" + el, z[i].post);
          }
          if (z[i].put) {
            if (z[i].secure) {
              app.put("/api" + el, z[i].secure, z[i].get);
            } else app.put("/api" + el, z[i].put);
          }
          if (z[i].delete) {
            if (z[i].secure) {
              app.delete("/api" + el, z[i].secure, z[i].get);
            } else app.delete("/api" + el, z[i].delete);
          }
        }
      }
    }
    set_module(d, ndx + 1, cb);
  }
  set_module(d, 0, function () {
    _App.init(app, express, io);
  });
};
