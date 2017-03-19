#!/usr/bin/env node

var fs = require('fs');
var unzip = require('unzipper');
var csv = require('csvtojson');
var async = require('async');

var tmp = './tmp/';
var persons = [];

function start() {
  var args = getArgs();
  if(!args.inputFile) {
    throw new Error('Enter the input .zip file');
  }
  unzipFiles(args.inputFile);
}

function getArgs () {
  return {
    inputFile : process.argv[2],
    outputFile: process.argv[3] || 'output.json'
  };

}

function unzipFiles (name) {
  fs.mkdir(tmp, function() {
    
    fs.createReadStream(name)
        .pipe(unzip.Extract({ path: tmp }))
        .on('close', function () {
          
          getFilesFromDirectory(tmp).then(function(files) {
            async.each(files, function(file, cb) {
              parseFile(tmp + file, function(data) {
                persons = persons.concat(data);
                cb();
              });
            }, function() {
              writeToFile(persons);
            });
          });
        })
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
        resolve(files);
      }
    });
  });
}

function writeToFile(data) {
  var file = getArgs().outputFile;
  fs.writeFile(file, JSON.stringify(data));
}

start();