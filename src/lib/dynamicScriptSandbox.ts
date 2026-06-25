/**
 * Execute untrusted JavaScript from IPFS in a sandboxed iframe.
 * Uses Blob URL approach to let scripts execute in their natural global scope.
 * 
 * Used to compute dynamic metaEvidence (e.g., ruling option titles for governor disputes).
 * Particularly important for Webpack-bundled scripts that use IIFE patterns.
 * 
 * The sandbox:
 * 1. Creates an iframe with configured sandbox attributes
 * 2. Patches XMLHttpRequest.open and fetch to redirect RPC calls to the configured RPC URL
 * 3. Loads the user script (NOT wrapped in an IIFE) so it executes naturally in global scope
 * 4. Calls getMetaEvidence() after script execution
 * 5. Communicates results via postMessage
 */

export interface SandboxConfig {
  sandboxAttributes: string[];
  rpcUrl: string;
}

export default function executeDynamicScript(
  scriptString: string,
  scriptParameters: Record<string, string>,
  sandboxConfig: SandboxConfig
): Promise<Record<string, unknown>> {
  // Check for browser environment
  if (typeof window === "undefined") {
    throw new Error("Dynamic script sandbox requires browser environment");
  }

  return new Promise((resolve, reject) => {
    // Create hidden iframe with configured sandbox attributes
    const iframe = document.createElement("iframe");
    iframe.style.display = "none";
    
    // Add sandbox attributes from config
    sandboxConfig.sandboxAttributes.forEach(attr => {
      iframe.sandbox.add(attr);
    });

    // Setup message listener
    const messageHandler = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow && event.data.target === "script") {
        cleanup();
        if (event.data.error) {
          reject(new Error(event.data.error));
        } else {
          resolve(event.data.result);
        }
      }
    };

    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      window.removeEventListener("message", messageHandler);
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    };

    window.addEventListener("message", messageHandler);
    document.body.appendChild(iframe);

    timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error("Dynamic script sandbox timeout after 30s"));
    }, 30000);

    // Build the iframe content as an HTML document
    // Structure:
    // 1. RPC redirect patch (setup globals: scriptParameters, rpcUrl, patched XMLHttpRequest/fetch)
    // 2. Promise handlers for result communication
    // 3. User script (NOT wrapped in IIFE — executes naturally in global scope)
    // 4. Call to getMetaEvidence() after script defines it
    const htmlContent = `<!DOCTYPE html>
<html>
<head></head>
<body>
<script>
// RPC redirect patch
const scriptParameters = ${JSON.stringify(scriptParameters)};
const rpcUrl = ${JSON.stringify(sandboxConfig.rpcUrl)};

// Hardcoded Infura URL that needs to be redirected
const oldRpcUrl = 'https://mainnet.infura.io/v3/668b3268d5b241b5bab5c6cb886e4c61';

// Patch XMLHttpRequest.open to redirect RPC calls
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method, url, ...rest) {
  const processedUrl = typeof url === 'string' && url.includes(oldRpcUrl)
    ? url.replace(oldRpcUrl, rpcUrl)
    : url;
  return originalXHROpen.call(this, method, processedUrl, ...rest);
};

// Patch fetch to redirect RPC calls
const originalFetch = window.fetch;
window.fetch = function(url, ...rest) {
  const processedUrl = typeof url === 'string' && url.includes(oldRpcUrl)
    ? url.replace(oldRpcUrl, rpcUrl)
    : url;
  return originalFetch.call(this, processedUrl, ...rest);
};

// Setup promise-based result communication
let resolveScript, rejectScript;

const returnPromise = new Promise((resolve, reject) => {
  resolveScript = resolve;
  rejectScript = reject;
});

returnPromise.then(result => {
  window.parent.postMessage({ target: 'script', result }, '*');
}).catch(error => {
  window.parent.postMessage({ target: 'script', error: error.message }, '*');
});
</script>

<script>
// User script — executes in natural global scope (NOT wrapped in IIFE)
${scriptString}
</script>

<script>
// Call getMetaEvidence() after the user script has defined it.
// The function may return a value directly OR a Promise (governor scripts are async).
try {
  const result = getMetaEvidence();
    if (result && typeof result.then === 'function') {
    Promise.resolve(result).then(resolveScript).catch(function(err) {
      rejectScript(new Error('getMetaEvidence() async error: ' + (err && err.message ? err.message : String(err))));
    });
  } else {
    resolveScript(result);
  }
} catch (error) {
  rejectScript(new Error('getMetaEvidence() threw: ' + (error instanceof Error ? error.message : String(error))));
}
</script>
</body>
</html>`;

    // Create a Blob from the HTML content and generate a Blob URL
    const blob = new Blob([htmlContent], { type: "text/html" });
    let blobUrl: string | null = null;
    
    try {
      blobUrl = URL.createObjectURL(blob);
      iframe.src = blobUrl;
    } catch (error) {
      cleanup();
      reject(new Error(`Failed to create Blob URL: ${error instanceof Error ? error.message : String(error)}`));
    }
  });
}
