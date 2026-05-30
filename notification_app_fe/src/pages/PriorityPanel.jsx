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
  CircularProgress,
  Alert,
  LinearProgress
} from '@mui/material'
import { RefreshOutlined } from '@mui/icons-material'

const API = 'http://localhost:3001/api'

const typeColors = {
  Placement: { bg: '#e3f2fd', color: '#1565c0' },
  Result: { bg: '#e8f5e9', color: '#2e7d32' },
  Event: { bg: '#fff3e0', color: '#e65100' }
}

export default function PriorityPanel() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [topN, setTopN] = useState(10)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API}/notifications/priority?n=${topN}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setItems(data.notifications || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [topN])

  const maxScore = items.length > 0 ? Math.max(...items.map(i => i.relevanceScore || 0)) : 1

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Priority Inbox</Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel>Show Top</InputLabel>
            <Select value={topN} label="Show Top" onChange={e => setTopN(e.target.value)}>
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={15}>15</MenuItem>
              <MenuItem value={20}>20</MenuItem>
            </Select>
          </FormControl>
          <IconButton size="small" onClick={fetchData}><RefreshOutlined /></IconButton>
        </Box>
      </Box>

      <Alert severity="info" sx={{ mb: 2 }}>
        Ranked by importance (Placement &gt; Result &gt; Event) and recency
      </Alert>

      {loading && <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}><CircularProgress /></Box>}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && items.map((item, idx) => (
        <Card key={item.id || idx} sx={{ mb: 1.5 }} className="priority-card">
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              <Chip label={`#${idx + 1}`} size="small" color="primary" variant="outlined" />
              <Chip
                label={item.type}
                size="small"
                sx={{ bgcolor: typeColors[item.type]?.bg, color: typeColors[item.type]?.color, fontWeight: 600 }}
              />
              <Typography variant="caption" color="text.secondary">{item.timestamp}</Typography>
            </Box>
            <Typography variant="body1" sx={{ mb: 1 }}>{item.message}</Typography>
            {item.relevanceScore && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={(item.relevanceScore / maxScore) * 100}
                  sx={{ flex: 1, height: 6, borderRadius: 3 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ minWidth: 45 }}>
                  {item.relevanceScore.toFixed(3)}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      ))}
    </Box>
  )
}