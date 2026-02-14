# Winner Dinner 🍽️❤️

A group restaurant picker app that helps you and your friends (or partner) agree on where to eat dinner. Everyone votes independently on restaurants, and get matched when everyone likes the same place!

## Features

- 🔄 **Real-time syncing** between devices using Firebase
- 📱 **Mobile-friendly** design - works great on phones in a browser
- 👆 **Swipe to vote** - swipe right to like, left to pass (or use buttons)
- 👥 **Unlimited users** - works for couples or groups of friends
- 💑 **Independent voting** - each person votes without seeing others' choices
- 📊 **Vote tracking** - see how many people have voted on each restaurant
- ✨ **Instant matches** - see which restaurants everyone agrees on
- 🔒 **Session-based** - share a code one time to connect with your group
- 💾 **Persistent storage** - your groups, restaurant lists and votes are saved
- 🗺️ **Google Maps links** - tap any restaurant name to view it on Google Maps

## How to Use

### Setting Up a Session:

1. **One person creates a session:**
   - Click "Create New Dinner Party"
   - Click copy button next to session code
   - Share the session code with your group (probably via text)

2. **Everyone else joins:**
   - Enter the session code
   - Click "Join"

3. **Add restaurants:**
   - Anyone in the group can add restaurants using three modes:
   - **Manual**: Type the name and click the + button
   - **Nearby**: Browse the 20 closest restaurants to your current location
   - **Search**: Enter a restaurant name, cuisine type, or keyword (ex: wings), optionally with a zip code or city/state
   - Check the boxes next to each restaurant you would like to add
   - Click "add n restaurants" where n is the number of boxes you checked

4. **Vote independently:**
   - Each person votes on the restaurants
   - Swipe right to like, left to pass (or use the buttons)
   - Tap a restaurant name to view it on Google Maps
   - Nobody can see your votes until everyone's done!

5. **See your matches:**
   - When EVERYONE in the group likes the same restaurant, it appears in a green "Everyone Agrees!" box at the top
   - That's where you're going to dinner! 🎉

### Group Features:

- **Active voter list** - See who's currently in your session
- **Vote progress** - See how many people have liked/passed each restaurant (e.g., "❤️ 3 liked • ✕ 1 passed • ⏳ 2 pending")
- **Unanimous matches** - Only shows restaurants where 100% of voters agree
- **No size limit** - Works for 2 people or 20+

## Perfect For:

- 💑 Couples deciding on date night
- 👥 Groups of friends picking a spot
- 🍕 Team lunches
- 👨‍👩‍👧‍👦 Family dinner decisions
- 🎉 Double dates or group outings

## Live Demo

Visit: `https://samiprehn.github.io/winner_dinner`

## Technology Stack

- **React** - UI framework
- **Firebase Auth & Realtime Database** - Authentication and real-time data syncing
- **Cloudflare Worker** - Server interacting with Google Places API
- **Tailwind CSS** - Styling
- **GitHub Pages** - Hosting

## Project Structure

- `index.html` - Landing page with Google sign-in
- `app.html` - Main application (sessions, voting, restaurant search)

## Setup

This app is ready to use! Just visit the live URL above.

If you want to run it locally or modify it:

1. Clone this repository
2. Open `index.html` in any modern web browser
3. Sign in with Google to access the app
4. That's it! No build process needed.

## Privacy

- Session data is stored in Firebase with a random session code
- Only people with your session code can see your restaurant list
- Google sign-in is used for authentication (name and profile photo are visible to session members)
- Sessions persist so you can reuse them with the same group

## Tips

- **Reuse sessions**: Click "vote again" to reset votes and use the same list of restaurants another day

## Contributing

This is a personal project, but feel free to fork it and make your own version!

## License

MIT License - Feel free to use this however you want!

---

Made with ❤️ to solve the eternal question: "Where should we eat?"
