jasmine.filterByPlatform = ({only, except}, done) => {
  if (only && !only.includes(process.platform)) {
    if (done) done();
    pending();
  }

  if (except && except.includes(process.platform)) {
    if (done) done();
    pending();
  }
}
