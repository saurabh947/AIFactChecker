// Background service worker for AI Fact Checker

// Free tier configuration
const DAILY_REQUEST_LIMIT = 20;
const FREE_TIER_PROVIDER = 'google';
const FREE_TIER_MODEL = 'gemini-1.5-flash';
const FREE_TIER_GEMINI_API_KEY = '<YOUR_API_KEY>';

// Helper function to check if content script is ready
async function isContentScriptReady(tabId) {
  return new Promise((resolve) => {
    try {
      chrome.tabs.sendMessage(tabId, { action: 'ping' }, (response) => {
        if (chrome.runtime.lastError) {
          resolve(false);
        } else {
          resolve(response && response.ready);
        }
      });
    } catch (error) {
      resolve(false);
    }
  });
}

// Load API key from storage
async function loadApiKey() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['freeTierApiKey'], (result) => {
      if (result.freeTierApiKey) {
        FREE_TIER_GEMINI_API_KEY = result.freeTierApiKey;
        console.log('API key loaded from storage');
      } else {
        console.log('No API key in storage, using default free tier key');
      }
      resolve();
    });
  });
}

// Request tracking functions
async function getDailyRequestCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dailyRequestCount', 'lastRequestDate'], (result) => {
      const today = new Date().toDateString();
      const lastDate = result.lastRequestDate;
      
      // Reset counter if it's a new day
      if (lastDate !== today) {
        chrome.storage.local.set({ dailyRequestCount: 0, lastRequestDate: today }, () => {
          resolve(0);
        });
      } else {
        resolve(result.dailyRequestCount || 0);
      }
    });
  });
}

async function incrementDailyRequestCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dailyRequestCount'], (result) => {
      const newCount = (result.dailyRequestCount || 0) + 1;
      chrome.storage.local.set({ dailyRequestCount: newCount }, () => {
        resolve(newCount);
      });
    });
  });
}

async function checkDailyLimit() {
  const currentCount = await getDailyRequestCount();
  return {
    canMakeRequest: currentCount < DAILY_REQUEST_LIMIT,
    remainingRequests: Math.max(0, DAILY_REQUEST_LIMIT - currentCount),
    totalRequests: currentCount
  };
}

// Error handling for service worker
self.addEventListener('error', (event) => {
  console.error('Service worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Track if extension is initialized
let isInitialized = false;
let isInitializing = false;

// Remove context menu if it exists
function removeContextMenu() {
  return new Promise((resolve) => {
    chrome.contextMenus.remove("factCheck", () => {
      if (chrome.runtime.lastError) {
        // Menu doesn't exist, which is fine
        console.log('No existing context menu to remove');
      } else {
        console.log('Existing context menu removed');
      }
      resolve();
    });
  });
}

// Initialize the extension
async function initializeExtension() {
  if (isInitialized) {
    console.log('Extension already initialized, skipping...');
    return;
  }
  
  if (isInitializing) {
    console.log('Extension initialization already in progress, skipping...');
    return;
  }
  
  isInitializing = true;
  
  try {
    console.log('Initializing extension...');
    
    // Load API key first
    await loadApiKey();
    
    // Remove any existing context menu first
    await removeContextMenu();
    
    // Create context menu for fact checking with retry logic
    const createContextMenu = () => {
      chrome.contextMenus.create({
        id: "factCheck",
        title: "Fact Check with AI",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Context menu creation error:', chrome.runtime.lastError.message);
          // If the menu already exists, that's fine - mark as initialized
          if (chrome.runtime.lastError.message.includes('already exists') || 
              chrome.runtime.lastError.message.includes('duplicate id')) {
            console.log('Context menu already exists, marking as initialized');
            isInitialized = true;
          } else {
            console.error('Failed to create context menu:', chrome.runtime.lastError.message);
          }
        } else {
          console.log('Context menu created successfully');
          isInitialized = true;
        }
      });
    };
    
    // Try to create the context menu
    createContextMenu();
  } catch (error) {
    console.error('Error initializing extension:', error);
  } finally {
    isInitializing = false;
  }
}

chrome.runtime.onInstalled.addListener(initializeExtension);
chrome.runtime.onStartup.addListener(initializeExtension);

// Clean up context menu when extension is uninstalled
chrome.runtime.onSuspend.addListener(() => {
  chrome.contextMenus.remove("factCheck", () => {
    // Cleanup complete
  });
});

// Initialize when service worker loads (but only if not already initialized)
// Use a small delay to ensure proper initialization
setTimeout(() => {
  if (!isInitialized && !isInitializing) {
    initializeExtension();
  }
}, 100);

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck" && info.selectionText) {
    // Use a separate async function to handle the promise properly
    handleContextMenuClick(info, tab).catch(error => {
      console.error('Unhandled error in context menu handler:', error);
      // Show user-friendly notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Fact Checker',
        message: 'An error occurred. Please try again or refresh the page.'
      });
    });
  }
});

// Separate async function to handle context menu clicks
async function handleContextMenuClick(info, tab) {
  try {
    // Check if we can access the tab
    if (!tab || !tab.id) {
      console.error('Invalid tab information');
      return;
    }

    // Check if the tab is accessible (not a chrome:// or edge:// page)
    if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
      console.log('Cannot inject content script into browser pages');
      // Show a notification to the user
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Fact Checker',
        message: 'Cannot fact-check browser pages. Please navigate to a regular webpage.'
      });
      return;
    }

    // Try to inject content script if not already present
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
    } catch (injectionError) {
      // Content script may already be present or injection failed
      console.log('Content script injection skipped (may already be present):', injectionError.message);
    }

    // Wait for content script to be ready
    let retries = 0;
    const maxRetries = 3;
    let contentScriptReady = false;
    
    while (retries < maxRetries && !contentScriptReady) {
      try {
        contentScriptReady = await isContentScriptReady(tab.id);
        if (!contentScriptReady) {
          await new Promise(resolve => setTimeout(resolve, 500));
          retries++;
        }
      } catch (error) {
        console.log(`Content script not ready (attempt ${retries + 1}/${maxRetries}):`, error.message);
        await new Promise(resolve => setTimeout(resolve, 500));
        retries++;
      }
    }

    if (!contentScriptReady) {
      console.error('Content script failed to initialize after multiple attempts');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'AI Fact Checker',
        message: 'Please refresh the page and try again, or use the extension popup instead.'
      });
      return;
    }

    // Send message to content script to trigger fact checking
    const sendMessageWithRetry = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, {
          action: "factCheck",
          text: info.selectionText
        }, (response) => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve(response);
          }
        });
      });
    };

    // Try to send message with retry logic
    try {
      await sendMessageWithRetry();
    } catch (error) {
      console.error('Error sending message to content script:', error.message || error);
      
      // Check if the error is due to content script not being ready
      if (error.message && (error.message.includes('Could not establish connection') || error.message.includes('The message port closed'))) {
        console.log('Content script not ready, attempting to inject and retry...');
        try {
          // Try to inject the content script again
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ['content.js']
          });
          
          // Wait a bit for initialization
          await new Promise(resolve => setTimeout(resolve, 1500));
          
          // Retry sending the message
          try {
            await sendMessageWithRetry();
          } catch (retryError) {
            console.error('Retry failed:', retryError.message || retryError);
            // Show user-friendly notification
            chrome.notifications.create({
              type: 'basic',
              iconUrl: 'icons/icon48.png',
              title: 'AI Fact Checker',
              message: 'Please refresh the page and try again, or use the extension popup instead.'
            });
          }
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError.message || injectionError);
          // Show user-friendly notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'AI Fact Checker',
            message: 'Please refresh the page and try again, or use the extension popup instead.'
          });
        }
      } else {
        // Show user-friendly notification for other errors
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'AI Fact Checker',
          message: 'Please refresh the page and try again, or use the extension popup instead.'
        });
      }
    }
  } catch (error) {
    console.error('Error handling context menu click:', error);
    throw error; // Re-throw to be caught by the outer catch
  }
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  try {
    if (request.action === "getSettings") {
      // Get stored settings
      chrome.storage.sync.get(['apiKey', 'provider', 'model', 'language'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error getting settings:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({
            apiKey: result.apiKey || '',
            provider: result.provider || 'openai',
            model: result.model || 'gpt-4',
            language: result.language || 'en'
          });
        }
      });
      return true; // Keep message channel open for async response
    }
    
    if (request.action === "saveSettings") {
      // Save settings
      chrome.storage.sync.set({
        apiKey: request.apiKey,
        provider: request.provider,
        model: request.model,
        language: request.language
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving settings:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    if (request.action === "checkDailyLimit") {
      // Check daily request limit
      checkDailyLimit().then(limitInfo => {
        sendResponse(limitInfo);
      }).catch(error => {
        console.error('Error checking daily limit:', error);
        sendResponse({ error: error.message });
      });
      return true;
    }
    
    if (request.action === "setFreeTierApiKey") {
      // Set the free tier API key
      FREE_TIER_GEMINI_API_KEY = request.apiKey;
      chrome.storage.local.set({ freeTierApiKey: request.apiKey }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error saving API key:', chrome.runtime.lastError);
          sendResponse({ error: chrome.runtime.lastError.message });
        } else {
          console.log('Free tier API key saved successfully');
          sendResponse({ success: true });
        }
      });
      return true;
    }
    
    if (request.action === "reloadApiKey") {
      // Reload the API key from storage or config file
      loadApiKey().then(() => {
        console.log('API key reloaded. Free tier available:', !!FREE_TIER_GEMINI_API_KEY);
        sendResponse({ 
          success: true, 
          freeTierAvailable: !!FREE_TIER_GEMINI_API_KEY 
        });
      }).catch(error => {
        console.error('Error reloading API key:', error);
        sendResponse({ error: error.message });
      });
      return true;
    }
    
    if (request.action === "getFreeTierStatus") {
      // Check if free tier is available
      sendResponse({ 
        freeTierAvailable: !!FREE_TIER_GEMINI_API_KEY,
        provider: FREE_TIER_PROVIDER,
        model: FREE_TIER_MODEL,
        keyLength: FREE_TIER_GEMINI_API_KEY ? FREE_TIER_GEMINI_API_KEY.length : 0
      });
      return true;
    }
    
    if (request.action === "factCheckAPI") {
      // Check daily limit before processing
      checkDailyLimit().then(limitInfo => {
        if (!limitInfo.canMakeRequest) {
          sendResponse({ 
            error: `Daily limit reached. You've used ${limitInfo.totalRequests}/${DAILY_REQUEST_LIMIT} requests today. Please try again tomorrow.` 
          });
          return;
        }
        
        // Determine if using free tier or user's own API key
        let finalProvider = request.provider;
        let finalModel = request.model;
        let finalApiKey = request.apiKey;
        
        console.log('Fact check request - User API key provided:', !!finalApiKey && finalApiKey.trim() !== '');
        console.log('Free tier API key available:', !!FREE_TIER_GEMINI_API_KEY);
        
        // If user doesn't have an API key, use free tier
        if (!finalApiKey || finalApiKey.trim() === '') {
          if (FREE_TIER_GEMINI_API_KEY) {
            finalProvider = FREE_TIER_PROVIDER;
            finalModel = FREE_TIER_MODEL;
            finalApiKey = FREE_TIER_GEMINI_API_KEY;
            console.log('Using free tier with provider:', finalProvider, 'model:', finalModel);
          } else {
            console.error('No API key available for free tier');
            sendResponse({ 
              error: 'No API key available. Please add your own API key in settings or configure the free tier API key.' 
            });
            return;
          }
        } else {
          console.log('Using user-provided API key with provider:', finalProvider, 'model:', finalModel);
        }
        
        // Handle AI API calls with context
        handleFactCheckAPI(request.text, request.context, finalProvider, finalModel, finalApiKey, request.language)
          .then(async result => {
            // Increment request count only on successful API call
            await incrementDailyRequestCount();
            
            // Notify popup to refresh daily limit display
            try {
              chrome.runtime.sendMessage({ action: 'refreshDailyLimit' });
            } catch (e) {
              // Popup might not be open, ignore error
            }
            
            sendResponse(result);
          })
          .catch(error => {
            console.error('Fact check error:', error);
            sendResponse({ error: error.message });
          });
      }).catch(error => {
        console.error('Error checking daily limit:', error);
        sendResponse({ error: error.message });
      });
      return true;
    }

  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
});

// Handle AI API calls
async function handleFactCheckAPI(text, context, provider, model, apiKey, language) {
  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(text, context, model, apiKey, language);
      case 'google':
        return await callGoogleAI(text, context, model, apiKey, language);
      case 'perplexity':
        return await callPerplexity(text, context, model, apiKey, language);
      default:
        throw new Error('Unsupported AI provider');
    }
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

// Parse AI response and extract structured data
function parseAIResponse(content, provider) {
  // Clean up markdown code blocks if present
  let cleanedContent = content;
  
  // Remove all markdown code blocks (```json, ```, etc.)
  cleanedContent = cleanedContent.replace(/```[a-z]*\s*\n?/g, '');
  cleanedContent = cleanedContent.replace(/```\s*\n?/g, '');
  
  // Clean up any remaining markdown artifacts
  cleanedContent = cleanedContent.replace(/^\s*```\s*$/gm, ''); // Remove standalone ```
  cleanedContent = cleanedContent.replace(/^\s*```json\s*$/gm, ''); // Remove standalone ```json
  cleanedContent = cleanedContent.replace(/^\s*```\s*$/gm, ''); // Remove any remaining ```
  
  // Trim whitespace and clean up
  cleanedContent = cleanedContent.trim();
  
  // Try to extract JSON from the cleaned content
  let jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      
      // Clean up the text fields to remove any remaining markdown artifacts
      const cleanText = (text) => {
        if (!text) return text;
        return text
          .replace(/```[a-z]*\s*\n?/g, '')
          .replace(/```\s*\n?/g, '')
          .replace(/^\s*```\s*$/gm, '')
          .trim();
      };
      
      // Ensure all required fields are present and clean
      return {
        truthScore: parseInt(parsed.truthScore) || 50,
        analysis: cleanText(parsed.analysis) || 'No analysis provided',
        evidence: cleanText(parsed.evidence) || 'No evidence provided',
        sources: Array.isArray(parsed.sources) ? parsed.sources.map(cleanText) : [],
        corrections: Array.isArray(parsed.corrections) ? parsed.corrections.map(cleanText) : [],
        sourceCredibility: cleanText(parsed.sourceCredibility) || 'No source credibility assessment provided',
        contextualNotes: cleanText(parsed.contextualNotes) || 'No contextual notes provided'
      };
    } catch (parseError) {
      console.warn('Failed to parse JSON, using fallback parsing:', parseError);
    }
  }
  
  // Fallback: try to extract information from text
  return parseTextResponse(content);
}

// Parse text response when JSON parsing fails
function parseTextResponse(content) {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  let analysis = '';
  let evidence = '';
  let sources = [];
  let corrections = [];
  let truthScore = 50;
  
  let currentSection = '';
  
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    
    // Detect sections
    if (lowerLine.includes('analysis') || lowerLine.includes('analysis:')) {
      currentSection = 'analysis';
      continue;
    } else if (lowerLine.includes('evidence') || lowerLine.includes('evidence:')) {
      currentSection = 'evidence';
      continue;
    } else if (lowerLine.includes('source') || lowerLine.includes('sources') || lowerLine.includes('sources:')) {
      currentSection = 'sources';
      continue;
    } else if (lowerLine.includes('correction') || lowerLine.includes('corrections') || lowerLine.includes('corrections:')) {
      currentSection = 'corrections';
      continue;
    } else if (lowerLine.includes('score') || lowerLine.includes('truth')) {
      // Try to extract score
      const scoreMatch = line.match(/(\d+)/);
      if (scoreMatch) {
        truthScore = parseInt(scoreMatch[1]);
      }
      continue;
    }
    
    // Add content to appropriate section
    if (currentSection === 'analysis') {
      analysis += (analysis ? ' ' : '') + line;
    } else if (currentSection === 'evidence') {
      evidence += (evidence ? ' ' : '') + line;
    } else if (currentSection === 'sources') {
      if (line.includes('http')) {
        sources.push(line);
      }
    } else if (currentSection === 'corrections') {
      corrections.push(line);
    } else if (!analysis) {
      // If no section detected, treat as analysis
      analysis = line;
    }
  }
  
  return {
    truthScore: Math.max(0, Math.min(100, truthScore)),
    analysis: analysis || 'Analysis not provided',
    evidence: evidence || 'Evidence not provided',
    sources: sources,
    corrections: corrections
  };
}

// Enhanced fact-checking prompt with contextual information
function getFactCheckPrompt(text, context, language) {
  let contextInfo = '';
  
  if (context) {
    contextInfo = `

CONTEXTUAL INFORMATION:
- Website: ${context.domain}
- Page Title: "${context.title}"
- URL: ${context.url}
- Publication Date: ${context.publicationDate || 'Not available'}
- Author: ${context.author || 'Not available'}
- Timestamp: ${context.timestamp}
${context.surroundingText ? `
- Text Before Claim: "${context.surroundingText.before}"
- Text After Claim: "${context.surroundingText.after}"` : ''}
${context.metaInfo.description ? `- Page Description: "${context.metaInfo.description}"` : ''}
${context.metaInfo['og:site_name'] ? `- Site Name: ${context.metaInfo['og:site_name']}` : ''}
${context.metaInfo['og:type'] ? `- Content Type: ${context.metaInfo['og:type']}` : ''}`;
  }

  return `You are an expert fact-checking AI assistant with comprehensive research capabilities. Your task is to thoroughly analyze and verify the following claim in its full context:

CLAIM TO VERIFY: "${text}"${contextInfo}

INSTRUCTIONS:
1. **Context Understanding**: First, understand what is being presented and gather all relevant context about the claim, including the source website's credibility and the surrounding context.

2. **Source Credibility Assessment**: Evaluate the credibility of the source website:
   - Check the domain reputation and history
   - Assess the website's track record for accuracy
   - Consider the author's credentials and expertise
   - Evaluate the publication date and relevance

3. **Comprehensive Research**: Search the internet, social media platforms (including X/Twitter), academic databases, news sources, and official websites to gather information from all available sources.

4. **Intelligent Analysis**: Determine if the information is:
   - Current and up-to-date
   - Accurate and factual
   - Properly interpreted
   - Complete or missing important context
   - Biased or misleading
   - Outdated or superseded by newer information

5. **Trust Score Assignment**: Assign a "Trust Score" from 0-100 where:
   - 0-20: Completely false or misleading
   - 21-40: Mostly false with some truth
   - 41-60: Partially true but incomplete/misleading
   - 61-80: Mostly true with minor issues
   - 81-100: Completely accurate and trustworthy

6. **Verification**: Cross-reference the claim with real, verifiable sources including:
   - Official government websites
   - Academic research papers
   - Reputable news organizations
   - Expert statements and interviews
   - Primary source documents

7. **Response Format**: Provide your analysis in this exact JSON format:

{
  "truthScore": <number between 0-100>,
  "analysis": "<SHORT explanation (2-3 sentences) of your findings>",
  "evidence": "<DETAILED explanation with specific facts, dates, sources, and reasoning for your trust score>",
  "sources": ["<verifiable source 1>", "<verifiable source 2>", "<verifiable source 3>"],
  "corrections": ["<specific correction 1 if needed>", "<specific correction 2 if needed>"],
  "sourceCredibility": "<assessment of the source website's credibility>",
  "contextualNotes": "<any relevant notes about the context or surrounding information>"
}

Respond in ${language === 'en' ? 'English' : language}. Be thorough, objective, and provide specific evidence for your conclusions. Consider the source website's reputation and the surrounding context when evaluating the claim.`;
}

// OpenAI API implementation
async function callOpenAI(text, context, model, apiKey, language) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [
        {
          role: 'system',
          content: getFactCheckPrompt(text, context, language)
        },
        {
          role: 'user',
          content: `Please fact-check this claim: "${text}"`
        }
      ],
      temperature: 0.2
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenAI API error response:', errorText);
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return parseAIResponse(content, 'openai');
}

// Google AI API implementation
async function callGoogleAI(text, context, model, apiKey, language) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: getFactCheckPrompt(text, context, language)
        }]
      }]
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Google AI API error response:', errorText);
    throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  return parseAIResponse(content, 'google');
}

// Perplexity API implementation
async function callPerplexity(text, context, model, apiKey, language) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: model,
      messages: [{
        role: 'user',
        content: getFactCheckPrompt(text, context, language)
      }],
      max_tokens: 1500
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Perplexity API error response:', errorText);
    throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  return parseAIResponse(content, 'perplexity');
}

 