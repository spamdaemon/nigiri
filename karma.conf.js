module.exports = function(config) {
    config.set({

        // base path, that will be used to resolve files and exclude
        basePath : '',

        // frameworks to use
        frameworks : [ 'jasmine' ],

        // list of files / patterns to load in the browser
        files : [ //
        "libs/zone.min.js", // zone MUST be first
        "libs/zone-modules.min.js", // zone helper
        //
        'src/**/*.js',
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
        reporters : [ 'progress' ],

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
        logLevel : config.LOG_DEBUG,

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
        'Chrome', 'Firefox'//
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
