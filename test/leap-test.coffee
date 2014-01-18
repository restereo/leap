
leap = require '../lib/leap'

chai = require 'chai'
chai.use require './helpers/liquorice'
should = chai.should()
expect = chai.expect
fs = require 'fs'



delay = (fn, val, err, ms) ->
	setTimeout ->
		fn err, val
	, ms or Math.round Math.random()*50

describe 'leap', ->

	it 'is a tool', ->

		leap.should.be.a 'function'
		leap.should.accept.function
		(leap ->).should.have.methods 'then', 'and', 'rescue'

	it 'makes sence to async flow-control', (yeah)->

		leap ->
			fs.open '_a_file', 'w', @
		, ->
			fs.readdir '.', @
		, ->
			fs.mkdir '_b_dir', @
		.then ->
			fs.rename '_b_dir','_c_dir', @
		, ([fd])->
			fs.close fd, @
		.then ->
			fs.rename '_a_file', '_c_dir/_d_file', @
		.then ->
			fs.unlink '_c_dir/_d_file', @
		.and ->
			fs.rmdir '_c_dir', @
		.then ->
			do yeah
		.rescue yeah
		# all async errors handled in one place
		# in this case, by mocha

	it 'is really simple', (something) ->

		leap ->
			#a function, that is somehow async
			delay @

		.and -> # .and is parallel
			#b native async function with callback
			fs.stat '.', @
			# delay @
		, -> # , is parallel
			#c function is sync, its ok
			do @
		.then (results)-> # .then is consecutive
			# a,b,c were executed in-parallel
			# and resultes are in array

			# d, another form of callback
			fs.exists '.', @cb

		.and ->
			# e, yes, this is a valid callback too
			@next()
		.then ->
			# d and e were executed in-parallel
			do something
		.rescue something

		# so it was like do a, b, c, then, d and e

	it 'passes results', (done)->

		leap  ->
			delay @, 5
		.then (five) ->
			five.should.be.equal 5
			delay @, 4
		.then (four) ->
			four.should.be.equal 4
			@next 'ten'
		.then (ten) ->
			ten.should.be.equal 'ten'
			do done

	it 'suits for short callbacks replace', (done) ->

		leap ->
			delay @
		.and ->
			delay @
		.then ->
			do done
		.rescue done

	it 'supports parallel execution', (done) ->

		leap ->
			delay @, 5
		.and ->
			delay @, 4
		.and ->
			delay @, 'ten'
		.then ([five, four, ten])->
			four.should.be.equal 4
			five.should.be.equal 5
			ten.should.be.equal 'ten'
			delay @, {five, four, ten}

		.and ([five, four, ten]) ->
			four.should.be.equal 4
			five.should.be.equal 5
			ten.should.be.equal 'ten'
			@next yes

		.then ([{five, four, ten}, ok]) ->

			four.should.be.equal 4
			five.should.be.equal 5
			ten.should.be.equal 'ten'
			ok.should.be.ok

			do done

	it 'handles errors', (done) ->

		errmsg = 'wtf'
		count = 0

		leap ->
			delay @, null, new Error errmsg, 20
		.and ->
			delay @, null, new Error errmsg, 20
		.and ->
			delay @, null, new Error errmsg, 20
		.then ->
			throw new Error 'bug in error handling'
		.and ->
			throw new Error 'bug in error handling'
		.rescue (err) ->

			count++
			count.should.be.equal 1
			err.message.should.be.equal errmsg

			delay done, null, null, 30

		.then ->
			throw new Error 'bug in error handling'
		.and ->
			throw new Error 'bug in error handling'

	it 'run parallel queries', (done)->

		leap ->

			delay @,
				numbers: [1, 2, 3, 4]

		.then ({numbers}) ->

			leap.map numbers, (number, back) ->
				delay -> back null, number*number
			, @

		.then (squares) ->

			squares.should.be.deep.equal [1, 4, 9, 16]
			do done

	it 'can start a flow with map', (done)->


		leap.map ['Brown', 'Pink', 'Orange'], (color, back) ->
			delay back, "Mr. #{color}"
		.rescue(done)
		.then (titles) ->

			titles.should.be.deep.equal [
				"Mr. Brown"
				"Mr. Pink"
				"Mr. Orange"
			]

			do done


	it 'can use then.map in a flow', (done)->

		leap ->
			delay @, ["Kinks", "Beatles", "United States of America"]
		.then.map (rockband) ->
			delay @, "The #{rockband}"
		.and (rockbands, unacceptable) ->
			unacceptable "Beatles" not in rockbands
		.rescue(done)
		.then ([bands, ___]) ->

			bands.should.be.deep.equal [
				"The Kinks"
				"The Beatles"
				"The United States of America"
			]

			do done

	it 'may use and.map too', (done)->

		leap ->
			delay @, [1, 2, 3]
		.then (arr) ->
			delay @, 0
		.and.map (n) ->
			delay @, n*n*n
		.and.map (n, next) ->
			delay next, n*2
		.rescue(done)
		.then (nums) ->
			nums.should.be.deep.equal [0,[1,8,27], [2, 4, 6]]
			do done


	it 'also has async reduce', (done) ->

		leap.reduce [1,2,3,4,5], (n, memo = 1) ->
			delay @, n*memo
		.rescue(done)
		.then (factorial) ->
			factorial.should.be.equal 120
			do done


	it 'has then.reduce and and.reduce', (done) ->

		leap ->
			delay @, [1,2,3,4,5,6]
		.then.reduce (n, memo=1)->
			delay @, memo*n
		.and.reduce (n, memo=0)->
			delay @, memo + n*n
		.and.reduce (n, memo=0)->
			delay @, memo + n*n*n
		.rescue(done)
		.then ([factorial, sum2, sum3]) ->
			factorial.should.be.equal 120*6
			sum2.should.be.equal 36+25+16+9+4+1
			sum3.should.be.equal 6*36+125+64+27+8+1
			do done

	it 'has .filter and .reject', (done) ->

		leap.filter [1, 2, 3, 4, 5, 6], (n) ->
			delay @, n % 2 != 0
		.then (odd) ->
			odd.should.be.deep.equal [1, 3, 5]
			@next odd
		.then.reject (n)->
			delay @, n is 3
		.then (not_for_threes) ->
			not_for_threes.should.be.deep.equal [1, 5]
			do done

	it 'can be saved', (done) ->

		leap.export ->
			'this code should not be executed'.should.not.be.ok
		.then ->
			'this code should not be executed'.should.not.be.ok

		a = leap.export ->
			delay @, 5

		a.then (five)->
			five.should.be.equal 5
			do done
		.yeah() # this run saved leaps

	it 'is mystical', (naturally) ->

		leap.of.faith ->
			delay this,
				embrace: 'chaos'
		.and (feel) ->
			feel null, 'dude'
		.then ([you, me]) ->

			expect('dude').to.be.equal me
			you.should.feel.deep.understanding 'embrace', 'chaos'
			you.should.be.ok

			do naturally

	###
	*** 02013.11
	###
	it 'has smart .map support', (done) ->

		leap.map ['q'], (letter) ->
			@next letter
		.then (letters) ->
			letters.should.be.deep.equal ['q']
			do @
		.then ->
			@next ['q', 'w']
		.then.map (letter) ->
			@next letter
		.then (letters) ->
			letters.should.be.deep.equal ['q', 'w']

			do done


	it 'is friendly to empty arrays', (done) ->

		leap.map [],->
			throw new Error 'Erorrneus iterator execution on empty map'
		.then (empty)->
			empty.should.be.deep.equal []
			@next []
		.then.reduce ->
			throw new Error 'Erorrneus iterator execution on empty reduce'
		.then (empty) ->
			if typeof empty isnt 'undefined'
				throw new Error 'empty reduce should not return result'
			do done

