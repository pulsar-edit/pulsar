(function() {
  module.exports = function() {
    emit("some-event", 1, 2, 3);
    return 'hello';
  };

}).call(this);