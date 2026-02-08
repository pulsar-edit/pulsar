const SelectListView = require('pulsar-select-list');

module.exports = class ReopenProjectListView {
  constructor(callback) {
    this.callback = callback;
    this.selectList = new SelectListView({
      className: 'reopen-project',
      emptyMessage: 'No projects in history.',
      itemsClassList: ['mark-active'],
      items: [],
      filterKeyForItem: project => project.name,
      elementForItem: project => {
        let element = document.createElement('li');
        if (project.name === this.currentProjectName) {
          element.classList.add('active');
        }
        element.textContent = project.name;
        return element;
      },
      didConfirmSelection: project => {
        this.cancel();
        this.callback(project.value);
      },
      didCancelSelection: () => {
        this.cancel();
      }
    });
  }

  get element() {
    return this.selectList.element;
  }

  dispose() {
    this.cancel();
    return this.selectList.destroy();
  }

  cancel() {
    this.selectList.hide();
    this.currentProjectName = null;
  }

  attach() {
    this.selectList.reset();
    this.selectList.show();
  }

  async toggle() {
    if (this.selectList.isVisible()) {
      this.cancel();
    } else {
      this.currentProjectName =
        atom.project != null ? this.makeName(atom.project.getPaths()) : null;
      const projects = atom.history
        .getProjects()
        .map(p => ({ name: this.makeName(p.paths), value: p.paths }));
      await this.selectList.update({ items: projects });
      this.attach();
    }
  }

  makeName(paths) {
    return paths.join(', ');
  }
};
