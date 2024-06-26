import { getRPCURL } from "./helpers";

export const getArchon = (chainId:string) => {
    var Archon = require('@kleros/archon');
    const rpcUrl = getRPCURL(chainId);
    var archon = new Archon.default(rpcUrl, 'https://cdn.kleros.link')
    return archon
}
