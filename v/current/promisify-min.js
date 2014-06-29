/*!
Copyright (c) 2012, C J Wainwright, http://cjwainwright.co.uk

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
(function(p,g,b){p.exportTo=function(u){for(var t in p){if(p.hasOwnProperty(t)){u[t]=p[t]}}};var h=Array.prototype.slice;if(typeof(Object.create)!=="function"){Object.create=function(u){function t(){}t.prototype=u;return new t()}}function f(u,t){u.prototype=Object.create(t.prototype);u.prototype.constructor=u;u.Parent=t}function l(y){var t=h.call(arguments,1);for(var v=0,w=t.length;v<w;v++){var x=t[v];for(var u in x){if(x.hasOwnProperty(u)){y[u]=x[u]}}}}function q(){this._listeners=[]}l(q.prototype,{add:function(t){this._listeners.push(t)},notify:function(v,t){var w=this._listeners.length;for(var u=0;u<w;u++){this._listeners[u].apply(v,t)}},clear:function(){this._listeners=[]}});function d(){this._map={};this._mapInv={};this._reserved={};this._onCreate=new q();this._onBeforeGet=new q();this._onReserve=new q()}d.prototype._create=function(t,u){this._map[t]=u;this._mapInv[u]=t;this._onCreate.notify(this,[t,u])};d.prototype.get=function(u){this._onBeforeGet.notify(this,[u]);var w=this._map;var t=this._mapInv;if(w.hasOwnProperty(u)){return w[u]}var v=u;while(t.hasOwnProperty(v)||this._reserved.hasOwnProperty(v)){v="$"+v}this._create(u,v);return v};d.prototype.forEach=function(u){var v=this._map;for(var t in v){if(v.hasOwnProperty(t)){u(t,v[t])}}};d.prototype.reserve=function(t){this._reserved[t]=true;this._onReserve.notify(this,[t])};d.prototype.branch=function(){var u=new d();Object.keys(this._reserved).forEach(u.reserve.bind(u));this.forEach(function(v,w){u.reserve(w)});var t=this;u._onBeforeGet.add(function(v){t.get(v)});this._onCreate.add(function(v,w){u.reserve(w)});this._onReserve.add(function(v){u.reserve(v)});return u};d.prototype.scope=function(){var t=new d();Object.keys(this._reserved).forEach(t.reserve.bind(t));this.forEach(function(u,v){t._create(u,v)});return t};p.VarMap=d;var e=function(t,v,w){if(t!=null){var u=n[t.type];if(u){u(t,v,w)}else{v.push("/* unknown type ",t.type," */");b.error("unknown type "+t.type);b.log(t)}}};var i="promise",r=i+".",a=";\n";var k={"!":"not"};var s={"+":"add","*":"mult","==":"eq","!=":"neq","<":"lt","<=":"lteq",">":"gt",">=":"gteq"};var j={"++":"inc","--":"dec"};var m=function(t){switch(t.type){case"Literal":return t.raw;case"Identifier":return t.name}b.error("unknown key type "+t.type)};var n={Program:function(t,u,v){t.body.forEach(function(w){e(w,u,v)})},EmptyStatement:function(t,u,v){u.push(a)},BlockStatement:function(t,u,v){u.push("{\n");t.body.forEach(function(w){e(w,u,v)});u.push("}")},ExpressionStatement:function(t,u,v){e(t.expression,u,v);u.push(a)},ReturnStatement:function(t,u,v){u.push("return ");if(t.argument){e(t.argument,u,v)}else{u.push(r,"unit()")}u.push(a)},Literal:function(t,u,v){u.push(r,"unit(",t.raw,")")},Identifier:function(t,u,v){u.push(v.get(t.name))},VariableDeclaration:function(t,u,v){u.push(t.kind);t.declarations.forEach(function(w,x){u.push(x==0?" ":", ");e(w.id,u,v);if(w.init){u.push(" = ");e(w.init,u,v)}});u.push(a)},AssignmentExpression:function(t,u,v){e(t.left,u,v);u.push(" = ");e(t.right,u,v)},UnaryExpression:function(t,v,w){var u=k[t.operator];if(u!=null){v.push(r,u,"(");e(t.argument,v,w);v.push(")")}else{b.error("unknown unary operator "+t.operator)}},BinaryExpression:function(t,u,v){var w=s[t.operator];if(w!=null){u.push(r,w,"(");e(t.left,u,v);u.push(", ");e(t.right,u,v);u.push(")")}else{b.error("unknown binary operator "+t.operator)}},UpdateExpression:function(t,u,v){var w=j[t.operator];if(w!=null){if(t.prefix){u.push("(");e(t.argument,u,v);u.push(" = ",r,w,"(");e(t.argument,u,v);u.push("))")}else{u.push("(function(){ var $ret = ");e(t.argument,u,v);u.push(";");e(t.argument,u,v);u.push(" = ",r,w,"(");e(t.argument,u,v);u.push("); return $ret;}())")}}else{b.error("unknown update operator "+t.operator)}},ObjectExpression:function(t,u,v){u.push(r,"unit(new ",r,"DynamicObject({");t.properties.forEach(function(x,w){if(w>0){u.push(", ")}if(x.kind=="init"){u.push(m(x.key),": ");e(x.value,u,v)}else{b.error("unknown property kind "+x.kind)}});u.push("}))")},ArrayExpression:function(t,u,v){u.push(r,"unit(new ",r,"DynamicArray([");t.elements.forEach(function(x,w){if(w>0){u.push(", ")}e(x,u,v)});u.push("]))")},MemberExpression:function(t,u,v){u.push(r,"getMember(");e(t.object,u,v);u.push(", ");if(t.computed){e(t.property,u,v)}else{u.push(r,"unit('",t.property.name,"')")}u.push(").val")},IfStatement:function(t,v,w){var u=w.branch();w.forEach(function(z,A){var x=w.get(z);var y=u.get(z);v.push("var ",y," = ",x,", ",x," = new ",r,"Promise()",a)});e(t.test,v,u);v.push(".kept(function(data){\nif(data)");e(t.consequent,v,u);if(t.alternate){v.push("else ");e(t.alternate,v,u)}w.forEach(function(z,A){var x=w.get(z);var y=u.get(z);v.push(y,".bindTo(",x,")",a)});v.push("}).broken(",r,"errorFunc(",r,"error.conditionalBrokenPromise))",a)},WhileStatement:function(t,v,w){var u=w.branch();w.forEach(function(z,A){var x=w.get(z);var y=u.get(z);v.push("var ",y," = ",x,", ",x," = new ",r,"Promise()",a)});v.push("(function loop() {\n");e(t.test,v,u);v.push(".kept(function(data){\nif(data) {");e(t.body,v,u);v.push("loop()",a);v.push("} else {");w.forEach(function(z,A){var x=w.get(z);var y=u.get(z);v.push(y,".bindTo(",x,")",a)});v.push("} ");v.push("}).broken(",r,"errorFunc(",r,"error.conditionalBrokenPromise))",a);v.push("})()",a)},FunctionExpression:function(t,v,w){var u=w.scope();v.push("promise.unit(function ");e(t.id,v,u);v.push("(");t.params.forEach(function(y,x){if(x>0){v.push(", ")}e(y,v,u)});v.push(")");e(t.body,v,u);v.push(")")},CallExpression:function(t,u,v){u.push("(function () {\n","var args = arguments",a);e(t.callee,u,v);u.push(".thenData(function (data) {\n","data.apply(");if(t.callee.type=="MemberExpression"){e(t.callee.object,u,v)}else{u.push("null")}u.push(", args)",a,"})",a);u.push("})(");t.arguments.forEach(function(w,x){if(x>0){u.push(", ")}e(w,u,v)});u.push(")")}};function c(y){var t=g(y.toSource());var v=t.body[0];if(v.type!="FunctionDeclaration"){if(t.body[0].expression&&t.body[0].expression.type=="FunctionExpression"){v=t.body[0].expression}else{throw new Error("Not a function declaration")}}if(v.body.type!="BlockStatement"){throw new Error("Function doesn't contain block statement")}var z=v.params;var u=z.map(function(A){return A.name});var w=[];var x=new d();x.reserve(i);u.forEach(x.get.bind(x));v.body.body.forEach(function(A){e(A,w,x)});u.push(w.join(""));return Function.apply(null,u)}function o(u){var v=[];var w=new d();w.reserve(i);var t=g(u,v);e(t,v,w);return v.join("")}p.map=o;p.compile=c})(typeof exports==="undefined"?(promisify={}):exports,typeof esprima==="undefined"?function(){throw new Error("No parsing library available")}:esprima.parse,console||{error:function(){}});