import { Dispatch } from "react";

/**
 * Assertion function
 */
export function assert(value: unknown, message: string | Error): asserts value {
  if (!value) throw message instanceof Error ? message : new Error(message);
}

export interface I18nContextProps {
  locale: LocaleEnum,
  handleChangeLocale: Dispatch<LocaleEnum>
}

export enum LocaleEnum {
  English = 'en',
  Spanish = 'es'
}

export enum ChainEnum {
  Mainnet = '1',
  Gnosis = '100'
}

declare module '@mui/material/styles' {
  interface Palette {
    black: Palette['primary'];
  }
  interface PaletteOptions {
    black: PaletteOptions['primary'];
  }
  interface TypographyVariants {
    p1: React.CSSProperties;
    p2: React.CSSProperties;
    p3: React.CSSProperties;
    h4s: React.CSSProperties;
    h6s: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    p1?: React.CSSProperties;
    p2?: React.CSSProperties;
    p3?: React.CSSProperties;
    h4s?: React.CSSProperties;
    h6s?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    p1: true;
    p2: true;
    p3: true;
    h4s: true;
    h6s: true;
  }
}

export interface MetaEvidence {
  metaEvidenceValid: boolean,
  fileValid: boolean,
  interfaceValid: boolean,
  metaEvidenceJSON: MetaEvidenceJson,
  submittedAt: number,
  blockNumber: number
  transactionHash: string
}

export interface MetaEvidenceJson {
    "fileURI": string,
    "fileHash": string,
    "fileTypeExtension": string,
    "category": string,
    "title": string,
    "description": string,
    "aliases": {
      [id: string]: string
    },
    "question": string,
    "rulingOptions": {
      "type": string,
      "precision": number,
      "titles": [],
      "descriptions": []
    },
    "evidenceDisplayInterfaceURI": string,
    "evidenceDisplayInterfaceHash": string,
    "dynamicScriptURI": string,
    "dynamicScriptHash": string,
}

export interface Evidence {
  evidenceJSON: {
    fileURI: string,
    fileHash: string,
    name: string,
    Description: string
  },
  evidenceValid: boolean,
  fileValid: boolean,
  submittedBy: string,
  submittedAt: string
}

export interface ArchonDispute {
    metaEvidenceID: string,
    evidenceGroupID: string,
    createdAt: number,
    blockNumber: number,
    transactionHash: string
}