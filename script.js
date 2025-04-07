
// Initialize Telegram Web App compatibility (can run without Telegram too)
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.expand();
  tg.ready(); // Сообщаем Telegram, что приложение готово
}

// DOM Elements
const modal = document.getElementById("modal");
const modalMessage = document.getElementById("modal-message");
const closeModal = document.querySelector(".modal .close"); // Уточнен селектор
const themeButtons = {
    colorful: document.getElementById("colorful-theme-btn"),
    light: document.getElementById("light-theme-btn"),
    dark: document.getElementById("dark-theme-btn")
};

// User data storage
let userData = {}; // Загрузим из localStorage

// Load user data from localStorage if it exists
function loadUserData() {
  const savedData = localStorage.getItem('brainTrainingUserData');
  if (savedData) {
    try {
        userData = JSON.parse(savedData);
        // Проверка и добавление недостающих полей (если нужно)
        if (!userData.stats) userData.stats = {};
        if (!userData.equipment) userData.equipment = { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' };
        if (!userData.pet) userData.pet = { unlocked: false, type: 'cat', color: 'default', accessory: 'none', abilities: {} };
        if (!userData.achievements) userData.achievements = {};
        if (!userData.inventory) userData.inventory = [];
        if (!userData.room) userData.room = { theme: 'default', items: [] };
        if (userData.lastPlayed) userData.lastPlayed = new Date(userData.lastPlayed); // Преобразуем строку в дату
        else userData.lastPlayed = new Date(0); // Если нет даты, ставим очень старую

    } catch (e) {
        console.error("Error parsing user data:", e);
        setDefaultUserData(); // Сбрасываем к дефолту при ошибке
    }
  } else {
      setDefaultUserData();
  }
  console.log("User data loaded:", userData);
}

// Set default user data
function setDefaultUserData() {
    userData = {
        level: 1,
        xp: 0,
        lives: 5,
        lastPlayed: new Date(0), // Начальная дата
        stats: {
            intelligence: 10, sports: 5, languages: 3,
            energy: 8, creativity: 7, health: 10
        },
        equipment: { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' },
        pet: { unlocked: false, type: 'cat', color: 'default', accessory: 'none', abilities: { loyalty: 50, intelligence: 70, speed: 60, strength: 40 } },
        achievements: { memoryMaster: false, mathWizard: false, dailyStreak: false },
        inventory: [],
        room: { theme: 'default', items: [] }
    };
    saveUserData(); // Сохраняем дефолтные данные
}


// Save user data to localStorage
function saveUserData() {
    try {
        localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
    } catch (e) {
        console.error("Error saving user data:", e);
    }
}

// Initialize the app
function initApp() {
  loadUserData();

  // Check for daily life regain
  const now = new Date();
  const lastPlayedDate = userData.lastPlayed;
  // Проверяем, что lastPlayedDate - это действительная дата
  if (lastPlayedDate instanceof Date && !isNaN(lastPlayedDate)) {
      const oneDay = 24 * 60 * 60 * 1000;
      // Устанавливаем время на начало дня для корректного сравнения
      const lastPlayedDayStart = new Date(lastPlayedDate.getFullYear(), lastPlayedDate.getMonth(), lastPlayedDate.getDate());
      const nowDayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const daysSinceLastPlayed = Math.floor((nowDayStart - lastPlayedDayStart) / oneDay);

      if (daysSinceLastPlayed > 0) {
          console.log(`Days since last played: ${daysSinceLastPlayed}. Regaining life.`);
          userData.lives = Math.min(5, (userData.lives || 0) + 1); // Regain 1 life per day, max 5
          userData.lastPlayed = now; // Обновляем дату последнего входа
          saveUserData();
      }
  } else {
      // Если дата некорректна, устанавливаем текущую и сохраняем
      console.warn("Invalid lastPlayed date found, resetting.");
      userData.lastPlayed = now;
      saveUserData();
  }


  // Load theme preference
  loadThemePreference();
}

// Show modal dialog
function showModal(message) {
  modalMessage.textContent = message;
  modal.style.display = "block";
}

// Close modal when clicking on X
if (closeModal) {
    closeModal.addEventListener("click", () => {
      if (modal) modal.style.display = "none";
    });
}

// Close modal when clicking outside
window.addEventListener("click", (event) => {
  if (event.target === modal) {
    modal.style.display = "none";
  }
});

// Handle icon clicks
document.querySelectorAll(".icon").forEach(icon => { // Убран .battle-icon, т.к. он теперь .icon
  icon.addEventListener("click", function() {
    const action = this.getAttribute("data-action");
    console.log("Icon clicked:", action); // Лог для отладки
    if (action === "inventory") {
      showModal("🎒 Inventory is under development. Here you'll manage your items, artifacts, and collectibles.");
    } else if (action === "games") {
      window.location.href = "index.html";
    } else if (action === "room") {
      window.location.href = "room.html";
    } else if (action === "stats") {
      window.location.href = "stats.html";
    } else if (action === "battle") {
      window.location.href = "battle.html";
    }
  });
});

// Handle START buttons
document.querySelectorAll(".start-button").forEach(button => {
  button.addEventListener("click", function() {
    const gameType = this.getAttribute("data-game");
    if (gameType === "memory") {
       // Сразу переходим к игре, intro не используется в текущей структуре
      window.location.href = "memory_game.html";
    } else if (gameType === "math") {
       // Сразу переходим к игре, intro не используется
      window.location.href = "math_game.html";
    }
  });
});

// Theme switcher functionality
function applyTheme(themeName) {
    document.body.className = themeName + '-theme'; // Применяем класс к body
    localStorage.setItem("preferred-theme", themeName);

    // Обновляем класс selected у кнопок
    Object.values(themeButtons).forEach(btn => {
        if (btn) btn.classList.remove('selected');
    });
    const selectedButton = themeButtons[themeName];
    if (selectedButton) {
        selectedButton.classList.add('selected');
    }
    console.log("Theme applied:", themeName);
}


if(themeButtons.colorful) themeButtons.colorful.addEventListener("click", () => applyTheme('colorful'));
if(themeButtons.light) themeButtons.light.addEventListener("click", () => applyTheme('light'));
if(themeButtons.dark) themeButtons.dark.addEventListener("click", () => applyTheme('dark'));


// Load saved theme preference
function loadThemePreference() {
  const savedTheme = localStorage.getItem("preferred-theme");
  // Применяем сохраненную тему или тему по умолчанию
  applyTheme(savedTheme || "colorful");
}

// Initialize the app when the page loads
window.onload = function() {
  initApp();
};
