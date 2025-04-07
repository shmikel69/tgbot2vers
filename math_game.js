let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
  tg.expand();
  tg.ready();
}

// Game variables
let problemNumber = 1;
let correctAnswers = 0;
let startTime;
let timerInterval; // Переименован для ясности
let problems = [];
let currentProblem;
const totalProblems = 87; // Количество задач

// DOM Elements (Получаем их при загрузке)
let countdownElement, startScreenElement, gameAreaElement, timerElement, problemNumberElement, mathProblemElement, answerInputElement, submitAnswerButton, cancelGameButton, resultsElement, finalTimeElement, correctCountElement, xpEarnedElement, recordsListElement, backToMenuButton, cancelMathButton;

// Load user data (необходимо для сохранения результатов и XP)
function loadUserData() {
  const savedData = localStorage.getItem('brainTrainingUserData');
  if (savedData) {
     try {
        const data = JSON.parse(savedData);
        // Базовая валидация
        if (!data.stats) data.stats = {};
        if (!data.records) data.records = { mathTime: [] };
        if (data.level === undefined) data.level = 1;
        if (data.xp === undefined) data.xp = 0;
        return data;
     } catch (e) {
         console.error("Error parsing user data for math game:", e);
     }
  }
  // Дефолтные данные, если нет сохраненных или ошибка парсинга
  return {
    level: 1, xp: 0, lives: 5, lastPlayed: new Date(),
    stats: { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 },
    records: { mathTime: [] }, inventory: []
  };
}

// Save user data
function saveUserData(userData) {
  localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
}

// --- Enhanced Math Problem Generation ---

// Генерация одного случайного математического примера
function generateSingleMathProblem() {
  const operations = ['+', '-', '*', '/']; // Используем '/' для деления
  const operation = operations[Math.floor(Math.random() * operations.length)];

  let num1, num2, answer, expression;
  let maxNum = 50; // Базовое максимальное число
  let difficultyFactor = 1 + Math.random(); // Небольшой случайный фактор сложности

  switch (operation) {
    case '+':
      maxNum = Math.floor(40 * difficultyFactor) + 10; // 10-90
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum) + 1;
      answer = num1 + num2;
      expression = `${num1} + ${num2}`;
      break;
    case '-':
       maxNum = Math.floor(60 * difficultyFactor) + 20; // 20-140
      num1 = Math.floor(Math.random() * maxNum) + 10; // Гарантируем, что num1 не слишком маленький
      num2 = Math.floor(Math.random() * num1) + 1; // num2 меньше num1
      answer = num1 - num2;
       expression = `${num1} - ${num2}`;
      break;
    case '*':
      // Множители поменьше для начала
      maxNum = Math.floor(10 * difficultyFactor) + 2; // 2-22
      let maxNum2 = Math.floor(12 / difficultyFactor) + 3; // 3-15
      num1 = Math.floor(Math.random() * maxNum) + 1;
      num2 = Math.floor(Math.random() * maxNum2) + 1;
      answer = num1 * num2;
       // Используем '×' для отображения
      expression = `${num1} × ${num2}`;
      break;
    case '/': // Деление
      // Генерируем ответ и делитель, потом находим делимое
      let maxDivisor = Math.floor(10 * difficultyFactor) + 2; // 2-22
      let maxQuotient = Math.floor(12 / difficultyFactor) + 2; // 2-14
      num2 = Math.floor(Math.random() * maxDivisor) + 1; // Делитель (не 0)
      answer = Math.floor(Math.random() * maxQuotient) + 1; // Ответ (не 0)
      num1 = num2 * answer; // Делимое
      // Используем ':' для отображения
      expression = `${num1} : ${num2}`;
      break;
  }

  return {
    expression: expression,
    answer: answer
  };
}

// Генерация всех проблем в начале игры
function generateProblems(count) {
  const generatedProblems = [];
  const opsCount = { '+': 0, '-': 0, '*': 0, '/': 0 };
  const targetPerOp = Math.floor(count / 4); // Целевое кол-во на операцию

  // Генерируем, стараясь сбалансировать операции
  while (generatedProblems.length < count) {
      let problem = generateSingleMathProblem();
      let op;
      if (problem.expression.includes('+')) op = '+';
      else if (problem.expression.includes('-')) op = '-';
      else if (problem.expression.includes('×')) op = '*';
      else if (problem.expression.includes(':')) op = '/';

      // Добавляем, если нужно больше этой операции или если все уже сбалансированы
      if (opsCount[op] < targetPerOp || generatedProblems.length >= targetPerOp * 4) {
          // Проверка на уникальность (простая) - не добавлять точно такой же пример
          if (!generatedProblems.some(p => p.expression === problem.expression)) {
              generatedProblems.push(problem);
              opsCount[op]++;
          }
      }
  }

   console.log("Problem distribution:", opsCount);
  // Перемешиваем массив для случайного порядка
   return generatedProblems.sort(() => Math.random() - 0.5);
}


// --- Game Flow ---

// Update the timer display
function updateTimer() {
  if (!startTime || !timerElement) return;
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  timerElement.textContent = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Show current problem
function showProblem() {
  if (problemNumber > totalProblems || !problems[problemNumber - 1]) {
      console.error("Problem index out of bounds or problem not generated.");
      endGame(); // Завершаем игру, если что-то не так
      return;
  }
  currentProblem = problems[problemNumber - 1];
  if(problemNumberElement) problemNumberElement.textContent = `Problem: ${problemNumber} / ${totalProblems}`;
  if(mathProblemElement) mathProblemElement.textContent = currentProblem.expression + ' = ?';
  if(answerInputElement) {
      answerInputElement.value = ''; // Очищаем поле
      answerInputElement.type = 'number'; // Убедимся что тип number
      answerInputElement.focus(); // Фокус на поле ввода
  }
}

// Check the answer
function checkAnswer() {
    if (!currentProblem || !answerInputElement) return;

    // Используем valueAsNumber для получения числа или NaN
    const userAnswer = answerInputElement.valueAsNumber;

    if (!isNaN(userAnswer) && userAnswer === currentProblem.answer) {
        correctAnswers++;
        // Можно добавить визуальный фидбек (например, кратковременное зеленое свечение)
        if(answerInputElement) answerInputElement.style.backgroundColor = 'lightgreen';
    } else {
        // Фидбек для неправильного ответа
         if(answerInputElement) answerInputElement.style.backgroundColor = 'lightcoral';
        // Можно показать правильный ответ
         console.log(`Incorrect. Answer was: ${currentProblem.answer}`);
    }

    // Убираем подсветку через короткое время
    setTimeout(() => {
       if(answerInputElement) answerInputElement.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
        // Переходим к следующему вопросу или завершаем игру
        if (problemNumber < totalProblems) {
            problemNumber++;
            showProblem();
        } else {
            endGame();
        }
    }, 300); // Задержка для фидбека
}

// Start the countdown
function startCountdown() {
  let count = 3;
  if (countdownElement) {
    countdownElement.textContent = count;
    countdownElement.style.display = 'block'; // Показываем таймер
  }
   if (startScreenElement) startScreenElement.style.display = 'block'; // Показываем стартовый экран
   if (gameAreaElement) gameAreaElement.style.display = 'none';
   if (resultsElement) resultsElement.style.display = 'none';


  const countInterval = setInterval(() => {
    count--;
    if (countdownElement) countdownElement.textContent = count;

    if (count <= 0) {
      clearInterval(countInterval);
      if (countdownElement) countdownElement.style.display = 'none'; // Скрываем цифры
      startGame();
    }
  }, 1000);

  // Обработчик кнопки Cancel на стартовом экране
  if (cancelMathButton) {
      cancelMathButton.onclick = () => {
          clearInterval(countInterval); // Останавливаем отсчет
          window.location.href = 'index.html'; // Возвращаемся в меню
      };
  }
}


// Start the game
function startGame() {
  console.log("Starting Math Game...");
  if (startScreenElement) startScreenElement.style.display = 'none';
  if (gameAreaElement) gameAreaElement.style.display = 'block';
  if (resultsElement) resultsElement.style.display = 'none';

  problemNumber = 1; // Сброс счетчиков
  correctAnswers = 0;
  problems = generateProblems(totalProblems); // Генерируем задачи
  startTime = Date.now(); // Засекаем время старта
  if (timerInterval) clearInterval(timerInterval); // Очищаем старый таймер, если есть
  timerInterval = setInterval(updateTimer, 1000); // Запускаем таймер
  updateTimer(); // Показываем 00:00 сразу

  showProblem(); // Показываем первую задачу

   // Обработчик кнопки Cancel во время игры
   if (cancelGameButton) {
       cancelGameButton.onclick = () => {
           endGame(true); // Завершаем игру с флагом отмены
       };
   }
}

// End the game
function endGame(cancelled = false) {
  console.log("Ending Math Game. Cancelled:", cancelled);
  if (timerInterval) clearInterval(timerInterval); // Останавливаем таймер

   if (gameAreaElement) gameAreaElement.style.display = 'none';
   if (resultsElement) resultsElement.style.display = 'block';


  if (cancelled) {
       // Если игра отменена, просто возвращаемся в меню
       window.location.href = 'index.html';
       return;
  }


  // Рассчитываем время только если игра не отменена
  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsedTime / 60);
  const seconds = elapsedTime % 60;
  const timeString = `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  // Рассчитываем XP (немного изменена логика)
  let xpEarned = Math.floor(correctAnswers * 1.5); // Базовый XP за правильные ответы
  let timeBonus = 0;
  const timeThresholds = [120, 150, 180, 240]; // Секунды
  const bonusXP = [50, 30, 20, 10];

  for (let i = 0; i < timeThresholds.length; i++) {
      if (elapsedTime < timeThresholds[i]) {
          timeBonus = bonusXP[i];
          break;
      }
  }
  xpEarned += timeBonus;

  // Бонус за 100% правильных ответов
  if (correctAnswers === totalProblems) {
      xpEarned += 100; // Значительный бонус
       addResultMessage("Perfect score! +100 XP Bonus!", 'reward');
  } else {
     addResultMessage(`Time Bonus: +${timeBonus} XP`, 'reward');
  }


  // Обновляем user data
  const userData = loadUserData();
  userData.xp += xpEarned;
  userData.stats.intelligence = (userData.stats.intelligence || 0) + Math.floor(correctAnswers / 10); // +1 инт за каждые 10 ответов

  // Проверка левел-апа
  let xpForNextLevel = (userData.level || 1) * 100;
  if (userData.xp >= xpForNextLevel) {
      userData.level++;
      userData.xp -= xpForNextLevel;
       addResultMessage(`Level Up! Reached Level ${userData.level}!`, 'system');
  }

  // Обновляем рекорды
   if (!userData.records) userData.records = {};
   if (!userData.records.mathTime) userData.records.mathTime = [];

   userData.records.mathTime.push({
    date: new Date().toISOString().split('T')[0],
    time: elapsedTime,
    correct: correctAnswers
  });

  // Сортировка и обрезка рекордов
  userData.records.mathTime.sort((a, b) => {
      // Сначала сортируем по кол-ву правильных ответов (убывание)
      if (b.correct !== a.correct) {
          return b.correct - a.correct;
      }
      // Если кол-во ответов равно, сортируем по времени (возрастание)
      return a.time - b.time;
  });
   userData.records.mathTime = userData.records.mathTime.slice(0, 5); // Оставляем топ 5

   // Проверка достижения "Math Wizard"
   if (correctAnswers >= totalProblems && elapsedTime < 240) { // 87 ответов менее чем за 4 минуты
       if (!userData.achievements) userData.achievements = {};
       if (!userData.achievements.mathWizard) {
            userData.achievements.mathWizard = true;
             addResultMessage("Achievement Unlocked: Math Wizard!", 'achievement');
       }
   }

  saveUserData(userData);

  // Отображаем результаты
  if(finalTimeElement) finalTimeElement.textContent = timeString;
  if(correctCountElement) correctCountElement.textContent = `${correctAnswers} / ${totalProblems}`;
  if(xpEarnedElement) xpEarnedElement.textContent = xpEarned;

  // Отображаем рекорды
  displayRecords(userData.records.mathTime);

   // Обработчик кнопки "Назад в меню" на экране результатов
   if(backToMenuButton) {
       backToMenuButton.onclick = () => {
           window.location.href = 'index.html';
       };
   }
}

// Display records in the list
function displayRecords(records) {
    if (!recordsListElement) return;
    recordsListElement.innerHTML = ''; // Clear previous records

    if (records && records.length > 0) {
        records.forEach((record, index) => {
            const mins = Math.floor(record.time / 60);
            const secs = record.time % 60;
            const timeStr = `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            recordItem.textContent = `${index + 1}. ${record.correct}/${totalProblems} in ${timeStr} (${record.date})`;
            recordsListElement.appendChild(recordItem);
        });
    } else {
        recordsListElement.textContent = 'No records yet!';
    }
}

// Function to add messages to the results screen (similar to battle log)
function addResultMessage(message, type = 'info') {
    // Можно добавить отдельный блок для сообщений на экране результатов,
    // или просто выводить их в консоль для отладки
    console.log(`[${type.toUpperCase()}] ${message}`);
    // Пример добавления в DOM (если есть контейнер #result-messages)
    /*
    const msgContainer = document.getElementById('result-messages');
    if (msgContainer) {
        const msgElement = document.createElement('div');
        msgElement.className = `result-message ${type}-message`;
        msgElement.textContent = message;
        msgContainer.appendChild(msgElement);
    }
    */
}


// Handle Enter key press in input field
function handleKeyPress(event) {
  if (event.key === 'Enter') {
      // Предотвращаем стандартное поведение Enter (отправка формы, если она есть)
      event.preventDefault();
      checkAnswer();
  }
}

// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Math Game DOM loaded.");
    // Получаем все нужные DOM элементы
    countdownElement = document.getElementById('countdown');
    startScreenElement = document.getElementById('start-screen');
    gameAreaElement = document.getElementById('game-area');
    timerElement = document.getElementById('timer');
    problemNumberElement = document.getElementById('problem-number');
    mathProblemElement = document.getElementById('math-problem');
    answerInputElement = document.getElementById('answer-input');
    submitAnswerButton = document.getElementById('submit-answer');
    cancelGameButton = document.getElementById('cancel'); // Кнопка Cancel во время игры
    resultsElement = document.getElementById('results');
    finalTimeElement = document.getElementById('final-time');
    correctCountElement = document.getElementById('correct-count');
    xpEarnedElement = document.getElementById('xp-earned');
    recordsListElement = document.getElementById('records-list');
    backToMenuButton = document.getElementById('back-to-menu'); // Кнопка на экране результатов
    cancelMathButton = document.getElementById('cancel-math'); // Кнопка на стартовом экране

    // Добавляем обработчики
    if (submitAnswerButton) submitAnswerButton.addEventListener('click', checkAnswer);
    if (answerInputElement) answerInputElement.addEventListener('keypress', handleKeyPress);

     // Применяем тему
     const savedTheme = localStorage.getItem("preferred-theme");
     document.body.className = (savedTheme || "colorful") + "-theme";


    // Начинаем игру с обратного отсчета
    startCountdown();
});

