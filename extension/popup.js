// ByteBreak Popup Script

// Format seconds to readable time
function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m`;
}

// Calculate productivity percentage
function calculateProductivityPercentage(productive, unproductive) {
  const total = productive + unproductive;
  if (total === 0) return 0;
  return Math.round((productive / total) * 100);
}

// Load and display data
async function loadData() {
  try {
    const data = await chrome.storage.local.get('dailyData');
    const dailyData = data.dailyData;
    
    if (!dailyData) {
      showNoData();
      return;
    }
    
    const productiveTime = dailyData.totalProductive || 0;
    const unproductiveTime = dailyData.totalUnproductive || 0;
    const totalTime = productiveTime + unproductiveTime;
    const productivityPercentage = calculateProductivityPercentage(productiveTime, unproductiveTime);
    
    displayStats(productiveTime, unproductiveTime, totalTime, productivityPercentage);
  } catch (error) {
    console.error('Error loading data:', error);
    showError();
  }
}

// Display statistics
function displayStats(productive, unproductive, total, percentage) {
  const content = document.getElementById('content');
  
  const html = `
    <div class="stat-card productive">
      <div class="stat-label">
        <span class="emoji">✅</span> Productive Time
      </div>
      <div class="stat-value">${formatTime(productive)}</div>
      <div class="stat-subtitle">Keep up the great work!</div>
    </div>

    <div class="stat-card unproductive">
      <div class="stat-label">
        <span class="emoji">⏰</span> Unproductive Time
      </div>
      <div class="stat-value">${formatTime(unproductive)}</div>
      <div class="stat-subtitle">Time for a break?</div>
    </div>

    <div class="stat-card total">
      <div class="stat-label">
        <span class="emoji">⚡</span> Total Tracked
      </div>
      <div class="stat-value">${formatTime(total)}</div>
      <div class="stat-subtitle">Today's activity</div>
    </div>

    <div class="progress-container">
      <div class="progress-label">Productivity Score</div>
      <div class="progress-bar">
        <div class="progress-fill" style="width: ${percentage}%"></div>
      </div>
      <div class="progress-text">${percentage}% Productive</div>
    </div>
  `;
  
  content.innerHTML = html;
}

// Show no data message
function showNoData() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 48px; margin-bottom: 15px;">📊</div>
      <div style="font-size: 16px; margin-bottom: 8px; font-weight: 500;">No Data Yet</div>
      <div style="font-size: 13px; opacity: 0.8;">Start browsing to track your productivity!</div>
    </div>
  `;
}

// Show error message
function showError() {
  const content = document.getElementById('content');
  content.innerHTML = `
    <div style="text-align: center; padding: 40px 20px;">
      <div style="font-size: 48px; margin-bottom: 15px;">⚠️</div>
      <div style="font-size: 16px; margin-bottom: 8px; font-weight: 500;">Error Loading Data</div>
      <div style="font-size: 13px; opacity: 0.8;">Please try again later</div>
    </div>
  `;
}

// View dashboard button
document.getElementById('viewDashboard').addEventListener('click', () => {
  chrome.tabs.create({
    url: chrome.runtime.getURL('../dashboard/index.html')
  });
});

// Load data when popup opens
document.addEventListener('DOMContentLoaded', loadData);

// Refresh data every 5 seconds while popup is open
setInterval(loadData, 5000);
