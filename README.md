# Ray Games 🎮

Welcome to **Ray Games**! This is a simple, modern, and beautiful gaming portfolio site built to showcase Scratch games to friends and family.

It's designed to be lightweight, responsive, and easy to edit.

---

## 🎨 How to Customize the Design

The website theme colors are defined in `style.css` using CSS Variables. You and Ray can easily change these colors to give the website a brand-new look!

1. Open [style.css](file:///c:/Users/meicw/dev/ray_games/style.css) in your editor.
2. Find the `:root` block at the top of the file:
   ```css
   :root {
     --bg-dark: #0b0f19;       /* Deep dark background color */
     --card-bg: rgba(17, 24, 39, 0.6); /* Translucent card background */
     --text-light: #f3f4f6;    /* Main text color */
     --text-gray: #9ca3af;     /* Subtext color */
     --primary: #8b5cf6;       /* Main branding color (Default: purple) */
     --primary-glow: rgba(139, 92, 246, 0.4);
     --secondary: #ec4899;     /* Secondary accents (Default: pink) */
     --secondary-glow: rgba(236, 72, 153, 0.4);
   }
   ```
3. Change the hex color codes to your favorite colors (for example, green `#10b981` or cyan `#06b6d4`) and save the file!

---

## 🕹️ How to Add a New Game

Adding a new game is super easy. You will need to edit [index.html](file:///c:/Users/meicw/dev/ray_games/index.html).

### Step 1: Get the Scratch Project ID
1. Go to your game on the Scratch website.
2. Look at the web address (URL) in your browser. It looks like this:
   `https://scratch.mit.edu/projects/123456789/`
3. The long number (in this case `123456789`) is your **Project ID**. Copy this number!

### Step 2: Add a Game Slot in `index.html`
1. Open [index.html](file:///c:/Users/meicw/dev/ray_games/index.html) in your editor.
2. Locate the game cards grid (`<div class="games-grid">`).
3. Copy one of the existing `<div class="game-card">` blocks and paste it inside the grid.
4. Update the information:
   - Change `data-scratch-id="123456789"` to your copied Project ID.
   - Update the game title inside `<h3>`.
   - Update the description inside `<p>`.
   - Update the tag badges (like `Arcade`, `Platformer`, `Puzzle`, etc.).
   - Set a nice thumbnail image or keep the default.

---

## 🌐 Deploying to Cloudflare Pages

Since this is a standard static website, hosting it on Cloudflare Pages is completely free and takes less than a minute to set up:

1. Push your code to a Git repository (like GitHub or GitLab).
2. Log into your [Cloudflare Dashboard](https://dash.cloudflare.com/).
3. Go to **Workers & Pages** -> **Create application** -> **Pages** tab.
4. Click **Connect to Git** and select your repository.
5. In the Build settings:
   - **Framework preset**: None (Static HTML/CSS)
   - **Build command**: (Leave blank)
   - **Build output directory**: (Leave blank or enter `/`)
6. Click **Save and Deploy**.
7. Once deployed, add your custom domain under the **Custom domains** tab in Cloudflare Pages. Cloudflare will automatically handle the SSL certificate!
