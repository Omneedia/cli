module.exports = function (args, root) {
  var prettyjson = require("prettyjson");
  var shelljs = require("shelljs");
  const logSymbols = require("log-symbols");
  var chalk = require("chalk");
  var fs = require("fs");
  var boxen = require("boxen");
  var yaml = require("yaml");
  var iq = require("inquirer");
  var error = require("../lib/utils/error");
  function onlyLetters(string) {
    return string
      .toLowerCase()
      .replace(/[^a-z0-9 ]/gi, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/\ /g, "-");
  }
  // "%s": [
  // ]
  var route = `
  {
    description: "%s",
    params: [
    ],
    response: [],
    %s: function(req,res) {
      
    },
  },
`;
  var script = `module.exports = function (app, express) {
  return {
    description: "%s",
    routes: {
      
    },
  };
};
`;

  console.log(
    boxen(chalk.cyan(" GENERATE "), {
      borderStyle: "round",
      borderColor: "cyan",
      float: "center",
      borderColor: "cyan",
    })
  );
  function generate_job() {
    if (args[1] == "add") {
      var name = onlyLetters(args[2]);
      var str = `
      module.exports=function(job,done) {
        // get the id of the job : job.id
        // when the job is done, fire done(err,response)
        done(null,"ok");
      };
      `;
      fs.mkdir(global.dir + "/src/jobs/", function (e, r) {
        fs.writeFile(global.dir + "/src/jobs/" + name, str, function (e) {
          if (e) return error("ERROR CREATING JOB");
          console.log(logSymbols.success + " job created successfully.");
        });
      });
      return;
    }
  }
  function generate_api() {
    if (args[1] == "route") {
      return console.log("** TO BE IMPLEMENTED...");
      var choices = [];
      return fs.readdir(global.dir + "/src/api/", function (e, d) {
        for (var i = 0; i < d.length; i++) {
          if (d[i].indexOf(".js") > -1) choices.push(d[i].split(".js")[0]);
        }
        if (choices.length == 0) return error("NO TAG FOUND");
        iq.prompt([
          {
            type: "list",
            name: "tag",
            choices: choices,
            message: "choose tag",
          },
          {
            type: "list",
            name: "method",
            choices: ["GET", "POST", "PUT", "DELETE"],
            message: "choose method",
          },
          { type: "input", name: "name", message: "Please enter route path" },
          {
            type: "input",
            name: "description",
            message: "Please enter route description",
          },
        ]).then((answers) => {
          fs.readFile(
            global.dir + "/src/api/" + answers.tag + ".js",
            "utf-8",
            function (e, r) {
              var esprima = require("esprima");
              return console.log(
                JSON.stringify(esprima.parseScript(r), null, 4)
              );
              var _route = require("util").format(
                route,
                answers.name,
                answers.description,
                answers.method.toLowerCase()
              );
              /*if (r.indexOf('"'+route+'": [')>-1) {

                } else {
                  
                }*/
              r = r.replace("routes: {", "routes: {" + _route);
              var prettier = require("prettier");
              var r = prettier.format(r, { parser: "babel" });
              fs.writeFile(
                global.dir + "/src/api/" + answers.tag + ".js",
                r,
                function () {
                  console.log(logSymbols.success + " ok.\n");
                }
              );
            }
          );
        });
      });
    }
    if (args[1] == "tag") {
      return iq
        .prompt([
          { type: "input", name: "name", message: "Please enter tag name" },
          {
            type: "input",
            name: "description",
            message: "Please enter tag description",
          },
        ])
        .then((answers) => {
          fs.mkdir(
            global.dir + "/src/api/" + onlyLetters(answers.name),
            { recursive: true },
            function () {
              fs.writeFile(
                global.dir + "/src/api/" + onlyLetters(answers.name) + ".js",
                require("util").format(script, answers.description),
                function () {
                  console.log(logSymbols.success + " ok.\n");
                }
              );
            }
          );
        })
        .catch((error) => {
          if (error.isTtyError) {
            // Prompt couldn't be rendered in the current environment
          } else {
            // Something else when wrong
          }
        });
    }
  }

  function generate_view() {
    var form = `
App.view.define("%s", {
  extend: "Ext.Panel",
  alias: "widget.%s",
  border: false,

  initComponent: function()
  {
    this.layout = "vbox";
    this.items = [
          
    ];
    this.callParent();
  }

});
    `;
    var window = `
App.view.define('%s',{
  extend: 'Ext.window.Window',
  alias: "widget.%s",

  initComponent: function()
  {
      this.title="%s";
      this.layout="hbox";
      this.border=false;
      this.width = 700;
      this.height = 430;
      this.bodyStyle="background-color: white";
      this.tbar = [

      ];
      this.bbar = [

      ];
      this.items = [
          
      ];
      this.callParent();
  }
});
    `;
    if (!args[1]) error("VIEW NAME NOT PROVIDED");
    if (!args[2]) error("VIEW TYPE NOT PROVIDED (form,window)");
    if (args[2].toUpperCase() == "FORM")
      return fs.mkdir(global.dir + "/src/app/view/", function (e) {
        var title = onlyLetters(args[1]);
        var str = require("util").format(form, title, title);
        fs.writeFile(
          global.dir + "/src/app/view/" + title + ".js",
          str,
          function (e) {
            console.log(
              logSymbols.success +
                " view has been created. Don't forget to add it to controller.\n"
            );
          }
        );
      });
    if (args[2].toUpperCase() == "WINDOW")
      return fs.mkdir(global.dir + "/src/app/view/", function (e) {
        var title = onlyLetters(args[1]);
        var str = require("util").format(window, title, title);
        fs.writeFile(
          global.dir + "/src/app/view/" + title + ".js",
          str,
          function (e) {
            console.log(
              logSymbols.success +
                " view has been created. Don't forget to add it to controller.\n"
            );
          }
        );
      });
    error("VIEW TYPE NOT KNOWN (form,window)");
  }

  if (args[0] == "api") return generate_api();
  if (args[0] == "job") return generate_job();
  if (args[0] == "view") return generate_view();
  return error("Unknown command");
};
