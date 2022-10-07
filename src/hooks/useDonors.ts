import { DONOR_FIELDS, Donor } from "../graphql/subgraph";
import { useQuery } from "@tanstack/react-query";
import { apolloSuscriptionQuery } from "../lib/apolloClient";
import { buildQuery, QueryVariables } from "../lib/SubgraphQueryBuilder";

const query = `
    ${DONOR_FIELDS}
    query DonorsQuery(#params#) {
      donors(where:{#where#} orderBy:totalDonated, orderDirection:desc, first:1000){
          ...DonorFields
    }
  }
`;

export interface Props {
  id?: string
}

export const useDonors = ({id}: Props = {}) => {
  return useQuery<Donor[], Error>(
    ["useDonors", id],
    async () => {

      const variables: QueryVariables = {};
      if (id){
        variables['id'] = id.toLowerCase();
      }

      const response = await apolloSuscriptionQuery<{ donors: Donor[] }>(buildQuery(query, variables), variables);

      if (!response) throw new Error("No response from TheGraph");

      return response.data.donors;
    }
  );
};