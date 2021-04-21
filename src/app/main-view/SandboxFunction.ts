/* Коллекция без дубликатов с сохранением порядка элементов и доступом по индексу
 с событиями на добавление, удаление и замену элемента */

export class SandboxFunction {
    private static readonly blackList = [
      'Worker', 'WebSocket', 'XMLHttpRequest', 'WorkerGlobalScope', 'DOMRequest', 'DOMCursor',
      'WorkerLocation', 'WorkerNavigator', 'Crypto', 'Fetch', 'Headers', 'FetchEvent', 'BroadcastChannel',
      'Request', 'Response', 'Notification', 'Performance', 'PerformanceEntry', 'PerformanceMeasure', 
      'PerformanceMark', 'PerformanceObserver', 'PerformanceResourceTiming', 'FormData', 'ImageData', 'IndexedDB',
      'NotificationEvent', 'ServiceWorkerGlobalScope', 'ServiceWorkerRegistration', 'FileReader', 'File', 'Blob',
      'NetworkInformation', 'MessageChannel', 'MessagePort', 'PortCollection', 'SharedWorker', 'DataTransfer',
      'HTMLCanvasElement', 'FileSystemHandle', 'FileSystemFileHandle', 'FileSystemDirectoryHandle',
      'DataTransferItem', 'FileSystemWritableFileStream', 'Stream', 'WriteableStream', 'ReadableStream',
      'FileSystemFileEntry', 'FileSystemDirectoryEntry', 'FileReaderSync', 'FileList', 'URL',
      'ReadableStreamDefaultController', 'ReadableStreamDefaultReader', 'WritableStreamDefaultWriter', 
      'WritableStreamDefaultController', 'Body', 'ReadableStreamBYOBReader', 'ReadableByteStreamController',
      'ReadableStreamBYOBRequest', 'EventSource', 'WebGLRenderingContext', 'WebGL2RenderingContext',
      'WebGLActiveInfo', 'WebGLBuffer', 'WebGLContextEvent', 'WebGLFramebuffer', 'WebGLProgram', 'WebGLQuery',
      'WebGLRenderbuffer', 'WebGLSampler', 'WebGLShader', 'WebGLShaderPrecisionFormat', 'WebGLSync', 'WebGLTexture',
      'WebGLTransformFeedback', 'WebGLUniformLocation', 'WebGLVertexArrayObject', 'OffscreenCanvas',
      'DedicatedWorkerGlobalScope', 'SharedWorkerGlobalScope', 'Window', 'WindowOrWorkerGlobalScope',
      'AnalyserNode', 'Animation', 'AnimationEvent', 'AnimationTimeline',
      'ApplicationCache', 'Cache', 'CacheStorage', 'CanvasRenderingContext2D', 'CaretPosition', 'ChannelMergerNode',
      'CharacterData', 'ClientRect', 'ClientRectList', 'Clipboard', 'ClipboardEvent', 'CloseEvent',
      'Comment', 'CompositionEvent', 'ConstantSourceNode', 'ConvolverNode', 'CountQueuingStrategy', 'Credential',
      'CredentialsContainer', 'CryptoKey', 'CryptoKeyPair', 'CustomElementRegistry', 'Audio', 'AudioBuffer', 
      'AudioBufferSourceNode', 'AudioContext', 'AudioDestinationNode', 'AudioListener', 'AudioNode', 'AudioParam',
      'AudioParamMap', 'AudioProcessingEvent', 'AuthenticatorAssertionResponse', 'AuthenticatorAttestationResponse',
      'DataCue', 'DataView', 'External', 'IDBDatabase', 'MediaDevices', 'MediaDeviceInfo', 'MessageEvent',
      'MessagePort', 'MessageChannel', 'Location', 'Gamepad', 'GamepadEvent', 'Reflect', 'ShadowRoot', 'SourceBuffer',
      'SourceBufferList', 'Storage', 'StorageEvent', 'StorageManager', 'StyleSheet', 'StyleSheetList', 'SubtleCrypto',
      'SyncManager', 'SyntaxError', 'PageTransitionEvent', 'PaymentRequest', 'PaymentResponse', 'Permissions', 'Plugin',
      'PointerEvent', 'PromiseRejectionEvent', 'PushSubscription', 'XMLDocument', 'XMLHttpRequestUpload',
      'XMLSerializer', 'XPathEvaluator', 'XPathExpression', 'XPathResult',

      'export', 'class', 'navigator', 'Event', 'MouseEvent', 'KeyboardEvent', 'CustomEvent', 'importScripts',
      'Promise', 'clearInterval', 'clearTimeout', 'dump', 'implements', 'constructor', 'set', 'get', 'async', 'await',
      'Function', 'function', 'require', 'import', 'call', 'apply', 'bind', 'prototype', '__proto__', 'callee',
      'process', 'global', 'Agent', 'read', 'write', 'http', 'FileSystem', 'NavigationPreloadManager',
      'Navigator', 'void', 'private', 'public', 'crypto', 'customElements', 'debugger', 'default', 'dispatchEvent',
      'departFocus', 'devicePixelRatio', '__dirname', '__filename', 'addEventListener', 'alert', 'applicationCache',
      'blur', 'caches', 'cancelAnimationFrame', 'captureEvents', 'clearImmediate', 'clientInformation',
      'defaultStatus', 'doNotTrack', 'document', 'console', 'confirm', 'prompt', 'eval', 'exports', 'extends',
      'external', 'createElement', 'getElementById', 'getElementsByClassName', 'querySelector', 'this', 'Proxy',
      'proxy', '__defineGetter__', '__defineSetter__', '__lookupGetter__', '__lookupSetter__', 'hasOwnProperty',
      'isPrototypeOf', 'propertyIsEnumerable', 'setPrototypeOf', 'caller', 'innerHeight', 'innerWidth', 'innerSubscribe',
      'InnerSubscriber', 'interface', 'isSecureContext', 'kill', 'exception', 'event', 'Exception', 'throw', 'throws',
      'invoke', 'invokeMethod', 'invokeMethodAsync', 'ajax', 'globalThis', 'visualViewport', 'fetch', 'focus',
      'frameElement', 'frames', 'top', 'screenLeft', 'screenTop', 'screenX', 'screenY', 'Screen', 'ScreenOrientation',
      'outerHeight', 'outerWidth', 'history', 'History', 'localStorage', 'location', 'locationbar', 'log',
      'VisualViewport', 'Element', 'Error', 'ErrorEvent', 'ErrorHandler', 'ExtensionScriptApis',
      'webkitURL', 'window', 'document', 'dump', 'yield', 'queueMicrotask', 'scroll', 'scrollBy', 'scrollTo', 'scrollX',
      'scrollY', 'scrollbars', 'self', 'package', 'pageXOffset', 'pageYOffset', 'parent', 'performance', 'personalbar',
      'postMessage', 'print', 'exec', 'run', 'execSync', 'dialog', 'electron', 'quit', 'sessionStorage', 'super',
      'spawn', 'spawnSync', 'moveBy', 'moveTo', 'webContents', 'loadURL', '_baseURL', '_htc',

      'BrowserWindow', 'ipcRenderer', 'ipcMain', 'MainViewComponent', 'SandboxFunction',
      'Electron', 'Node', 'NodeFilter', 'NodeIterator', 'NodeJS', 'NodeList',
      'Component', 'Input', 'ViewChild', 'NgZone', 'OnInit', 'ElectronService', 'DbServiceService',
      'UpdateRecentService', 'LastDirectoryService', 'OSelection', 'cytoscape', 'cola', 'gridGuide'
    ]

    private static readonly whiteList = [
      'Math', 'JSON', 'parseInt', 'parseFloat', 'Date', 'Integer', 'String', 'Number', 'Array', 'Boolean',
      'atob', 'btoa', 'RegExp', 'Object', 'Error', 'Set'
    ]

    /* ----------------------------------------------------------------------------------------------- */

    private f = function(...args) {
      console.warn('SandboxFunction is empty.')
      return undefined
    };
    public functionBody:string = 'return undefined';
    
    public static tryCreate(functionBody): Error {
      let notSecure = false;
      for (let str of SandboxFunction.blackList) {
        const regex =  new RegExp(`\\b${str}\\b`, 'g');
        let found = functionBody.search(regex) >= 0
        notSecure = notSecure || found
          //console.log('forbidden check: found =', found, ', regex =', regex, ', str =', str,
          //', match =', functionBody.match(regex))
      }
      if (notSecure) {
        return new Error('Используются запрещенные классы, интерфейсы, свойства, переменные или операторы.')
      }

      const lambda = /=>/g
      notSecure = notSecure || (functionBody.search(lambda) >= 0)
      if (notSecure) {
        return new Error('Использование лямбда-выражений запрещено')
      }

      let fn:any = function(){return undefined}
      try {
        fn = new Function(functionBody)
      } catch (e) {
        //console.log('(!) Syntax error in user function with argNames ', argNamesArray, '.', e)
        return e
      }
      return null;
    }

    execute(...args) {
      return this.f(...args)
    }

    toString() {
      return '[SandboxFunction] ' + this.functionBody
    }

    constructor(argNamesArray, functionBody, onCreateError, onRuntimeError) {
      //console.log('new Sandbox')

      if (!functionBody) {
        console.warn('(!) SandboxFunction constructor: empty function body')
        return
      }

      let error = SandboxFunction.tryCreate(functionBody)
      if (error) {
        if (onCreateError) onCreateError(error)
        return
      }

      let fn:any = function(){return undefined}
      try {
        fn = new Function(...argNamesArray, functionBody)
        this.functionBody = functionBody;
      } catch (e) {
        //console.log('(!) Syntax error in user function with argNames ', argNamesArray, '.', e)
        if (onCreateError) onCreateError(e)
      }

      let wrapper = (...args) => {
        let globallyAvailable = {};
        for (let p in window) {
          if (!SandboxFunction.whiteList.includes(p)) {
            globallyAvailable[p] = null
          }
        }
        for (var p in this) {
          globallyAvailable['' + p] = null;
        }
        console.log('wrapper args', args)
        //console.log(globallyAvailable)
        
        let result = undefined
        try {
          result = fn.call(globallyAvailable, ...args)
        } catch (e) {
          let argsAtError = {}
          for (let i = 0; i<argNamesArray.length; i++) {
            let name = argNamesArray[i]
            argsAtError[name] = args[i]
          }
          //console.log('(!) User function with args ', argsAtError, ' thrown an error.', e)
          if (onRuntimeError) onRuntimeError(e)
          return undefined
        }
        //console.log('wrapper:', result, fn.toString(), globallyAvailable);
        return result;
      }

      this.f = wrapper
    }
  }