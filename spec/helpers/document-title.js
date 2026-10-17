// Allow document.title to be assigned in specs without screwing up spec window title
let documentTitle = null;

Object.defineProperty(document, 'title', {
    get() {
      return documentTitle;
    },
    set(title) {
      return documentTitle = title;
    }
  }
);
