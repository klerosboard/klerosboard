import { LItem } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { curateQuery } from '../lib/apolloClient';
import { shortenIfAddress } from '../lib/utils';
import { ADDRESS_TAG_REGISTRY, buildScoutAddressKey } from '../lib/helpers';
import { useChainId } from './useChainId';

const LITEM_NAME_FIELDS = `
  fragment LItemNameFields on LItem {
    key0
    key1
  }
`;

const fetchNameByAddress = async (arbitrableId: string, chainId?: string): Promise<string> => {
  const address = arbitrableId.toLowerCase();

  // Scout format: key0 = "eip155:{chainId}:{address}", key1 = name.
  // Prefer an exact CAIP-10 match when chainId is known to avoid cross-chain
  // address collisions (e.g. same contract deployed on Mainnet and Gnosis).
  const key0Filter = chainId ? { _eq: buildScoutAddressKey(chainId, address) } : { _ilike: `%${address}%` };

  const query = `
    ${LITEM_NAME_FIELDS}
    query ArbitrableNameQuery($registryAddress: String!, $key0Filter: String_comparison_exp!) {
      items: LItem(
        where: {
          registryAddress: {_eq: $registryAddress},
          key0: $key0Filter
        }
        limit: 1
      ) { ...LItemNameFields }
    }
  `;

  const data = await curateQuery<{ items: LItem[] }>(query, {
    registryAddress: ADDRESS_TAG_REGISTRY.toLowerCase(),
    key0Filter,
  });

  const items = data?.items ?? [];
  return items.length > 0 ? items[0].key1 : shortenIfAddress(address);
};

export const useArbitrableName = (arbitrableId: string, chainId?: string) => {
  const currentChainId = useChainId();
  const resolvedChainId = chainId ?? currentChainId;

  return useQuery<string, Error>({
    queryKey: ['useArbitrableName', arbitrableId, resolvedChainId],
    queryFn: () => fetchNameByAddress(arbitrableId, resolvedChainId),
    enabled: !!arbitrableId,
  });
};
