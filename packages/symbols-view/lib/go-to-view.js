/** @babel */

import path from 'path';
import SymbolsView from './symbols-view';
import TagReader from './tag-reader';

export default class GoToView extends SymbolsView {
  toggle() {
    if (this.panel.isVisible()) {
      this.cancel();
    } else {
      this.populate();
    }
  }

  detached() {
    if (this.resolveFindTagPromise) {
      this.resolveFindTagPromise([]);
    }
  }

  findTag(editor) {
    if (this.resolveFindTagPromise) {
      this.resolveFindTagPromise([]);
    }

    return new Promise((resolve, reject) => {
      this.resolveFindTagPromise = resolve;
      TagReader.find(editor, (error, matches) => {
        if (!matches) {
          matches = [];
        }
        if (error) {
          return reject(error);
        } else {
          return resolve(matches);
        }
      });
    });
  }

  async populate() {
    let editor = atom.workspace.getActiveTextEditor();
    if (!editor) {
      return;
    }

    this.findTag(editor).then(async matches => {
      let tags = [];
      for (let match of Array.from(matches)) {
        let position = this.getTagLine(match);
        if (!position) { continue; }
        match.name = path.basename(match.file);
        tags.push(match);
      }

      if (tags.length === 1) {
        this.openTag(tags[0]);
      } else if (tags.length > 0) {
        await this.selectListView.update({items: tags});
        this.attach();
      }
    });
  }
}
