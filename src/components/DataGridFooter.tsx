import { Pagination } from '@mui/material';
import {GridToolbarContainer, GridToolbarExport, useGridApiContext, useGridSelector, gridPageCountSelector,
    gridPageSelector} from '@mui/x-data-grid';


export function CustomFooter() {

    const apiRef = useGridApiContext();
    const page = useGridSelector(apiRef, gridPageSelector);
    const pageCount = useGridSelector(apiRef, gridPageCountSelector);
  
    return (
      <>
      <GridToolbarContainer>
        <GridToolbarExport />
      </GridToolbarContainer>
      <Pagination
      color="primary"
      count={pageCount}
      page={page + 1}
      onChange={(event, value) => apiRef.current.setPage(value - 1)}
    />
    </>
    );
  }
  