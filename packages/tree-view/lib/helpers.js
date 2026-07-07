const path = require("path");

let DEBUG = false;

function getFullExtension(filePath) {
  const basename = path.basename(filePath);
  const position = basename.indexOf(".");
  if (position > 0) {
    return basename.slice(position);
  } else {
    return "";
  }
}

function resolveDuplicateCopyNameStyle(style = "system", platform = process.platform) {
  if (style !== "system") return style;

  switch (platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "macos";
    default:
      return "linux";
  }
}

function ordinal(number) {
  const mod100 = number % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${number}th`;

  switch (number % 10) {
    case 1:
      return `${number}st`;
    case 2:
      return `${number}nd`;
    case 3:
      return `${number}rd`;
    default:
      return `${number}th`;
  }
}

function formatDuplicateCopyName(basePath, index, style) {
  switch (style) {
    case "windows":
      return index === 1 ? `${basePath} - Copy` : `${basePath} - Copy (${index})`;
    case "macos":
      return index === 1 ? `${basePath} copy` : `${basePath} copy ${index}`;
    case "linux":
      if (index === 1) return `${basePath} (copy)`;
      if (index === 2) return `${basePath} (another copy)`;
      return `${basePath} (${ordinal(index)} copy)`;
    case "legacy":
    default:
      return `${basePath}${index - 1}`;
  }
}

function getDuplicateCopyPath(initialPath, newDirectoryPath, options = {}) {
  const {
    isDirectory = false,
    pathExists = (filePath) => require("fs").existsSync(filePath),
    style = "system",
    platform = process.platform,
  } = options;

  let newPath = path.join(newDirectoryPath, path.basename(initialPath));
  if (!pathExists(newPath)) return newPath;

  const extension = isDirectory ? "" : getFullExtension(newPath);
  const basePath = path.join(
    path.dirname(newPath),
    path.basename(newPath, extension),
  );
  const resolvedStyle = resolveDuplicateCopyNameStyle(style, platform);

  let index = 1;
  do {
    newPath = `${formatDuplicateCopyName(basePath, index, resolvedStyle)}${extension}`;
    index++;
  } while (pathExists(newPath));

  return newPath;
}

module.exports = {
  repoForPath(goalPath) {
    const iterable = atom.project.getPaths();
    for (let i = 0; i < iterable.length; i++) {
      const projectPath = iterable[i];
      if (goalPath === projectPath || goalPath.indexOf(projectPath + path.sep) === 0) {
        return atom.project.getRepositories()[i];
      }
    }
    return null;
  },

  getStyleObject(el) {
    const computed = window.getComputedStyle(el);
    const styleObject = {};
    const props = [
      "color",
      "font-size",
      "font-family",
      "font-weight",
      "font-style",
      "line-height",
      "background-color",
      "background-image",
      "padding-left",
      "padding-right",
      "padding-top",
      "padding-bottom",
      "text-decoration",
      "opacity",
    ];
    for (let prop of props) {
      const value = computed.getPropertyValue(prop);
      if (value) {
        const camelized = prop.replace(/-([a-z])/g, (_, b) => b.toUpperCase());
        styleObject[camelized] = value;
      }
    }
    return styleObject;
  },

  formatDuplicateCopyName,
  getDuplicateCopyPath,
  getFullExtension,
  resolveDuplicateCopyNameStyle,

  isDebug() {
    return DEBUG;
  },

  setDebug(newValue) {
    DEBUG = newValue;
  },
};
