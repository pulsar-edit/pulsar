exports.mockLocalStorage = function() {
  const items = {};
  spyOn(global.localStorage, 'setItem').and.callFake(function(key, item) { items[key] = item.toString(); return undefined; });
  spyOn(global.localStorage, 'getItem').and.callFake(key => items[key] != null ? items[key] : null);
  return spyOn(global.localStorage, 'removeItem').and.callFake(function(key) { delete items[key]; return undefined; });
};
