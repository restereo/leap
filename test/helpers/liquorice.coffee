module.exports = (chai, utils) =>

	{expect, Assertion} = chai

	Assertion.addChainableMethod 'accept', null, -> @
	Assertion.addProperty 'function', ->
		@_obj ->
		# no error here
		@assert yes, "leap fails on empty function"

	Assertion.addMethod 'methods', () ->
		for action in arguments
			expect(@_obj).to.have.property action
			expect(@_obj[action]).to.be.a 'function'

	Assertion.addProperty 'feel', -> @
	Assertion.addMethod 'understanding', Assertion.prototype.property
