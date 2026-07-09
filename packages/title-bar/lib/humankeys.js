const macModifierKeyMap = {
  cmd: "\u2318",
  ctrl: "\u2303",
  alt: "\u2325",
  option: "\u2325",
  shift: "\u21e7",
  enter: "\u23ce",
  left: "\u2190",
  right: "\u2192",
  up: "\u2191",
  down: "\u2193",
  cmdorctrl: "\u2318",
};

const nonMacModifierKeyMap = {
  cmd: "Cmd",
  ctrl: "Ctrl",
  alt: "Alt",
  option: "Alt",
  shift: "Shift",
  enter: "Enter",
  left: "Left",
  right: "Right",
  up: "Up",
  down: "Down",
  cmdorctrl: "Ctrl",
};

// 'shift-version': 'no-shift-version'
const shiftKeyMap = {
  "~": "`",
  _: "-",
  "+": "=",
  "|": "\\",
  "{": "[",
  "}": "]",
  ":": ";",
  '"': "'",
  "<": ",",
  ">": ".",
  "?": "/",
};

function humanizeKey(key, platform = process.platform) {
  if (!key) {
    return key;
  }

  const modifierKeyMap = platform === "darwin" ? macModifierKeyMap : nonMacModifierKeyMap;

  if (modifierKeyMap[key]) {
    return modifierKeyMap[key];
  } else if (key.length === 1 && shiftKeyMap[key] != null) {
    return [modifierKeyMap.shift, shiftKeyMap[key]];
  } else if (
    key.length === 1 &&
    key === key.toUpperCase() &&
    key.toUpperCase() !== key.toLowerCase()
  ) {
    return [modifierKeyMap.shift, key.toUpperCase()];
  } else if (key.length === 1 || /f[0-9]{1,2}/.test(key)) {
    return key.toUpperCase();
  } else {
    return platform === "darwin" ? key : key.charAt(0).toUpperCase() + key.slice(1);
  }
}

function humanizeKeystroke(keystroke, platform = process.platform) {
  if (!keystroke) {
    return keystroke;
  }

  const keystrokes = keystroke.split(" ");
  const humanizedKeystrokes = [];
  for (const stroke of keystrokes) {
    let keys = [];
    const splitKeystroke = stroke.split("-");
    for (let index = 0; index < splitKeystroke.length; index++) {
      let key = splitKeystroke[index];
      if (key === "" && splitKeystroke[index - 1] === "") {
        key = "-";
      }
      if (key) {
        keys.push(humanizeKey(key, platform));
      }
    }

    keys = [...new Set(keys.flat())];
    keys = platform === "darwin" ? keys.join("") : keys.join("+");
    humanizedKeystrokes.push(keys);
  }

  return humanizedKeystrokes.join(" ");
}

module.exports = { humanizeKeystroke };
