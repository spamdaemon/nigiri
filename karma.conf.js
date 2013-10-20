module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath : '',

        // frameworks to use
        frameworks : [ 'jasmine' ],

        // list of files / patterns to load in the browser
        files : [
        "src/header.js",//
        "src/utils.js",//
        "src/wrapper.js",//
        "src/event.js",//
        "src/eventTarget.js", //

        "src/async/keyRange.js",//
        "src/async/request.js",//
        "src/async/transaction.js",//
        "src/async/database.js",//
        "src/async/openDBRequest.js",//
        "src/async/factory.js",// /
        "src/async/cursor.js",//
        "src/async/cursorWithValues.js",//
        "src/async/cursors.js",//
        "src/async/objectStore.js",//
        "src/async/index.js",//
        "src/async/environment.js",//
        //
        "src/async/extensions/keySet.js", //
        "src/async/extensions/keyPath.js", //
        "src/async/extensions/options.js",//
        "src/async/extensions/ranges.js",//
        "src/async/extensions/createGenericCursorRequest.js",//
        "src/async/extensions/createKeySetCursorRequest.js",//
        "src/async/extensions/countByCursor.js",//
        "src/async/extensions/updateByCursor.js",//
        "src/async/extensions/deleteByCursor.js",//
        "src/async/extensions/getByCursor.js",//
        "src/async/extensions/getKeyByCursor.js",//
        "src/async/extensions/cursors.js",//
        "src/async/extensions/query.js",//
        "src/async/extensions/addPutAll.js",//
        "src/async/extensions/getAllByCursor.js",//
        "src/async/extensions/getAllKeysByCursor.js",// 
        "src/async/extensions/getAllPrimaryKeysByCursor.js",// 
        "src/async/extensions/cursors.js",//

        //
        "src/export.js", //
        
        //
        'test/lib/**/*.js',//
        // special tests
        'test/spec/**/*.js'//
        //
        ],

        // list of files to exclude
        exclude : [

        ],

        // test results reporter to use
        // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage'
        reporters : [ 'progress', 'html' ],

        // the default configuration
        htmlReporter : {
            outputDir : 'karma_html',
            templatePath : __dirname + '/jasmine_template.html'
        },

        // web server port
        port : 9876,

        // cli runner port
        runnerPort : 9100,

        // enable / disable colors in the output (reporters and logs)
        colors : true,

        // level of logging
        // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
        logLevel : LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch : true,

        // Start these browsers, currently available:
        // - Chrome
        // - ChromeCanary
        // - Firefox
        // - Opera
        // - Safari (only Mac)
        // - PhantomJS
        // - IE (only Windows)
        browsers : [ //
          'Chrome' //
        , 'Firefox'//
        ],

        // If browser does not capture in given timeout [ms], kill it
        captureTimeout : 60000,

        // Continuous Integration mode
        // if true, it capture browsers, run tests and exit
        singleRun : false,

        // plugins to load
        plugins : [ 'karma-jasmine', 'karma-chrome-launcher', 'karma-firefox-launcher', 'karma-html-reporter' ]
    });
};
