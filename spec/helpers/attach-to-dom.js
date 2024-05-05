jasmine.attachToDOM = function(element) {
  const jasmineContent = document.querySelector('#jasmine-content');
  if (!jasmineContent.contains(element)) { jasmineContent.appendChild(element); }
};
