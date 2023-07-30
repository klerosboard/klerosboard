
import React from 'react'
import Background from "../assets/banners/header_ilustration.png"; // Import using relative path
import { Box, Grid, Typography } from '@mui/material'

export default function Header(props: { logo: string, title: string , text: string | React.ReactNode}) {


    return (
        <Grid container sx={{
            backgroundImage: `url(${Background})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right',
            width: '100%',
            height: '100px',
            flexShrink: 0,
            marginBottom: '40px'
        }}
            justifyContent={'start'}
        >
            <Grid item sm={10} display={'inline-flex'} alignItems={'center'}>
                <Box
                    component="img"
                    sx={{
                        height: 24,
                        // width: 32,
                        marginRight: '20px'
                    }}
                    alt="Page logo"
                    src={props.logo}

                />

                <Typography variant='h1' style={{
                    color: '#333333',
                    fontStyle: 'normal',
                    fontWeight: 600,
                    fontSize: '24px',
                    lineHeight: '33px'
                }}>{props.title}</Typography>

            </Grid>
            <Grid item sm={12}>
                {
                typeof(props.text) === 'string'
                ?<Typography variant='body1' style={{
                        fontStyle: 'normal',
                        fontWeight: 400,
                        fontSize: '16px',
                        lineHeight: '22px',
                        color: '#999999'
                    }}>{props.text}</Typography>
                :props.text
                }
            </Grid>
        </Grid >
    )
}
