import { Skeleton, Typography } from '@mui/material';

import { voteMapping } from '../../lib/helpers';
import { Vote } from '../../graphql/subgraph';
import { useMetaEvidence } from '../../hooks/useMetaEvidence';

export default function VoteMapping({vote, chainId, option}: {vote: Vote, chainId: string, option: 'currentRulling' | 'choice'}) {
    const {metaEvidence} = useMetaEvidence(chainId, vote.dispute.arbitrable.id, vote.dispute.id)

    if (metaEvidence !== undefined){
        const rullingOptions = metaEvidence.metaEvidenceJSON ? metaEvidence.metaEvidenceJSON.rulingOptions.titles : ["Refuse Arbitrate**", "Yes**", "No**"] 
        return <Typography>{voteMapping(option === 'choice' ? vote.choice : vote.dispute.currentRulling, vote.voted, vote.commit, rullingOptions)}</Typography>
    }
    return <Skeleton width={'20px'}/>

}
