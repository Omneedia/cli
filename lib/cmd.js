module.exports = {
  "Global Commands": [
    {
      cmd: "create",
      description: "Create a new application",
      display: false,
    },
    {
      cmd: "module",
      description: "Module management tool",
      subcommands: [
        {
          cmd: "build",
          description: "build an omneedia module",
        },
        {
          cmd: "install",
          description: "install an omneedia module inside your package",
        },
        {
          cmd: "uninstall",
          description: "uninstall an omneedia module",
        },
      ],
    },
    {
      cmd: "login",
      description: "Log in to Omneedia",
      display: false,
    },
    {
      cmd: "logout",
      description: "Log out of Omneedia",
    },
    {
      cmd: "project",
      description: "Manage projects",
      subcommands: ["list", "create", "delete"],
    },
    {
      cmd: "package",
      description: "Manage package",
      subcommands: ["list", "create", "delete"],
    },
    {
      cmd: "config",
      description: "Manage CLI and project config values",
      text:
        "These commands are used to programmatically read, write, and delete CLI and     project config values.",
      subcommands: [
        {
          cmd: "load",
          description: "loading a configuration",
        },
        {
          cmd: "save",
          description: "saving a configuration",
        },
        {
          cmd: "get",
          description: "Print config values",
        },
        {
          cmd: "set",
          description: "Set config value",
        },
        {
          cmd: "unset",
          description: "Delete config value",
        },
        "delete",
      ],
    },
    {
      cmd: "docs",
      description: "open the Omneedia documentation website.",
    },
    {
      cmd: "job",
      status: "beta",
      description: "Manage job apps",
      subcommands: [
        {
          cmd: "install",
          description: "install REDIS engine",
        },
        {
          cmd: "uninstall",
          description: "uninstall REDIS engine",
        },
        {
          cmd: "start",
          description: "start REDIS engine",
        },
        {
          cmd: "stop",
          description: "stop REDIS engine",
        },
        {
          cmd: "call",
          description: "execute job",
        },
      ],
    },
    {
      cmd: "reports",
      status: "beta",
      description: "Manager reports server",
      subcommands: [
        {
          cmd: "install",
          description: "install reports engine",
        },
        {
          cmd: "uninstall",
          description: "uninstall reports engine",
        },
        {
          cmd: "start",
          description: "start reports engine",
        },
        {
          cmd: "stop",
          description: "stop reports engine",
        },
      ],
    },
    {
      cmd: "db",
      description: "Database management tool",
      subcommands: [
        {
          cmd: "install",
          description: "install MySQL engine",
        },
        {
          cmd: "uninstall",
          description: "uninstall MySQL engine",
        },
        {
          cmd: "start",
          description: "start MySQL engine",
        },
        {
          cmd: "stop",
          description: "stop MySQL engine",
        },
        {
          cmd: "create",
          description: "create database",
        },
        {
          cmd: "link",
          description: "link database to application",
        },
        {
          cmd: "unlink",
          description: "unlink database to application",
        },
        {
          cmd: "import",
          description: "import database utility",
        },
        {
          cmd: "api",
          description: "CRUD Database ",
        },
      ],
    },
  ],
  "Package commands|pkg": [
    {
      cmd: "generate",
      alias: "g",
      description: "Create framework features",
      subcommands: [
        {
          cmd: "api",
          description: "generate new api path",
        },
        {
          cmd: "view",
          description: "generate new view",
        },
        {
          cmd: "job",
          description: "generate new job",
        },
      ],
    },
    {
      cmd: "link",
      status: "experimental",
      description: "Link your project to omneedia",
    },
    {
      cmd: "unlink",
      status: "experimental",
      description: "unlink your project from omneedia",
    },
    {
      cmd: "version",
      description: "manage project version",
    },
    {
      cmd: "test",
      description: "Testing your project",
    },
    {
      cmd: "add",
      description: "Automatically create framework features",
      status: "beta",
      subcommands: [
        {
          cmd: "auth",
          description: "adding auth middleware",
        },
      ],
    },
    {
      cmd: "install",
      description: "install/update dependencies",
    },
    {
      cmd: "start",
      description: "Start a local dev server for app dev/testing",
    },
    {
      cmd: "start --ide",
      status: "beta",
      description: "start omneedia IDE",
    },
    {
      cmd: "build",
      status: "experimental",
      description: "Build app",
    },
    {
      cmd: "ng",
      status: "experimental",
      description: "Angular commands",
    },
    {
      cmd: "package",
      description: "Package management tool",
      subcommands: [
        {
          cmd: "install",
          description: "install a nodejs package inside your application",
        },
        {
          cmd: "uninstall",
          description: "uninstall a nodejs package",
        },
      ],
    },
  ],
};
