/** @babel */

export default {
  activate() {
    this.stack = [];

    this.workspaceSubscription = atom.commands.add('atom-workspace', {
      'symbols-view:toggle-project-symbols': () => {
        this.createProjectView().toggle();
      },
    });

    this.editorSubscription = atom.commands.add('atom-text-editor', {
      'symbols-view:toggle-file-symbols': () => {
        this.createFileView().toggle();
      },
      'symbols-view:go-to-declaration': () => {
        this.createGoToView().toggle();
      },
      'symbols-view:return-from-declaration': () => {
        this.createGoBackView().toggle();
      },
    });
  },

  deactivate() {
    if (this.fileView != null) {
      this.fileView.destroy();
      this.fileView = null;
    }

    if (this.projectView != null) {
      this.projectView.destroy();
      this.projectView = null;
    }

    if (this.goToView != null) {
      this.goToView.destroy();
      this.goToView = null;
    }

    if (this.goBackView != null) {
      this.goBackView.destroy();
      this.goBackView = null;
    }

    if (this.workspaceSubscription != null) {
      this.workspaceSubscription.dispose();
      this.workspaceSubscription = null;
    }

    if (this.editorSubscription != null) {
      this.editorSubscription.dispose();
      this.editorSubscription = null;
    }
  },

  createFileView() {
    if (this.fileView) {
      return this.fileView;
    }
    const FileView  = require('./file-view');
    this.fileView = new FileView(this.stack);
    return this.fileView;
  },

  createProjectView() {
    if (this.projectView) {
      return this.projectView;
    }
    const ProjectView  = require('./project-view');
    this.projectView = new ProjectView(this.stack);
    return this.projectView;
  },

  createGoToView() {
    if (this.goToView) {
      return this.goToView;
    }
    const GoToView = require('./go-to-view');
    this.goToView = new GoToView(this.stack);
    return this.goToView;
  },

  createGoBackView() {
    if (this.goBackView) {
      return this.goBackView;
    }
    const GoBackView = require('./go-back-view');
    this.goBackView = new GoBackView(this.stack);
    return this.goBackView;
  },
};
