import { useState } from 'react'
import {
  Container,
  AppBar,
  Toolbar,
  Typography,
  Tabs,
  Tab,
  Box,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material'
import NotificationsPanel from './pages/NotificationsPanel'
import PriorityPanel from './pages/PriorityPanel'

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  }
})

export default function App() {
  const [tab, setTab] = useState(0)

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Campus Notifications
          </Typography>
        </Toolbar>
        <Tabs value={tab} onChange={(e, v) => setTab(v)} textColor="inherit" sx={{ bgcolor: 'rgba(255,255,255,0.1)' }}>
          <Tab label="All Notifications" />
          <Tab label="Priority Inbox" />
        </Tabs>
      </AppBar>
      <Container maxWidth="md" sx={{ mt: 3, mb: 3 }}>
        {tab === 0 && <NotificationsPanel />}
        {tab === 1 && <PriorityPanel />}
      </Container>
    </ThemeProvider>
  )
}