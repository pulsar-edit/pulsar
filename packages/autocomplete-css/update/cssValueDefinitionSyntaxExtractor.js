// Due to the complexity of CSS Value Definition Syntax
// https://developer.mozilla.org/en-US/docs/Web/CSS/Value_definition_syntax
// We will go ahead and create a small parser for handling it.
// This parser is only intended to receive some syntax, and spit out an array
// of all valid value identifiers within it. Ignoring all special conventions of
// the syntax.

class CSSParser {
  constructor(input) {
    this.index = 0;
    this.value = input;
    this.out = [];

    // Manage States
    this.buffer = ""; // Used to store uncomplete values while looping.

    // Definitions
    this.keywords = {
      "*": "Asterisk Multiplier",
      "+": "Plus Sign Multiplier",
      "?": "Question Mark Multiplier",
      "#": "Hash Mark Multiplier",
      "!": "Exclamation Point Multiplier"
    };

    this.separators = {
      "&&": "Double Ampersand Combinator",
      "||": "Double Bar Combinator",
      "|": "Single Bar Combinator",
      "[": "Open Bracket Combinator",
      "]": "Close Bracket Combinator",
      " ": "Juxtaposition Combinator",
      "/": "Undocumented Seperator?"
    };

    this.startFold = "<"; // A foldable item would mean to stop parsing within.
    this.endFold = ">";
    this.startDiscardable = "{";
    this.endDiscardable = "}";
  }

  parse() {
    let cur = this.cur();

    if (this.index === this.value.length || this.index > this.value.length) {
      // We have hit the end of our index. Lets return
      this.offLoadBuffer();
      return this.out;
    }

    if (this.isStartDiscardable()) {
      // We don't care about what's in here, until we hit the end of our discardable
      this.offLoadBuffer();
      while(!this.isEndDiscardable()) {
        this.next();
      }
      this.next();
      return this.parse();
    }

    if (this.isKeyword().status) {
      // We don't actually care about keywords.
      this.offLoadBuffer();
      this.next(this.isKeyword().who.length);
      return this.parse();
    }

    if (this.isSeparators().status) {
      // We don't actually care about seperators
      this.offLoadBuffer();
      this.next(this.isSeparators().who.length);
      return this.parse();
    }

    if (this.isStartFold()) {
      let tmpValue = "";
      while(!this.isEndFold()) {
        tmpValue += this.cur();
        this.next();
      }
      tmpValue += this.cur();
      this.out.push(tmpValue);
      this.next();
      return this.parse();
    }

    if (!this.isStartDiscardable() && !this.isEndDiscardable() && !this.isKeyword().status && !this.isSeparators().status && !this.isStartFold() && !this.isEndFold()) {
      this.buffer += this.cur();
      this.next();
      return this.parse();
    }

  }

  offLoadBuffer() {
    if (this.buffer.length > 0) {
      this.out.push(this.buffer);
      this.buffer = "";
    }
  }

  isKeyword() {
    for (const name in this.keywords) {
      if (this.keywords.hasOwnProperty(name) && this.value.substr(this.index, name.length) === name) {
        return { status: true, who: name };
      }
    }
    return { status: false };
  }

  isSeparators() {
    for (const name in this.separators) {
      if (this.separators.hasOwnProperty(name) && this.value.substr(this.index, name.length) === name) {
        return { status: true, who: name };
      }
    }
    return { status: false };
  }

  isStartFold() {
    if (this.cur() === this.startFold) {
      return true;
    } else {
      return false;
    }
  }

  isEndFold() {
    if (this.cur() === this.endFold) {
      return true;
    } else {
      return false;
    }
  }

  isStartDiscardable() {
    if (this.cur() === this.startDiscardable) {
      return true;
    } else {
      return false;
    }
  }

  isEndDiscardable() {
    if (this.cur() === this.endDiscardable) {
      return true;
    } else {
      return false;
    }
  }

  cur() {
    return this.value.charAt(this.index);
  }

  next(amount) {
    let increase = amount ?? 1;
    this.index = this.index + increase;
    return this.value.charAt(this.index);
  }
}

module.exports = CSSParser;
