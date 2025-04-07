
// Глобальные переменные для состояния боя
let battleInProgress = false;
let playerCurrentHealth = 100;
let enemyCurrentHealth = 100;
let playerMaxHealth = 100; // Базовое значение, может быть изменено баффом
let enemyMaxHealth = 100;
let currentEnemy = null;
let enemyAttackInterval = null;
let healingOrbInterval = null;
let clickCooldown = false;
const clickCooldownTime = 75; // Немного увеличено для стабильности
let battleRewards = [];

// Параметры игрока (базовые, будут пересчитаны)
let playerBaseDamage = 10;
let playerBaseDefense = 1;
let playerHealAmount = 20;
let playerCritChance = 0.05; // Базовый шанс крита 5%
let playerAccuracy = 1.0; // Базовая точность 100%

// DOM Elements (получаем снова, т.к. это отдельный файл)
const battleContainer = document.getElementById('battle-container');
const quizContainer = document.getElementById('battle-quiz-container'); // Для скрытия/показа
const battleMessages = document.getElementById('battle-messages');
const playerHealthElement = document.getElementById('player-health');
const enemyHealthElement = document.getElementById('enemy-health');
const enemyNameElement = document.getElementById('enemy-name');
const enemyLevelElement = document.getElementById('enemy-level');
const enemyTypeElement = document.getElementById('enemy-type');
const enemyCharacterElement = document.getElementById('enemy-character');
const playerCharacterElement = document.getElementById('player-character');
const healingOrbElement = document.getElementById('healing-orb');
const backToMenuButton = document.getElementById('back-to-menu'); // Кнопка Назад

// Enemy definitions (Добавлен Киберволк)
const enemies = [
    { name: 'Slime', type: 'Normal', level: 1, health: 80, attack: 5, defense: 1, attackSpeed: 500, cssClass: 'enemy-slime', rewards: { xp: 15, items: [{ name: 'Slime Goo', icon: '🧪', chance: 0.6 }, { name: 'Potion', icon: '💧', chance: 0.2 }] } },
    { name: 'Goblin', type: 'Forest', level: 2, health: 100, attack: 7, defense: 2, attackSpeed: 450, cssClass: 'enemy-goblin', rewards: { xp: 25, items: [{ name: 'Goblin Ear', icon: '👂', chance: 0.5 }, { name: 'Coins', icon: '💰', chance: 0.4 }] } },
    { name: 'Ghost', type: 'Ethereal', level: 3, health: 120, attack: 8, defense: 3, attackSpeed: 480, cssClass: 'enemy-ghost', rewards: { xp: 35, items: [{ name: 'Ectoplasm', icon: '👻', chance: 0.4 }, { name: 'Scroll', icon: '📜', chance: 0.3 }] } },
    // Добавляем Киберволка для теста (можно сделать боссом)
    { name: 'Cyberwolf', type: 'Tech', level: 5, health: 180, attack: 12, defense: 4, attackSpeed: 400, cssClass: 'enemy-cyberwolf', rewards: { xp: 70, items: [{ name: 'Circuit', icon: '⚙️', chance: 0.5 }, { name: 'Energy Cell', icon: '🔋', chance: 0.3 }] } },
    { name: 'Dragon', type: 'Fire', level: 8, health: 250, attack: 15, defense: 6, attackSpeed: 550, cssClass: 'enemy-dragon', rewards: { xp: 120, items: [{ name: 'Dragon Scale', icon: '🔥', chance: 0.6 }, { name: 'Fire Crystal', icon: '💎', chance: 0.4 }] } },
    { name: 'Dark Lord', type: 'Boss', level: 10, health: 400, attack: 20, defense: 8, attackSpeed: 600, cssClass: 'enemy-boss', rewards: { xp: 250, items: [{ name: 'Shadow Orb', icon: '🔮', chance: 0.8 }, { name: 'Dark Armor Piece', icon: '🛡️', chance: 0.5 }, { name: 'Legendary Shard', icon: '⚔️', chance: 0.3 }] } }
];


// Load user data (простая версия, предполагаем что она глобальна или передается)
// В реальном приложении лучше использовать импорт/экспорт или общую библиотеку
function loadUserDataBattle() {
    const savedData = localStorage.getItem('brainTrainingUserData');
    if (savedData) {
        try {
            // Добавляем проверки на существование полей перед их использованием
            const parsedData = JSON.parse(savedData);
            if (!parsedData.stats) parsedData.stats = {};
             if (!parsedData.equipment) parsedData.equipment = { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' };
             if (!parsedData.inventory) parsedData.inventory = [];
             if (!parsedData.room) parsedData.room = { theme: 'default', items: [] };
             if (parsedData.level === undefined) parsedData.level = 1;
             if (parsedData.xp === undefined) parsedData.xp = 0;
             if (parsedData.lives === undefined) parsedData.lives = 5;
            return parsedData;
        } catch(e) {
            console.error("Error parsing user data in battle.js:", e);
            // Возвращаем минимальные дефолтные данные для продолжения работы
             return { level: 1, xp: 0, lives: 5, stats: { intelligence: 10, sports: 5, health: 10 }, equipment: { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' }, inventory: [] };
        }
    }
    // Возвращаем минимальные дефолтные данные, если в localStorage ничего нет
    return { level: 1, xp: 0, lives: 5, stats: { intelligence: 10, sports: 5, health: 10 }, equipment: { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' }, inventory: [] };
}

// Save user data
function saveUserDataBattle(userData) {
     localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
}


// Update the player character appearance in battle
// Эта функция теперь просто устанавливает класс, а вид определяется CSS
function updatePlayerAppearanceBattle() {
    if (!playerCharacterElement) return;

    // Устанавливаем базовый класс и класс для изображения из CSS
    // Имя класса 'player-image-m11' можно изменить, если нужно
    playerCharacterElement.className = 'character-container player-image-m11';

    console.log("Player appearance set for battle (using CSS background).");
}


// Calculate player stats based on base values, stats, equipment, and buffs
function calculatePlayerStatsBattle(userData, battleEffect) {
    let calculatedDamage = playerBaseDamage;
    let calculatedDefense = playerBaseDefense;
    let calculatedHeal = playerHealAmount;
    let calculatedCritChance = playerCritChance;
    let calculatedAccuracy = playerAccuracy;
    let calculatedMaxHealth = 100; // Начинаем с базовых 100
    let enemySpeedMultiplier = 1.0; // Множитель скорости врага (для дебаффа)

    // Убедимся, что userData и userData.stats существуют
    userData = userData || {};
    userData.stats = userData.stats || {};
    userData.equipment = userData.equipment || {};

    // 1. Учитываем статы игрока
    calculatedDamage += Math.floor((userData.stats.sports || 0) / 2);
    calculatedDefense += Math.floor((userData.stats.health || 0) / 5);
    calculatedHeal += Math.floor((userData.stats.intelligence || 0) / 3);
    calculatedCritChance += (userData.stats.creativity || 0) * 0.002;
    calculatedMaxHealth += (userData.stats.health || 0) * 2;

    // 2. Учитываем экипировку
    const equipment = userData.equipment;
    if (equipment.weapon === 'sword') calculatedDamage += 5;
    else if (equipment.weapon === 'staff') { calculatedDamage += 3; calculatedHeal += 5; }
    else if (equipment.weapon === 'bow') { calculatedDamage += 4; calculatedCritChance += 0.05; }
    if (equipment.outfit === 'warrior') { calculatedDefense += 3; calculatedDamage += 2; calculatedMaxHealth += 15;}
    else if (equipment.outfit === 'mage') { calculatedDefense += 1; calculatedHeal += 8; calculatedMaxHealth += 5;}
    else if (equipment.outfit === 'formal') calculatedDefense += 2;
    if (equipment.headgear === 'helmet') calculatedDefense += 2;
    else if (equipment.headgear === 'crown') { calculatedDamage += 2; calculatedCritChance += 0.02;}
    else if (equipment.headgear === 'hat') calculatedDefense += 1;

     // 3. Применяем баффы/дебаффы из квиза
     let quizEffectMessage = null;
     if (battleEffect) {
         console.log("Applying battle effect:", battleEffect);
         quizEffectMessage = `Quiz Effect: ${battleEffect.text}!`; // Сообщение об эффекте
         switch (battleEffect.type) {
             case 'damage': calculatedDamage *= battleEffect.multiplier; break;
             case 'healing': calculatedHeal *= battleEffect.multiplier; break;
             case 'defense': calculatedDefense *= battleEffect.multiplier; break;
             case 'health_boost': calculatedMaxHealth += battleEffect.value; break;
             case 'crit_chance': calculatedCritChance += battleEffect.value; break;
             case 'speed_debuff': enemySpeedMultiplier = battleEffect.value; break;
             // Добавить другие типы эффектов, если нужно
         }
     }

    // Округляем значения
    calculatedDamage = Math.max(1, Math.floor(calculatedDamage));
    calculatedDefense = Math.max(0, Math.floor(calculatedDefense));
    calculatedHeal = Math.max(1, Math.floor(calculatedHeal));
    calculatedMaxHealth = Math.max(10, Math.floor(calculatedMaxHealth)); // Мин. здоровье

    // Возвращаем рассчитанные статы и множитель скорости врага
     return {
         damage: calculatedDamage,
         defense: calculatedDefense,
         heal: calculatedHeal,
         critChance: Math.min(1, calculatedCritChance), // Не больше 100%
         accuracy: calculatedAccuracy, // Пока не меняется
         maxHealth: calculatedMaxHealth,
         enemySpeedMultiplier: enemySpeedMultiplier,
         quizEffectMessage: quizEffectMessage
     };
}


// Set up a new enemy
function setupEnemy(playerLevel, speedMultiplier = 1.0) {
    // Выбираем врага, уровень которого не сильно превышает уровень игрока
    const availableEnemies = enemies.filter(enemy => enemy.level <= playerLevel + 2);
    let selectedEnemyData;

    if (availableEnemies.length === 0) {
        selectedEnemyData = { ...enemies[0] }; // Копируем данные первого врага
    } else {
        const randomIndex = Math.floor(Math.random() * availableEnemies.length);
        selectedEnemyData = { ...availableEnemies[randomIndex] }; // Копируем данные врага
    }

    // Применяем множитель скорости от дебаффа квиза
    selectedEnemyData.attackSpeed = Math.max(100, Math.floor(selectedEnemyData.attackSpeed / speedMultiplier));

    currentEnemy = selectedEnemyData; // Сохраняем текущего врага

    // Устанавливаем здоровье врага
    enemyMaxHealth = currentEnemy.health;
    enemyCurrentHealth = enemyMaxHealth;

    // Обновляем UI врага
    if (enemyNameElement) enemyNameElement.textContent = currentEnemy.name;
    if (enemyLevelElement) enemyLevelElement.textContent = 'Level: ' + currentEnemy.level;
    if (enemyTypeElement) enemyTypeElement.textContent = 'Type: ' + currentEnemy.type;

    // Применяем внешний вид врага (класс из CSS)
    if (enemyCharacterElement) {
        enemyCharacterElement.className = 'enemy-container ' + currentEnemy.cssClass;
    }
    console.log("Enemy setup:", currentEnemy.name, "Attack Speed:", currentEnemy.attackSpeed);
}

// Add a message to the battle log
function addBattleMessage(type, message) {
    if (!battleMessages) return;
    const messageElement = document.createElement('div');
    messageElement.className = `battle-message ${type}-message`;
    messageElement.textContent = message;
    battleMessages.appendChild(messageElement);
    // Auto-scroll to bottom
    setTimeout(() => { battleMessages.scrollTop = battleMessages.scrollHeight; }, 50);
}

// Show damage number animation
function showDamageNumber(targetElement, amount, isHeal = false, isCrit = false) {
    if (!targetElement || !battleContainer) return; // Добавлена проверка battleContainer

    const numberElement = document.createElement('div');
    // Используем классы из CSS
    numberElement.className = isHeal ? 'heal-number' : 'damage-number';
    if (isCrit) {
        numberElement.classList.add('crit'); // Добавляем класс крита
        numberElement.textContent = (isHeal ? '+' : '') + amount + '💥'; // Символ крита
    } else {
        numberElement.textContent = (isHeal ? '+' : '-') + amount;
    }
     // Добавляем classList 'crit' если нужно

    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = battleContainer.getBoundingClientRect();
    const randomX = Math.random() * (targetRect.width * 0.6) + (targetRect.width * 0.2);
    const startY = targetRect.top - containerRect.top + targetRect.height * 0.3;
    const startX = targetRect.left - containerRect.left + randomX;

    numberElement.style.position = 'absolute';
    numberElement.style.left = `${startX}px`;
    numberElement.style.top = `${startY}px`;
    numberElement.style.zIndex = '101'; // Выше чем орб

    battleContainer.appendChild(numberElement);

    // Анимация и удаление (упрощенный вариант без Animate API для совместимости)
     let currentTop = startY;
     let currentOpacity = 1;
     let currentScale = 1;
     const animationInterval = setInterval(() => {
         currentTop -= 2; // Двигаем вверх
         currentOpacity -= 0.03; // Уменьшаем прозрачность
         currentScale += (isCrit ? 0.01 : 0); // Немного увеличиваем крит

         numberElement.style.top = `${currentTop}px`;
         numberElement.style.opacity = currentOpacity;
         numberElement.style.transform = `scale(${currentScale})`;

         if (currentOpacity <= 0) {
             clearInterval(animationInterval);
             numberElement.remove();
         }
     }, 25); // Частота обновления анимации
}


// Обновление полоски здоровья с изменением цвета
function updateHealthBar(element, current, max) {
    if (!element) return;
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    element.style.width = percentage + '%';
    element.classList.remove('low', 'critical');
    if (percentage < 25) { element.classList.add('critical'); }
    else if (percentage < 50) { element.classList.add('low'); }
}

// Player attack function (triggered by clicking on enemy)
function playerAttack() {
    if (!battleInProgress || clickCooldown || !currentEnemy || enemyCurrentHealth <= 0 || playerCurrentHealth <= 0) return;

    clickCooldown = true;
    setTimeout(() => { clickCooldown = false; }, clickCooldownTime);

    if (playerCharacterElement) { // Анимация атаки игрока
        playerCharacterElement.classList.remove('attack-animation'); // Убираем на случай если осталась
        void playerCharacterElement.offsetWidth; // Форсируем перерисовку
        playerCharacterElement.classList.add('attack-animation');
        setTimeout(() => playerCharacterElement.classList.remove('attack-animation'), 400); // Длительность анимации
    }

    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);

    if (Math.random() > playerStats.accuracy) { // Промах
        addBattleMessage('system', "You missed!");
        showDamageNumber(enemyCharacterElement, 'Miss', false);
        return;
    }

    const isCrit = Math.random() < playerStats.critChance; // Крит
    let damage = playerStats.damage;
    if (isCrit) { damage = Math.floor(damage * 1.5); }

    const enemyDefenseFactor = 1 - Math.min(0.8, (currentEnemy.defense || 0) * 0.05); // Защита врага
    damage = Math.max(1, Math.floor(damage * enemyDefenseFactor));

    if (enemyCharacterElement) { // Анимация урона врага
         enemyCharacterElement.classList.remove('damaged-animation');
         void enemyCharacterElement.offsetWidth;
         enemyCharacterElement.classList.add('damaged-animation');
         setTimeout(() => enemyCharacterElement.classList.remove('damaged-animation'), 400);
    }

    showDamageNumber(enemyCharacterElement, damage, false, isCrit); // Показываем урон

    enemyCurrentHealth = Math.max(0, enemyCurrentHealth - damage); // Уменьшаем HP врага
    updateHealthBar(enemyHealthElement, enemyCurrentHealth, enemyMaxHealth);

    if (enemyCurrentHealth <= 0) { // Проверка победы
        battleVictory();
    }
}


// Enemy attack function (automatic interval)
function enemyAttack() {
    if (!battleInProgress || !currentEnemy || enemyCurrentHealth <= 0 || playerCurrentHealth <= 0) {
       if (enemyAttackInterval) clearInterval(enemyAttackInterval);
       return;
    }

    if (enemyCharacterElement) { // Анимация атаки врага
         enemyCharacterElement.classList.remove('attack-animation');
         void enemyCharacterElement.offsetWidth;
         enemyCharacterElement.classList.add('attack-animation');
         setTimeout(() => enemyCharacterElement.classList.remove('attack-animation'), 400);
    }

    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect); // Нужна защита игрока

    let damage = currentEnemy.attack || 5; // Урон врага
    damage = Math.floor(damage * (0.9 + Math.random() * 0.2)); // +/- 10%

    const playerDefenseFactor = 1 - Math.min(0.8, playerStats.defense * 0.05); // Защита игрока
    damage = Math.max(1, Math.floor(damage * playerDefenseFactor));

    if (playerCharacterElement) { // Анимация урона игрока
         playerCharacterElement.classList.remove('damaged-animation');
         void playerCharacterElement.offsetWidth;
         playerCharacterElement.classList.add('damaged-animation');
         setTimeout(() => playerCharacterElement.classList.remove('damaged-animation'), 400);
    }

    showDamageNumber(playerCharacterElement, damage); // Показываем урон

    playerCurrentHealth = Math.max(0, playerCurrentHealth - damage); // Уменьшаем HP игрока
    updateHealthBar(playerHealthElement, playerCurrentHealth, playerStats.maxHealth);

    if (playerCurrentHealth <= 0) { // Проверка поражения
        battleDefeat();
    }
}

// Show healing orb
function showHealingOrb() {
    if (!battleInProgress || !healingOrbElement || !battleContainer) return;
    const containerRect = battleContainer.getBoundingClientRect();
    if (!containerRect.width || !containerRect.height) return; // Не показываем, если контейнер не виден
    const orbSize = 40;
    const maxX = containerRect.width - orbSize - 20;
    const maxY = containerRect.height - orbSize - 20;
    const minX = 20;
    const minY = 20;

    const randomX = Math.floor(Math.random() * (maxX - minX + 1) + minX); // Исправлено для включения границ
    const randomY = Math.floor(Math.random() * (maxY - minY + 1) + minY);

    healingOrbElement.style.left = randomX + 'px';
    healingOrbElement.style.top = randomY + 'px';
    healingOrbElement.style.display = 'flex';

    setTimeout(() => { if (healingOrbElement.style.display !== 'none') { healingOrbElement.style.display = 'none'; } }, 2000);
}

// Handle healing orb click
function healPlayer() {
    if (!battleInProgress || playerCurrentHealth <= 0 || !healingOrbElement) return;
    if (healingOrbElement.style.display === 'none') return; // Не обрабатываем клик по скрытому орбу

    healingOrbElement.style.display = 'none';

    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);
    const healValue = playerStats.heal;

    if (playerCurrentHealth >= playerStats.maxHealth) return; // Уже полное здоровье

    const healedAmount = Math.min(healValue, playerStats.maxHealth - playerCurrentHealth);
    playerCurrentHealth += healedAmount;

    updateHealthBar(playerHealthElement, playerCurrentHealth, playerStats.maxHealth);
    showDamageNumber(playerCharacterElement, healedAmount, true);
    addBattleMessage('player', `You healed for ${healedAmount} HP.`);
}

// --- Battle Outcome Functions ---

function endBattleCleanup() {
    console.log("Cleaning up battle intervals...");
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    if (healingOrbInterval) clearInterval(healingOrbInterval);
    enemyAttackInterval = null;
    healingOrbInterval = null;
    battleInProgress = false;
    if (healingOrbElement) healingOrbElement.style.display = 'none';
    if (enemyCharacterElement) enemyCharacterElement.removeEventListener('click', playerAttack);
}

function battleVictory() {
    if (!battleInProgress) return;
    const enemyName = currentEnemy ? currentEnemy.name : 'the enemy'; // Получаем имя врага
    addBattleMessage('system', `You defeated ${enemyName}!`);
    endBattleCleanup();

    calculateRewards();

    const userData = loadUserDataBattle();
    let levelUp = false;
    const xpGained = (currentEnemy && currentEnemy.rewards && currentEnemy.rewards.xp) ? currentEnemy.rewards.xp : 10; // XP за врага

    userData.xp = (userData.xp || 0) + xpGained;
    addBattleMessage('reward', `🏆 Gained ${xpGained} XP`);

    let xpForNextLevel = (userData.level || 1) * 100;
    while (userData.xp >= xpForNextLevel) {
        userData.level++;
        userData.xp -= xpForNextLevel;
        levelUp = true;
        addBattleMessage('system', `Level up! You are now level ${userData.level}!`);
        xpForNextLevel = userData.level * 100;

        const stats = ['intelligence', 'sports', 'languages', 'energy', 'creativity', 'health'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        userData.stats[randomStat] = (userData.stats[randomStat] || 0) + 1;
        addBattleMessage('system', `Your ${randomStat} increased by 1!`);
    }

    if (!userData.inventory) userData.inventory = [];
    battleRewards.forEach(reward => {
        const existingItem = userData.inventory.find(item => item.name === reward.name && item.type !== 'weapon'); // Оружие не стакаем
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            userData.inventory.push({ ...reward, quantity: 1 }); // Добавляем новый предмет
        }
    });

    saveUserDataBattle(userData);

     // Показываем кнопку "Назад"
     if(backToMenuButton) backToMenuButton.style.display = 'inline-block';

    // Возвращаемся к квизу для следующего боя через 4 секунды
     setTimeout(() => {
         addBattleMessage('system', 'Prepare for the next battle...');
         // Убедимся, что initBattleQuiz существует перед вызовом
         if (typeof initBattleQuiz === 'function') {
             initBattleQuiz();
         } else {
             console.error("initBattleQuiz is not defined!");
             // Можно просто перезагрузить страницу как запасной вариант
             // window.location.reload();
         }
     }, 4000);
}

function battleDefeat() {
    if (!battleInProgress) return;
     const enemyName = currentEnemy ? currentEnemy.name : 'the enemy';
    addBattleMessage('system', `You were defeated by ${enemyName}!`);
    endBattleCleanup();

    const userData = loadUserDataBattle();
    if (userData.lives > 0) {
        userData.lives -= 1;
        addBattleMessage('system', `You lost a life! Lives remaining: ${userData.lives}`);
    } else {
        addBattleMessage('system', 'You are out of lives! Come back tomorrow.');
    }
    saveUserDataBattle(userData);

     // Показываем кнопку "Назад"
    if(backToMenuButton) backToMenuButton.style.display = 'inline-block';

     setTimeout(() => {
        if (userData.lives > 0) {
             addBattleMessage('system', 'Try again...');
              // Возвращаемся к квизу через 4 секунды
             if (typeof initBattleQuiz === 'function') {
                 initBattleQuiz();
             } else {
                 console.error("initBattleQuiz is not defined!");
             }
        } else {
            addBattleMessage('system', 'Return to the menu.');
        }
    }, 4000);
}

// Calculate and display battle rewards
function calculateRewards() {
    battleRewards = [];
    if (!currentEnemy || !currentEnemy.rewards) return;
    const rewardsData = currentEnemy.rewards;

    if (rewardsData.items && Array.isArray(rewardsData.items)) {
        rewardsData.items.forEach(item => {
            if (Math.random() < item.chance) {
                 const reward = { name: item.name, icon: item.icon, type: 'item' };
                 battleRewards.push(reward);
                 addBattleMessage('reward', `${item.icon} Found ${item.name}`);
            }
        });
    }

    if (Math.random() < 0.05) { // 5% шанс на оружие
        const weapons = ['sword', 'staff', 'bow'];
        const randomWeapon = weapons[Math.floor(Math.random() * weapons.length)];
        const weaponIcons = { 'sword': '🗡️', 'staff': '🔮', 'bow': '🏹' };
        const weaponName = randomWeapon.charAt(0).toUpperCase() + randomWeapon.slice(1);
        const reward = { name: weaponName, icon: weaponIcons[randomWeapon], type: 'weapon' };
        battleRewards.push(reward);
        addBattleMessage('reward', `${weaponIcons[randomWeapon]} Rare drop: ${weaponName}!`);
    }
     console.log("Calculated rewards:", battleRewards);
}

// --- Main Battle Initialization ---

// Эта функция вызывается из battle_quiz.js после ответа на квиз
window.startBattleInternal = function() {
    console.log("Starting battle internal logic...");
    const userData = loadUserDataBattle();

    if (userData.lives <= 0) {
        addBattleMessage('system', 'You have no lives left! Come back tomorrow.');
        if(backToMenuButton) backToMenuButton.style.display = 'inline-block';
        return;
    }

    battleInProgress = true;
    if (battleMessages) battleMessages.innerHTML = '';
    battleRewards = [];

    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    localStorage.removeItem('battleEffect');

    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);
    playerMaxHealth = playerStats.maxHealth;
    playerCurrentHealth = playerMaxHealth;

    updateHealthBar(playerHealthElement, playerCurrentHealth, playerMaxHealth);

    if (playerStats.quizEffectMessage) { addBattleMessage('system', playerStats.quizEffectMessage); }

    setupEnemy(userData.level, playerStats.enemySpeedMultiplier);
    updateHealthBar(enemyHealthElement, enemyCurrentHealth, enemyMaxHealth);

    addBattleMessage('system', `A wild ${currentEnemy.name} (Lv. ${currentEnemy.level}) appears!`);
    addBattleMessage('system', `Click on the enemy to attack!`);

    if (enemyCharacterElement) { // Назначаем слушатель клика врагу
        enemyCharacterElement.removeEventListener('click', playerAttack);
        enemyCharacterElement.addEventListener('click', playerAttack);
    }
     if (healingOrbElement) { // Назначаем слушатель клика орбу
         healingOrbElement.removeEventListener('click', healPlayer);
         healingOrbElement.addEventListener('click', healPlayer);
    }


    if (enemyAttackInterval) clearInterval(enemyAttackInterval); // Очистка старых интервалов
    if (healingOrbInterval) clearInterval(healingOrbInterval);

    enemyAttackInterval = setInterval(enemyAttack, currentEnemy.attackSpeed);
    healingOrbInterval = setInterval(showHealingOrb, 4000 + Math.random() * 4000);

    if(backToMenuButton) backToMenuButton.style.display = 'none'; // Скрываем "Назад" во время боя

     console.log("Battle started. Player HP:", playerCurrentHealth, "/", playerMaxHealth, "Enemy HP:", enemyCurrentHealth, "/", enemyMaxHealth);
};

// --- Initialization when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Battle page DOM loaded.");
    // Обновляем внешний вид игрока сразу
    updatePlayerAppearanceBattle();

    // Вызываем инициализацию квиза из battle_quiz.js
    // Убедимся что battle_quiz.js уже загружен и функция доступна
    if (typeof initBattleQuiz === 'function') {
        initBattleQuiz();
    } else {
        console.error("initBattleQuiz function not found! Make sure battle_quiz.js is loaded before battle.js");
        // Запасной вариант: можно попробовать вызвать чуть позже
        // setTimeout(() => {
        //     if (typeof initBattleQuiz === 'function') initBattleQuiz();
        //     else console.error("initBattleQuiz still not found!");
        // }, 100);
    }

    // Функция очистки для кнопки "Назад"
    window.endBattleCleanup = endBattleCleanup;

});

