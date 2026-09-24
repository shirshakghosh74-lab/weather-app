const apiKey = "43cadde8d220a040c39d1c9313e2f4b0";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");
const weatherResult = document.getElementById("weatherResult");
const errorMsg = document.getElementById("error");
const loader = document.getElementById("loader");
const unitToggle = document.getElementById("unitToggle");
const suggestionsBox = document.getElementById("suggestions");
const darkModeToggle = document.getElementById("darkModeToggle");

if (localStorage.getItem("darkMode") === "true") {
  document.body.classList.add("dark-mode");
  darkModeToggle.textContent = "☀️";
}

darkModeToggle.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  const isDark = document.body.classList.contains("dark-mode");
  darkModeToggle.textContent = isDark ? "☀️" : "🌙";
  localStorage.setItem("darkMode", isDark);
});

let currentUnit = "C";
let lastTempC = null;

const cityName = document.getElementById("cityName");
const temp = document.getElementById("temp");
const description = document.getElementById("description");
const humidity = document.getElementById("humidity");
const wind = document.getElementById("wind");

searchBtn.addEventListener("click", getWeather);
cityInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") getWeather();
});

let debounceTimer;
cityInput.addEventListener("input", () => {
  clearTimeout(debounceTimer);
  const query = cityInput.value.trim();

  if (query.length < 2) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  debounceTimer = setTimeout(() => fetchSuggestions(query), 400);
});

async function fetchSuggestions(query) {
  const url = `https://api.openweathermap.org/geo/1.0/direct?q=${query}&limit=5&appid=${apiKey}`;
  try {
    const response = await fetch(url);
    const data = await response.json();
    showSuggestions(data);
  } catch (err) {
    suggestionsBox.classList.add("hidden");
  }
}

function showSuggestions(places) {
  suggestionsBox.innerHTML = "";

  if (!places.length) {
    suggestionsBox.classList.add("hidden");
    return;
  }

  places.forEach(place => {
    const div = document.createElement("div");
    div.textContent = `${place.name}${place.state ? ", " + place.state : ""}, ${place.country}`;
    div.addEventListener("click", () => {
      cityInput.value = place.name;
      suggestionsBox.classList.add("hidden");
      getWeather();
    });
    suggestionsBox.appendChild(div);
  });

  suggestionsBox.classList.remove("hidden");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".input-wrapper")) {
    suggestionsBox.classList.add("hidden");
  }
});

async function getWeather() {
  const city = cityInput.value.trim();
  if (!city) return;
  
  loader.classList.remove("hidden");
  weatherResult.classList.add("hidden");
  errorMsg.classList.add("hidden");

  const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error("City not found");

    const data = await response.json();
    displayWeather(data);
    localStorage.setItem("lastCity", city);
    getForecast(city);
    saveRecentSearch(city);
  } catch (err) {
    showError();
  } finally{
    loader.classList.add("hidden");
  }
}

function displayWeather(data) {
  errorMsg.classList.add("hidden");
  weatherResult.classList.remove("hidden");
    updateBackground(data.weather[0].main);

    const iconCode = data.weather[0].icon;
  document.getElementById("weatherIcon").src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;

  cityName.textContent = `${data.name}, ${data.sys.country}`;
    lastTempC = data.main.temp;
  currentUnit = "C";
  unitToggle.textContent = "Switch to °F";
  temp.textContent = `${Math.round(lastTempC)}°C`;
  description.textContent = data.weather[0].description;
  humidity.textContent = data.main.humidity;
  wind.textContent = data.wind.speed;
  
  document.getElementById("feelsLike").textContent = Math.round(data.main.feels_like);

  const sunriseTime = new Date(data.sys.sunrise * 1000);
  const sunsetTime = new Date(data.sys.sunset * 1000);
  document.getElementById("sunrise").textContent = sunriseTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById("sunset").textContent = sunsetTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function showError() {
  weatherResult.classList.add("hidden");
  errorMsg.classList.remove("hidden");
}


window.addEventListener("load", () => {
  const savedCity = localStorage.getItem("lastCity");
  if (savedCity) {
    cityInput.value = savedCity;
    getWeather();
  } else if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(getWeatherByCoords, () => {
      console.log("Location access denied, waiting for manual search.");
    });
  }
});

async function getWeatherByCoords(position) {
  const { latitude, longitude } = position.coords;
  const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&units=metric&appid=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    displayWeather(data);
  } catch (err) {
    console.log("Could not fetch location weather.");
  }
}


async function getForecast(city) {
  const url = `https://api.openweathermap.org/data/2.5/forecast?q=${city}&units=metric&appid=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  const forecastDiv = document.getElementById("forecast");
  forecastDiv.innerHTML = "";

  dailyData.forEach(day => {
    const date = new Date(day.dt_txt);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const icon = day.weather[0].icon;
    const dayTemp = Math.round(day.main.temp);

    forecastDiv.innerHTML += `
      <div class="forecast-day">
        <p>${dayName}</p>
        <img src="https://openweathermap.org/img/wn/${icon}.png" alt="">
        <p>${dayTemp}°C</p>
      </div>
    `;
  });
}


function updateBackground(condition) {
  const body = document.body;
  const gradients = {
    Clear: "linear-gradient(135deg, #f6d365, #fda085)",
    Clouds: "linear-gradient(135deg, #757f9a, #d7dde8)",
    Rain: "linear-gradient(135deg, #4b6cb7, #182848)",
    Drizzle: "linear-gradient(135deg, #4b6cb7, #182848)",
    Thunderstorm: "linear-gradient(135deg, #232526, #414345)",
    Snow: "linear-gradient(135deg, #e6dada, #274046)",
    Mist: "linear-gradient(135deg, #757f9a, #d7dde8)",
    Haze: "linear-gradient(135deg, #757f9a, #d7dde8)",
    Fog: "linear-gradient(135deg, #757f9a, #d7dde8)"
  };

  body.style.background = gradients[condition] || "linear-gradient(135deg, #4facfe, #00f2fe)";
}


unitToggle.addEventListener("click", () => {
  if (lastTempC === null) return;

  if (currentUnit === "C") {
    const fahrenheit = (lastTempC * 9) / 5 + 32;
    temp.textContent = `${Math.round(fahrenheit)}°F`;
    unitToggle.textContent = "Switch to °C";
    currentUnit = "F";
  } else {
    temp.textContent = `${Math.round(lastTempC)}°C`;
    unitToggle.textContent = "Switch to °F";
    currentUnit = "C";
  }
});


function saveRecentSearch(city) {
  let recents = JSON.parse(localStorage.getItem("recentSearches")) || [];
  recents = recents.filter(c => c.toLowerCase() !== city.toLowerCase());
  recents.unshift(city);
  recents = recents.slice(0, 5);
  localStorage.setItem("recentSearches", JSON.stringify(recents));
  renderRecentSearches();
}

function renderRecentSearches() {
  const recents = JSON.parse(localStorage.getItem("recentSearches")) || [];
  const container = document.getElementById("recentSearches");
  container.innerHTML = "";

  recents.forEach(city => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = city;
    chip.addEventListener("click", () => {
      cityInput.value = city;
      getWeather();
    });
    container.appendChild(chip);
  });
}

renderRecentSearches();