/** @babel */

import { CompositeDisposable, File } from 'atom';
import humanize from 'humanize-plus';
import SymbolsView from './symbols-view';
import TagReader from './tag-reader';
import getTagsFile from './get-tags-file';

export default class ProjectView extends SymbolsView {
  constructor(stack) {
    super(stack, 'Project has no tags file or it is empty', 10);
    this.reloadTags = true;
  }

  destroy() {
    this.stopTask();
    this.unwatchTagsFiles();
    return super.destroy();
  }

  toggle() {
    if (this.panel.isVisible()) {
      this.cancel();
    } else {
      this.populate();
      this.attach();
    }
  }

  async populate() {
    if (this.tags) {
      await this.selectListView.update({items: this.tags});
    }

    if (this.reloadTags) {
      this.reloadTags = false;
      this.startTask();

      if (this.tags) {
        await this.selectListView.update({
          loadingMessage: 'Reloading project symbols\u2026',
        });
      } else {
        await this.selectListView.update({
          loadingMessage: 'Loading project symbols\u2026',
          loadingBadge: 0,
        });
        let tagsRead = 0;
        this.loadTagsTask.on('tags', tags => {
          tagsRead += tags.length;
          this.selectListView.update({loadingBadge: humanize.intComma(tagsRead)});
        });
      }
    }
  }

  stopTask() {
    if (this.loadTagsTask) {
      this.loadTagsTask.terminate();
    }
  }

  startTask() {
    this.stopTask();

    this.loadTagsTask = TagReader.getAllTags(tags => {
      this.tags = tags;
      this.reloadTags = this.tags.length === 0;
      this.selectListView.update({
        loadingMessage: null,
        loadingBadge: null,
        items: this.tags,
      });
    });

    this.watchTagsFiles();
  }

  watchTagsFiles() {
    this.unwatchTagsFiles();

    this.tagsFileSubscriptions = new CompositeDisposable();
    let reloadTags = () => {
      this.reloadTags = true;
      this.watchTagsFiles();
    };

    for (const projectPath of Array.from(atom.project.getPaths())) {
      const tagsFilePath = getTagsFile(projectPath);
      if (tagsFilePath) {
        const tagsFile = new File(tagsFilePath);
        this.tagsFileSubscriptions.add(tagsFile.onDidChange(reloadTags));
        this.tagsFileSubscriptions.add(tagsFile.onDidDelete(reloadTags));
        this.tagsFileSubscriptions.add(tagsFile.onDidRename(reloadTags));
      }
    }
  }

  unwatchTagsFiles() {
    if (this.tagsFileSubscriptions) {
      this.tagsFileSubscriptions.dispose();
    }
    this.tagsFileSubscriptions = null;
  }
}
