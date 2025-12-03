/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./routes/**/*.js",
  ],
  safelist: [
    // Common background colors for navigation buttons
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-purple-500',
    'bg-indigo-500',
    'bg-violet-500',
    'bg-pink-500',
    'bg-yellow-500',
    'bg-orange-500',
    'bg-teal-500',
    'bg-cyan-500',
    'bg-emerald-500',
    // Hover variants
    'hover:bg-red-600',
    'hover:bg-blue-600',
    'hover:bg-green-600',
    'hover:bg-purple-600',
    'hover:bg-indigo-600',
    'hover:bg-violet-600',
    'hover:bg-red-700',
    'hover:bg-blue-700',
    'hover:bg-green-700',
    'hover:bg-purple-700',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}

