import { useQuery } from '@tanstack/react-query';
import { LITEM_FIELDS, LItem } from '../graphql/subgraph';
import { curateQuery } from '../lib/apolloClient';
import { ADDRESS_TAG_REGISTRY } from '../lib/helpers';

const PAGE_SIZE = 1000;

const buildQuery = () => `
  ${LITEM_FIELDS}
  query ArbitrablesNamesQuery($registryAddress: String!, $offset: Int!) {
    items: LItem(
      where: {registryAddress: {_eq: $registryAddress}}
      limit: ${PAGE_SIZE}
      offset: $offset
      order_by: {latestRequestResolutionTime: asc}
    ) {
      ...LItemFields
    }
  }
`;

const fetchRegistryItems = async (registryAddress: string): Promise<LItem[]> => {
  const allItems: LItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const query = buildQuery();
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
      return fetchRegistryItems(ADDRESS_TAG_REGISTRY);
    },
  });
};
