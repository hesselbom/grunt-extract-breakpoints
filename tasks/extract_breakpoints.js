/*
* grunt-extract-breakpoints
*
* Copyright (c) 2013 Viktor Hesselbom
* Licensed under the MIT license.
*/

'use strict';

var path = require('path');

module.exports = function(grunt) {
    grunt.registerMultiTask('extract_breakpoints', 'Parses CSS and extracts media queries based on specified viewport width.', function() {
        var dest = this.data.dest,
            options = this.options();

        function findCloseTagIndex(filecontent, offset) {
            var regex_closetag = new RegExp(/[{}]/g),
                open_tags = 0,
                match_closetag;

            regex_closetag.lastIndex = offset || 0;
            open_tags = 0;

            while (match_closetag = regex_closetag.exec(filecontent)) {
                if (match_closetag[0] === '{') {
                    open_tags++;
                }
                else {
                    open_tags--;

                    if (open_tags <= 0) {
                        return match_closetag.index;
                    }
                }
            }
        }

        function parseNumber(css) {
            var regex = new RegExp(/([\d\.]+)\s*(\D+)?/),
                match = css.match(regex);

            if (match) {
                switch(match[2]) {
                    case 'em':
                    case 'rem':
                        return parseFloat(match[1]) * 16;
                    default:
                        return parseFloat(match[1]);
                }
            }
            return -1;
        }

        function addWrapperClass(css, base_wrapper_class) {
            var regex = new RegExp(/(\s*)([^{},]+)\s*[{,]/g),
                match, wrapper_class;

            while (match = regex.exec(css)) {
                if (match[2].match(/^html/)) {
                    wrapper_class = 'html.' + base_wrapper_class + ' ';

                    css = css.slice(0, match.index)
                        + wrapper_class
                        + css.slice(match.index + match[1].length + 'html'.length);

                    regex.lastIndex = match.index + match[0].length + wrapper_class.length - match[1].length - 'html'.length;
                }
                else {
                    wrapper_class = ' .' + base_wrapper_class + ' ';

                    css = css.slice(0, match.index)
                        + wrapper_class
                        + css.slice(match.index + match[1].length);

                    regex.lastIndex = match.index + match[0].length + wrapper_class.length - match[1].length;
                }
            }

            return css;
        }

        this.files[0].src.forEach(function(filepath) {
            grunt.log.writeln('Parsing ' + filepath + '.');

            var filecontent = grunt.file.read(filepath),
                regex = new RegExp(/@media\s*([^{]*)\s*{/g),
                regex_min = new RegExp(/min-width\s*:\s*([^)]*)\)/),
                regex_max = new RegExp(/max-width\s*:\s*([^)]*)\)/),
                match,
                match_min,
                match_max,
                min,
                max,
                closetag_index,
                content,
                new_filecontent = '';

            // Calculate and replace rem with px
            while (match = regex.exec(filecontent)) {
                match_min = match[0].match(regex_min);
                match_max = match[0].match(regex_max);
                min = 0;
                max = 999999;

                if (match_min) {
                    min = parseNumber(match_min[1]);
                }

                if (match_max) {
                    max = parseNumber(match_max[1]);
                }

                // Width is inside breakpoint boundaries
                if (options.width >= min && options.width <= max) {
                    // Remove @media selector
                    closetag_index = findCloseTagIndex(filecontent, match.index);
                    content = filecontent.slice(match.index + match[0].length, closetag_index);

                    if (options.wrapper_class) {
                        content = addWrapperClass(content, options.wrapper_class);
                    }

                    new_filecontent += content;
                }
                // Not inside
                else {
                    // Remove @media selector with content
                    closetag_index = findCloseTagIndex(filecontent, match.index);
                    regex.lastIndex = closetag_index;
                }
            }

            grunt.file.write(dest + '/' + path.basename(filepath), new_filecontent);
        });
    });
};
