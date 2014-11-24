'use strict';
/*jshint unused:false */
/*global $, spa:true */
var spa = (function() {
  var initModule = function($container) {
    spa.shell.initModule($container);
    // $container.html(
      // + '<h1 style="display:inline-block; margin:25px;">'
      // +   'hello world!'
      // + '</h1>'
      // );
  };

  return { initModule: initModule };
}());
