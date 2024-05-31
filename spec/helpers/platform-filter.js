jasmine.filterByPlatform = ({only, except}, done) => {
  if (only && !only.includes(process.platform)) {
    done();
    pending();
  }

  if (except && except.includes(process.platform)) {
    done();
    pending();
  }
}
