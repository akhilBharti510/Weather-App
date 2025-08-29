const apiKey = "aefa36fce2f92bf920c46b0e9dd2056f";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";
const forecastUrl = "https://api.openweathermap.org/data/2.5/forecast?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");
const loader = document.querySelector(".loader");
const forecastContainer = document.querySelector(".forecast-cards");
const unitToggle = document.getElementById("unit-toggle");

// THEME: toggle only on the CARD
// THEME: toggle only on the CARD
const card = document.getElementById("app-card");
const themeToggle = document.getElementById("theme-toggle");
const themeIcon = document.getElementById("theme-icon");

// initial theme: dark card, show SUN icon (suggest switch to light)
function setThemeIcon(){
  const isDark = card.classList.contains("dark");
  themeIcon.src = isDark ? "./images/moon.png" : "./images/sun.png";
}
setThemeIcon();

themeToggle.addEventListener("click", () => {
  card.classList.toggle("dark");

  // animation handling
  themeIcon.classList.add("slide-out");

  themeIcon.addEventListener("transitionend", () => {
    // update icon after sliding out
    const isDark = card.classList.contains("dark");
    themeIcon.src = isDark ? "./images/moon.png" : "./images/sun.png";

    // reset classes for smooth slide-in
    themeIcon.classList.remove("slide-out");
    themeIcon.classList.add("slide-in");

    // trigger reflow to apply animation properly
    void themeIcon.offsetWidth;

    // finally activate slide-in
    themeIcon.classList.add("active");

    // clean up after animation
    setTimeout(() => {
      themeIcon.classList.remove("slide-in", "active");
    }, 500);
  }, { once: true });
});


// Loader helper
function showLoader(show){
  loader.style.display = show ? "block" : "none";
}

// Units
let isCelsius = true;

// Map weather main -> icon filename
function iconFor(main){
  const m = main.toLowerCase();
  const map = {
    clouds: "clouds",
    clear: "clear",
    rain: "rain",
    drizzle: "drizzle",
    snow: "snow",
    mist: "mist",
    haze: "mist",
    thunderstorm: "rain"
  };
  return (map[m] || "clouds") + ".png";
}

// Update current weather UI
function updateWeather(data){
  document.querySelector(".city").innerHTML = `${data.name}, ${data.sys.country}`;
  const t = isCelsius ? data.main.temp : (data.main.temp * 9/5) + 32;
  document.querySelector(".temp").innerHTML = Number(t.toFixed(1)) + (isCelsius ? "°C" : "°F");
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = (data.wind.speed * 3.6).toFixed(1) + " km/h";
  weatherIcon.src = `./images/${iconFor(data.weather[0].main)}`;
}

// Update 5-day forecast (pick 12:00 PM entries)
function updateForecast(list){
  forecastContainer.innerHTML = "";
  const daily = list.filter(i => i.dt_txt.includes("12:00:00")).slice(0, 5);

  daily.forEach(item => {
    const date = new Date(item.dt_txt);
    const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
    const tempVal = isCelsius ? item.main.temp : (item.main.temp * 9/5) + 32;

    const cardEl = document.createElement("div");
    cardEl.className = "forecast-card";
    cardEl.innerHTML = `
      <p>${dayName}</p>
      <img src="./images/${iconFor(item.weather[0].main)}" alt="${item.weather[0].main}">
      <p>${Number(tempVal.toFixed(1))}${isCelsius ? "°C" : "°F"}</p>
    `;
    forecastContainer.appendChild(cardEl);
  });
}

// Fetch Weather + Forecast
async function checkWeather(city){
  try{
    showLoader(true);
    const res = await fetch(apiUrl + city + `&appid=${apiKey}`);
    if(res.status === 404){
      document.querySelector(".error").style.display = "block";
      document.querySelector(".weather").style.display = "none";
      showLoader(false);
      return;
    }
    const data = await res.json();
    updateWeather(data);
    document.querySelector(".weather").style.display = "block";
    document.querySelector(".error").style.display = "none";

    const fres = await fetch(forecastUrl + city + `&appid=${apiKey}`);
    const fdata = await fres.json();
    updateForecast(fdata.list);
  }catch(e){
    console.error(e);
  }finally{
    showLoader(false);
  }
}

// Search handlers
searchBtn.addEventListener("click", () => {
  const city = searchBox.value.trim();
  if(city) checkWeather(city);
});
searchBox.addEventListener("keydown", (e) => {
  if(e.key === "Enter" && searchBox.value.trim()){
    checkWeather(searchBox.value.trim());
  }
});

// Unit toggle (re-renders current city without refetching name)
unitToggle.addEventListener("click", () => {
  isCelsius = !isCelsius;
  unitToggle.innerText = isCelsius ? "Switch to °F" : "Switch to °C";

  const cityText = document.querySelector(".city").innerText;
  if(cityText && cityText !== "CITY"){
    // Re-fetch to keep things consistent (simpler + keeps forecast units in sync)
    checkWeather(cityText.split(",")[0]);
  }
});

// Default: Delhi
checkWeather("Delhi");
