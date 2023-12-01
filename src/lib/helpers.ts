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

export function voteMapping(choice: BigNumberish | undefined, voted: boolean, commit: string, titles: string[]|undefined): string {
  if (titles === undefined) {
    console.log("No vote titles")
  }
  const _titles = titles || ['Refuse Arbitrate', 'Yes**', 'No**']
  const choiceNumber = Number(choice);
  if ((!voted || !choice) && commit === null) return 'Pending'
  
  if (commit !== null && !choice) return 'Commited'
  if (choiceNumber === 0) return 'Refuse to Arbitate'
  return _titles[Number(choice)]
}

export function getVoteStake(minStake: BigNumberish, alpha: BigNumberish): number {
  return Number(ethers.utils.formatUnits(minStake, 'ether')) * Number(alpha) / 10000
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


export const arbitrableWhitelist: Record<number, string[]> = {
  1: [
    "0x126697b552b83f08c7ebebae8d13eae2871e4e1e",
    "0x250aa88c8f54f5e70b94214380342f0d53e42f6c",
    "0x2e3b10abf091cdc53cc892a50dabdb432e220398",
    "0x2f0895732bfacdcf2fdb19962fe609d0da695f21",
    "0x46580533db92c418a79f91b46df70283daef7f99",
    "0x594ec762b59978c97c82bc36ab493ed8b1f1f368",
    "0x6341ec8f3f23689bd6ea3cf82fe34c3a0481c30a",
    "0x68c4cc21378301cfdd5702d66d58a036d7bafe28",
    "0x701cabaf65ed3974925fb94988842a29d2ce7aa3",
    "0x728cba71a3723caab33ea416cb46e2cc9215a596",
    "0x776e5853e3d61b2dfb22bcf872a43bf9a1231e52",
    "0x799cb978dea5d6ca00ccb1794d3c3d4c89e40cd1",
    "0x7ecffaa0247227a29d613adb3b1b47e44f0f53cb",
    "0x916deab80dfbc7030277047cd18b233b3ce5b4ab",
    "0xa3e4348bddc32afcedc5e088e0e21fd6154a0180",
    "0xab0d90943a58b1a64c0171ee8e743d9998be6ac3",
    "0xc5e9ddebb09cd64dfacab4011a0d5cedaf7c9bdb",
    "0xc9a3cd210cc9c11982c3acf7b7bf9b1083242cb6",
    "0xcb4aae35333193232421e86cd2e9b6c91f3b125f",
    "0xd47f72a2d1d0e91b0ec5e5f5d02b2dc26d00a14d",
    "0xd7e143715a4244634d74201959372e81a3623a2a",
    "0xd8bf5114796ed28aa52cff61e1b9ef4ec1f69a54",
    "0xe0e1bc8c6cd1b81993e2fcfb80832d814886ea38",
    "0xe5bcea6f87aaee4a81f64dfdb4d30d400e0e5cf4",
    "0xebcf3bca271b26ae4b162ba560e243055af0e679",
    "0xf339047c85d0dd2645f2bd802a1e8a5e7af61053",
    "0xf65c7560d6ce320cc3a16a07f1f65aab66396b9e",
    "0xf72cfd1b34a91a64f9a98537fe63fbab7530adca",
  ],
  100: [
    "0x0b928165a67df8254412483ae8c3b8cc7f2b4d36",
    "0x1d48a279966f37385b4ab963530c6dc813b3a8df",
    "0x2a2bab2c2d4eb5007b0389720b287d4d19dc4001",
    "0x2b6869e4f1d6104989f15da7454dbf7a01310bb8",
    "0x2e39b8f43d0870ba896f516f78f57cde773cf805",
    "0x2f19f817bbf800b487b7f2e51f24ad5ea0222463",
    "0x464c84c41f3c25ba5a75b006d8b20600a8777306",
    "0x54068a67441a950ff33afa5a3247acc7188d0789",
    "0x54a92c21c6553a8085066311f2c8d9db1b5e6610",
    "0x66260c69d03837016d88c9877e61e08ef74c59f2",
    "0x70533554fe5c17caf77fe530f77eab933b92af60",
    "0x76944a2678a0954a610096ee78e8ceb8d46d5922",
    "0x86e72802d9abbf7505a889721fd4d6947b02320e",
    "0x957a53a994860be4750810131d9c876b2f52d6e1",
    "0xa2bfff0553de7405781fe0c39c04a383f04b9c80",
    "0xa78ec5742a5d360f92f6d6d7e775fb35ab559a51",
    "0xaeecfa44639b61d2e0a9534d918789d94a24a9de",
    "0xd5994f15be9987104d9821aa99d1c97227c7c08c",
    "0xe04f5791d671d5c4e08ab49b39807087b591ea3e",
    "0xf7de5537ecd69a94695fcf4bcdbdee6329b63322",
  ],
};