#!/usr/bin/env node

var fs = require('fs');
var unzip = require('unzip-stream');
var csv = require('csvtojson');
var async = require('async');

var tmp = './tmp/';

function start() {
  var args = getArgs();
  unzipFiles(args.inputFile);

  var persons = [];
  getFilesFromDirectory(tmp).then(function(files) {
    async.each(files, function(file, cb) {
      parseFile(tmp + file, function(data) {
        persons = persons.concat(data);
        cb();
      });
    }, function() {
      writeToFile(args.outputFile, persons);
    });
  });
}

function getArgs () {
  return {
    inputFile : process.argv[2],
    outputFile: process.argv[3]
  };

}

function unzipFiles (name) {
  fs.mkdir(tmp, function() {
    fs.createReadStream(name)
        .pipe(unzip.Extract({ path: tmp }));
  });
}

function parseFile (file, callback) {
  var fileData = [];
  csv({delimiter: '||'})
    .fromFile(file)
    .on('json', function(jsonObj) {
      fileData.push(personDecorator(jsonObj));
    })
    .on('done', function() {
      callback(fileData);
    });
}

function personDecorator(obj) {
  return {
    name: obj.last_name + ' ' + obj.first_name,
    phone: obj.phone.replace(/\s*[()-]\s*/g, ''),
    person: {
      firstName: {
        type: obj.first_name
      },
      lastName: {
        type: obj.last_name
      }
    },
    amount: obj.amount,
    date: obj.date.split('/').reverse().join('-'),
    costCenterNum: obj.cc.replace(/\s*[A-Z]\s*/g, '')
  }
}

function getFilesFromDirectory(dir) {
  return new Promise(function(resolve, reject) {
    fs.readdir(dir, function(err, files) {
      if (err) {
        reject(err);
      } else {
        console.log(files);
        resolve(files);
      }
    });
  });
}

function writeToFile(file, data) {
  fs.writeFile(file, JSON.stringify(data));
}

start();