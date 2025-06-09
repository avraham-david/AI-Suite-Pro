# AI Suite Pro

A powerful Chrome extension that brings AI capabilities directly to your browsing experience. Enhance your web interactions with intelligent text analysis, translation, summarization, and an integrated AI chat assistant.

## 🌟 Features

### Text Selection Tools
- **📝 Smart Summarization**: Instantly summarize selected text
- **🌐 Multi-Language Translation**: Translate text to any language with custom prompts
- **💡 Contextual Explanation**: Get detailed explanations of selected content with surrounding context
- **🔍 Quick Google Search**: Search selected text directly on Google
- **✍️ Text Improvement**: Enhance and refine text quality
- **❓ Custom Q&A**: Ask specific questions about selected content

### Page-Wide Analysis
- **📄 Full Page Summarization**: Comprehensive page content analysis
- **🔑 Keyword Extraction**: Identify key terms and concepts
- **🌍 Complete Page Translation**: Translate entire web pages
- **✔️ Fact Checking**: Verify information accuracy
- **🧑‍🏫 Educational Mode**: Learn from page content with simplified explanations
- **❓ Q&A Generation**: Convert page content into question-answer format

### Interactive Features
- **💬 AI Chat Sidebar**: Full conversational AI assistant
- **🧠 Floating Action Button (FAB)**: Quick access to AI tools
- **⚙️ Settings Panel**: Easy API key and model configuration
- **🔗 Page Sharing**: Share current page with native or clipboard fallback

### AI Integration
- **Google Gemini API**: Powered by advanced language models
- **Multiple Model Support**: Choose from various Gemini models
- **Secure Storage**: Local API key storage with Chrome's storage API
- **Smart Context**: Maintains conversation history in chat mode

## 🚀 Installation

### From Chrome Web Store
*(Coming soon - currently in development)*

### Manual Installation (Developer Mode)

1. **Download the Extension**
   ```bash
   git clone https://github.com/your-username/AI-Suite-Pro.git
   cd AI-Suite-Pro
   ```

2. **Enable Developer Mode in Chrome**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle "Developer mode" in the top right corner

3. **Load the Extension**
   - Click "Load unpacked"
   - Select the `AI-Suite-Pro` directory
   - The extension should now appear in your extensions list

4. **Configure API Access**
   - Click the extension icon in your browser toolbar
   - Go to Settings (⚙️)
   - Enter your Google Gemini API key
   - Select your preferred model

## 🔧 Development Setup

### Prerequisites
- Google Chrome Browser
- Google Gemini API Key ([Get one here](https://makersuite.google.com/app/apikey))
- Basic knowledge of Chrome Extension development

### Local Development

1. **Clone the Repository**
   ```bash
   git clone https://github.com/your-username/AI-Suite-Pro.git
   cd AI-Suite-Pro
   ```

2. **Load in Developer Mode**
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select the project directory

3. **Development Workflow**
   - Make changes to the source files
   - Click the refresh button on the extension card in `chrome://extensions/`
   - Test changes on any webpage

### File Structure
```
AI-Suite-Pro/
├── manifest.json          # Extension configuration
├── content.js            # Main content script with AI features
├── background.js         # Background service worker
├── styles.css           # Complete UI styling
├── README.md           # This file
└── assets/            # (Optional) Icons and images
```

## 📖 Usage Guide

### Getting Started

1. **Set Up API Key**
   - Click the extension icon or use the FAB button
   - Select "Settings" (⚙️)
   - Enter your Gemini API key (starts with "AIza")
   - Choose your preferred AI model

2. **Text Selection Features**
   - Select any text on a webpage
   - A tooltip will appear with quick action buttons
   - Click any action or "More" for additional options

3. **Chat Assistant**
   - Click the extension icon or 💬 button
   - Start typing in the sidebar that appears
   - Maintain conversations with context history

4. **Page-Wide Operations**
   - Use the floating 🧠 button (bottom-right)
   - Access tools for entire page analysis
   - Perfect for research and content analysis

### Keyboard Shortcuts
- **Escape**: Close any open dialog, tooltip, or chat
- **Enter**: Send message in chat (Shift+Enter for new line)

### Available AI Models
- **Gemini 2.5 Flash**: Fast, efficient for most tasks
- **Gemini 2.5 Pro**: Advanced reasoning and complex tasks  
- **Gemini 2.0 Flash**: Latest model with improved capabilities

## ⚙️ Configuration

### API Key Management
The extension securely stores your API key using Chrome's local storage. Keys are never transmitted except directly to Google's API endpoints.

### Model Selection
Choose the optimal model based on your needs:
- **Flash models**: Faster response times, good for quick tasks
- **Pro models**: Better for complex reasoning and detailed analysis

### Privacy & Security
- All data is processed client-side or directly with Google's API
- No data is stored on external servers
- API keys are stored locally in your browser

## 🛠️ Technical Details

### Architecture
- **Content Script**: Handles all webpage interactions and UI
- **Background Script**: Manages extension lifecycle and messaging
- **Popup**: (Future) Dedicated popup interface
- **Options Page**: (Future) Advanced settings interface

### Dependencies
- Chrome Extension Manifest V3
- Google Gemini API
- No external libraries - pure JavaScript implementation

### Browser Compatibility
- **Chrome**: Fully supported (v88+)
- **Edge**: Compatible with Chromium-based versions
- **Firefox**: Not supported (uses Chrome Extension APIs)

## 🤝 Contributing

We welcome contributions! Here's how to get started:

1. **Fork the Repository**
   ```bash
   git fork https://github.com/your-username/AI-Suite-Pro.git
   ```

2. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make Your Changes**
   - Follow the existing code style
   - Test thoroughly with different websites
   - Ensure no breaking changes

4. **Submit a Pull Request**
   - Describe your changes clearly
   - Include screenshots for UI changes
   - Ensure all features work as expected

### Development Guidelines
- Keep functions modular and well-documented
- Use consistent naming conventions
- Test on various websites and content types
- Maintain Hebrew RTL support for UI elements
- Follow Chrome Extension best practices

## 📋 Roadmap

### Upcoming Features
- **API Key Memory**: Remember keys in settings panel
- **Separate Dialogs**: Independent API and model configuration
- **UI Modes**: Toggle between floating and sidebar layouts
- **Markdown Support**: Convert AI responses to formatted HTML
- **Offline Mode**: Local AI model integration
- **Custom Prompts**: User-defined quick actions
- **Export Features**: Save conversations and analysis

### Future Enhancements
- Support for additional AI providers (OpenAI, Claude, etc.)
- Voice input and output capabilities
- Advanced document analysis (PDF, Word)
- Team collaboration features
- Browser sync across devices

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Troubleshooting

**Extension not working?**
- Verify your API key is correct and active
- Check that the extension has necessary permissions
- Try refreshing the webpage or reloading the extension

**Features not appearing?**
- Ensure you're not on a restricted page (chrome://, file://)
- Check console for any JavaScript errors
- Verify the extension is enabled in Chrome

**API Errors?**
- Confirm your API key has proper permissions
- Check your API quota and usage limits
- Ensure you're using a supported model

### Getting Help
- Create an issue on [GitHub Issues](https://github.com/your-username/AI-Suite-Pro/issues)
- Check existing issues for similar problems
- Provide detailed error information and steps to reproduce

## 📞 Contact

- **GitHub**: [AI-Suite-Pro Repository](https://github.com/your-username/AI-Suite-Pro)
- **Issues**: [Report Bugs or Request Features](https://github.com/your-username/AI-Suite-Pro/issues)
- **Discussions**: [Community Discussion](https://github.com/your-username/AI-Suite-Pro/discussions)

---

## עברית (Hebrew)

### תכונות עיקריות
- **כלי ניתוח טקסט**: סיכום, תרגום והסבר של טקסט נבחר
- **ניתוח דף מלא**: ניתוח כללי של תוכן האתר
- **צ'אט AI**: עוזר שיחה אינטראקטיבי
- **כפתור צף**: גישה מהירה לכלים
- **תמיכה בעברית**: ממשק משתמש בעברית עם RTL

### הגדרה ראשונית
1. התקן את התוסף במצב מפתח
2. הזן מפתח API של Gemini בהגדרות
3. בחר מודל AI מועדף
4. התחל להשתמש בכלים על כל אתר

### שימוש יומיומי
- **בחירת טקסט**: סמן טקסט כלשהו ובחר פעולה מהתפריט
- **ניתוח דף**: השתמש בכפתור הצף לניתוח כללי
- **צ'אט**: פתח את החלונית הצדדית לשיחה עם ה-AI

### שינויים עתידיים
- שמירת מפתח API בחלון ההגדרות
- הפרדת הגדרות API ומודל
- מעבר בין מצבי ממשק שונים
- המרת markdown ל-HTML מעוצב

---

**Made with ❤️ for enhanced web browsing**
