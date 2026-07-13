/** @babel */

function observer(target) {
  target.observed = true;
}

@observer
class Display {}

module.exports = Display;
