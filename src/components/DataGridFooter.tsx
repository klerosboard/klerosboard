import { Button, ButtonProps, Grid, Pagination, createSvgIcon } from '@mui/material';
import {
  GridToolbarContainer, useGridApiContext, useGridSelector, gridPageCountSelector,
  gridPageSelector,
  GridCsvExportOptions,
  GridCsvGetRowsToExportParams,
  gridSortedRowIdsSelector
} from '@mui/x-data-grid';




export function CustomFooter() {

  const apiRef = useGridApiContext();
  const page = useGridSelector(apiRef, gridPageSelector);
  const pageCount = useGridSelector(apiRef, gridPageCountSelector);

  const handleExport = (options: GridCsvExportOptions) =>
    apiRef.current.exportDataAsCsv(options);

  const ExportIcon = createSvgIcon(
    <path d="M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z" />,
    'SaveAlt',
  );

  const buttonBaseProps: ButtonProps = {
    sx: { color: 'primary', background: 'primary', fontWeight: '400', fontSize: '16px', fontFamily: 'Open Sans', fontStyle: 'normal' },
    variant: 'text',
    size: 'small',
    startIcon: <ExportIcon />,
  };

  const getUnfilteredRows = ({ apiRef }: GridCsvGetRowsToExportParams) =>
    gridSortedRowIdsSelector(apiRef);


  return (
    <GridToolbarContainer sx={{ display:'flex',justifyContent: 'flex-start' }}>
      <Grid item sm={4} flex={1}>
        <Button
          {...buttonBaseProps}
          onClick={() => handleExport({ getRowsToExport: getUnfilteredRows })}
        >
          Download CSV
        </Button>
      </Grid>
      <Grid item sm={4}>
        <Pagination
          color="primary"
          count={pageCount}
          page={page + 1}
          shape='rounded'
          variant='outlined'
          onChange={(event, value) => apiRef.current.setPage(value - 1)}
        />
      </Grid>
      <Grid item flex={1} sm={4}></Grid>
    </GridToolbarContainer>
  );
}
