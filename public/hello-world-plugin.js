/** 
 * Plugin is a function that gets a set of
 * predefined arguments (annotation, settings,
 * callbacks to call on user actions) and
 * returns a DOM element.
 */
var HelloWorldPlugin = function(args) {

  var addTag = function(evt) {
    
    const tag = evt.target.dataset.tag;

    args.onAppendBody({
      type: 'TextualBody',
      purpose: 'highlighting',
      value: tag
    });
  }

  var createButton = function(value) {
    var outline = document.createElement('div');
    outline.className = 'button-outline';

    var button = document.createElement('button');
    button.dataset.tag = value;
    button.style.backgroundColor = value;
    button.addEventListener('click', addTag); 
    
    outline.appendChild(button);
    return outline;
  }

  var container = document.createElement('div');
  container.className = 'helloworld-plugin';
  
  var button1 = createButton('RED');
  var button2 = createButton('GREEN');
  var button3 = createButton('BLUE');

  container.appendChild(button1);
  container.appendChild(button2);
  container.appendChild(button3);

  return container;
}
