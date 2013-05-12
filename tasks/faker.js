/*
 * grunt-faker
 * https://github.com/chrisocast/grunt-faker
 *
 * Copyright (c) 2013 Chris Cast
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  var path = require('path');
  var Faker = require('Faker');

  // Loop through entire json object
  function processJson(obj) {
    for (var i in obj) {
      if (typeof(obj[i]) === "object") {
        processJson(obj[i]); // found an obj or array keep digging
      } else if (obj[i] != null){
        obj[i] = getFunctionNameAndArgs(obj[i]);// not an obj or array, check contents
      }
    }
    return obj;
  }

  // Get func name, extract args, and exec on their values
  function getFunctionNameAndArgs(value) {
    var pattern = /\{\{([^()]+?)(\((.+)\))?\}\}/g,
    match, func, args;

    var argArray = [];

    //todo: allow multiple {{tags}} in the same val
    //todo: need testing for the args detection below
    //todo: handle {{repeat(x)}} function to avoid having to dupe similar objects
    //todo: if a Faker func requires a param, throw readable alert

    while (match = pattern.exec(value)) {
      //grunt.log.writeln("matches: "+ match[0] + ", " + match[1] + ", " + match[2]+ ", " + match[3]);
      func = match[1];
      args = match[3];
    }

    if (args !== undefined ){
      if (args.indexOf("[") !== -1){
        // is an array as string, parse to return proper array
        args = JSON.parse(args);
        argArray.push(args);
      } else {
        // one or more string/number params
        args = args.replace(/, /gi, ",");
        args = args.replace(/'/gi, "", "gi");
        argArray = args.split(',');
      }
    }

    return executeFunctionByName(func,argArray);
  }

  // Execute function as string
  function executeFunctionByName(functionName, args) {
    var namespaces = functionName.split(".");
    var nsLength = namespaces.length;
    var context = Faker;
    var parentContext = Faker;

    if (namespaces[0].toLowerCase() === 'definitions'){
      grunt.log.warn('The definitions module of Faker is not avail through this task.');
      return;
    }

    for(var i = 0; i < nsLength; i++) {
      context = context[namespaces[i]];
    }

    for(var j = 0; j < nsLength - 1; j++) {
      parentContext = parentContext[namespaces[j]];
    }

    return context.apply(parentContext, args);
  }

  grunt.registerMultiTask('Faker', 'Generate fake JSON with Faker.', function() {
    
    var options = this.options();
    var outputFilePath = options.out;

    // Check for json format file
    var jsonFormatPath = options.jsonFormat;
    if (!grunt.file.exists(jsonFormatPath)) {
      grunt.log.warn('Format file "' + jsonFormatPath + '" not found.');
      return false;
    }

    // Create dir if needed
    var destDir = path.dirname(outputFilePath);
    if (!grunt.file.exists(destDir)) {
      grunt.file.mkdir(destDir);
    }

    // Get json and parse with Faker
    var json = grunt.file.readJSON(jsonFormatPath);
    var outputJson = processJson(json);

    // Write file with Faker json data
    grunt.file.write(outputFilePath, JSON.stringify(outputJson));

    // Print a success message
    grunt.log.writeln('File "' + outputFilePath + '" created.');
  });

};
