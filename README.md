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

2. **Open Chrome Extensions**
   - Open Chrome and navigate to `chrome://extensions/`
   - Enable "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AIFactChecker` folder
   - The extension should now appear in your extensions list

4. **Pin the Extension**
   - Click the puzzle piece icon in Chrome's toolbar
   - Find "AI Fact Checker" and click the pin icon

### Method 2: Chrome Web Store (Coming Soon)
- Search for "AI Fact Checker" in the Chrome Web Store
- Click "Add to Chrome"
- Follow the installation prompts

## ⚙️ Configuration

### Setting Up API Keys

1. **Open Extension Settings**
   - Click the AI Fact Checker icon in your toolbar
   - Navigate to the "Settings" tab

2. **Choose Your AI Provider**
   - Select from OpenAI, Google AI, or Perplexity
   - Each provider offers different strengths and pricing

3. **Add Your API Key**
   - Enter your API key in the designated field
   - Your key is stored locally and never shared

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
- Verify news articles
- Check social media claims
- Validate product information
- Research topics of interest

## 🚀 Future Features

### Planned Enhancements
- **Batch Fact-Checking**: Check multiple claims at once
- **Custom AI Models**: Support for additional AI providers
- **Fact-Checking History**: Save and review past checks
- **Export Results**: Save fact-checking reports
- **Collaborative Features**: Share fact-checks with others
- **Advanced Analytics**: Detailed accuracy metrics

### Community Features
- **User Submissions**: Submit claims for community verification
- **Rating System**: Rate the quality of fact-checks
- **Discussion Forums**: Discuss controversial claims
- **Expert Verification**: Professional fact-checker reviews

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Development
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

### Bug Reports
- Use the GitHub Issues page
- Provide detailed reproduction steps
- Include browser and extension versions

### Feature Requests
- Submit ideas through GitHub Issues
- Explain the use case and benefits
- Consider implementation complexity

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **OpenAI**: For providing the GPT-4 API
- **Google**: For the Gemini AI platform
- **Perplexity**: For their web-connected AI service
- **Chrome Extensions Team**: For the excellent documentation and tools

## 📞 Support

### Getting Help
- **Documentation**: Check this README first
- **GitHub Issues**: Report bugs or request features
- **Discussions**: Join community discussions
- **Email**: Contact us directly for support

### Common Issues

#### Extension Not Working
1. Check if API key is configured
2. Verify internet connection
3. Ensure extension is enabled
4. Try refreshing the page

#### API Errors
1. Verify API key is correct
2. Check API provider status
3. Ensure sufficient API credits
4. Try a different AI provider

#### Performance Issues
1. Close unnecessary tabs
2. Clear browser cache
3. Restart Chrome
4. Update the extension

## 🔄 Updates

### Version History
- **v1.0.0**: Initial release with core features
- **v1.1.0**: Added multi-language support
- **v1.2.0**: Enhanced UI and performance
- **v1.3.0**: Added Perplexity AI support

### Auto-Updates
- The extension updates automatically when available
- Manual updates available through Chrome Web Store
- Development version requires manual updates

---

**Made with ❤️ for a more informed internet**

*AI Fact Checker - Your trusted companion for truth verification* 