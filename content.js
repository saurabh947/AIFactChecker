// Content script for AI Fact Checker
// Check if already initialized to prevent duplicate injection
if (typeof window.aiFactCheckerInitialized === 'undefined') {
  window.aiFactCheckerInitialized = true;
  
  // Global variables for the extension
  let selectedText = '';
  let modal = null;
  let isInitialized = false;

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
      <div class="fact-checker-modal animated-modal">
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
          <div class="results-section animated-result" style="display: none;">
            <div class="truth-score">
              <div class="score-circle animated-score">
                <span class="score-value">0</span>
                <span class="score-label">Truth Score</span>
              </div>
            </div>
            <div class="analysis-section animated-fadein">
              <h3>📊 Analysis</h3>
              <p class="analysis-text"></p>
            </div>
            <div class="evidence-section animated-fadein">
              <h3>🔍 Evidence</h3>
              <p class="evidence-text"></p>
            </div>
            <div class="sources-section animated-fadein">
              <h3>📚 Sources</h3>
              <ul class="sources-list"></ul>
            </div>
            <div class="corrections-section animated-fadein" style="display: none;">
              <h3>⚠️ Corrections</h3>
              <ul class="corrections-list"></ul>
            </div>
            <div class="source-credibility-section animated-fadein" style="display: none;">
              <h3>🏛️ Source Credibility</h3>
              <p class="source-credibility-text"></p>
            </div>
            <div class="contextual-notes-section animated-fadein" style="display: none;">
              <h3>📝 Contextual Notes</h3>
              <p class="contextual-notes-text"></p>
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

  // Add click-outside-to-dismiss functionality
  const overlay = modal.querySelector('.fact-checker-overlay');
  overlay.addEventListener('click', (event) => {
    // Only close if clicking on the overlay itself, not on the modal content
    if (event.target === overlay) {
      modal.remove();
    }
  });

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
      padding: 16px;
      box-sizing: border-box;
    }

    .fact-checker-modal {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
      width: 100%;
      max-width: 700px;
      min-width: 280px;
      max-height: 90vh;
      overflow-y: auto;
      animation: modalFadeIn 0.7s cubic-bezier(.4,0,.2,1);
      display: flex;
      flex-direction: column;
    }
    
    .animated-modal {
      animation: modalFadeIn 0.7s cubic-bezier(.4,0,.2,1);
    }
    
    @keyframes modalFadeIn {
      from {
        opacity: 0;
        transform: scale(0.97) translateY(30px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
    
    .animated-result {
      animation: resultFadeIn 0.7s cubic-bezier(.4,0,.2,1);
    }
    
    @keyframes resultFadeIn {
      from { opacity: 0; transform: translateY(30px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    
    .animated-score {
      animation: popScore 0.7s cubic-bezier(.4,0,.2,1);
    }
    
    @keyframes popScore {
      from { transform: scale(0.8); opacity: 0.5; }
      to { transform: scale(1); opacity: 1; }
    }
    
    .animated-fadein {
      animation: fadeInUp 0.7s cubic-bezier(.4,0,.2,1);
    }
    
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 20px 0 20px;
      border-bottom: 1px solid #e9ecef;
      margin-bottom: 20px;
      flex-shrink: 0;
    }

    .modal-header h2 {
      margin: 0;
      color: #333;
      font-size: 20px;
      font-weight: 600;
      line-height: 1.2;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 24px;
      cursor: pointer;
      color: #6c757d;
      padding: 8px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;
      flex-shrink: 0;
    }

    .close-btn:hover {
      background: #f8f9fa;
      color: #333;
    }

    .modal-content {
      padding: 0 20px 20px 20px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .selected-text {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      border-left: 4px solid #667eea;
      flex-shrink: 0;
    }

    .selected-text h3 {
      margin: 0 0 10px 0;
      font-size: 16px;
      color: #495057;
      line-height: 1.3;
    }

    .selected-text p {
      margin: 0;
      font-style: italic;
      color: #6c757d;
      line-height: 1.5;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }



    .loading-section {
      text-align: center;
      padding: 40px 20px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
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
      flex-shrink: 0;
    }

    .score-circle {
      display: inline-flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      width: 120px;
      height: 120px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      font-weight: bold;
      padding: 15px;
      box-sizing: border-box;
    }

    .score-value {
      font-size: 32px;
      font-weight: 700;
      line-height: 1;
      margin-bottom: 4px;
    }

    .score-label {
      font-size: 11px;
      opacity: 0.9;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      line-height: 1.2;
      text-align: center;
    }

    .analysis-section,
    .evidence-section,
    .sources-section,
    .corrections-section,
    .source-credibility-section,
    .contextual-notes-section {
      margin-bottom: 20px;
      flex-shrink: 0;
    }

    .analysis-section h3,
    .evidence-section h3,
    .sources-section h3,
    .corrections-section h3,
    .source-credibility-section h3,
    .contextual-notes-section h3 {
      font-size: 18px;
      font-weight: 600;
      color: #495057;
      margin-bottom: 10px;
      line-height: 1.3;
    }

    .analysis-text,
    .evidence-text,
    .source-credibility-text,
    .contextual-notes-text {
      font-size: 14px;
      line-height: 1.6;
      color: #6c757d;
      margin: 0;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .sources-list,
    .corrections-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .sources-list li,
    .corrections-list li {
      padding: 12px 0;
      border-bottom: 1px solid #e9ecef;
      font-size: 14px;
      line-height: 1.4;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .sources-list li:last-child,
    .corrections-list li:last-child {
      border-bottom: none;
    }

    .sources-list a {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
      word-wrap: break-word;
      overflow-wrap: break-word;
    }

    .sources-list a:hover {
      text-decoration: underline;
    }

    .no-data-message {
      color: #6c757d;
      font-style: italic;
      padding: 12px 0;
      text-align: center;
      background: #f8f9fa;
      border-radius: 6px;
      margin: 4px 0;
      border-left: 3px solid #dee2e6;
    }

    .error-section {
      text-align: center;
      padding: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      border-radius: 8px;
      color: #721c24;
      flex-shrink: 0;
    }

    .error-message {
      margin: 0;
      font-size: 14px;
      line-height: 1.4;
    }

    /* Mobile-first responsive design */
    @media (max-width: 768px) {
      .fact-checker-overlay {
        padding: 12px;
      }
      
      .fact-checker-modal {
        max-height: 95vh;
        border-radius: 12px;
      }
      
      .modal-header {
        padding: 16px 16px 0 16px;
      }
      
      .modal-header h2 {
        font-size: 18px;
      }
      
      .close-btn {
        width: 36px;
        height: 36px;
        font-size: 20px;
      }
      
      .modal-content {
        padding: 0 16px 16px 16px;
      }
      
      .selected-text {
        padding: 12px;
        margin-bottom: 16px;
      }
      
      .selected-text h3 {
        font-size: 15px;
      }
      
      .selected-text p {
        font-size: 13px;
      }
      
      .loading-section {
        padding: 30px 16px;
      }
      
      .loading-spinner {
        width: 36px;
        height: 36px;
      }
      
      .loading-section p {
        font-size: 15px;
      }
      
      .score-circle {
        width: 100px;
        height: 100px;
        padding: 12px;
      }
      
      .score-value {
        font-size: 28px;
      }
      
      .score-label {
        font-size: 10px;
      }
      
      .analysis-section h3,
      .evidence-section h3,
      .sources-section h3,
      .corrections-section h3 {
        font-size: 16px;
      }
      
      .analysis-text,
      .evidence-text {
        font-size: 13px;
      }
      
      .sources-list li,
      .corrections-list li {
        padding: 10px 0;
        font-size: 13px;
      }
    }

    @media (max-width: 480px) {
      .fact-checker-overlay {
        padding: 8px;
      }
      
      .fact-checker-modal {
        max-height: 98vh;
        border-radius: 8px;
      }
      
      .modal-header {
        padding: 12px 12px 0 12px;
      }
      
      .modal-header h2 {
        font-size: 16px;
      }
      
      .close-btn {
        width: 32px;
        height: 32px;
        font-size: 18px;
      }
      
      .modal-content {
        padding: 0 12px 12px 12px;
      }
      
      .selected-text {
        padding: 10px;
        margin-bottom: 12px;
      }
      
      .selected-text h3 {
        font-size: 14px;
      }
      
      .selected-text p {
        font-size: 12px;
      }
      
      .loading-section {
        padding: 20px 12px;
      }
      
      .loading-spinner {
        width: 32px;
        height: 32px;
      }
      
      .loading-section p {
        font-size: 14px;
      }
      
      .score-circle {
        width: 80px;
        height: 80px;
        padding: 10px;
      }
      
      .score-value {
        font-size: 24px;
      }
      
      .score-label {
        font-size: 9px;
      }
      
      .analysis-section h3,
      .evidence-section h3,
      .sources-section h3,
      .corrections-section h3 {
        font-size: 15px;
      }
      
      .analysis-text,
      .evidence-text {
        font-size: 12px;
      }
      
      .sources-list li,
      .corrections-list li {
        padding: 8px 0;
        font-size: 12px;
      }
      
      .no-data-message {
        padding: 10px 0;
        font-size: 12px;
      }
      
      .error-section {
        padding: 16px;
      }
      
      .error-message {
        font-size: 13px;
      }
    }

    @media (max-width: 360px) {
      .fact-checker-overlay {
        padding: 4px;
      }
      
      .fact-checker-modal {
        max-height: 99vh;
        border-radius: 6px;
      }
      
      .modal-header {
        padding: 10px 10px 0 10px;
      }
      
      .modal-header h2 {
        font-size: 15px;
      }
      
      .close-btn {
        width: 28px;
        height: 28px;
        font-size: 16px;
      }
      
      .modal-content {
        padding: 0 10px 10px 10px;
      }
      
      .selected-text {
        padding: 8px;
        margin-bottom: 10px;
      }
      
      .selected-text h3 {
        font-size: 13px;
      }
      
      .selected-text p {
        font-size: 11px;
      }
      
      .loading-section {
        padding: 16px 10px;
      }
      
      .loading-spinner {
        width: 28px;
        height: 28px;
      }
      
      .loading-section p {
        font-size: 13px;
      }
      
      .score-circle {
        width: 70px;
        height: 70px;
        padding: 8px;
      }
      
      .score-value {
        font-size: 20px;
      }
      
      .score-label {
        font-size: 8px;
      }
      
      .analysis-section h3,
      .evidence-section h3,
      .sources-section h3,
      .corrections-section h3 {
        font-size: 14px;
      }
      
      .analysis-text,
      .evidence-text {
        font-size: 11px;
      }
      
      .sources-list li,
      .corrections-list li {
        padding: 6px 0;
        font-size: 11px;
      }
      
      .no-data-message {
        padding: 8px 0;
        font-size: 11px;
      }
      
      .error-section {
        padding: 12px;
      }
      
      .error-message {
        font-size: 12px;
      }
    }

    /* Landscape orientation adjustments */
    @media (max-height: 500px) and (orientation: landscape) {
      .fact-checker-modal {
        max-height: 98vh;
      }
      
      .modal-header {
        padding: 8px 20px 0 20px;
        margin-bottom: 10px;
      }
      
      .modal-header h2 {
        font-size: 16px;
      }
      
      .close-btn {
        width: 28px;
        height: 28px;
        font-size: 16px;
      }
      
      .modal-content {
        padding: 0 20px 10px 20px;
      }
      
      .selected-text {
        padding: 8px 12px;
        margin-bottom: 10px;
      }
      
      .selected-text h3 {
        font-size: 13px;
        margin-bottom: 6px;
      }
      
      .selected-text p {
        font-size: 11px;
      }
      
      .loading-section {
        padding: 20px;
      }
      
      .loading-spinner {
        width: 28px;
        height: 28px;
        margin-bottom: 10px;
      }
      
      .loading-section p {
        font-size: 13px;
      }
      
      .score-circle {
        width: 60px;
        height: 60px;
        padding: 6px;
      }
      
      .score-value {
        font-size: 18px;
        margin-bottom: 2px;
      }
      
      .score-label {
        font-size: 8px;
      }
      
      .analysis-section,
      .evidence-section,
      .sources-section,
      .corrections-section {
        margin-bottom: 12px;
      }
      
      .analysis-section h3,
      .evidence-section h3,
      .sources-section h3,
      .corrections-section h3 {
        font-size: 14px;
        margin-bottom: 6px;
      }
      
      .analysis-text,
      .evidence-text {
        font-size: 11px;
      }
      
      .sources-list li,
      .corrections-list li {
        padding: 4px 0;
        font-size: 11px;
      }
    }
  `;
  document.head.appendChild(style);
}

// Gather contextual information about the webpage
function gatherContextualInfo() {
  const context = {
    url: window.location.href,
    title: document.title,
    domain: window.location.hostname,
    timestamp: new Date().toISOString(),
    userAgent: navigator.userAgent,
    language: navigator.language,
    referrer: document.referrer,
    metaInfo: {}
  };

  // Gather meta information
  const metaTags = document.querySelectorAll('meta');
  metaTags.forEach(meta => {
    const name = meta.getAttribute('name') || meta.getAttribute('property');
    const content = meta.getAttribute('content');
    if (name && content) {
      context.metaInfo[name] = content;
    }
  });

  // Gather Open Graph data
  const ogTags = document.querySelectorAll('meta[property^="og:"]');
  ogTags.forEach(tag => {
    const property = tag.getAttribute('property');
    const content = tag.getAttribute('content');
    if (property && content) {
      context.metaInfo[property] = content;
    }
  });

  // Gather Twitter Card data
  const twitterTags = document.querySelectorAll('meta[name^="twitter:"]');
  twitterTags.forEach(tag => {
    const name = tag.getAttribute('name');
    const content = tag.getAttribute('content');
    if (name && content) {
      context.metaInfo[name] = content;
    }
  });

  // Try to get publication date
  const dateSelectors = [
    'time[datetime]',
    'meta[property="article:published_time"]',
    'meta[name="publish_date"]',
    'meta[name="date"]',
    '.date',
    '.published-date',
    '.article-date'
  ];

  for (const selector of dateSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      context.publicationDate = element.getAttribute('datetime') || element.getAttribute('content') || element.textContent;
      break;
    }
  }

  // Try to get author information
  const authorSelectors = [
    'meta[name="author"]',
    'meta[property="article:author"]',
    '.author',
    '.byline',
    '[rel="author"]'
  ];

  for (const selector of authorSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      context.author = element.getAttribute('content') || element.textContent;
      break;
    }
  }

  // Get surrounding text context (text before and after selection)
  const selection = window.getSelection();
  if (selection.rangeCount > 0) {
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    
    // Get text before selection (up to 200 characters)
    let beforeText = '';
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent;
      const start = Math.max(0, range.startOffset - 200);
      beforeText = text.substring(start, range.startOffset);
    }
    
    // Get text after selection (up to 200 characters)
    let afterText = '';
    if (container.nodeType === Node.TEXT_NODE) {
      const text = container.textContent;
      const end = Math.min(text.length, range.endOffset + 200);
      afterText = text.substring(range.endOffset, end);
    }
    
    context.surroundingText = {
      before: beforeText.trim(),
      after: afterText.trim()
    };
  }

  return context;
}

// Perform fact checking
async function performFactCheck(text) {
  try {
    // Get settings from storage
    const settings = await getSettings();
    
    // Note: API key is optional now - if not provided, free tier will be used

    // Check daily limit before proceeding
    const limitInfo = await chrome.runtime.sendMessage({ action: 'checkDailyLimit' });
    if (limitInfo.error) {
      throw new Error(limitInfo.error);
    }
    
    if (!limitInfo.canMakeRequest) {
      showError(`Daily limit reached. You've used ${limitInfo.totalRequests}/20 requests today. Please try again tomorrow.`);
      return;
    }

    // Gather contextual information
    const context = gatherContextualInfo();

    // If user doesn't have their own API key, try to reload the free tier API key first
    if (!settings.apiKey || settings.apiKey.trim() === '') {
      try {
        await chrome.runtime.sendMessage({ action: 'reloadApiKey' });
        console.log('Reloaded API key for free tier');
      } catch (error) {
        console.log('Failed to reload API key:', error);
      }
    }

    // Call fact checking API with context
    const result = await chrome.runtime.sendMessage({
      action: 'factCheckAPI',
      text: text,
      context: context,
      provider: settings.provider,
      model: settings.model,
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
    li.className = 'no-data-message';
    li.textContent = 'No verifiable sources found for this claim.';
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
    // Show corrections section with "no corrections" message
    correctionsSection.style.display = 'block';
    const li = document.createElement('li');
    li.className = 'no-data-message';
    li.textContent = 'No corrections needed for this claim.';
    correctionsList.appendChild(li);
  }

  // Update source credibility
  const sourceCredibilitySection = modal.querySelector('.source-credibility-section');
  const sourceCredibilityText = modal.querySelector('.source-credibility-text');
  if (result.sourceCredibility && result.sourceCredibility !== 'No source credibility assessment provided') {
    sourceCredibilityText.textContent = result.sourceCredibility;
    sourceCredibilitySection.style.display = 'block';
  } else {
    sourceCredibilitySection.style.display = 'none';
  }

  // Update contextual notes
  const contextualNotesSection = modal.querySelector('.contextual-notes-section');
  const contextualNotesText = modal.querySelector('.contextual-notes-text');
  if (result.contextualNotes && result.contextualNotes !== 'No contextual notes provided') {
    contextualNotesText.textContent = result.contextualNotes;
    contextualNotesSection.style.display = 'block';
  } else {
    contextualNotesSection.style.display = 'none';
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

  // Initialize the content script
  function initializeContentScript() {
    if (isInitialized) return;
    
    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'ping') {
        // Respond to ping to indicate content script is ready
        sendResponse({ ready: true });
        return true;
      }
      
      if (request.action === 'factCheck') {
        try {
          selectedText = request.text;
          showFactCheckModal(selectedText);
          // Ensure response is sent immediately
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error handling factCheck message:', error);
          sendResponse({ success: false, error: error.message });
        }
        return true; // Keep message channel open
      }
      
      // For any other messages, send a default response
      sendResponse({ success: false, error: 'Unknown action' });
      return false; // Don't keep message channel open for unknown actions
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
    
    isInitialized = true;
  }

  // Initialize immediately
  initializeContentScript();
}