/*
 * decaffeinate suggestions:
 * DS102: Remove unnecessary code created because of implicit returns
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/main/docs/suggestions.md
 */
const DefaultFileIcons = require('../lib/default-file-icons');
const getIconServices = require('../lib/get-icon-services');
const {Disposable} = require('atom');

describe('IconServices', function() {
  afterEach(function() {
    getIconServices().resetFileIcons();
    return getIconServices().resetElementIcons();
  });

  describe('FileIcons', function() {
    it('provides a default', function() {
      expect(getIconServices().fileIcons).toBeDefined();
      return expect(getIconServices().fileIcons).toBe(DefaultFileIcons);
    });

    it('allows the default to be overridden', function() {
      const service = new Object;
      getIconServices().setFileIcons(service);
      return expect(getIconServices().fileIcons).toBe(service);
    });

    return it('allows the service to be reset to the default easily', function() {
      const service = new Object;
      getIconServices().setFileIcons(service);
      getIconServices().resetFileIcons();
      return expect(getIconServices().fileIcons).toBe(DefaultFileIcons);
    });
  });

  return describe('ElementIcons', function() {
    it('does not provide a default', () => expect(getIconServices().elementIcons).toBe(null));

    it('consumes the ElementIcons service', function() {
      const service = function() {};
      getIconServices().setElementIcons(service);
      return expect(getIconServices().elementIcons).toBe(service);
    });

    return it('does not call the FileIcons service when the ElementIcons service is provided', function() {
      const elementIcons = () => new Disposable(function() {});
      const fileIcons =
        {iconClassForPath() {}};
      spyOn(fileIcons, 'iconClassForPath').andCallThrough();
      getIconServices().setElementIcons(elementIcons);
      getIconServices().setFileIcons(fileIcons);
      getIconServices().updateFileIcon({file: {}, fileName: {classList: {add() {}}}});
      return expect(fileIcons.iconClassForPath).not.toHaveBeenCalled();
    });
  });
});
