export const getArchon = (chainId:string) => {
    var Archon = require('@kleros/archon');
    if (chainId === '100') return new Archon.default('https://rpc.gnosischain.com/', 'https://ipfs.kleros.io')
    return new Archon.default('https://mainnet.infura.io/v3/b5a46cdc09664198b8286953ed1d236a', 'https://ipfs.kleros.io')
}