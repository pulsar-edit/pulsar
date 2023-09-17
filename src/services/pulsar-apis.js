const { Disposable } = require('event-kit');

let apis = new Map()
// TODO - DOC
// apiConsumer needs to have a `moduleName` field, and either an `exports` field
// that is what is going to be exported, or an `exportFunction` that is a
// function that will be called and it needs to return something to be exported
// when we call `require(moduleName)`. It can also have a dispose() that
// will be called if we don't register it anymore. It can also have a
// "score" field - default is `0`. Higher scores will make an API preferable
// from other.
function apiConsumer(provider) {
  const oldProvider = apis.get(provider.moduleName)
  // TODO: Check if two providers can exist at the same time. An idea is
  // that when a provider is diposed, we re-register one with a lower score
  if(oldProvider && oldProvider.score > provider.score) return new Disposable();

  provider.score ||= 0;
  apis.set(provider.moduleName, Object.assign(provider));
  return new Disposable(() => {
    apis.delete(provider.moduleName);
    if(provider.dispose) provider.dispose();
  })
}

module.exports = { apiConsumer, apis };
