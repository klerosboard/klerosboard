import { styled } from '@mui/material/styles';
import { Container, Typography } from "@mui/material";
import { Trans } from "@lingui/macro";


const FooterWrapper = styled('footer')(({ theme }) => ({
  background: theme.palette.secondary.main,

  '>div': {
    minHeight: '52px',
    alignItems: 'center',
    textAlign: 'center',
    position: 'absolute',
    bottom: '0',
    with: '100%'
  },

  [theme.breakpoints.down('md')]: {
    textAlign: 'center',
  },
}));

const FooterContainer = styled(Container)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    padding: '10px 0',
    '& > div': {
      marginTop: '10px',
    },
  },
  [theme.breakpoints.up('md')]: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
}));

export default function Footer() {
  return (
    <FooterWrapper>
      <FooterContainer>
        <Typography>Made with 💜 by @Koki to the Kleros Community</Typography>
      </FooterContainer>
    </FooterWrapper>
  );
}