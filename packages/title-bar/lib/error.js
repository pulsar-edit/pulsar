class MalformedTemplateError extends Error {
  constructor(message) {
    super(message);
    this.name = "MalformedTemplateError";
  }
}

module.exports = { MalformedTemplateError };
