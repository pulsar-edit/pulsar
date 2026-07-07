jasmine.filterByPlatform = ({ only, except }, _done) => {
  if (only && !only.includes(process.platform)) {
    pending();
  }

  if (except && except.includes(process.platform)) {
    pending();
  }
};
