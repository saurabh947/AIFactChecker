# Privacy Policy for AI Fact Checker Chrome Extension

**Last Updated:** July 2025

## Overview

AI Fact Checker is a Chrome extension that provides instant fact-checking capabilities using AI models. This privacy policy explains how we handle your data and what information is collected, stored, or transmitted.

## Data Collection

**We do not collect, store, or transmit any personal data or browsing information.**

The AI Fact Checker extension operates entirely locally within your browser and does not:
- Collect personal information
- Track your browsing history
- Store your search queries
- Send data to our servers
- Use analytics or tracking tools

## API Keys and Storage

### Secure Storage
When you provide API keys for AI services (OpenAI, Google Gemini, Perplexity AI), these keys are stored securely in Chrome's built-in storage system using the `chrome.storage.local` API.

### Local Storage Only
- API keys are stored locally on your device
- Keys are never transmitted to our servers
- Keys are only used to make direct API calls to the respective AI services
- Keys are automatically encrypted by Chrome's storage system

### Data Flow
1. You enter your API key through the extension popup
2. The key is stored securely in Chrome's local storage
3. When making fact-checking requests, the extension uses your stored API key to communicate directly with the AI service
4. No data passes through our servers

## Third-Party Services

The extension integrates with the following AI services:
- **OpenAI GPT-4**: For fact-checking and analysis
- **Google Gemini**: For alternative fact-checking results
- **Perplexity AI**: For additional verification sources

When you use these services:
- Your queries are sent directly to the respective AI service
- Each service has its own privacy policy and data handling practices
- We recommend reviewing their privacy policies for complete information

## Permissions

The extension requests the following permissions:
- **Storage**: To securely store your API keys locally
- **Context Menus**: To provide right-click fact-checking functionality
- **Active Tab**: To access the text you've selected for fact-checking

These permissions are used only for the stated purposes and do not enable any data collection or tracking.

## Data Retention

Since we do not collect any data, there is no data retention policy. Your API keys are stored locally and can be removed at any time by:
- Deleting the extension
- Clearing Chrome's extension data
- Manually removing keys through the extension's settings

## Updates to This Policy

We may update this privacy policy from time to time. Any changes will be reflected in the "Last Updated" date at the top of this document.

## Contact

If you have any questions about this privacy policy or how your data is handled, please refer to the project's GitHub repository or documentation.

## Your Rights

Since we do not collect personal data, there are no personal data rights to exercise. However, you always have the right to:
- Remove the extension and all associated data
- Clear stored API keys
- Stop using the extension at any time

---

**Note:** This privacy policy applies only to the AI Fact Checker Chrome extension. It does not cover the privacy practices of the AI services (OpenAI, Google Gemini, Perplexity AI) that the extension integrates with. 