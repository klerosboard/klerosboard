import { useQuery } from '@tanstack/react-query';
import { LITEM_FIELDS, LItem } from '../graphql/subgraph';
import { curateQuery } from '../lib/apolloClient';
import { ADDRESS_TAG_REGISTRY_GNOSIS, ADDRESS_TAG_REGISTRY_MAINNET } from '../lib/helpers';

const PAGE_SIZE = 1000;

const buildQuery = (chainId: number) => `
  ${LITEM_FIELDS}
  query ArbitrablesNamesQuery($registryAddress: String!, $offset: Int!) {
    items: LItem(
      where: {registryAddress: {_eq: $registryAddress}, chainId: {_eq: ${chainId}}}
      limit: ${PAGE_SIZE}
      offset: $offset
      order_by: {latestRequestResolutionTime: asc}
    ) {
      ...LItemFields
    }
  }
`;

const fetchRegistryItems = async (registryAddress: string, chainId: number): Promise<LItem[]> => {
  const allItems: LItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const query = buildQuery(chainId);
    const data = await curateQuery<{ items: LItem[] }>(query, {
      registryAddress: registryAddress.toLowerCase(),
      offset,
    });

    const items = data?.items ?? [];
    allItems.push(...items);
    hasMore = items.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  return allItems;
};

export const useArbitrablesNames = () => {
  return useQuery<LItem[], Error>({
    queryKey: ['useArbitrablesNames'],
    queryFn: async () => {
      const [gnosisItems, mainnetItems] = await Promise.all([
        fetchRegistryItems(ADDRESS_TAG_REGISTRY_GNOSIS, 100),
        fetchRegistryItems(ADDRESS_TAG_REGISTRY_MAINNET, 1),
      ]);
      return [...gnosisItems, ...mainnetItems];
    },
  });
};
