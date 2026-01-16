# Winner Dinner 🍽️❤️

A couples' restaurant picker app that helps you and your partner agree on where to eat dinner. Swipe independently on restaurants, and get matched when you both like the same place!

## Features

- 🔄 **Real-time syncing** between devices using Firebase
- 📱 **Mobile-friendly** design - works great on phones
- 💑 **Separate voting** - each person votes independently without seeing the other's choices
- ✨ **Instant matches** - see which restaurants you both like
- 🔒 **Session-based** - share a simple code to connect with your partner
- 💾 **Persistent storage** - your restaurant list and votes are saved

## How to Use

### For You and Your Partner:

1. **One person creates a session:**
   - Enter your name
   - Click "Create New Session"
   - Share the session code with your partner

2. **Your partner joins:**
   - Enter their name
   - Enter the session code you shared
   - Click "Join Session"

3. **Add restaurants:**
   - Both of you can add your favorite local restaurants to the list
   - Type the name and click the + button

4. **Vote independently:**
   - Swipe through the restaurants
   - Click ❤️ (Like) or ✕ (Pass) for each one
   - Your partner can't see your votes!

5. **See your matches:**
   - When you both like the same restaurant, it appears in the green "You Matched!" box
   - That's where you're going to dinner! 🎉

## Live Demo

Visit: `https://samiprehn.github.io/winner_dinner`

## Technology Stack

- **React** - UI framework
- **Firebase Realtime Database** - Real-time data syncing
- **Tailwind CSS** - Styling
- **GitHub Pages** - Hosting

## Setup

This app is ready to use! Just visit the live URL above.

If you want to run it locally or modify it:

1. Clone this repository
2. Open `index.html` in any modern web browser
3. That's it! No build process needed.

## Firebase Configuration

The app uses Firebase Realtime Database for syncing votes between devices. The Firebase configuration is already set up and included in the HTML file.

## Privacy

- Session data is stored in Firebase with a random session code
- Only people with your session code can see your restaurant list
- Votes are associated with names you enter (not accounts)
- No personal information is collected

## Contributing

This is a personal project, but feel free to fork it and make your own version!

## License

MIT License - Feel free to use this however you want!

---

Made with ❤️ to solve the eternal question: "Where should we eat?"
