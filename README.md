# Eco-Focus 🌲

A minimalist Pomodoro timer with ambient nature sounds to help you focus and relax. Inspired by Noisli, this web app combines productivity tracking with customizable soundscapes and a fun break-time reward game!

### 🚀 [Live Demo](https://zhongdian.netlify.app/)

## ✨ Features

- **Pomodoro Timer**: Customizable work and break sessions (5-60 minutes)
- **Ambient Soundscapes**: Mix and match forest, rain, birds, ocean waves, and brown noise
- **Volume Control**: Individual volume sliders for each sound
- **Auto Fade-Out**: Sounds gradually fade when timer completes
- **Productivity Dashboard**: Real-time Date, Time, and Location display
- **Breathing Exercise**: Guided visualization for stress relief (5s-3s-5s cycle)
- **Break Game**: Unlock a Space Invaders-style game during break time! 👾
- **Persistent Settings**: Your timer preferences are saved automatically
- **Tab Timer Display**: See countdown in browser tab when timer is running
- **Responsive Design**: Optimized for Laptop, Tablet, and Mobile devices
- **Sticky Notes**: Create colorful, draggable reminders directly on your workspace 📝
- **No Installation Required**: Pure HTML/CSS/JavaScript - just open and use

## 🚀 Getting Started

### Quick Start
1. Clone this repository:
```bash
   git clone https://github.com/yourusername/Noisli-Clone.git
```
2. Navigate to the project folder:
```bash
   cd Noisli-Clone
```
3. Open `index.html` in your web browser

That's it! No build process or dependencies needed.

### File Structure
```
Noisli-Clone/
├── index.html          # Main HTML structure
├── style.css           # Styling and layout
├── script.js           # Application logic
└── sounds/             # Audio files
    ├── bird_sounds.mp3
    ├── brown_noise.mp3
    ├── forest_sounds.mp3
    ├── rain_sounds.mp3
    └── wave_sounds.mp3
```

## 🎯 How to Use

### Focus Timer
1. **Set Your Timer**: Adjust work and break durations (Work: 5-60 minutes, Break: 1-60 minutes)
2. **Choose Your Sounds**: Click on any sound card to toggle it on/off
3. **Adjust Volume**: Use the sliders when a sound is active
4. **Start Focus Session**: Click "Start" to begin your Pomodoro session
5. **Switch Modes**: Toggle between Work and Break modes as needed

### Break Game 🎮
When you enter **Break Mode**, the game becomes unlocked!

**How to Play:**
- **Desktop**: Use Arrow Keys (← →) to move, SPACEBAR to fire
- **Mobile**: Use on-screen touch controls (Left/Right Arrows, Fire Button)
- **Objective**: Destroy all enemy ships before they reach you!

**Game Features:**
- Enemies move in formation with wave patterns
- Watch out for **diving enemies** (purple) that chase you!
- Difficulty increases as your score goes up
- Game automatically locks when you return to work mode

### Breathing Mode 🧘
Unlock the **Breathe** tab during breaks for a guided relaxation session.
- **Visual Guide**: Follow the circle as it expands and contracts.
- **Cycle**: 
  - **Inhale**: 5 Seconds ↗️
  - **Hold**: 3 Seconds ⏸️
  - **Exhale**: 5 Seconds ↘️

### Sticky Notes 📝
Keep track of tasks without leaving your flow.
1. **Create Note**: Click the **+ NOTE** button and select a color (Yellow, Green, Lime, Pink, Blue).
2. **Edit**: Click anywhere on the note to type your tasks.
3. **Move**: Drag the note using the top handle to position it anywhere.
4. **Delete**: Click the **X** in the corner to remove a note.
*Notes are automatically saved to your browser!*

## 🎨 Sound Profiles

- 🌲 **Forest** - Gentle wind through trees
- 🌧️ **Rain** - Soft rainfall ambience
- 🦜 **Birds** - Morning birdsong
- 🌊 **Ocean** - Calming waves
- 📻 **Brown Noise** - Deep static for concentration

Mix multiple sounds together to create your perfect productivity atmosphere!

## 🛠️ Customization

You can easily customize:
- Background image (line 18 in `style.css`)
- Color scheme (CSS variables in `style.css`)
- Sound files (replace MP3s in the `sounds/` folder)
- Timer constraints (change min/max values in the input fields)
- Game difficulty (adjust `baseSpeed` and enemy spawn rates in the JavaScript)

## 💡 Tips for Best Results

- Use the **Work/Break cycle** to maintain focus and avoid burnout
- Experiment with **sound combinations** to find what helps you concentrate
- The **break game** is designed to be a quick mental reset - don't skip your breaks!
- Your timer settings are **saved automatically** and will persist between sessions

## 📝 License

This project is open source and available under the [MIT License](https://opensource.org/licenses/MIT).

## 🙏 Acknowledgments

- Inspired by [Noisli](https://www.noisli.com/)
- Background image from [Unsplash](https://unsplash.com/)
- Break game mechanics inspired by classic Space Invaders
- Sound files sourced from Youtube public domain

## 🐛 Known Issues

- Audio may not autoplay on some mobile browsers due to browser autoplay policies
- First click interaction may be required to enable audio playback
- Game controls work best on desktop/laptop keyboards

## 🤝 Contributing

Feel free to fork this project and submit pull requests for any improvements!

**Ideas for future enhancements:**
- Additional game levels or game modes
- More ambient sound options
- Statistics tracking (total focus time, completed sessions)

---

Made with 🎧 for focused productivity and 👾 for guilt-free breaks