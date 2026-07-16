const { Disposable } = require("event-kit");

// Experimental: Coordinates packages that can handle clipboard content before
// Lumine falls back to its built-in text paste behavior.
module.exports = class PasteProviderRegistry {
  constructor() {
    this.clear();
  }

  clear() {
    this.providers = [];
    this.nextRegistrationOrder = 0;
  }

  // Register a paste provider. Providers must implement `handlePaste(context)`
  // and return true synchronously when they claim the paste.
  add(provider, { priority = 0 } = {}) {
    if (!provider || typeof provider.handlePaste !== "function") {
      throw new TypeError("Paste providers must implement handlePaste(context)");
    }
    if (!Number.isFinite(priority)) {
      throw new TypeError("Paste provider priority must be a finite number");
    }

    const registration = {
      provider,
      priority,
      order: this.nextRegistrationOrder++,
    };
    this.providers.push(registration);
    this.providers.sort(
      (left, right) => right.priority - left.priority || left.order - right.order,
    );

    return new Disposable(() => {
      const index = this.providers.indexOf(registration);
      if (index !== -1) this.providers.splice(index, 1);
    });
  }

  handlePaste(context) {
    for (const { provider } of this.providers) {
      if (provider.handlePaste(context) === true) return true;
    }
    return false;
  }
};
