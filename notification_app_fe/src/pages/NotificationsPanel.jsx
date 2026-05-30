import { useState, useEffect } from 'react'
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Badge,
  CircularProgress,
  Alert,
  Button
} from '@mui/material'
import {
  MarkEmailRead,
  DeleteOutline,
  RefreshOutlined,
  DoneAll
} from '@mui/icons-material'

const API = 'http://localhost:3001/api'

const typeColors = {
  Placement: { bg: '#e3f2fd', color: '#1565c0' },
  Result: { bg: '#e8f5e9', color: '#2e7d32' },
  Event: { bg: '#fff3e0', color: '#e65100' }
}

export default function NotificationsPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('')

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      let url = `${API}/notifications`
      if (filter) url += `?notification_type=${filter}`
      const res = await fetch(url)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.notifications || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [filter])

  const markRead = async (id) => {
    await fetch(`${API}/notifications/${id}/read`, { method: 'PATCH' })
    setItems(prev => prev.map(i => i.id === id ? { ...i, isRead: true } : i))
  }

  const markAllRead = async () => {
    await fetch(`${API}/notifications/read-all`, { method: 'PATCH' })
    setItems(prev => prev.map(i => ({ ...i, isRead: true })))
  }

  const deleteItem = async (id) => {
    await fetch(`${API}/notifications/${id}`, { method: 'DELETE' })
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const formatTime = (ts) => {
    const d = new Date(ts)
    const now = new Date()
    const mins = Math.floor((now - d) / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return d.toLocaleDateString()
  }

  const unreadCount = items.filter(i => !i.isRead).length

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Badge badgeContent={unreadCount} color="error">
            <Typography variant="h6">Notifications</Typography>
          </Badge>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select value={filter} label="Type" onChange={e => setFilter(e.target.value)}>
              <MenuItem value="">All</MenuItem>
              <MenuItem value="Placement">Placement</MenuItem>
              <MenuItem value="Result">Result</MenuItem>
              <MenuItem value="Event">Event</MenuItem>
            </Select>
          </FormControl>
          <Button size="small" variant="outlined" startIcon={<DoneAll />} onClick={markAllRead} disabled={unreadCount === 0}>
            Read All
          </Button>
          <IconButton size="small" onClick={fetchData}><RefreshOutlined /></IconButton>
        </Box>
      </Box>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!loading && !error && items.length === 0 && <Alert severity="info">No notifications</Alert>}

      {!loading && items.map(item => (
        <Card key={item.id} sx={{ mb: 1, opacity: item.isRead ? 0.7 : 1, borderLeft: item.isRead ? 'none' : '4px solid #1976d2' }}>
          <CardContent sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Chip label={item.type} size="small" sx={{ bgcolor: typeColors[item.type]?.bg, color: typeColors[item.type]?.color, fontWeight: 600 }} />
                <Typography variant="caption" color="text.secondary">{formatTime(item.timestamp)}</Typography>
                {!item.isRead && <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1976d2' }} />}
              </Box>
              <Typography variant="body1">{item.message}</Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 0.5 }}>
              {!item.isRead && (
                <IconButton size="small" onClick={() => markRead(item.id)}><MarkEmailRead fontSize="small" /></IconButton>
              )}
              <IconButton size="small" onClick={() => deleteItem(item.id)}><DeleteOutline fontSize="small" /></IconButton>
            </Box>
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}