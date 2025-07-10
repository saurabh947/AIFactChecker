# 🔍 Truth Detective - Instant Fact Check Anything

A powerful Chrome browser extension that provides instant fact-checking capabilities using AI-powered verification. Highlight text, right-click, and get instant accuracy scores with detailed analysis and source citations. Now with YouTube video transcript fact-checking!

## ✨ Features

### 🚀 Instant Fact-Checking
- **Right-click Context Menu**: Select any text on any webpage and right-click to access "Fact Check with AI"
- **Popup Interface**: Click the extension icon for a dedicated fact-checking interface
- **Real-time Analysis**: Get instant results with AI-powered verification

### 🎥 YouTube Video Fact-Checking (NEW!)
- **Transcript Analysis**: Automatically extracts and fact-checks YouTube video transcripts
- **Video Metadata**: Displays video title, channel, upload date, and language
- **Dynamic Progress**: Real-time updates showing transcript extraction and AI analysis progress
- **One-Click Access**: Click the YouTube button in the popup to fact-check any YouTube video

### 📊 Truth Score System
- **0-100 Accuracy Scale**: Visual truth score with animated display
- **Color-coded Results**: Easy-to-understand accuracy indicators
- **Detailed Breakdown**: Comprehensive analysis of claims

### 🤖 Multi-AI Provider Support
- **OpenAI GPT-4**: High-quality analysis with deep reasoning
- **Google AI (Gemini)**: Fast and reliable fact-checking
- **Perplexity AI**: Web-connected verification with real-time sources
- **Configurable**: Add your own API keys for any supported provider

### 🌍 Multi-Language Support
- **10+ Languages**: English, Spanish, French, German, Italian, Portuguese, Russian, Chinese, Japanese, Korean
- **Localized Results**: Get fact-checking results in your preferred language
- **Universal Compatibility**: Works on websites in any language

### 📚 Source Citations
- **Clickable Links**: Direct access to verification sources
- **Multiple Sources**: Comprehensive list of supporting evidence
- **External Verification**: Open sources in new tabs for detailed review

### ⚠️ Contextual Analysis
- **Detailed Explanations**: AI-generated insights explaining claims
- **Evidence Presentation**: Clear presentation of supporting facts
- **Correction Suggestions**: Helpful corrections when claims are inaccurate
- **Source Credibility**: Assessment of the source website's reliability
- **Contextual Notes**: Additional context about the surrounding information

## 🛠️ Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/ai-fact-checker.git
   cd ai-fact-checker
   ```

2. **Configure API Keys (Optional)**
   
   The extension works with free tiers, but you can add API keys for unlimited usage:
   - **For YouTube fact-checking**: Free tier (5 videos/day) or add Supadata API key for unlimited
   - **For AI fact-checking**: Free tier (20 requests/day) or add your own API keys for unlimited
   - See the Configuration section below for setup instructions

3. **Open Chrome Extensions**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AIFactChecker` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "Truth Detective" and click the pin icon

### Method 2: Chrome Web Store (Coming Soon)
- Search for "Truth Detective" in the Chrome Web Store
- Click "Add to Chrome"
- Follow the installation prompts

## ⚙️ Configuration

### Required API Keys

The extension requires API keys to function:

#### For YouTube Fact-Checking
**Free Tier Available**: You can use YouTube fact-checking without an API key (5 videos/day limit). Add your own API key for unlimited usage!

**To get unlimited YouTube fact-checking:**
1. **Get Supadata API Key**
   - Visit [supadata.ai](https://supadata.ai)
   - Sign up for an account
   - Generate an API key
   - Contact the extension developer to add your key

#### For AI Fact-Checking
Choose one or more AI providers:

**OpenAI (Recommended)**
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy and paste the key into the extension settings

**Google AI (Gemini)**
1. Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste the key into the extension settings

**Perplexity AI**
1. Visit [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Sign up or log in to your Perplexity account
3. Generate an API key
4. Copy and paste the key into the extension settings

### Setting Up API Keys

1. **Open Extension Settings**
   - Click the Truth Detective icon in your toolbar
   - Navigate to the "Settings" tab

2. **Add Your API Keys**
   - Enter your API key in the designated field
   - Your keys are stored locally and never shared
   - Choose your preferred AI provider and model

3. **Daily Limits**
   - **Text Fact-Checking**: 20 requests/day (free tier)
   - **YouTube Fact-Checking**: 5 videos/day (free tier)
   - Add your own API keys for unlimited usage
   - The extension tracks daily usage to help manage costs
   - Check the settings for current usage statistics

## 🎯 Usage

### Method 1: Context Menu (Text Fact-Checking)
1. **Select Text**: Highlight any text on any webpage
2. **Right-click**: Open the context menu
3. **Choose "Fact Check with AI"**: Click the option in the menu
4. **View Results**: A modal will appear with detailed analysis

### Method 2: Extension Popup (Text Fact-Checking)
1. **Click Extension Icon**: Click the Truth Detective icon in your toolbar
2. **Enter Text**: Paste or type the claim you want to verify
3. **Click "Check Facts"**: Wait for AI analysis
4. **Review Results**: View truth score, analysis, and sources

### Method 3: YouTube Video Fact-Checking (NEW!)
1. **Navigate to YouTube**: Go to any YouTube video
2. **Open Extension Popup**: Click the Truth Detective icon
3. **Click YouTube Button**: Click the YouTube fact-check button
4. **Watch Progress**: See real-time updates as the transcript is extracted and analyzed
5. **Review Results**: View comprehensive fact-checking results for the entire video

### Understanding Results

#### Truth Score (0-100)
- **90-100**: Highly accurate claim
- **70-89**: Mostly accurate with minor issues
- **50-69**: Partially accurate or unclear
- **30-49**: Mostly inaccurate
- **0-29**: Highly inaccurate or false

#### Analysis Sections
- **📊 Analysis**: AI-generated explanation of the claim
- **🔍 Evidence**: Supporting facts and data
- **📚 Sources**: Clickable links to verification sources
- **⚠️ Corrections**: Suggested corrections for inaccurate claims
- **🎯 Source Credibility**: Assessment of the source's reliability
- **📝 Contextual Notes**: Additional context and background information

#### YouTube-Specific Information
- **Video Metadata**: Title, channel, upload date, language
- **Transcript Preview**: First 100 characters of the transcript
- **Full Analysis**: Fact-checking results for the entire video content

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing for API calls
- **Content Scripts**: Page integration and modal display
- **Popup Interface**: User-friendly settings and quick checks

### YouTube Integration
- **Supadata API**: Professional YouTube transcript extraction
- **Dynamic Modals**: Real-time progress updates and error handling
- **Robust Content Script Injection**: Ensures reliable operation across all websites
- **Error Recovery**: Graceful handling of API failures and network issues

### Security
- **Local Storage**: API keys stored securely in Chrome's sync storage
- **No Data Collection**: Your data never leaves your browser
- **HTTPS Only**: All API calls use secure connections
- **Privacy First**: No tracking or analytics

### Performance
- **Lightweight**: Minimal impact on browser performance
- **Fast Loading**: Optimized for quick fact-checking
- **Caching**: Efficient API response handling
- **Responsive**: Works on all screen sizes

## 🌟 Use Cases

### For Students
- Verify academic claims in research papers
- Check historical facts and statistics
- Validate scientific statements
- Fact-check news articles for assignments
- **NEW**: Analyze educational YouTube videos and lectures

### For Journalists
- Verify sources and claims quickly
- Check statistics and data accuracy
- Validate quotes and statements
- Research background information
- **NEW**: Fact-check video interviews and press conferences

### For Researchers
- Verify academic claims
- Check statistical data
- Validate research findings
- Fact-check competing studies
- **NEW**: Analyze research presentations and academic videos

### For General Users
- Verify news articles and social media posts
- Check product claims and reviews
- Validate health and medical information
- Fact-check political statements and debates
- **NEW**: Verify claims in YouTube videos, podcasts, and interviews

## 🚀 Recent Updates

### Version 1.1.0 - Truth Detective Rebrand & YouTube Free Tier
- ✅ **New Branding**: Rebranded as "Truth Detective - Instant Fact Check Anything"
- ✅ **YouTube Free Tier**: Added 5 videos/day free tier for YouTube fact-checking
- ✅ **Separate Limit Tracking**: YouTube and text fact-checking have independent daily limits
- ✅ **Enhanced UI**: Updated limit displays and user interface
- ✅ **Improved Documentation**: Updated README and privacy policy

### Version 2.0 - YouTube Fact-Checking
- ✅ **YouTube Transcript Analysis**: Automatically extract and fact-check video transcripts
- ✅ **Dynamic Progress UI**: Real-time updates showing extraction and analysis progress
- ✅ **Video Metadata Display**: Show video title, channel, upload date, and language
- ✅ **Robust Error Handling**: Graceful handling of API failures and network issues
- ✅ **Improved Content Script Injection**: Reliable operation across all websites
- ✅ **Clean Modal Interface**: Streamlined UI with focus on essential information

### Version 1.5 - UI Improvements
- ✅ **Enhanced Modal Design**: Better visual hierarchy and readability
- ✅ **Progress Indicators**: Clear status updates during fact-checking
- ✅ **Error Recovery**: Better error messages and recovery options
- ✅ **Performance Optimizations**: Faster loading and response times

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Clone the repository
2. Configure API keys in `background.js`
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by leading AI providers (OpenAI, Google AI, Perplexity)
- YouTube integration powered by Supadata
- Designed for privacy and security
- Created for the community

---

**Note**: This extension is for educational and informational purposes. Always verify important information through multiple sources and consult experts when needed. The YouTube fact-checking feature works with the free tier (5 videos/day) or with your own Supadata API key for unlimited usage. 