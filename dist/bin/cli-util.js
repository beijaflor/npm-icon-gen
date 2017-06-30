'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CLI = undefined;

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Constatns of CLI process.
 * @type {Object}
 */
const CLI = exports.CLI = {
  /**
   * CLI options.
   * @type {Object}
   */
  options: {
    help: ['-h', '--help'],
    version: ['-v', '--version'],
    input: ['-i', '--input'],
    output: ['-o', '--output'],
    type: ['-t', '--type'],
    modes: ['-m', '--modes'],
    names: ['-n', '--names'],
    report: ['-r', '--report']
  },

  /**
   * Execution types.
   * @type {Object}
   */
  types: {
    svg: 'svg',
    png: 'png'
  },

  /**
   * Output modes.
   * @type {Object}
   */
  modes: {
    ico: 'ico',
    icns: 'icns',
    favicon: 'favicon'
  },

  /**
   * Output mode for an all files.
   * @type {Array}
   */
  modeAll: ['ico', 'icns', 'favicon'],

  /**
   * File names.
   * @type {Object}
   */
  names: {
    ico: 'ico',
    icns: 'icns'
  }

  /**
   * String of help.
   * @type {String}
   */
};const Help = `
Usage: icon-gen [OPTIONS]

Generate an icon from the SVG or PNG file.

Options:
-h, --help    Display this text.

-v, --version Display the version number.

-i, --input   Path of the SVG file or PNG file directory.

-o, --output  Path of the output directory.

-t, --type    Type of the input file.
          'svg' is the SVG file, 'png' is the PNG files directory.
          Allowed values: svg, png
          Default is 'svg'.

-m, --modes   Mode of the output files.
          Allowed values: ico, icns, favicon, all
          Default is 'all'.

-n, --names   Change an output file names for ICO and ICNS.
          ex: 'ico=foo,icns=bar'
          Default is 'app.ico' and 'app.ico'.

-r, --report  Display the process reports.
          Default is disable.

Examples:
$ icon-gen -i sample.svg -o ./dist -r
$ icon-gen -i ./images -o ./dist -t png -r
$ icon-gen -i sample.svg -o ./dist -m ico,favicon -r
$ icon-gen -i sample.svg -o ./dist -n ico=foo,icns=bar

See also:
https://github.com/akabekobeko/npm-icon-gen`;

/**
 * Utility for a command line process.
 */
class CLIUtil {
  /**
   * Show the help text.
   *
   * @param {WritableStream} stream Target stream.
   *
   * @return {Promise} Promise object.
   */
  static showHelp(stream) {
    return new Promise(resolve => {
      stream.write(Help);
      resolve();
    });
  }

  /**
   * Show the version number.
   *
   * @param {WritableStream} stream Target stream.
   *
   * @return {Promise} Promise object.
   */
  static showVersion(stream) {
    return new Promise(resolve => {
      const read = path => {
        try {
          return require(path).version;
        } catch (err) {
          return null;
        }
      };

      const version = read('../package.json') || read('../../package.json');
      stream.write('v' + version + '\n');

      resolve();
    });
  }

  /**
   * Parse for the command line argumens.
   *
   * @param {Array.<String>} argv Arguments of the command line.
   *
   * @return {CLIOptions} Parse results.
   */
  static parse(argv) {
    if (!(argv && 0 < argv.length)) {
      return { help: true };
    }

    switch (argv[0]) {
      case CLI.options.help[0]:
      case CLI.options.help[1]:
        return { help: true };

      case CLI.options.version[0]:
      case CLI.options.version[1]:
        return { version: true };

      default:
        return CLIUtil._parse(argv);
    }
  }

  /**
   * Parse for the command line argumens.
   *
   * @param {Array.<String>} args   Arguments of the command line.
   *
   * @return {CLIOptions} Parse results.
   */
  static _parse(argv) {
    const options = {};
    argv.forEach((arg, index) => {
      switch (arg) {
        case CLI.options.input[0]:
        case CLI.options.input[1]:
          if (index + 1 < argv.length) {
            options.input = _path2.default.resolve(argv[index + 1]);
          }
          break;

        case CLI.options.output[0]:
        case CLI.options.output[1]:
          if (index + 1 < argv.length) {
            options.output = _path2.default.resolve(argv[index + 1]);
          }
          break;

        case CLI.options.type[0]:
        case CLI.options.type[1]:
          if (index + 1 < argv.length) {
            options.type = argv[index + 1];
          }
          break;

        case CLI.options.report[0]:
        case CLI.options.report[1]:
          options.report = true;
          break;

        case CLI.options.modes[0]:
        case CLI.options.modes[1]:
          if (index + 1 < argv.length) {
            options.modes = CLIUtil._parseMode(argv[index + 1]);
          }
          break;

        case CLI.options.names[0]:
        case CLI.options.names[1]:
          if (index + 1 < argv.length) {
            options.names = CLIUtil._parseNames(argv[index + 1]);
          }
          break;

        default:
          break;
      }
    });

    if (!options.type || options.type !== CLI.types.svg && options.type !== CLI.types.png) {
      options.type = CLI.types.svg;
    }

    if (!options.modes) {
      options.modes = CLI.modeAll;
    }

    return options;
  }

  /**
   * Parse for the mode option.
   *
   * @param {String} arg Option. Format is a 'all' or 'ico,icns,favicon'.
   *
   * @return {Array.<String>} Parse results.
   */
  static _parseMode(arg) {
    if (!arg) {
      return CLI.modeAll;
    }

    const values = arg.split(',').filter(value => {
      switch (value) {
        case CLI.modes.ico:
        case CLI.modes.icns:
        case CLI.modes.favicon:
          return true;

        default:
          return false;
      }
    });

    return 0 < values.length ? values : CLI.modeAll;
  }

  /**
   * Parse the output file names.
   *
   * @param {String} arg Option. Format is a 'ico=foo,icns=bar'.
   *
   * @return {Object} File names.
   */
  static _parseNames(arg) {
    const names = {};
    if (!(typeof arg === 'string')) {
      return names;
    }

    const params = arg.split(',');
    params.forEach(param => {
      const units = param.split('=');
      if (units.length < 2) {
        return;
      }

      const key = units[0];
      const value = units[1];
      switch (key) {
        case CLI.names.ico:
        case CLI.names.icns:
          names[key] = value;
          break;

        default:
          break;
      }
    });

    return names;
  }
}
exports.default = CLIUtil;