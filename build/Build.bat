preprocessor.exe ..\js\_assembly.js ..\v\current\promise.js
java -jar yuicompressor-2.4.7.jar --charset utf-8 -v -o ..\v\current\promise-min.js ..\v\current\promise.js
