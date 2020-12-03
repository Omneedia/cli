module.exports = function (args, root) {
  var boxen = require('boxen');
  var chalk = require('chalk');
  var inquirer = require('inquirer');
  var figlet = require('figlet');
  var extract = require('extract-zip');
  var fs = require('fs-extra');
  var error = require('../lib/utils/error');
  var shelljs = require('shelljs');
  var yaml = require('yaml');
  const ora = require('ora');
  const git = require('isomorphic-git');

  var README = `
# %APP%
%DESCRIPTION%
## %NAMESPACE%
%COPYRIGHT%
## History
First commit
## Credits
Author: [%AUTHOR%](mailto:%MAIL_AUTHOR%)
## License

%LICENSE%
`;

  var url_modules =
    'https://gitlab.com/api/v4/groups/oa-templates/projects?perpage=100';
  var oa_registry_url =
    'https://gitlab.com/oa-templates/TEMPLATE/-/archive/master/TEMPLATE.zip';
  var templates = [];
  var answers = {};
  /**
   * object.padding(number, string)
   * Transform the string object to string of the actual width filling by the padding character (by default ' ')
   * Negative value of width means left padding, and positive value means right one
   *
   * @param       number  Width of string
   * @param       string  Padding chacracter (by default, ' ')
   * @return      string
   * @access      public
   */
  String.prototype.padding = function (n, c) {
    var val = this.valueOf();
    if (Math.abs(n) <= val.length) {
      return val;
    }
    var m = Math.max(Math.abs(n) - this.length || 0, 0);
    var pad = Array(m + 1).join(String(c || ' ').charAt(0));
    //      var pad = String(c || ' ').charAt(0).repeat(Math.abs(n) - this.length);
    return n < 0 ? pad + val : val + pad;
    //      return (n < 0) ? val + pad : pad + val;
  };
  function step3(a) {
    var dir;
    answers.template = a.template;
    function install_stuff() {
      if (global.Auth.name) var name = global.Auth.name;
      else var name = '-';
      if (global.Auth.email) var email = global.Auth.email;
      else var email = '-';
      if (global.Auth.twitter) var twitter = global.Auth.twitter;
      else var twitter = '-';
      if (global.Auth.url) var url = global.Auth.url;
      else var url = '-';
      var manifest = {
        namespace: answers.namespace,
        uri: '',
        title: answers.title,
        description: answers.description,
        platform: answers.type,
        uid: require('shortid').generate().toLowerCase(),
        license: answers.license,
        version: '0.0.1',
        build: '0',
        copyright:
          'Copyright (c) ' + new Date().getFullYear() + ' my awesome copany',
        author: {
          name: name,
          mail: email,
          twitter: twitter,
          web: url,
        },
        team: {
          debugger: [],
          tester: [],
        },
        langs: ['en', 'fr'],
      };
      var readme = README.replace(/%APP%/g, answers.title);
      readme = readme.replace(/%DESCRIPTION%/g, answers.description);
      readme = readme.replace(/%NAMESPACE%/g, answers.namespace);
      readme = readme.replace(
        /%COPYRIGHT%/g,
        'Copyright (c) ' + new Date().getFullYear() + ' my awesome copany'
      );

      fs.readFile(__dirname + '/../lib/license.lic', 'utf-8', function (ze, z) {
        var lics = z.split('\n');
        var license = {};
        for (var i = 0; i < lics.length; i++)
          license[lics[i].split('\t')[0]] = lics[i].split('\t')[1];
        readme = readme.replace(
          /%LICENSE%/g,
          '[' + answers.license + '](' + license[answers.license] + ')'
        );
        readme = readme.replace(/%AUTHOR%/g, name);
        readme = readme.replace(/%MAIL_AUTHOR%/g, email);
        fs.writeFile(dir + '/README.md', readme, function () {
          fs.readFile(dir + '/manifest.tpl', 'utf-8', function (e, r) {
            var obj = yaml.parse(r);
            obj = Object.assign(manifest, obj);
            fs.writeFile(
              dir + '/manifest.yaml',
              yaml.stringify(obj),
              function () {
                global.manifest = obj;
                global.dir = dir;
                fs.unlink(dir + '/manifest.tpl', function () {
                  require('../lib/update-app')(async function () {
                    console.log(chalk.bold('\nYour omneedia app is ready!\n'));
                    console.log(
                      '- Go to your new project: ' +
                        chalk.cyan('cd ./' + answers.dir)
                    );
                    console.log(
                      '- To run your project: ' + chalk.cyan('oa start\n')
                    );

                    await git.init({ fs, dir: dir });
                    console.log(chalk.bold('Happy coding!\n'));
                  });
                });
              }
            );
          });
        });
      });
    }
    console.log(' ');
    var spinner = ora('downloading template: ' + answers.template).start();
    dir = answers[1];
    dir = process.cwd() + '/' + answers.dir;
    var project = answers.type + '-' + answers.template;
    var url = oa_registry_url.replace(/TEMPLATE/g, project);
    fs.stat(dir, function (e, s) {
      if (s) error('directory not empty');
      global
        .request(url)
        .pipe(fs.createWriteStream(process.cwd() + '/tmp.zip'))
        .on('close', async function () {
          spinner.succeed('downloaded template: ' + answers.template);
          await extract(process.cwd() + '/tmp.zip', { dir: dir });
          fs.unlink(process.cwd() + '/tmp.zip', function () {
            fs.readdir(dir, function (e, s) {
              shelljs.mv(dir + '/' + s[0] + '/*', dir);
              shelljs.mv(dir + '/' + s[0] + '/.*', dir);
              fs.remove(dir + '/' + s[0], function (e) {
                install_stuff();
              });
            });
          });
        });
    });
  }
  function step2(a) {
    function onlyLetters(string) {
      return string
        .toLowerCase()
        .replace(/[^a-z0-9 ]/gi, '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/\ /g, '-');
    }
    function getEnvLocale(env) {
      env = env || process.env;
      var test = env.LC_ALL || env.LC_MESSAGES || env.LANG || env.LANGUAGE;
      if (test) return test;
      else return 'com';
    }
    answers.dir = onlyLetters(a.title);
    if (global.Auth) var ns = global.Auth.username;
    else var ns = 'omneedia';
    answers.namespace =
      getEnvLocale().split('_')[0] +
      '.' +
      'omneedia' +
      '.' +
      onlyLetters(a.title);
    answers.title = a.title;
    answers.description = a.description;
    answers.license = a.license;
    var lng = getEnvLocale().split('_')[0];
    if (lng == 'com') lng = 'en';
    answers.lang = lng;

    global.request(url_modules, function (e, r, b) {
      if (e) error("Can't connect to internet.");
      var list = JSON.parse(b);
      for (var i = 0; i < list.length; i++) {
        if (list[i].name.indexOf(answers.type) > -1)
          templates.push(
            list[i].name.split(answers.type + '-')[1],
            new inquirer.Separator(list[i].description)
          );
      }
      inquirer
        .prompt([
          {
            name: 'template',
            message: 'Please choose a template',
            type: 'list',
            choices: templates,
            transformer: function (x) {
              //console.log(x);
              return;
            },
          },
        ])
        .then(step3);
    });
  }
  function step1(a) {
    answers.type = a.type;
    console.log(chalk.bold('\nEvery great app begins with a name.'));
    console.log(
      '\nPlease enter the full name of your app. You can change this at any time. To bypass this prompt next time, supply name, the first argument to oa create.\n'
    );
    require('fs').readFile(
      __dirname + '/../lib/license.lic',
      'utf-8',
      function (e, r) {
        var text = r.split('\n');
        var licenses = [];
        for (var i = 0; i < text.length; i++)
          licenses.push(text[i].split('\t')[0]);
        inquirer
          .prompt([
            {
              type: 'input',
              name: 'title',
              message: 'Project name',
            },
            {
              name: 'input',
              name: 'description',
              message: 'Project description',
              default: 'my awesome project',
            },
            {
              type: 'list',
              name: 'license',
              choices: licenses,
              message: 'Project license',
              default: 'MIT License (MIT)',
            },
          ])
          .then(step2);
      }
    );
  }
  figlet('omneedia', 'Ogre', function (e, cl) {
    console.log(chalk.cyan(cl));
    console.log(chalk.bold('                            version ' + $_VERSION));
    console.log(' ');
    console.log(chalk.bold('Web, Desktop, Mobile, or Cross-Platform'));
    console.log('\nPlease, choose the right platform for your app.\n');
    inquirer
      .prompt([
        {
          name: 'type',
          message: 'Please choose a type',
          type: 'list',
          choices: ['webapp', 'mobile', 'desktop', 'cross-platform'],
        },
      ])
      .then(step1);
  });
};
