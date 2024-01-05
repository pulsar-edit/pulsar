var Module = typeof Module != "undefined" ? Module : {};
var TreeSitter = function() {
    function checkForAsmVersion(prop) {
      if (!(prop in Module['asm'])) {
        console.warn(`Warning: parser wants to call function ${prop}, but it is not defined. If parsing fails, this is probably the reason why. Please report this to the Pulsar team so that this parser can be supported properly.`);
      }
    }
    var initPromise;
    var document = typeof window == "object" ? {
        currentScript: window.document.currentScript
    } : null;
    class Parser {
        constructor() {
            this.initialize()
        }
        initialize() {
            throw new Error("cannot construct a Parser before calling `init()`")
        }
        static init(moduleOptions) {
            if (initPromise) return initPromise;
            Module = Object.assign({}, Module, moduleOptions);
            return initPromise = new Promise(resolveInitPromise => {
                var moduleOverrides = Object.assign({}, Module);
                var arguments_ = [];
                var thisProgram = "./this.program";
                var quit_ = (status, toThrow) => {
                    throw toThrow
                };
                var ENVIRONMENT_IS_WEB = typeof window == "object";
                var ENVIRONMENT_IS_WORKER = typeof importScripts == "function";
                var ENVIRONMENT_IS_NODE = typeof process == "object" && typeof process.versions == "object" && typeof process.versions.node == "string";
                var scriptDirectory = "";

                function locateFile(path) {
                    if (Module["locateFile"]) {
                        return Module["locateFile"](path, scriptDirectory)
                    }
                    return scriptDirectory + path
                }
                var read_, readAsync, readBinary, setWindowTitle;
                if (ENVIRONMENT_IS_NODE) {
                    var fs = require("fs");
                    var nodePath = require("path");
                    if (ENVIRONMENT_IS_WORKER) {
                        scriptDirectory = nodePath.dirname(scriptDirectory) + "/"
                    } else {
                        scriptDirectory = __dirname + "/"
                    }
                    read_ = (filename, binary) => {
                        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
                        return fs.readFileSync(filename, binary ? undefined : "utf8")
                    };
                    readBinary = filename => {
                        var ret = read_(filename, true);
                        if (!ret.buffer) {
                            ret = new Uint8Array(ret)
                        }
                        return ret
                    };
                    readAsync = (filename, onload, onerror) => {
                        filename = isFileURI(filename) ? new URL(filename) : nodePath.normalize(filename);
                        fs.readFile(filename, function(err, data) {
                            if (err) onerror(err);
                            else onload(data.buffer)
                        })
                    };
                    if (!Module["thisProgram"] && process.argv.length > 1) {
                        thisProgram = process.argv[1].replace(/\\/g, "/")
                    }
                    arguments_ = process.argv.slice(2);
                    if (typeof module != "undefined") {
                        module["exports"] = Module
                    }
                    quit_ = (status, toThrow) => {
                        process.exitCode = status;
                        throw toThrow
                    };
                    Module["inspect"] = function() {
                        return "[Emscripten Module object]"
                    }
                } else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
                    if (ENVIRONMENT_IS_WORKER) {
                        scriptDirectory = self.location.href
                    } else if (typeof document != "undefined" && document.currentScript) {
                        scriptDirectory = document.currentScript.src
                    }
                    if (scriptDirectory.indexOf("blob:") !== 0) {
                        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.replace(/[?#].*/, "").lastIndexOf("/") + 1)
                    } else {
                        scriptDirectory = ""
                    } {
                        read_ = url => {
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, false);
                            xhr.send(null);
                            return xhr.responseText
                        };
                        if (ENVIRONMENT_IS_WORKER) {
                            readBinary = url => {
                                var xhr = new XMLHttpRequest;
                                xhr.open("GET", url, false);
                                xhr.responseType = "arraybuffer";
                                xhr.send(null);
                                return new Uint8Array(xhr.response)
                            }
                        }
                        readAsync = (url, onload, onerror) => {
                            var xhr = new XMLHttpRequest;
                            xhr.open("GET", url, true);
                            xhr.responseType = "arraybuffer";
                            xhr.onload = () => {
                                if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                                    onload(xhr.response);
                                    return
                                }
                                onerror()
                            };
                            xhr.onerror = onerror;
                            xhr.send(null)
                        }
                    }
                    setWindowTitle = title => document.title = title
                } else {}
                var out = Module["print"] || console.log.bind(console);
                var err = Module["printErr"] || console.warn.bind(console);
                Object.assign(Module, moduleOverrides);
                moduleOverrides = null;
                if (Module["arguments"]) arguments_ = Module["arguments"];
                if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
                if (Module["quit"]) quit_ = Module["quit"];
                var dynamicLibraries = Module["dynamicLibraries"] || [];
                var wasmBinary;
                if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
                var noExitRuntime = Module["noExitRuntime"] || true;
                if (typeof WebAssembly != "object") {
                    abort("no native wasm support detected")
                }
                var wasmMemory;
                var ABORT = false;
                var EXITSTATUS;

                function assert(condition, text) {
                    if (!condition) {
                        abort(text)
                    }
                }
                var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;

                function updateMemoryViews() {
                    var b = wasmMemory.buffer;
                    Module["HEAP8"] = HEAP8 = new Int8Array(b);
                    Module["HEAP16"] = HEAP16 = new Int16Array(b);
                    Module["HEAP32"] = HEAP32 = new Int32Array(b);
                    Module["HEAPU8"] = HEAPU8 = new Uint8Array(b);
                    Module["HEAPU16"] = HEAPU16 = new Uint16Array(b);
                    Module["HEAPU32"] = HEAPU32 = new Uint32Array(b);
                    Module["HEAPF32"] = HEAPF32 = new Float32Array(b);
                    Module["HEAPF64"] = HEAPF64 = new Float64Array(b)
                }
                var INITIAL_MEMORY = Module["INITIAL_MEMORY"] || 33554432;
                assert(INITIAL_MEMORY >= 65536, "INITIAL_MEMORY should be larger than STACK_SIZE, was " + INITIAL_MEMORY + "! (STACK_SIZE=" + 65536 + ")");
                if (Module["wasmMemory"]) {
                    wasmMemory = Module["wasmMemory"]
                } else {
                    wasmMemory = new WebAssembly.Memory({
                        "initial": INITIAL_MEMORY / 65536,
                        "maximum": 2147483648 / 65536
                    })
                }
                updateMemoryViews();
                INITIAL_MEMORY = wasmMemory.buffer.byteLength;
                var wasmTable = new WebAssembly.Table({
                    "initial": 25,
                    "element": "anyfunc"
                });
                var __ATPRERUN__ = [];
                var __ATINIT__ = [];
                var __ATMAIN__ = [];
                var __ATPOSTRUN__ = [];
                var __RELOC_FUNCS__ = [];
                var runtimeInitialized = false;
                var runtimeKeepaliveCounter = 0;

                function keepRuntimeAlive() {
                    return noExitRuntime || runtimeKeepaliveCounter > 0
                }

                function preRun() {
                    if (Module["preRun"]) {
                        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
                        while (Module["preRun"].length) {
                            addOnPreRun(Module["preRun"].shift())
                        }
                    }
                    callRuntimeCallbacks(__ATPRERUN__)
                }

                function initRuntime() {
                    runtimeInitialized = true;
                    callRuntimeCallbacks(__RELOC_FUNCS__);
                    callRuntimeCallbacks(__ATINIT__)
                }

                function preMain() {
                    callRuntimeCallbacks(__ATMAIN__)
                }

                function postRun() {
                    if (Module["postRun"]) {
                        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
                        while (Module["postRun"].length) {
                            addOnPostRun(Module["postRun"].shift())
                        }
                    }
                    callRuntimeCallbacks(__ATPOSTRUN__)
                }

                function addOnPreRun(cb) {
                    __ATPRERUN__.unshift(cb)
                }

                function addOnInit(cb) {
                    __ATINIT__.unshift(cb)
                }

                function addOnPostRun(cb) {
                    __ATPOSTRUN__.unshift(cb)
                }
                var runDependencies = 0;
                var runDependencyWatcher = null;
                var dependenciesFulfilled = null;

                function addRunDependency(id) {
                    runDependencies++;
                    if (Module["monitorRunDependencies"]) {
                        Module["monitorRunDependencies"](runDependencies)
                    }
                }

                function removeRunDependency(id) {
                    runDependencies--;
                    if (Module["monitorRunDependencies"]) {
                        Module["monitorRunDependencies"](runDependencies)
                    }
                    if (runDependencies == 0) {
                        if (runDependencyWatcher !== null) {
                            clearInterval(runDependencyWatcher);
                            runDependencyWatcher = null
                        }
                        if (dependenciesFulfilled) {
                            var callback = dependenciesFulfilled;
                            dependenciesFulfilled = null;
                            callback()
                        }
                    }
                }

                function abort(what) {
                    if (Module["onAbort"]) {
                        Module["onAbort"](what)
                    }
                    what = "Aborted(" + what + ")";
                    err(what);
                    ABORT = true;
                    EXITSTATUS = 1;
                    what += ". Build with -sASSERTIONS for more info.";
                    var e = new WebAssembly.RuntimeError(what);
                    throw e
                }
                var dataURIPrefix = "data:application/octet-stream;base64,";

                function isDataURI(filename) {
                    return filename.startsWith(dataURIPrefix)
                }

                function isFileURI(filename) {
                    return filename.startsWith("file://")
                }
                var wasmBinaryFile;
                wasmBinaryFile = "tree-sitter.wasm";
                if (!isDataURI(wasmBinaryFile)) {
                    wasmBinaryFile = locateFile(wasmBinaryFile)
                }

                function getBinary(file) {
                    try {
                        if (file == wasmBinaryFile && wasmBinary) {
                            return new Uint8Array(wasmBinary)
                        }
                        if (readBinary) {
                            return readBinary(file)
                        }
                        throw "both async and sync fetching of the wasm failed"
                    } catch (err) {
                        abort(err)
                    }
                }

                function getBinaryPromise(binaryFile) {
                    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER)) {
                        if (typeof fetch == "function" && !isFileURI(binaryFile)) {
                            return fetch(binaryFile, {
                                credentials: "same-origin"
                            }).then(function(response) {
                                if (!response["ok"]) {
                                    throw "failed to load wasm binary file at '" + binaryFile + "'"
                                }
                                return response["arrayBuffer"]()
                            }).catch(function() {
                                return getBinary(binaryFile)
                            })
                        } else {
                            if (readAsync) {
                                return new Promise(function(resolve, reject) {
                                    readAsync(binaryFile, function(response) {
                                        resolve(new Uint8Array(response))
                                    }, reject)
                                })
                            }
                        }
                    }
                    return Promise.resolve().then(function() {
                        return getBinary(binaryFile)
                    })
                }

                function instantiateArrayBuffer(binaryFile, imports, receiver) {
                    return getBinaryPromise(binaryFile).then(function(binary) {
                        return WebAssembly.instantiate(binary, imports)
                    }).then(function(instance) {
                        return instance
                    }).then(receiver, function(reason) {
                        err("failed to asynchronously prepare wasm: " + reason);
                        abort(reason)
                    })
                }

                function instantiateAsync(binary, binaryFile, imports, callback) {
                    if (!binary && typeof WebAssembly.instantiateStreaming == "function" && !isDataURI(binaryFile) && !isFileURI(binaryFile) && !ENVIRONMENT_IS_NODE && typeof fetch == "function") {
                        return fetch(binaryFile, {
                            credentials: "same-origin"
                        }).then(function(response) {
                            var result = WebAssembly.instantiateStreaming(response, imports);
                            return result.then(callback, function(reason) {
                                err("wasm streaming compile failed: " + reason);
                                err("falling back to ArrayBuffer instantiation");
                                return instantiateArrayBuffer(binaryFile, imports, callback)
                            })
                        })
                    } else {
                        return instantiateArrayBuffer(binaryFile, imports, callback)
                    }
                }

                function createWasm() {
                    var info = {
                        "env": wasmImports,
                        "wasi_snapshot_preview1": wasmImports,
                        "GOT.mem": new Proxy(wasmImports, GOTHandler),
                        "GOT.func": new Proxy(wasmImports, GOTHandler)
                    };

                    function receiveInstance(instance, module) {
                        var exports = instance.exports;
                        exports = relocateExports(exports, 1024);
                        var metadata = getDylinkMetadata(module);
                        if (metadata.neededDynlibs) {
                            dynamicLibraries = metadata.neededDynlibs.concat(dynamicLibraries)
                        }
                        mergeLibSymbols(exports, "main");
                        Module["asm"] = exports;
                        addOnInit(Module["asm"]["__wasm_call_ctors"]);
                        __RELOC_FUNCS__.push(Module["asm"]["__wasm_apply_data_relocs"]);
                        removeRunDependency("wasm-instantiate");
                        return exports
                    }
                    addRunDependency("wasm-instantiate");

                    function receiveInstantiationResult(result) {
                        receiveInstance(result["instance"], result["module"])
                    }
                    if (Module["instantiateWasm"]) {
                        try {
                            return Module["instantiateWasm"](info, receiveInstance)
                        } catch (e) {
                            err("Module.instantiateWasm callback failed with error: " + e);
                            return false
                        }
                    }
                    instantiateAsync(wasmBinary, wasmBinaryFile, info, receiveInstantiationResult);
                    return {}
                }
                var tempDouble;
                var tempI64;
                var ASM_CONSTS = {};

                function ExitStatus(status) {
                    this.name = "ExitStatus";
                    this.message = "Program terminated with exit(" + status + ")";
                    this.status = status
                }
                var GOT = {};
                var currentModuleWeakSymbols = new Set([]);
                var GOTHandler = {
                    get: function(obj, symName) {
                        var rtn = GOT[symName];
                        if (!rtn) {
                            rtn = GOT[symName] = new WebAssembly.Global({
                                "value": "i32",
                                "mutable": true
                            })
                        }
                        if (!currentModuleWeakSymbols.has(symName)) {
                            rtn.required = true
                        }
                        return rtn
                    }
                };

                function callRuntimeCallbacks(callbacks) {
                    while (callbacks.length > 0) {
                        callbacks.shift()(Module)
                    }
                }
                var UTF8Decoder = typeof TextDecoder != "undefined" ? new TextDecoder("utf8") : undefined;

                function UTF8ArrayToString(heapOrArray, idx, maxBytesToRead) {
                    var endIdx = idx + maxBytesToRead;
                    var endPtr = idx;
                    while (heapOrArray[endPtr] && !(endPtr >= endIdx)) ++endPtr;
                    if (endPtr - idx > 16 && heapOrArray.buffer && UTF8Decoder) {
                        return UTF8Decoder.decode(heapOrArray.subarray(idx, endPtr))
                    }
                    var str = "";
                    while (idx < endPtr) {
                        var u0 = heapOrArray[idx++];
                        if (!(u0 & 128)) {
                            str += String.fromCharCode(u0);
                            continue
                        }
                        var u1 = heapOrArray[idx++] & 63;
                        if ((u0 & 224) == 192) {
                            str += String.fromCharCode((u0 & 31) << 6 | u1);
                            continue
                        }
                        var u2 = heapOrArray[idx++] & 63;
                        if ((u0 & 240) == 224) {
                            u0 = (u0 & 15) << 12 | u1 << 6 | u2
                        } else {
                            u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | heapOrArray[idx++] & 63
                        }
                        if (u0 < 65536) {
                            str += String.fromCharCode(u0)
                        } else {
                            var ch = u0 - 65536;
                            str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
                        }
                    }
                    return str
                }

                function getDylinkMetadata(binary) {
                    var offset = 0;
                    var end = 0;

                    function getU8() {
                        return binary[offset++]
                    }

                    function getLEB() {
                        var ret = 0;
                        var mul = 1;
                        while (1) {
                            var byte = binary[offset++];
                            ret += (byte & 127) * mul;
                            mul *= 128;
                            if (!(byte & 128)) break
                        }
                        return ret
                    }

                    function getString() {
                        var len = getLEB();
                        offset += len;
                        return UTF8ArrayToString(binary, offset - len, len)
                    }

                    function failIf(condition, message) {
                        if (condition) throw new Error(message)
                    }
                    var name = "dylink.0";
                    if (binary instanceof WebAssembly.Module) {
                        var dylinkSection = WebAssembly.Module.customSections(binary, name);
                        if (dylinkSection.length === 0) {
                            name = "dylink";
                            dylinkSection = WebAssembly.Module.customSections(binary, name)
                        }
                        failIf(dylinkSection.length === 0, "need dylink section");
                        binary = new Uint8Array(dylinkSection[0]);
                        end = binary.length
                    } else {
                        var int32View = new Uint32Array(new Uint8Array(binary.subarray(0, 24)).buffer);
                        var magicNumberFound = int32View[0] == 1836278016;
                        failIf(!magicNumberFound, "need to see wasm magic number");
                        failIf(binary[8] !== 0, "need the dylink section to be first");
                        offset = 9;
                        var section_size = getLEB();
                        end = offset + section_size;
                        name = getString()
                    }
                    var customSection = {
                        neededDynlibs: [],
                        tlsExports: new Set,
                        weakImports: new Set
                    };
                    if (name == "dylink") {
                        customSection.memorySize = getLEB();
                        customSection.memoryAlign = getLEB();
                        customSection.tableSize = getLEB();
                        customSection.tableAlign = getLEB();
                        var neededDynlibsCount = getLEB();
                        for (var i = 0; i < neededDynlibsCount; ++i) {
                            var libname = getString();
                            customSection.neededDynlibs.push(libname)
                        }
                    } else {
                        failIf(name !== "dylink.0");
                        var WASM_DYLINK_MEM_INFO = 1;
                        var WASM_DYLINK_NEEDED = 2;
                        var WASM_DYLINK_EXPORT_INFO = 3;
                        var WASM_DYLINK_IMPORT_INFO = 4;
                        var WASM_SYMBOL_TLS = 256;
                        var WASM_SYMBOL_BINDING_MASK = 3;
                        var WASM_SYMBOL_BINDING_WEAK = 1;
                        while (offset < end) {
                            var subsectionType = getU8();
                            var subsectionSize = getLEB();
                            if (subsectionType === WASM_DYLINK_MEM_INFO) {
                                customSection.memorySize = getLEB();
                                customSection.memoryAlign = getLEB();
                                customSection.tableSize = getLEB();
                                customSection.tableAlign = getLEB()
                            } else if (subsectionType === WASM_DYLINK_NEEDED) {
                                var neededDynlibsCount = getLEB();
                                for (var i = 0; i < neededDynlibsCount; ++i) {
                                    libname = getString();
                                    customSection.neededDynlibs.push(libname)
                                }
                            } else if (subsectionType === WASM_DYLINK_EXPORT_INFO) {
                                var count = getLEB();
                                while (count--) {
                                    var symname = getString();
                                    var flags = getLEB();
                                    if (flags & WASM_SYMBOL_TLS) {
                                        customSection.tlsExports.add(symname)
                                    }
                                }
                            } else if (subsectionType === WASM_DYLINK_IMPORT_INFO) {
                                var count = getLEB();
                                while (count--) {
                                    var modname = getString();
                                    var symname = getString();
                                    var flags = getLEB();
                                    if ((flags & WASM_SYMBOL_BINDING_MASK) == WASM_SYMBOL_BINDING_WEAK) {
                                        customSection.weakImports.add(symname)
                                    }
                                }
                            } else {
                                offset += subsectionSize
                            }
                        }
                    }
                    return customSection
                }

                function getValue(ptr, type = "i8") {
                    if (type.endsWith("*")) type = "*";
                    switch (type) {
                        case "i1":
                            return HEAP8[ptr >> 0];
                        case "i8":
                            return HEAP8[ptr >> 0];
                        case "i16":
                            return HEAP16[ptr >> 1];
                        case "i32":
                            return HEAP32[ptr >> 2];
                        case "i64":
                            return HEAP32[ptr >> 2];
                        case "float":
                            return HEAPF32[ptr >> 2];
                        case "double":
                            return HEAPF64[ptr >> 3];
                        case "*":
                            return HEAPU32[ptr >> 2];
                        default:
                            abort("invalid type for getValue: " + type)
                    }
                }

                function newDSO(name, handle, syms) {
                    var dso = {
                        refcount: Infinity,
                        name: name,
                        exports: syms,
                        global: true
                    };
                    LDSO.loadedLibsByName[name] = dso;
                    if (handle != undefined) {
                        LDSO.loadedLibsByHandle[handle] = dso
                    }
                    return dso
                }
                var LDSO = {
                    loadedLibsByName: {},
                    loadedLibsByHandle: {},
                    init: () => newDSO("__main__", 0, wasmImports)
                };
                var ___heap_base = 78160;

                function zeroMemory(address, size) {
                    HEAPU8.fill(0, address, address + size);
                    return address
                }

                function getMemory(size) {
                    if (runtimeInitialized) {
                        return zeroMemory(_malloc(size), size)
                    }
                    var ret = ___heap_base;
                    var end = ret + size + 15 & -16;
                    ___heap_base = end;
                    GOT["__heap_base"].value = end;
                    return ret
                }

                function isInternalSym(symName) {
                    return ["__cpp_exception", "__c_longjmp", "__wasm_apply_data_relocs", "__dso_handle", "__tls_size", "__tls_align", "__set_stack_limits", "_emscripten_tls_init", "__wasm_init_tls", "__wasm_call_ctors", "__start_em_asm", "__stop_em_asm"].includes(symName)
                }

                function uleb128Encode(n, target) {
                    if (n < 128) {
                        target.push(n)
                    } else {
                        target.push(n % 128 | 128, n >> 7)
                    }
                }

                function sigToWasmTypes(sig) {
                    var typeNames = {
                        "i": "i32",
                        "j": "i32",
                        "f": "f32",
                        "d": "f64",
                        "p": "i32"
                    };
                    var type = {
                        parameters: [],
                        results: sig[0] == "v" ? [] : [typeNames[sig[0]]]
                    };
                    for (var i = 1; i < sig.length; ++i) {
                        type.parameters.push(typeNames[sig[i]]);
                        if (sig[i] === "j") {
                            type.parameters.push("i32")
                        }
                    }
                    return type
                }

                function generateFuncType(sig, target) {
                    var sigRet = sig.slice(0, 1);
                    var sigParam = sig.slice(1);
                    var typeCodes = {
                        "i": 127,
                        "p": 127,
                        "j": 126,
                        "f": 125,
                        "d": 124
                    };
                    target.push(96);
                    uleb128Encode(sigParam.length, target);
                    for (var i = 0; i < sigParam.length; ++i) {
                        target.push(typeCodes[sigParam[i]])
                    }
                    if (sigRet == "v") {
                        target.push(0)
                    } else {
                        target.push(1, typeCodes[sigRet])
                    }
                }

                function convertJsFunctionToWasm(func, sig) {
                    if (typeof WebAssembly.Function == "function") {
                        return new WebAssembly.Function(sigToWasmTypes(sig), func)
                    }
                    var typeSectionBody = [1];
                    generateFuncType(sig, typeSectionBody);
                    var bytes = [0, 97, 115, 109, 1, 0, 0, 0, 1];
                    uleb128Encode(typeSectionBody.length, bytes);
                    bytes.push.apply(bytes, typeSectionBody);
                    bytes.push(2, 7, 1, 1, 101, 1, 102, 0, 0, 7, 5, 1, 1, 102, 0, 0);
                    var module = new WebAssembly.Module(new Uint8Array(bytes));
                    var instance = new WebAssembly.Instance(module, {
                        "e": {
                            "f": func
                        }
                    });
                    var wrappedFunc = instance.exports["f"];
                    return wrappedFunc
                }
                var wasmTableMirror = [];

                function getWasmTableEntry(funcPtr) {
                    var func = wasmTableMirror[funcPtr];
                    if (!func) {
                        if (funcPtr >= wasmTableMirror.length) wasmTableMirror.length = funcPtr + 1;
                        wasmTableMirror[funcPtr] = func = wasmTable.get(funcPtr)
                    }
                    return func
                }

                function updateTableMap(offset, count) {
                    if (functionsInTableMap) {
                        for (var i = offset; i < offset + count; i++) {
                            var item = getWasmTableEntry(i);
                            if (item) {
                                functionsInTableMap.set(item, i)
                            }
                        }
                    }
                }
                var functionsInTableMap = undefined;

                function getFunctionAddress(func) {
                    if (!functionsInTableMap) {
                        functionsInTableMap = new WeakMap;
                        updateTableMap(0, wasmTable.length)
                    }
                    return functionsInTableMap.get(func) || 0
                }
                var freeTableIndexes = [];

                function getEmptyTableSlot() {
                    if (freeTableIndexes.length) {
                        return freeTableIndexes.pop()
                    }
                    try {
                        wasmTable.grow(1)
                    } catch (err) {
                        if (!(err instanceof RangeError)) {
                            throw err
                        }
                        throw "Unable to grow wasm table. Set ALLOW_TABLE_GROWTH."
                    }
                    return wasmTable.length - 1
                }

                function setWasmTableEntry(idx, func) {
                    wasmTable.set(idx, func);
                    wasmTableMirror[idx] = wasmTable.get(idx)
                }

                function addFunction(func, sig) {
                    var rtn = getFunctionAddress(func);
                    if (rtn) {
                        return rtn
                    }
                    var ret = getEmptyTableSlot();
                    try {
                        setWasmTableEntry(ret, func)
                    } catch (err) {
                        if (!(err instanceof TypeError)) {
                            throw err
                        }
                        var wrapped = convertJsFunctionToWasm(func, sig);
                        setWasmTableEntry(ret, wrapped)
                    }
                    functionsInTableMap.set(func, ret);
                    return ret
                }

                function updateGOT(exports, replace) {
                    for (var symName in exports) {
                        if (isInternalSym(symName)) {
                            continue
                        }
                        var value = exports[symName];
                        if (symName.startsWith("orig$")) {
                            symName = symName.split("$")[1];
                            replace = true
                        }
                        if (!GOT[symName]) {
                            GOT[symName] = new WebAssembly.Global({
                                "value": "i32",
                                "mutable": true
                            })
                        }
                        if (replace || GOT[symName].value == 0) {
                            if (typeof value == "function") {
                                GOT[symName].value = addFunction(value)
                            } else if (typeof value == "number") {
                                GOT[symName].value = value
                            } else {
                                err("unhandled export type for `" + symName + "`: " + typeof value)
                            }
                        }
                    }
                }

                function relocateExports(exports, memoryBase, replace) {
                    var relocated = {};
                    for (var e in exports) {
                        var value = exports[e];
                        if (typeof value == "object") {
                            value = value.value
                        }
                        if (typeof value == "number") {
                            value += memoryBase
                        }
                        relocated[e] = value
                    }
                    updateGOT(relocated, replace);
                    return relocated
                }

                function isSymbolDefined(symName) {
                    var existing = wasmImports[symName];
                    if (!existing || existing.stub) {
                        return false
                    }
                    return true
                }

                function resolveGlobalSymbol(symName, direct = false) {
                    var sym;
                    if (direct && "orig$" + symName in wasmImports) {
                        symName = "orig$" + symName
                    }
                    if (isSymbolDefined(symName)) {
                        sym = wasmImports[symName]
                    } else if (symName.startsWith("invoke_")) {
                        sym = wasmImports[symName] = createInvokeFunction(symName.split("_")[1])
                    }
                    return {
                        sym: sym,
                        name: symName
                    }
                }

                function alignMemory(size, alignment) {
                    return Math.ceil(size / alignment) * alignment
                }

                function dynCallLegacy(sig, ptr, args) {
                    var f = Module["dynCall_" + sig];
                    return args && args.length ? f.apply(null, [ptr].concat(args)) : f.call(null, ptr)
                }

                function dynCall(sig, ptr, args) {
                    if (sig.includes("j")) {
                        return dynCallLegacy(sig, ptr, args)
                    }
                    var rtn = getWasmTableEntry(ptr).apply(null, args);
                    return rtn
                }

                function createInvokeFunction(sig) {
                    return function() {
                        var sp = stackSave();
                        try {
                            return dynCall(sig, arguments[0], Array.prototype.slice.call(arguments, 1))
                        } catch (e) {
                            stackRestore(sp);
                            if (e !== e + 0) throw e;
                            _setThrew(1, 0)
                        }
                    }
                }

                function UTF8ToString(ptr, maxBytesToRead) {
                    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
                }

                function loadWebAssemblyModule(binary, flags, localScope, handle) {
                    var metadata = getDylinkMetadata(binary);
                    currentModuleWeakSymbols = metadata.weakImports;

                    function loadModule() {
                        var firstLoad = !handle || !HEAP8[handle + 8 >> 0];
                        if (firstLoad) {
                            var memAlign = Math.pow(2, metadata.memoryAlign);
                            memAlign = Math.max(memAlign, 16);
                            var memoryBase = metadata.memorySize ? alignMemory(getMemory(metadata.memorySize + memAlign), memAlign) : 0;
                            var tableBase = metadata.tableSize ? wasmTable.length : 0;
                            if (handle) {
                                HEAP8[handle + 8 >> 0] = 1;
                                HEAPU32[handle + 12 >> 2] = memoryBase;
                                HEAP32[handle + 16 >> 2] = metadata.memorySize;
                                HEAPU32[handle + 20 >> 2] = tableBase;
                                HEAP32[handle + 24 >> 2] = metadata.tableSize
                            }
                        } else {
                            memoryBase = HEAPU32[handle + 12 >> 2];
                            tableBase = HEAPU32[handle + 20 >> 2]
                        }
                        var tableGrowthNeeded = tableBase + metadata.tableSize - wasmTable.length;
                        if (tableGrowthNeeded > 0) {
                            wasmTable.grow(tableGrowthNeeded)
                        }
                        var moduleExports;

                        function resolveSymbol(sym) {
                            var resolved = resolveGlobalSymbol(sym).sym;
                            if (!resolved && localScope) {
                                resolved = localScope[sym]
                            }
                            if (!resolved) {
                                resolved = moduleExports[sym]
                            }
                            return resolved
                        }
                        var proxyHandler = {
                            "get": function(stubs, prop) {
                                switch (prop) {
                                    case "__memory_base":
                                        return memoryBase;
                                    case "__table_base":
                                        return tableBase
                                }
                                if (prop in wasmImports && !wasmImports[prop].stub) {
                                    return wasmImports[prop]
                                }
                                if (!(prop in stubs)) {
                                    var resolved;
                                    stubs[prop] = function() {
                                        if (!resolved) resolved = resolveSymbol(prop);
                                        checkForAsmVersion(prop);
                                        return resolved.apply(null, arguments)
                                    }
                                }
                                return stubs[prop]
                            }
                        };
                        var proxy = new Proxy({}, proxyHandler);
                        var info = {
                            "GOT.mem": new Proxy({}, GOTHandler),
                            "GOT.func": new Proxy({}, GOTHandler),
                            "env": proxy,
                            wasi_snapshot_preview1: proxy
                        };

                        function postInstantiation(instance) {
                            updateTableMap(tableBase, metadata.tableSize);
                            moduleExports = relocateExports(instance.exports, memoryBase);
                            if (!flags.allowUndefined) {
                                reportUndefinedSymbols()
                            }

                            function addEmAsm(addr, body) {
                                var args = [];
                                var arity = 0;
                                for (; arity < 16; arity++) {
                                    if (body.indexOf("$" + arity) != -1) {
                                        args.push("$" + arity)
                                    } else {
                                        break
                                    }
                                }
                                args = args.join(",");
                                var func = "(" + args + " ) => { " + body + "};";
                                ASM_CONSTS[start] = eval(func)
                            }
                            if ("__start_em_asm" in moduleExports) {
                                var start = moduleExports["__start_em_asm"];
                                var stop = moduleExports["__stop_em_asm"];
                                while (start < stop) {
                                    var jsString = UTF8ToString(start);
                                    addEmAsm(start, jsString);
                                    start = HEAPU8.indexOf(0, start) + 1
                                }
                            }
                            var applyRelocs = moduleExports["__wasm_apply_data_relocs"];
                            if (applyRelocs) {
                                if (runtimeInitialized) {
                                    applyRelocs()
                                } else {
                                    __RELOC_FUNCS__.push(applyRelocs)
                                }
                            }
                            var init = moduleExports["__wasm_call_ctors"];
                            if (init) {
                                if (runtimeInitialized) {
                                    init()
                                } else {
                                    __ATINIT__.push(init)
                                }
                            }
                            return moduleExports
                        }
                        if (flags.loadAsync) {
                            if (binary instanceof WebAssembly.Module) {
                                var instance = new WebAssembly.Instance(binary, info);
                                return Promise.resolve(postInstantiation(instance))
                            }
                            return WebAssembly.instantiate(binary, info).then(function(result) {
                                return postInstantiation(result.instance)
                            })
                        }
                        var module = binary instanceof WebAssembly.Module ? binary : new WebAssembly.Module(binary);
                        var instance = new WebAssembly.Instance(module, info);
                        return postInstantiation(instance)
                    }
                    if (flags.loadAsync) {
                        return metadata.neededDynlibs.reduce(function(chain, dynNeeded) {
                            return chain.then(function() {
                                return loadDynamicLibrary(dynNeeded, flags)
                            })
                        }, Promise.resolve()).then(function() {
                            return loadModule()
                        })
                    }
                    metadata.neededDynlibs.forEach(function(dynNeeded) {
                        loadDynamicLibrary(dynNeeded, flags, localScope)
                    });
                    return loadModule()
                }

                function mergeLibSymbols(exports, libName) {
                    for (var sym in exports) {
                        if (!exports.hasOwnProperty(sym)) {
                            continue
                        }
                        const setImport = target => {
                            if (!isSymbolDefined(target)) {
                                wasmImports[target] = exports[sym]
                            }
                        };
                        setImport(sym);
                        const main_alias = "__main_argc_argv";
                        if (sym == "main") {
                            setImport(main_alias)
                        }
                        if (sym == main_alias) {
                            setImport("main")
                        }
                        if (sym.startsWith("dynCall_") && !Module.hasOwnProperty(sym)) {
                            Module[sym] = exports[sym]
                        }
                    }
                }

                function loadDynamicLibrary(libName, flags = {
                    global: true,
                    nodelete: true
                }, localScope, handle) {
                    var dso = LDSO.loadedLibsByName[libName];
                    if (dso) {
                        if (flags.global && !dso.global) {
                            dso.global = true;
                            if (dso.exports !== "loading") {
                                mergeLibSymbols(dso.exports, libName)
                            }
                        }
                        if (flags.nodelete && dso.refcount !== Infinity) {
                            dso.refcount = Infinity
                        }
                        dso.refcount++;
                        if (handle) {
                            LDSO.loadedLibsByHandle[handle] = dso
                        }
                        return flags.loadAsync ? Promise.resolve(true) : true
                    }
                    dso = newDSO(libName, handle, "loading");
                    dso.refcount = flags.nodelete ? Infinity : 1;
                    dso.global = flags.global;

                    function loadLibData() {
                        if (flags.fs && flags.fs.findObject(libName)) {
                            var libData = flags.fs.readFile(libName, {
                                encoding: "binary"
                            });
                            if (!(libData instanceof Uint8Array)) {
                                libData = new Uint8Array(libData)
                            }
                            return flags.loadAsync ? Promise.resolve(libData) : libData
                        }
                        var libFile = locateFile(libName);
                        if (flags.loadAsync) {
                            return new Promise(function(resolve, reject) {
                                readAsync(libFile, data => resolve(new Uint8Array(data)), reject)
                            })
                        }
                        if (!readBinary) {
                            throw new Error(libFile + ": file not found, and synchronous loading of external files is not available")
                        }
                        return readBinary(libFile)
                    }

                    function getExports() {
                        if (typeof preloadedWasm != "undefined" && preloadedWasm[libName]) {
                            var libModule = preloadedWasm[libName];
                            return flags.loadAsync ? Promise.resolve(libModule) : libModule
                        }
                        if (flags.loadAsync) {
                            return loadLibData().then(libData => loadWebAssemblyModule(libData, flags, localScope, handle))
                        }
                        return loadWebAssemblyModule(loadLibData(), flags, localScope, handle)
                    }

                    function moduleLoaded(exports) {
                        if (dso.global) {
                            mergeLibSymbols(exports, libName)
                        } else if (localScope) {
                            Object.assign(localScope, exports)
                        }
                        dso.exports = exports
                    }
                    if (flags.loadAsync) {
                        return getExports().then(exports => {
                            moduleLoaded(exports);
                            return true
                        })
                    }
                    moduleLoaded(getExports());
                    return true
                }

                function reportUndefinedSymbols() {
                    for (var symName in GOT) {
                        if (GOT[symName].value == 0) {
                            var value = resolveGlobalSymbol(symName, true).sym;
                            if (!value && !GOT[symName].required) {
                                continue
                            }
                            if (typeof value == "function") {
                                GOT[symName].value = addFunction(value, value.sig)
                            } else if (typeof value == "number") {
                                GOT[symName].value = value
                            } else {
                                throw new Error("bad export type for `" + symName + "`: " + typeof value)
                            }
                        }
                    }
                }

                function loadDylibs() {
                    if (!dynamicLibraries.length) {
                        reportUndefinedSymbols();
                        return
                    }
                    addRunDependency("loadDylibs");
                    dynamicLibraries.reduce(function(chain, lib) {
                        return chain.then(function() {
                            return loadDynamicLibrary(lib, {
                                loadAsync: true,
                                global: true,
                                nodelete: true,
                                allowUndefined: true
                            })
                        })
                    }, Promise.resolve()).then(function() {
                        reportUndefinedSymbols();
                        removeRunDependency("loadDylibs")
                    })
                }

                function setValue(ptr, value, type = "i8") {
                    if (type.endsWith("*")) type = "*";
                    switch (type) {
                        case "i1":
                            HEAP8[ptr >> 0] = value;
                            break;
                        case "i8":
                            HEAP8[ptr >> 0] = value;
                            break;
                        case "i16":
                            HEAP16[ptr >> 1] = value;
                            break;
                        case "i32":
                            HEAP32[ptr >> 2] = value;
                            break;
                        case "i64":
                            tempI64 = [value >>> 0, (tempDouble = value, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[ptr >> 2] = tempI64[0], HEAP32[ptr + 4 >> 2] = tempI64[1];
                            break;
                        case "float":
                            HEAPF32[ptr >> 2] = value;
                            break;
                        case "double":
                            HEAPF64[ptr >> 3] = value;
                            break;
                        case "*":
                            HEAPU32[ptr >> 2] = value;
                            break;
                        default:
                            abort("invalid type for setValue: " + type)
                    }
                }
                var ___memory_base = new WebAssembly.Global({
                    "value": "i32",
                    "mutable": false
                }, 1024);
                var ___stack_pointer = new WebAssembly.Global({
                    "value": "i32",
                    "mutable": true
                }, 78160);
                var ___table_base = new WebAssembly.Global({
                    "value": "i32",
                    "mutable": false
                }, 1);
                var nowIsMonotonic = true;

                function __emscripten_get_now_is_monotonic() {
                    return nowIsMonotonic
                }
                __emscripten_get_now_is_monotonic.sig = "i";

                function _abort() {
                    abort("")
                }
                Module["_abort"] = _abort;
                _abort.sig = "v";

                function _emscripten_date_now() {
                    return Date.now()
                }
                _emscripten_date_now.sig = "d";
                var _emscripten_get_now;
                if (ENVIRONMENT_IS_NODE) {
                    _emscripten_get_now = () => {
                        var t = process.hrtime();
                        return t[0] * 1e3 + t[1] / 1e6
                    }
                } else _emscripten_get_now = () => performance.now();
                _emscripten_get_now.sig = "d";

                function _emscripten_memcpy_big(dest, src, num) {
                    HEAPU8.copyWithin(dest, src, src + num)
                }
                _emscripten_memcpy_big.sig = "vppp";

                function getHeapMax() {
                    return 2147483648
                }

                function emscripten_realloc_buffer(size) {
                    var b = wasmMemory.buffer;
                    try {
                        wasmMemory.grow(size - b.byteLength + 65535 >>> 16);
                        updateMemoryViews();
                        return 1
                    } catch (e) {}
                }

                function _emscripten_resize_heap(requestedSize) {
                    var oldSize = HEAPU8.length;
                    requestedSize = requestedSize >>> 0;
                    var maxHeapSize = getHeapMax();
                    if (requestedSize > maxHeapSize) {
                        return false
                    }
                    let alignUp = (x, multiple) => x + (multiple - x % multiple) % multiple;
                    for (var cutDown = 1; cutDown <= 4; cutDown *= 2) {
                        var overGrownHeapSize = oldSize * (1 + .2 / cutDown);
                        overGrownHeapSize = Math.min(overGrownHeapSize, requestedSize + 100663296);
                        var newSize = Math.min(maxHeapSize, alignUp(Math.max(requestedSize, overGrownHeapSize), 65536));
                        var replacement = emscripten_realloc_buffer(newSize);
                        if (replacement) {
                            return true
                        }
                    }
                    return false
                }
                _emscripten_resize_heap.sig = "ip";
                var SYSCALLS = {
                    DEFAULT_POLLMASK: 5,
                    calculateAt: function(dirfd, path, allowEmpty) {
                        if (PATH.isAbs(path)) {
                            return path
                        }
                        var dir;
                        if (dirfd === -100) {
                            dir = FS.cwd()
                        } else {
                            var dirstream = SYSCALLS.getStreamFromFD(dirfd);
                            dir = dirstream.path
                        }
                        if (path.length == 0) {
                            if (!allowEmpty) {
                                throw new FS.ErrnoError(44)
                            }
                            return dir
                        }
                        return PATH.join2(dir, path)
                    },
                    doStat: function(func, path, buf) {
                        try {
                            var stat = func(path)
                        } catch (e) {
                            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                                return -54
                            }
                            throw e
                        }
                        HEAP32[buf >> 2] = stat.dev;
                        HEAP32[buf + 8 >> 2] = stat.ino;
                        HEAP32[buf + 12 >> 2] = stat.mode;
                        HEAPU32[buf + 16 >> 2] = stat.nlink;
                        HEAP32[buf + 20 >> 2] = stat.uid;
                        HEAP32[buf + 24 >> 2] = stat.gid;
                        HEAP32[buf + 28 >> 2] = stat.rdev;
                        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 40 >> 2] = tempI64[0], HEAP32[buf + 44 >> 2] = tempI64[1];
                        HEAP32[buf + 48 >> 2] = 4096;
                        HEAP32[buf + 52 >> 2] = stat.blocks;
                        var atime = stat.atime.getTime();
                        var mtime = stat.mtime.getTime();
                        var ctime = stat.ctime.getTime();
                        tempI64 = [Math.floor(atime / 1e3) >>> 0, (tempDouble = Math.floor(atime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 56 >> 2] = tempI64[0], HEAP32[buf + 60 >> 2] = tempI64[1];
                        HEAPU32[buf + 64 >> 2] = atime % 1e3 * 1e3;
                        tempI64 = [Math.floor(mtime / 1e3) >>> 0, (tempDouble = Math.floor(mtime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 72 >> 2] = tempI64[0], HEAP32[buf + 76 >> 2] = tempI64[1];
                        HEAPU32[buf + 80 >> 2] = mtime % 1e3 * 1e3;
                        tempI64 = [Math.floor(ctime / 1e3) >>> 0, (tempDouble = Math.floor(ctime / 1e3), +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 88 >> 2] = tempI64[0], HEAP32[buf + 92 >> 2] = tempI64[1];
                        HEAPU32[buf + 96 >> 2] = ctime % 1e3 * 1e3;
                        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[buf + 104 >> 2] = tempI64[0], HEAP32[buf + 108 >> 2] = tempI64[1];
                        return 0
                    },
                    doMsync: function(addr, stream, len, flags, offset) {
                        if (!FS.isFile(stream.node.mode)) {
                            throw new FS.ErrnoError(43)
                        }
                        if (flags & 2) {
                            return 0
                        }
                        var buffer = HEAPU8.slice(addr, addr + len);
                        FS.msync(stream, buffer, offset, len, flags)
                    },
                    varargs: undefined,
                    get: function() {
                        SYSCALLS.varargs += 4;
                        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
                        return ret
                    },
                    getStr: function(ptr) {
                        var ret = UTF8ToString(ptr);
                        return ret
                    },
                    getStreamFromFD: function(fd) {
                        var stream = FS.getStream(fd);
                        if (!stream) throw new FS.ErrnoError(8);
                        return stream
                    }
                };

                function _fd_close(fd) {
                    try {
                        var stream = SYSCALLS.getStreamFromFD(fd);
                        FS.close(stream);
                        return 0
                    } catch (e) {
                        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
                        return e.errno
                    }
                }
                _fd_close.sig = "ii";

                function convertI32PairToI53Checked(lo, hi) {
                    return hi + 2097152 >>> 0 < 4194305 - !!lo ? (lo >>> 0) + hi * 4294967296 : NaN
                }

                function _fd_seek(fd, offset_low, offset_high, whence, newOffset) {
                    try {
                        var offset = convertI32PairToI53Checked(offset_low, offset_high);
                        if (isNaN(offset)) return 61;
                        var stream = SYSCALLS.getStreamFromFD(fd);
                        FS.llseek(stream, offset, whence);
                        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math.abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math.min(+Math.floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~+Math.ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)], HEAP32[newOffset >> 2] = tempI64[0], HEAP32[newOffset + 4 >> 2] = tempI64[1];
                        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
                        return 0
                    } catch (e) {
                        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
                        return e.errno
                    }
                }
                _fd_seek.sig = "iijip";

                function doWritev(stream, iov, iovcnt, offset) {
                    var ret = 0;
                    for (var i = 0; i < iovcnt; i++) {
                        var ptr = HEAPU32[iov >> 2];
                        var len = HEAPU32[iov + 4 >> 2];
                        iov += 8;
                        var curr = FS.write(stream, HEAP8, ptr, len, offset);
                        if (curr < 0) return -1;
                        ret += curr;
                        if (typeof offset !== "undefined") {
                            offset += curr
                        }
                    }
                    return ret
                }

                function _fd_write(fd, iov, iovcnt, pnum) {
                    try {
                        var stream = SYSCALLS.getStreamFromFD(fd);
                        var num = doWritev(stream, iov, iovcnt);
                        HEAPU32[pnum >> 2] = num;
                        return 0
                    } catch (e) {
                        if (typeof FS == "undefined" || !(e.name === "ErrnoError")) throw e;
                        return e.errno
                    }
                }
                _fd_write.sig = "iippp";

                function _tree_sitter_log_callback(isLexMessage, messageAddress) {
                    if (currentLogCallback) {
                        const message = UTF8ToString(messageAddress);
                        currentLogCallback(message, isLexMessage !== 0)
                    }
                }

                function _tree_sitter_parse_callback(inputBufferAddress, index, row, column, lengthAddress) {
                    var INPUT_BUFFER_SIZE = 10 * 1024;
                    var string = currentParseCallback(index, {
                        row: row,
                        column: column
                    });
                    if (typeof string === "string") {
                        setValue(lengthAddress, string.length, "i32");
                        stringToUTF16(string, inputBufferAddress, INPUT_BUFFER_SIZE)
                    } else {
                        setValue(lengthAddress, 0, "i32")
                    }
                }

                function _proc_exit(code) {
                    EXITSTATUS = code;
                    if (!keepRuntimeAlive()) {
                        if (Module["onExit"]) Module["onExit"](code);
                        ABORT = true
                    }
                    quit_(code, new ExitStatus(code))
                }
                _proc_exit.sig = "vi";

                function exitJS(status, implicit) {
                    EXITSTATUS = status;
                    _proc_exit(status)
                }

                function handleException(e) {
                    if (e instanceof ExitStatus || e == "unwind") {
                        return EXITSTATUS
                    }
                    quit_(1, e)
                }

                function lengthBytesUTF8(str) {
                    var len = 0;
                    for (var i = 0; i < str.length; ++i) {
                        var c = str.charCodeAt(i);
                        if (c <= 127) {
                            len++
                        } else if (c <= 2047) {
                            len += 2
                        } else if (c >= 55296 && c <= 57343) {
                            len += 4;
                            ++i
                        } else {
                            len += 3
                        }
                    }
                    return len
                }

                function stringToUTF8Array(str, heap, outIdx, maxBytesToWrite) {
                    if (!(maxBytesToWrite > 0)) return 0;
                    var startIdx = outIdx;
                    var endIdx = outIdx + maxBytesToWrite - 1;
                    for (var i = 0; i < str.length; ++i) {
                        var u = str.charCodeAt(i);
                        if (u >= 55296 && u <= 57343) {
                            var u1 = str.charCodeAt(++i);
                            u = 65536 + ((u & 1023) << 10) | u1 & 1023
                        }
                        if (u <= 127) {
                            if (outIdx >= endIdx) break;
                            heap[outIdx++] = u
                        } else if (u <= 2047) {
                            if (outIdx + 1 >= endIdx) break;
                            heap[outIdx++] = 192 | u >> 6;
                            heap[outIdx++] = 128 | u & 63
                        } else if (u <= 65535) {
                            if (outIdx + 2 >= endIdx) break;
                            heap[outIdx++] = 224 | u >> 12;
                            heap[outIdx++] = 128 | u >> 6 & 63;
                            heap[outIdx++] = 128 | u & 63
                        } else {
                            if (outIdx + 3 >= endIdx) break;
                            heap[outIdx++] = 240 | u >> 18;
                            heap[outIdx++] = 128 | u >> 12 & 63;
                            heap[outIdx++] = 128 | u >> 6 & 63;
                            heap[outIdx++] = 128 | u & 63
                        }
                    }
                    heap[outIdx] = 0;
                    return outIdx - startIdx
                }

                function stringToUTF8(str, outPtr, maxBytesToWrite) {
                    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
                }

                function stringToUTF8OnStack(str) {
                    var size = lengthBytesUTF8(str) + 1;
                    var ret = stackAlloc(size);
                    stringToUTF8(str, ret, size);
                    return ret
                }

                function stringToUTF16(str, outPtr, maxBytesToWrite) {
                    if (maxBytesToWrite === undefined) {
                        maxBytesToWrite = 2147483647
                    }
                    if (maxBytesToWrite < 2) return 0;
                    maxBytesToWrite -= 2;
                    var startPtr = outPtr;
                    var numCharsToWrite = maxBytesToWrite < str.length * 2 ? maxBytesToWrite / 2 : str.length;
                    for (var i = 0; i < numCharsToWrite; ++i) {
                        var codeUnit = str.charCodeAt(i);
                        HEAP16[outPtr >> 1] = codeUnit;
                        outPtr += 2
                    }
                    HEAP16[outPtr >> 1] = 0;
                    return outPtr - startPtr
                }

                function AsciiToString(ptr) {
                    var str = "";
                    while (1) {
                        var ch = HEAPU8[ptr++ >> 0];
                        if (!ch) return str;
                        str += String.fromCharCode(ch)
                    }
                }
                var wasmImports = {
                    "__heap_base": ___heap_base,
                    "__indirect_function_table": wasmTable,
                    "__memory_base": ___memory_base,
                    "__stack_pointer": ___stack_pointer,
                    "__table_base": ___table_base,
                    "_emscripten_get_now_is_monotonic": __emscripten_get_now_is_monotonic,
                    "abort": _abort,
                    "emscripten_get_now": _emscripten_get_now,
                    "emscripten_memcpy_big": _emscripten_memcpy_big,
                    "emscripten_resize_heap": _emscripten_resize_heap,
                    "fd_close": _fd_close,
                    "fd_seek": _fd_seek,
                    "fd_write": _fd_write,
                    "memory": wasmMemory,
                    "tree_sitter_log_callback": _tree_sitter_log_callback,
                    "tree_sitter_parse_callback": _tree_sitter_parse_callback
                };
                var asm = createWasm();
                var ___wasm_call_ctors = function() {
                    return (___wasm_call_ctors = Module["asm"]["__wasm_call_ctors"]).apply(null, arguments)
                };
                var ___wasm_apply_data_relocs = Module["___wasm_apply_data_relocs"] = function() {
                    return (___wasm_apply_data_relocs = Module["___wasm_apply_data_relocs"] = Module["asm"]["__wasm_apply_data_relocs"]).apply(null, arguments)
                };
                var _malloc = Module["_malloc"] = function() {
                    return (_malloc = Module["_malloc"] = Module["asm"]["malloc"]).apply(null, arguments)
                };
                var _calloc = Module["_calloc"] = function() {
                    return (_calloc = Module["_calloc"] = Module["asm"]["calloc"]).apply(null, arguments)
                };
                var _realloc = Module["_realloc"] = function() {
                    return (_realloc = Module["_realloc"] = Module["asm"]["realloc"]).apply(null, arguments)
                };
                var _free = Module["_free"] = function() {
                    return (_free = Module["_free"] = Module["asm"]["free"]).apply(null, arguments)
                };
                var _ts_language_symbol_count = Module["_ts_language_symbol_count"] = function() {
                    return (_ts_language_symbol_count = Module["_ts_language_symbol_count"] = Module["asm"]["ts_language_symbol_count"]).apply(null, arguments)
                };
                var _ts_language_state_count = Module["_ts_language_state_count"] = function() {
                    return (_ts_language_state_count = Module["_ts_language_state_count"] = Module["asm"]["ts_language_state_count"]).apply(null, arguments)
                };
                var _ts_language_version = Module["_ts_language_version"] = function() {
                    return (_ts_language_version = Module["_ts_language_version"] = Module["asm"]["ts_language_version"]).apply(null, arguments)
                };
                var _ts_language_field_count = Module["_ts_language_field_count"] = function() {
                    return (_ts_language_field_count = Module["_ts_language_field_count"] = Module["asm"]["ts_language_field_count"]).apply(null, arguments)
                };
                var _ts_language_next_state = Module["_ts_language_next_state"] = function() {
                    return (_ts_language_next_state = Module["_ts_language_next_state"] = Module["asm"]["ts_language_next_state"]).apply(null, arguments)
                };
                var _ts_language_symbol_name = Module["_ts_language_symbol_name"] = function() {
                    return (_ts_language_symbol_name = Module["_ts_language_symbol_name"] = Module["asm"]["ts_language_symbol_name"]).apply(null, arguments)
                };
                var _ts_language_symbol_for_name = Module["_ts_language_symbol_for_name"] = function() {
                    return (_ts_language_symbol_for_name = Module["_ts_language_symbol_for_name"] = Module["asm"]["ts_language_symbol_for_name"]).apply(null, arguments)
                };
                var _strncmp = Module["_strncmp"] = function() {
                    return (_strncmp = Module["_strncmp"] = Module["asm"]["strncmp"]).apply(null, arguments)
                };
                var _ts_language_symbol_type = Module["_ts_language_symbol_type"] = function() {
                    return (_ts_language_symbol_type = Module["_ts_language_symbol_type"] = Module["asm"]["ts_language_symbol_type"]).apply(null, arguments)
                };
                var _ts_language_field_name_for_id = Module["_ts_language_field_name_for_id"] = function() {
                    return (_ts_language_field_name_for_id = Module["_ts_language_field_name_for_id"] = Module["asm"]["ts_language_field_name_for_id"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_new = Module["_ts_lookahead_iterator_new"] = function() {
                    return (_ts_lookahead_iterator_new = Module["_ts_lookahead_iterator_new"] = Module["asm"]["ts_lookahead_iterator_new"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_delete = Module["_ts_lookahead_iterator_delete"] = function() {
                    return (_ts_lookahead_iterator_delete = Module["_ts_lookahead_iterator_delete"] = Module["asm"]["ts_lookahead_iterator_delete"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_reset_state = Module["_ts_lookahead_iterator_reset_state"] = function() {
                    return (_ts_lookahead_iterator_reset_state = Module["_ts_lookahead_iterator_reset_state"] = Module["asm"]["ts_lookahead_iterator_reset_state"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_reset = Module["_ts_lookahead_iterator_reset"] = function() {
                    return (_ts_lookahead_iterator_reset = Module["_ts_lookahead_iterator_reset"] = Module["asm"]["ts_lookahead_iterator_reset"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_next = Module["_ts_lookahead_iterator_next"] = function() {
                    return (_ts_lookahead_iterator_next = Module["_ts_lookahead_iterator_next"] = Module["asm"]["ts_lookahead_iterator_next"]).apply(null, arguments)
                };
                var _ts_lookahead_iterator_current_symbol = Module["_ts_lookahead_iterator_current_symbol"] = function() {
                    return (_ts_lookahead_iterator_current_symbol = Module["_ts_lookahead_iterator_current_symbol"] = Module["asm"]["ts_lookahead_iterator_current_symbol"]).apply(null, arguments)
                };
                var _memset = Module["_memset"] = function() {
                    return (_memset = Module["_memset"] = Module["asm"]["memset"]).apply(null, arguments)
                };
                var _memcpy = Module["_memcpy"] = function() {
                    return (_memcpy = Module["_memcpy"] = Module["asm"]["memcpy"]).apply(null, arguments)
                };
                var _ts_parser_delete = Module["_ts_parser_delete"] = function() {
                    return (_ts_parser_delete = Module["_ts_parser_delete"] = Module["asm"]["ts_parser_delete"]).apply(null, arguments)
                };
                var _ts_parser_reset = Module["_ts_parser_reset"] = function() {
                    return (_ts_parser_reset = Module["_ts_parser_reset"] = Module["asm"]["ts_parser_reset"]).apply(null, arguments)
                };
                var _ts_parser_set_language = Module["_ts_parser_set_language"] = function() {
                    return (_ts_parser_set_language = Module["_ts_parser_set_language"] = Module["asm"]["ts_parser_set_language"]).apply(null, arguments)
                };
                var _ts_parser_timeout_micros = Module["_ts_parser_timeout_micros"] = function() {
                    return (_ts_parser_timeout_micros = Module["_ts_parser_timeout_micros"] = Module["asm"]["ts_parser_timeout_micros"]).apply(null, arguments)
                };
                var _ts_parser_set_timeout_micros = Module["_ts_parser_set_timeout_micros"] = function() {
                    return (_ts_parser_set_timeout_micros = Module["_ts_parser_set_timeout_micros"] = Module["asm"]["ts_parser_set_timeout_micros"]).apply(null, arguments)
                };
                var _memmove = Module["_memmove"] = function() {
                    return (_memmove = Module["_memmove"] = Module["asm"]["memmove"]).apply(null, arguments)
                };
                var _memcmp = Module["_memcmp"] = function() {
                    return (_memcmp = Module["_memcmp"] = Module["asm"]["memcmp"]).apply(null, arguments)
                };
                var _ts_query_new = Module["_ts_query_new"] = function() {
                    return (_ts_query_new = Module["_ts_query_new"] = Module["asm"]["ts_query_new"]).apply(null, arguments)
                };
                var _ts_query_delete = Module["_ts_query_delete"] = function() {
                    return (_ts_query_delete = Module["_ts_query_delete"] = Module["asm"]["ts_query_delete"]).apply(null, arguments)
                };
                var _iswspace = Module["_iswspace"] = function() {
                    return (_iswspace = Module["_iswspace"] = Module["asm"]["iswspace"]).apply(null, arguments)
                };
                var _iswalnum = Module["_iswalnum"] = function() {
                    return (_iswalnum = Module["_iswalnum"] = Module["asm"]["iswalnum"]).apply(null, arguments)
                };
                var _ts_query_pattern_count = Module["_ts_query_pattern_count"] = function() {
                    return (_ts_query_pattern_count = Module["_ts_query_pattern_count"] = Module["asm"]["ts_query_pattern_count"]).apply(null, arguments)
                };
                var _ts_query_capture_count = Module["_ts_query_capture_count"] = function() {
                    return (_ts_query_capture_count = Module["_ts_query_capture_count"] = Module["asm"]["ts_query_capture_count"]).apply(null, arguments)
                };
                var _ts_query_string_count = Module["_ts_query_string_count"] = function() {
                    return (_ts_query_string_count = Module["_ts_query_string_count"] = Module["asm"]["ts_query_string_count"]).apply(null, arguments)
                };
                var _ts_query_capture_name_for_id = Module["_ts_query_capture_name_for_id"] = function() {
                    return (_ts_query_capture_name_for_id = Module["_ts_query_capture_name_for_id"] = Module["asm"]["ts_query_capture_name_for_id"]).apply(null, arguments)
                };
                var _ts_query_string_value_for_id = Module["_ts_query_string_value_for_id"] = function() {
                    return (_ts_query_string_value_for_id = Module["_ts_query_string_value_for_id"] = Module["asm"]["ts_query_string_value_for_id"]).apply(null, arguments)
                };
                var _ts_query_predicates_for_pattern = Module["_ts_query_predicates_for_pattern"] = function() {
                    return (_ts_query_predicates_for_pattern = Module["_ts_query_predicates_for_pattern"] = Module["asm"]["ts_query_predicates_for_pattern"]).apply(null, arguments)
                };
                var _ts_tree_copy = Module["_ts_tree_copy"] = function() {
                    return (_ts_tree_copy = Module["_ts_tree_copy"] = Module["asm"]["ts_tree_copy"]).apply(null, arguments)
                };
                var _ts_tree_delete = Module["_ts_tree_delete"] = function() {
                    return (_ts_tree_delete = Module["_ts_tree_delete"] = Module["asm"]["ts_tree_delete"]).apply(null, arguments)
                };
                var _ts_init = Module["_ts_init"] = function() {
                    return (_ts_init = Module["_ts_init"] = Module["asm"]["ts_init"]).apply(null, arguments)
                };
                var _ts_parser_new_wasm = Module["_ts_parser_new_wasm"] = function() {
                    return (_ts_parser_new_wasm = Module["_ts_parser_new_wasm"] = Module["asm"]["ts_parser_new_wasm"]).apply(null, arguments)
                };
                var _ts_parser_enable_logger_wasm = Module["_ts_parser_enable_logger_wasm"] = function() {
                    return (_ts_parser_enable_logger_wasm = Module["_ts_parser_enable_logger_wasm"] = Module["asm"]["ts_parser_enable_logger_wasm"]).apply(null, arguments)
                };
                var _ts_parser_parse_wasm = Module["_ts_parser_parse_wasm"] = function() {
                    return (_ts_parser_parse_wasm = Module["_ts_parser_parse_wasm"] = Module["asm"]["ts_parser_parse_wasm"]).apply(null, arguments)
                };
                var _ts_language_type_is_named_wasm = Module["_ts_language_type_is_named_wasm"] = function() {
                    return (_ts_language_type_is_named_wasm = Module["_ts_language_type_is_named_wasm"] = Module["asm"]["ts_language_type_is_named_wasm"]).apply(null, arguments)
                };
                var _ts_language_type_is_visible_wasm = Module["_ts_language_type_is_visible_wasm"] = function() {
                    return (_ts_language_type_is_visible_wasm = Module["_ts_language_type_is_visible_wasm"] = Module["asm"]["ts_language_type_is_visible_wasm"]).apply(null, arguments)
                };
                var _ts_tree_root_node_wasm = Module["_ts_tree_root_node_wasm"] = function() {
                    return (_ts_tree_root_node_wasm = Module["_ts_tree_root_node_wasm"] = Module["asm"]["ts_tree_root_node_wasm"]).apply(null, arguments)
                };
                var _ts_tree_edit_wasm = Module["_ts_tree_edit_wasm"] = function() {
                    return (_ts_tree_edit_wasm = Module["_ts_tree_edit_wasm"] = Module["asm"]["ts_tree_edit_wasm"]).apply(null, arguments)
                };
                var _ts_tree_get_changed_ranges_wasm = Module["_ts_tree_get_changed_ranges_wasm"] = function() {
                    return (_ts_tree_get_changed_ranges_wasm = Module["_ts_tree_get_changed_ranges_wasm"] = Module["asm"]["ts_tree_get_changed_ranges_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_new_wasm = Module["_ts_tree_cursor_new_wasm"] = function() {
                    return (_ts_tree_cursor_new_wasm = Module["_ts_tree_cursor_new_wasm"] = Module["asm"]["ts_tree_cursor_new_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_delete_wasm = Module["_ts_tree_cursor_delete_wasm"] = function() {
                    return (_ts_tree_cursor_delete_wasm = Module["_ts_tree_cursor_delete_wasm"] = Module["asm"]["ts_tree_cursor_delete_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_reset_wasm = Module["_ts_tree_cursor_reset_wasm"] = function() {
                    return (_ts_tree_cursor_reset_wasm = Module["_ts_tree_cursor_reset_wasm"] = Module["asm"]["ts_tree_cursor_reset_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_reset_to_wasm = Module["_ts_tree_cursor_reset_to_wasm"] = function() {
                    return (_ts_tree_cursor_reset_to_wasm = Module["_ts_tree_cursor_reset_to_wasm"] = Module["asm"]["ts_tree_cursor_reset_to_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_goto_first_child_wasm = Module["_ts_tree_cursor_goto_first_child_wasm"] = function() {
                    return (_ts_tree_cursor_goto_first_child_wasm = Module["_ts_tree_cursor_goto_first_child_wasm"] = Module["asm"]["ts_tree_cursor_goto_first_child_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_goto_last_child_wasm = Module["_ts_tree_cursor_goto_last_child_wasm"] = function() {
                    return (_ts_tree_cursor_goto_last_child_wasm = Module["_ts_tree_cursor_goto_last_child_wasm"] = Module["asm"]["ts_tree_cursor_goto_last_child_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_goto_next_sibling_wasm = Module["_ts_tree_cursor_goto_next_sibling_wasm"] = function() {
                    return (_ts_tree_cursor_goto_next_sibling_wasm = Module["_ts_tree_cursor_goto_next_sibling_wasm"] = Module["asm"]["ts_tree_cursor_goto_next_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_goto_previous_sibling_wasm = Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = function() {
                    return (_ts_tree_cursor_goto_previous_sibling_wasm = Module["_ts_tree_cursor_goto_previous_sibling_wasm"] = Module["asm"]["ts_tree_cursor_goto_previous_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_goto_parent_wasm = Module["_ts_tree_cursor_goto_parent_wasm"] = function() {
                    return (_ts_tree_cursor_goto_parent_wasm = Module["_ts_tree_cursor_goto_parent_wasm"] = Module["asm"]["ts_tree_cursor_goto_parent_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_type_id_wasm = Module["_ts_tree_cursor_current_node_type_id_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_type_id_wasm = Module["_ts_tree_cursor_current_node_type_id_wasm"] = Module["asm"]["ts_tree_cursor_current_node_type_id_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_state_id_wasm = Module["_ts_tree_cursor_current_node_state_id_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_state_id_wasm = Module["_ts_tree_cursor_current_node_state_id_wasm"] = Module["asm"]["ts_tree_cursor_current_node_state_id_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_is_named_wasm = Module["_ts_tree_cursor_current_node_is_named_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_is_named_wasm = Module["_ts_tree_cursor_current_node_is_named_wasm"] = Module["asm"]["ts_tree_cursor_current_node_is_named_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_is_missing_wasm = Module["_ts_tree_cursor_current_node_is_missing_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_is_missing_wasm = Module["_ts_tree_cursor_current_node_is_missing_wasm"] = Module["asm"]["ts_tree_cursor_current_node_is_missing_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_id_wasm = Module["_ts_tree_cursor_current_node_id_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_id_wasm = Module["_ts_tree_cursor_current_node_id_wasm"] = Module["asm"]["ts_tree_cursor_current_node_id_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_start_position_wasm = Module["_ts_tree_cursor_start_position_wasm"] = function() {
                    return (_ts_tree_cursor_start_position_wasm = Module["_ts_tree_cursor_start_position_wasm"] = Module["asm"]["ts_tree_cursor_start_position_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_end_position_wasm = Module["_ts_tree_cursor_end_position_wasm"] = function() {
                    return (_ts_tree_cursor_end_position_wasm = Module["_ts_tree_cursor_end_position_wasm"] = Module["asm"]["ts_tree_cursor_end_position_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_start_index_wasm = Module["_ts_tree_cursor_start_index_wasm"] = function() {
                    return (_ts_tree_cursor_start_index_wasm = Module["_ts_tree_cursor_start_index_wasm"] = Module["asm"]["ts_tree_cursor_start_index_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_end_index_wasm = Module["_ts_tree_cursor_end_index_wasm"] = function() {
                    return (_ts_tree_cursor_end_index_wasm = Module["_ts_tree_cursor_end_index_wasm"] = Module["asm"]["ts_tree_cursor_end_index_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_field_id_wasm = Module["_ts_tree_cursor_current_field_id_wasm"] = function() {
                    return (_ts_tree_cursor_current_field_id_wasm = Module["_ts_tree_cursor_current_field_id_wasm"] = Module["asm"]["ts_tree_cursor_current_field_id_wasm"]).apply(null, arguments)
                };
                var _ts_tree_cursor_current_node_wasm = Module["_ts_tree_cursor_current_node_wasm"] = function() {
                    return (_ts_tree_cursor_current_node_wasm = Module["_ts_tree_cursor_current_node_wasm"] = Module["asm"]["ts_tree_cursor_current_node_wasm"]).apply(null, arguments)
                };
                var _ts_node_symbol_wasm = Module["_ts_node_symbol_wasm"] = function() {
                    return (_ts_node_symbol_wasm = Module["_ts_node_symbol_wasm"] = Module["asm"]["ts_node_symbol_wasm"]).apply(null, arguments)
                };
                var _ts_node_field_name_for_child_wasm = Module["_ts_node_field_name_for_child_wasm"] = function() {
                    return (_ts_node_field_name_for_child_wasm = Module["_ts_node_field_name_for_child_wasm"] = Module["asm"]["ts_node_field_name_for_child_wasm"]).apply(null, arguments)
                };
                var _ts_node_grammar_symbol_wasm = Module["_ts_node_grammar_symbol_wasm"] = function() {
                    return (_ts_node_grammar_symbol_wasm = Module["_ts_node_grammar_symbol_wasm"] = Module["asm"]["ts_node_grammar_symbol_wasm"]).apply(null, arguments)
                };
                var _ts_node_child_count_wasm = Module["_ts_node_child_count_wasm"] = function() {
                    return (_ts_node_child_count_wasm = Module["_ts_node_child_count_wasm"] = Module["asm"]["ts_node_child_count_wasm"]).apply(null, arguments)
                };
                var _ts_node_named_child_count_wasm = Module["_ts_node_named_child_count_wasm"] = function() {
                    return (_ts_node_named_child_count_wasm = Module["_ts_node_named_child_count_wasm"] = Module["asm"]["ts_node_named_child_count_wasm"]).apply(null, arguments)
                };
                var _ts_node_child_wasm = Module["_ts_node_child_wasm"] = function() {
                    return (_ts_node_child_wasm = Module["_ts_node_child_wasm"] = Module["asm"]["ts_node_child_wasm"]).apply(null, arguments)
                };
                var _ts_node_named_child_wasm = Module["_ts_node_named_child_wasm"] = function() {
                    return (_ts_node_named_child_wasm = Module["_ts_node_named_child_wasm"] = Module["asm"]["ts_node_named_child_wasm"]).apply(null, arguments)
                };
                var _ts_node_child_by_field_id_wasm = Module["_ts_node_child_by_field_id_wasm"] = function() {
                    return (_ts_node_child_by_field_id_wasm = Module["_ts_node_child_by_field_id_wasm"] = Module["asm"]["ts_node_child_by_field_id_wasm"]).apply(null, arguments)
                };
                var _ts_node_next_sibling_wasm = Module["_ts_node_next_sibling_wasm"] = function() {
                    return (_ts_node_next_sibling_wasm = Module["_ts_node_next_sibling_wasm"] = Module["asm"]["ts_node_next_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_node_prev_sibling_wasm = Module["_ts_node_prev_sibling_wasm"] = function() {
                    return (_ts_node_prev_sibling_wasm = Module["_ts_node_prev_sibling_wasm"] = Module["asm"]["ts_node_prev_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_node_next_named_sibling_wasm = Module["_ts_node_next_named_sibling_wasm"] = function() {
                    return (_ts_node_next_named_sibling_wasm = Module["_ts_node_next_named_sibling_wasm"] = Module["asm"]["ts_node_next_named_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_node_prev_named_sibling_wasm = Module["_ts_node_prev_named_sibling_wasm"] = function() {
                    return (_ts_node_prev_named_sibling_wasm = Module["_ts_node_prev_named_sibling_wasm"] = Module["asm"]["ts_node_prev_named_sibling_wasm"]).apply(null, arguments)
                };
                var _ts_node_parent_wasm = Module["_ts_node_parent_wasm"] = function() {
                    return (_ts_node_parent_wasm = Module["_ts_node_parent_wasm"] = Module["asm"]["ts_node_parent_wasm"]).apply(null, arguments)
                };
                var _ts_node_descendant_for_index_wasm = Module["_ts_node_descendant_for_index_wasm"] = function() {
                    return (_ts_node_descendant_for_index_wasm = Module["_ts_node_descendant_for_index_wasm"] = Module["asm"]["ts_node_descendant_for_index_wasm"]).apply(null, arguments)
                };
                var _ts_node_named_descendant_for_index_wasm = Module["_ts_node_named_descendant_for_index_wasm"] = function() {
                    return (_ts_node_named_descendant_for_index_wasm = Module["_ts_node_named_descendant_for_index_wasm"] = Module["asm"]["ts_node_named_descendant_for_index_wasm"]).apply(null, arguments)
                };
                var _ts_node_descendant_for_position_wasm = Module["_ts_node_descendant_for_position_wasm"] = function() {
                    return (_ts_node_descendant_for_position_wasm = Module["_ts_node_descendant_for_position_wasm"] = Module["asm"]["ts_node_descendant_for_position_wasm"]).apply(null, arguments)
                };
                var _ts_node_named_descendant_for_position_wasm = Module["_ts_node_named_descendant_for_position_wasm"] = function() {
                    return (_ts_node_named_descendant_for_position_wasm = Module["_ts_node_named_descendant_for_position_wasm"] = Module["asm"]["ts_node_named_descendant_for_position_wasm"]).apply(null, arguments)
                };
                var _ts_node_start_point_wasm = Module["_ts_node_start_point_wasm"] = function() {
                    return (_ts_node_start_point_wasm = Module["_ts_node_start_point_wasm"] = Module["asm"]["ts_node_start_point_wasm"]).apply(null, arguments)
                };
                var _ts_node_end_point_wasm = Module["_ts_node_end_point_wasm"] = function() {
                    return (_ts_node_end_point_wasm = Module["_ts_node_end_point_wasm"] = Module["asm"]["ts_node_end_point_wasm"]).apply(null, arguments)
                };
                var _ts_node_start_index_wasm = Module["_ts_node_start_index_wasm"] = function() {
                    return (_ts_node_start_index_wasm = Module["_ts_node_start_index_wasm"] = Module["asm"]["ts_node_start_index_wasm"]).apply(null, arguments)
                };
                var _ts_node_end_index_wasm = Module["_ts_node_end_index_wasm"] = function() {
                    return (_ts_node_end_index_wasm = Module["_ts_node_end_index_wasm"] = Module["asm"]["ts_node_end_index_wasm"]).apply(null, arguments)
                };
                var _ts_node_to_string_wasm = Module["_ts_node_to_string_wasm"] = function() {
                    return (_ts_node_to_string_wasm = Module["_ts_node_to_string_wasm"] = Module["asm"]["ts_node_to_string_wasm"]).apply(null, arguments)
                };
                var _ts_node_children_wasm = Module["_ts_node_children_wasm"] = function() {
                    return (_ts_node_children_wasm = Module["_ts_node_children_wasm"] = Module["asm"]["ts_node_children_wasm"]).apply(null, arguments)
                };
                var _ts_node_named_children_wasm = Module["_ts_node_named_children_wasm"] = function() {
                    return (_ts_node_named_children_wasm = Module["_ts_node_named_children_wasm"] = Module["asm"]["ts_node_named_children_wasm"]).apply(null, arguments)
                };
                var _ts_node_descendants_of_type_wasm = Module["_ts_node_descendants_of_type_wasm"] = function() {
                    return (_ts_node_descendants_of_type_wasm = Module["_ts_node_descendants_of_type_wasm"] = Module["asm"]["ts_node_descendants_of_type_wasm"]).apply(null, arguments)
                };
                var _ts_node_is_named_wasm = Module["_ts_node_is_named_wasm"] = function() {
                    return (_ts_node_is_named_wasm = Module["_ts_node_is_named_wasm"] = Module["asm"]["ts_node_is_named_wasm"]).apply(null, arguments)
                };
                var _ts_node_has_changes_wasm = Module["_ts_node_has_changes_wasm"] = function() {
                    return (_ts_node_has_changes_wasm = Module["_ts_node_has_changes_wasm"] = Module["asm"]["ts_node_has_changes_wasm"]).apply(null, arguments)
                };
                var _ts_node_has_error_wasm = Module["_ts_node_has_error_wasm"] = function() {
                    return (_ts_node_has_error_wasm = Module["_ts_node_has_error_wasm"] = Module["asm"]["ts_node_has_error_wasm"]).apply(null, arguments)
                };
                var _ts_node_is_error_wasm = Module["_ts_node_is_error_wasm"] = function() {
                    return (_ts_node_is_error_wasm = Module["_ts_node_is_error_wasm"] = Module["asm"]["ts_node_is_error_wasm"]).apply(null, arguments)
                };
                var _ts_node_is_missing_wasm = Module["_ts_node_is_missing_wasm"] = function() {
                    return (_ts_node_is_missing_wasm = Module["_ts_node_is_missing_wasm"] = Module["asm"]["ts_node_is_missing_wasm"]).apply(null, arguments)
                };
                var _ts_node_parse_state_wasm = Module["_ts_node_parse_state_wasm"] = function() {
                    return (_ts_node_parse_state_wasm = Module["_ts_node_parse_state_wasm"] = Module["asm"]["ts_node_parse_state_wasm"]).apply(null, arguments)
                };
                var _ts_node_next_parse_state_wasm = Module["_ts_node_next_parse_state_wasm"] = function() {
                    return (_ts_node_next_parse_state_wasm = Module["_ts_node_next_parse_state_wasm"] = Module["asm"]["ts_node_next_parse_state_wasm"]).apply(null, arguments)
                };
                var _ts_query_matches_wasm = Module["_ts_query_matches_wasm"] = function() {
                    return (_ts_query_matches_wasm = Module["_ts_query_matches_wasm"] = Module["asm"]["ts_query_matches_wasm"]).apply(null, arguments)
                };
                var _ts_query_captures_wasm = Module["_ts_query_captures_wasm"] = function() {
                    return (_ts_query_captures_wasm = Module["_ts_query_captures_wasm"] = Module["asm"]["ts_query_captures_wasm"]).apply(null, arguments)
                };
                var ___cxa_atexit = Module["___cxa_atexit"] = function() {
                    return (___cxa_atexit = Module["___cxa_atexit"] = Module["asm"]["__cxa_atexit"]).apply(null, arguments)
                };
                var ___errno_location = function() {
                    return (___errno_location = Module["asm"]["__errno_location"]).apply(null, arguments)
                };
                var _isalnum = Module["_isalnum"] = function() {
                    return (_isalnum = Module["_isalnum"] = Module["asm"]["isalnum"]).apply(null, arguments)
                };
                var _isalpha = Module["_isalpha"] = function() {
                    return (_isalpha = Module["_isalpha"] = Module["asm"]["isalpha"]).apply(null, arguments)
                };
                var _isspace = Module["_isspace"] = function() {
                    return (_isspace = Module["_isspace"] = Module["asm"]["isspace"]).apply(null, arguments)
                };
                var _iswdigit = Module["_iswdigit"] = function() {
                    return (_iswdigit = Module["_iswdigit"] = Module["asm"]["iswdigit"]).apply(null, arguments)
                };
                var _iswalpha = Module["_iswalpha"] = function() {
                    return (_iswalpha = Module["_iswalpha"] = Module["asm"]["iswalpha"]).apply(null, arguments)
                };
                var _iswblank = Module["_iswblank"] = function() {
                    return (_iswblank = Module["_iswblank"] = Module["asm"]["iswblank"]).apply(null, arguments)
                };
                var _iswlower = Module["_iswlower"] = function() {
                    return (_iswlower = Module["_iswlower"] = Module["asm"]["iswlower"]).apply(null, arguments)
                };
                var _iswupper = Module["_iswupper"] = function() {
                    return (_iswupper = Module["_iswupper"] = Module["asm"]["iswupper"]).apply(null, arguments)
                };
                var _iswxdigit = Module["_iswxdigit"] = function() {
                    return (_iswxdigit = Module["_iswxdigit"] = Module["asm"]["iswxdigit"]).apply(null, arguments)
                };
                var _isxdigit = Module["_isxdigit"] = function() {
                    return (_isxdigit = Module["_isxdigit"] = Module["asm"]["isxdigit"]).apply(null, arguments)
                };
                var _memchr = Module["_memchr"] = function() {
                    return (_memchr = Module["_memchr"] = Module["asm"]["memchr"]).apply(null, arguments)
                };
                var _strlen = Module["_strlen"] = function() {
                    return (_strlen = Module["_strlen"] = Module["asm"]["strlen"]).apply(null, arguments)
                };
                var _strcmp = Module["_strcmp"] = function() {
                    return (_strcmp = Module["_strcmp"] = Module["asm"]["strcmp"]).apply(null, arguments)
                };
                var _strncpy = Module["_strncpy"] = function() {
                    return (_strncpy = Module["_strncpy"] = Module["asm"]["strncpy"]).apply(null, arguments)
                };
                var _tolower = Module["_tolower"] = function() {
                    return (_tolower = Module["_tolower"] = Module["asm"]["tolower"]).apply(null, arguments)
                };
                var _towlower = Module["_towlower"] = function() {
                    return (_towlower = Module["_towlower"] = Module["asm"]["towlower"]).apply(null, arguments)
                };
                var _towupper = Module["_towupper"] = function() {
                    return (_towupper = Module["_towupper"] = Module["asm"]["towupper"]).apply(null, arguments)
                };
                var _setThrew = function() {
                    return (_setThrew = Module["asm"]["setThrew"]).apply(null, arguments)
                };
                var stackSave = function() {
                    return (stackSave = Module["asm"]["stackSave"]).apply(null, arguments)
                };
                var stackRestore = function() {
                    return (stackRestore = Module["asm"]["stackRestore"]).apply(null, arguments)
                };
                var stackAlloc = function() {
                    return (stackAlloc = Module["asm"]["stackAlloc"]).apply(null, arguments)
                };
                var __Znwm = Module["__Znwm"] = function() {
                    return (__Znwm = Module["__Znwm"] = Module["asm"]["_Znwm"]).apply(null, arguments)
                };
                var __ZdlPv = Module["__ZdlPv"] = function() {
                    return (__ZdlPv = Module["__ZdlPv"] = Module["asm"]["_ZdlPv"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEED2Ev"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9__grow_byEmmmmmm"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE6__initEPKcm"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE25__init_copy_ctor_externalEPKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE25__init_copy_ctor_externalEPKcm"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE25__init_copy_ctor_externalEPKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE25__init_copy_ctor_externalEPKcm"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE25__init_copy_ctor_externalEPKcm"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE7reserveEm"]).apply(null, arguments)
                };
                var __ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module["__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm"] = function() {
                    return (__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm = Module["__ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm"] = Module["asm"]["_ZNKSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE4copyEPcmm"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE17__assign_no_aliasILb1EEERS5_PKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE17__assign_no_aliasILb1EEERS5_PKcm"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE17__assign_no_aliasILb1EEERS5_PKcm = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE17__assign_no_aliasILb1EEERS5_PKcm"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE17__assign_no_aliasILb1EEERS5_PKcm"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc"] = function() {
                    return (__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc = Module["__ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc"] = Module["asm"]["_ZNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEE9push_backEc"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev"] = function() {
                    return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev"] = Module["asm"]["_ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEED2Ev"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw"] = function() {
                    return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw"] = Module["asm"]["_ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE9push_backEw"]).apply(null, arguments)
                };
                var __ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw"] = function() {
                    return (__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw = Module["__ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw"] = Module["asm"]["_ZNSt3__212basic_stringIwNS_11char_traitsIwEENS_9allocatorIwEEE6resizeEmw"]).apply(null, arguments)
                };
                var dynCall_jiji = Module["dynCall_jiji"] = function() {
                    return (dynCall_jiji = Module["dynCall_jiji"] = Module["asm"]["dynCall_jiji"]).apply(null, arguments)
                };
                var _orig$ts_parser_timeout_micros = Module["_orig$ts_parser_timeout_micros"] = function() {
                    return (_orig$ts_parser_timeout_micros = Module["_orig$ts_parser_timeout_micros"] = Module["asm"]["orig$ts_parser_timeout_micros"]).apply(null, arguments)
                };
                var _orig$ts_parser_set_timeout_micros = Module["_orig$ts_parser_set_timeout_micros"] = function() {
                    return (_orig$ts_parser_set_timeout_micros = Module["_orig$ts_parser_set_timeout_micros"] = Module["asm"]["orig$ts_parser_set_timeout_micros"]).apply(null, arguments)
                };
                var _stderr = Module["_stderr"] = 11824;
                Module["AsciiToString"] = AsciiToString;
                Module["stringToUTF16"] = stringToUTF16;
                var calledRun;
                dependenciesFulfilled = function runCaller() {
                    if (!calledRun) run();
                    if (!calledRun) dependenciesFulfilled = runCaller
                };

                function callMain(args = []) {
                    var entryFunction = resolveGlobalSymbol("main").sym;
                    if (!entryFunction) return;
                    args.unshift(thisProgram);
                    var argc = args.length;
                    var argv = stackAlloc((argc + 1) * 4);
                    var argv_ptr = argv >> 2;
                    args.forEach(arg => {
                        HEAP32[argv_ptr++] = stringToUTF8OnStack(arg)
                    });
                    HEAP32[argv_ptr] = 0;
                    try {
                        var ret = entryFunction(argc, argv);
                        exitJS(ret, true);
                        return ret
                    } catch (e) {
                        return handleException(e)
                    }
                }
                var dylibsLoaded = false;
                LDSO.init();

                function run(args = arguments_) {
                    if (runDependencies > 0) {
                        return
                    }
                    if (!dylibsLoaded) {
                        loadDylibs();
                        dylibsLoaded = true;
                        if (runDependencies > 0) {
                            return
                        }
                    }
                    preRun();
                    if (runDependencies > 0) {
                        return
                    }

                    function doRun() {
                        if (calledRun) return;
                        calledRun = true;
                        Module["calledRun"] = true;
                        if (ABORT) return;
                        initRuntime();
                        preMain();
                        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
                        if (shouldRunNow) callMain(args);
                        postRun()
                    }
                    if (Module["setStatus"]) {
                        Module["setStatus"]("Running...");
                        setTimeout(function() {
                            setTimeout(function() {
                                Module["setStatus"]("")
                            }, 1);
                            doRun()
                        }, 1)
                    } else {
                        doRun()
                    }
                }
                if (Module["preInit"]) {
                    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
                    while (Module["preInit"].length > 0) {
                        Module["preInit"].pop()()
                    }
                }
                var shouldRunNow = true;
                if (Module["noInitialRun"]) shouldRunNow = false;
                run();
                const C = Module;
                const INTERNAL = {};
                const SIZE_OF_INT = 4;
                const SIZE_OF_CURSOR = 3 * SIZE_OF_INT;
                const SIZE_OF_NODE = 5 * SIZE_OF_INT;
                const SIZE_OF_POINT = 2 * SIZE_OF_INT;
                const SIZE_OF_RANGE = 2 * SIZE_OF_INT + 2 * SIZE_OF_POINT;
                const ZERO_POINT = {
                    row: 0,
                    column: 0
                };
                const QUERY_WORD_REGEX = /[\w-.]*/g;
                const PREDICATE_STEP_TYPE_CAPTURE = 1;
                const PREDICATE_STEP_TYPE_STRING = 2;
                const LANGUAGE_FUNCTION_REGEX = /^_?tree_sitter_\w+/;
                var VERSION;
                var MIN_COMPATIBLE_VERSION;
                var TRANSFER_BUFFER;
                var currentParseCallback;
                var currentLogCallback;
                class ParserImpl {
                    static init() {
                        TRANSFER_BUFFER = C._ts_init();
                        VERSION = getValue(TRANSFER_BUFFER, "i32");
                        MIN_COMPATIBLE_VERSION = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32")
                    }
                    initialize() {
                        C._ts_parser_new_wasm();
                        this[0] = getValue(TRANSFER_BUFFER, "i32");
                        this[1] = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32")
                    }
                    delete() {
                        C._ts_parser_delete(this[0]);
                        C._free(this[1]);
                        this[0] = 0;
                        this[1] = 0
                    }
                    setLanguage(language) {
                        let address;
                        if (!language) {
                            address = 0;
                            language = null
                        } else if (language.constructor === Language) {
                            address = language[0];
                            const version = C._ts_language_version(address);
                            if (version < MIN_COMPATIBLE_VERSION || VERSION < version) {
                                throw new Error(`Incompatible language version ${version}. ` + `Compatibility range ${MIN_COMPATIBLE_VERSION} through ${VERSION}.`)
                            }
                        } else {
                            throw new Error("Argument must be a Language")
                        }
                        this.language = language;
                        C._ts_parser_set_language(this[0], address);
                        return this
                    }
                    getLanguage() {
                        return this.language
                    }
                    parse(callback, oldTree, options) {
                        if (typeof callback === "string") {
                            currentParseCallback = (index, _, endIndex) => callback.slice(index, endIndex)
                        } else if (typeof callback === "function") {
                            currentParseCallback = callback
                        } else {
                            throw new Error("Argument must be a string or a function")
                        }
                        if (this.logCallback) {
                            currentLogCallback = this.logCallback;
                            C._ts_parser_enable_logger_wasm(this[0], 1)
                        } else {
                            currentLogCallback = null;
                            C._ts_parser_enable_logger_wasm(this[0], 0)
                        }
                        let rangeCount = 0;
                        let rangeAddress = 0;
                        if (options && options.includedRanges) {
                            rangeCount = options.includedRanges.length;
                            rangeAddress = C._calloc(rangeCount, SIZE_OF_RANGE);
                            let address = rangeAddress;
                            for (let i = 0; i < rangeCount; i++) {
                                marshalRange(address, options.includedRanges[i]);
                                address += SIZE_OF_RANGE
                            }
                        }
                        const treeAddress = C._ts_parser_parse_wasm(this[0], this[1], oldTree ? oldTree[0] : 0, rangeAddress, rangeCount);
                        if (!treeAddress) {
                            currentParseCallback = null;
                            currentLogCallback = null;
                            throw new Error("Parsing failed")
                        }
                        const result = new Tree(INTERNAL, treeAddress, this.language, currentParseCallback);
                        currentParseCallback = null;
                        currentLogCallback = null;
                        return result
                    }
                    reset() {
                        C._ts_parser_reset(this[0])
                    }
                    setTimeoutMicros(timeout) {
                        C._ts_parser_set_timeout_micros(this[0], timeout)
                    }
                    getTimeoutMicros() {
                        return C._ts_parser_timeout_micros(this[0])
                    }
                    setLogger(callback) {
                        if (!callback) {
                            callback = null
                        } else if (typeof callback !== "function") {
                            throw new Error("Logger callback must be a function")
                        }
                        this.logCallback = callback;
                        return this
                    }
                    getLogger() {
                        return this.logCallback
                    }
                }
                class Tree {
                    constructor(internal, address, language, textCallback) {
                        assertInternal(internal);
                        this[0] = address;
                        this.language = language;
                        this.textCallback = textCallback
                    }
                    copy() {
                        const address = C._ts_tree_copy(this[0]);
                        return new Tree(INTERNAL, address, this.language, this.textCallback)
                    }
                    delete() {
                        C._ts_tree_delete(this[0]);
                        this[0] = 0
                    }
                    edit(edit) {
                        marshalEdit(edit);
                        C._ts_tree_edit_wasm(this[0])
                    }
                    get rootNode() {
                        C._ts_tree_root_node_wasm(this[0]);
                        return unmarshalNode(this)
                    }
                    getLanguage() {
                        return this.language
                    }
                    walk() {
                        return this.rootNode.walk()
                    }
                    getChangedRanges(other) {
                        if (other.constructor !== Tree) {
                            throw new TypeError("Argument must be a Tree")
                        }
                        C._ts_tree_get_changed_ranges_wasm(this[0], other[0]);
                        const count = getValue(TRANSFER_BUFFER, "i32");
                        const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                        const result = new Array(count);
                        if (count > 0) {
                            let address = buffer;
                            for (let i = 0; i < count; i++) {
                                result[i] = unmarshalRange(address);
                                address += SIZE_OF_RANGE
                            }
                            C._free(buffer)
                        }
                        return result
                    }
                }
                class Node {
                    constructor(internal, tree) {
                        assertInternal(internal);
                        this.tree = tree
                    }
                    get typeId() {
                        marshalNode(this);
                        return C._ts_node_symbol_wasm(this.tree[0])
                    }
                    get grammarId() {
                        marshalNode(this);
                        return C._ts_node_grammar_symbol_wasm(this.tree[0])
                    }
                    get type() {
                        return this.tree.language.types[this.typeId] || "ERROR"
                    }
                    get grammarType() {
                        return this.tree.language.types[this.grammarId] || "ERROR"
                    }
                    get endPosition() {
                        marshalNode(this);
                        C._ts_node_end_point_wasm(this.tree[0]);
                        return unmarshalPoint(TRANSFER_BUFFER)
                    }
                    get endIndex() {
                        marshalNode(this);
                        return C._ts_node_end_index_wasm(this.tree[0])
                    }
                    get text() {
                        return getText(this.tree, this.startIndex, this.endIndex)
                    }
                    get parseState() {
                        marshalNode(this);
                        return C._ts_node_parse_state_wasm(this.tree[0])
                    }
                    get nextParseState() {
                        marshalNode(this);
                        return C._ts_node_next_parse_state_wasm(this.tree[0])
                    }
                    isNamed() {
                        marshalNode(this);
                        return C._ts_node_is_named_wasm(this.tree[0]) === 1
                    }
                    hasError() {
                        marshalNode(this);
                        return C._ts_node_has_error_wasm(this.tree[0]) === 1
                    }
                    hasChanges() {
                        marshalNode(this);
                        return C._ts_node_has_changes_wasm(this.tree[0]) === 1
                    }
                    isError() {
                        marshalNode(this);
                        return C._ts_node_is_error_wasm(this.tree[0]) === 1
                    }
                    isMissing() {
                        marshalNode(this);
                        return C._ts_node_is_missing_wasm(this.tree[0]) === 1
                    }
                    equals(other) {
                        return this.id === other.id
                    }
                    child(index) {
                        marshalNode(this);
                        C._ts_node_child_wasm(this.tree[0], index);
                        return unmarshalNode(this.tree)
                    }
                    fieldNameForChild(index) {
                        marshalNode(this);
                        const address = C._ts_node_field_name_for_child_wasm(this.tree[0], index);
                        if (!address) {
                            return null
                        }
                        const result = AsciiToString(address);
                        return result
                    }
                    namedChild(index) {
                        marshalNode(this);
                        C._ts_node_named_child_wasm(this.tree[0], index);
                        return unmarshalNode(this.tree)
                    }
                    childForFieldId(fieldId) {
                        marshalNode(this);
                        C._ts_node_child_by_field_id_wasm(this.tree[0], fieldId);
                        return unmarshalNode(this.tree)
                    }
                    childForFieldName(fieldName) {
                        const fieldId = this.tree.language.fields.indexOf(fieldName);
                        if (fieldId !== -1) return this.childForFieldId(fieldId)
                    }
                    get childCount() {
                        marshalNode(this);
                        return C._ts_node_child_count_wasm(this.tree[0])
                    }
                    get namedChildCount() {
                        marshalNode(this);
                        return C._ts_node_named_child_count_wasm(this.tree[0])
                    }
                    get firstChild() {
                        return this.child(0)
                    }
                    get firstNamedChild() {
                        return this.namedChild(0)
                    }
                    get lastChild() {
                        return this.child(this.childCount - 1)
                    }
                    get lastNamedChild() {
                        return this.namedChild(this.namedChildCount - 1)
                    }
                    get children() {
                        if (!this._children) {
                            marshalNode(this);
                            C._ts_node_children_wasm(this.tree[0]);
                            const count = getValue(TRANSFER_BUFFER, "i32");
                            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                            this._children = new Array(count);
                            if (count > 0) {
                                let address = buffer;
                                for (let i = 0; i < count; i++) {
                                    this._children[i] = unmarshalNode(this.tree, address);
                                    address += SIZE_OF_NODE
                                }
                                C._free(buffer)
                            }
                        }
                        return this._children
                    }
                    get namedChildren() {
                        if (!this._namedChildren) {
                            marshalNode(this);
                            C._ts_node_named_children_wasm(this.tree[0]);
                            const count = getValue(TRANSFER_BUFFER, "i32");
                            const buffer = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                            this._namedChildren = new Array(count);
                            if (count > 0) {
                                let address = buffer;
                                for (let i = 0; i < count; i++) {
                                    this._namedChildren[i] = unmarshalNode(this.tree, address);
                                    address += SIZE_OF_NODE
                                }
                                C._free(buffer)
                            }
                        }
                        return this._namedChildren
                    }
                    descendantsOfType(types, startPosition, endPosition) {
                        if (!Array.isArray(types)) types = [types];
                        if (!startPosition) startPosition = ZERO_POINT;
                        if (!endPosition) endPosition = ZERO_POINT;
                        const symbols = [];
                        const typesBySymbol = this.tree.language.types;
                        for (let i = 0, n = typesBySymbol.length; i < n; i++) {
                            if (types.includes(typesBySymbol[i])) {
                                symbols.push(i)
                            }
                        }
                        const symbolsAddress = C._malloc(SIZE_OF_INT * symbols.length);
                        for (let i = 0, n = symbols.length; i < n; i++) {
                            setValue(symbolsAddress + i * SIZE_OF_INT, symbols[i], "i32")
                        }
                        marshalNode(this);
                        C._ts_node_descendants_of_type_wasm(this.tree[0], symbolsAddress, symbols.length, startPosition.row, startPosition.column, endPosition.row, endPosition.column);
                        const descendantCount = getValue(TRANSFER_BUFFER, "i32");
                        const descendantAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                        const result = new Array(descendantCount);
                        if (descendantCount > 0) {
                            let address = descendantAddress;
                            for (let i = 0; i < descendantCount; i++) {
                                result[i] = unmarshalNode(this.tree, address);
                                address += SIZE_OF_NODE
                            }
                        }
                        C._free(descendantAddress);
                        C._free(symbolsAddress);
                        return result
                    }
                    get nextSibling() {
                        marshalNode(this);
                        C._ts_node_next_sibling_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    get previousSibling() {
                        marshalNode(this);
                        C._ts_node_prev_sibling_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    get nextNamedSibling() {
                        marshalNode(this);
                        C._ts_node_next_named_sibling_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    get previousNamedSibling() {
                        marshalNode(this);
                        C._ts_node_prev_named_sibling_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    get parent() {
                        marshalNode(this);
                        C._ts_node_parent_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    descendantForIndex(start, end = start) {
                        if (typeof start !== "number" || typeof end !== "number") {
                            throw new Error("Arguments must be numbers")
                        }
                        marshalNode(this);
                        let address = TRANSFER_BUFFER + SIZE_OF_NODE;
                        setValue(address, start, "i32");
                        setValue(address + SIZE_OF_INT, end, "i32");
                        C._ts_node_descendant_for_index_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    namedDescendantForIndex(start, end = start) {
                        if (typeof start !== "number" || typeof end !== "number") {
                            throw new Error("Arguments must be numbers")
                        }
                        marshalNode(this);
                        let address = TRANSFER_BUFFER + SIZE_OF_NODE;
                        setValue(address, start, "i32");
                        setValue(address + SIZE_OF_INT, end, "i32");
                        C._ts_node_named_descendant_for_index_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    descendantForPosition(start, end = start) {
                        if (!isPoint(start) || !isPoint(end)) {
                            throw new Error("Arguments must be {row, column} objects")
                        }
                        marshalNode(this);
                        let address = TRANSFER_BUFFER + SIZE_OF_NODE;
                        marshalPoint(address, start);
                        marshalPoint(address + SIZE_OF_POINT, end);
                        C._ts_node_descendant_for_position_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    namedDescendantForPosition(start, end = start) {
                        if (!isPoint(start) || !isPoint(end)) {
                            throw new Error("Arguments must be {row, column} objects")
                        }
                        marshalNode(this);
                        let address = TRANSFER_BUFFER + SIZE_OF_NODE;
                        marshalPoint(address, start);
                        marshalPoint(address + SIZE_OF_POINT, end);
                        C._ts_node_named_descendant_for_position_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    walk() {
                        marshalNode(this);
                        C._ts_tree_cursor_new_wasm(this.tree[0]);
                        return new TreeCursor(INTERNAL, this.tree)
                    }
                    toString() {
                        marshalNode(this);
                        const address = C._ts_node_to_string_wasm(this.tree[0]);
                        const result = AsciiToString(address);
                        C._free(address);
                        return result
                    }
                }
                class TreeCursor {
                    constructor(internal, tree) {
                        assertInternal(internal);
                        this.tree = tree;
                        unmarshalTreeCursor(this)
                    }
                    delete() {
                        marshalTreeCursor(this);
                        C._ts_tree_cursor_delete_wasm(this.tree[0]);
                        this[0] = this[1] = this[2] = 0
                    }
                    reset(node) {
                        marshalNode(node);
                        marshalTreeCursor(this, TRANSFER_BUFFER + SIZE_OF_NODE);
                        C._ts_tree_cursor_reset_wasm(this.tree[0]);
                        unmarshalTreeCursor(this)
                    }
                    resetTo(cursor) {
                        marshalTreeCursor(this, TRANSFER_BUFFER);
                        marshalTreeCursor(cursor, TRANSFER_BUFFER + SIZE_OF_CURSOR);
                        C._ts_tree_cursor_reset_to_wasm(this.tree[0], cursor.tree[0]);
                        unmarshalTreeCursor(this)
                    }
                    get nodeType() {
                        return this.tree.language.types[this.nodeTypeId] || "ERROR"
                    }
                    get nodeTypeId() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_node_type_id_wasm(this.tree[0])
                    }
                    get nodeStateId() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_node_state_id_wasm(this.tree[0])
                    }
                    get nodeId() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_node_id_wasm(this.tree[0])
                    }
                    get nodeIsNamed() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_node_is_named_wasm(this.tree[0]) === 1
                    }
                    get nodeIsMissing() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_node_is_missing_wasm(this.tree[0]) === 1
                    }
                    get nodeText() {
                        marshalTreeCursor(this);
                        const startIndex = C._ts_tree_cursor_start_index_wasm(this.tree[0]);
                        const endIndex = C._ts_tree_cursor_end_index_wasm(this.tree[0]);
                        return getText(this.tree, startIndex, endIndex)
                    }
                    get startPosition() {
                        marshalTreeCursor(this);
                        C._ts_tree_cursor_start_position_wasm(this.tree[0]);
                        return unmarshalPoint(TRANSFER_BUFFER)
                    }
                    get endPosition() {
                        marshalTreeCursor(this);
                        C._ts_tree_cursor_end_position_wasm(this.tree[0]);
                        return unmarshalPoint(TRANSFER_BUFFER)
                    }
                    get startIndex() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_start_index_wasm(this.tree[0])
                    }
                    get endIndex() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_end_index_wasm(this.tree[0])
                    }
                    currentNode() {
                        marshalTreeCursor(this);
                        C._ts_tree_cursor_current_node_wasm(this.tree[0]);
                        return unmarshalNode(this.tree)
                    }
                    currentFieldId() {
                        marshalTreeCursor(this);
                        return C._ts_tree_cursor_current_field_id_wasm(this.tree[0])
                    }
                    currentFieldName() {
                        return this.tree.language.fields[this.currentFieldId()]
                    }
                    gotoFirstChild() {
                        marshalTreeCursor(this);
                        const result = C._ts_tree_cursor_goto_first_child_wasm(this.tree[0]);
                        unmarshalTreeCursor(this);
                        return result === 1
                    }
                    gotoLastChild() {
                        marshalTreeCursor(this);
                        const result = C._ts_tree_cursor_goto_last_child_wasm(this.tree[0]);
                        unmarshalTreeCursor(this);
                        return result === 1
                    }
                    gotoNextSibling() {
                        marshalTreeCursor(this);
                        const result = C._ts_tree_cursor_goto_next_sibling_wasm(this.tree[0]);
                        unmarshalTreeCursor(this);
                        return result === 1
                    }
                    gotoPreviousSibling() {
                        marshalTreeCursor(this);
                        const result = C._ts_tree_cursor_goto_previous_sibling_wasm(this.tree[0]);
                        unmarshalTreeCursor(this);
                        return result === 1
                    }
                    gotoParent() {
                        marshalTreeCursor(this);
                        const result = C._ts_tree_cursor_goto_parent_wasm(this.tree[0]);
                        unmarshalTreeCursor(this);
                        return result === 1
                    }
                }
                class Language {
                    constructor(internal, address) {
                        assertInternal(internal);
                        this[0] = address;
                        this.types = new Array(C._ts_language_symbol_count(this[0]));
                        for (let i = 0, n = this.types.length; i < n; i++) {
                            if (C._ts_language_symbol_type(this[0], i) < 2) {
                                this.types[i] = UTF8ToString(C._ts_language_symbol_name(this[0], i))
                            }
                        }
                        this.fields = new Array(C._ts_language_field_count(this[0]) + 1);
                        for (let i = 0, n = this.fields.length; i < n; i++) {
                            const fieldName = C._ts_language_field_name_for_id(this[0], i);
                            if (fieldName !== 0) {
                                this.fields[i] = UTF8ToString(fieldName)
                            } else {
                                this.fields[i] = null
                            }
                        }
                    }
                    get version() {
                        return C._ts_language_version(this[0])
                    }
                    get fieldCount() {
                        return this.fields.length - 1
                    }
                    get stateCount() {
                        return C._ts_language_state_count(this[0])
                    }
                    fieldIdForName(fieldName) {
                        const result = this.fields.indexOf(fieldName);
                        if (result !== -1) {
                            return result
                        } else {
                            return null
                        }
                    }
                    fieldNameForId(fieldId) {
                        return this.fields[fieldId] || null
                    }
                    idForNodeType(type, named) {
                        const typeLength = lengthBytesUTF8(type);
                        const typeAddress = C._malloc(typeLength + 1);
                        stringToUTF8(type, typeAddress, typeLength + 1);
                        const result = C._ts_language_symbol_for_name(this[0], typeAddress, typeLength, named);
                        C._free(typeAddress);
                        return result || null
                    }
                    get nodeTypeCount() {
                        return C._ts_language_symbol_count(this[0])
                    }
                    nodeTypeForId(typeId) {
                        const name = C._ts_language_symbol_name(this[0], typeId);
                        return name ? UTF8ToString(name) : null
                    }
                    nodeTypeIsNamed(typeId) {
                        return C._ts_language_type_is_named_wasm(this[0], typeId) ? true : false
                    }
                    nodeTypeIsVisible(typeId) {
                        return C._ts_language_type_is_visible_wasm(this[0], typeId) ? true : false
                    }
                    nextState(stateId, typeId) {
                        return C._ts_language_next_state(this[0], stateId, typeId)
                    }
                    lookaheadIterator(stateId) {
                        const address = C._ts_lookahead_iterator_new(this[0], stateId);
                        if (address) return new LookaheadIterable(INTERNAL, address, this)
                    }
                    query(source) {
                        const sourceLength = lengthBytesUTF8(source);
                        const sourceAddress = C._malloc(sourceLength + 1);
                        stringToUTF8(source, sourceAddress, sourceLength + 1);
                        const address = C._ts_query_new(this[0], sourceAddress, sourceLength, TRANSFER_BUFFER, TRANSFER_BUFFER + SIZE_OF_INT);
                        if (!address) {
                            const errorId = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                            const errorByte = getValue(TRANSFER_BUFFER, "i32");
                            const errorIndex = UTF8ToString(sourceAddress, errorByte).length;
                            const suffix = source.substr(errorIndex, 100).split("\n")[0];
                            let word = suffix.match(QUERY_WORD_REGEX)[0];
                            let error;
                            switch (errorId) {
                                case 2:
                                    error = new RangeError(`Bad node name '${word}'`);
                                    break;
                                case 3:
                                    error = new RangeError(`Bad field name '${word}'`);
                                    break;
                                case 4:
                                    error = new RangeError(`Bad capture name @${word}`);
                                    break;
                                case 5:
                                    error = new TypeError(`Bad pattern structure at offset ${errorIndex}: '${suffix}'...`);
                                    word = "";
                                    break;
                                default:
                                    error = new SyntaxError(`Bad syntax at offset ${errorIndex}: '${suffix}'...`);
                                    word = "";
                                    break
                            }
                            error.index = errorIndex;
                            error.length = word.length;
                            C._free(sourceAddress);
                            throw error
                        }
                        const stringCount = C._ts_query_string_count(address);
                        const captureCount = C._ts_query_capture_count(address);
                        const patternCount = C._ts_query_pattern_count(address);
                        const captureNames = new Array(captureCount);
                        const stringValues = new Array(stringCount);
                        for (let i = 0; i < captureCount; i++) {
                            const nameAddress = C._ts_query_capture_name_for_id(address, i, TRANSFER_BUFFER);
                            const nameLength = getValue(TRANSFER_BUFFER, "i32");
                            captureNames[i] = UTF8ToString(nameAddress, nameLength)
                        }
                        for (let i = 0; i < stringCount; i++) {
                            const valueAddress = C._ts_query_string_value_for_id(address, i, TRANSFER_BUFFER);
                            const nameLength = getValue(TRANSFER_BUFFER, "i32");
                            stringValues[i] = UTF8ToString(valueAddress, nameLength)
                        }
                        const setProperties = new Array(patternCount);
                        const assertedProperties = new Array(patternCount);
                        const refutedProperties = new Array(patternCount);
                        const predicates = new Array(patternCount);
                        const textPredicates = new Array(patternCount);
                        for (let i = 0; i < patternCount; i++) {
                            const predicatesAddress = C._ts_query_predicates_for_pattern(address, i, TRANSFER_BUFFER);
                            const stepCount = getValue(TRANSFER_BUFFER, "i32");
                            predicates[i] = [];
                            textPredicates[i] = [];
                            const steps = [];
                            let stepAddress = predicatesAddress;
                            for (let j = 0; j < stepCount; j++) {
                                const stepType = getValue(stepAddress, "i32");
                                stepAddress += SIZE_OF_INT;
                                const stepValueId = getValue(stepAddress, "i32");
                                stepAddress += SIZE_OF_INT;
                                if (stepType === PREDICATE_STEP_TYPE_CAPTURE) {
                                    steps.push({
                                        type: "capture",
                                        name: captureNames[stepValueId]
                                    })
                                } else if (stepType === PREDICATE_STEP_TYPE_STRING) {
                                    steps.push({
                                        type: "string",
                                        value: stringValues[stepValueId]
                                    })
                                } else if (steps.length > 0) {
                                    if (steps[0].type !== "string") {
                                        throw new Error("Predicates must begin with a literal value")
                                    }
                                    const operator = steps[0].value;
                                    let isPositive = true;
                                    let matchAll = true;
                                    let captureName;
                                    switch (operator) {
                                        case "any-not-eq?":
                                        case "not-eq?":
                                            isPositive = false;
                                        case "any-eq?":
                                        case "eq?":
                                            if (steps.length !== 3) throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length-1}`);
                                            if (steps[1].type !== "capture") throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}"`);
                                            matchAll = !operator.startsWith("any-");
                                            if (steps[2].type === "capture") {
                                                const captureName1 = steps[1].name;
                                                const captureName2 = steps[2].name;
                                                textPredicates[i].push(function(captures) {
                                                    let nodes_1 = [];
                                                    let nodes_2 = [];
                                                    for (const c of captures) {
                                                        if (c.name === captureName1) nodes_1.push(c.node);
                                                        if (c.name === captureName2) nodes_2.push(c.node)
                                                    }
                                                    let compare = (n1, n2, positive) => {
                                                        return positive ? n1.text === n2.text : n1.text !== n2.text
                                                    };
                                                    return matchAll ? nodes_1.every(n1 => nodes_2.some(n2 => compare(n1, n2, isPositive))) : nodes_1.some(n1 => nodes_2.some(n2 => compare(n1, n2, isPositive)))
                                                })
                                            } else {
                                                captureName = steps[1].name;
                                                const stringValue = steps[2].value;
                                                let matches = n => n.text === stringValue;
                                                let doesNotMatch = n => n.text !== stringValue;
                                                textPredicates[i].push(function(captures) {
                                                    let nodes = [];
                                                    for (const c of captures) {
                                                        if (c.name === captureName) nodes.push(c.node)
                                                    }
                                                    let test = isPositive ? matches : doesNotMatch;
                                                    return matchAll ? nodes.every(test) : nodes.some(test)
                                                })
                                            }
                                            break;
                                        case "any-not-match?":
                                        case "not-match?":
                                            isPositive = false;
                                        case "any-match?":
                                        case "match?":
                                            if (steps.length !== 3) throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 2, got ${steps.length-1}.`);
                                            if (steps[1].type !== "capture") throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`);
                                            if (steps[2].type !== "string") throw new Error(`Second argument of \`#${operator}\` predicate must be a string. Got @${steps[2].value}.`);
                                            captureName = steps[1].name;
                                            const regex = new RegExp(steps[2].value);
                                            matchAll = !operator.startsWith("any-");
                                            textPredicates[i].push(function(captures) {
                                                const nodes = [];
                                                for (const c of captures) {
                                                    if (c.name === captureName) nodes.push(c.node.text)
                                                }
                                                let test = (text, positive) => {
                                                    return positive ? regex.test(text) : !regex.test(text)
                                                };
                                                if (nodes.length === 0) return !isPositive;
                                                return matchAll ? nodes.every(text => test(text, isPositive)) : nodes.some(text => test(text, isPositive))
                                            });
                                            break;
                                        case "set!":
                                            if (steps.length < 2 || steps.length > 3) throw new Error(`Wrong number of arguments to \`#set!\` predicate. Expected 1 or 2. Got ${steps.length-1}.`);
                                            if (steps.some(s => s.type !== "string")) throw new Error(`Arguments to \`#set!\` predicate must be a strings.".`);
                                            if (!setProperties[i]) setProperties[i] = {};
                                            setProperties[i][steps[1].value] = steps[2] ? steps[2].value : null;
                                            break;
                                        case "is?":
                                        case "is-not?":
                                            if (steps.length < 2 || steps.length > 3) throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected 1 or 2. Got ${steps.length-1}.`);
                                            if (steps.some(s => s.type !== "string")) throw new Error(`Arguments to \`#${operator}\` predicate must be a strings.".`);
                                            const properties = operator === "is?" ? assertedProperties : refutedProperties;
                                            if (!properties[i]) properties[i] = {};
                                            properties[i][steps[1].value] = steps[2] ? steps[2].value : null;
                                            break;
                                        case "not-any-of?":
                                            isPositive = false;
                                        case "any-of?":
                                            if (steps.length < 2) throw new Error(`Wrong number of arguments to \`#${operator}\` predicate. Expected at least 1. Got ${steps.length-1}.`);
                                            if (steps[1].type !== "capture") throw new Error(`First argument of \`#${operator}\` predicate must be a capture. Got "${steps[1].value}".`);
                                            for (let i = 2; i < steps.length; i++) {
                                                if (steps[i].type !== "string") throw new Error(`Arguments to \`#${operator}\` predicate must be a strings.".`)
                                            }
                                            captureName = steps[1].name;
                                            const values = steps.slice(2).map(s => s.value);
                                            textPredicates[i].push(function(captures) {
                                                const nodes = [];
                                                for (const c of captures) {
                                                    if (c.name === captureName) nodes.push(c.node.text)
                                                }
                                                if (nodes.length === 0) return !isPositive;
                                                return nodes.every(text => values.includes(text)) === isPositive
                                            });
                                            break;
                                        default:
                                            predicates[i].push({
                                                operator: operator,
                                                operands: steps.slice(1)
                                            })
                                    }
                                    steps.length = 0
                                }
                            }
                            Object.freeze(setProperties[i]);
                            Object.freeze(assertedProperties[i]);
                            Object.freeze(refutedProperties[i])
                        }
                        C._free(sourceAddress);
                        return new Query(INTERNAL, address, captureNames, textPredicates, predicates, Object.freeze(setProperties), Object.freeze(assertedProperties), Object.freeze(refutedProperties))
                    }
                    static load(input) {
                        let bytes;
                        if (input instanceof Uint8Array) {
                            bytes = Promise.resolve(input)
                        } else {
                            const url = input;
                            if (typeof process !== "undefined" && process.versions && process.versions.node) {
                                const fs = require("fs");
                                bytes = Promise.resolve(fs.readFileSync(url))
                            } else {
                                bytes = fetch(url).then(response => response.arrayBuffer().then(buffer => {
                                    if (response.ok) {
                                        return new Uint8Array(buffer)
                                    } else {
                                        const body = new TextDecoder("utf-8").decode(buffer);
                                        throw new Error(`Language.load failed with status ${response.status}.\n\n${body}`)
                                    }
                                }))
                            }
                        }
                        const loadModule = typeof loadSideModule === "function" ? loadSideModule : loadWebAssemblyModule;
                        return bytes.then(bytes => loadModule(bytes, {
                            loadAsync: true
                        })).then(mod => {
                            const symbolNames = Object.keys(mod);
                            const functionName = symbolNames.find(key => LANGUAGE_FUNCTION_REGEX.test(key) && !key.includes("external_scanner_"));
                            if (!functionName) {
                                console.log(`Couldn't find language function in WASM file. Symbols:\n${JSON.stringify(symbolNames,null,2)}`)
                            }
                            const languageAddress = mod[functionName]();
                            return new Language(INTERNAL, languageAddress)
                        })
                    }
                }
                class LookaheadIterable {
                    constructor(internal, address, language) {
                        assertInternal(internal);
                        this[0] = address;
                        this.language = language
                    }
                    get currentTypeId() {
                        return C._ts_lookahead_iterator_current_symbol(this[0])
                    }
                    get currentType() {
                        return this.language.types[this.currentTypeId] || "ERROR"
                    }
                    delete() {
                        C._ts_lookahead_iterator_delete(this[0]);
                        this[0] = 0
                    }
                    resetState(stateId) {
                        return C._ts_lookahead_iterator_reset_state(this[0], stateId)
                    }
                    reset(language, stateId) {
                        if (C._ts_lookahead_iterator_reset(this[0], language[0], stateId)) {
                            this.language = language;
                            return true
                        }
                        return false
                    } [Symbol.iterator]() {
                        const self = this;
                        return {
                            next() {
                                if (C._ts_lookahead_iterator_next(self[0])) {
                                    return {
                                        done: false,
                                        value: self.currentType
                                    }
                                }
                                return {
                                    done: true,
                                    value: ""
                                }
                            }
                        }
                    }
                }
                class Query {
                    constructor(internal, address, captureNames, textPredicates, predicates, setProperties, assertedProperties, refutedProperties) {
                        assertInternal(internal);
                        this[0] = address;
                        this.captureNames = captureNames;
                        this.textPredicates = textPredicates;
                        this.predicates = predicates;
                        this.setProperties = setProperties;
                        this.assertedProperties = assertedProperties;
                        this.refutedProperties = refutedProperties;
                        this.exceededMatchLimit = false
                    }
                    delete() {
                        C._ts_query_delete(this[0]);
                        this[0] = 0
                    }
                    matches(node, startPosition, endPosition, options) {
                        if (!startPosition) startPosition = ZERO_POINT;
                        if (!endPosition) endPosition = ZERO_POINT;
                        if (!options) options = {};
                        let matchLimit = options.matchLimit;
                        if (typeof matchLimit === "undefined") {
                            matchLimit = 0
                        } else if (typeof matchLimit !== "number") {
                            throw new Error("Arguments must be numbers")
                        }
                        marshalNode(node);
                        C._ts_query_matches_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, matchLimit);
                        const rawCount = getValue(TRANSFER_BUFFER, "i32");
                        const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                        const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
                        const result = new Array(rawCount);
                        this.exceededMatchLimit = !!didExceedMatchLimit;
                        let filteredCount = 0;
                        let address = startAddress;
                        for (let i = 0; i < rawCount; i++) {
                            const pattern = getValue(address, "i32");
                            address += SIZE_OF_INT;
                            const captureCount = getValue(address, "i32");
                            address += SIZE_OF_INT;
                            const captures = new Array(captureCount);
                            address = unmarshalCaptures(this, node.tree, address, captures);
                            if (this.textPredicates[pattern].every(p => p(captures))) {
                                result[filteredCount++] = {
                                    pattern: pattern,
                                    captures: captures
                                };
                                const setProperties = this.setProperties[pattern];
                                if (setProperties) result[i].setProperties = setProperties;
                                const assertedProperties = this.assertedProperties[pattern];
                                if (assertedProperties) result[i].assertedProperties = assertedProperties;
                                const refutedProperties = this.refutedProperties[pattern];
                                if (refutedProperties) result[i].refutedProperties = refutedProperties
                            }
                        }
                        result.length = filteredCount;
                        C._free(startAddress);
                        return result
                    }
                    captures(node, startPosition, endPosition, options) {
                        if (!startPosition) startPosition = ZERO_POINT;
                        if (!endPosition) endPosition = ZERO_POINT;
                        if (!options) options = {};
                        let matchLimit = options.matchLimit;
                        if (typeof matchLimit === "undefined") {
                            matchLimit = 0
                        } else if (typeof matchLimit !== "number") {
                            throw new Error("Arguments must be numbers")
                        }
                        marshalNode(node);
                        C._ts_query_captures_wasm(this[0], node.tree[0], startPosition.row, startPosition.column, endPosition.row, endPosition.column, matchLimit);
                        const count = getValue(TRANSFER_BUFFER, "i32");
                        const startAddress = getValue(TRANSFER_BUFFER + SIZE_OF_INT, "i32");
                        const didExceedMatchLimit = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32");
                        const result = [];
                        this.exceededMatchLimit = !!didExceedMatchLimit;
                        const captures = [];
                        let address = startAddress;
                        for (let i = 0; i < count; i++) {
                            const pattern = getValue(address, "i32");
                            address += SIZE_OF_INT;
                            const captureCount = getValue(address, "i32");
                            address += SIZE_OF_INT;
                            const captureIndex = getValue(address, "i32");
                            address += SIZE_OF_INT;
                            captures.length = captureCount;
                            address = unmarshalCaptures(this, node.tree, address, captures);
                            if (this.textPredicates[pattern].every(p => p(captures))) {
                                const capture = captures[captureIndex];
                                const setProperties = this.setProperties[pattern];
                                if (setProperties) capture.setProperties = setProperties;
                                const assertedProperties = this.assertedProperties[pattern];
                                if (assertedProperties) capture.assertedProperties = assertedProperties;
                                const refutedProperties = this.refutedProperties[pattern];
                                if (refutedProperties) capture.refutedProperties = refutedProperties;
                                result.push(capture)
                            }
                        }
                        C._free(startAddress);
                        return result
                    }
                    predicatesForPattern(patternIndex) {
                        return this.predicates[patternIndex]
                    }
                    didExceedMatchLimit() {
                        return this.exceededMatchLimit
                    }
                }

                function getText(tree, startIndex, endIndex) {
                    const length = endIndex - startIndex;
                    let result = tree.textCallback(startIndex, null, endIndex);
                    startIndex += result.length;
                    while (startIndex < endIndex) {
                        const string = tree.textCallback(startIndex, null, endIndex);
                        if (string && string.length > 0) {
                            startIndex += string.length;
                            result += string
                        } else {
                            break
                        }
                    }
                    if (startIndex > endIndex) {
                        result = result.slice(0, length)
                    }
                    return result
                }

                function unmarshalCaptures(query, tree, address, result) {
                    for (let i = 0, n = result.length; i < n; i++) {
                        const captureIndex = getValue(address, "i32");
                        address += SIZE_OF_INT;
                        const node = unmarshalNode(tree, address);
                        address += SIZE_OF_NODE;
                        result[i] = {
                            name: query.captureNames[captureIndex],
                            node: node
                        }
                    }
                    return address
                }

                function assertInternal(x) {
                    if (x !== INTERNAL) throw new Error("Illegal constructor")
                }

                function isPoint(point) {
                    return point && typeof point.row === "number" && typeof point.column === "number"
                }

                function marshalNode(node) {
                    let address = TRANSFER_BUFFER;
                    setValue(address, node.id, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, node.startIndex, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, node.startPosition.row, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, node.startPosition.column, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, node[0], "i32")
                }

                function unmarshalNode(tree, address = TRANSFER_BUFFER) {
                    const id = getValue(address, "i32");
                    address += SIZE_OF_INT;
                    if (id === 0) return null;
                    const index = getValue(address, "i32");
                    address += SIZE_OF_INT;
                    const row = getValue(address, "i32");
                    address += SIZE_OF_INT;
                    const column = getValue(address, "i32");
                    address += SIZE_OF_INT;
                    const other = getValue(address, "i32");
                    const result = new Node(INTERNAL, tree);
                    result.id = id;
                    result.startIndex = index;
                    result.startPosition = {
                        row: row,
                        column: column
                    };
                    result[0] = other;
                    return result
                }

                function marshalTreeCursor(cursor, address = TRANSFER_BUFFER) {
                    setValue(address + 0 * SIZE_OF_INT, cursor[0], "i32"), setValue(address + 1 * SIZE_OF_INT, cursor[1], "i32"), setValue(address + 2 * SIZE_OF_INT, cursor[2], "i32")
                }

                function unmarshalTreeCursor(cursor) {
                    cursor[0] = getValue(TRANSFER_BUFFER + 0 * SIZE_OF_INT, "i32"), cursor[1] = getValue(TRANSFER_BUFFER + 1 * SIZE_OF_INT, "i32"), cursor[2] = getValue(TRANSFER_BUFFER + 2 * SIZE_OF_INT, "i32")
                }

                function marshalPoint(address, point) {
                    setValue(address, point.row, "i32");
                    setValue(address + SIZE_OF_INT, point.column, "i32")
                }

                function unmarshalPoint(address) {
                    return {
                        row: getValue(address, "i32"),
                        column: getValue(address + SIZE_OF_INT, "i32")
                    }
                }

                function marshalRange(address, range) {
                    marshalPoint(address, range.startPosition);
                    address += SIZE_OF_POINT;
                    marshalPoint(address, range.endPosition);
                    address += SIZE_OF_POINT;
                    setValue(address, range.startIndex, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, range.endIndex, "i32");
                    address += SIZE_OF_INT
                }

                function unmarshalRange(address) {
                    const result = {};
                    result.startPosition = unmarshalPoint(address);
                    address += SIZE_OF_POINT;
                    result.endPosition = unmarshalPoint(address);
                    address += SIZE_OF_POINT;
                    result.startIndex = getValue(address, "i32");
                    address += SIZE_OF_INT;
                    result.endIndex = getValue(address, "i32");
                    return result
                }

                function marshalEdit(edit) {
                    let address = TRANSFER_BUFFER;
                    marshalPoint(address, edit.startPosition);
                    address += SIZE_OF_POINT;
                    marshalPoint(address, edit.oldEndPosition);
                    address += SIZE_OF_POINT;
                    marshalPoint(address, edit.newEndPosition);
                    address += SIZE_OF_POINT;
                    setValue(address, edit.startIndex, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, edit.oldEndIndex, "i32");
                    address += SIZE_OF_INT;
                    setValue(address, edit.newEndIndex, "i32");
                    address += SIZE_OF_INT
                }
                for (const name of Object.getOwnPropertyNames(ParserImpl.prototype)) {
                    Object.defineProperty(Parser.prototype, name, {
                        value: ParserImpl.prototype[name],
                        enumerable: false,
                        writable: false
                    })
                }
                Parser.Language = Language;
                Module.onRuntimeInitialized = () => {
                    ParserImpl.init();
                    resolveInitPromise()
                }
            })
        }
    }
    return Parser
}();
if (typeof exports === "object") {
    module.exports = TreeSitter
}
