// ByteBreak Background Service Worker - Core Tracking Logic

const BACKEND_URL = 'http://localhost:3000';

// Classification Lists
const PRODUCTIVE_DOMAINS = [
  'github.com', 'stackoverflow.com', 'leetcode.com', 'codechef.com',
  'hackerrank.com', 'coursera.org', 'udemy.com', 'udacity.com',
  'edx.org', 'khanacademy.org', 'freecodecamp.org', 'codecademy.com',
  'developer.mozilla.org', 'docs.python.org', 'nodejs.org',
  'reactjs.org', 'vuejs.org', 'angular.io', 'w3schools.com',
  'geeksforgeeks.org', 'medium.com', 'dev.to', 'hashnode.dev'
];

const UNPRODUCTIVE_DOMAINS = [
  'facebook.com', 'instagram.com', 'twitter.com', 'x.com',
  'snapchat.com', 'tiktok.com', 'reddit.com', 'pinterest.com',
  'netflix.com', 'youtube.com', 'twitch.tv', 'discord.com',
  'whatsapp.com', 'telegram.org', 'linkedin.com'
];

// State Management
let currentTab = null;
let currentDomain = null;
let startTime = null;
let trackingActive = false;

// Initialize on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('ByteBreak installed successfully');
  initializeStorage();
});

// Initialize storage structure
async function initializeStorage() {
  const data = await chrome.storage.local.get(['dailyData', 'weeklyData']);
  
  if (!data.dailyData) {
    await chrome.storage.local.set({
      dailyData: {
        date: getCurrentDate(),
        productive: {},
        unproductive: {},
        totalProductive: 0,
        totalUnproductive: 0
      }
    });
  }
  
  if (!data.weeklyData) {
    await chrome.storage.local.set({
      weeklyData: []
    });
  }
}

// Get current date in YYYY-MM-DD format
function getCurrentDate() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch (e) {
    return null;
  }
}

// Classify domain
function classifyDomain(domain) {
  if (!domain) return 'unknown';
  
  // Check productive domains
  for (const productiveDomain of PRODUCTIVE_DOMAINS) {
    if (domain.includes(productiveDomain) || productiveDomain.includes(domain)) {
      return 'productive';
    }
  }
  
  // Check unproductive domains
  for (const unproductiveDomain of UNPRODUCTIVE_DOMAINS) {
    if (domain.includes(unproductiveDomain) || unproductiveDomain.includes(domain)) {
      return 'unproductive';
    }
  }
  
  // Special case: YouTube - check if educational
  if (domain.includes('youtube.com')) {
    return 'unproductive'; // Default to unproductive, can be enhanced later
  }
  
  return 'unknown';
}

// Start tracking
function startTracking(tabId, url) {
  const domain = extractDomain(url);
  if (!domain) return;
  
  // Stop previous tracking if any
  if (trackingActive) {
    stopTracking();
  }
  
  currentTab = tabId;
  currentDomain = domain;
  startTime = Date.now();
  trackingActive = true;
  
  console.log(`Started tracking: ${domain}`);
}

// Stop tracking and save data
async function stopTracking() {
  if (!trackingActive || !currentDomain || !startTime) return;
  
  const endTime = Date.now();
  const timeSpent = Math.floor((endTime - startTime) / 1000); // in seconds
  
  if (timeSpent < 1) {
    resetTracking();
    return;
  }
  
  const category = classifyDomain(currentDomain);
  
  console.log(`Stopped tracking: ${currentDomain}, Time: ${timeSpent}s, Category: ${category}`);
  
  // Save to storage
  await saveTimeData(currentDomain, timeSpent, category);
  
  // Send to backend
  sendToBackend(currentDomain, timeSpent, category);
  
  resetTracking();
}

// Reset tracking state
function resetTracking() {
  currentTab = null;
  currentDomain = null;
  startTime = null;
  trackingActive = false;
}

// Save time data to chrome.storage
async function saveTimeData(domain, timeSpent, category) {
  const data = await chrome.storage.local.get('dailyData');
  let dailyData = data.dailyData;
  
  // Check if new day
  const today = getCurrentDate();
  if (dailyData.date !== today) {
    // Archive old data to weekly
    await archiveDailyData(dailyData);
    
    // Reset daily data
    dailyData = {
      date: today,
      productive: {},
      unproductive: {},
      totalProductive: 0,
      totalUnproductive: 0
    };
  }
  
  // Update data
  if (category === 'productive') {
    dailyData.productive[domain] = (dailyData.productive[domain] || 0) + timeSpent;
    dailyData.totalProductive += timeSpent;
  } else if (category === 'unproductive') {
    dailyData.unproductive[domain] = (dailyData.unproductive[domain] || 0) + timeSpent;
    dailyData.totalUnproductive += timeSpent;
  }
  
  await chrome.storage.local.set({ dailyData });
}

// Archive daily data to weekly
async function archiveDailyData(dailyData) {
  const data = await chrome.storage.local.get('weeklyData');
  let weeklyData = data.weeklyData || [];
  
  weeklyData.push({
    date: dailyData.date,
    totalProductive: dailyData.totalProductive,
    totalUnproductive: dailyData.totalUnproductive
  });
  
  // Keep only last 7 days
  if (weeklyData.length > 7) {
    weeklyData = weeklyData.slice(-7);
  }
  
  await chrome.storage.local.set({ weeklyData });
}

// Send data to backend
async function sendToBackend(domain, timeSpent, category) {
  try {
    await fetch(`${BACKEND_URL}/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        domain,
        timeSpent,
        category,
        timestamp: new Date().toISOString()
      })
    });
  } catch (error) {
    console.log('Backend not available:', error.message);
  }
}

// Listen to tab activation
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const tab = await chrome.tabs.get(activeInfo.tabId);
  if (tab.url) {
    startTracking(tab.id, tab.url);
  }
});

// Listen to tab updates (URL changes)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.url && tab.active) {
    startTracking(tabId, changeInfo.url);
  }
});

// Listen to window focus changes
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    // Browser lost focus
    stopTracking();
  } else {
    // Browser gained focus - start tracking active tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        startTracking(tabs[0].id, tabs[0].url);
      }
    });
  }
});

// Listen to tab removal
chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTab) {
    stopTracking();
  }
});

// Periodic save (every 30 seconds) - safety measure
setInterval(() => {
  if (trackingActive) {
    stopTracking();
    // Restart tracking on current tab
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0] && tabs[0].url) {
        startTracking(tabs[0].id, tabs[0].url);
      }
    });
  }
}, 30000);

console.log('ByteBreak background service worker loaded');
