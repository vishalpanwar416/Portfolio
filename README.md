# Vishal Panwar - Personal Portfolio

A modern, responsive personal portfolio website built with React and Tailwind CSS, showcasing my skills, projects, and experience as a Full-Stack Developer, AI & Cloud Engineer, and Flutter Enthusiast.

## 🚀 Features

- **Responsive Design**: Fully responsive across all devices (mobile, tablet, desktop)
- **Modern UI/UX**: Clean, elegant design with smooth animations and transitions
- **Interactive Components**: Hover effects, smooth scrolling, and engaging user experience
- **Professional Sections**: Hero, About, Skills, Portfolio, Contact, and Footer
- **SEO Optimized**: Semantic HTML structure and meta tags
- **Performance**: Optimized images and lazy loading

## 🛠️ Tech Stack

- **Frontend**: React 19, Tailwind CSS
- **Icons**: Lucide React
- **Routing**: React Router DOM
- **Build Tool**: Create React App
- **Styling**: Tailwind CSS with custom components

## 📱 Sections

### Hero Section
- Professional introduction with typing effect
- Call-to-action buttons
- Social media links
- Professional photo with diagonal background split

### About Section
- Professional summary
- Work experience at Cognizant
- Educational background
- Certifications (Azure Data Scientist Associate, HackMol 4.0)

### Skills Section
- Programming Languages (Python, Java, JavaScript, TypeScript, Dart)
- Frontend Development (React, Next.js, Flutter, Tailwind CSS)
- Backend Development (Node.js, Express, Django)
- Databases (MySQL, PostgreSQL, MongoDB, Redis, Firebase)
- Cloud & DevOps (AWS, Azure, Docker, Kubernetes, Terraform)
- Additional expertise in ML, AI, and data science

### Portfolio Section
- **Table Tap**: Food ordering platform with AI features
- **PG Flow**: PG management tool built with Flutter
- **Smart Parking System**: YOLOv8-powered parking detection
- **AI/ML Projects**: Comprehensive AI/ML solutions

### Contact Section
- Contact form
- Professional contact information
- Social media links
- Availability status

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/vishalpanwar416/portfolio.git
cd portfolio
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## 🎨 Customization

### Colors
The portfolio uses a consistent color scheme defined in Tailwind CSS:
- Primary: Blue (`blue-600`)
- Secondary: Gray (`gray-800`, `gray-900`)
- Accent: Various shades for different sections

### Typography
- Headings: Large, bold fonts for impact
- Body text: Readable, medium-weight fonts
- Consistent spacing and hierarchy

### Images
Replace placeholder images in the `public/` folder:
- `placeholder-user.jpg` - Your professional photo
- `placeholder.jpg` - Project images

## 📱 Responsive Design

The portfolio is fully responsive with breakpoints:
- **Mobile**: < 768px
- **Tablet**: 768px - 1024px
- **Desktop**: > 1024px

## 🚀 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) and sign up
3. Import your GitHub repository
4. Vercel will automatically detect it's a React app
5. Click deploy

### Deploy to GitHub Pages

1. Install gh-pages:
```bash
npm install --save-dev gh-pages
```

2. Add to package.json:
```json
{
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  },
  "homepage": "https://yourusername.github.io/portfolio"
}
```

3. Deploy:
```bash
npm run deploy
```

### Deploy to Netlify

1. Push your code to GitHub
2. Go to [netlify.com](https://netlify.com) and sign up
3. Click "New site from Git"
4. Choose your repository
5. Build command: `npm run build`
6. Publish directory: `build`
7. Click deploy

## 🔧 Build for Production

```bash
npm run build
```

This creates a `build` folder with optimized production files.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   └── navbar.jsx      # Navigation component
├── Sections/           # Main page sections
│   ├── Hero.jsx        # Hero section
│   ├── About.jsx       # About section
│   ├── Skills.jsx      # Skills section
│   ├── Portfolio.jsx   # Portfolio section
│   ├── Contacts.jsx    # Contact section
│   └── Footer.jsx      # Footer section
├── App.js              # Main app component
├── index.js            # App entry point
└── index.css           # Global styles with Tailwind
```

## 🎯 Performance Optimization

- Lazy loading for images
- Optimized bundle size
- Efficient CSS with Tailwind
- Responsive images
- Minimal JavaScript

## 🔍 SEO Features

- Semantic HTML structure
- Meta tags for social sharing
- Proper heading hierarchy
- Alt text for images
- Fast loading times

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 📞 Contact

- **Email**: vishalpanwar416@gmail.com
- **LinkedIn**: [linkedin.com/in/vishalpanwar416](https://linkedin.com/in/vishalpanwar416)
- **GitHub**: [github.com/vishalpanwar416](https://github.com/vishalpanwar416)
- **LeetCode**: [leetcode.com/vishalpanwar416](https://leetcode.com/vishalpanwar416)

---

Made with ❤️ by Vishal Panwar using React & Tailwind CSS
