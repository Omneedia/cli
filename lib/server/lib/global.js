module.exports = function (app, express) {
  var sep = "/";
  return {
    db: require("./db"),
    reports: require("./reports"),
    csv: function (r) {
      function isNumeric(str) {
        if (typeof str != "string") return false; // we only process strings!
        return (
          !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
          !isNaN(parseFloat(str))
        );
      }
      function isJsonString(str) {
        if (str.indexOf("{") == -1 || str.indexOf("[") == -1) return false;
        try {
          JSON.parse(str);
        } catch (e) {
          return false;
        }
        return true;
      }
      function whichLineEnding(source) {
        var temp = source.indexOf("\n");
        if (source[temp - 1] === "\r") return "\r\n";
        return "\n";
      }
      function checkLR() {
        var headers = csv[0].split(";");
        if (headers.length > 1) return ";";
        var headers = csv[0].split(",");
        if (headers.length > 1) return ",";
      }
      var csv = r.split(whichLineEnding(r));
      var lr = checkLR();

      var headers = csv[0].split(lr);
      for (var i = 0; i < headers.length; i++) {
        if (headers[i].indexOf('"') > -1)
          headers[i] = headers[i].replace(/"/g, "");
      }
      for (var i = 0; i < headers.length; i++) {
        var re = /^[a-zA-Z0-9_]+$/;
        if (!re.test(headers[i]))
          headers[i] = headers[i].substr(1, headers[i].length);
      }
      var data = [];
      for (var i = 1; i < csv.length; i++) {
        data.push(csv[i].split(lr));
      }
      return {
        headers: headers,
        fields: function () {},
        data: function () {},
        getFields: function () {
          var result = {
            fields: ["name", "value", "type"],
            data: [],
          };
          var d = data[1];
          for (var j = 0; j < headers.length; j++) {
            var item = d[j];
            var o = {};
            if (item) {
              if (item.substr(0, 1) == '"') {
                item = item.replace(/""/g, '"');
                item = item.substr(1, item.length - 2);
              }
              if (isJsonString(item)) {
                o.name = headers[j];
                o.value = JSON.stringify(item);
                o.type = "JSON";
              } else {
                if (typeof item === "boolean") {
                  o.name = headers[j];
                  o.value = item;
                  o.type = "BOOL";
                } else {
                  if (isNumeric(item)) {
                    o.name = headers[j];
                    o.value = item;
                    o.type = "NUMBER";
                  } else {
                    if (typeof item === "bigint") {
                      o.name = headers[j];
                      o.value = item;
                      o.type = "BIGINT";
                    } else if (typeof item === "string") {
                      o.name = headers[j];
                      o.value = item;
                      o.type = "STRING";
                    }
                  }
                }
              }
              result.data.push(o);
            }
          }
          return result;
        },
        toJSON: function () {
          var result = {
            fields: headers,
            data: [],
          };
          for (var i = 0; i < data.length; i++) {
            var o = {};
            for (var j = 0; j < headers.length; j++) {
              var item = data[i][j];
              if (item) {
                if (item.substr(0, 1) == '"') {
                  item = item.replace(/""/g, '"');
                  item = item.substr(1, item.length - 2);
                }
                if (isJsonString(item)) o[headers[j]] = JSON.parse(item);
                else o[headers[j]] = item;
              }
            }
            result.data.push(o);
          }
          return result;
        },
      };
    },
    getData: function () {
      if (process.argv.indexOf("--prod") == -1) {
        var userdir = require("os").homedir();
        var data = userdir + "/oa-cli/app/" + global.manifest.uid;
        require("fs").mkdir(data, { recursive: true }, function (e) {});
        return data;
      } else return "/data";
    },
    uuid: function () {
      return require("shortid").generate();
    },
    cors: function (options) {
      return require("cors")(options);
    },
    using: function (unit) {
      var builtin = [
        "rxjs",
        "assert",
        "buffer",
        "child_process",
        "cluster",
        "crypto",
        "dgram",
        "dns",
        "events",
        "fs",
        "http",
        "https",
        "net",
        "os",
        "path",
        "querystring",
        "readline",
        "stream",
        "string_decoder",
        "timers",
        "tls",
        "tty",
        "url",
        "util",
        "v8",
        "vm",
        "zlib",
        "db",
      ];
      //built in classes
      if (builtin.indexOf(unit) > -1) {
        if (unit == "db") unit = "@omneedia/db";
        return require(unit);
      }
      if (process.env.ENV == "prod") return require(unit);
      return require(global.project.bin + sep + "node_modules" + sep + unit);
    },
  };
};
