// ByteBreak Backend Server
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage (initialize from file if exists)
let dataStore = {
  sessions: [],
  dailyStats: {},
  weeklyStats: []
};

// Load data from file on startup
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      dataStore = JSON.parse(data);
      console.log('Data loaded from file');
    }
  } catch (error) {
    console.log('No previous data found, starting fresh');
  }
}

// Save data to file
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataStore, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Initialize data on startup
loadData();

// Routes

// Health check
app.get('/', (req, res) => {
  res.json({
    status: 'ByteBreak Backend Running',
    version: '1.0.0',
    endpoints: ['/track', '/summary', '/weekly', '/reset']
  });
});

// Track time endpoint
app.post('/track', (req, res) => {
  try {
    const { domain, timeSpent, category, timestamp } = req.body;
    
    if (!domain || !timeSpent || !category) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Add to sessions
    dataStore.sessions.push({
      domain,
      timeSpent,
      category,
      timestamp: timestamp || new Date().toISOString()
    });
    
    // Update daily stats
    const today = getCurrentDate();
    if (!dataStore.dailyStats[today]) {
      dataStore.dailyStats[today] = {
        productive: {},
        unproductive: {},
        totalProductive: 0,
        totalUnproductive: 0
      };
    }
    
    const dailyStat = dataStore.dailyStats[today];
    
    if (category === 'productive') {
      dailyStat.productive[domain] = (dailyStat.productive[domain] || 0) + timeSpent;
      dailyStat.totalProductive += timeSpent;
    } else if (category === 'unproductive') {
      dailyStat.unproductive[domain] = (dailyStat.unproductive[domain] || 0) + timeSpent;
      dailyStat.totalUnproductive += timeSpent;
    }
    
    // Save to file
    saveData();
    
    res.json({
      success: true,
      message: 'Time tracked successfully',
      data: { domain, timeSpent, category }
    });
    
  } catch (error) {
    console.error('Error tracking time:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get summary endpoint
app.get('/summary', (req, res) => {
  try {
    const today = getCurrentDate();
    const todayStats = dataStore.dailyStats[today] || {
      productive: {},
      unproductive: {},
      totalProductive: 0,
      totalUnproductive: 0
    };
    
    // Aggregate website data
    const websiteData = [];
    
    // Add productive websites
    for (const [domain, time] of Object.entries(todayStats.productive)) {
      websiteData.push({ domain, time, category: 'productive' });
    }
    
    // Add unproductive websites
    for (const [domain, time] of Object.entries(todayStats.unproductive)) {
      websiteData.push({ domain, time, category: 'unproductive' });
    }
    
    // Sort by time spent
    websiteData.sort((a, b) => b.time - a.time);
    
    res.json({
      date: today,
      totalProductive: todayStats.totalProductive,
      totalUnproductive: todayStats.totalUnproductive,
      totalTime: todayStats.totalProductive + todayStats.totalUnproductive,
      productivityPercentage: calculateProductivityPercentage(
        todayStats.totalProductive,
        todayStats.totalUnproductive
      ),
      websites: websiteData.slice(0, 10), // Top 10 websites
      fullData: {
        productive: todayStats.productive,
        unproductive: todayStats.unproductive
      }
    });
    
  } catch (error) {
    console.error('Error getting summary:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get weekly stats endpoint
app.get('/weekly', (req, res) => {
  try {
    const last7Days = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayStats = dataStore.dailyStats[dateStr] || {
        totalProductive: 0,
        totalUnproductive: 0
      };
      
      last7Days.push({
        date: dateStr,
        productive: dayStats.totalProductive,
        unproductive: dayStats.totalUnproductive,
        total: dayStats.totalProductive + dayStats.totalUnproductive
      });
    }
    
    // Calculate weekly totals
    const weeklyTotals = last7Days.reduce((acc, day) => ({
      productive: acc.productive + day.productive,
      unproductive: acc.unproductive + day.unproductive,
      total: acc.total + day.total
    }), { productive: 0, unproductive: 0, total: 0 });
    
    res.json({
      weeklyData: last7Days,
      weeklyTotals,
      productivityPercentage: calculateProductivityPercentage(
        weeklyTotals.productive,
        weeklyTotals.unproductive
      )
    });
    
  } catch (error) {
    console.error('Error getting weekly stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reset data endpoint (for testing)
app.post('/reset', (req, res) => {
  dataStore = {
    sessions: [],
    dailyStats: {},
    weeklyStats: []
  };
  saveData();
  res.json({ success: true, message: 'Data reset successfully' });
});

// Helper function
function calculateProductivityPercentage(productive, unproductive) {
  const total = productive + unproductive;
  if (total === 0) return 0;
  return Math.round((productive / total) * 100);
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 ByteBreak Backend Server running on http://localhost:${PORT}`);
  console.log(`📊 Data file: ${DATA_FILE}`);
  console.log('\nAvailable endpoints:');
  console.log('  GET  /         - Health check');
  console.log('  POST /track    - Track time data');
  console.log('  GET  /summary  - Get daily summary');
  console.log('  GET  /weekly   - Get weekly stats');
  console.log('  POST /reset    - Reset all data');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nSaving data before shutdown...');
  saveData();
  console.log('Data saved. Goodbye!');
  process.exit(0);
});
