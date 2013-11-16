fs = require 'fs'
{exec} = require 'child_process'

compile = (source, target) ->
	fs.writeFileSync target, require('coffee-script').compile fs.readFileSync source, 'utf-8'

minify = (source, target) ->
	fs.writeFileSync target, (require("uglify-js").minify source).code

run = (command) -> exec command, (err, stdout, stderr) ->
	throw err if err
	console.log stdout + stderr

task 'build', 'and minify', (options) ->
	run 'npm install'
	compile './lib/leap.coffee', './lib/leap.js'
	minify './lib/leap.js', './leap.min.js'

task 'test', 'with mocha', (options) ->
	invoke 'build', options
	run './node_modules/.bin/mocha --compilers coffee:coffee-script'