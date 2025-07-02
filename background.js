// Background service worker for AI Fact Checker
chrome.runtime.onInstalled.addListener(() => {
  // Create context menu for fact checking
  chrome.contextMenus.create({
    id: "factCheck",
    title: "Fact Check with AI",
    contexts: ["selection"]
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "factCheck" && info.selectionText) {
    // Send message to content script to trigger fact checking
    chrome.tabs.sendMessage(tab.id, {
      action: "factCheck",
      text: info.selectionText
    });
  }
});

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getSettings") {
    // Get stored settings
    chrome.storage.sync.get(['apiKey', 'provider', 'language'], (result) => {
      sendResponse({
        apiKey: result.apiKey || '',
        provider: result.provider || 'openai',
        language: result.language || 'en'
      });
    });
    return true; // Keep message channel open for async response
  }
  
  if (request.action === "saveSettings") {
    // Save settings
    chrome.storage.sync.set({
      apiKey: request.apiKey,
      provider: request.provider,
      language: request.language
    }, () => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  if (request.action === "factCheckAPI") {
    // Handle AI API calls
    handleFactCheckAPI(request.text, request.provider, request.apiKey, request.language)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({ error: error.message }));
    return true;
  }
});

// Handle AI API calls
async function handleFactCheckAPI(text, provider, apiKey, language) {
  try {
    switch (provider) {
      case 'openai':
        return await callOpenAI(text, apiKey, language);
      case 'google':
        return await callGoogleAI(text, apiKey, language);
      case 'perplexity':
        return await callPerplexity(text, apiKey, language);
      default:
        throw new Error('Unsupported AI provider');
    }
  } catch (error) {
    console.error('AI API Error:', error);
    throw error;
  }
}

// OpenAI API implementation
async function callOpenAI(text, apiKey, language) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a fact-checking assistant. Analyze the following claim and provide:
1. A truth score (0-100)
2. Factual analysis
3. Supporting evidence
4. Potential sources for verification
5. Any corrections or clarifications needed

Respond in ${language === 'en' ? 'English' : language}. Format your response as JSON with keys: truthScore, analysis, evidence, sources, corrections.`
        },
        {
          role: 'user',
          content: text
        }
      ],
      temperature: 0.3
    })
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    // Fallback if JSON parsing fails
    return {
      truthScore: 50,
      analysis: content,
      evidence: "AI analysis provided",
      sources: [],
      corrections: []
    };
  }
}

// Google AI API implementation
async function callGoogleAI(text, apiKey, language) {
  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [{
        parts: [{
          text: `Fact-check this claim: "${text}". Provide a JSON response with: truthScore (0-100), analysis, evidence, sources, corrections. Respond in ${language === 'en' ? 'English' : language}.`
        }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error(`Google AI API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      truthScore: 50,
      analysis: content,
      evidence: "AI analysis provided",
      sources: [],
      corrections: []
    };
  }
}

// Perplexity API implementation
async function callPerplexity(text, apiKey, language) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [{
        role: 'user',
        content: `Fact-check this claim: "${text}". Provide a JSON response with: truthScore (0-100), analysis, evidence, sources, corrections. Respond in ${language === 'en' ? 'English' : language}.`
      }],
      max_tokens: 1000
    })
  });

  if (!response.ok) {
    throw new Error(`Perplexity API error: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices[0].message.content;
  
  try {
    return JSON.parse(content);
  } catch {
    return {
      truthScore: 50,
      analysis: content,
      evidence: "AI analysis provided",
      sources: [],
      corrections: []
    };
  }
} 