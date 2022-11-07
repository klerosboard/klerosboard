export const getArchon = (chainId:string) => {
    var Archon = require('@kleros/archon');
    if (chainId === '100') return new Archon.default(process.env.REACT_APP_WEB3_GNOSIS_PROVIDER_URL, 'https://ipfs.kleros.io')
    return new Archon.default(process.env.REACT_APP_WEB3_MAINNET_PROVIDER_URL, 'https://ipfs.kleros.io')
}