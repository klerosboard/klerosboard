import { createTheme } from "@mui/material";

const palette = {
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
    contrastText: '#FFF'
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
}

let theme = createTheme();

const darkTheme = createTheme({
  palette,
  typography: {
    fontFamily: `Open Sans`,
    h1: {
      fontFamily: 'Open Sans',
      fontSize: '16px',
      lineHeight: '22px',
      fontWeight: 600,
      [theme.breakpoints.down('md')]: {
        fontSize: '',
      }
    },
    /*h1s: {
      fontFamily: 'Open Sans',
      fontSize: '47.78px',
    },*/
    h2: {
      fontWeight: 400,
      fontSize: '14px',
      lineHeight: '19px',
    },
    /*h2s: {
      fontFamily: 'Open Sans',
      fontSize: '39.81px',
    },*/
    h3: {
      fontFamily: 'Open Sans',
      fontSize: '39.81px',
      fontWeight: 700,
    },
    /*h3s: {
      fontFamily: 'Open Sans',
      fontSize: '33.18px',
    },*/
    h4: {
      fontFamily: 'Open Sans',
      fontSize: '33.18px',
      fontWeight: 700,
    },
    h4s: {
      fontFamily: 'Open Sans',
      fontSize: '27.65px',
      fontWeight: 700,
      [theme.breakpoints.down('md')]: {
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
              font-family: 'Mulish', sans-serif;
              background-color: ${palette.secondary.main};
              color: ${palette.black.dark};
            }
            h1 a, h2 a, h3 a, h4 a, h5 a, h6 a {
              color: ${palette.black.dark};
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
          background: palette.secondary.light,
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
          color: palette.secondary.main
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
          [theme.breakpoints.up('sm')]: {
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
          borderColor: palette.black.dark,
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
          }
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
          background: palette.black.dark,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: '44px',
          textTransform: 'none',
          color: '#B0B0B0',
          fontSize: '16px',
          '&.Mui-selected': {
            color: palette.black.dark,
            fontWeight: 700,
          }
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
          backgroundColor: '#000',
        },
        paper: {
          backgroundColor: palette.secondary.main,
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
          }
        },
        sizeLarge: {
          paddingTop: '10.5px',
          paddingBottom: '10.5px',
        },
        outlined: {
          background: '#FFF',
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
          color: palette.secondary.main
        },
      }
    },
    MuiListItemText: {
      styleOverrides: {
        root: {
          color: palette.secondary.main
        }
      }
    },
    MuiLink: {
      styleOverrides: {
        root: {
          textDecoration: 'none',
          '&:hover': {
            textDecoration: "underline",
            textDecorationColor: '#9013FE'
          },
        }
      }
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '0px 0px'
        },
      }
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0px 0px'
        },
      }
    },
    MuiGrid: {
      styleOverrides: {
        root: {
          paddingTop:'0px'
        }
      }
    }
  },
});

export default darkTheme;