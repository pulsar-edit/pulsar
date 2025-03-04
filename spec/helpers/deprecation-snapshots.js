const _ = require("underscore-plus");
const Grim = require("grim");

let grimDeprecationsSnapshot = null;
let stylesDeprecationsSnapshot = null;

jasmine.snapshotDeprecations = function() {
  grimDeprecationsSnapshot = _.clone(Grim.deprecations);
  return stylesDeprecationsSnapshot = _.clone(atom.styles.deprecationsBySourcePath);
};

jasmine.restoreDeprecationsSnapshot = function() {
  Grim.deprecations = grimDeprecationsSnapshot;
  return atom.styles.deprecationsBySourcePath = stylesDeprecationsSnapshot;
};
