import { Skeleton, Typography } from "@mui/material";

import { Vote } from "../../graphql/subgraph";
import { useMetaEvidence } from "../../hooks/useMetaEvidence";
import { voteMapping } from "../../lib/helpers";

export default function VoteMapping({
  vote,
  chainId,
  option,
}: {
  vote: Vote;
  chainId: string;
  option: "currentRulling" | "choice";
}) {
  const { metaEvidence } = useMetaEvidence(
    chainId,
    vote.dispute.arbitrable.id,
    vote.dispute.id
  );

  if (metaEvidence !== undefined) {
    const rullingOptions = metaEvidence.metaEvidenceJSON
      ? metaEvidence.metaEvidenceJSON.rulingOptions.titles
      : undefined;
    return (
      <Typography>
        {voteMapping(
          option === "choice" ? vote.choice : vote.dispute.currentRulling,
          vote.voted,
          vote.commit,
          rullingOptions
        )}
      </Typography>
    );
  }
  return <Skeleton width={"20px"} />;
}
