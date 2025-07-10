// Background service worker for AI Fact Checker

// Free tier configuration
const DAILY_REQUEST_LIMIT = 20;
const DAILY_YOUTUBE_LIMIT = 5;
const FREE_TIER_PROVIDER = 'google';
const FREE_TIER_MODEL = 'gemini-1.5-flash';
const FREE_TIER_GEMINI_API_KEY = '';
const SUPADATA_API_KEY = '';

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
    chrome.storage.sync.get(['apiKey'], (result) => {
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

// YouTube-specific tracking functions
async function getDailyYouTubeCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dailyYouTubeCount', 'lastYouTubeDate'], (result) => {
      const today = new Date().toDateString();
      const lastDate = result.lastYouTubeDate;
      
      // Reset counter if it's a new day
      if (lastDate !== today) {
        chrome.storage.local.set({ dailyYouTubeCount: 0, lastYouTubeDate: today }, () => {
          resolve(0);
        });
      } else {
        resolve(result.dailyYouTubeCount || 0);
      }
    });
  });
}

async function incrementDailyYouTubeCount() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['dailyYouTubeCount'], (result) => {
      const newCount = (result.dailyYouTubeCount || 0) + 1;
      chrome.storage.local.set({ dailyYouTubeCount: newCount }, () => {
        resolve(newCount);
      });
    });
  });
}

async function checkDailyYouTubeLimit() {
  const currentCount = await getDailyYouTubeCount();
  return {
    canMakeRequest: currentCount < DAILY_YOUTUBE_LIMIT,
    remainingRequests: Math.max(0, DAILY_YOUTUBE_LIMIT - currentCount),
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
    // Remove text fact-check menu
    chrome.contextMenus.remove("factCheck", () => {
      if (chrome.runtime.lastError) {
        console.log('No existing text fact-check menu to remove');
      } else {
        console.log('Existing text fact-check menu removed');
      }
    });
    
    // Remove YouTube fact-check menu
    chrome.contextMenus.remove("factCheckYouTube", () => {
      if (chrome.runtime.lastError) {
        console.log('No existing YouTube fact-check menu to remove');
      } else {
        console.log('Existing YouTube fact-check menu removed');
      }
    });
    
    resolve();
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
      // Create text fact-checking menu item
      chrome.contextMenus.create({
        id: "factCheck",
        title: "Fact Check with AI",
        contexts: ["selection"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Text fact-check menu creation error:', chrome.runtime.lastError.message);
        } else {
          console.log('Text fact-check menu created successfully');
        }
      });
      
      // Create YouTube fact-checking menu item (only on YouTube pages)
      chrome.contextMenus.create({
        id: "factCheckYouTube",
        title: "Fact Check YouTube Video",
        contexts: ["page"],
        documentUrlPatterns: ["*://*.youtube.com/*", "*://youtube.com/*"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('YouTube fact-check menu creation error:', chrome.runtime.lastError.message);
        } else {
          console.log('YouTube fact-check menu created successfully');
        }
      });
      
      // Mark as initialized if at least one menu was created successfully
      isInitialized = true;
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
  chrome.contextMenus.remove("factCheckYouTube", () => {
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
    // Handle text fact-checking
    handleContextMenuClick(info, tab).catch(error => {
      console.error('Unhandled error in text fact-check context menu handler:', error);
      // Show user-friendly notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Truth Detective',
        message: 'An error occurred. Please try again or refresh the page.'
      });
    });
  } else if (info.menuItemId === "factCheckYouTube") {
    // Handle YouTube fact-checking
    handleYouTubeContextMenuClick(info, tab).catch(error => {
      console.error('Unhandled error in YouTube fact-check context menu handler:', error);
      // Show user-friendly notification
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Truth Detective',
        message: 'An error occurred. Please try again or refresh the page.'
      });
    });
  }
});

// Extract video ID from YouTube URL
function extractYouTubeVideoId(url) {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/watch\?.*v=([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  return null;
}

// Separate async function to handle YouTube context menu clicks
async function handleYouTubeContextMenuClick(info, tab) {
  try {
    // Check if we can access the tab
    if (!tab || !tab.id) {
      console.error('Invalid tab information');
      return;
    }

    // Check if we're on a YouTube page
    if (!tab.url || !tab.url.includes('youtube.com')) {
      console.log('Not on a YouTube page');
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Truth Detective',
        message: 'YouTube fact-checking is only available on YouTube pages.'
      });
      return;
    }

    // Extract video ID from URL
    const videoId = extractYouTubeVideoId(tab.url);
    if (!videoId) {
      console.log('Could not extract video ID from URL:', tab.url);
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon48.png',
        title: 'Truth Detective',
        message: 'Could not identify a YouTube video on this page. Please navigate to a video page.'
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

    // Show initial modal
    chrome.tabs.sendMessage(tab.id, {
      action: 'showYouTubeModal'
    });

    // Get video info and transcript from Supadata
    const transcriptData = await getYouTubeVideoInfo(videoId);
    
    // Update modal with transcript data
    chrome.tabs.sendMessage(tab.id, {
      action: 'updateYouTubeModalWithTranscript',
      videoInfo: transcriptData.videoInfo,
      transcript: transcriptData.transcript
    });
    
    // Create context for YouTube video
    const context = {
      domain: 'youtube.com',
      title: transcriptData.videoInfo.title,
      url: `https://www.youtube.com/watch?v=${videoId}`,
      publicationDate: transcriptData.videoInfo.uploadDate || 'Not available',
      author: transcriptData.videoInfo.channel,
      timestamp: new Date().toISOString(),
      metaInfo: {
        'og:site_name': 'YouTube',
        'og:type': 'video'
      }
    };
    
    // Use YouTube-specific daily limit
    const limitInfo = await checkDailyYouTubeLimit();
    if (!limitInfo.canMakeRequest) {
      const errorMessage = `Daily YouTube limit reached. You've used ${limitInfo.totalRequests}/${DAILY_YOUTUBE_LIMIT} video fact-checks today. Please try again tomorrow.`;
      
      // Show error in modal
      chrome.tabs.sendMessage(tab.id, {
        action: 'showModalError',
        error: errorMessage
      });
      
      return;
    }
    
    // Determine if using free tier or user's own API key
    let finalProvider = 'google'; // Default for YouTube
    let finalModel = 'gemini-1.5-flash'; // Default for YouTube
    let finalApiKey = '';
    const language = 'en'; // Default language
    
    // Check storage for user's saved API key
    const result = await new Promise((resolve) => {
      chrome.storage.sync.get(['apiKey'], resolve);
    });
    
    if (result.apiKey && result.apiKey.trim() !== '') {
      finalApiKey = result.apiKey;
      console.log('Using saved API key for YouTube fact check');
    } else {
      // No saved API key, use free tier
      if (FREE_TIER_GEMINI_API_KEY) {
        finalProvider = FREE_TIER_PROVIDER;
        finalModel = FREE_TIER_MODEL;
        finalApiKey = FREE_TIER_GEMINI_API_KEY;
        console.log('Using free tier for YouTube fact check with provider:', finalProvider, 'model:', finalModel);
      } else {
        console.error('No API key available for free tier');
        const errorMessage = 'No API key available. Please add your own API key in settings or configure the free tier API key.';
        
        // Show error in modal
        chrome.tabs.sendMessage(tab.id, {
          action: 'showModalError',
          error: errorMessage
        });
        
        return;
      }
    }
    
    // Handle AI API calls with context
    try {
      const result = await performFactCheck(transcriptData.transcript, context, finalProvider, finalModel, finalApiKey, language);
      
      // Increment YouTube count only on successful API call
      await incrementDailyYouTubeCount();
      
      // Notify popup to refresh daily limit display
      try {
        chrome.runtime.sendMessage({ action: 'refreshDailyLimit' });
      } catch (e) {
        // Popup might not be open, ignore error
      }
      
      // Send result to content script to display
      chrome.tabs.sendMessage(tab.id, {
        action: 'updateYouTubeModalWithResults',
        result: result
      });
      
    } catch (error) {
      console.error('YouTube fact check error:', error);
      
      // Show error in modal
      chrome.tabs.sendMessage(tab.id, {
        action: 'showModalError',
        error: error.message
      });
    }
    
  } catch (error) {
    console.error('Error handling YouTube context menu click:', error);
    throw error; // Re-throw to be caught by the outer catch
  }
}

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
          title: 'Truth Detective',
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
              title: 'Truth Detective',
              message: 'Please refresh the page and try again, or use the extension popup instead.'
            });
          }
        } catch (injectionError) {
          console.error('Failed to inject content script:', injectionError.message || injectionError);
          // Show user-friendly notification
          chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon48.png',
            title: 'Truth Detective',
            message: 'Please refresh the page and try again, or use the extension popup instead.'
          });
        }
      } else {
        // Show user-friendly notification for other errors
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon48.png',
          title: 'Truth Detective',
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
    
    if (request.action === "checkDailyYouTubeLimit") {
      // Check daily YouTube limit
      checkDailyYouTubeLimit().then(limitInfo => {
        sendResponse(limitInfo);
      }).catch(error => {
        console.error('Error checking daily YouTube limit:', error);
        sendResponse({ error: error.message });
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
        

        
        // If user doesn't have an API key from popup, check storage for saved API key
        if (!finalApiKey || finalApiKey.trim() === '') {
          // Check storage for user's saved API key
          chrome.storage.sync.get(['apiKey'], (result) => {
            if (result.apiKey && result.apiKey.trim() !== '') {
              finalApiKey = result.apiKey;
              console.log('Using saved API key from storage');
            } else {
              // No saved API key, use free tier
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
            }
            
            // Handle AI API calls with context
            performFactCheck(request.text, request.context, finalProvider, finalModel, finalApiKey, request.language)
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
          });
          return;
        } else {
          console.log('Using user-provided API key');
        }
        
        // Handle AI API calls with context
        performFactCheck(request.text, request.context, finalProvider, finalModel, finalApiKey, request.language)
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
    
    if (request.action === "factCheckYouTubeVideo") {
      // Handle YouTube video fact checking using the existing fact-checking flow
      chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
        if (tabs.length === 0) {
          sendResponse({ error: 'No active tab found' });
          return;
        }
        
        const tab = tabs[0];
        
        try {
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
            throw new Error('Content script failed to initialize after multiple attempts');
          }
          
          // Show initial modal
          chrome.tabs.sendMessage(tab.id, {
            action: 'showYouTubeModal'
          });
          
          // Get video info and transcript from Supadata
          const transcriptData = await getYouTubeVideoInfo(request.videoId);
          
          // Update modal with transcript data
          chrome.tabs.sendMessage(tab.id, {
            action: 'updateYouTubeModalWithTranscript',
            videoInfo: transcriptData.videoInfo,
            transcript: transcriptData.transcript
          });
          
          // Create context for YouTube video
          const context = {
            domain: 'youtube.com',
            title: transcriptData.videoInfo.title,
            url: `https://www.youtube.com/watch?v=${request.videoId}`,
            publicationDate: transcriptData.videoInfo.uploadDate || 'Not available',
            author: transcriptData.videoInfo.channel,
            timestamp: new Date().toISOString(),
            metaInfo: {
              'og:site_name': 'YouTube',
              'og:type': 'video'
            }
          };
          
          // Use the existing fact-checking flow
          checkDailyLimit().then(limitInfo => {
            if (!limitInfo.canMakeRequest) {
              const errorMessage = `Daily limit reached. You've used ${limitInfo.totalRequests}/${DAILY_REQUEST_LIMIT} requests today. Please try again tomorrow.`;
              
              // Show error in modal
              chrome.tabs.sendMessage(tab.id, {
                action: 'showModalError',
                error: errorMessage
              });
              
              sendResponse({ error: errorMessage });
              return;
            }
            
            // Determine if using free tier or user's own API key
            let finalProvider = 'google'; // Default for YouTube
            let finalModel = 'gemini-1.5-flash'; // Default for YouTube
            let finalApiKey = '';
            const language = 'en'; // Default language
            

            
            // Check storage for user's saved API key
            chrome.storage.sync.get(['apiKey'], (result) => {
              if (result.apiKey && result.apiKey.trim() !== '') {
                finalApiKey = result.apiKey;
                console.log('Using saved API key for YouTube fact check');
              } else {
                // No saved API key, use free tier
                if (FREE_TIER_GEMINI_API_KEY) {
                  finalProvider = FREE_TIER_PROVIDER;
                  finalModel = FREE_TIER_MODEL;
                  finalApiKey = FREE_TIER_GEMINI_API_KEY;
                  console.log('Using free tier for YouTube fact check with provider:', finalProvider, 'model:', finalModel);
                } else {
                  console.error('No API key available for free tier');
                  const errorMessage = 'No API key available. Please add your own API key in settings or configure the free tier API key.';
                  
                  // Show error in modal
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'showModalError',
                    error: errorMessage
                  });
                  
                  sendResponse({ error: errorMessage });
                  return;
                }
              }
              
              // Handle AI API calls with context
              performFactCheck(transcriptData.transcript, context, finalProvider, finalModel, finalApiKey, language)
                .then(async result => {
                  // Increment request count only on successful API call
                  await incrementDailyRequestCount();
                  
                  // Notify popup to refresh daily limit display
                  try {
                    chrome.runtime.sendMessage({ action: 'refreshDailyLimit' });
                  } catch (e) {
                    // Popup might not be open, ignore error
                  }
                  
                  // Send result to content script to display
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'updateYouTubeModalWithResults',
                    result: result
                  });
                  
                  sendResponse({ success: true });
                })
                .catch(error => {
                  console.error('YouTube fact check error:', error);
                  
                  // Show error in modal
                  chrome.tabs.sendMessage(tab.id, {
                    action: 'showModalError',
                    error: error.message
                  });
                  
                  sendResponse({ error: error.message });
                });
            });
          }).catch(error => {
            console.error('Error checking daily limit:', error);
            
            // Show error in modal
            chrome.tabs.sendMessage(tab.id, {
              action: 'showModalError',
              error: error.message
            });
            
            sendResponse({ error: error.message });
          });
        } catch (error) {
          console.error('Error getting YouTube transcript:', error);
          
          // Show error in modal
          chrome.tabs.sendMessage(tab.id, {
            action: 'showModalError',
            error: error.message
          });
          
          sendResponse({ error: error.message });
        }
      });
      return true;
    }

  } catch (error) {
    console.error('Error handling message:', error);
    sendResponse({ error: error.message });
  }
});

// Unified fact-checking function - single path for all AI calls
async function performFactCheck(text, context, provider, model, apiKey, language) {
  try {
    // Validate inputs
    if (!text || text.trim() === '') {
      throw new Error('No text provided for fact-checking');
    }
    
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('API key is required');
    }
    
    // Validate API key format based on provider
    if (provider === 'openai' && !apiKey.startsWith('sk-')) {
      console.warn('API key does not start with "sk-" - this might not be a valid OpenAI API key');
    } else if (provider === 'google' && !apiKey.startsWith('AIza')) {
      console.warn('API key does not start with "AIza" - this might not be a valid Google AI API key');
    }
    
    // Check if API key is not a placeholder
    if (apiKey.includes('<YOUR_') || apiKey.includes('YOUR_') || apiKey === 'your-api-key-here') {
      throw new Error('Please replace the placeholder API key with a valid API key');
    }
    
    console.log(`Making ${provider} API call with model: ${model}`);
    
    // Get the fact-checking prompt
    const prompt = getFactCheckPrompt(text, context, language);
    
    // Make API call based on provider
    let response;
    let content;
    
    switch (provider) {
      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
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
                content: prompt
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
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.status === 401) {
            throw new Error('OpenAI API key is invalid. Please check your API key.');
          } else if (response.status === 429) {
            throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
          } else if (response.status === 400) {
            throw new Error('Invalid request to OpenAI API. Please check the input text and try again.');
          }
          
          throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
        }
        
        const openaiData = await response.json();
        content = openaiData.choices[0].message.content;
        break;
        
      case 'google':
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
        
        response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: prompt
              }]
            }]
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Google AI API error response:', errorText);
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.status === 403) {
            if (errorText.includes('unregistered callers') || errorText.includes('PERMISSION_DENIED')) {
              throw new Error('Google AI API key is invalid or not properly configured. Please check your API key or contact the extension developer.');
            } else if (errorText.includes('quota')) {
              throw new Error('Google AI API quota exceeded. Please try again later or use a different API key.');
            }
          } else if (response.status === 400) {
            throw new Error('Invalid request to Google AI API. Please check the input text and try again.');
          } else if (response.status === 429) {
            throw new Error('Google AI API rate limit exceeded. Please wait a moment and try again.');
          }
          
          throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
        }
        
        const googleData = await response.json();
        content = googleData.candidates[0].content.parts[0].text;
        break;
        
      case 'perplexity':
        response = await fetch('https://api.perplexity.ai/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            messages: [{
              role: 'user',
              content: prompt
            }],
            max_tokens: 1500
          })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Perplexity API error response:', errorText);
          console.error('Response status:', response.status);
          console.error('Response headers:', Object.fromEntries(response.headers.entries()));
          
          if (response.status === 401) {
            throw new Error('Perplexity API key is invalid. Please check your API key.');
          } else if (response.status === 429) {
            throw new Error('Perplexity API rate limit exceeded. Please wait a moment and try again.');
          } else if (response.status === 400) {
            throw new Error('Invalid request to Perplexity API. Please check the input text and try again.');
          }
          
          throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
        }
        
        const perplexityData = await response.json();
        content = perplexityData.choices[0].message.content;
        break;
        
      default:
        throw new Error('Unsupported AI provider');
    }
    
    // Parse the response using the unified parser
    return parseAIResponse(content, provider);
    
  } catch (error) {
    console.error('Fact-checking error:', error);
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
      // Clean up any trailing content after the JSON
      let jsonString = jsonMatch[0];
      
      // Remove any trailing content that might be after the closing brace
      const lastBraceIndex = jsonString.lastIndexOf('}');
      if (lastBraceIndex !== -1) {
        jsonString = jsonString.substring(0, lastBraceIndex + 1);
      }
      
      const parsed = JSON.parse(jsonString);
      
      // Clean up the text fields to remove any remaining markdown artifacts and JSON artifacts
      const cleanText = (text) => {
        if (!text) return text;
        return text
          .replace(/```[a-z]*\s*\n?/g, '')
          .replace(/```\s*\n?/g, '')
          .replace(/^\s*```\s*$/gm, '')
          .replace(/^\s*\]\s*,\s*\}\s*$/gm, '') // Remove trailing ], }
          .replace(/^\s*\}\s*$/gm, '') // Remove standalone }
          .replace(/^\s*\]\s*$/gm, '') // Remove standalone ]
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



// YouTube Video Functions
async function getYouTubeVideoInfo(videoId) {
  try {
    if (!SUPADATA_API_KEY || SUPADATA_API_KEY === '<YOUR_SUPADATA_API_KEY>') {
      throw new Error('Supadata API key not configured. Please contact the extension developer.');
    }

    // First, get video metadata using Supadata video API
    const videoResponse = await fetch(`https://api.supadata.ai/v1/youtube/video?id=${videoId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!videoResponse.ok) {
      const errorText = await videoResponse.text();
      console.error('Supadata video API error response:', errorText);
      throw new Error(`Supadata video API error: ${videoResponse.status} - ${errorText}`);
    }

    const videoData = await videoResponse.json();
    
    // Extract video information
    const videoInfo = {
      title: videoData.title || 'Unknown Title',
      channel: videoData.channel?.name || videoData.channel || 'Unknown Channel',
      uploadDate: videoData.uploadDate ? formatDate(videoData.uploadDate) : '',
      language: videoData.language || 'en'
    };

    // Now get the transcript
    const transcriptResponse = await fetch(`https://api.supadata.ai/v1/youtube/transcript?videoId=${videoId}&text=true`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': SUPADATA_API_KEY
      }
    });

    if (!transcriptResponse.ok) {
      const errorText = await transcriptResponse.text();
      console.error('Supadata transcript API error response:', errorText);
      throw new Error(`Supadata transcript API error: ${transcriptResponse.status} - ${errorText}`);
    }

    const transcriptData = await transcriptResponse.json();
    
    // Check if the transcript response has the expected structure
    if (!transcriptData.content) {
      throw new Error('Invalid transcript response from Supadata API');
    }

    return {
      transcript: transcriptData.content,
      videoInfo: videoInfo
    };
  } catch (error) {
    console.error('Error getting YouTube video info:', error);
    throw error;
  }
}



// Helper function to format duration in seconds to MM:SS or HH:MM:SS
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return 'Unknown Duration';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  } else {
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Helper function to format date
function formatDate(dateString) {
  if (!dateString) return '';
  
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch (error) {
    return dateString;
  }
}

// Get settings from storage
async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['provider', 'model', 'apiKey', 'language'], (result) => {
      resolve(result);
    });
  });
}