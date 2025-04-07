
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
function updatePlayerAppearanceBattle() {
    const userData = loadUserDataBattle();
    const equipment = userData.equipment || {}; // Убедимся что equipment существует

    if (!playerCharacterElement) return;

    // Базовые классы
    playerCharacterElement.className = 'character-container'; // Сброс классов

    // Применяем скин
    playerCharacterElement.classList.add(`skin-${equipment.skin || 'light'}`);

    // Применяем одежду
    if (equipment.outfit && equipment.outfit !== 'none') {
        playerCharacterElement.classList.add(`outfit-${equipment.outfit}`);
    }

    // Применяем головной убор
    if (equipment.headgear && equipment.headgear !== 'none') {
        playerCharacterElement.classList.add(`headgear-${equipment.headgear}`);
    }

    // Применяем оружие
    if (equipment.weapon && equipment.weapon !== 'none') {
        playerCharacterElement.classList.add(`weapon-${equipment.weapon}`);
    }

    // Создаем или обновляем внутренние слои персонажа (из character.css)
    // Это гарантирует, что структура всегда есть
     playerCharacterElement.innerHTML = `
        <div id="player-body" class="char-layer"></div>
        <div id="player-outfit" class="char-layer"></div>
        <div id="player-head" class="char-layer"></div>
        <div id="player-face" class="char-layer">
            <div id="player-mouth"></div>
        </div>
        <div id="player-headgear" class="char-layer"></div>
        <div id="player-weapon" class="char-layer"></div>
    `;
     console.log("Player appearance updated with classes:", playerCharacterElement.className);
}

// Calculate player stats based on base values, stats, equipment, and buffs
function calculatePlayerStatsBattle(userData, battleEffect) {
    let calculatedDamage = playerBaseDamage;
    let calculatedDefense = playerBaseDefense;
    let calculatedHeal = playerHealAmount;
    let calculatedCritChance = playerCritChance;
    let calculatedAccuracy = playerAccuracy;
    let calculatedMaxHealth = playerMaxHealth;
    let enemySpeedMultiplier = 1.0; // Множитель скорости врага (для дебаффа)

    // 1. Учитываем статы игрока
    calculatedDamage += Math.floor((userData.stats.sports || 0) / 2);
    calculatedDefense += Math.floor((userData.stats.health || 0) / 5);
    calculatedHeal += Math.floor((userData.stats.intelligence || 0) / 3);
    calculatedCritChance += (userData.stats.creativity || 0) * 0.002; // Креативность дает немного крита
    calculatedMaxHealth += (userData.stats.health || 0) * 2; // Здоровье увеличивает макс. HP

    // 2. Учитываем экипировку
    const equipment = userData.equipment || {};
    // Оружие
    if (equipment.weapon === 'sword') calculatedDamage += 5;
    else if (equipment.weapon === 'staff') { calculatedDamage += 3; calculatedHeal += 5; }
    else if (equipment.weapon === 'bow') { calculatedDamage += 4; calculatedCritChance += 0.05; }
    // Одежда
    if (equipment.outfit === 'warrior') { calculatedDefense += 3; calculatedDamage += 2; calculatedMaxHealth += 15;}
    else if (equipment.outfit === 'mage') { calculatedDefense += 1; calculatedHeal += 8; calculatedMaxHealth += 5;}
    else if (equipment.outfit === 'formal') calculatedDefense += 2;
    // Головной убор
    if (equipment.headgear === 'helmet') calculatedDefense += 2;
    else if (equipment.headgear === 'crown') { calculatedDamage += 2; calculatedCritChance += 0.02;}
    else if (equipment.headgear === 'hat') calculatedDefense += 1;

     // 3. Применяем баффы/дебаффы из квиза
     let quizEffectMessage = null;
     if (battleEffect) {
         console.log("Applying battle effect:", battleEffect);
         quizEffectMessage = `Quiz Effect: ${battleEffect.text}!`; // Сообщение об эффекте
         switch (battleEffect.type) {
             case 'damage':
                 calculatedDamage *= battleEffect.multiplier;
                 break;
             case 'healing':
                 calculatedHeal *= battleEffect.multiplier;
                 break;
             case 'defense':
                 calculatedDefense *= battleEffect.multiplier;
                 break;
             case 'health_boost':
                  calculatedMaxHealth += battleEffect.value;
                  break;
             case 'crit_chance':
                 calculatedCritChance += battleEffect.value;
                 break;
             case 'speed_debuff': // Это влияет на скорость врага
                 enemySpeedMultiplier = battleEffect.value;
                 break;
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
        // Если подходящих нет, берем первого врага
        selectedEnemyData = { ...enemies[0] };
    } else {
        // Случайный выбор из доступных
        const randomIndex = Math.floor(Math.random() * availableEnemies.length);
        selectedEnemyData = { ...availableEnemies[randomIndex] }; // Копируем данные врага
    }

    // Применяем множитель скорости от дебаффа квиза
    // Уменьшаем attackSpeed (интервал), если множитель > 1 (враг быстрее)
    selectedEnemyData.attackSpeed = Math.max(100, Math.floor(selectedEnemyData.attackSpeed / speedMultiplier)); // Мин. интервал 100мс

    currentEnemy = selectedEnemyData; // Сохраняем текущего врага

    // Устанавливаем здоровье врага
    enemyMaxHealth = currentEnemy.health;
    enemyCurrentHealth = enemyMaxHealth;

    // Обновляем UI врага
    if (enemyNameElement) enemyNameElement.textContent = currentEnemy.name;
    if (enemyLevelElement) enemyLevelElement.textContent = 'Level: ' + currentEnemy.level;
    if (enemyTypeElement) enemyTypeElement.textContent = 'Type: ' + currentEnemy.type;

    // Применяем внешний вид врага
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
    // Добавляем небольшую задержку для корректной прокрутки после добавления элемента
    setTimeout(() => {
        battleMessages.scrollTop = battleMessages.scrollHeight;
    }, 50);
}

// Show damage number animation
function showDamageNumber(targetElement, amount, isHeal = false, isCrit = false) {
    if (!targetElement) return;

    const numberElement = document.createElement('div');
    numberElement.className = isHeal ? 'heal-number' : 'damage-number';
    numberElement.textContent = (isHeal ? '+' : '-') + amount;

    if (isCrit) {
        numberElement.textContent += '💥'; // Индикация крита
        numberElement.style.fontSize = '24px'; // Крупнее для крита
        numberElement.style.color = isHeal ? '#00ff00' : '#ff4444'; // Ярче цвет крита
        numberElement.style.fontWeight = 'bold';
    }

    // Позиционирование числа
    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = battleContainer.getBoundingClientRect(); // Относительно контейнера боя
    const randomX = Math.random() * (targetRect.width * 0.6) + (targetRect.width * 0.2); // Случайно по ширине цели
    const startY = targetRect.top - containerRect.top + targetRect.height * 0.3; // Начальная позиция Y

    numberElement.style.position = 'absolute'; // Убедимся что позиционирование абсолютное
    numberElement.style.left = `${targetRect.left - containerRect.left + randomX}px`;
    numberElement.style.top = `${startY}px`;

    battleContainer.appendChild(numberElement); // Добавляем в общий контейнер боя

    // Анимация и удаление
    numberElement.animate([
        { transform: 'translateY(0) scale(1)', opacity: 1 },
        { transform: `translateY(-50px) scale(1.2)`, opacity: 0.8 }, // Подъем и увеличение
        { transform: `translateY(-80px) scale(0.8)`, opacity: 0 } // Исчезновение
    ], {
        duration: 1200, // Длительность анимации
        easing: 'ease-out'
    }).onfinish = () => {
        numberElement.remove(); // Удаляем элемент после анимации
    };
}

// Обновление полоски здоровья с изменением цвета
function updateHealthBar(element, current, max) {
    if (!element) return;
    const percentage = Math.max(0, Math.min(100, (current / max) * 100));
    element.style.width = percentage + '%';

    // Убираем старые классы цвета
    element.classList.remove('low', 'critical');

    // Добавляем новые классы для цвета
    if (percentage < 25) {
        element.classList.add('critical');
    } else if (percentage < 50) {
        element.classList.add('low');
    }
}

// Player attack function (triggered by clicking on enemy)
function playerAttack() {
    if (!battleInProgress || clickCooldown || !currentEnemy || enemyCurrentHealth <= 0 || playerCurrentHealth <= 0) return;

    clickCooldown = true;
    setTimeout(() => { clickCooldown = false; }, clickCooldownTime);

    // Анимация атаки игрока
    if (playerCharacterElement) {
        playerCharacterElement.classList.add('attack-animation');
        setTimeout(() => playerCharacterElement.classList.remove('attack-animation'), 300);
    }

    // Получаем текущие статы игрока (они могли измениться)
    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null'); // Загружаем эффект квиза
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);

    // Проверка на промах (если точность < 100%)
    if (Math.random() > playerStats.accuracy) {
        addBattleMessage('system', "You missed!");
        showDamageNumber(enemyCharacterElement, 'Miss', false); // Показываем "Miss"
        return; // Атака не прошла
    }

    // Проверка на крит
    const isCrit = Math.random() < playerStats.critChance;
    let damage = playerStats.damage;
    if (isCrit) {
        damage = Math.floor(damage * 1.5); // Увеличиваем урон при крите (можно сделать 2x)
    }

     // Уменьшаем урон на защиту врага (защита снижает урон на процент)
    const enemyDefenseFactor = 1 - Math.min(0.8, (currentEnemy.defense || 0) * 0.05); // Защита снижает урон, макс 80%
    damage = Math.max(1, Math.floor(damage * enemyDefenseFactor));

    // Анимация получения урона врагом
    if (enemyCharacterElement) {
        enemyCharacterElement.classList.add('damaged-animation');
        setTimeout(() => enemyCharacterElement.classList.remove('damaged-animation'), 300);
    }

    // Показываем число урона
    showDamageNumber(enemyCharacterElement, damage, false, isCrit);

    // Уменьшаем здоровье врага
    enemyCurrentHealth = Math.max(0, enemyCurrentHealth - damage);
    updateHealthBar(enemyHealthElement, enemyCurrentHealth, enemyMaxHealth);
    // addBattleMessage('player', `You hit ${currentEnemy.name} for ${damage} damage` + (isCrit ? ' (CRIT!)' : ''));

    // Проверка на победу
    if (enemyCurrentHealth <= 0) {
        battleVictory();
    }
}


// Enemy attack function (automatic interval)
function enemyAttack() {
    if (!battleInProgress || !currentEnemy || enemyCurrentHealth <= 0 || playerCurrentHealth <= 0) {
       // Останавливаем интервал, если бой закончился или что-то пошло не так
       if (enemyAttackInterval) clearInterval(enemyAttackInterval);
       return;
    }

    // Анимация атаки врага
    if (enemyCharacterElement) {
        enemyCharacterElement.classList.add('attack-animation');
        setTimeout(() => enemyCharacterElement.classList.remove('attack-animation'), 300);
    }

     // Получаем текущие статы игрока (особенно защиту)
    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);

     // Расчет урона врага
    let damage = currentEnemy.attack || 5; // Базовый урон врага
    // Можно добавить вариативность урона врага
    damage = Math.floor(damage * (0.9 + Math.random() * 0.2)); // +/- 10% урона

    // Учитываем защиту игрока
    const playerDefenseFactor = 1 - Math.min(0.8, playerStats.defense * 0.05);
    damage = Math.max(1, Math.floor(damage * playerDefenseFactor));

    // Анимация получения урона игроком
     if (playerCharacterElement) {
        playerCharacterElement.classList.add('damaged-animation');
        setTimeout(() => playerCharacterElement.classList.remove('damaged-animation'), 300);
    }

    // Показываем число урона
    showDamageNumber(playerCharacterElement, damage);

    // Уменьшаем здоровье игрока
    playerCurrentHealth = Math.max(0, playerCurrentHealth - damage);
    updateHealthBar(playerHealthElement, playerCurrentHealth, playerStats.maxHealth); // Используем рассчитанное maxHealth
    // addBattleMessage('enemy', `${currentEnemy.name} hits you for ${damage} damage!`);


    // Проверка на поражение
    if (playerCurrentHealth <= 0) {
        battleDefeat();
    }
}

// Show healing orb
function showHealingOrb() {
    if (!battleInProgress || !healingOrbElement || !battleContainer) return;

    // Random position within the battle container
    const containerRect = battleContainer.getBoundingClientRect();
    const orbSize = 40;
    // Ограничиваем позицию, чтобы орб не вылезал за края
    const maxX = containerRect.width - orbSize - 20; // 20px отступ справа
    const maxY = containerRect.height - orbSize - 20; // 20px отступ снизу
    const minX = 20; // 20px отступ слева
    const minY = 20; // 20px отступ сверху


    const randomX = Math.floor(Math.random() * (maxX - minX) + minX);
    const randomY = Math.floor(Math.random() * (maxY - minY) + minY);

    healingOrbElement.style.left = randomX + 'px';
    healingOrbElement.style.top = randomY + 'px';
    healingOrbElement.style.display = 'flex';

    // Auto hide after 2 seconds
    setTimeout(() => {
        if (healingOrbElement.style.display !== 'none') {
            healingOrbElement.style.display = 'none';
        }
    }, 2000);
}

// Handle healing orb click
function healPlayer() {
    if (!battleInProgress || playerCurrentHealth <= 0 || !healingOrbElement) return;

    healingOrbElement.style.display = 'none'; // Сразу скрываем орб

     // Получаем текущие статы игрока (особенно лечение)
    const userData = loadUserDataBattle();
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);
    const healValue = playerStats.heal;

    // Не лечим, если здоровье полное
    if (playerCurrentHealth >= playerStats.maxHealth) return;

    const healedAmount = Math.min(healValue, playerStats.maxHealth - playerCurrentHealth); // Не лечим больше максимума
    playerCurrentHealth += healedAmount;

    // Update health bar
    updateHealthBar(playerHealthElement, playerCurrentHealth, playerStats.maxHealth);

    // Show healing effect
    showDamageNumber(playerCharacterElement, healedAmount, true);
    addBattleMessage('player', `You healed for ${healedAmount} HP.`);
}

// --- Battle Outcome Functions ---

// Очистка интервалов и состояния боя
function endBattleCleanup() {
    console.log("Cleaning up battle intervals...");
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    if (healingOrbInterval) clearInterval(healingOrbInterval);
    enemyAttackInterval = null;
    healingOrbInterval = null;
    battleInProgress = false;
    // Скрываем орб
    if (healingOrbElement) healingOrbElement.style.display = 'none';
     // Убираем обработчик клика с врага, чтобы нельзя было атаковать после боя
    if (enemyCharacterElement) enemyCharacterElement.removeEventListener('click', playerAttack);
}

function battleVictory() {
    if (!battleInProgress) return; // Предотвращаем двойное срабатывание
     addBattleMessage('system', `You defeated the ${currentEnemy.name}!`);
    endBattleCleanup();

    // Calculate rewards
    calculateRewards();

    // Update user data
    const userData = loadUserDataBattle();
    let levelUp = false;

    // Add XP
    const xpGained = currentEnemy.rewards.xp || 10;
    userData.xp = (userData.xp || 0) + xpGained;
    addBattleMessage('reward', `🏆 Gained ${xpGained} XP`);

    // Check for level up
    let xpForNextLevel = (userData.level || 1) * 100;
    while (userData.xp >= xpForNextLevel) {
        userData.level++;
        userData.xp -= xpForNextLevel;
        levelUp = true;
        addBattleMessage('system', `Level up! You are now level ${userData.level}!`);
        xpForNextLevel = userData.level * 100; // Пересчитываем для следующего уровня

        // Increase a random stat on level up
        const stats = ['intelligence', 'sports', 'languages', 'energy', 'creativity', 'health'];
        const randomStat = stats[Math.floor(Math.random() * stats.length)];
        userData.stats[randomStat] = (userData.stats[randomStat] || 0) + 1;
        addBattleMessage('system', `Your ${randomStat} increased by 1!`);
    }

    // Add items to inventory
    if (!userData.inventory) userData.inventory = [];
    battleRewards.forEach(reward => {
        // Ищем существующий стак предмета
        const existingItem = userData.inventory.find(item => item.name === reward.name);
        if (existingItem && reward.type !== 'weapon') { // Оружие не стакаем
            existingItem.quantity = (existingItem.quantity || 1) + 1;
        } else {
            // Добавляем новый предмет
            userData.inventory.push({
                name: reward.name,
                icon: reward.icon,
                type: reward.type || 'item', // тип 'item' по умолчанию
                quantity: 1
            });
        }
    });

    saveUserDataBattle(userData);

    // Предлагаем начать новый бой или вернуться в меню
     // Показываем кнопку "Назад" и возможно "Новый бой"
     if(backToMenuButton) backToMenuButton.style.display = 'inline-block';
     // Можно добавить кнопку "Fight Again"
     // setTimeout(initBattle, 3000); // Автоматически начать новый бой через 3 сек (опционально)
     // ИЛИ Показать кнопку "Fight Again"
     setTimeout(() => {
        addBattleMessage('system', 'Prepare for the next battle or return to menu.');
        // Показать кнопку "Fight Again", которая вызывает initBattle()
        // Например, изменить текст кнопки back-to-menu и добавить еще одну
     }, 2000);
     // Запускаем новый квиз через несколько секунд
     setTimeout(initBattleQuiz, 4000); // Возвращаемся к квизу для след. боя

}

function battleDefeat() {
    if (!battleInProgress) return;
    addBattleMessage('system', `You were defeated by the ${currentEnemy.name}!`);
    endBattleCleanup();

    // Reduce a life
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

     // Через пару секунд предлагаем вернуться или перезапустить (если есть жизни)
    setTimeout(() => {
        if (userData.lives > 0) {
             addBattleMessage('system', 'Try again or return to menu.');
             // Можно показать кнопку "Try Again", которая вызывает initBattle()
             // Запускаем новый квиз через несколько секунд
            setTimeout(initBattleQuiz, 4000);
        } else {
            addBattleMessage('system', 'Return to menu.');
        }
    }, 2000);
}

// Calculate and display battle rewards
function calculateRewards() {
    battleRewards = []; // Очищаем массив наград
    if (!currentEnemy || !currentEnemy.rewards) return;

    const rewardsData = currentEnemy.rewards;

    // Add XP reward message (уже делается в battleVictory)

    // Calculate item drops based on chances
    if (rewardsData.items && Array.isArray(rewardsData.items)) {
        rewardsData.items.forEach(item => {
            if (Math.random() < item.chance) {
                 const reward = { name: item.name, icon: item.icon, type: 'item' };
                 battleRewards.push(reward);
                 addBattleMessage('reward', `${item.icon} Found ${item.name}`);
            }
        });
    }

    // Шанс получить случайное оружие (например, 5%)
    if (Math.random() < 0.05) {
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

// This function is called by battle_quiz.js after the quiz is done
window.startBattleInternal = function() {
    console.log("Starting battle internal logic...");
    const userData = loadUserDataBattle();

    // Проверка жизней
    if (userData.lives <= 0) {
        addBattleMessage('system', 'You have no lives left! Come back tomorrow.');
        if(backToMenuButton) backToMenuButton.style.display = 'inline-block'; // Показать кнопку назад
        return;
    }

    // Сброс состояния боя
    battleInProgress = true;
    if (battleMessages) battleMessages.innerHTML = ''; // Очищаем лог
    battleRewards = []; // Сбрасываем награды

    // Получаем эффект квиза
    const battleEffect = JSON.parse(localStorage.getItem('battleEffect') || 'null');
    localStorage.removeItem('battleEffect'); // Удаляем эффект после использования

    // Рассчитываем статы игрока с учетом всего
    const playerStats = calculatePlayerStatsBattle(userData, battleEffect);
    playerMaxHealth = playerStats.maxHealth; // Обновляем макс здоровье на этот бой
    playerCurrentHealth = playerMaxHealth; // Начинаем с полным здоровьем

    // Обновляем отображение здоровья игрока
    updateHealthBar(playerHealthElement, playerCurrentHealth, playerMaxHealth);

     // Отображаем сообщение об эффекте квиза, если он был
    if (playerStats.quizEffectMessage) {
        addBattleMessage('system', playerStats.quizEffectMessage);
    }


    // Настраиваем врага, передавая уровень игрока и множитель скорости
    setupEnemy(userData.level, playerStats.enemySpeedMultiplier);

    // Обновляем отображение здоровья врага
    updateHealthBar(enemyHealthElement, enemyCurrentHealth, enemyMaxHealth);

    // Добавляем сообщение о начале боя
    addBattleMessage('system', `A wild ${currentEnemy.name} (Lv. ${currentEnemy.level}) appears!`);
    addBattleMessage('system', `Click on the enemy to attack!`);


    // Устанавливаем обработчик клика на врага
    if (enemyCharacterElement) {
        enemyCharacterElement.removeEventListener('click', playerAttack); // Сначала удаляем старый, если есть
        enemyCharacterElement.addEventListener('click', playerAttack);
    }
    // Устанавливаем обработчик клика на орб
    if (healingOrbElement) {
         healingOrbElement.removeEventListener('click', healPlayer);
         healingOrbElement.addEventListener('click', healPlayer);
    }

    // Запускаем интервалы
    // Очищаем старые интервалы на всякий случай
    if (enemyAttackInterval) clearInterval(enemyAttackInterval);
    if (healingOrbInterval) clearInterval(healingOrbInterval);

    enemyAttackInterval = setInterval(enemyAttack, currentEnemy.attackSpeed);
    healingOrbInterval = setInterval(showHealingOrb, 4000 + Math.random() * 4000); // 4-8 секунд

     // Скрываем кнопку Назад во время боя (опционально)
     if(backToMenuButton) backToMenuButton.style.display = 'none';

     console.log("Battle started. Player HP:", playerCurrentHealth, "Enemy HP:", enemyCurrentHealth);
};

// --- Initialization when the page loads ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("Battle page DOM loaded.");
    // Обновляем внешний вид игрока сразу при загрузке
    updatePlayerAppearanceBattle();

    // Вызываем инициализацию квиза ИЗ battle_quiz.js
    if (typeof initBattleQuiz === 'function') {
        initBattleQuiz();
    } else {
        console.error("initBattleQuiz function not found!");
    }

    // Функция очистки для кнопки "Назад"
    window.endBattleCleanup = endBattleCleanup;

});
