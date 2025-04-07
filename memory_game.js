const wordThemes = {
    nature: ["Tree", "River", "Mountain", "Flower", "Forest", "Cloud", "Sun", "Stone", "Leaf", "Grass"],
    animals: ["Cat", "Dog", "Lion", "Elephant", "Zebra", "Bird", "Fish", "Monkey", "Tiger", "Bear"],
    food: ["Apple", "Banana", "Pizza", "Bread", "Cheese", "Water", "Juice", "Salad", "Soup", "Cake"],
    household: ["Table", "Chair", "Lamp", "Door", "Window", "Sofa", "Bed", "Clock", "Mirror", "Vase"],
    tools: ["Hammer", "Wrench", "Screwdriver", "Pliers", "Saw", "Drill", "Axe", "Shovel", "Tape", "Nail"],
    space: ["Planet", "Star", "Moon", "Galaxy", "Comet", "Asteroid", "Nebula", "Rocket", "Orbit", "Alien"],
    colors: ["Red", "Blue", "Green", "Yellow", "Purple", "Orange", "Black", "White", "Pink", "Brown"],
    clothing: ["Shirt", "Pants", "Jacket", "Hat", "Shoes", "Socks", "Dress", "Skirt", "Gloves", "Scarf"]
};

// Общий пул слов (для дополнения, если нужно)
const generalWordPool = [
    "Book", "Guitar", "House", "Ice", "Key", "Nature", "Ocean", "Queen", "Time", "Umbrella",
    "Violin", "Xylophone", "Year", "Air", "Diamond", "Earth", "Gold", "Heart", "Island", "Jungle",
    "King", "Paper", "Quiet", "Road", "Star", "Universe", "Village", "Wind", "Box", "Zoo",
    "Crystal", "Dream", "Energy", "Fire", "Harmony", "Idea", "Journey", "Knowledge", "Light", "Magic",
    "Music", "Mystery", "Peace", "Power", "Quest", "Secret", "Shadow", "Silence", "Spirit", "Story",
    "Thought", "Truth", "Vision", "Wisdom", "Wonder"
];

let selectedWords = []; // Слова для текущей игры
let timerInterval;
let timeLeft = 120; // 2 минуты = 120 секунд
const wordsToMemorizeCount = 30; // Количество слов для запоминания

// DOM Elements
let timerElementMem, wordContainer, memorizePhaseElement, recallPhaseElement, recallInputElement, submitRecallButton, cancelMemoryButton, cancelRecallButton, resultsElementMem, correctCountElementMem, xpEarnedElementMem, backToMenuButtonMem;


// Initialize Telegram Web App compatibility
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// Load user data (для сохранения XP и статов)
function loadUserData() {
   const savedData = localStorage.getItem('brainTrainingUserData');
   if (savedData) {
       try {
           const data = JSON.parse(savedData);
           if (!data.stats) data.stats = {};
           if (!data.achievements) data.achievements = {};
            if (data.level === undefined) data.level = 1;
           if (data.xp === undefined) data.xp = 0;
           return data;
       } catch (e) {
            console.error("Error parsing user data for memory game:", e);
       }
   }
   // Дефолт
   return {
     level: 1, xp: 0, lives: 5, lastPlayed: new Date(),
     stats: { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 },
     achievements: { memoryMaster: false }, inventory: []
   };
}

// Save user data
function saveUserData(userData) {
    localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
}


// --- Word Selection Logic ---

// Выбор случайных слов с учетом тем
function selectThemedWords(totalCount) {
    let words = [];
    const themeKeys = Object.keys(wordThemes);

    // 1. Выбираем 1-2 случайные темы
    const numberOfThemes = Math.random() < 0.6 ? 1 : 2; // 60% шанс на 1 тему, 40% на 2
    const selectedThemeKeys = themeKeys.sort(() => 0.5 - Math.random()).slice(0, numberOfThemes);
     console.log("Selected themes:", selectedThemeKeys);

    // 2. Берем слова из выбранных тем (примерно половину от общего числа)
    const wordsPerTheme = Math.floor((totalCount * 0.6) / numberOfThemes); // ~60% слов - тематические
    selectedThemeKeys.forEach(themeKey => {
        const themeWords = [...wordThemes[themeKey]].sort(() => 0.5 - Math.random());
        words = words.concat(themeWords.slice(0, wordsPerTheme));
    });

    // 3. Добираем недостающие слова из общего пула или других тем
    const remainingCount = totalCount - words.length;
    if (remainingCount > 0) {
        // Собираем все слова, которых еще нет в выборке
        let availableWords = [];
        // Добавляем слова из неиспользованных тем
        themeKeys.forEach(key => {
            if (!selectedThemeKeys.includes(key)) {
                 wordThemes[key].forEach(word => {
                    if (!words.includes(word)) availableWords.push(word);
                 });
            }
        });
        // Добавляем слова из общего пула
        generalWordPool.forEach(word => {
            if (!words.includes(word)) availableWords.push(word);
        });

        // Перемешиваем доступные слова и берем нужное количество
        availableWords = availableWords.sort(() => 0.5 - Math.random());
        words = words.concat(availableWords.slice(0, remainingCount));
    }

    // 4. Финально перемешиваем весь список
    return words.sort(() => 0.5 - Math.random());
}


// --- Game Flow ---

// Update the timer display
function updateTimer() {
    if (!timerElementMem) return;
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerElementMem.textContent = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

    if (timeLeft <= 0) {
        if (timerInterval) clearInterval(timerInterval);
        showRecallPhase();
    } else {
        timeLeft--;
    }
}

// Display words in the container
function displayWords() {
    selectedWords = selectThemedWords(wordsToMemorizeCount); // Генерируем слова
     console.log("Words to memorize:", selectedWords); // Для отладки
    if (!wordContainer) return;

    wordContainer.innerHTML = ''; // Clear previous words
    selectedWords.forEach(word => {
        const wordBox = document.createElement('div');
        wordBox.className = 'word-box';
        wordBox.textContent = word;
        wordContainer.appendChild(wordBox);
    });
}

// Show recall phase
function showRecallPhase() {
    if (memorizePhaseElement) memorizePhaseElement.style.display = 'none';
    if (recallPhaseElement) recallPhaseElement.style.display = 'block';
    if (resultsElementMem) resultsElementMem.style.display = 'none';
    if (recallInputElement) recallInputElement.focus(); // Фокус на поле ввода
}

// Show memorize phase (используется для старта)
function showMemorizePhase() {
    timeLeft = 120; // Сброс таймера
    displayWords(); // Показ слов

     if (memorizePhaseElement) memorizePhaseElement.style.display = 'block';
     if (recallPhaseElement) recallPhaseElement.style.display = 'none';
     if (resultsElementMem) resultsElementMem.style.display = 'none';

     if (timerInterval) clearInterval(timerInterval); // Очистка старого таймера
     timerInterval = setInterval(updateTimer, 1000); // Запуск нового
     updateTimer(); // Обновить отображение таймера сразу
}


// Check results
function checkResults() {
    if (!recallInputElement) return;
    if (timerInterval) clearInterval(timerInterval); // Остановить таймер на всякий случай

    const recallInputRaw = recallInputElement.value;
    // Разделяем по пробелам, запятым, точкам, точкам с запятой, новой строке
    // Убираем пустые строки и приводим к нижнему регистру
    const recalledWords = recallInputRaw
        .toLowerCase()
        .split(/[\s,.;\n]+/)
        .filter(word => word.trim() !== '');

    // Убираем дубликаты из введенных слов
    const uniqueRecalledWords = [...new Set(recalledWords)];

    let correctCount = 0;
    const selectedWordsLower = selectedWords.map(word => word.toLowerCase());

    // Считаем правильные уникальные слова
    uniqueRecalledWords.forEach(recalledWord => {
        if (selectedWordsLower.includes(recalledWord)) {
            correctCount++;
        }
    });

    // Calculate XP earned (например, 2 XP за слово)
    const xpEarned = correctCount * 2;

    // Update user data
    const userData = loadUserData();
    userData.xp += xpEarned;
    // Увеличиваем интеллект чуть больше
    userData.stats.intelligence = (userData.stats.intelligence || 0) + Math.max(1, Math.floor(correctCount / 4)); // +1 за каждые 4 слова

    // Level up check
    let xpForNextLevel = (userData.level || 1) * 100;
    if (userData.xp >= xpForNextLevel) {
        userData.level++;
        userData.xp -= xpForNextLevel;
        // Добавить сообщение о левел-апе на экране результатов?
    }

    // Check for Memory Master achievement
    if (correctCount >= 16) { // Порог достижения
        if (!userData.achievements) userData.achievements = {};
         if (!userData.achievements.memoryMaster) {
             userData.achievements.memoryMaster = true;
             // Добавить сообщение о достижении?
         }
    }

    saveUserData(userData);

    // Show results screen
    if(correctCountElementMem) correctCountElementMem.textContent = `${correctCount} / ${wordsToMemorizeCount}`;
    if(xpEarnedElementMem) xpEarnedElementMem.textContent = xpEarned;

    if (recallPhaseElement) recallPhaseElement.style.display = 'none';
    if (resultsElementMem) resultsElementMem.style.display = 'block';
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Memory Game DOM loaded.");
    // Получаем элементы
    timerElementMem = document.getElementById('timer');
    wordContainer = document.getElementById('word-container');
    memorizePhaseElement = document.getElementById('memorize-phase');
    recallPhaseElement = document.getElementById('recall-phase');
    recallInputElement = document.getElementById('recall-input');
    submitRecallButton = document.getElementById('submit-recall');
    cancelMemoryButton = document.getElementById('cancel-memory');
    cancelRecallButton = document.getElementById('cancel-recall');
    resultsElementMem = document.getElementById('results');
    correctCountElementMem = document.getElementById('correct-count');
    xpEarnedElementMem = document.getElementById('xp-earned');
    backToMenuButtonMem = document.getElementById('back-to-menu');

    // Применяем тему
     const savedTheme = localStorage.getItem("preferred-theme");
     document.body.className = (savedTheme || "colorful") + "-theme";

    // Настраиваем обработчики
    if (submitRecallButton) submitRecallButton.addEventListener('click', checkResults);
    if (backToMenuButtonMem) backToMenuButtonMem.addEventListener('click', () => { window.location.href = 'index.html'; });
    if (cancelMemoryButton) {
        cancelMemoryButton.addEventListener('click', () => {
            if (timerInterval) clearInterval(timerInterval);
            window.location.href = 'index.html';
        });
    }
    if (cancelRecallButton) cancelRecallButton.addEventListener('click', () => { window.location.href = 'index.html'; });

    // Начинаем игру с фазы запоминания
    showMemorizePhase();
});

