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
(function(O){O.exportTo=function(T){for(var S in O){if(O.hasOwnProperty(S)){T[S]=O[S]}}};var p=Array.prototype.slice;if(typeof(Object.create)!=="function"){Object.create=function(T){function S(){}S.prototype=T;return new S()}}function a(T,S){T.prototype=Object.create(S.prototype);T.prototype.constructor=T;T.Parent=S}function n(X){var S=p.call(arguments,1);for(var U=0,V=S.length;U<V;U++){var W=S[U];for(var T in W){if(W.hasOwnProperty(T)){X[T]=W[T]}}}}function H(){this._listeners=[]}n(H.prototype,{add:function(S){this._listeners.push(S)},notify:function(U,S){var V=this._listeners.length;for(var T=0;T<V;T++){this._listeners[T].apply(U,S)}},clear:function(){this._listeners=[]}});var f="waiting",x="kept",w="broken";function E(){this.state=f;this.data;this._onkept=new H();this._onbroken=new H()}n(E.prototype,{kept:function(S){if(this.state==f){this._onkept.add(S)}else{if(this.state==x){S(this.data)}}return this},broken:function(S){if(this.state==f){this._onbroken.add(S)}else{if(this.state==w){S()}}return this},setBroken:function(){if(this.state!=f){throw new Error("Attempting to break a resolved promise")}this.state=w;this._onbroken.notify(this);this._onkept.clear();this._onbroken.clear()},setData:function(S){if(this.state!=f){throw new Error("Attempting to keep a resolved promise")}this.data=S;this.state=x;this._onkept.notify(this,[this.data]);this._onkept.clear();this._onbroken.clear()},bindTo:function(S){this.kept(function(T){S.setData(T)}).broken(function(){S.setBroken()})},then:function(T){var S=new E();this.kept(function(U){T(U).bindTo(S)}).broken(function(){S.setBroken()});return S},thenData:function(T){var S=new E();this.kept(function(U){S.setData(T(U))}).broken(function(){S.setBroken()});return S}});function M(S){var T=new E();T.setData(S);return T}function s(T){var S=new E();function V(){if(S.state!=f){return}var Z=true;for(var X=0;X<T.length;X++){if(T[X].state!=x){Z=false;break}}if(Z){var aa=[];for(var Y=0;Y<T.length;Y++){aa[Y]=T[Y].data}S.setData(aa)}}function W(){if(S.state!=f){return}S.setBroken()}if(T.length>0){for(var U=0;U<T.length;U++){T[U].kept(V).broken(W)}}else{V()}return S}function v(S){return function(){return s(arguments).thenData(function(T){return S.apply(null,T)})}}O.Promise=E;O.unit=M;O.fmap=v;function m(S){this.current=S}n(m.prototype,{assign:function(S){return this.current=S},assignPostfix:function(T){var S=this.current;this.current=T;return S}});O.Variable=m;function b(){this._queue=[]}n(b.prototype,{get:function(T){var S=new E();var U=this;this._enqueue(function(){var V=U._currentsCopy();T.kept(function(W){if(V[W]==null){S.setData(V[W])}else{V[W].bindTo(S)}}).broken(function(){S.setBroken()});U._dequeue()});return S},set:function(S,U){var T=this;this._enqueue(function(){S.kept(function(V){T.currents[V]=U;T._dequeue()}).broken(function(){throw new Error("Can't use broken promise as array index")})});return U},"delete":function(S,U){var T=this;this._enqueue(function(){S.kept(function(V){delete T.currents[V];T._dequeue()}).broken(function(){throw new Error("Can't use broken promise as array index")})});return U},_currentsCopy:function(){},_enqueue:function(S){this._queue.push(S);if(this._queue.length==1){this._queue[0]()}},_dequeue:function(){if(this._queue.length==0){throw new Error("Nothing to dequeue")}else{this._queue.shift();if(this._queue.length>0){this._queue[0]()}}}});function Q(U,T){var S=new E();U.kept(function(V){V.get(T).bindTo(S)}).broken(function(){S.setBroken()});return S}function y(U,S,T){U.kept(function(V){V.set(S,T)}).broken(function(){throw new Error("Trying to set a value on a broken promise")});return T}O.get=Q;O.set=y;function u(){u.Parent.call(this);this.currents=[]}a(u,b);n(u.prototype,{_currentsCopy:function(){return this.currents.slice()},length:function(){var S=new E();var T=this;this._enqueue(function(){S.setData(T.currents.length);T._dequeue()});return S}});function r(T){var S=new E();T.kept(function(U){U.length().bindTo(S)}).broken(function(){S.setBroken()});return S}O.DynamicArray=u;O.length=r;function j(){j.Parent.call(this);this.currents={}}a(j,b);n(j.prototype,{_currentsCopy:function(){var T={};for(var S in this.currents){T[S]=this.currents[S]}return T}});O.DynamicObject=j;var P=v(function(T,S){return T==S});var g=v(function(T,S){return T!=S});var A=v(function(T,S){return T<S});var J=v(function(T,S){return T<=S});var i=v(function(T,S){return T>S});var F=v(function(T,S){return T>=S});O.eq=P;O.neq=g;O.lt=A;O.lteq=J;O.gt=i;O.gteq=F;var e=v(function(){var S=arguments[0];for(var T=1;T<arguments.length;T++){S+=arguments[T]}return S});var G=v(function(){var S=arguments[0];for(var T=1;T<arguments.length;T++){S*=arguments[T]}return S});O.add=e;O.mult=G;var N=v(function(S){return !S});var R=v(function(S){return ++S});var t=v(function(S){return --S});O.not=N;O.inc=R;O.dec=t;function K(Z,X,W,S){var U=[];var V;for(var Y=0;Y<S.length;Y++){V=U[Y]=[];for(var T=0;T<X.length;T++){V[T]=new m(X[T].current)}S[Y].apply(null,V)}for(var T=0;T<X.length;T++){X[T].assign(new E())}Z.kept(function(ab){V=U[W(ab)];for(var aa=0;aa<X.length;aa++){V[aa].current.bindTo(X[aa].current)}}).broken(function(){throw new Error("Can't use broken promise as predicate")})}function k(S,V,T,U){K(S,V,function(W){return W?1:0},[U,T])}function C(S,U,T){K(S,U,function(V){return V?1:0},[function(){},T])}function z(Z,W,V,X){var S=[];var T={};var Y=0;S[Y++]=X;for(var U in V){T[U]=Y;S[Y++]=V[U]}K(Z,W,function(aa){return T[aa]},S)}function I(X,W,V,S){var U=[];for(var T=0;T<W.length;T++){U[T]=new m(W[T].current);W[T].assign(new E())}X.kept(function(Z){S[V(Z)].apply(null,U);for(var Y=0;Y<W.length;Y++){U[Y].current.bindTo(W[Y].current)}}).broken(function(){throw new Error("Can't use broken promise as predicate")})}function q(S,V,T,U){I(S,V,function(W){return W?1:0},[U,T])}function o(S,U,T){I(S,U,function(V){return V?1:0},[function(){},T])}function d(Z,W,V,X){var S=[];var T={};var Y=0;S[Y++]=X;for(var U in V){T[U]=Y;S[Y++]=V[U]}I(Z,W,function(aa){return T[aa]},S)}O.ifelseNow=k;O.ifNow=C;O.switchNow=z;O.ifelseLater=q;O.ifLater=o;O.switchLater=d;function l(W,ac,ab,T){var X,S=0;var U=[],aa=[],V=[],Z=[];for(X=0;X<W.length;X++){aa[X]=new m(W[X].current);W[X].assign(new E());W[X].allVarsIndex=S;V[S]=W[X];Z[S]=aa[X];S+=1}for(X=0;X<ab.length;X++){if("allVarsIndex" in ab[X]){U[X]=Z[ab[X].allVarsIndex]}else{U[X]=new m(ab[X].current);ab[X].assign(new E());V[S]=ab[X];Z[S]=U[X];S+=1}}for(X=0;X<W.length;X++){delete W[X].allVarsIndex}function Y(){var ad=ac.apply(null,aa);ad.kept(function(ag){if(ag){var af=T.apply(null,U);if(af==null){Y()}else{af.kept(function(ai){if(!ai){Y()}else{for(var ah=0;ah<V.length;ah++){Z[ah].current.bindTo(V[ah].current)}}}).broken(function(){throw new Error("Broken promise in loop break")})}}else{for(var ae=0;ae<V.length;ae++){Z[ae].current.bindTo(V[ae].current)}}}).broken(function(){throw new Error("Broken promise in a loop condition")})}Y()}O.loopWhile=l;function L(S){var T=new E();T.setData(S);return T}function B(){var S=new E();S.setBroken();return S}function D(T,S){var U=new E();setTimeout(function(){U.setData(T)},S);return U}function h(S){var T=new E();setTimeout(function(){T.setBroken()},S);return T}function c(V,Z){var T=new E();var Y=document.createElement("DIV");var S=document.createElement("INPUT");S.type="text";Y.appendChild(S);var U=document.createElement("BUTTON");U.appendChild(document.createTextNode(">"));Y.appendChild(U);var X=document.createTextNode("...");V.kept(function(aa){X.data=aa}).broken(function(){X.data="!!"});Y.appendChild(X);document.body.appendChild(Y);S.focus();U.addEventListener("click",function W(){T.setData(Z?Z(S.value):S.value);S.disabled=true;U.disabled=true;U.removeEventListener("click",W)});return T}O.nowData=L;O.nowBreak=B;O.laterData=D;O.laterBreak=h;O.inputData=c})(typeof exports==="undefined"?(promise={}):exports);