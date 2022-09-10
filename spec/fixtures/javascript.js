(function() {
  var quicksort;

  quicksort = (function() {
    function quicksort() {}

    quicksort.prototype.sort = function(items) {
      var current, left, pivot, right;
      if (items.length <= 1) {
        return items;
      }
      pivot = items.shift();
      left = [];
      right = [];
      while (items.length > 0) {
        current = items.shift();
        if (current < pivot) {
          left.push(current);
        } else {
          right.push(current);
        }
      }
      return sort(left).concat(pivot).concat(sort(right));
    };

    quicksort.prototype.noop = function() {};

    return quicksort;

  })();

  exports.modules = quicksort;

}).call(this);
