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

var _ = require('lodash'),
    falafel = require('falafel'),
    isDefine = function (node) {
        var parent;

        if (
            node.type !== 'CallExpression' ||
            node.callee.type !== 'Identifier' ||
            node.callee.name !== 'define'
        ) {
            return false;
        }

        // Otherwise walk up the tree and check there are no parent functions
        parent = node.parent;

        while (parent) {
            if (/^Function/.test(parent.type)) {
                return false;
            }

            parent = parent.parent;
        }

        return true;
    },
    isRequire = function (node) {
        return node.type === 'CallExpression' &&
            node.callee.type === 'Identifier' &&
            node.callee.name === 'require';
    };

function Transformer() {

}

_.extend(Transformer.prototype, {
    transform: function (code) {
        function isAMDExport(node) {
            var parent = node.parent;

            while (parent) {
                if (parent.type === 'FunctionExpression') {
                    if (isDefine(parent.parent)) {
                        return true;
                    }

                    return false;
                } else if (parent.type === 'FunctionDeclaration') {
                    return false;
                }

                parent = parent.parent;
            }

            return false;
        }

        function isStrictPragma(node) {
            return node.type === 'ExpressionStatement' &&
                node.expression.type === 'Literal' &&
                node.expression.value === 'use strict';
        }

        function transformFactory(node, dependencies) {
            var index,
                result,
                statements = [],
                vars = [];

            if (node.params.length > 0) {
                _.each(node.params, function (param, index) {
                    var declarator = param.source();

                    if (index < dependencies.length) {
                        declarator += ' = require(' + dependencies[index].source() + ')';
                    }

                    vars.push(declarator);
                });

                statements.push('var ' + vars.join(', ') + ';');
            }

            if (dependencies.length > node.params.length) {
                for (index = node.params.length; index < dependencies.length; index++) {
                    statements.push('require(' + dependencies[index].source() + ');');
                }
            }

            _.each(node.body.body, function (statement) {
                var source = statement.source();

                if (isStrictPragma(statement)) {
                    statements.unshift(source);
                } else {
                    statements.push(source);
                }
            });

            result = statements.join('\n');

            result = '(function () {' + result + '}())';

            return result;
        }

        return falafel(code, function (node) {
            if (isDefine(node) || isRequire(node)) {
                if (node.arguments[0].type.substr(0, 8) === 'Function') {
                    node.update(transformFactory(node.arguments[0], []));
                } else if (node.arguments[0].type === 'ArrayExpression' && node.arguments[1].type.substr(0, 8) === 'Function') {
                    node.update(transformFactory(node.arguments[1], node.arguments[0].elements));
                }
            } else if (node.type === 'ReturnStatement' && node.argument && isAMDExport(node)) {
                node.update('module.exports = ' + node.argument.source() + ';');
            }
        }).toString();
    }
});

module.exports = Transformer;
