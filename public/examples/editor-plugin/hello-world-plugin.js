/** A minimal plugin example **/
var HelloWorldPlugin = function(args) {

  var currentColorBody = args.annotation ? args.annotation.bodies.find(function(b) {
    return b.purpose == 'highlighting';
  }) : null;

  var currentColorValue = currentColorBody ? currentColorBody.value : null;

  var addTag = function(evt) {
    if (currentColorBody) {
      args.onUpdateBody(currentColorBody, {
        type: 'TextualBody',
        purpose: 'highlighting',
        value: evt.target.dataset.tag
      });
    } else { 
      args.onAppendBody({
        type: 'TextualBody',
        purpose: 'highlighting',
        value: evt.target.dataset.tag
      });
    }
  }

  var createButton = function(value) {
    var button = document.createElement('button');

    if (value == currentColorValue)
      button.className = 'selected';

    button.dataset.tag = value;
    button.style.backgroundColor = value;
    button.addEventListener('click', addTag); 
    return button;
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

/** A matching formatter that sets the color according to the 'highlighting' body value **/
var HelloWorldFormatter = function(annotation) {
  var highlightBody = annotation.bodies.find(function(b) {
    return b.purpose == 'highlighting';
  });

  if (highlightBody)
    return highlightBody.value;
}
