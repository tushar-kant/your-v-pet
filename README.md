# 🐾 Pet Runner - VS Code Extension

A delightful VS Code extension that brings joy to your coding experience by displaying animated pets running across your editor! Watch as cute animals traverse your screen with beautiful animations, sparkles, and customizable effects.

![Pet Runner Demo](https://img.shields.io/badge/VS%20Code-Extension-blue.svg)
![Version](https://img.shields.io/badge/version-1.0.0-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC.svg)

## ✨ Features

### 🎯 Core Features
- **One-Click Pet Animation**: Click the status bar button to instantly run a pet across your screen
- **12+ Built-in Pets**: Cats, dogs, foxes, rabbits, pandas, and more adorable creatures
- **Custom Pet Creation**: Design your own pets with custom emojis and animations
- **Favorite Pet System**: Set a favorite pet to always run, or enjoy random surprises
- **Beautiful Animations**: Smooth running animations with bounce effects and sparkles
- **Customizable Effects**: Toggle sparkles, ground effects, and pet names

### 🎨 Visual Effects
- **Smooth Animations**: Cubic-bezier easing for natural movement
- **Sparkle Trail**: Customizable sparkle effects following your pet
- **Ground Effects**: Dust clouds and movement indicators
- **Background Ambiance**: Floating sparkles in the background
- **Responsive Sizing**: Small, normal, or large pet sizes
- **Name Display**: Show your pet's name during animation

### 🛠️ Management Features
- **Pet Collection Manager**: View all available pets in one place
- **Custom Pet Editor**: Add, edit, and delete your custom creations
- **Settings Integration**: Full VS Code settings integration
- **Quick Actions**: Easy-to-use command palette integration
- **Reset Options**: Restore defaults when needed

## 🚀 Installation

### From VS Code Marketplace
1. Open VS Code
2. Go to Extensions (`Ctrl+Shift+X` / `Cmd+Shift+X`)
3. Search for "Pet Runner"
4. Click Install

### From Source
1. Clone this repository
2. Run `npm install`
3. Run `npm run compile`
4. Press `F5` to open a new Extension Development Host window

## 📖 Usage Guide

### Basic Usage
1. **Run a Pet**: Click the 🐾 Pet button in the status bar
2. **Manage Pets**: Use `Ctrl+Shift+P` → "Pet Runner: Manage Pets"
3. **Settings**: Access via `Ctrl+Shift+P` → "Preferences: Open Settings" → Search "Pet Runner"

### Setting a Favorite Pet
1. Click the status bar button or run "Manage Pets"
2. Select "Set Favorite Pet"
3. Choose from built-in pets, custom pets, or create a custom emoji pet
4. Your favorite will now always run when clicking the button

### Creating Custom Pets
1. Open Pet Management (`Ctrl+Shift+P` → "Pet Runner: Manage Pets")
2. Select "Add Custom Pet"
3. Enter pet name (e.g., "Dragon")
4. Choose main emoji (e.g., "🐉")
5. Define animation frames (e.g., "🐉 🔥 💨")

## ⚙️ Configuration Options

### Settings Available in VS Code Settings

```json
{
  // Your favorite pet emoji (empty = random pets)
  "petRunner.favoritePet": "",
  
  // Name of your favorite pet
  "petRunner.favoritePetName": "",
  
  // Collection to use: "built-in", "custom", or "mixed"
  "petRunner.petCollection": "mixed",
  
  // Animation duration in milliseconds
  "petRunner.animationSpeed": 5000,
  
  // Show sparkle effects
  "petRunner.showSparkles": true,
  
  // Show pet name during animation
  "petRunner.showPetName": true,
  
  // Pet size: "small", "normal", "large"
  "petRunner.petSize": "normal",
  
  // Custom sparkle emojis
  "petRunner.customSparkles": ["✨", "⭐", "💫", "🌟", "💖", "🎀"],
  
  // Your custom pets collection
  "petRunner.customPets": [
    {
      "name": "Dragon",
      "emoji": "🐉",
      "walkFrames": ["🐉", "🔥", "💨"]
    }
  ]
}
```

### Built-in Pet Collection
- 🐱 **Cat** - Classic feline with paw prints
- 🐶 **Dog** - Loyal companion with running animation
- 🦊 **Fox** - Clever orange friend
- 🐰 **Rabbit** - Hopping bunny adventure
- 🐸 **Frog** - Green pond hopper
- 🐨 **Koala** - Eucalyptus leaf lover
- 🐼 **Panda** - Bamboo enthusiast
- 🦝 **Raccoon** - Midnight wanderer
- 🐻 **Bear** - Honey-seeking giant
- 🐺 **Wolf** - Moonlit pack leader
- 🐅 **Tiger** - Striped jungle runner
- 🦁 **Lion** - Crowned king of beasts

## 🎮 Commands

| Command | Description |
|---------|-------------|
| `Pet Runner: Run Pet` | Trigger pet animation |
| `Pet Runner: Manage Pets` | Open pet management interface |

## 🔧 Development Setup

### Prerequisites
- Node.js 18+
- VS Code 1.74.0+
- TypeScript 4.9+

### Development Commands
```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch mode for development
npm run watch

# Run tests
npm run test

# Package extension
npm run package

# Lint code
npm run lint
```

### Project Structure
```
pet-runner/
├── src/
│   └── extension.ts          # Main extension code
├── media/
│   └── icon.png             # Extension icon
├── package.json             # Extension manifest
├── tsconfig.json           # TypeScript configuration
└── README.md               # This file
```

## 🎨 Customization Examples

### Custom Pet Examples
```typescript
// Mystical creatures
{
  "name": "Phoenix",
  "emoji": "🔥",
  "walkFrames": ["🔥", "🧡", "✨", "💫"]
}

// Tech pets
{
  "name": "Bot",
  "emoji": "🤖", 
  "walkFrames": ["🤖", "⚡", "🔧", "💻"]
}

// Food pets
{
  "name": "Taco",
  "emoji": "🌮",
  "walkFrames": ["🌮", "🌶️", "😋"]
}
```

### Custom Sparkle Sets
```json
// Romantic theme
"petRunner.customSparkles": ["💖", "💕", "💗", "💝", "🌹"]

// Nature theme  
"petRunner.customSparkles": ["🌿", "🍃", "🌸", "🌺", "🦋"]

// Space theme
"petRunner.customSparkles": ["⭐", "🌟", "✨", "🚀", "🌙"]
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Reporting Issues
1. Check existing issues first
2. Use the issue template
3. Provide clear reproduction steps
4. Include your VS Code version and OS

### Pull Requests
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests if applicable
5. Run `npm run lint` and `npm run compile`
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Use meaningful commit messages
- Update documentation for new features
- Test your changes thoroughly
- Maintain backward compatibility

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- VS Code Extension API documentation and samples
- The amazing VS Code community
- All the emoji artists who make these pets possible
- Contributors and users who provide feedback

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-username/pet-runner/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-username/pet-runner/discussions)
- **Email**: taskrush@gmail.com

## 🔮 Roadmap

### Upcoming Features
- [ ] Pet personality traits and behaviors
- [ ] Seasonal pet themes and decorations  
- [ ] Multi-pet racing animations
- [ ] Pet care and feeding system
- [ ] Integration with productivity metrics
- [ ] Sound effects and music options
- [ ] Pet breeding and evolution system
- [ ] Community pet sharing platform

### Performance Improvements
- [ ] Optimized animation rendering
- [ ] Reduced memory footprint
- [ ] Better error handling and recovery
- [ ] Extension startup time optimization

---

**Made with ❤️ for the VS Code community**

*Bring joy to your coding journey, one pet at a time!* 🐾✨