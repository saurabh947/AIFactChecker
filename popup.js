// Popup JavaScript for AI Fact Checker
document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadSettings();
  setupEventListeners();
});

// Tab switching functionality
function setupEventListeners() {
  // Tab switching
  const tabBtns = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');
      
      // Update active tab button
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Update active tab content
      tabContents.forEach(content => {
        content.classList.remove('active');
        if (content.id === targetTab) {
          content.classList.add('active');
        }
      });
    });
  });

  // Fact checking
  const checkBtn = document.getElementById('check-btn');
  const factText = document.getElementById('fact-text');

  checkBtn.addEventListener('click', performFactCheck);
  factText.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.key === 'Enter') {
      performFactCheck();
    }
  });

  // Settings
  const saveSettingsBtn = document.getElementById('save-settings');
  saveSettingsBtn.addEventListener('click', saveSettings);
}

// Load saved settings
function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response) {
      document.getElementById('api-provider').value = response.provider;
      document.getElementById('api-key').value = response.apiKey;
      document.getElementById('language').value = response.language;
    }
  });
}

// Save settings
function saveSettings() {
  const provider = document.getElementById('api-provider').value;
  const apiKey = document.getElementById('api-key').value;
  const language = document.getElementById('language').value;
  const statusDiv = document.getElementById('settings-status');

  if (!apiKey.trim()) {
    showStatus('Please enter an API key', 'error');
    return;
  }

  chrome.runtime.sendMessage({
    action: 'saveSettings',
    provider: provider,
    apiKey: apiKey,
    language: language
  }, (response) => {
    if (response && response.success) {
      showStatus('Settings saved successfully!', 'success');
    } else {
      showStatus('Failed to save settings', 'error');
    }
  });
}

// Show status message
function showStatus(message, type) {
  const statusDiv = document.getElementById('settings-status');
  statusDiv.textContent = message;
  statusDiv.className = `status-message ${type}`;
  
  setTimeout(() => {
    statusDiv.textContent = '';
    statusDiv.className = 'status-message';
  }, 3000);
}

// Perform fact checking
async function performFactCheck() {
  const factText = document.getElementById('fact-text').value.trim();
  const checkBtn = document.getElementById('check-btn');
  const btnText = checkBtn.querySelector('.btn-text');
  const spinner = checkBtn.querySelector('.loading-spinner');

  if (!factText) {
    alert('Please enter some text to fact-check');
    return;
  }

  // Get current settings
  const settings = await getCurrentSettings();
  if (!settings.apiKey) {
    alert('Please configure your API key in the Settings tab');
    return;
  }

  // Show loading state
  checkBtn.disabled = true;
  btnText.style.display = 'none';
  spinner.style.display = 'inline';

  try {
    // Call fact checking API
    const result = await chrome.runtime.sendMessage({
      action: 'factCheckAPI',
      text: factText,
      provider: settings.provider,
      apiKey: settings.apiKey,
      language: settings.language
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Display results
    displayResults(result);

  } catch (error) {
    console.error('Fact check error:', error);
    alert(`Fact checking failed: ${error.message}`);
  } finally {
    // Reset button state
    checkBtn.disabled = false;
    btnText.style.display = 'inline';
    spinner.style.display = 'none';
  }
}

// Get current settings
function getCurrentSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      resolve(response || {});
    });
  });
}

// Display fact checking results
function displayResults(result) {
  const resultContainer = document.getElementById('result-container');
  const scoreValue = document.getElementById('score-value');
  const analysisText = document.getElementById('analysis-text');
  const evidenceText = document.getElementById('evidence-text');
  const sourcesList = document.getElementById('sources-list');
  const correctionsContainer = document.getElementById('corrections-container');
  const correctionsList = document.getElementById('corrections-list');

  // Update truth score
  scoreValue.textContent = result.truthScore || 0;

  // Update analysis
  analysisText.textContent = result.analysis || 'No analysis available';

  // Update evidence
  evidenceText.textContent = result.evidence || 'No evidence provided';

  // Update sources
  sourcesList.innerHTML = '';
  if (result.sources && result.sources.length > 0) {
    result.sources.forEach(source => {
      const li = document.createElement('li');
      if (typeof source === 'string') {
        if (source.startsWith('http')) {
          const a = document.createElement('a');
          a.href = source;
          a.target = '_blank';
          a.textContent = source;
          li.appendChild(a);
        } else {
          li.textContent = source;
        }
      } else if (source.url) {
        const a = document.createElement('a');
        a.href = source.url;
        a.target = '_blank';
        a.textContent = source.title || source.url;
        li.appendChild(a);
      }
      sourcesList.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No sources provided';
    sourcesList.appendChild(li);
  }

  // Update corrections
  correctionsList.innerHTML = '';
  if (result.corrections && result.corrections.length > 0) {
    result.corrections.forEach(correction => {
      const li = document.createElement('li');
      li.textContent = correction;
      correctionsList.appendChild(li);
    });
    correctionsContainer.style.display = 'block';
  } else {
    correctionsContainer.style.display = 'none';
  }

  // Show results
  resultContainer.style.display = 'block';

  // Animate score
  animateScore(result.truthScore || 0);
}

// Animate the truth score
function animateScore(targetScore) {
  const scoreElement = document.getElementById('score-value');
  const startScore = 0;
  const duration = 1000; // 1 second
  const startTime = performance.now();

  function updateScore(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function for smooth animation
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentScore = Math.round(startScore + (targetScore - startScore) * easeOutQuart);
    
    scoreElement.textContent = currentScore;
    
    if (progress < 1) {
      requestAnimationFrame(updateScore);
    }
  }

  requestAnimationFrame(updateScore);
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', function() {
  const textarea = document.getElementById('fact-text');
  if (textarea) {
    textarea.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 200) + 'px';
    });
  }
}); 