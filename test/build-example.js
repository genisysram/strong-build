module.exports = function buildExample(args, callback) {
  assert = require('assert');
  debug = require('debug')('strong-build:test');
  fs = require('fs');
  path = require('path');
  tar = require('tar');
  util = require('util');
  zlib = require('zlib');

  tar.list = function list(tarfile, callback) {
    var paths = [];

    fs.createReadStream(tarfile)
    .on('error', callback)
    .pipe(zlib.Unzip())
    .pipe(tar.Parse())
    .on('entry', function(entry) {
      paths.push(entry.path);
    })
    .on('end', function() {
      debug('tarfile %s list:', tarfile, paths);
      return callback(null, paths);
    });
  };

  fs.readJsonSync = function readJsonSync(file) {
    return JSON.parse(fs.readFileSync(file));
  };

  require('shelljs/global');

  var build = require('../');

  // Check for node silently exiting with code 0 when tests have not passed.
  var ok = false;

  process.on('exit', function(code) {
    if (code === 0) {
      assert(ok);
    }
  });


  debug('test: build slc example, args:', args);
  debug('cwd:', pwd());
  debug('which slc:', which('slc'), exec('slc -v', {silent: true}).output);

  rm('-rf', '_suite');
  exec('slc example suite _suite --no-install', {silent: true});
  cd('_suite');
  assert(!test('-d', 'node_modules'));

  var argv = ['node', 'slb'].concat(args);

  debug('build with argv:', argv);

  build.build(argv, function(er) {
    ok = true;
    return callback(er)
  });

  debug('waiting for build...');
};
