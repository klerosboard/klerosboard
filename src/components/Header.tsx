import { Box, Typography } from '@mui/material'
import React from 'react'
import Background from "../assets/banners/header_ilustration.png"; // Import using relative path

export default function Header(props: { logo: string, title: string, text: string }) {
    

    return (
        <Box sx={{
            backgroundImage: `url(${Background})`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right',
            width: '100%',
            height: '100px',
            flexShrink: 0
        }}>
            <Box sx={{width: '80%'}}>
            <Typography variant='h1'>{props.title}</Typography>
            <Typography variant='body1'>{props.text}</Typography>
            </Box>
        </Box >
    )
}
