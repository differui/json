var CHAR_DOUBLE_QUOTE       = 34;  // "
var CHAR_COMMA              = 44;  // ,
var CHAR_COLON              = 58;  // :
var CHAR_BACKSLASH          = 92;  // \
var CHAR_LEFT_CURLY_PAREN   = 123; // {
var CHAR_RIGHT_CURLY_PAREN  = 125; // }
var CHAR_LEFT_SQUARE_PAREN  = 91;  // [
var CHAR_RIGHT_SQUARE_PAREN = 93;  // ]

var letterRe = /[a-z]/i;
var numberLeadingRe = /[-0-9]/;
var numberRe = /[-0-9.e]/;
var spaceRe = /\s/;

function tokenize(input) {
    var current = 0;
    var tokens = [];
    var len = input.length;
    var string = '';
    var keyword = '';
    var number = '';
    var inDouble = false;
    var inNumber = false;
    var inKeyword = false;
    var backTokenType = '';
    var backTwiceTokenType = '';

    function peekBackToken(size) {
        var len = tokens.length;

        return (size ? tokens[len - size] : tokens[len - 1]) || {};
    }

    function peekBackCharCode(size) {
        var char = (size ? input[current - size] : input[len - 1]) || '';

        return char.charCodeAt(0);
    }

    function isEscaped() {
        return peekBackCharCode(1) === CHAR_BACKSLASH;
    }

    function isStringLiteral() {
        var backTwiceTokenType = peekBackToken(2).type;

        return [
            'colon',
            'comma',
            'left_square_paren'
        ].indexOf(backTwiceTokenType) > -1;
    }

    while (current < input.length) {
        var char = input[current];

        switch (char.charCodeAt(0)) {
            case CHAR_LEFT_CURLY_PAREN:
                tokens.push({
                    type: 'left_curly_paren',
                    value: '{'
                });
                break;

            case CHAR_RIGHT_CURLY_PAREN:
                tokens.push({
                    type: 'right_curly_paren',
                    value: '}'
                });
                break;

            case CHAR_LEFT_SQUARE_PAREN:
                tokens.push({
                    type: 'left_square_paren',
                    value: '['
                });
                break;

            case CHAR_RIGHT_SQUARE_PAREN:
                tokens.push({
                    type: 'right_square_paren',
                    value: ']'
                });
                break;

            case CHAR_DOUBLE_QUOTE:
                if (isEscaped()) {
                    string += char;
                    break;
                }

                inDouble = !inDouble;

                if (inDouble) {
                    tokens.push({
                        type: 'double_quote',
                        value: '"'
                    });
                } else {
                    tokens.push({
                        type: isStringLiteral() ? 'string_literal' : 'identifier',
                        value: string
                    });
                    tokens.push({
                        type: 'double_quote',
                        value: '"'
                    });
                    string = ''; // reset string
                }
                break;

            case CHAR_COLON:
                tokens.push({
                    type: 'colon',
                    value: ':'
                });
                break;

            case CHAR_COMMA:
                tokens.push({
                    type: 'comma',
                    value: ','
                });
                break;

            default:
                if (inDouble) {
                    string += char;
                    break;
                }

                if (numberLeadingRe.test(char)) {
                    number = char;

                    while (numberRe.test(char = input[++current])) {
                        number += char;
                    }

                    tokens.push({
                        type: 'number_literal',
                        value: number
                    });
                } else if (letterRe.test(char)) {
                    keyword = char;

                    while (letterRe.test(char = input[++current])) {
                        keyword += char;
                    }

                    if (keyword === 'true' || keyword === 'false') {
                        token = {
                            type: 'boolean_literal',
                            value: keyword
                        };
                    } else if (keyword === 'null') {
                        token = {
                            type: 'null_literal',
                            value: keyword
                        };
                    } else {
                        throw new Error(keyword);
                    }

                    tokens.push(token);
                } else if (spaceRe.test(char)) {
                    current++;
                } else {
                    throw new Error('Unexpected token: ' + char);
                }

                continue;
        }

        current++;
    }

    return tokens;
}

function parse(tokens) {
    var current = 0;

    function peekBackToken(size) {
        return (size ? tokens[current - size] : tokens[current]) || {};
    }

    function peekForwardToken(size) {
        return peekBackToken(size * -1);
    }

    function walk() {
        var token = tokens[current];

        switch (token.type) {
            case 'left_curly_paren':
                var properties = [];

                do {
                    current++;
                    properties.push(walk());
                    token = tokens[current];
                } while (token.type === 'comma');

                if (token.type === 'right_curly_paren') {
                    current++; // skip right curly paren
                }

                return {
                    type: 'ObjectExpression',
                    properties: properties
                };

            case 'left_square_paren':
                var elements = [];

                do {
                    current++;
                    elements.push(walk());
                    token = tokens[current];
                } while (token.type === 'comma');

                if (token.type === 'right_square_paren') {
                    current++; // skip right sqaure paren
                }

                return {
                    type: 'ArrayExpression',
                    elements: elements
                };

            case 'double_quote':
                current++;

                var key, value;
                var forwardTwiceTokenType = peekForwardToken(2).type;

                if (forwardTwiceTokenType === 'colon') {
                    key = walk();
                    current++; // skip colon
                    value = walk();

                    return {
                        type: 'Property',
                        body: {
                            key: key,
                            value: value
                        }
                    };
                } else {
                    return walk();
                }

            case 'identifier':
                var forwardTokenType = peekForwardToken(1).type;

                if (forwardTokenType === 'double_quote') {
                    current += 2; // skip double quote
                }

                return {
                    type: 'Identifier',
                    value: token.value
                };

            case 'string_literal':
                var forwardTokenType = peekForwardToken(1).type;

                if (forwardTokenType === 'double_quote') {
                    current += 2; // skip double quote
                }

                return {
                    type: 'StringLiteral',
                    value: token.value
                };

            case 'number_literal':
                current += 1;

                return {
                    type: 'NumberLiteral',
                    value: token.value
                };

            case 'boolean_literal':
                current += 1;

                return {
                    type: 'BooleanLiteral',
                    value: token.value === 'true' ? true : false
                };

            case 'null_literal':
                current += 1;

                return {
                    type: 'NullLiteral',
                    value: null
                };

            default:
                throw new Error('Syntax Error:' + JSON.stringify(token, null, 4));
        }

        current++;
    }

    var ast = walk();

    return ast;
}

function traverse(node, visitors) {
    function visit(node) {
        var visitor = visitors[node.type];

        switch (node.type) {
            case 'ObjectExpression':
                node.properties.forEach(visit);
                break;

            case 'ArrayExpression':
                node.items.forEach(visit);
                break;

            default:
                visitor(node);
        }
    }

    visit(node);
}

function generator(node) {
    var result = null;

    switch (node.type) {
        case 'ObjectExpression':
            result = {};
            node.properties.forEach(function (property) {
                result[property.body.key.value] = generator(property);
            });
            break;

        case 'ArrayExpression':
            result = [];
            node.elements.forEach(function (element) {
                result.push(generator(element));
            });
            break;

        default:
            if (node.value !== undefined) {
                result = node.value;
            } else {
                result = generator(node.body.value);
            }
    }

    return result;
}

function compiler(source) {
    var tokens = tokenize(source);
    var ast = parse(tokens);
    var result = generator(ast);

    return result;
}

var json = {
    parse: compiler
};
