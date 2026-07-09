const { humanizeKeystroke } = require("./humankeys");

class Utils {
  static formatKeystroke(keystroke) {
    return humanizeKeystroke(keystroke);
  }

  static formatAltKey(label) {
    const m = label.match(/(?<=&)./);
    const key = m ? m[0] : null;
    const html = label.replace(`&${key}`, `<u>${key}</u>`);
    return {
      html,
      name: label.replace("&", ""),
      key: key?.toLowerCase() || null,
    };
  }

  static setToggleClass(elmnt, clazz, flag) {
    elmnt.classList.toggle(clazz, flag);
  }

  static mod(n, m) {
    return ((n % m) + m) % m;
  }

  static stopEvent(e) {
    e.stopPropagation();
    e.preventDefault();
  }

  static rangeIntersects(min0, max0, min1, max1) {
    return (
      Math.max(min0, max0) >= Math.min(min1, max1) && Math.min(min0, max0) <= Math.max(min1, max1)
    );
  }

  static domRectIntersects(a, b) {
    return (
      Utils.rangeIntersects(a.x, a.x + a.width, b.x, b.x + b.width) &&
      Utils.rangeIntersects(a.y, a.y + a.height, b.y, b.y + b.height)
    );
  }

  /**
   * Clean up context menu label by:
   * 1. Removing bracketed shortcuts like "[Ctrl-K Up]"
   * 2. Converting command-style labels like "pkg:do-thing" to "Do Thing"
   */
  static cleanContextMenuLabel(label) {
    if (!label || typeof label !== "string") return label;

    // Remove bracketed shortcuts (e.g., "Split Up [Ctrl-K Up]" -> "Split Up")
    let cleaned = label.replace(/\s*\[[^\]]+\]\s*$/, "").trim();

    // Check if label looks like a command (contains : and no spaces, or starts with package-like prefix)
    // e.g., "application.menu.settings-view:view-installed-packages" or "editor:select-all"
    // Exclude Windows paths like "C:\..." or "D:\..."
    if (cleaned.includes(":") && !cleaned.includes(" ") && !/^[a-zA-Z]:\\/.test(cleaned)) {
      // Extract the part after the last colon
      const commandPart = cleaned.split(":").pop();
      // Convert kebab-case to Title Case
      cleaned = commandPart
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    return cleaned;
  }
}

module.exports = { Utils };
