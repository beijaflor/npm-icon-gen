'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _os = require('os');

var _os2 = _interopRequireDefault(_os);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _uuid = require('uuid');

var _uuid2 = _interopRequireDefault(_uuid);

var _svg2png = require('svg2png');

var _svg2png2 = _interopRequireDefault(_svg2png);

var _faviconGenerator = require('./favicon-generator.js');

var _icoGenerator = require('./ico-generator.js');

var _icnsGenerator = require('./icns-generator.js');

var _cliUtil = require('../bin/cli-util.js');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate the PNG files = require(SVG file.
 */
class PNGGenerator {
  /**
   * Generate the PNG files = require(the SVG file.
   *
   * @param {String}         src    SVG file path.
   * @param {String}         dir    Output destination The path of directory.
   * @param {Array.<String>} modes  Modes of an output files.
   * @param {Function}       cb     Callback function.
   * @param {Logger}         logger Logger.
   */
  static generate(src, dir, modes, cb, logger) {
    _fs2.default.readFile(src, (err, svg) => {
      if (err) {
        cb(err);
        return;
      }

      logger.log('SVG to PNG:');

      const sizes = PNGGenerator.getRequiredImageSizes(modes);
      Promise.all(sizes.map(size => {
        return PNGGenerator.generetePNG(svg, size, dir, logger);
      })).then(results => {
        cb(null, results);
      }).catch(err2 => {
        cb(err2);
      });
    });
  }

  /**
   * Generate the PNG file = require(the SVG data.
   *
   * @param {Buffer} svg    SVG data that has been parse by svg2png.
   * @param {Number} size   The size (width/height) of the image.
   * @param {String} dir    Path of the file output directory.
   * @param {Logger} logger Logger.
   *
   * @return {Promise} Image generation task.
   */
  static generetePNG(svg, size, dir, logger) {
    return new Promise((resolve, reject) => {
      if (!(svg && 0 < size && dir)) {
        reject(new Error('Invalid parameters.'));
        return;
      }

      const dest = _path2.default.join(dir, size + '.png');
      logger.log('  Create: ' + dest);

      const buffer = _svg2png2.default.sync(svg, { width: size, height: size });
      if (!buffer) {
        reject(new Error('Faild to write the image, ' + size + 'x' + size));
        return;
      }

      _fs2.default.writeFile(dest, buffer, err => {
        if (err) {
          reject(err);
          return;
        }

        resolve({ size: size, path: dest });
      });
    });
  }

  /**
   * Create the work directory.
   *
   * @return {String} The path of the created directory, failure is null.
   */
  static createWorkDir() {
    const dir = _path2.default.join(_os2.default.tmpdir(), _uuid2.default.v4());
    _fs2.default.mkdirSync(dir);

    const stat = _fs2.default.statSync(dir);
    return stat && stat.isDirectory() ? dir : null;
  }

  /**
   * Gets the size of the images needed to create an icon.
   *
   * @param {Array.<String>} modes Modes of an output files.
   *
   * @return {Array.<Number>} The sizes of the image.
   */
  static getRequiredImageSizes(modes) {
    let sizes = [];
    if (modes && 0 < modes.length) {
      modes.forEach(mode => {
        switch (mode) {
          case _cliUtil.CLI.modes.ico:
            sizes = sizes.concat(_icoGenerator.ICO.imageSizes);
            break;

          case _cliUtil.CLI.modes.icns:
            sizes = sizes.concat(_icnsGenerator.ICNS.imageSizes);
            break;

          case _cliUtil.CLI.modes.favicon:
            sizes = sizes.concat(_faviconGenerator.Favicon.imageSizes);
            break;

          default:
            break;
        }
      });
    }

    // 'all' mode
    if (sizes.length === 0) {
      sizes = _faviconGenerator.Favicon.imageSizes.concat(_icoGenerator.ICO.imageSizes).concat(_icnsGenerator.ICNS.imageSizes);
    }

    return sizes.filter((value, index, array) => {
      return array.indexOf(value) === index;
    }).sort((a, b) => {
      // Always ensure the ascending order
      return a - b;
    });
  }
}
exports.default = PNGGenerator;