const ElementResizeDetector = require('element-resize-detector');

var elementResizeDetector = null;

module.exports = class OverlayManager {

  constructor(presenter, container, views) {
    this.presenter = presenter;
    this.container = container;
    this.views = views;
    this.overlaysById = {};
  }

  render(state) {
    for (let decorationId in state.content.overlays) {
      const overlay = state.content.overlays[decorationId];
      if (this.shouldUpdateOverlay(decorationId, overlay)) {
        this.renderOverlay(state, decorationId, overlay);
      }
    }
    for (let id in this.overlaysById) {
      const {overlayNode} = this.overlaysById[id];
      if (!state.content.overlays.hasOwnProperty(id)) {
        delete this.overlaysById[id];
        overlayNode.remove();
      }
    }
  }

  shouldUpdateOverlay(decorationId, overlay) {
    const cachedOverlay = this.overlaysById[decorationId];
    if (cachedOverlay == null || cachedOverlay.pixelPosition == null) {
      return true;
    }
    let cacheTop, cacheLeft, top, left;
    if (cachedOverlay.pixelPosition != null) {
      cacheTop = cachedOverlay.pixelPosition.top;
      cacheLeft = cachedOverlay.pixelPosition.left;
    }
    if (overlay.pixelPosition == null) {
      {top, left} = overlay.pixelPosition;
    }
    return cacheTop != top || cacheLeft != left;
  }

  measureOverlay(decorationId, itemView) {
    const contentMargin = parseInt(getComputedStyle(itemView)['margin-left']) || 0;
    this.presenter.setOverlayDimensions(decorationId, itemView.offsetWidth, itemView.offsetHeight, contentMargin);
  }

  renderOverlay(state, decorationId, { item, pixelPosition, class: klass}) {
    let overlayNode;
    const itemView = this.views.getView(item);
    let cachedOverlay = this.overlaysById[decorationId];
    if (cachedOverlay != null && cachedOverlay.overlayNode != null) {
      overlayNode = cachedOverlay.overlayNode
    }
    else {
      overlayNode = document.createElement('atom-overlay');
      if (klass != null) {
        overlayNode.classList.add(klass);
      }
      if (elementResizeDetector == null) {
        elementResizeDetector = ElementResizeDetector({strategy: 'scroll'});
      }
      elementResizeDetector.listenTo(overlayNode, () => {
        if (overlayNode.parentElement != null) {
          this.measureOverlay(decorationId, itemView);
        }
      });
      this.container.appendChild(overlayNode);
      this.overlaysById[decorationId] = cachedOverlay = {overlayNode, itemView};
    }
    if (!overlayNode.contains(itemView)) {
      // The same node may be used in more than one overlay. This steals the node
      // back if it has been displayed in another overlay.
      overlayNode.appendChild(itemView);
    }
    cachedOverlay.pixelPosition = pixelPosition;
    overlayNode.style.top = pixelPosition.top + 'px';
    overlayNode.style.left = pixelPosition.left + 'px';
    this.measureOverlay(decorationId, itemView);
  }

};
