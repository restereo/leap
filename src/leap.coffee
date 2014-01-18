###
# leap.coffee
a flow-control tool
(c) 2013 Vladimir Tarasov

Leap is unspired by:
- [invoke.js](https://github.com/repeatingbeats/invoke) by Steve Lloyd
- [first](https://github.com/DanielBaulig/first) by Daniel Baulig
- [async.js](https://github.com/caolan/async) by Caolan McMahon

Leap is freely distributable under the terms of the [MIT license](http://en.wikipedia.org/wiki/MIT_License).
All merit is dedicated to the benefit of all beings.
###

# Export as node module, amd module or global variable
!((name, definition) ->

	if module?.exports
		module?.exports = do definition
	else if define?.amd
		define name, definition
	else
		@[name] = do definition

) 'leap', ->

	# defer function is diferent for node and browser
	defer = process?.nextTick or (f) -> setTimeout f, 1

	# Basic class
	class Flow

		# create first step
		constructor: (fns...)->

			@current = @root = new Step @_wrap_first fns

			# init for map, reduce, etc
			@then.flow = @
			@and.flow  = @

			if not @manual_start
			# run the flow, after it is formed
				defer => do @yeah

		# add new step
		# accept one or more functions
		then: (fn...) ->
			@current = @current.child fn
			@

		# add to current step
		# accept one or more functions
		and: (fn) ->

			if @current is @root
				fn = @_wrap_first fn

			@current.sibling fn
			@

		# add error handler
		rescue: (fn) ->
			@_rescue = fn
			@

		# default rescue handler
		_rescue: (err) ->

			console.log 'leap failed'
			console.log err

			# throw Error err

		# run
		yeah: ->
			@root.run null, @_rescue

		# first step doesn't accept results from previous steps
		# so first step functions are modified
		_wrap_first: (fn) ->

			if Array.isArray fn
				res = []
				addF = (fun) ->
					res.push (___, next) ->
						fun.call next, next
				for f in fn
					addF f
				return res
			else
				return (___, next) -> fn.call next, next

	# step of a flow
	class Step

		# functions of a step
		functions: []

		# create a step
		constructor: (actions) ->
			@_next = @_err = null

			if Array.isArray actions
				@functions = actions
			else if typeof actions is 'function'
				@functions = [actions]

		# create next step
		child: (fn) ->
			@_next = new Step fn

		# add more functions to this step
		sibling: (fn) ->
			@functions.push fn

		# execute all functions properly
		run: (passed, rescue) ->

			len = @functions.length
			results = []
			completed = 0

			# all functions should be run in parallel
			parallel = (index, fn) =>

				# callback to all functions is the same
				callback = (err, res) =>

					return if @err # if error in some other function of a step

					# function fails — handle error
					if err
						@err = err
						return rescue err

					# form results
					if len is 1
						results = res
					else
						results[index] = res

					# run next step, if all functions are completed
					if @_next and ++completed is len
						@_next.run results, rescue

				# special callback for functions, that doesn't pass error in first arg
				callback.next = callback.cb = (res)->
					arg = Array::slice.call arguments
					arg.unshift null
					callback.apply @, arg

				# special callback object for Backbone functions
				if typeof Backbone isnt 'undefined'
					callback.bb =
						success: ->
							arg = Array::slice.call arguments
							arg.unshift null
							callback.call @, arg
						error: ->
							callback.call @, Array::slice.call arguments

				# run function in context of callback
				# with data from previous step and callback in second argument
				fn.apply callback, [passed, callback]

			# run all functions of a step in parallel
			for f, i in @functions
				parallel i, f


	# leap is a variable for export
	leap = (fn...) -> new Flow fn...

	# Special case: manual start
	class FlowWithManualStart extends Flow
		manual_start: yes

	leap.export = (fn...) -> new FlowWithManualStart fn...

	# async map.
	leap.map = (collection, iterator, next) ->

		flow = new Flow

		if not collection or collection.length is 0

			flow.and ->
				do @
			.then ->
				@next []

		else
			# execute iterator with diferent params
			# as many parallel functions
			((param) ->
				flow.and ->
					iterator.call @, param , @
			) i for i in collection


			if collection.length is 1
				flow.then (res) -> @next [res]

		# callback is optional
		if next
			flow.then (res) -> next null, res
			flow.rescue next

		# its chainable
		return flow

	# map can be inside a flow
	Flow::then.map = (fn) ->
		@flow.then (arr, cb) -> leap.map arr, fn, cb
	Flow::and.map = (fn) ->
		@flow.and  (arr, cb) -> leap.map arr, fn, cb

	# async reduce
	leap.reduce = (collection, iterator, next) ->

		flow = new Flow -> do @

		# execute iterator with diferent params
		# in series
		((param) ->
			flow.then (memo) ->
				iterator.call @, param, memo , @
		) i for i in collection

		if next
			flow.then (res) -> next null, res
			flow.rescue next

		return flow

	# map can be inside a flow
	Flow::then.reduce = (fn) ->
		@flow.then (arr, cb) -> leap.reduce arr, fn, cb
	Flow::and.reduce = (fn) ->
		@flow.and  (arr, cb) -> leap.reduce arr, fn, cb

	# async filter
	# is a map with sync filter after it
	leap.filter = (collection, iterator, next) ->
		leap.map(collection, iterator)
		.then (arr) ->
			res = []
			for val, i in arr
				res.push collection[i] if val

			return next null, res if next
			@next res

	# filter in a flow
	Flow::then.filter = (fn) ->
		@flow.then (arr, cb) -> leap.filter arr, fn, cb
	Flow::and.filter = (fn) ->
		@flow.and  (arr, cb) -> leap.filter arr, fn, cb

	# async reject
	leap.reject = (collection, iterator, next) ->
		leap.map(collection, iterator)
		.then (arr) ->
			res = []
			for val, i in arr
				res.push collection[i] if not val

			return next null, res if next
			@next res

	Flow::then.reject = (fn) ->
		@flow.then (arr, cb) -> leap.reject arr, fn, cb
	Flow::and.reject = (fn) ->
		@flow.and  (arr, cb) -> leap.reject arr, fn, cb


	# http://en.wikipedia.org/wiki/Leap_of_faith
	leap.of =
		faith: leap

	leap.VERSION = "0.1.1"

	return leap