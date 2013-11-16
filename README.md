# leap

Simple flow-control tool for coffee-script. It makes async coding much easier.

## Examples

  ```coffeescript
    leap ->
      #first async function
    , ->
      #second async function
    , ->
      # all functions are executed in parallel
  ```
  ```coffeescript

    leap ->
      # do something async
      @next results
    .then (res) ->
      # do something async with results
      async_function res, @
    .and (res) ->
      # do something else with it in parallel
      another_async_function res, @
    .then ([first_res, second_res]) ->
      # use data from async results of previous step
  ```
  ```coffeescript

    leap ->
      async_function ["Kinks", "Beatles", "United States of America"], @
    .then.map (rockband) ->
      async_function "The #{rockband}", @
    .then (bands) ->
      bands.should.be.deep.equal [
        "The Kinks"
        "The Beatles"
        "The United States of America"
      ]
    .rescue (err) ->
      #handle all async errors in one place
  ```

## Usage

- install via npm
  ```
  npm install leap
  ```

- require in your code
  ```coffeescript
  leap = require 'leap'
  ```

## API

- **leap(functions...)**

  Run one ore more functions as a first step of sequence. All functions are called with callback as first parameter. Also, callback is a context of all functions.
  ```coffeescript
  leap (callback) ->
    fs.readFile 'file', callback
  ```

  is the same as
  ```coffeescript
  leap ->
    fs.readFile 'file', @
  ```

- **.then(functions...)**

  Add one o more functions to be executed after previous step. All functions are called with results of previous step as first parameter, callback as second parameter. Also, callback is a context.
  ```coffeescript
  leap ->
    fs.readFile 'file', @
  .then (content) ->
    db.create content, @
  , (content) ->
    some_api_request.find content, @
  .then ([db_entry, api_response]) ->
    #
  ```

- **.and(functions...)**

  Add functions to current step. All functions get results from previous step as first parameter. Also, callback is a context and second parameter.

  ```coffeescript
  leap ->
    model.countLikes user, @
  .and  ->
    model.countViews user, @
  .then ([likes, views]) ->
    addToResponse likes, views
    do @
  .and ([likes, views]) ->
    saveToCache user, likes, views, @
  ```

- **,**

  Functions, pased to leap, .then or .and are executed in parallel


- **.rescue(handler)**

  All errors stops execution of a flow and processed by handler. Error is passed by first argument

  ```coffeescript
    leap ->
      fs.readFile 'test1', @
    , ->
      fs.readFile 'test2', @
    .rescue (err) ->
      console.log err
  ```

- **callbacks: @ and @next**

  Will be documented soon. see tests.
- **leap.map(iterator)**
- **.and.map(iterator)**
- **.then.map(iterator)**

  Will be documented soon. see tests.

- *leap.reduce(iterator)**
- **.and.reduce(iterator)**
- **.then.reduce(iterator)*

  Will be documented soon. see tests.

- *leap.filter(iterator)**
- **.and.filter(iterator)**
- **.then.filter(iterator)*

  Will be documented soon. see tests.

- *leap.reject(iterator)**
- **.and.reject(iterator)**
- **.then.reject(iterator)*

  Will be documented soon. see tests.

## Inspired by

- [invoke.js](https://github.com/repeatingbeats/invoke) by Steve Lloyd
- [first](https://github.com/DanielBaulig/first) by Daniel Baulig
- [async.js](https://github.com/caolan/async) by Caolan McMahon

## Testing

    $ npm test

## License

MIT