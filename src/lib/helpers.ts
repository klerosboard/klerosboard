import fromUnixTime from "date-fns/fromUnixTime";
import format from "date-fns/format";
import { intervalToDuration } from "date-fns";
import formatDuration from "date-fns/formatDuration";
import compareAsc from "date-fns/compareAsc";
import { es, enGB } from "date-fns/locale";
import { BigNumber, BigNumberish } from "@ethersproject/bignumber";
import { DecimalBigNumber } from "./DecimalBigNumber";

import { ArchonDispute, I18nContextProps, MetaEvidence } from "./types";
import { apolloClientQuery } from "./apolloClient";
import { Court } from "../graphql/subgraph";
import { ethers } from "ethers";
import { Provider } from "@ethersproject/providers";
import { useMetaEvidence } from "../hooks/useMetaEvidence";
import { getArchon } from "./archonClient";

const dateLocales = {
  es,
  en: enGB,
};

// const chains = {
//   mainnet: '1',
//   gnosis: '100'
// }

export const MAINNET_KLEROSLIQUID =
  "0x988b3A538b618C7A603e1c11Ab82Cd16dbE28069";
export const GNOSIS_KLEROSLIQUID = "0x9C1dA9A04925bDfDedf0f6421bC7EEa8305F9002";
export const PNK_CONTRACT = "0x93ED3FBe21207Ec2E8f2d3c3de6e058Cb73Bc04d";
export const COOP_MULTISIG = "0x67a57535b11445506a9e340662cd0c9755e5b1b4";
export const ADDRESS_TAG_REGISTRY_GNOSIS =
  "0x76944a2678A0954A610096Ee78E8CEB8d46d5922";
export const ADDRESS_TAG_REGISTRY_MAINNET =
  "0x6e31d83b0c696f7d57241d3dffd0f2b628d14c67";

export function getRPCURL(chainId: string | number): string {
  if (chainId === "100" || chainId === 100)
    return process.env.REACT_APP_WEB3_GNOSIS_PROVIDER_URL!;
  if (chainId === "137" || chainId === 137)
    return process.env.REACT_APP_WEB3_POLYGON_PROVIDER_URL!;
  return process.env.REACT_APP_WEB3_MAINNET_PROVIDER_URL!;
}

export function getChainId(searchParams: URLSearchParams): string {
  const chain = searchParams.get("chainId");
  if (chain === "100") return "100";
  return "1";
}

export function getBlockExplorer(chainId: string): string {
  if (chainId === "100") return "https://blockscout.com/xdai/mainnet";
  return "https://etherscan.io";
}

export function getPeriodNumber(period: string): number {
  if (period === "evidence") return 0;
  if (period === "commit") return 1;
  if (period === "vote") return 2;
  if (period === "appeal") return 3;
  return 4;
}

export function formatDate(
  timestamp: number,
  formatString: string = "MMMM d yyyy, HH:mm"
) {
  const date = fromUnixTime(timestamp);
  return format(date, formatString);
}

export function getTimeLeft(
  endDate: Date | string | number,
  withSeconds = false,
  locale: I18nContextProps["locale"]
): string | false {
  const startDate = new Date();

  if (typeof endDate === "number" || typeof endDate === "string") {
    endDate = fromUnixTime(Number(endDate));
  }

  if (compareAsc(startDate, endDate) === 1) {
    return false;
  }

  const duration = intervalToDuration({ start: startDate, end: endDate });

  const format = ["years", "months", "weeks", "days", "hours"];

  if (withSeconds) {
    format.push("minutes", "seconds");
  } else if (Number(duration.days) < 1) {
    format.push("minutes");
  }

  return formatDuration(duration, { format, locale: dateLocales[locale] });
}

export function getCurrency(chainId: string): string {
  if (chainId === "100") return "xDAI";
  return "ETH";
}

export function format18DecimalNumber(value: BigNumberish): DecimalBigNumber {
  return new DecimalBigNumber(BigNumber.from(value), 18);
}

export function formatPNK(
  amount: BigNumberish,
  format?: boolean,
  currency?: boolean
): string {
  if (typeof format === "undefined") format = true;
  const number = format18DecimalNumber(amount);
  return (
    number.toString({ decimals: 0, format: format }) +
    `${currency ? " PNK" : ""}`
  );
}

export function formatAmount(
  amount: BigNumberish,
  chainId: string = "1",
  format?: boolean,
  currency?: boolean
): string {
  if (typeof format === "undefined") format = false;

  const number = new DecimalBigNumber(BigNumber.from(amount), 18);
  const decimals = chainId === "1" ? 4 : 2;
  return `${number.toString({ decimals: decimals, format: format })} ${
    currency ? getCurrency(chainId) : ""
  }`;
}

export function showWalletError(error: any) {
  if (error?.message) {
    if (error?.message.startsWith("{")) {
      try {
        const _error = JSON.parse(error?.message);

        return _error?.message;
      } catch (e: any) {}
    } else {
      return error?.message;
    }
  }
}

export const getCourtName = async (chainid: string, id: string) => {
  const query = `
  query CourtsPolicyQuery($id: String) {
      court(id: $id) {
          policy{policy}
      }
  }
`;

  const response = await apolloClientQuery<{ court: Court }>(chainid, query, {
    id,
  });

  if (!response) throw new Error("No response from TheGraph");

  if (response.data.court === null || response.data.court.policy === null)
    return "Unknown";
  const url = "https://ipfs.kleros.io" + response.data.court.policy.policy;
  const r = await fetch(url);
  const courtName = await r.json();
  return courtName.name;
};

export function voteMapping(
  choice: BigNumberish | undefined,
  voted: boolean,
  titles: string[] | undefined,
  chainId?: string
): string {
  if (titles === undefined) {
    console.log("No vote titles")
  }
  const _titles = titles || ["Yes*", "No*"];
  const choiceNumber = Number(choice);
  if (!voted || !choice) return "Pending";
  if (choiceNumber === 0) return "Refuse to Arbitate";
  // -1 because 0 is Refuse
  return _titles[Number(choice) - 1];
}

export function getVoteStake(
  minStake: BigNumberish,
  alpha: BigNumberish
): number {
  return (
    (Number(ethers.utils.formatUnits(minStake, "ether")) * Number(alpha)) /
    10000
  );
}

export async function getBlockByDate(
  timestamp: string | Date,
  chainId: string
) {
  const EthDater = require("block-by-date-ethers");
  let provider: Provider;
  if (chainId === "100") {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_WEB3_GNOSIS_PROVIDER_URL
    );
  } else {
    provider = new ethers.providers.JsonRpcProvider(
      process.env.REACT_APP_WEB3_MAINNET_PROVIDER_URL
    );
  }

  const dater = new EthDater(provider);
  let block = await dater.getDate(
    timestamp, //'2016-07-20T13:20:40Z', Date, required. Any valid moment.js value: string, milliseconds, Date() object, moment() object.
    true, // Block after, optional. Search for the nearest block before or after the given date. By default true.
    false // Refresh boundaries, optional. Recheck the latest block before request. By default false.
  );
  return block;
}

export async function fetchMetaEvidence({
  chainId,
  arbitrableId,
  disputeId,
}: {
  chainId: string;
  arbitrableId: string;
  disputeId: string;
}): Promise<MetaEvidence> {
  const KL = chainId === "100" ? GNOSIS_KLEROSLIQUID : MAINNET_KLEROSLIQUID;
  let archon = getArchon(chainId);
  try {
    const dispute: ArchonDispute = await archon.arbitrable.getDispute(
      arbitrableId,
      KL,
      disputeId
    );
    const metaEvidence: MetaEvidence = await archon.arbitrable.getMetaEvidence(
      arbitrableId,
      dispute.metaEvidenceID,
      {
        strict: true,
        scriptParameters: {
          disputeID: disputeId,
          arbitrableContractAddress: arbitrableId,
          arbitratorContractAddress: KL,
          arbitratorChainID: chainId,
          arbitrableChainID: chainId,
          arbitratorJsonRpcUrl: getRPCURL(chainId),
          arbitrableJsonRpcUrl: getRPCURL(chainId),
        },
      }
    );
    return metaEvidence
  } catch (error) {
    throw new Error(`Error fetching meta-evidence: ${error}`);
  }  
}