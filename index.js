/**
 * UnAMDify
 *
 * Browserify transform that rewrites AMD modules to be CommonJS compliant.
 *
 * Copyright 2015 Jadu
 *
 * Released under the MIT license
 * https://github.com/jadu/unamdify/blob/master/LICENSE.txt
 */

'use strict';

var through = require('through'),
    Transformer = require('./lib/Transformer');

module.exports = function () {
    function write(buffer) {
        code += buffer;
    }

    function end() {
        try {
            code = transformer.transform(code);
        } catch (error) {
            stream.emit('error', error);
            return;
        }

        stream.queue(code);
        stream.queue(null);
    }

    var code = '',
        stream = through(write, end),
        transformer = new Transformer();

    return stream;
};
