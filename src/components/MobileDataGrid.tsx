import { Box } from '@mui/material';
import { DataGrid, DataGridProps, GridValidRowModel } from '@mui/x-data-grid';

interface MobileDataGridProps<T extends GridValidRowModel> extends DataGridProps<T> {
  minWidth?: number | string;
}

const defaultMinWidth = 900;

export default function MobileDataGrid<T extends GridValidRowModel>({
  minWidth = defaultMinWidth,
  ...props
}: MobileDataGridProps<T>) {
  return (
    <Box sx={{ overflowX: { xs: 'auto', md: 'visible' }, width: '100%' }}>
      <DataGrid<T>
        {...props}
        sx={{
          minWidth: { xs: minWidth, md: 'auto' },
          ...props.sx,
        }}
      />
    </Box>
  );
}
