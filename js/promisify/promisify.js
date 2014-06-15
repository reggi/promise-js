function VarMap() {
    this._map = {};
    this._mapInv = {};
    this._reserved = {};
}

VarMap.prototype._create = function (key, value) {
    this._map[key] = value;
    this._mapInv[value] = key;
};

VarMap.prototype.get = function (key) {
    var map = this._map;
    var mapInv = this._mapInv;
    
    if(map.hasOwnProperty(key)) {
        return map[key];
    }
    
    var value = key;
    while(mapInv.hasOwnProperty(value) || this._reserved.hasOwnProperty(value)) {
        value = '$' + value;
    }
    
    this._create(key, value);
    return value;
};

VarMap.prototype.forEach = function (fn) {
    var map = this._map;
    for (var key in map) {
        if(map.hasOwnProperty(key)) {
            fn(key, map[key]);
        }
    }
};

VarMap.prototype.reserve = function (key) {
    this._reserved[key] = true;
};

VarMap.prototype.stepIn = function () {
    // redefine variables to new, non-clashing values
    var map = new VarMap();
    
    // copy across all reserved values (note this allows multiple stepIns require new values to not clash with all previous levels)
    Object.keys(this._reserved).forEach(map.reserve.bind(map));
    
    // copy all mapped variable values to reserved values
    this.forEach(function (key, value) {
        map.reserve(value);
    });
    
    // TODO - need way for newly created variables in new map to create variable in source map (and thus reserved value in this map)
    
    return map;
};

// TODO - need to handle function scope

var process = function(ast, code, varMap) {
    if(ast != null) {
        var processor = processors[ast.type];
        if(processor) {
            processor(ast, code, varMap);
        } else {
            code.push('/* unknown type ', ast.type, ' */')
            log.error("unknown type " + ast.type);
        }
    }
};

var nsName = 'promise',
    ns = nsName + '.',
    terminator = ';\n'

var unaries = {
    '!': 'not'
};

var binaries = {
    '+': 'add',
    '*': 'mult',
    '==': 'eq',
    '!=': 'neq',
    '<': 'lt',
    '<=': 'lteq',
    '>': 'gt',
    '>=': 'gteq'
};

var updaters = {
    '++': 'inc',
    '--': 'dec'
};

var _getKey = function(ast) {
    switch(ast.type) {
        case 'Literal': return ast.raw;
        case 'Identifier': return ast.name;
    }
    log.error("unknown key type " + ast.type);
}

var processors = {
    Program: function (ast, code, varMap) {
        ast.body.forEach(function (stmt) {
            process(stmt, code, varMap);
        });
    },
    EmptyStatement: function (ast, code, varMap) {
        code.push(terminator);
    },
    BlockStatement: function (ast, code, varMap) {
        code.push('{\n');
        ast.body.forEach(function (stmt) {
            process(stmt, code, varMap);
        });
        code.push('}');
    },
    ExpressionStatement: function (ast, code, varMap) {
        process(ast.expression, code, varMap);
        code.push(terminator);
    },
    ReturnStatement: function (ast, code, varMap) {
        code.push('return ');
        if(ast.argument) {
            process(ast.argument, code, varMap);
        } else {
            code.push(ns, 'unit()')
        }
        code.push(terminator);
    },
    Literal: function (ast, code, varMap) {
        code.push(ns, 'unit(', ast.raw, ')');
    },
    Identifier: function (ast, code, varMap) {
        code.push(varMap.get(ast.name));
    },
    VariableDeclaration: function (ast, code, varMap) {
        code.push(ast.kind);
        ast.declarations.forEach(function (decl, index) {
            code.push(index == 0 ? ' ' : ', ');
            process(decl.id, code, varMap);
            if(decl.init) {
                code.push(' = ');
                process(decl.init, code, varMap);
            }
        });
        code.push(terminator);
    },
    AssignmentExpression: function (ast, code, varMap) {
        process(ast.left, code, varMap);
        code.push(' = ');
        process(ast.right, code, varMap);
    },
    UnaryExpression: function (ast, code, varMap) {
        var unary = unaries[ast.operator];
        if(unary != null) {
            code.push(ns, unary, '(');
            process(ast.argument, code, varMap);
            code.push(')');
        } else {
            log.error("unknown unary operator " + ast.operator);
        }
    },
    BinaryExpression: function (ast, code, varMap) {
        var binary = binaries[ast.operator];
        if(binary != null) {
            code.push(ns, binary, '(');
            process(ast.left, code, varMap);
            code.push(', ');
            process(ast.right, code, varMap);
            code.push(')');
        } else {
            log.error("unknown binary operator " + ast.operator);
        }
    },
    UpdateExpression: function (ast, code, varMap) {
        var update = updaters[ast.operator];
        if(update != null) {
            if(ast.prefix) {
                code.push('(');
                process(ast.argument, code, varMap);
                code.push(' = ', ns, update, '(');
                process(ast.argument, code, varMap);
                code.push('))');
            } else {
                code.push('(function(){ var $ret = ');
                process(ast.argument, code, varMap);
                code.push(';');
                process(ast.argument, code, varMap);
                code.push(' = ', ns, update, '(');
                process(ast.argument, code, varMap);
                code.push('); return $ret;}())');                
            }
        } else {
            log.error("unknown update operator " + ast.operator);
        }
    },
    ObjectExpression: function (ast, code, varMap) {
        code.push(ns, 'unit(new ', ns, 'DynamicObject({');
        ast.properties.forEach(function (property, index) {
            if(index > 0) {
                code.push(', ');
            }
            
            if(property.kind == 'init') {
                code.push(_getKey(property.key), ': ');
                process(property.value, code, varMap);
            } else {
                log.error("unknown property kind " + property.kind);
            }
        });
        code.push('}))');
    },
    ArrayExpression: function (ast, code, varMap) {
        code.push(ns, 'unit(new ', ns, 'DynamicArray([');
        ast.elements.forEach(function (element, index) {
            if(index > 0) {
                code.push(', ');
            }
            process(element, code, varMap);
        });
        code.push(']))');
    },
    MemberExpression: function (ast, code, varMap) {
        code.push(ns, 'getMember(');
        process(ast.object, code, varMap);
        code.push(', ');
        if (ast.computed) {
            process(ast.property, code, varMap);
        } else {
            code.push(ns, 'unit(\'', ast.property.name, '\')');
        }
        code.push(').val');
    },
    IfStatement: function (ast, code, varMap) {
    
        var nestedMap = varMap.stepIn();
    
        varMap.forEach(function (key, value) {
            var name = varMap.get(key);
            var alias = nestedMap.get(key);
            code.push('var ', alias, ' = ', name, ', ', name, ' = new ', ns, 'Promise()', terminator);
        });
    
        process(ast.test, code, nestedMap);
        code.push('.kept(function(data){\nif(data)');
        process(ast.consequent, code, nestedMap);
        if(ast.alternate) {
            code.push('else ');
            process(ast.alternate, code, nestedMap);
        }
        
        varMap.forEach(function (key, value) {
            var name = varMap.get(key);
            var alias = nestedMap.get(key);
            code.push(alias, '.bindTo(', name, ')', terminator);
        });
     
        code.push('}).broken(', ns, 'errorFunc("Can\'t use broken promise as predicate"))', terminator);
    }
}

function compile(f) {
    var ast = parse(f.toSource());
    
    var functionDecl = ast.body[0];
    if(functionDecl.type != 'FunctionDeclaration') {
        if(ast.body[0].expression && ast.body[0].expression.type == 'FunctionExpression') {
            functionDecl = ast.body[0].expression;
        } else {
            throw new Error("Not a function declaration");
        }
    }
    
    if(functionDecl.body.type != 'BlockStatement') {
        throw new Error("Function doesn't contain block statement");
    }
    
    var params = functionDecl.params;
    var args = params.map(function (param) { return param.name; } );
    
    var code = [];
    var varMap = new VarMap();
    varMap.reserve(nsName);
    args.forEach(varMap.get.bind(varMap));

    // process each statement inside the function body to avoid duplicate block statement inside resulting function
    functionDecl.body.body.forEach(function (stmt) {
        process(stmt, code, varMap);
    });

    args.push(code.join(''));
    
    return Function.apply(null, args);
}

function map(input) {
    var code = [];
    var varMap = new VarMap();
    varMap.reserve(nsName);

    var ast = parse(input, code);
    
    process(ast, code, varMap);
    
    return code.join('');
}

exports.map = map;
exports.compile = compile;