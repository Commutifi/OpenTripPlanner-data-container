const fs = require('fs');
const fse = require('fs-extra');
const exec = require('child_process').exec;
const through = require('through2');
const gutil = require('gulp-util');
const col = gutil.colors;
const {hostDataDir, dataDir} = require('../config');
const {postSlackMessage} = require('../util');

/**
 * Builds an OTP graph with gtfs file. If the build is succesful we can trust
 * the file is good enough to be used.
 */
function testGTFS(gtfsFile, quiet=false) {
  let lastLog=[];

  const p = new Promise((resolve, reject) => {
    if(fs.existsSync(gtfsFile)) {
      if(!fs.existsSync(`${dataDir}/tmp`)) {
        fs.mkdirSync(`${dataDir}/tmp`);
      }
      fs.mkdtemp(`${dataDir}/tmp/router-build-test`, (err, folder) => {
        if (err) throw err;
        process.stdout.write('Testing ' + gtfsFile + ' in directory ' + folder +'...\n');
        const dir = folder.split('/').pop();
        const r = fs.createReadStream(gtfsFile);
        r.on('end', () => {
          try {
            const build = exec(`docker run --rm -v ${hostDataDir}/tmp:/opt/opentripplanner/graphs --entrypoint /bin/bash hsldevcom/opentripplanner:prod  -c "java -Xmx6G -jar otp-shaded.jar --build graphs/${dir} "`,
              {maxBuffer:1024*1024*8});
            build.on('exit', function(c){
              if(c===0) {
                resolve(true);
                process.stdout.write(gtfsFile + ' ' + col.green('Test SUCCESS\n'));
              } else {
                const log = lastLog.join('');
                process.stdout.write(gtfsFile + ' ' + col.red(`Test FAILED (${c})\n`));
                process.stdout.write(gtfsFile + ': ' + col.red(lastLog.join('')));
                postSlackMessage(`${gtfsFile} test failed: ${log}`);
                resolve(false);
              }
              fse.removeSync(folder);
            });
            build.stdout.on('data', function (data) {
              lastLog.push(data.toString());
              if(lastLog.length===20) {
                delete lastLog[0];
              }
              if(!quiet) {
                process.stdout.write(data.toString());
              }
            });
            build.stderr.on('data', function (data) {
              lastLog.push(data.toString());
              if(lastLog.length===20) {
                delete lastLog[0];
              }
              if(!quiet) {
                process.stderr.write(data.toString());
              }
            });
          } catch(e) {
            const log = lastLog.join('');
            process.stdout.write(gtfsFile + ' ' + col.red(`Test FAILED (${e})`));
            process.stdout.write(gtfsFile + ': ' + col.red(log));
            postSlackMessage(`${gtfsFile} test failed: ${log}`);
            fse.removeSync(folder);
            reject(e);
          }
        });
        r.pipe(fs.createWriteStream(`${folder}/${gtfsFile.split('/').pop()}`));
      });
    } else {
      process.stdout.write(gtfsFile + ' does not exist!');
    }
  });
  return p;
}

module.exports= {
  testGTFSFile: () => {
    return through.obj(function(file, encoding, callback) {
      const gtfsFile = file.history[file.history.length-1];
      testGTFS(gtfsFile, true).then((success) => {
        if(success) {
          callback(null, file);
        } else {
          callback(null, null);
        }
      }).catch(() => {
        callback(null, null);
      });
    });
  }
};
