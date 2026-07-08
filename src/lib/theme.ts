import { createTheme } from '@mui/material';

export type ThemeMode = 'light' | 'dark';

/**
 * Per-mode design tokens.
 *
 * NOTE: dark palette is TENTATIVE — derived from the existing per-color `dark`
 * variants already shipped in the codebase. Once the Figma spec lands, only the
 * `dark` branch below needs to be updated; the light branch is unchanged from
 * the previous single-theme setup.
 */
function getPalette(mode: ThemeMode) {
  const base = {
    primary: {
      light: '#333333',
      main: '#009AFF',
      dark: '#666',
      contrastText: '#000',
    },
    secondary: {
      light: '#FFF',
      main: '#FAFBFC',
      dark: '#009AFF',
      contrastText: '#303030',
    },
    violet: {
      light: '#4D00B4',
      main: '#4D00B4',
      dark: '#9013FE',
      contrastText: '#FFF',
    },
    black: {
      light: '#969696',
      main: '#636363',
      dark: '#303030',
      contrastText: '#FFF',
    },
    error: {
      light: '#FF8788',
      main: '#F73A3B',
      dark: '#C42E2F',
      contrastText: '#FFF',
    },
    success: {
      light: '#10C473',
      main: '#0EAB64',
      dark: '#0A7846',
      contrastText: '#FFF',
    },
    warning: {
      light: '#FADA34',
      main: '#FAD202',
      dark: '#E0BC02',
      contrastText: '#FFF',
    },
  };

  if (mode === 'light') {
    return {
      ...base,
      background: {
        default: base.secondary.main,
        paper: '#FFFFFF',
      },
      divider: '#E5E5E5',
      text: {
        primary: base.black.dark,
        secondary: base.black.main,
      },
    };
  }

  // Dark mode — palette extracted from Figma export (Homepage + cards + sidebar).
  // Surface hierarchy: page #1B003F → card #220050 → elevated #2A1260.
  return {
    ...base,
    primary: {
      ...base.primary,
      // Figma dark: links/accents use #6CC5FF (light blue), sidebar uses violet.
      main: '#6CC5FF',
      light: '#B45FFF',
      dark: '#009AFF',
      contrastText: '#1B003F',
    },
    secondary: {
      ...base.secondary,
      main: '#1B003F', // page background
      light: '#220050', // card surface
      dark: '#2A1260', // elevated surface / hover
      contrastText: '#FFFFFF',
    },
    violet: {
      ...base.violet,
      main: '#7E1BD4',
      light: '#4D00B4', // sidebar background (Figma dark)
      dark: '#B45FFF', // dividers/highlights
      contrastText: '#FFFFFF',
    },
    black: {
      ...base.black,
      light: '#746B9E', // muted text on dark
      main: '#A89DC4', // secondary text on dark
      dark: '#FFFFFF', // primary text on dark
      contrastText: '#1B003F',
    },
    background: {
      default: '#1B003F',
      paper: '#220050',
    },
    divider: '#42498F',
    text: {
      primary: '#FFFFFF',
      secondary: '#A89DC4',
    },
  };
}

// Breakpoint helper theme — only `breakpoints` is consumed below.
const breakbase = createTheme();

function buildTheme(mode: ThemeMode) {
  const palette = getPalette(mode);
  return createTheme({
    palette,
    typography: {
      fontFamily: `Open Sans`,
      h1: {
        fontFamily: 'Open Sans',
        fontSize: '24px',
        lineHeight: 1,
        fontWeight: 600,
        letterSpacing: 0,
      },
      h2: {
        fontWeight: 400,
        fontSize: '14px',
        lineHeight: '19px',
      },
      h3: {
        fontFamily: 'Open Sans',
        fontSize: '39.81px',
        fontWeight: 700,
      },
      h4: {
        fontFamily: 'Open Sans',
        fontSize: '33.18px',
        fontWeight: 700,
      },
      h4s: {
        fontFamily: 'Open Sans',
        fontSize: '27.65px',
        fontWeight: 700,
        [breakbase.breakpoints.down('md')]: {
          fontSize: '19.2px',
        },
      },
      h5: {
        fontFamily: 'Open Sans',
      },
      h6s: {
        fontFamily: 'Open Sans',
        fontSize: '19.2px',
      },
      p1: {
        fontSize: '19.2px',
      },
      p2: {
        fontSize: '16px',
      },
      p3: {
        fontSize: '14px',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: `
            body {
              font-family: 'Open Sans', sans-serif;
              background-color: ${palette.background.default};
              color: ${palette.text.primary};
            }
            h1 a, h2 a, h3 a, h4 a, h5 a, h6 a {
              color: ${palette.text.primary};
            }
            a {
              color: ${palette.primary.main};
            }
            span.js-link {
              cursor: pointer;
              color: ${palette.primary.main};
            }
            `,
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            boxShadow: 'none',
            background: palette.background.paper,
          },
        },
        defaultProps: {
          color: 'transparent',
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            boxShadow: '1',
            background: palette.violet.light,
            color: palette.secondary.contrastText,
            borderRight: 'none',
          },
        },
        defaultProps: {
          color: 'transparent',
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            justifyContent: 'space-between',
            [breakbase.breakpoints.up('sm')]: {
              minHeight: '92px',
            },
          },
        },
      },
      MuiContainer: {
        defaultProps: {
          maxWidth: 'xl',
        },
      },
      MuiInput: {
        defaultProps: {
          disableUnderline: true,
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          notchedOutline: {
            borderColor: palette.divider,
            borderRadius: '6px',
          },
          input: {
            padding: '8.5px 14px',
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '.MuiOutlinedInput-root': {
              padding: 0,
            },
            '.MuiOutlinedInput-root .MuiAutocomplete-input': {
              padding: '8.5px 14px',
            },
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            minHeight: '44px',
          },
          indicator: {
            height: '4px',
            background: palette.primary.main,
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            minHeight: '44px',
            textTransform: 'none',
            color: palette.text.secondary,
            fontSize: '16px',
            '&.Mui-selected': {
              color: palette.text.primary,
              fontWeight: 700,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            height: '28px',
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          root: {
            backgroundColor: palette.background.default,
          },
          paper: {
            backgroundColor: palette.background.paper,
            backgroundImage: 'none',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: '0 24px 20px 24px',
          },
        },
      },
      MuiButton: {
        defaultProps: {
          variant: 'contained',
          color: 'primary',
        },
        styleOverrides: {
          root: {
            boxShadow: 'none',
            textTransform: 'none',
            fontWeight: 700,
            borderRadius: 0,
            borderColor: 'transparent',
            '&:hover': {
              borderColor: 'transparent',
            },
          },
          sizeLarge: {
            paddingTop: '10.5px',
            paddingBottom: '10.5px',
          },
          outlined: {
            background: palette.background.paper,
            '&:hover': {
              background: palette.primary.light,
              color: palette.primary.main,
            },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: '56px',
            height: '42px',
          },
          track: {
            borderRadius: '10px',
            opacity: 1,
            backgroundColor: '#7D7D7D',
          },
          thumb: {
            width: '16px',
            height: '16px',
          },
          switchBase: {
            top: '4px',
            left: '4px',
            '&.Mui-checked': {
              color: 'white',
              left: '-2px',
              '&+.MuiSwitch-track': {
                opacity: 1,
              },
            },
          },
        },
      },
      MuiListSubheader: {
        styleOverrides: {
          root: {
            background: palette.violet.light,
            color: palette.secondary.contrastText,
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          root: {
            color: palette.secondary.contrastText,
          },
          primary: {
            fontFamily: 'Open Sans',
            fontSize: '14px',
            fontWeight: 400,
            lineHeight: 1,
            letterSpacing: 0,
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
              textDecorationColor: palette.violet.dark,
            },
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            padding: '0px 0px',
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            padding: '0px 0px',
          },
        },
      },
      MuiStep: {
        styleOverrides: {
          root: {
            // Allow steps to shrink so horizontal Stepper fits without scrollbar
            minWidth: 0,
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            whiteSpace: 'nowrap',
          },
        },
      },
      MuiGrid: {
        styleOverrides: {
          root: {
            paddingTop: '0px',
          },
        },
      },
    },
  });
}

export const lightTheme = buildTheme('light');
export const darkTheme = buildTheme('dark');
/** Backward-compat default — keeps `import theme from './lib/theme'` working. */
const theme = lightTheme;
export default theme;

/**
 * Shared card surface style — spread into `sx` props only.
 *
 * Uses MUI sx shorthand strings (`'background.paper'`, `'divider'`) so the
 * surface follows the active theme mode (light/dark) automatically. Do NOT
 * spread into `style` props — raw CSS does not resolve MUI palette paths.
 */
export const cardStyle = {
  background: 'background.paper',
  border: '1px solid',
  borderColor: 'divider',
  boxShadow: '0px 2px 3px rgba(0, 0, 0, 0.06)',
  borderRadius: '3px',
} as const;
