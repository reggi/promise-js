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
(function(G){G.exportTo=function(L){for(var K in G){if(G.hasOwnProperty(K)){L[K]=G[K]}}};var k=Array.prototype.slice;if(typeof(Object.create)!=="function"){Object.create=function(L){function K(){}K.prototype=L;return new K()}}function a(L,K){L.prototype=Object.create(K.prototype);L.prototype.constructor=L;L.Parent=K}function j(P){var K=k.call(arguments,1);for(var M=0,N=K.length;M<N;M++){var O=K[M];for(var L in O){if(O.hasOwnProperty(L)){P[L]=O[L]}}}}function w(K){return function(){throw new Error(K)}}G.errorFunc=w;function B(){this._listeners=[]}j(B.prototype,{add:function(K){this._listeners.push(K)},notify:function(M,K){var N=this._listeners.length;for(var L=0;L<N;L++){this._listeners[L].apply(M,K)}},clear:function(){this._listeners=[]}});var e="waiting",s="kept",r="broken";function y(){this.state=e;this.data;this._onkept=new B();this._onbroken=new B()}j(y.prototype,{kept:function(K){if(this.state==e){this._onkept.add(K)}else{if(this.state==s){K(this.data)}}return this},broken:function(K){if(this.state==e){this._onbroken.add(K)}else{if(this.state==r){K()}}return this},setBroken:function(){if(this.state!=e){throw new Error("Attempting to break a resolved promise")}this.state=r;this._onbroken.notify(this);this._onkept.clear();this._onbroken.clear()},setData:function(K){if(this.state!=e){throw new Error("Attempting to keep a resolved promise")}this.data=K;this.state=s;this._onkept.notify(this,[this.data]);this._onkept.clear();this._onbroken.clear()},bindTo:function(K){this.kept(function(L){K.setData(L)}).broken(function(){K.setBroken()})},then:function(L){var K=new y();this.kept(function(M){L(M).bindTo(K)}).broken(function(){K.setBroken()});return K},thenData:function(L){var K=new y();this.kept(function(M){K.setData(L(M))}).broken(function(){K.setBroken()});return K}});function E(K){var L=new y();L.setData(K);return L}function m(L){var K=new y();function N(){if(K.state!=e){return}var R=true;for(var P=0;P<L.length;P++){if(L[P].state!=s){R=false;break}}if(R){var S=[];for(var Q=0;Q<L.length;Q++){S[Q]=L[Q].data}K.setData(S)}}function O(){if(K.state!=e){return}K.setBroken()}if(L.length>0){for(var M=0;M<L.length;M++){L[M].kept(N).broken(O)}}else{N()}return K}function q(K){return function(){return m(arguments).thenData(function(L){return K.apply(null,L)})}}G.Promise=y;G.unit=E;G.fmap=q;function b(){this._queue=[]}j(b.prototype,{get:function(L){var K=new y();var M=this;this._enqueue(function(){var N=M._currentsCopy();L.kept(function(O){if(N[O]==null){K.setData(N[O])}else{N[O].bindTo(K)}}).broken(function(){K.setBroken()});M._dequeue()});return K},set:function(K,M){var L=this;this._enqueue(function(){K.kept(function(N){L.currents[N]=M;L._dequeue()}).broken(function(){throw new Error("Can't use broken promise as array index")})});return M},"delete":function(K,M){var L=this;this._enqueue(function(){K.kept(function(N){delete L.currents[N];L._dequeue()}).broken(function(){throw new Error("Can't use broken promise as array index")})});return M},_currentsCopy:function(){},_enqueue:function(K){this._queue.push(K);if(this._queue.length==1){this._queue[0]()}},_dequeue:function(){if(this._queue.length==0){throw new Error("Nothing to dequeue")}else{this._queue.shift();if(this._queue.length>0){this._queue[0]()}}}});function I(M,L){var K=new y();M.kept(function(N){N.get(L).bindTo(K)}).broken(function(){K.setBroken()});return K}function t(M,K,L){M.kept(function(N){N.set(K,L)}).broken(function(){throw new Error("Trying to set a value on a broken promise")});return L}function n(L,K){var M={get valfunction(){var N=new y();L.kept(function(O){O.get(K).bindTo(N)}).broken(function(){N.setBroken()});return N},set valfunction(O){var N=new y();L.kept(function(P){P.set(K,O).bindTo(N)}).broken(function(){N.setBroken()});return N}};return M}G.getMember=n;G.get=I;G.set=t;function p(K){p.Parent.call(this);this.currents=K||[]}a(p,b);j(p.prototype,{_currentsCopy:function(){return this.currents.slice()},length:function(){var K=new y();var L=this;this._enqueue(function(){K.setData(L.currents.length);L._dequeue()});return K}});function l(L){var K=new y();L.kept(function(M){M.length().bindTo(K)}).broken(function(){K.setBroken()});return K}G.DynamicArray=p;G.length=l;function i(K){i.Parent.call(this);this.currents=K||{}}a(i,b);j(i.prototype,{_currentsCopy:function(){var L={};for(var K in this.currents){L[K]=this.currents[K]}return L}});G.DynamicObject=i;var H=q(function(L,K){return L==K});var f=q(function(L,K){return L!=K});var u=q(function(L,K){return L<K});var C=q(function(L,K){return L<=K});var g=q(function(L,K){return L>K});var z=q(function(L,K){return L>=K});G.eq=H;G.neq=f;G.lt=u;G.lteq=C;G.gt=g;G.gteq=z;var d=q(function(){var K=arguments[0];for(var L=1;L<arguments.length;L++){K+=arguments[L]}return K});var A=q(function(){var K=arguments[0];for(var L=1;L<arguments.length;L++){K*=arguments[L]}return K});G.add=d;G.mult=A;var F=q(function(K){return !K});var J=q(function(K){return ++K});var o=q(function(K){return --K});G.not=F;G.inc=J;G.dec=o;function D(K){var L=new y();L.setData(K);return L}function v(){var K=new y();K.setBroken();return K}function x(L,K){var M=new y();setTimeout(function(){M.setData(L)},K);return M}function h(K){var L=new y();setTimeout(function(){L.setBroken()},K);return L}function c(N,R){var L=new y();var Q=document.createElement("DIV");var K=document.createElement("INPUT");K.type="text";Q.appendChild(K);var M=document.createElement("BUTTON");M.appendChild(document.createTextNode(">"));Q.appendChild(M);var P=document.createTextNode("...");N.kept(function(S){P.data=S}).broken(function(){P.data="!!"});Q.appendChild(P);document.body.appendChild(Q);K.focus();M.addEventListener("click",function O(){L.setData(R?R(K.value):K.value);K.disabled=true;M.disabled=true;M.removeEventListener("click",O)});return L}G.nowData=D;G.nowBreak=v;G.laterData=x;G.laterBreak=h;G.inputData=c})(typeof exports==="undefined"?(promise={}):exports);