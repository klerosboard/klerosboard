import { useQuery } from '@tanstack/react-query';
import { gql } from '@apollo/client';
import { drtClient } from '../../lib/apolloClient';
import { DisputeTemplateV2, DisputeTemplateDataV2, DISPUTE_TEMPLATE_V2_QUERY } from '../../graphql/subgraphV2';

/**
 * Fetch a disputeTemplate by ID from the Kleros v2 DRT subgraph.
 * The DRT (Dispute Resolution Template) subgraph indexes template entities
 * with `templateData` (JSON string) containing title, description, answers, policyURI.
 *
 * Flow: dispute.templateId → DRT subgraph → templateData JSON → parsed metadata
 */
export const useDisputeTemplateV2 = (templateId: string | null | undefined) => {
  const { data, error, isLoading } = useQuery<DisputeTemplateV2 | null, Error>({
    queryKey: ['disputeTemplateV2', templateId],
    queryFn: async (): Promise<DisputeTemplateV2 | null> => {
      const response = await drtClient.query<{ disputeTemplate: DisputeTemplateV2 | null }>({
        query: gql(DISPUTE_TEMPLATE_V2_QUERY),
        variables: { id: templateId },
      });

      return response.data?.disputeTemplate ?? null;
    },
    enabled: !!templateId,
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });

  const templateData: DisputeTemplateDataV2 | undefined = (() => {
    if (!data?.templateData) return undefined;
    try {
      return JSON.parse(data.templateData) as DisputeTemplateDataV2;
    } catch {
      return undefined;
    }
  })();

  return { templateData, rawTemplate: data, error, isLoading };
};
