import { CircularProgress, Grid, Tooltip, Typography } from '@mui/material';
import React from 'react';
import { Vote } from '../../graphql/subgraph';
import USER_VIOLET from '../../assets/icons/user_violet.png';
import BALANCE_VIOLET from '../../assets/icons/balance_violet.png';
import { BigNumberish } from '../../lib/types';
import VotePanel from './VotePanel';
import { MetaEvidence } from '../../lib/types';
import { getPeriodNumber, voteMapping } from '../../lib/helpers';
import StackedBarChart from '../StackedBarChart';

interface Props {
  votes: Vote[];
  chainId: string;
  disputeId: BigNumberish;
  roundId: BigNumberish;
  metaEvidence?: MetaEvidence;
  isDynamicScriptLoading?: boolean;
  hiddenVotes: boolean;
  period: string;
}

// Labels with their own fixed slot
const REFUSE_LABEL = 'Refuse to Arbitrate';
const COMMITTED_LABEL = 'Committed';

function getVoteCount(votes: Vote[], metaEvidence: MetaEvidence | undefined): [string, number][] {
  const count: Record<string, number> = {};
  votes.forEach((vote) => {
    const choice = voteMapping(
      vote.choice,
      vote.voted,
      vote.commit,
      metaEvidence?.metaEvidenceJSON?.rulingOptions?.titles,
    );
    count[choice] = (count[choice] ?? 0) + 1;
  });

  const sortable: [string, number][] = Object.entries(count).sort((a, b) => b[1] - a[1]);
  return sortable;
}

/**
 * Normalizes raw vote counts into fixed named slots:
 *   Pending | Committed* | Refuse to Arbitrate | <top option> | <2nd option> | (Others if needed)
 *
 * *Committed is only included when hiddenVotes=true and period > evidence.
 *  Otherwise those votes are re-classified as Pending (commit was never revealed).
 */
function normalizeToSlots(
  rawVotes: [string, number][],
  hiddenVotes: boolean,
  period: string,
  titles: string[] | undefined,
): [string, number][] {
  const committedIsValid = hiddenVotes && getPeriodNumber(period) > 0;

  let pending = 0;
  let committed = 0;
  let refuse = 0;
  const votedMap = new Map<string, number>(); // label -> count for options that got votes

  rawVotes.forEach(([label, count]) => {
    if (label === 'Pending') {
      pending += count;
    } else if (label === COMMITTED_LABEL) {
      if (committedIsValid) {
        committed += count;
      } else {
        pending += count;
      }
    } else if (label === REFUSE_LABEL) {
      refuse += count;
    } else {
      votedMap.set(label, (votedMap.get(label) ?? 0) + count);
    }
  });

  // Build the full option list from titles (all known options), filling 0 for unvoted ones.
  // Then sort descending by votes so top-2 are first.
  const allOptions: [string, number][] = titles
    ? titles.map((title) => [title, votedMap.get(title) ?? 0])
    : Array.from(votedMap.entries());

  allOptions.sort((a, b) => b[1] - a[1]);

  // Any label that got votes but isn't in titles (e.g. numeric fallback "3**") goes to Others
  const knownTitleSet = new Set(allOptions.map(([t]) => t));
  let others = 0;
  votedMap.forEach((count, label) => {
    if (!knownTitleSet.has(label)) others += count;
  });
  // Also collapse options beyond top-2 into Others
  others += allOptions.slice(2).reduce((acc, [, c]) => acc + c, 0);
  const top2 = allOptions.slice(0, 2);

  const slots: [string, number][] = [
    ...(pending > 0 ? [['Pending', pending] as [string, number]] : []),
    ...(committedIsValid ? [['Committed', committed] as [string, number]] : []),
    ['Refuse to Arbitrate', refuse],
    ...top2.map(([label, count]) => [label, count] as [string, number]),
    ...(others > 0 ? [['Others', others] as [string, number]] : []),
  ];

  return slots;
}

function getJuryDecision(sortedVotes: [string, number][], numVotes: number): string {
  const options = sortedVotes.map(([option]) => option);

  if (options.every((option) => option === 'Pending')) {
    return 'Pending decision';
  }

  const pendingOrCommitted = options.every((option) => option === 'Pending' || option === 'Committed');
  if (pendingOrCommitted) {
    return 'Decision to be revealed';
  }

  // Exclude non-votes (Pending / Committed) — they don't count as a ruling option.
  const actualVotes = sortedVotes.filter(([label]) => label !== 'Pending' && label !== COMMITTED_LABEL);

  if (actualVotes.length === 0) {
    return 'Pending decision';
  }

  const maxVotes = actualVotes[0][1];
  const tied = actualVotes.filter(([, votes]) => votes === maxVotes).length > 1;
  if (tied) {
    return 'Tied';
  }

  return `${actualVotes[0][0]} with ${actualVotes[0][1]} votes (${((Number(actualVotes[0][1]) / numVotes) * 100).toPrecision(3)}%)`;
}

export default function RoundPanel(props: Props) {
  const sortedVotes = getVoteCount(props.votes, props.metaEvidence);
  const juryDecison = getJuryDecision(sortedVotes, props.votes.length);
  const titles = props.metaEvidence?.metaEvidenceJSON?.rulingOptions?.titles;
  const chartData = normalizeToSlots(sortedVotes, props.hiddenVotes, props.period, titles);

  return (
    <div key={`RoundPanel-${props.roundId as string}`}>
      <Grid container sx={{ marginTop: '20px', width: '100%' }}>
        <Grid container size={12} columnSpacing={10} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 'auto' }} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <img src={USER_VIOLET} height="16px" alt="jurors" style={{ marginRight: '5px' }} />
            <Typography>{props.votes.length} Jurors</Typography>
          </Grid>
          <Grid
            size={{ xs: 12, sm: 'auto' }}
            sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, minWidth: 0 }}
          >
            <img src={BALANCE_VIOLET} height="16px" alt="jury" style={{ marginRight: '5px' }} />
            <Typography>Jury Decision:&nbsp;</Typography>
            <Typography sx={{ overflowWrap: 'break-word', minWidth: 0 }}>{juryDecison}</Typography>
            {props.isDynamicScriptLoading && (
              <Tooltip title="Loading ruling option titles…">
                <CircularProgress size={14} thickness={5} />
              </Tooltip>
            )}
          </Grid>
          <Grid size={12} sx={{ display: 'inline-flex', alignItems: 'center' }}>
            <StackedBarChart data={chartData} />
          </Grid>
        </Grid>

        {props.votes.length === 0 ? (
          <Typography>Jurors weren't drawn yet</Typography>
        ) : (
          props.votes
            .slice()
            .sort((a, b) => a.address.id.localeCompare(b.address.id))
            .map((vote) => {
              return (
                <VotePanel
                  vote={vote}
                  chainId={props.chainId}
                  key={`VotePanel-${vote.id}`}
                  metaEvidence={props.metaEvidence}
                  isDynamicScriptLoading={props.isDynamicScriptLoading}
                />
              );
            })
        )}
      </Grid>
    </div>
  );
}
