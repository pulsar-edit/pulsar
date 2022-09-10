(function() {
  var CharacterPattern, _;

  _ = require('underscore-plus');

  CharacterPattern = /[^\s]/;

  module.exports = {
    activate: function() {
      return this.commandDisposable = atom.commands.add('atom-text-editor', {
        'autoflow:reflow-selection': (function(_this) {
          return function(event) {
            return _this.reflowSelection(event.currentTarget.getModel());
          };
        })(this)
      });
    },
    deactivate: function() {
      var _ref;
      if ((_ref = this.commandDisposable) != null) {
        _ref.dispose();
      }
      return this.commandDisposable = null;
    },
    reflowSelection: function(editor) {
      var range, reflowOptions, reflowedText;
      range = editor.getSelectedBufferRange();
      if (range.isEmpty()) {
        range = editor.getCurrentParagraphBufferRange();
      }
      if (range == null) {
        return;
      }
      reflowOptions = {
        wrapColumn: this.getPreferredLineLength(editor),
        tabLength: this.getTabLength(editor)
      };
      reflowedText = this.reflow(editor.getTextInRange(range), reflowOptions);
      return editor.getBuffer().setTextInRange(range, reflowedText);
    },
    reflow: function(text, _arg) {
      var beginningLinesToIgnore, block, blockLines, currentLine, currentLineLength, endingLinesToIgnore, escapedLinePrefix, firstLine, latexTagEndRegex, latexTagRegex, latexTagStartRegex, leadingVerticalSpace, linePrefix, linePrefixTabExpanded, lines, paragraphBlocks, paragraphs, segment, tabLength, tabLengthInSpaces, trailingVerticalSpace, wrapColumn, wrappedLinePrefix, wrappedLines, _i, _j, _len, _len1, _ref;
      wrapColumn = _arg.wrapColumn, tabLength = _arg.tabLength;
      paragraphs = [];
      text = text.replace(/\r\n?/g, '\n');
      leadingVerticalSpace = text.match(/^\s*\n/);
      if (leadingVerticalSpace) {
        text = text.substr(leadingVerticalSpace.length);
      } else {
        leadingVerticalSpace = '';
      }
      trailingVerticalSpace = text.match(/\n\s*$/);
      if (trailingVerticalSpace) {
        text = text.substr(0, text.length - trailingVerticalSpace.length);
      } else {
        trailingVerticalSpace = '';
      }
      paragraphBlocks = text.split(/\n\s*\n/g);
      if (tabLength) {
        tabLengthInSpaces = Array(tabLength + 1).join(' ');
      } else {
        tabLengthInSpaces = '';
      }
      for (_i = 0, _len = paragraphBlocks.length; _i < _len; _i++) {
        block = paragraphBlocks[_i];
        blockLines = block.split('\n');
        beginningLinesToIgnore = [];
        endingLinesToIgnore = [];
        latexTagRegex = /^\s*\\\w+(\[.*\])?\{\w+\}(\[.*\])?\s*$/g;
        latexTagStartRegex = /^\s*\\\w+\s*\{\s*$/g;
        latexTagEndRegex = /^\s*\}\s*$/g;
        while (blockLines.length > 0 && (blockLines[0].match(latexTagRegex) || blockLines[0].match(latexTagStartRegex))) {
          beginningLinesToIgnore.push(blockLines[0]);
          blockLines.shift();
        }
        while (blockLines.length > 0 && (blockLines[blockLines.length - 1].match(latexTagRegex) || blockLines[blockLines.length - 1].match(latexTagEndRegex))) {
          endingLinesToIgnore.unshift(blockLines[blockLines.length - 1]);
          blockLines.pop();
        }
        if (!(blockLines.length > 0)) {
          paragraphs.push(block);
          continue;
        }
        linePrefix = blockLines[0].match(/^\s*(\/\/|\/\*|;;|#'|\|\|\||--|[#%*>-])?\s*/g)[0];
        linePrefixTabExpanded = linePrefix;
        if (tabLengthInSpaces) {
          linePrefixTabExpanded = linePrefix.replace(/\t/g, tabLengthInSpaces);
        }
        if (linePrefix) {
          escapedLinePrefix = _.escapeRegExp(linePrefix);
          blockLines = blockLines.map(function(blockLine) {
            return blockLine.replace(RegExp("^" + escapedLinePrefix), '');
          });
        }
        blockLines = blockLines.map(function(blockLine) {
          return blockLine.replace(/^\s+/, '');
        });
        lines = [];
        currentLine = [];
        currentLineLength = linePrefixTabExpanded.length;
        wrappedLinePrefix = linePrefix.replace(/^(\s*)\/\*/, '$1  ').replace(/^(\s*)-(?!-)/, '$1 ');
        firstLine = true;
        _ref = this.segmentText(blockLines.join(' '));
        for (_j = 0, _len1 = _ref.length; _j < _len1; _j++) {
          segment = _ref[_j];
          if (this.wrapSegment(segment, currentLineLength, wrapColumn)) {
            if (firstLine !== true) {
              if (linePrefix.search(/^\s*\/\*/) !== -1 || linePrefix.search(/^\s*-(?!-)/) !== -1) {
                linePrefix = wrappedLinePrefix;
              }
            }
            lines.push(linePrefix + currentLine.join(''));
            currentLine = [];
            currentLineLength = linePrefixTabExpanded.length;
            firstLine = false;
          }
          currentLine.push(segment);
          currentLineLength += segment.length;
        }
        lines.push(linePrefix + currentLine.join(''));
        wrappedLines = beginningLinesToIgnore.concat(lines.concat(endingLinesToIgnore));
        paragraphs.push(wrappedLines.join('\n').replace(/\s+\n/g, '\n'));
      }
      return leadingVerticalSpace + paragraphs.join('\n\n') + trailingVerticalSpace;
    },
    getTabLength: function(editor) {
      var _ref;
      return (_ref = atom.config.get('editor.tabLength', {
        scope: editor.getRootScopeDescriptor()
      })) != null ? _ref : 2;
    },
    getPreferredLineLength: function(editor) {
      return atom.config.get('editor.preferredLineLength', {
        scope: editor.getRootScopeDescriptor()
      });
    },
    wrapSegment: function(segment, currentLineLength, wrapColumn) {
      return CharacterPattern.test(segment) && (currentLineLength + segment.length > wrapColumn) && (currentLineLength > 0 || segment.length < wrapColumn);
    },
    segmentText: function(text) {
      var match, re, segments;
      segments = [];
      re = /[\s]+|[^\s]+/g;
      while (match = re.exec(text)) {
        segments.push(match[0]);
      }
      return segments;
    }
  };

}).call(this);
