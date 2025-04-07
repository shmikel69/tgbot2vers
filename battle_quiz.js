
// Initialize Telegram Web App compatibility
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

// Quiz questions database (оставляем как есть)
const quizQuestions = [
  { question: "What is the capital of France?", options: ["London", "Berlin", "Paris", "Madrid"], correctAnswer: 2 },
  { question: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: 1 },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correctAnswer: 3 },
  { question: "Which element has the chemical symbol 'O'?", options: ["Gold", "Oxygen", "Osmium", "Oganesson"], correctAnswer: 1 },
  { question: "Which animal is known as the 'King of the Jungle'?", options: ["Tiger", "Lion", "Elephant", "Giraffe"], correctAnswer: 1 },
  { question: "What's the smallest prime number?", options: ["0", "1", "2", "3"], correctAnswer: 2 },
  { question: "How many continents are there on Earth?", options: ["5", "6", "7", "8"], correctAnswer: 2 },
  { question: "Which planet has the most moons (as of recent discoveries)?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correctAnswer: 1 }, // Saturn
  { question: "What's the hardest natural substance on Earth?", options: ["Gold", "Iron", "Diamond", "Quartz"], correctAnswer: 2 },
  { question: "Which of these is NOT a primary color (in additive color model)?", options: ["Red", "Green", "Blue", "Yellow"], correctAnswer: 3 } // Yellow
];

// --- ИЗМЕНЕННЫЕ БАФФЫ/ДЕБАФФЫ (Более разнообразные) ---
const buffOptions = {
  correct: [
    { type: 'damage', multiplier: 1.3, text: 'Damage +30%' }, // Урон +30%
    { type: 'healing', multiplier: 1.5, text: 'Healing +50%' }, // Лечение +50%
    { type: 'defense', multiplier: 1.2, text: 'Defense +20%' }, // Защита +20%
    { type: 'health_boost', value: 20, text: 'Max Health +20' }, // +20 Макс. HP (на этот бой)
    { type: 'crit_chance', value: 0.1, text: 'Crit Chance +10%' } // Шанс крита +10%
  ],
  incorrect: [
    { type: 'damage', multiplier: 0.8, text: 'Damage -20%' }, // Урон -20%
    { type: 'healing', multiplier: 0.7, text: 'Healing -30%' }, // Лечение -30%
    { type: 'defense', multiplier: 0.9, text: 'Defense -10%' }, // Защита -10%
    { type: 'speed_debuff', value: 1.1, text: 'Enemy Speed +10%' } // Скорость врага +10% (атакует чаще)
    // { type: 'accuracy_debuff', value: 0.1, text: 'Accuracy -10%' } // Снижение точности (можно добавить)
  ]
};

// Variables to store quiz state
let currentQuiz = null;
let selectedBuff = null; // Выбранный бафф/дебафф

// DOM Elements
const quizContainer = document.getElementById('battle-quiz-container');
const questionElement = document.getElementById('battle-quiz-question');
const optionsContainer = document.getElementById('battle-quiz-options');
const startBattleButtonContainer = document.getElementById('battle-start-container');
const startBattleButton = document.getElementById('start-battle-button'); // Теперь получаем кнопку по ID
const battleContainer = document.getElementById('battle-container');
const quizResultElement = document.getElementById('quiz-result');
const battleMessages = document.getElementById('battle-messages'); // Добавлено для сообщений

// Get a random quiz question
function getRandomQuiz() {
  const randomIndex = Math.floor(Math.random() * quizQuestions.length);
  return quizQuestions[randomIndex];
}

// Get a random buff/debuff object from the options
function getRandomEffect(type) {
    const options = buffOptions[type];
    if (!options || options.length === 0) return null;
    const randomIndex = Math.floor(Math.random() * options.length);
    return { ...options[randomIndex] }; // Возвращаем копию объекта
}

// Show quiz before battle
function showBattleQuiz() {
  // Показываем квиз, скрываем арену битвы
  if(quizContainer) quizContainer.style.display = 'block';
  if(battleContainer) battleContainer.style.display = 'none';
  if(startBattleButtonContainer) startBattleButtonContainer.style.display = 'none'; // Скрываем кнопку "Battle"
  if(quizResultElement) quizResultElement.textContent = ''; // Очищаем результат
   if(battleMessages) battleMessages.style.display = 'none'; // Скрываем лог боя

  // Сброс предыдущего состояния
  selectedBuff = null;

  // Get a random quiz
  currentQuiz = getRandomQuiz();
  if (!currentQuiz) {
      console.error("Failed to get quiz question.");
      // Можно показать сообщение об ошибке и кнопку для перезагрузки
      quizResultElement.textContent = 'Error loading quiz. Please try again.';
      // Показать кнопку "Назад" или "Перезагрузить"
      return;
  }

  // Display question
  if (questionElement) questionElement.textContent = currentQuiz.question;

  // Clear previous options and add new ones
  if (optionsContainer) {
      optionsContainer.innerHTML = ''; // Очистка
      currentQuiz.options.forEach((option, index) => {
        const optionButton = document.createElement('div');
        optionButton.className = 'battle-quiz-option';
        optionButton.textContent = option;
        optionButton.dataset.index = index;

        optionButton.addEventListener('click', handleQuizAnswer); // Добавляем обработчик

        optionsContainer.appendChild(optionButton);
      });
  }
}

// Handle quiz answer click
function handleQuizAnswer(event) {
  if (!currentQuiz) return;

  const selectedButton = event.target;
  const selectedIndex = parseInt(selectedButton.dataset.index);
  const isCorrect = selectedIndex === currentQuiz.correctAnswer;

  // Disable all options
  document.querySelectorAll('.battle-quiz-option').forEach(opt => {
    opt.removeEventListener('click', handleQuizAnswer); // Удаляем обработчик
    opt.classList.add('disabled'); // Визуально отключаем
    opt.style.pointerEvents = 'none'; // Отключаем события мыши
  });

   // Показываем правильный ответ
   const correctOptionElement = optionsContainer.children[currentQuiz.correctAnswer];
   if (correctOptionElement) {
       correctOptionElement.classList.add('correct');
   }

  // Apply visual feedback to selected answer
  if (isCorrect) {
    selectedButton.classList.add('correct');
    selectedBuff = getRandomEffect('correct'); // Получаем случайный бафф
    if (quizResultElement) {
        quizResultElement.textContent = `Correct! ${selectedBuff ? selectedBuff.text : ''}`;
        quizResultElement.className = 'result-display correct-result'; // Добавляем класс для стиля
    }
  } else {
    selectedButton.classList.add('incorrect');
    selectedBuff = getRandomEffect('incorrect'); // Получаем случайный дебафф
     if (quizResultElement) {
        quizResultElement.textContent = `Incorrect! ${selectedBuff ? selectedBuff.text : ''}`;
        quizResultElement.className = 'result-display incorrect-result'; // Добавляем класс для стиля
     }
  }

  // Save the selected buff/debuff to localStorage for battle.js
  if (selectedBuff) {
    localStorage.setItem('battleEffect', JSON.stringify(selectedBuff));
    console.log("Saved battle effect:", selectedBuff);
  } else {
    localStorage.removeItem('battleEffect'); // Очищаем, если эффекта нет
  }

  // Show "Battle" button after a delay
  if (startBattleButtonContainer) {
      setTimeout(() => {
        startBattleButtonContainer.style.display = 'block'; // Показываем контейнер с кнопкой
        if(startBattleButton) {
            startBattleButton.disabled = false; // Активируем кнопку
        }
      }, 1500); // Задержка 1.5 секунды
  }
}

// Function to start the actual battle (called from battle.js)
function proceedToBattle() {
  // Hide quiz, show battle arena
  if(quizContainer) quizContainer.style.display = 'none';
  if(battleContainer) battleContainer.style.display = 'flex'; // Используем flex для отображения арены
  if(battleMessages) battleMessages.style.display = 'block'; // Показываем лог боя

  // Call the startBattle function defined in battle.js
  // Убедимся, что функция существует в глобальном контексте
  if (typeof window.startBattleInternal === 'function') {
    window.startBattleInternal(); // Вызываем функцию начала боя из battle.js
  } else {
      console.error("startBattleInternal function not found in battle.js!");
      // Можно показать сообщение об ошибке
      if(quizResultElement) quizResultElement.textContent = 'Error starting battle. Please try again.';
  }
}

// Initialize the battle quiz system
function initBattleQuiz() {
  console.log("Initializing Battle Quiz...");
  // Hide battle container initially, show quiz
  showBattleQuiz();

  // Set up start battle button event listener
  if (startBattleButton) {
    startBattleButton.addEventListener('click', () => {
        startBattleButton.disabled = true; // Деактивируем кнопку после нажатия
        proceedToBattle(); // Переходим к бою
    });
  } else {
      console.error("Start Battle Button not found!");
  }
}

// Initialize quiz when the script loads (or called by battle.js/html)
// Мы будем вызывать initBattleQuiz из battle.js после загрузки DOM
// window.addEventListener('DOMContentLoaded', initBattleQuiz); // Убрал автозапуск, будет вызвано из battle.js

