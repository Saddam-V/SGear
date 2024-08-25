/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./views/**/*.{html,js,pug}", "./public/**/*.{html,js,pug}"],
  theme: {
    extend: {
      colors: {
        theme1: "#00e1ff",
        theme2: "#eaeaea",
      },
    },
  },
  plugins: [
    // ...
    require("@tailwindcss/forms"),
  ],
};
