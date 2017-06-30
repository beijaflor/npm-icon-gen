'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _mkdirp = require('mkdirp');

var _mkdirp2 = _interopRequireDefault(_mkdirp);

var _pngGenerator = require('./png-generator.js');

var _pngGenerator2 = _interopRequireDefault(_pngGenerator);

var _cliUtil = require('../bin/cli-util');

var _icoGenerator = require('./ico-generator.js');

var _icoGenerator2 = _interopRequireDefault(_icoGenerator);

var _icnsGenerator = require('./icns-generator.js');

var _icnsGenerator2 = _interopRequireDefault(_icnsGenerator);

var _faviconGenerator = require('./favicon-generator.js');

var _faviconGenerator2 = _interopRequireDefault(_faviconGenerator);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * Generate an icons.
 */
class IconGenerator {
  /**
   * Generate an icon = require(the SVG file.
   *
   * @param {String} src     Path of the SVG file.
   * @param {String} dir     Path of the output files directory.
   * @param {Object} options Options.
   * @param {Logger} logger  Logger.
   *
   * @return {Promise} Promise object.
   */
  static fromSVG(src, dir, options, logger) {
    return new Promise((resolve, reject) => {
      const svgFilePath = _path2.default.resolve(src);
      const destDirPath = _path2.default.resolve(dir);
      logger.log('Icon generetor from SVG:');
      logger.log('  src: ' + svgFilePath);
      logger.log('  dir: ' + destDirPath);

      const workDir = _pngGenerator2.default.createWorkDir();
      if (!workDir) {
        reject(new Error('Failed to create the working directory.'));
        return;
      }

      _pngGenerator2.default.generate(svgFilePath, workDir, options.modes, (err, images) => {
        if (err) {
          _del2.default.sync([workDir], { force: true });
          reject(err);
          return;
        }

        IconGenerator.generate(images, destDirPath, options, logger, (err2, results) => {
          _del2.default.sync([workDir], { force: true });
          return err2 ? reject(err2) : resolve(results);
        });
      }, logger);
    });
  }

  /**
   * Generate an icon = require(the SVG file.
   *
   * @param {String} src     Path of the PNG files direcgtory.
   * @param {String} dir     Path of the output files directory.
   * @param {Object} options Options.
   * @param {Logger} logger  Logger.
   *
   * @return {Promise} Promise object.
   */
  static fromPNG(src, dir, options, logger) {
    return new Promise((resolve, reject) => {
      const pngDirPath = _path2.default.resolve(src);
      const destDirPath = _path2.default.resolve(dir);
      logger.log('Icon generetor from PNG:');
      logger.log('  src: ' + pngDirPath);
      logger.log('  dir: ' + destDirPath);

      const images = _pngGenerator2.default.getRequiredImageSizes(options.modes).map(size => {
        return _path2.default.join(pngDirPath, size + '.png');
      }).map(path => {
        const size = Number(_path2.default.basename(path, '.png'));
        return { path, size };
      });

      let notExistsFile = null;
      images.some(image => {
        const stat = _fs2.default.statSync(image.path);
        if (!(stat && stat.isFile())) {
          notExistsFile = _path2.default.basename(image.path);
          return true;
        }

        return false;
      });

      if (notExistsFile) {
        reject(new Error('"' + notExistsFile + '" does not exist.'));
        return;
      }

      IconGenerator.generate(images, dir, options, logger, (err, results) => {
        return err ? reject(err) : resolve(results);
      });
    });
  }

  /**
   * Generate an icon = require(the image file infromations.
   *
   * @param {Array.<ImageInfo>} images  Image file informations.
   * @param {String}            dest    Destination directory path.
   * @param {Object}            options Options.
   * @param {Logger}            logger  Logger.
   * @param {Function}          cb      Callback function.
   */
  static generate(images, dest, options, logger, cb) {
    if (!(images && 0 < images.length)) {
      cb(new Error('Targets is empty.'));
      return;
    }

    const dir = _path2.default.resolve(dest);
    _mkdirp2.default.sync(dir);

    // Select output mode
    const tasks = [];
    let path = null;
    options.modes.forEach(mode => {
      switch (mode) {
        case _cliUtil.CLI.modes.ico:
          path = _path2.default.join(dir, options.names.ico + '.ico');
          tasks.push(_icoGenerator2.default.generate(IconGenerator.filter(images, _icoGenerator.ICO.imageSizes), path, logger));
          break;

        case _cliUtil.CLI.modes.icns:
          path = _path2.default.join(dir, options.names.icns + '.icns');
          tasks.push(_icnsGenerator2.default.generate(IconGenerator.filter(images, _icnsGenerator.ICNS.imageSizes), path, logger));
          break;

        case _cliUtil.CLI.modes.favicon:
          path = _path2.default.join(dir, 'favicon.ico');
          tasks.push(_icoGenerator2.default.generate(IconGenerator.filter(images, _faviconGenerator.Favicon.icoImageSizes), path, logger));
          tasks.push(_faviconGenerator2.default.generate(IconGenerator.filter(images, _faviconGenerator.Favicon.imageSizes), dir, logger));
          break;

        default:
          break;
      }
    });

    Promise.all(tasks).then(results => {
      cb(null, IconGenerator.flattenValues(results));
    }).catch(err => {
      cb(err);
    });
  }

  /**
   * Filter by size to the specified image informations.
   *
   * @param {Array.<ImageInfo>} images Image file informations.
   * @param {Array.<Number>}    sizes  Required sizes.
   *
   * @return {Array.<ImageInfo>} Filtered image informations.
   */
  static filter(images, sizes) {
    return images.filter(image => {
      return sizes.some(size => {
        return image.size === size;
      });
    }).sort((a, b) => {
      return a.size - b.size;
    });
  }

  /**
   * Convert a values to a flat array.
   *
   * @param  {Array.<String|Array>} values Values ([ 'A', 'B', [ 'C', 'D' ] ]).
   *
   * @return {Array.<String>} Flat array ([ 'A', 'B', 'C', 'D' ]).
   */
  static flattenValues(values) {
    const paths = [];
    values.forEach(value => {
      if (!value) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach(path => {
          paths.push(path);
        });
      } else {
        paths.push(value);
      }
    });

    return paths;
  }
}
exports.default = IconGenerator;