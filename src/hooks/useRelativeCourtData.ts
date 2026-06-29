import { Court, COURT_FIELDS } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../lib/apolloClient";
import { getBlockByDate } from "../lib/helpers";
import { BigNumberish } from "../lib/types";

const relQuery = `
    ${COURT_FIELDS}
    query court($blockNumber:Int!, $courtId:String!) {
        court(id: $courtId, block:{number:$blockNumber}) {
        ...CourtFields
      }
    }
`;

const query = `
    ${COURT_FIELDS}
    query relCourt($courtId:String!) {
      court(id: $courtId) {
        ...CourtFields
      }
    }
`;

interface Props {
  chainId: string;
  relTimestamp: string | Date;
  courtId: BigNumberish | string;
}

export const useRelativeCourtData = ({
  chainId,
  relTimestamp,
  courtId,
}: Props) => {
  return useQuery<Number, Error>({
    queryKey: ["useRelativeCourtData", chainId, relTimestamp, courtId],
    enabled: chainId !== '42161',
    queryFn: async () => {
      let response = await apolloClientQuery<{ court: Court }>(
        chainId,
        query,
        { courtId: courtId }
      );
      if (!response || !response.data) throw new Error("No response from TheGraph");

      const blockNumber = Number(await getBlockByDate(relTimestamp, chainId));

      if (!blockNumber) throw new Error("Could not determine block number");

      let responseRel = await apolloClientQuery<{ court: Court }>(
        chainId,
        relQuery,
        { blockNumber: blockNumber, courtId: courtId }
      );

      if (!responseRel) throw new Error("No response from TheGraph");

      return Number(response.data!.court.disputesNum) - Number(responseRel.data!.court.disputesNum);
    }
  });
};
