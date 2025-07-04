# 🔍 AI Fact Checker Chrome Extension

A powerful Chrome browser extension that provides instant fact-checking capabilities using AI-powered verification. Highlight text, right-click, and get instant accuracy scores with detailed analysis and source citations.

## ✨ Features

### 🚀 Instant Fact-Checking
- **Right-click Context Menu**: Select any text on any webpage and right-click to access "Fact Check with AI"
- **Popup Interface**: Click the extension icon for a dedicated fact-checking interface
- **Real-time Analysis**: Get instant results with AI-powered verification

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

## 🛠️ Installation

### Method 1: Load Unpacked Extension (Development)

1. **Download the Extension**
   ```bash
   git clone https://github.com/yourusername/ai-fact-checker.git
   cd ai-fact-checker
   ```

2. **Configure API Keys (Optional)**
   
   The extension comes with a free tier that works immediately without any setup!
   
   If you want to use your own API keys for unlimited usage:
   - Open the extension popup
   - Go to the Settings tab
   - Add your API key for your preferred provider

3. **Open Chrome Extensions**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AIFactChecker` folder
   - The extension should now appear in your extensions list

5. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "AI Fact Checker" and click the pin icon

### Method 2: Chrome Web Store (Coming Soon)
- Search for "AI Fact Checker" in the Chrome Web Store
- Click "Add to Chrome"
- Follow the installation prompts

## ⚙️ Configuration

### Free Tier Available! 🎉

**No API Key Required**: You can use the extension immediately without any setup! The free tier provides:
- **20 requests per day** using Google's Gemini AI
- **Instant fact-checking** with no configuration needed
- **Full feature access** including truth scores, analysis, and sources

### Setting Up Your Own API Key (Optional)

For unlimited usage or to use different AI providers:

1. **Open Extension Settings**
   - Click the AI Fact Checker icon in your toolbar
   - Navigate to the "Settings" tab

2. **Choose Your AI Provider**
   - Select from OpenAI, Google AI, or Perplexity
   - Each provider offers different strengths and pricing

3. **Add Your API Key**
   - Enter your API key in the designated field
   - Your key is stored locally and never shared
   - Leave empty to continue using the free tier

### Getting API Keys

#### OpenAI (Recommended)
1. Visit [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Sign up or log in to your OpenAI account
3. Create a new API key
4. Copy and paste the key into the extension

#### Google AI (Gemini)
1. Visit [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste the key into the extension

#### Perplexity AI
1. Visit [perplexity.ai/settings/api](https://www.perplexity.ai/settings/api)
2. Sign up or log in to your Perplexity account
3. Generate an API key
4. Copy and paste the key into the extension

## 🎯 Usage

**Ready to use immediately!** No setup required - just start fact-checking:

### Method 1: Context Menu (Recommended)
1. **Select Text**: Highlight any text on any webpage
2. **Right-click**: Open the context menu
3. **Choose "Fact Check with AI"**: Click the option in the menu
4. **View Results**: A modal will appear with detailed analysis

### Method 2: Extension Popup
1. **Click Extension Icon**: Click the AI Fact Checker icon in your toolbar
2. **Enter Text**: Paste or type the claim you want to verify
3. **Click "Check Facts"**: Wait for AI analysis
4. **Review Results**: View truth score, analysis, and sources

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

## 🔧 Technical Details

### Architecture
- **Manifest V3**: Modern Chrome extension architecture
- **Service Worker**: Background processing for API calls
- **Content Scripts**: Page integration and modal display
- **Popup Interface**: User-friendly settings and quick checks

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

### For Journalists
- Verify sources and claims quickly
- Check statistics and data accuracy
- Validate quotes and statements
- Research background information

### For Researchers
- Verify academic claims
- Check statistical data
- Validate research findings
- Fact-check competing studies

### For General Users
- Verify news articles and social media posts
- Check product claims and reviews
- Validate health and medical information
- Fact-check political statements and debates

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues, feature requests, or pull requests.

### Development Setup
1. Clone the repository
2. Install dependencies (if any)
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- Powered by leading AI providers
- Designed for privacy and security
- Created for the community

---

**Note**: This extension is for educational and informational purposes. Always verify important information through multiple sources and consult experts when needed. 