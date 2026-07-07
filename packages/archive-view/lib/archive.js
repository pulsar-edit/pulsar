/** @babel */

import util from "util";

const isErrorProperty = "isError";

if (typeof util[isErrorProperty] !== "function") {
  util[isErrorProperty] = (value) => {
    return value instanceof Error || Object.prototype.toString.call(value) === "[object Error]";
  };
}

const archive = require("@pulsar-edit/ls-archive");

export default archive;
