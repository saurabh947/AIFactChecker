// Popup JavaScript for AI Fact Checker
document.addEventListener('DOMContentLoaded', function() {
  // Initialize popup
  loadSettings();
  loadDailyLimitInfo();
  setupEventListeners();
  setupModelSelection();
  
  // Check and reload free tier API key
  checkFreeTierStatus();
});

// Check free tier status and reload API key if needed
function checkFreeTierStatus() {
  chrome.runtime.sendMessage({ action: 'getFreeTierStatus' }, (response) => {
    console.log('Free tier status:', response);
    if (response && !response.freeTierAvailable) {
      console.log('Free tier not available, attempting to reload API key...');
      chrome.runtime.sendMessage({ action: 'reloadApiKey' }, (reloadResponse) => {
        if (reloadResponse && reloadResponse.success) {
          console.log('API key reloaded successfully');
        } else {
          console.log('Failed to reload API key');
        }
      });
    } else if (response && response.freeTierAvailable) {
      console.log('Free tier available with key length:', response.keyLength);
    }
  });
}

// Model configurations for each provider
const MODEL_CONFIGS = {
  openai: [
    { value: 'gpt-4', label: 'GPT-4 (Most Capable)', description: 'Best for complex reasoning' },
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo (Fast)', description: 'Fast and cost-effective' }
  ],
  google: [
    { value: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash (Free Tier)', description: 'Fast and efficient' },
    { value: 'gemini-pro', label: 'Gemini Pro (Standard)', description: 'Balanced performance' },
    { value: 'gemini-2.0-flash-exp', label: 'Gemini 2.0 Flash (Fast)', description: 'Quick responses' }
  ],
  perplexity: [
    { value: 'llama-3.1-sonar-small-128k-online', label: 'Llama 3.1 Sonar (Online)', description: 'Web-connected verification' },
    { value: 'llama-3.1-sonar-small-128k', label: 'Llama 3.1 Sonar (Offline)', description: 'Fast offline processing' }
  ]
};

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

  // Settings
  const saveSettingsBtn = document.getElementById('save-settings');
  saveSettingsBtn.addEventListener('click', saveSettings);

  // Provider change handler
  const providerSelect = document.getElementById('api-provider');
  providerSelect.addEventListener('change', updateModelOptions);

  // Listen for messages to refresh daily limit
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'refreshDailyLimit') {
      loadDailyLimitInfo();
    }
  });
}

// Setup model selection functionality
function setupModelSelection() {
  updateModelOptions();
}

// Update model options based on selected provider
function updateModelOptions() {
  const providerSelect = document.getElementById('api-provider');
  const modelSelect = document.getElementById('api-model');
  const selectedProvider = providerSelect.value;
  
  // Clear existing options
  modelSelect.innerHTML = '';
  
  // Add new options based on provider
  const models = MODEL_CONFIGS[selectedProvider] || [];
  models.forEach(model => {
    const option = document.createElement('option');
    option.value = model.value;
    option.textContent = `${model.label} - ${model.description}`;
    modelSelect.appendChild(option);
  });
  
  // Set default model for the provider
  if (models.length > 0) {
    modelSelect.value = models[0].value;
  }
}

// Load saved settings
function loadSettings() {
  chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
    if (response) {
      document.getElementById('api-provider').value = response.provider || 'openai';
      document.getElementById('api-key').value = response.apiKey || '';
      document.getElementById('language').value = response.language || 'en';
      
      // Update model options and set saved model
      updateModelOptions();
      if (response.model) {
        document.getElementById('api-model').value = response.model;
      }
    }
  });
}

// Save settings
function saveSettings() {
  const provider = document.getElementById('api-provider').value;
  const model = document.getElementById('api-model').value;
  const apiKey = document.getElementById('api-key').value;
  const language = document.getElementById('language').value;
  const statusDiv = document.getElementById('settings-status');

  // API key is optional - if not provided, free tier will be used

  chrome.runtime.sendMessage({
    action: 'saveSettings',
    provider: provider,
    model: model,
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

// Load and display daily limit information
function loadDailyLimitInfo() {
  chrome.runtime.sendMessage({ action: 'checkDailyLimit' }, (response) => {
    if (response && !response.error) {
      updateDailyLimitDisplay(response);
    }
  });
}

// Update daily limit display
function updateDailyLimitDisplay(limitInfo) {
  const limitDisplay = document.getElementById('daily-limit-display');
  if (limitDisplay) {
    let remainingText = '';
    let cssClass = 'available';
    let tierInfo = '';
    
    // Check if user has their own API key
    const apiKeyInput = document.getElementById('api-key');
    const hasOwnKey = apiKeyInput && apiKeyInput.value.trim() !== '';
    
    if (!hasOwnKey) {
      tierInfo = '<span class="free-tier-badge">Using Free Tier (Gemini)</span>';
    }
    
    if (!limitInfo.canMakeRequest) {
      remainingText = 'Daily limit reached';
      cssClass = 'limit-reached';
    } else if (limitInfo.remainingRequests <= 3) {
      remainingText = `${limitInfo.remainingRequests} requests remaining today`;
      cssClass = 'limit-warning';
    } else {
      remainingText = `${limitInfo.remainingRequests} requests remaining today`;
      cssClass = 'available';
    }
    
    const totalText = `${limitInfo.totalRequests}/20 requests used today`;
    
    limitDisplay.innerHTML = `
      <div class="limit-info">
        <span class="remaining-requests ${cssClass}">${remainingText}</span>
        <span class="total-requests">${totalText}</span>
        ${tierInfo}
      </div>
    `;
  }
}








