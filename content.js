// Content script for AI Fact Checker
let selectedText = '';
let modal = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'factCheck') {
    selectedText = request.text;
    showFactCheckModal(selectedText);
  }
});

// Handle text selection
document.addEventListener('mouseup', function() {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText.length > 0) {
    // Store selected text for potential context menu use
    window.selectedTextForFactCheck = selectedText;
  }
});

// Show fact checking modal
function showFactCheckModal(text) {
  if (modal) {
    modal.remove();
  }

  // Create modal container
  modal = document.createElement('div');
  modal.id = 'ai-fact-checker-modal';
  modal.innerHTML = `
    <div class="fact-checker-overlay">
      <div class="fact-checker-modal">
        <div class="modal-header">
          <h2>🔍 AI Fact Checker</h2>
          <button class="close-btn" onclick="this.closest('#ai-fact-checker-modal').remove()">×</button>
        </div>
        <div class="modal-content">
          <div class="selected-text">
            <h3>Selected Text:</h3>
            <p>"${text}"</p>
          </div>
          <div class="loading-section">
            <div class="loading-spinner"></div>
            <p>Analyzing with AI...</p>
          </div>
          <div class="results-section" style="display: none;">
            <div class="truth-score">
              <div class="score-circle">
                <span class="score-value">0</span>
                <span class="score-label">Truth Score</span>
              </div>
            </div>
            <div class="analysis-section">
              <h3>📊 Analysis</h3>
              <p class="analysis-text"></p>
            </div>
            <div class="evidence-section">
              <h3>🔍 Evidence</h3>
              <p class="evidence-text"></p>
            </div>
            <div class="sources-section">
              <h3>📚 Sources</h3>
              <ul class="sources-list"></ul>
            </div>
            <div class="corrections-section" style="display: none;">
              <h3>⚠️ Corrections</h3>
              <ul class="corrections-list"></ul>
            </div>
          </div>
          <div class="error-section" style="display: none;">
            <p class="error-message"></p>
          </div>
        </div>
      </div>
    </div>
  `;

  // Add modal to page
  document.body.appendChild(modal);

  // Inject CSS if not already present
  if (!document.getElementById('ai-fact-checker-styles')) {
    injectModalStyles();
  }

  // Perform fact checking
  performFactCheck(text);
}

// Inject modal styles
function injectModalStyles() {
  const style = document.createElement('style');
  style.id = 'ai-fact-checker-styles';
  style.textContent = `
    #ai-fact-checker-modal {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    }

    .fact-checker-overlay {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .fact-checker-modal {
      background: white;
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      max-width: 600px;
      width: 100%;
      max-height: 80vh;
      overflow-y: auto;
      animation: modalSlideIn 0.3s ease-out;
    }

    @keyframes modalSlideIn {
      from {
        opacity: 0;
        transform: translateY(-20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 0 20px;
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 20px;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
    }

    .close-btn:hover {
      background: #f8f9fa;
      color: #333;
    }

    .modal-content {
      padding: 0 20px 20px 20px;
    }

    .selected-text {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
    }

    .selected-text h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #495057;
    }

    .selected-text p {
      margin: 0;
      font-style: italic;
      color: #6c757d;
      line-height: 1.5;
    }

    .loading-section {
      text-align: center;
      padding: 40px 20px;
    }

    .loading-spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px auto;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .loading-section p {
      color: #6c757d;
      font-size: 16px;
      margin: 0;
    }

    .truth-score {
      text-align: center;
      margin-bottom: 25px;
    }

    .score-circle {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 100px;
      height: 100px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: bold;
    }

    .score-value {
      font-size: 28px;
      font-weight: 700;
    }

    .score-label {
      font-size: 12px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .analysis-section,
    .evidence-section,
    .sources-section,
    .corrections-section {
      margin-bottom: 20px;
    }

    .analysis-section h3,
    .evidence-section h3,
    .sources-section h3,
    .corrections-section h3 {
      font-size: 18px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
    }

    .analysis-text,
    .evidence-text {
      font-size: 14px;
      line-height: 1.6;
      color: #6c757d;
      margin: 0;
    }

    .sources-list,
    .corrections-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sources-list li,
    .corrections-list li {
      padding: 8px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
    }

    .sources-list li:last-child,
    .corrections-list li:last-child {
      border-bottom: none;
    }

    .sources-list a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .sources-list a:hover {
      text-decoration: underline;
    }

    .error-section {
      text-align: center;
      padding: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #721c24;
    }

    .error-message {
      margin: 0;
      font-size: 14px;
    }

    @media (max-width: 768px) {
      .fact-checker-overlay {
        padding: 10px;
      }
      
      .fact-checker-modal {
        max-height: 90vh;
      }
      
      .modal-header {
        padding: 15px 15px 0 15px;
      }
      
      .modal-content {
        padding: 0 15px 15px 15px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Perform fact checking
async function performFactCheck(text) {
  try {
    // Get settings from storage
    const settings = await getSettings();
    
    if (!settings.apiKey) {
      showError('Please configure your API key in the extension popup settings');
      return;
    }

    // Call fact checking API
    const result = await chrome.runtime.sendMessage({
      action: 'factCheckAPI',
      text: text,
      provider: settings.provider,
      apiKey: settings.apiKey,
      language: settings.language
    });

    if (result.error) {
      throw new Error(result.error);
    }

    // Display results
    displayModalResults(result);

  } catch (error) {
    console.error('Fact check error:', error);
    showError(`Fact checking failed: ${error.message}`);
  }
}

// Get settings from storage
function getSettings() {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: 'getSettings' }, (response) => {
      resolve(response || {});
    });
  });
}

// Display results in modal
function displayModalResults(result) {
  const loadingSection = modal.querySelector('.loading-section');
  const resultsSection = modal.querySelector('.results-section');
  const errorSection = modal.querySelector('.error-section');

  // Hide loading
  loadingSection.style.display = 'none';

  // Show results
  resultsSection.style.display = 'block';

  // Update truth score
  const scoreValue = modal.querySelector('.score-value');
  scoreValue.textContent = result.truthScore || 0;

  // Update analysis
  const analysisText = modal.querySelector('.analysis-text');
  analysisText.textContent = result.analysis || 'No analysis available';

  // Update evidence
  const evidenceText = modal.querySelector('.evidence-text');
  evidenceText.textContent = result.evidence || 'No evidence provided';

  // Update sources
  const sourcesList = modal.querySelector('.sources-list');
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
  const correctionsSection = modal.querySelector('.corrections-section');
  const correctionsList = modal.querySelector('.corrections-list');
  correctionsList.innerHTML = '';
  if (result.corrections && result.corrections.length > 0) {
    result.corrections.forEach(correction => {
      const li = document.createElement('li');
      li.textContent = correction;
      correctionsList.appendChild(li);
    });
    correctionsSection.style.display = 'block';
  } else {
    correctionsSection.style.display = 'none';
  }

  // Animate score
  animateModalScore(result.truthScore || 0);
}

// Show error in modal
function showError(message) {
  const loadingSection = modal.querySelector('.loading-section');
  const errorSection = modal.querySelector('.error-section');
  const errorMessage = modal.querySelector('.error-message');

  loadingSection.style.display = 'none';
  errorSection.style.display = 'block';
  errorMessage.textContent = message;
}

// Animate the truth score in modal
function animateModalScore(targetScore) {
  const scoreElement = modal.querySelector('.score-value');
  const startScore = 0;
  const duration = 1000;
  const startTime = performance.now();

  function updateScore(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    const easeOutQuart = 1 - Math.pow(1 - progress, 4);
    const currentScore = Math.round(startScore + (targetScore - startScore) * easeOutQuart);
    
    scoreElement.textContent = currentScore;
    
    if (progress < 1) {
      requestAnimationFrame(updateScore);
    }
  }

  requestAnimationFrame(updateScore);
} 