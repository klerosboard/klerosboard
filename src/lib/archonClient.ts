import { getRPCURL } from "./helpers";

let _archonCache: Map<string, unknown> = new Map();

export const getArchon = async (chainId: string) => {
    if (_archonCache.has(chainId)) return _archonCache.get(chainId);
    // Dynamic import lets Vite handle the CJS module without require()
    const ArchonModule = await import('@kleros/archon');
    const ArchonClass = (ArchonModule as any).default ?? ArchonModule;
    const rpcUrl = getRPCURL(chainId);
    const instance = new ArchonClass(rpcUrl, 'https://cdn.kleros.link');
    _archonCache.set(chainId, instance);
    return instance;
}
