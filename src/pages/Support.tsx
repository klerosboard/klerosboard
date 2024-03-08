import React, { useEffect, useState } from 'react'
import Header from '../components/Header'
import HEART from '../assets/icons/heart_violet.png';
import {  InputAdornment, TextField, Typography } from '@mui/material';
import { useDonors } from '../hooks/useDonors';
import { DataGrid, GridRenderCellParams } from '@mui/x-data-grid';
import { CustomFooter } from '../components/DataGridFooter'
import { formatAmount } from '../lib/helpers';
import JurorLink from '../components/JurorLink';
import { BigNumberish } from 'ethers';
import { Donor } from '../graphql/subgraph';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import { useLocation } from 'react-router-dom';


const formStyle = {
  border: '1px solid #E5E5E5',
  borderRadius: '3px'
}

interface RankedDonor extends Donor {
  ranking: number
}
function addRanking(donors: Donor[]): RankedDonor[] {
  // donors should be ordered by totalDonated in desc direction
  let rankedDonors: RankedDonor[] = []
  donors.forEach((donor, index) => {
    rankedDonors.push({ ...donor, ranking: index + 1 })
  })
  return rankedDonors;
}

export default function Support() {
  const location = useLocation();
  const match = location.pathname.match('(100|1)(?:/|$)')
  const chainId = match ? match[1] : null

  const [supporterId, setSupporterId] = useState<string | undefined>(undefined);
  const { data: donors, isLoading } = useDonors({ id: supporterId });
  const [rankedDonors, setRankedDonors] = useState<RankedDonor[] | undefined>(undefined);
  const [pageSize, setPageSize] = useState<number>(10);
  const [showClearIcon, setShowClearIcon] = useState("none");

  const handleSetSupporter = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.value === "") {
      setSupporterId(undefined);
      setShowClearIcon("none")
      return
    }
    setShowClearIcon("flex")
    setSupporterId(e.currentTarget.value)
  }

  const handleClearClick = (): void => {
    setSupporterId(undefined);
    setShowClearIcon("none")
  };

  useEffect(() => {
    if (donors) {
      setRankedDonors(addRanking(donors))
    }
  }, [donors])

  const columns = [
    { field: 'ranking', headerName: 'Ranking' },
    {
      field: 'id', headerName: 'Supporter', flex: 2, renderCell: (params: GridRenderCellParams<string>) => (
        <JurorLink address={params.value!} chainId={chainId!} />
      )
    },
    {
      field: 'totalDonated', headerName: 'Total Donated', flex: 1, valueFormatter: (params: { value: BigNumberish }) => {
        return formatAmount(params.value as number);
      }
    }
  ];


  return (
    <div>
      <Header
        logo={HEART}
        title='Support Klerosboard with donations!'
        text='Klerosboard is a community-created tool developed by @kokialgo to provide metrics, statistics, and insights about Kleros.'
      />


      <Typography sx={{
        fontWeight: 600,
        fontSize: '24px',
        lineHeight: '33px',
        color: '#333333',
      }}>Donors Leaderboard</Typography>
      
      <div style={{ display: 'inline-flex', alignItems: 'center', marginTop: '20px' }}>
        <TextField 
          id="supporterIdTextField"
          label="Search"
          variant="outlined"
          onChange={handleSetSupporter}
          sx={formStyle}
          value={supporterId || ""}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            endAdornment: (
              <InputAdornment
                position="end"
                style={{ display: showClearIcon }}
                onClick={handleClearClick}
              >
                <ClearIcon />
              </InputAdornment>
            )
          }}/>
      </div>

      {<DataGrid
        rows={rankedDonors ? rankedDonors! : []}
        columns={columns}
        loading={rankedDonors === undefined && isLoading}
        pageSize={pageSize}
        onPageSizeChange={(newPageSize) => setPageSize(newPageSize)}
        rowsPerPageOptions={[10, 50, 100]}
        pagination
        disableSelectionOnClick
        autoHeight={true}
        components={{
          Footer: CustomFooter
        }}
        sx={{
          marginTop: '20px'
        }}
      />}
    </div>
  )
}
