const SelectListView = require('pulsar-select-list');

module.exports =
class CorrectionsView {
    constructor(editor, corrections, marker, updateTarget, updateCallback) {
        this.editor = editor;
        this.corrections = corrections;
        this.marker = marker;
        this.updateTarget = updateTarget;
        this.updateCallback = updateCallback;
        this.selectList = new SelectListView({
            className: 'spell-check-corrections corrections popover-list',
            emptyMessage: 'No corrections',
            items: this.corrections,
            filterKeyForItem: (item) => item.label,
            elementForItem: (item) => {
                const element = document.createElement('li');
                if (item.isSuggestion) {
                    // This is a word replacement suggestion.
                    element.textContent = item.label;
                } else {
                    // This is an operation such as add word.
                    const em = document.createElement('em');
                    em.textContent = item.label;
                    element.appendChild(em);
                }
                return element;
            },
            didConfirmSelection: (item) => {
                this.editor.transact(() => {
                    if (item.isSuggestion) {
                        // Update the buffer with the correction.
                        this.editor.setSelectedBufferRange(
                            this.marker.getBufferRange()
                        );
                        this.editor.insertText(item.suggestion);
                    } else {
                        // Build up the arguments object for this buffer and text.
                        let projectPath = null;
                        let relativePath = null;
                        if (
                            this.editor &&
                            this.editor.buffer &&
                            this.editor.buffer.file &&
                            this.editor.buffer.file.path
                        ) {
                            [
                                projectPath,
                                relativePath,
                            ] = atom.project.relativizePath(
                                this.editor.buffer.file.path
                            );
                        }

                        const args = { id: this.id, projectPath, relativePath };
                        // Send the "add" request to the plugin.
                        item.plugin.add(args, item);
                        // Update the buffer to handle the corrections.
                        this.updateCallback.bind(this.updateTarget)();
                    }
                });
                this.destroy();
            },
            didConfirmEmptySelection: () => {
                this.destroy();
            },
            didCancelSelection: () => {
                this.destroy();
            },
        });
    }

    attach() {
        this.previouslyFocusedElement = document.activeElement;
        this.overlayDecoration = this.editor.decorateMarker(this.marker, {
            type: 'overlay',
            item: this.selectList,
        });
        process.nextTick(() => {
            atom.views.readDocument(() => {
                this.selectList.focus();
            });
        });
    }

    async destroy() {
        if (!this.destroyed) {
            this.destroyed = true;
            this.overlayDecoration.destroy();
            await this.selectList.destroy();
            if (this.previouslyFocusedElement) {
                this.previouslyFocusedElement.focus();
                this.previouslyFocusedElement = null;
            }
        }
    }
}
