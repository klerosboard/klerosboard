import { Skeleton, Typography } from '@mui/material';

import { Vote } from '../../graphql/subgraph';
import { useMetaEvidence } from '../../hooks/useMetaEvidence';
import { voteMapping } from '../../lib/helpers';

export default function VoteMapping({
  vote,
  chainId,
  option,
}: {
  vote: Vote;
  chainId: string;
  option: 'currentRulling' | 'choice';
}) {
  const isV2 = chainId === '42161';
  const templateId = isV2 ? vote.dispute.templateId : null;
  const { metaEvidence } = useMetaEvidence(chainId, vote.dispute.arbitrable.id, vote.dispute.id, templateId);

  if (isV2 || metaEvidence !== undefined) {
    const rullingOptions = metaEvidence?.metaEvidenceJSON?.rulingOptions?.titles;
    return (
      <Typography>
        {voteMapping(
          option === 'choice' ? vote.choice : vote.dispute.currentRulling,
          vote.voted,
          vote.commit,
          rullingOptions,
        )}
      </Typography>
    );
  }
  return <Skeleton width={'20px'} />;
}
