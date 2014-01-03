# grunt-extract-breakpoints



## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-extract-breakpoints --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-extract-breakpoints');
```


## The "extract_breakpoints" task

### Overview
In your project's Gruntfile, add a section named `extract_breakpoints` to the data object passed into `grunt.initConfig()`.

```js
grunt.initConfig({
  extract_breakpoints: {
    options: {
        width: 800,
        wrapper_class: 'no-mediaqueries'
    },
    dist: {
        src: ['app/css/*.css'],
        dest: 'dist/css/nobreakpoints/'
    }
  },
})
```

## Options

### width

Viewport width to simulate and extract css for

### wrapper_class

Optional wrapper class for extracted css

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
**2014-01-03** First release
