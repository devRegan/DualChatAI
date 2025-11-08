# FreeChat - Dual AI Chat Interface

A modern, feature-rich chat application that allows you to interact with multiple AI models simultaneously and compare their responses.

## Features

### 🤖 Dual AI Model Support
- **Model 1**: Groq (Llama 3.1) - Fast and efficient responses
- **Model 2**: Google Gemini Pro - Advanced reasoning capabilities
- Enable/disable models independently
- Compare responses side-by-side
- Choose the best response or continue with both

### 🎨 Multiple Themes
- **Modern Dark** (Default) - Sleek blue-tinted dark theme
- **Classic Dark** - Pure black interface
- **Light Mode** - Clean white interface

### 💬 Chat Management
- Create unlimited conversations
- Rename and organize chats
- Save conversations as JSON
- Delete unwanted chats
- Persistent chat history

### 📊 Token Tracking
- Monitor current chat token usage
- Track daily total tokens
- Automatic daily reset

### ⚙️ Settings Panel
- Configure API keys securely
- Toggle models on/off
- Switch themes instantly
- Clean and intuitive interface

### 🎯 User Experience
- Collapsible sidebar
- Auto-resizing text input
- Smooth animations
- Responsive design
- No borders - clean interface

## Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/freechat.git
cd freechat
```

2. **Set up environment variables**
```bash
cp .env .env.local
```

3. **Configure your API keys**

Edit `.env.local` and add your API keys:
```env
GROQ_API_KEY=your_groq_api_key_here
GEMINI_API_KEY=your_gemini_api_key_here
```

**Getting API Keys:**
- **Groq API**: Visit [console.groq.com](https://console.groq.com) and create an account
- **Gemini API**: Visit [makersuite.google.com](https://makersuite.google.com/app/apikey) and generate a key

4. **Open the application**

Simply open `index.html` in your web browser. No build process required!
```bash
# Using Python
python -m http.server 8000

# Or using Node.js
npx serve

# Then visit http://localhost:8000
```

## Usage

### First Time Setup

1. Click the **Settings** button in the sidebar
2. Enter your API keys for Model 1 and Model 2
3. Enable/disable the models you want to use
4. Select your preferred theme
5. Click **Save Settings**

### Starting a Conversation

1. Click **New Chat** to start a fresh conversation
2. Type your message in the input field
3. Press **Enter** or click the send button
4. Watch both AI models respond simultaneously (if both are enabled)

### Comparing Responses

When both models are enabled:
1. Both responses appear side-by-side
2. Read and compare the answers
3. Click **✓ Choose** on the response you prefer
4. The other response will hide automatically
5. Continue the conversation with your selected model

### Managing Chats

- **Rename**: Click the rename button in the sidebar
- **Save**: Export chat as JSON file
- **Delete**: Remove unwanted conversations
- **Switch**: Click any chat in the list to load it

### Keyboard Shortcuts

- `Enter` - Send message
- `Shift + Enter` - New line in message

## Project Structure
```
freechat/
├── index.html          # Main HTML structure
├── style.css           # All styles and themes
├── script.js           # Application logic
├── .env                # Environment template (not committed)
├── .env.local          # Your local config (not committed)
├── .gitignore          # Git ignore rules
├── README.md           # This file
└── icons/              # Icon assets
    ├── AI.png
    ├── User.png
    ├── Rename-Chat.png
    ├── Save-Chat.png
    ├── Side-Bar.png
    └── Token.png
```

## Configuration

### API Endpoints

The application uses these API endpoints:

- **Groq**: `https://api.groq.com/openai/v1/chat/completions`
- **Gemini**: `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent`

### Storage

All data is stored in browser's `localStorage`:
- `chats` - Conversation history
- `settings` - User preferences and API keys
- `tokenUsage` - Token consumption tracking
- `theme` - Selected theme
- `sidebarCollapsed` - Sidebar state

## Security Notes

⚠️ **Important Security Information**

1. **Never commit `.env` or `.env.local`** - These files contain sensitive API keys
2. **API keys are stored in localStorage** - Only use on trusted devices
3. **Clear browser data** - Remember to clear localStorage when using shared computers
4. **Keep keys private** - Never share your API keys with others
5. **Rotate keys regularly** - Update your API keys periodically for security

## Browser Compatibility

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Opera 76+

## Features Roadmap

- [ ] Export/Import chat history
- [ ] Search within conversations
- [ ] Custom model parameters (temperature, max tokens)
- [ ] More AI model integrations
- [ ] Markdown rendering in responses
- [ ] Code syntax highlighting
- [ ] Voice input support
- [ ] Mobile app version

## Troubleshooting

### API Key Issues
- Verify your API keys are correct
- Check if keys have proper permissions
- Ensure no extra spaces in the keys

### Models Not Responding
- Check your internet connection
- Verify API keys are saved in Settings
- Make sure models are enabled in Settings
- Check browser console for error messages

### Chat History Lost
- Ensure localStorage is enabled in your browser
- Don't use incognito/private mode for persistent history
- Check if browser data was cleared

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is open source and available under the [MIT License](LICENSE).

## Acknowledgments

- Groq for providing fast LLM inference
- Google for Gemini Pro API
- Icons from your custom icon set
- Inspired by modern chat interfaces

## Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/freechat/issues) page
2. Create a new issue with detailed information
3. Include browser version and error messages

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Dual AI model support
- Multiple themes (Modern, Dark, Light)
- Chat management system
- Token usage tracking
- Settings panel
- Sidebar navigation

---

**Made with ❤️ for AI enthusiasts**

Happy Chatting! 🚀