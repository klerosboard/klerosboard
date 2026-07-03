import { useQuery } from '@tanstack/react-query';
import { gql } from '@apollo/client';
import { apolloClientQuery, drtClient } from '../../lib/apolloClient';
import {
  DisputeTemplateDataV2,
  DISPUTE_TEMPLATES_BATCH_V2_QUERY,
  DISPUTES_TEMPLATE_IDS_V2_QUERY,
} from '../../graphql/subgraphV2';
import { UNKNOWN_CATEGORY } from '../../lib/arbitrableCategories';

const MAX_PAGES = 1000;

/**
 * Fetches dispute → category mapping for v2 (Arbitrum) by:
 * 1. Batch-querying the coreneo subgraph for all dispute IDs + templateIds
 * 2. Batch-querying the DRT subgraph for all template IDs + templateData
 * 3. Parsing templateData JSON to extract the `category` field
 * 4. Joining: disputeId → templateId → category
 *
 * Returns a Map<disputeId, category>. Disputes without a template or
 * whose template has no category fall back to UNKNOWN_CATEGORY.
 */
export const useDisputeCategoriesV2 = (chainId: string) => {
  return useQuery<Map<string, string>, Error>({
    queryKey: ['disputeCategoriesV2', chainId],
    queryFn: async () => {
      // 1. Fetch all disputes with their templateId
      const disputeToTemplate: Map<string, string | null> = new Map();
      let lastId = '';
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await apolloClientQuery<{
          disputes: Array<{ id: string; templateId?: string | null }>;
        }>(chainId, DISPUTES_TEMPLATE_IDS_V2_QUERY, { first: 1000, id_gt: lastId });

        const batch = response.data?.disputes ?? [];
        for (const d of batch) {
          disputeToTemplate.set(d.id, d.templateId ?? null);
        }
        if (batch.length < 1000) break;
        lastId = batch[batch.length - 1].id;
      }

      // 2. Fetch all dispute templates from DRT subgraph
      const templateToCategory: Map<string, string> = new Map();
      let lastTemplateId = '';
      for (let page = 0; page < MAX_PAGES; page++) {
        const response = await drtClient.query<{
          disputeTemplates: Array<{ id: string; templateData: string }>;
        }>({
          query: gql(DISPUTE_TEMPLATES_BATCH_V2_QUERY),
          variables: { first: 1000, id_gt: lastTemplateId },
        });

        const batch = response.data?.disputeTemplates ?? [];
        for (const t of batch) {
          try {
            const parsed = JSON.parse(t.templateData) as DisputeTemplateDataV2;
            templateToCategory.set(t.id, parsed.category || UNKNOWN_CATEGORY);
          } catch {
            // Skip templates with invalid JSON
          }
        }
        if (batch.length < 1000) break;
        lastTemplateId = batch[batch.length - 1].id;
      }

      // 3. Join: disputeId → category
      const result = new Map<string, string>();
      for (const [disputeId, templateId] of disputeToTemplate) {
        if (templateId && templateToCategory.has(templateId)) {
          result.set(disputeId, templateToCategory.get(templateId)!);
        } else {
          result.set(disputeId, UNKNOWN_CATEGORY);
        }
      }
      return result;
    },
    enabled: !!chainId && chainId === '42161',
    staleTime: 5 * 60 * 1000,
  });
};
