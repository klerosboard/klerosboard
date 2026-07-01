import { LItem } from '../graphql/subgraph';
import { useQuery } from '@tanstack/react-query';
import { curateQuery } from '../lib/apolloClient';
import { shortenIfAddress } from '../lib/utils';
import { ADDRESS_TAG_REGISTRY_GNOSIS, ADDRESS_TAG_REGISTRY_MAINNET } from '../lib/helpers';

const LITEM_NAME_FIELDS = `
  fragment LItemNameFields on LItem {
    key0
    key1
  }
`;

const fetchNameByAddress = async (arbitrableId: string): Promise<string> => {
  const address = arbitrableId.toLowerCase();
  let name: string = shortenIfAddress(address);

  // Query both registries simultaneously for the given address
  const query = `
    ${LITEM_NAME_FIELDS}
    query ArbitrableNameQuery($registryGnosis: String!, $registryMainnet: String!, $address: String!) {
      gnosis: LItem(
        where: {registryAddress: {_eq: $registryGnosis}, chainId: {_eq: 100}, key1: {_eq: $address}}
        limit: 1
      ) { ...LItemNameFields }
      mainnet: LItem(
        where: {registryAddress: {_eq: $registryMainnet}, chainId: {_eq: 1}, key1: {_eq: $address}}
        limit: 1
      ) { ...LItemNameFields }
    }
  `;

  const data = await curateQuery<{
    gnosis: LItem[];
    mainnet: LItem[];
  }>(query, {
    registryGnosis: ADDRESS_TAG_REGISTRY_GNOSIS.toLowerCase(),
    registryMainnet: ADDRESS_TAG_REGISTRY_MAINNET.toLowerCase(),
    address,
  });

  const gnosisItems = data?.gnosis ?? [];
  const mainnetItems = data?.mainnet ?? [];

  if (gnosisItems.length > 0) {
    name = gnosisItems[0].key0;
  } else if (mainnetItems.length > 0) {
    name = mainnetItems[0].key0;
  }

  return name;
};

export const useArbitrableName = (arbitrableId: string) => {
  return useQuery<string, Error>({
    queryKey: ['useArbitrableName', arbitrableId],
    queryFn: () => fetchNameByAddress(arbitrableId),
    enabled: !!arbitrableId,
  });
};
