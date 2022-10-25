var Archon = require('@kleros/archon')

export const getArchon = (chainId:string) => {
    if (chainId === '100') return Archon('https://rpc.gnosischain.com/')
    return new Archon('https://mainnet.infura.io/v3/c9a92fe089b5466ab56a47925486d062')
}