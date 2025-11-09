# FreeChat - Dual AI Interface

A lightweight web application for chatting with two AI models simultaneously and comparing their responses side-by-side.

Link 
```bash 
https://devregan.github.io/DualChatAI/ 
```

## Features

- Chat with two different AI models at once
- Dynamic model toggling during conversations
- Multiple theme options (Modern Dark, Classic Dark, Light)
- Local storage for chat history
- Token usage tracking
- Smart response selection
- Responsive design for all devices

## Quick Start

1. Clone the repository
   ```bash
    git clone https://github.com/devRegan/DualChatAI.git
   ```

2. Open `index.html` in your browser

3. Configure your API keys in Settings

4. Start chatting

## Configuration

### API Keys Setup

1. Click Settings button in sidebar
2. Enter API keys for AI Model V1 and V2
3. (Optional) Add custom API URLs if your provider requires it
4. Save settings

### Supported API Format

FreeChat works with any OpenAI-compatible API. Default configuration uses Groq API format.

## Usage

### Basic Chat
- Type your message and press Enter
- Both active models will respond simultaneously
- View responses side-by-side

### Model Selection
- Click "Choose" button under preferred response
- Unchosen model automatically deactivates
- Continue conversation with selected model only

### Dynamic Control
- Use toggle buttons in header to activate/deactivate models
- Green indicator = Active
- Red indicator = Inactive

## File Structure

```
freechat/
├── index.html          # Main HTML file
├── style.css           # Stylesheet
├── script.js           # Application logic
├── .env               # Environment variables (not tracked)
├── .gitignore         # Git ignore rules
└── icons/             # UI icons
    ├── AI.png
    ├── User.png
    ├── Side-Bar.png
    └── ...
```

## Environment Variables

Create a `.env` file (optional, can configure in UI):

```env
AI_MODEL_V1_API_KEY=your_api_key_here
AI_MODEL_V1_API_URL=https://api.example.com/v1/chat/completions

AI_MODEL_V2_API_KEY=your_api_key_here
AI_MODEL_V2_API_URL=https://api.example.com/v1/chat/completions
```

Note: API URLs are optional. If your provider only needs an API key, leave URLs empty.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Local Storage

All data is stored locally in your browser:
- Chat conversations
- API keys and settings
- Token usage statistics
- Theme preferences

## Privacy

- No data sent to external servers except your configured AI APIs
- All chat history stored locally in browser
- API keys encrypted in browser storage

## License

MIT License - See LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.

<!-- ## Credits

Developed by [Regan] -->