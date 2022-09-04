# Testing in Pulsar 

Testing is an important aspect of any large code-base. Pulsar has a suite of exhaustive tests built into the core of the editor located in `./spec`.

There is also the ability to tests packages built right into the editor, which will find all test suites within the `./packages` folders.

## Core Testing 

To run the editor test suite run `yarn start --test spec`.

Running this command uses `yarn` to run the `start` script within `package.json`. The start script starts up Pulsar using `electron` and passes the additional arguments to Pulsar.

At this point as the editor starts up it continuously checks its CLI arguments.

The testing framework to use to run the tests is determined in `./src/atom-application.js` by the `resolveTestRunnerPath` script, which will use the test specified by the package itself, or otherwise will default to the legacy test runner, of which is `./spec/jasmine-test-runner.js`.

Other test runners can be specified within a packages `package.json` like so:

```json 
  "atomTestRunner": "./test/runner"
```

This will then use whatever test runner is located in that file location, which commonly is used as `atom-mocha-test-runner`, which uses the alternate test runner located in `spec/main-process/mocha-test-runner.js`.

Otherwise once the test runner is determined later on in the application the tests are started via `./src/initialize-test-window.js` that starts the testing process itself.

## Package Testing 

*More Information Needed*
