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

        function trim(str) {
            return str.replace(/^\s+|\s+$/g, '');
        }

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

        function parseSelectors(css, breakpoints) {
            var selector_regex = new RegExp(/(\s*)([^{},]+)\s*[{,]/g),
                property_regex = new RegExp(/([^{}:;]+)\s*:\s*([^;}]+)/g),
                match, match2,
                results = [];

            while (match = selector_regex.exec(css)) {
                var selector = trim(match[2]),
                    content = css.substring(match.index, css.indexOf('}', match.index)),
                    obj = { selector: selector, breakpoints: breakpoints, properties: [] };

                while (match2 = property_regex.exec(content)) {
                    var property = trim(match2[1]),
                        value = trim(match2[2]);

                    obj.properties.push({ property: property, value: value });
                }

                results.push(obj);
            }

            return results;
        }

        // Compare breakpoints and return 1 if first if preferred and 2 if second is
        // TODO: Check how this works with OR in media queries
        function compareBreakpoints(b1, b2) {
            var preferred = 1, i, j;

            for (i = 0; i < b1.length; i++) {
                for (j = 0; j < b2.length; j++) {
                    if (b1[i].min > b2[j].min) {
                        preferred = 1;
                    }
                    else {
                        preferred = 2;
                    }
                }
            }

            return preferred;
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
                matches,
                matched_breakpoints,
                min,
                max,
                closetag_index,
                content,
                new_filecontent = '',
                new_selectors = {},
                selector,
                new_selector,
                i, j, property;

            // Remove comments
            filecontent = filecontent.replace(/\/\*[\S\s]+?\*\//g, '');

            // Calculate and replace rem with px
            while (match = regex.exec(filecontent)) {
                matches = match[0].split(',');
                matched_breakpoints = [];

                for (i = 0; i < matches.length; i++) {
                    match_min = matches[i].match(regex_min);
                    match_max = matches[i].match(regex_max);
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
                        matched_breakpoints.push({ min: min, max: max });
                    }
                }

                if (matched_breakpoints.length > 0) {
                    // Remove @media selector
                    closetag_index = findCloseTagIndex(filecontent, match.index);
                    content = filecontent.slice(match.index + match[0].length, closetag_index);

                    var parsed = parseSelectors(content, matched_breakpoints);

                    for (i = 0; i < parsed.length; i++) {
                        selector = parsed[i];

                        if (!(selector.selector in new_selectors)) {
                            new_selectors[selector.selector] = {};
                        }

                        new_selector = new_selectors[selector.selector];

                        for (j = 0; j < selector.properties.length; j++) {
                            property = selector.properties[j];

                            // If property already exists, compare breakpoints to see which should be preferred
                            if (property.property in new_selector) {
                                if (compareBreakpoints(selector.breakpoints, new_selector[property.property].breakpoints) === 1) {
                                    new_selector[property.property] = { value: property.value, breakpoints: selector.breakpoints };
                                }
                            }
                            else {
                                new_selector[property.property] = { value: property.value, breakpoints: selector.breakpoints };
                            }
                        }
                    }
                }
                else {
                    // Remove @media selector with content
                    closetag_index = findCloseTagIndex(filecontent, match.index);
                    regex.lastIndex = closetag_index;
                }
            }

            for (i in new_selectors) {
                if (new_selectors.hasOwnProperty(i)) {
                    selector = i;

                    if (options.wrapper_class) {
                        if (selector.match(/^html/)) {
                            selector = selector.substr('html'.length);
                            new_filecontent += 'html.' + options.wrapper_class;
                        }
                        else {
                            new_filecontent += '.' + options.wrapper_class + ' ';
                        }
                    }

                    new_filecontent += selector + '{';

                    for (j in new_selectors[i]) {
                        new_filecontent += j + ':' + new_selectors[i][j].value + ';';
                    }

                    new_filecontent += '}';
                }
            }

            grunt.file.write(dest + '/' + path.basename(filepath), new_filecontent);
        });
    });
};
