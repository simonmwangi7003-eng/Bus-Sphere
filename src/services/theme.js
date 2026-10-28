const THEME_KEY = "bussphere.theme";

export function getTheme() {
  try {
    return localStorage.getItem(THEME_KEY) === "dark" ? "dark" : "light";
  } catch (error) {
    console.warn("Theme preference is unavailable in this browser:", error);
    return "light";
  }
}

export function setTheme(theme) {
  const selectedTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = selectedTheme;
  try {
    localStorage.setItem(THEME_KEY, selectedTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved:", error);
  }
}
