/** 
 * Plugin is a function that gets a set of
 * predefined arguments (annotation, settings,
 * callbacks to call on user actions) and
 * returns a DOM element.
 */
var HelloWorldPlugin = function(args) {

  this.annotation = args.annotation;
  this.readOnly = args.readOnly;

  this.onAppendBody = args.onAppendBody;
  this.onUpdateBody = args.onUpdateBody;
  this.onDeleteBody = args.onDeleteBody;

  var div = document.createElement('div');
  div.className = 'helloworld-plugin';
  div.innerHTML = 'Hello World';

  return div;
}
