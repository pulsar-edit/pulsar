describe('"atom" protocol URL', () => {
  it('sends the file relative in the package as response', (done) => {
    const request = new XMLHttpRequest();
    request.addEventListener('load', () => {
      done();
    });
    request.open('GET', 'atom://async/package.json', true);
    request.send();
  })
});
