import { Court, COURT_FIELDS } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloClientQuery } from "../lib/apolloClient";
import { getBlockByDate } from "../lib/helpers";
import { BigNumberish } from "ethers";

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
  return useQuery<Number, Error>(
    ["useRelativeCourtData", chainId, relTimestamp, courtId],
    async () => {
      let response = await apolloClientQuery<{ court: Court }>(
        chainId,
        query,
        { courtId: courtId }
      );
      if (!response) throw new Error("No response from TheGraph");

      const blockNumber = (await getBlockByDate(relTimestamp, chainId)).block;

      if (!blockNumber) throw new Error("No response from Infura");

      let responseRel = await apolloClientQuery<{ court: Court }>(
        chainId,
        relQuery,
        { blockNumber: blockNumber, courtId: courtId }
      );

      if (!responseRel) throw new Error("No response from TheGraph");

      return Number(response.data.court.disputesNum) - Number(responseRel.data.court.disputesNum);
    }
  );
};
