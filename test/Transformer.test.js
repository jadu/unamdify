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

var expect = require('chai').expect,
    Transformer = require('../lib/Transformer');

describe('Transformer', function () {
    beforeEach(function () {
        this.transformer = new Transformer();
    });

    describe('transform()', function () {
        describe('when module has a define() call', function () {
            describe('with no dependencies', function () {
                describe('and no export', function () {
                    it('should remove the define', function () {
                        expect(this.transformer.transform('define(function () { finish(); });')).to.equal('finish();');
                    });

                    it('should preserve newlines between statements', function () {
                        expect(this.transformer.transform('define(function () { start();\nfinish(); });')).to.equal('start();\nfinish();');
                    });
                });

                describe('but an export', function () {
                    it('should remove the define and replace export with module.exports', function () {
                        expect(this.transformer.transform('define(function () { return 21; });')).to.equal('module.exports = 21;');
                    });
                });

                describe('but an empty return statement', function () {
                    it('should remove the define but leave the return statement alone', function () {
                        expect(this.transformer.transform('define(function () { return; });')).to.equal('return;');
                    });
                });

                describe('but a return statement inside a sub-function expression of the factory', function () {
                    it('should remove the define but leave the return statement alone', function () {
                        expect(this.transformer.transform('define(function () { (function () { return 21; }()); });')).to.equal('(function () { return 21; }());');
                    });
                });

                describe('but a return statement inside a sub-function declaration of the factory', function () {
                    it('should remove the define but leave the return statement alone', function () {
                        expect(this.transformer.transform('define(function () { function ret() { return 21; } ret(); });')).to.equal('function ret() { return 21; }\nret();');
                    });
                });
            });

            describe('with two dependencies, both imported as args, and an export', function () {
                it('should remove the define and add var declarations calling require()', function () {
                    expect(this.transformer.transform('define(["lib/a", "lib/b"], function (a, b) { return 4; });')).to.equal('var a = require("lib/a"), b = require("lib/b");\nmodule.exports = 4;');
                });

                it('should preserve any "use strict" pragma and keep it as the first statement', function () {
                    expect(this.transformer.transform('define(["lib/a", "lib/b"], function (a, b) { /* An intro comment */ "use strict"; return 4; });')).to.equal('"use strict";\nvar a = require("lib/a"), b = require("lib/b");\nmodule.exports = 4;');
                });
            });

            describe('when there are more dependencies than factory function args', function () {
                it('should remove the define and add var declarations calling require()', function () {
                    expect(this.transformer.transform('define(["lib/a", "lib/b"], function (a) { return 4; });')).to.equal('var a = require("lib/a");\nrequire("lib/b");\nmodule.exports = 4;');
                });
            });

            describe('when there are more factory function args than dependencies', function () {
                it('should remove the define and add var declarations calling require()', function () {
                    expect(this.transformer.transform('define(["lib/a"], function (a, b, c) { return 4; });')).to.equal('var a = require("lib/a"), b, c;\nmodule.exports = 4;');
                });
            });

            describe('when the module uses require() but the factory returns a value', function () {
                it('should remove the define but not modify the return statement', function () {
                    expect(this.transformer.transform('require(["lib/a"], function (a) { return 4; });')).to.equal('var a = require("lib/a");\nreturn 4;');
                });
            });

            describe('when the module uses define() but then has a nested require()', function () {
                it('should process the nested require() dependencies and remove the nested require()', function () {
                    expect(this.transformer.transform('require(["lib/a"], function (a) { before(); require(["lib/b"], function (b) { during(b); }); after(); });')).to.equal('var a = require("lib/a");\nbefore();\nvar b = require("lib/b");\nduring(b);\nafter();');
                });
            });
        });

        describe('When module has no define() or require() calls', function () {
            it('should not modify the source', function () {
                expect(this.transformer.transform('module.exports = 21;')).to.equal('module.exports = 21;');
            });
        });

        describe('When module has an outer function around the define() call', function () {
            it('should not modify the source', function () {
                expect(this.transformer.transform('(function () { module.exports = 21; }());')).to.equal('(function () { module.exports = 21; }());');
            });
        });
    });
});
