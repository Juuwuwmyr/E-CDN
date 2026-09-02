# Colegio De Naujan Website

A modern, responsive website for Colegio De Naujan built with React and Vite. Features a clean government-style UI with blue, red, gold, and white color theme.

## 🎨 Features

- **Modern Design**: Government-inspired professional UI
- **Responsive Layout**: Works perfectly on all devices
- **Smooth Animations**: Engaging CSS animations throughout
- **Color Theme**: Blue, Red, Gold, and White color palette
- **Component-Based**: Clean, modular React components
- **Fast Performance**: Built with Vite for optimal speed

## 📁 Project Structure

```
colegio-de-naujan/
├── src/
│   ├── components/
│   │   ├── Header/        # Navigation header (JSX only)
│   │   ├── Hero/          # Hero section (JSX only)
│   │   ├── About/         # About/Features section (JSX only)
│   │   ├── Programs/      # Academic programs (JSX only)
│   │   ├── News/          # News and events (JSX only)
│   │   └── Footer/        # Footer (JSX only)
│   ├── styles/            # All CSS files centralized here
│   │   ├── variables.css  # CSS color and design variables
│   │   ├── animations.css # Reusable animation keyframes
│   │   ├── Header.css     # Header styles
│   │   ├── Hero.css       # Hero styles
│   │   ├── About.css      # About section styles
│   │   ├── Programs.css   # Programs styles
│   │   ├── News.css       # News styles
│   │   ├── Footer.css     # Footer styles
│   │   └── App.css        # App-level styles
│   ├── assets/
│   │   └── images/        # Image assets
│   ├── App.jsx            # Main application component
│   ├── index.css          # Global styles
│   └── main.jsx           # Application entry point
├── public/                # Static assets
└── index.html             # HTML template
```

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Navigate to the project directory:
```bash
cd colegio-de-naujan
```

2. Install dependencies (already done):
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and visit:
```
http://localhost:5173
```

## 🛠️ Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run Oxlint

## 🎨 Color Theme

- **Primary Blue**: `#0047AB` - Headers, primary elements
- **Primary Red**: `#DC143C` - Accents, call-to-action
- **Primary Gold**: `#FFD700` - Highlights, awards
- **White**: `#FFFFFF` - Background, text on colored backgrounds

## 📱 Responsive Breakpoints

- **Desktop**: 1200px and above
- **Tablet**: 768px - 1199px
- **Mobile**: Below 768px

## ✨ Animation Features

- Fade in animations for content sections
- Slide in animations for navigation items
- Scale animations for cards and buttons
- Hover effects with lift and zoom
- Smooth transitions throughout

## 📄 Sections

1. **Header**: Fixed navigation with school logo and menu
2. **Hero**: Full-screen slider with call-to-action buttons
3. **About**: Problem/Solution showcase with feature cards (eGovPH-inspired)
4. **Programs**: Grid showcase of academic programs with statistics
5. **News**: Latest news and events cards
6. **Footer**: Contact information and social links

## 🔧 Customization

### Adding New Images

Place images in `src/assets/images/` and import them in your components.

### Modifying Colors

Edit color variables in `src/styles/variables.css`:
```css
:root {
  --primary-blue: #0047AB;
  --primary-red: #DC143C;
  --primary-gold: #FFD700;
  /* ... */
}
```

### Adding New Animations

Add new keyframes in `src/styles/animations.css` and apply with classes or inline styles.

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📞 Contact

For questions or support regarding Colegio De Naujan:

- Address: Naujan, Oriental Mindoro, Philippines
- Phone: +63 (123) 456-7890
- Email: info@colegiodenaujan.edu.ph

## 📝 License

© 2026 Colegio De Naujan. All rights reserved.

---

Built with ❤️ using React + Vite
