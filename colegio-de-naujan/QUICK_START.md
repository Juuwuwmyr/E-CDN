# Quick Start Guide - Colegio De Naujan Website

## 🚀 How to Run the Website

### Option 1: Start Development Server

```bash
cd colegio-de-naujan
npm run dev
```

Then open your browser to: **http://localhost:5173**

### Option 2: Build for Production

```bash
cd colegio-de-naujan
npm run build
npm run preview
```

## 📋 What's Included

### ✅ Complete Website Sections

1. **Header Navigation**
   - Fixed header with school logo
   - Mobile-responsive menu
   - Smooth scroll navigation

2. **Hero Section**
   - Auto-playing image slider (3 slides)
   - Animated content
   - Call-to-action buttons

3. **Programs Section**
   - 6 academic program cards
   - Statistics showcase
   - Hover animations

4. **News & Events**
   - 6 news article cards
   - Category badges
   - Image zoom effects

5. **Footer**
   - Contact information
   - Quick links
   - Newsletter subscription
   - Social media links

### 🎨 Color Theme

- **Blue** (#0047AB): Primary color for headers and main elements
- **Red** (#DC143C): Accent color for CTAs and highlights
- **Gold** (#FFD700): Awards, badges, and special elements
- **White** (#FFFFFF): Clean background

### ✨ Animations Included

- **Fade In**: Content appears smoothly
- **Slide In**: Elements slide from left/right
- **Scale In**: Cards and buttons pop in
- **Zoom**: Images scale on hover
- **Float**: Scroll indicator animation
- **Pulse**: Category badges pulse effect
- **Hover Lift**: Cards lift on hover

## 📱 Responsive Design

- ✅ Desktop (1200px+)
- ✅ Tablet (768px - 1199px)
- ✅ Mobile (Below 768px)

## 🔧 Customization Tips

### Change School Information

Edit `src/components/Header/Header.jsx`:
```jsx
<h1 className="school-name">Your School Name</h1>
<p className="school-tagline">Your Tagline</p>
```

### Update Hero Images

Edit `src/components/Hero/Hero.jsx` and replace image URLs in the `slides` array.

### Modify Colors

Edit `src/styles/variables.css` and change the color values.

### Add More News/Programs

Edit the respective component files:
- Programs: `src/components/Programs/Programs.jsx`
- News: `src/components/News/News.jsx`

## 📂 Project Structure

```
src/
├── components/          # All React components
│   ├── Header/
│   ├── Hero/
│   ├── Programs/
│   ├── News/
│   └── Footer/
├── styles/              # Global styles
│   ├── variables.css    # Color theme & variables
│   └── animations.css   # Animation keyframes
├── assets/              # Images and media
├── App.jsx              # Main app component
└── index.css            # Global CSS reset & base styles
```

## 🎯 Next Steps

1. **Replace Sample Images**: Add your own school photos
2. **Update Content**: Modify text in each component
3. **Add School Logo**: Replace CDN logo with actual logo
4. **Connect Forms**: Add backend for newsletter/contact forms
5. **Deploy**: Build and deploy to your hosting service

## 💡 Tips

- All images use Unsplash URLs as placeholders
- Replace with your actual school images
- Mobile menu automatically appears on small screens
- Smooth scrolling is enabled by default
- All animations are CSS-based (no JavaScript libraries)

## 🆘 Need Help?

Check the main README.md for detailed documentation.

---

**Happy Customizing! 🎉**
