# leap.coffee

leap is a tiny experimental flow-control tool for coffee-script

Basicly, it is invoke.js with some tweaks and async map/reduce support.

## Usage

    leap (flow) ->
      # first do something async
    .then (res, flow) ->
      # then do something with result
    .and (res, flow) ->
      # and parallel async
    .then ([first, second], flow) ->
      # then got results from both
    .and.each (el, flow) ->
      # and run async each
    .rescue (err) ->
      # also, handle all errors in one place

## Testing

    $ npm install cson
    $ cake pack

then

    $ npm test

## Building

    $ npm install cson
    $ cake pack
    $ cake bake

## License

MIT