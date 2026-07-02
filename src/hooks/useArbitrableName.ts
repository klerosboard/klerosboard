import { LItem } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { curateQuery } from '../lib/apolloClient';
import { shortenIfAddress } from '../lib/utils';
import { ADDRESS_TAG_REGISTRY } from '../lib/helpers';

const LITEM_NAME_FIELDS = `
  fragment LItemNameFields on LItem {
    key0
    key1
  }
`;

const fetchNameByAddress = async (arbitrableId: string): Promise<string> => {
  const address = arbitrableId.toLowerCase();

  // Scout format: key0 = "eip155:{chainId}:{address}", key1 = name.
  // _ilike is case-insensitive, so lowercase address matches checksummed forms.
  const query = `
    ${LITEM_NAME_FIELDS}
    query ArbitrableNameQuery($registryAddress: String!, $addressPattern: String!) {
      items: LItem(
        where: {
          registryAddress: {_eq: $registryAddress},
          key0: {_ilike: $addressPattern}
        }
        limit: 1
      ) { ...LItemNameFields }
    }
  `;

  const data = await curateQuery<{ items: LItem[] }>(query, {
    registryAddress: ADDRESS_TAG_REGISTRY.toLowerCase(),
    addressPattern: `%${address}%`,
  });

  const items = data?.items ?? [];
  return items.length > 0 ? items[0].key1 : shortenIfAddress(address);
};

export const useArbitrableName = (arbitrableId: string) => {
  return useQuery<string, Error>({
    queryKey: ['useArbitrableName', arbitrableId],
    queryFn: () => fetchNameByAddress(arbitrableId),
    enabled: !!arbitrableId,
  });
};
