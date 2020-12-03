module.exports = function (cbz) {
  var REGISTRY_NPM =
    'npm config set @oa-modules:registry https://gitlab.com/api/v4/packages/npm/';
  if (process.env.REGISTRY_NPM)
    REGISTRY_NPM =
      'npm config set @oa-modules:registry ' + process.env.REGISTRY_NPM;
  var fs = require('fs');
  var yaml = require('yaml');
  var shelljs = require('shelljs');
  var ora = require('ora');

  global.project = {
    home: global.dir,
  };

  global.project.bin = global.dir + '/bin';
  global.project.api = global.project.home + '/services';
  global.project.res = global.project.home + '/resources';
  global.project.culture = global.project.home + '/culture';
  global.project.auth = global.project.home + '/auth';
  global.project.system = global.project.home + '/system';
  global.project.io = global.project.home + '/io';

  function update_settings(cb) {
    fs.mkdir(global.dir + '/config/', { recursive: true }, function () {
      fs.writeFile(
        global.dir + '/config/settings.json',
        JSON.stringify(global.settings, null, 4),
        cb
      );
    });
  }
  function update_package_json(ff, cb) {
    fs.writeFile(
      global.project.bin + '/package.json',
      JSON.stringify(ff, null, 4),
      cb
    );
  }
  function updateAuth(cb) {
    function do_auth(a, ndx, cbo) {
      if (!a[ndx]) return cbo();
      for (var i = 0; i < global.settings.auth.length; i++) {
        if (global.settings.auth[i].name == a[ndx])
          return do_auth(a, ndx + 1, cbo);
      }
      var tpl = __dirname + '/server/lib/tpl/auth/' + a[ndx] + '.json';
      fs.readFile(tpl, 'utf-8', function (e, r) {
        if (e) return error('AUTH template not found');
        var yauth = JSON.parse(r);
        var params = yauth.params;
        var list = [];
        if (params.length == 0) {
          console.log(chalk.bold('- Updating auth: ') + chalk.cyan(a[ndx]));
          var o = yauth.config;
          o.name = a[ndx];
          o.type = yauth.type;
          global.settings.auth.push(o);
          update_settings(function () {
            do_auth(a, ndx + 1, cbo);
          });
        } else {
          for (var j = 0; j < params.length; j++) {
            var o = {
              type: 'input',
              name: params[j],
              default: yauth.config.login[params[j]],
              message: '  ' + params[j],
            };
            list.push(o);
          }
          console.log(chalk.bold('- Updating auth: ') + chalk.cyan(a[ndx]));
          inquirer.prompt(list).then((answers) => {
            var o = yauth.config;
            o.name = a[ndx];
            o.type = yauth.type;
            for (var el in answers) {
              o.login[el] = answers[el];
            }
            global.settings.auth.push(o);
            update_settings(function () {
              do_auth(a, ndx + 1, cbo);
            });
          });
        }
      });
    }
    var auth = global.manifest.auth;
    if (!auth) {
      global.settings.auth = [];
      return update_settings(cb);
    }
    if (auth.length == 0) {
      global.settings.auth = [];
      return update_settings(cb);
    }
    do_auth(auth, 0, function () {
      var i = global.settings.auth.length;
      while (i--) {
        if (auth.indexOf(global.settings.auth[i].name) == -1) {
          global.settings.auth.splice(i, 1);
        }
      }
      update_settings(cb);
    });
    var settings_auth = global.settings.auth;
    if (!settings_auth) return cb();
  }
  function updateDB(cb) {
    var db = global.manifest.db;
    function do_db(a, ndx, cbo) {
      if (!a[ndx]) return cbo();
      for (var i = 0; i < global.settings.db.length; i++) {
        if (global.settings.db[i].name == a[ndx]) return do_db(a, ndx + 1, cbo);
      }
      global.settings.db.push({
        name: a[ndx],
        uri: 'mysql://root@localhost/' + a[ndx],
      });
      update_settings(function () {
        do_db(a, ndx + 1, cbo);
      });
    }
    if (!db) {
      global.settings.db = [];
      return update_settings(cb);
    }
    if (db.length == 0) {
      global.settings.db = [];
      return update_settings(cb);
    }
    do_db(db, 0, function () {
      var i = global.settings.db.length;
      while (i--) {
        if (db.indexOf(global.settings.db[i].name) == -1) {
          global.settings.db.splice(i, 1);
        }
      }
      update_settings(cb);
    });
  }
  fs.readFile(global.dir + '/config/settings.json', 'utf-8', function (e, r) {
    if (r) global.settings = JSON.parse(r);
    else
      global.settings = {
        auth: [],
        db: [],
      };
    updateAuth(function () {
      updateDB(function () {
        fs.readFile(global.dir + '/manifest.yaml', 'utf-8', function (e, r) {
          global.manifest = yaml.parse(r);
          var pkg = global.manifest.packages;
          global.project.bin = global.dir + '/bin';
          fs.mkdir(global.project.bin, function (e) {
            fs.readFile(
              global.project.bin + '/package.json',
              'utf-8',
              function (e, r) {
                if (e)
                  var package_json = {
                    name: global.manifest.namespace,
                    description: global.manifest.description,
                    dependencies: {},
                    license: global.manifest.license,
                  };
                else var package_json = JSON.parse(r);
                for (var i = 0; i < global.manifest.modules.length; i++) {
                  var item = global.manifest.modules[i].split(':')[0];
                  var value = global.manifest.modules[i].split(':')[1];
                  if (!value) value = '';
                  package_json.dependencies[item] = value;
                }
                for (var i = 0; i < global.manifest.packages.length; i++) {
                  var item = global.manifest.packages[i].split(':')[0];
                  var value = global.manifest.packages[i].split(':')[1];
                  if (!value) value = '';
                  package_json.dependencies[item] = value;
                }
                update_package_json(package_json, function () {
                  shelljs.cd(global.project.bin);
                  var spinner = ora('Updating application').start();
                  shelljs.exec(REGISTRY_NPM, { silent: true }, function () {
                    shelljs.exec('npm install', { silent: true }, function (
                      a,
                      b,
                      c
                    ) {
                      if (a == 0) spinner.succeed('application updated.\n');
                      else {
                        spinner.fail(
                          "CAN'T UPDATE APPLICATION. SEE LOGS FOR DETAILS"
                        );
                        console.log('------');
                        console.log(c);
                        console.log('------');
                        return;
                      }
                      cbz();
                    });
                  });
                });
              }
            );
          });
        });
      });
    });
  });
};
