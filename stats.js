
// Initialize Telegram Web App compatibility
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// DOM Elements
const levelValue = document.getElementById("level-value");
const xpValue = document.getElementById("xp-value");
const xpNextLevel = document.getElementById("xp-next-level");
const xpFill = document.getElementById("xp-fill");
const livesContainer = document.getElementById("lives-container");
const intelligenceValue = document.getElementById("intelligence-value");
const sportsValue = document.getElementById("sports-value");
const languagesValue = document.getElementById("languages-value");
const energyValue = document.getElementById("energy-value");
const creativityValue = document.getElementById("creativity-value");
const healthValue = document.getElementById("health-value");
const customizeButton = document.getElementById("customize-button");
const petButton = document.getElementById("pet-button");
const customizationModal = document.getElementById("customization-modal");
const closeModal = customizationModal ? customizationModal.querySelector(".close") : null; // Кнопка закрытия модалки
const modalContent = customizationModal ? customizationModal.querySelector(".customization-content") : null;
const characterContainer = document.getElementById("character-base");
const petDisplayContainer = document.getElementById("pet-display");
const petBaseElement = document.getElementById("pet-base");
const buffsContainer = document.getElementById('buffs-container');
const equipmentSlotsContainer = document.querySelector(".equipment-container"); // Контейнер слотов

// User data (глобальная для этой страницы)
let userData = {};

// Character customization options (оставляем как есть)
const characterOptions = {
    skin: ['light', 'medium', 'dark', 'fantasy'],
    outfit: ['none', 'casual', 'formal', 'warrior', 'mage'], // Добавлен 'none'
    headgear: ['none', 'hat', 'crown', 'helmet'],
    weapon: ['none', 'sword', 'staff', 'bow']
};

// Pet customization options (оставляем как есть)
const petOptions = {
    type: ['cat', 'dog', 'dragon', 'bird'],
    color: ['default', 'black', 'white', 'gold', 'blue'],
    accessory: ['none', 'bow', 'hat', 'glasses']
};

// Room items and their buffs (для отображения в секции баффов)
const roomItemBuffs = {
    bed: { buff: 'Energy +10%', buffIcon: '💤' },
    desk: { buff: 'Intelligence +5%', buffIcon: '📝' },
    bookshelf: { buff: 'Intelligence +10%', buffIcon: '📚' },
    plant: { buff: 'Health +5%', buffIcon: '🌿' },
    poster: { buff: 'Creativity +8%', buffIcon: '🎨' },
    lamp: { buff: 'Energy +5%', buffIcon: '💡' },
    rug: { buff: 'Comfort +10%', buffIcon: '🧶' }, // Бафф комфорта можно не отображать или связать со статом
    computer: { buff: 'Intelligence +8%, Creativity +5%', buffIcon: '💻' }
};


// --- Data Management ---

function loadUserData() {
    const savedData = localStorage.getItem('brainTrainingUserData');
    if (savedData) {
        try {
            userData = JSON.parse(savedData);
            // Обеспечиваем наличие всех необходимых полей
            userData.stats = userData.stats || { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 };
            userData.equipment = userData.equipment || { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' };
            userData.pet = userData.pet || { unlocked: false, type: 'cat', color: 'default', accessory: 'none', abilities: { loyalty: 50, intelligence: 70, speed: 60, strength: 40 } };
            userData.achievements = userData.achievements || { memoryMaster: false, mathWizard: false, dailyStreak: false };
            userData.inventory = userData.inventory || [];
            userData.room = userData.room || { theme: 'default', items: [] };
            userData.level = userData.level || 1;
            userData.xp = userData.xp || 0;
            userData.lives = userData.lives === undefined ? 5 : userData.lives;

        } catch (e) {
            console.error("Error parsing user data:", e);
            setDefaultUserDataStats(); // Сброс к дефолту при ошибке
        }
    } else {
        setDefaultUserDataStats();
    }
    console.log("User data loaded for stats page:", userData);
}

function setDefaultUserDataStats() {
    userData = {
        level: 1, xp: 0, lives: 5, lastPlayed: new Date(0),
        stats: { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 },
        equipment: { skin: 'light', outfit: 'casual', headgear: 'none', weapon: 'none' },
        pet: { unlocked: false, type: 'cat', color: 'default', accessory: 'none', abilities: { loyalty: 50, intelligence: 70, speed: 60, strength: 40 } },
        achievements: { memoryMaster: false, mathWizard: false, dailyStreak: false },
        inventory: [], room: { theme: 'default', items: [] }
    };
    saveUserData();
}

function saveUserData() {
    try {
        localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
        console.log("User data saved.");
    } catch (e) {
        console.error("Error saving user data:", e);
    }
}

// --- UI Updates ---

function updateStatsDisplay() {
    if (!userData) return; // Проверка наличия данных

    // Level and XP
    const currentLevel = userData.level || 1;
    const currentXP = userData.xp || 0;
    const xpForNext = currentLevel * 100;
    if (levelValue) levelValue.textContent = currentLevel;
    if (xpValue) xpValue.textContent = currentXP;
    if (xpNextLevel) xpNextLevel.textContent = xpForNext;
    if (xpFill) {
        const xpPercentage = Math.min(100, (currentXP / xpForNext) * 100);
        xpFill.style.width = `${xpPercentage}%`;
    }

    // Lives
    if (livesContainer) {
        livesContainer.innerHTML = '';
        const currentLives = userData.lives === undefined ? 5 : userData.lives;
        for (let i = 0; i < Math.max(0, currentLives); i++) {
            const lifeIcon = document.createElement("div");
            lifeIcon.className = "life-icon";
            lifeIcon.textContent = "❤️";
            livesContainer.appendChild(lifeIcon);
        }
         // Отображаем серые сердца для потерянных жизней (до 5)
        for (let i = 0; i < 5 - Math.max(0, currentLives); i++) {
            const lifeIcon = document.createElement("div");
            lifeIcon.className = "life-icon";
            lifeIcon.textContent = "🖤"; // Или "🤍"
            lifeIcon.style.opacity = "0.5";
            livesContainer.appendChild(lifeIcon);
        }
    }

    // Attributes
    const stats = userData.stats || {};
    updateAttributeBar('intelligence', stats.intelligence || 0);
    updateAttributeBar('sports', stats.sports || 0);
    updateAttributeBar('languages', stats.languages || 0);
    updateAttributeBar('energy', stats.energy || 0);
    updateAttributeBar('creativity', stats.creativity || 0);
    updateAttributeBar('health', stats.health || 0);

    // Update achievements
    updateAchievements();

    // Update buffs from room
    updateBuffsDisplay();
}

function updateAttributeBar(attribute, value) {
    const valueElement = document.getElementById(`${attribute}-value`);
    const fillElement = document.querySelector(`.${attribute}-fill`);
    if (!valueElement || !fillElement) return;

    valueElement.textContent = value;
    const maxValue = 100; // Предполагаемый максимум для отображения
    const percentage = Math.min(100, Math.max(0,(value / maxValue) * 100));

    // Плавная анимация ширины
    fillElement.style.width = `${percentage}%`;
}

function updateAchievements() {
    const achievements = userData.achievements || {};
    updateAchievementStatus('memory', achievements.memoryMaster);
    updateAchievementStatus('math', achievements.mathWizard);
    updateAchievementStatus('streak', achievements.dailyStreak);
}

function updateAchievementStatus(id, unlocked) {
    const element = document.getElementById(`achievement-${id}`);
    if (element) {
        if (unlocked) {
            element.classList.remove('locked');
            element.classList.add('unlocked');
        } else {
            element.classList.remove('unlocked');
            element.classList.add('locked');
        }
    }
}

function updateBuffsDisplay() {
    if (!buffsContainer || !userData.room || !userData.room.items) {
        if(buffsContainer) buffsContainer.innerHTML = '<div class="no-buffs">No active buffs</div>';
        return;
    }

    const activeItems = userData.room.items;
    buffsContainer.innerHTML = ''; // Очистка

    if (activeItems.length === 0) {
        buffsContainer.innerHTML = '<div class="no-buffs">Add items to your room for buffs!</div>';
        return;
    }

    let hasBuffs = false;
    activeItems.forEach(itemName => {
        const itemData = roomItemBuffs[itemName];
        if (itemData) {
            hasBuffs = true;
            const buffItem = document.createElement('div');
            buffItem.className = 'buff-item';
            buffItem.innerHTML = `
                <div class="buff-icon">${itemData.buffIcon}</div>
                <div class="buff-text">${itemData.buff}</div>
            `;
            buffsContainer.appendChild(buffItem);
        }
    });

    if (!hasBuffs) {
        buffsContainer.innerHTML = '<div class="no-buffs">No active buffs from room items.</div>';
    }
}

// Update Equipment Slots UI
function loadEquipmentSlots() {
     if (!equipmentSlotsContainer || !userData.equipment) return;

     const equipment = userData.equipment;
     equipmentSlotsContainer.querySelectorAll('.equipment-slot').forEach(slot => {
        const slotType = slot.getAttribute("data-slot"); // outfit, headgear, weapon, skin
        const iconElement = slot.querySelector(".slot-icon");
        const currentItem = equipment[slotType];

        if (iconElement) {
            if (currentItem && currentItem !== 'none') {
                iconElement.classList.remove("empty");
                iconElement.classList.add("equipped");
                // Отображаем первую букву или специальную иконку
                const itemIcons = { 'sword': '🗡️', 'staff': '🔮', 'bow': '🏹', 'helmet': '🛡️', 'crown': '👑', 'hat': '🎩', 'casual': '👕', 'formal': '👔', 'warrior': '⚔️', 'mage': '✨', 'light': '⚪', 'medium': '🟠', 'dark': '⚫', 'fantasy': '🟢' };
                iconElement.textContent = itemIcons[currentItem] || currentItem[0].toUpperCase();
                 // Скин делаем некликабельным для снятия
                 slot.style.cursor = (slotType === 'skin') ? 'default' : 'pointer';
            } else if (slotType !== 'skin') { // Не скин и не экипирован
                iconElement.classList.remove("equipped");
                iconElement.classList.add("empty");
                iconElement.textContent = "?";
                slot.style.cursor = 'pointer';
            }
        }
     });
}

// Update Character Appearance
function updateCharacterAppearance() {
    if (!characterContainer || !userData.equipment) return;

    const equipment = userData.equipment;
    characterContainer.className = 'character-container'; // Reset

    // Применяем классы из стилей (character.css / style.css)
    characterContainer.classList.add(`skin-${equipment.skin || 'light'}`);
    if (equipment.outfit && equipment.outfit !== 'none') {
        characterContainer.classList.add(`outfit-${equipment.outfit}`);
    }
    if (equipment.headgear && equipment.headgear !== 'none') {
        characterContainer.classList.add(`headgear-${equipment.headgear}`);
    }
    if (equipment.weapon && equipment.weapon !== 'none') {
        characterContainer.classList.add(`weapon-${equipment.weapon}`);
    }

    // Обновляем или создаем слои (из character.css)
     characterContainer.innerHTML = `
        <div id="char-body" class="char-layer"></div>
        <div id="char-outfit" class="char-layer"></div>
        <div id="char-head" class="char-layer"></div>
        <div id="char-face" class="char-layer">
            <div id="char-mouth"></div>
        </div>
        <div id="char-headgear" class="char-layer"></div>
        <div id="char-weapon" class="char-layer"></div>
    `;
}

// Update Pet Appearance
function updatePetAppearance() {
    if (!petDisplayContainer || !petBaseElement || !userData.pet) return;

    const pet = userData.pet;
    if (pet.unlocked) {
        petDisplayContainer.style.display = 'block'; // Показываем контейнер пета
        petBaseElement.className = 'pet-container'; // Reset

        petBaseElement.classList.add(`pet-type-${pet.type || 'cat'}`);
        petBaseElement.classList.add(`pet-color-${pet.color || 'default'}`);
        if (pet.accessory && pet.accessory !== 'none') {
            petBaseElement.classList.add(`pet-accessory-${pet.accessory}`);
        }

        // Обновляем или создаем слои пета
        petBaseElement.innerHTML = `
            <div id="pet-body" class="pet-layer"></div>
            <div id="pet-head" class="pet-layer"></div>
            <div id="pet-face" class="pet-layer">
                <div id="pet-mouth"></div>
            </div>
            <div id="pet-accessory" class="pet-layer"></div>
        `;

    } else {
        petDisplayContainer.style.display = 'none'; // Скрываем контейнер пета
    }
}

// --- Customization Modal ---

function openCustomizationModal(type) {
    if (!customizationModal || !modalContent) return;

     // Очистка предыдущего контента (кроме кнопки закрытия и заголовка)
    const closeBtn = modalContent.querySelector(".close");
    const title = modalContent.querySelector("h2");
    const saveBtn = document.getElementById('save-customization'); // Находим кнопку сохранения
    modalContent.innerHTML = ''; // Очищаем всё
    if (closeBtn) modalContent.appendChild(closeBtn); // Возвращаем кнопку закрытия
    if (title) modalContent.appendChild(title); // Возвращаем заголовок
    if (saveBtn) modalContent.appendChild(saveBtn); // Возвращаем кнопку сохранения

    if (type === 'character') {
        title.textContent = "Character Customization";
        populateCharacterOptions();
    } else if (type === 'pet') {
        title.textContent = "Pet Customization";
        populatePetOptions();
    }

    // Показываем модальное окно
    customizationModal.style.display = "block";

    // Навешиваем обработчик на кнопку Сохранить внутри модалки
    if (saveBtn) {
        // Удаляем старый обработчик, если был
        saveBtn.replaceWith(saveBtn.cloneNode(true));
        const newSaveBtn = document.getElementById('save-customization'); // Получаем новую кнопку
        if (newSaveBtn) {
            newSaveBtn.addEventListener('click', () => {
                customizationModal.style.display = "none"; // Просто закрываем окно
                // Данные уже сохранены при клике на опцию
            });
        }
    }
}


function populateCharacterOptions() {
     if (!modalContent) return;
     const saveBtn = document.getElementById('save-customization'); // Кнопка сохранения

    for (const [category, options] of Object.entries(characterOptions)) {
        const section = document.createElement("div");
        section.className = "customization-section";

        const sectionTitle = document.createElement("h3");
        sectionTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
        section.appendChild(sectionTitle);

        const optionsContainer = document.createElement("div");
        optionsContainer.className = "options-container";

        options.forEach(option => {
            const optionButton = document.createElement("button");
            optionButton.className = "option-button";
            if (userData.equipment[category] === option) {
                optionButton.classList.add("selected");
            }
            optionButton.textContent = option.charAt(0).toUpperCase() + option.slice(1);
            optionButton.setAttribute("data-category", category);
            optionButton.setAttribute("data-option", option);

            // Скин нельзя сделать 'none'
            if (category === 'skin' && option === 'none') {
               optionButton.disabled = true;
               optionButton.style.opacity = '0.5';
               optionButton.style.cursor = 'not-allowed';
            } else {
                 optionButton.addEventListener("click", handleCharacterOptionSelect);
            }


            optionsContainer.appendChild(optionButton);
        });

        section.appendChild(optionsContainer);
         // Вставляем секцию перед кнопкой "Save Changes"
        if (saveBtn) {
            modalContent.insertBefore(section, saveBtn);
        } else {
            modalContent.appendChild(section); // Если кнопки нет, просто добавляем в конец
        }
    }
}

function handleCharacterOptionSelect(event) {
     const button = event.target;
     const category = button.getAttribute("data-category");
     const option = button.getAttribute("data-option");

     // Обновляем userData
     userData.equipment[category] = option;

     // Обновляем UI модалки
     document.querySelectorAll(`.option-button[data-category="${category}"]`).forEach(btn => {
         btn.classList.remove("selected");
     });
     button.classList.add("selected");

     // Обновляем внешний вид персонажа и слоты в реальном времени
     updateCharacterAppearance();
     loadEquipmentSlots();

     // Сохраняем изменения сразу
     saveUserData();
}


function populatePetOptions() {
     if (!modalContent) return;
     const saveBtn = document.getElementById('save-customization');

    if (!userData.pet || !userData.pet.unlocked) {
        const petLockedMessage = document.createElement("div");
        petLockedMessage.className = "pet-locked-message"; // Стиль из style.css для модалки
        petLockedMessage.style.textAlign = 'center';
        petLockedMessage.style.padding = '20px';
        petLockedMessage.innerHTML = `
            <div style="font-size: 3em; margin-bottom: 10px;">🔒</div>
            <p>Unlock a pet from the inventory first!</p>
            <button id="unlock-pet-demo" class="action-button" style="margin-top: 15px;">Unlock Demo Pet</button>
        `;
         // Вставляем сообщение перед кнопкой сохранения
        if (saveBtn) {
            modalContent.insertBefore(petLockedMessage, saveBtn);
        } else {
            modalContent.appendChild(petLockedMessage);
        }

        // Демо-кнопка для разблокировки (убрать в релизе)
        const unlockDemoButton = modalContent.querySelector("#unlock-pet-demo");
        if (unlockDemoButton) {
            unlockDemoButton.addEventListener("click", () => {
                userData.pet.unlocked = true;
                saveUserData();
                updatePetAppearance(); // Обновляем вид пета на странице статов
                openCustomizationModal('pet'); // Переоткрываем модалку уже с опциями
            });
        }
        return; // Не добавляем опции кастомизации, если пет заблокирован
    }

    // Добавляем опции, если пет разблокирован
    for (const [category, options] of Object.entries(petOptions)) {
         const section = document.createElement("div");
         section.className = "customization-section";
         // ... (код создания секции и кнопок как в populateCharacterOptions) ...
          const sectionTitle = document.createElement("h3");
         sectionTitle.textContent = category.charAt(0).toUpperCase() + category.slice(1);
         section.appendChild(sectionTitle);

         const optionsContainer = document.createElement("div");
         optionsContainer.className = "options-container";

         options.forEach(option => {
             const optionButton = document.createElement("button");
             optionButton.className = "option-button";
             if (userData.pet[category] === option) {
                 optionButton.classList.add("selected");
             }
             optionButton.textContent = option.charAt(0).toUpperCase() + option.slice(1);
             optionButton.setAttribute("data-category", category);
             optionButton.setAttribute("data-option", option);
             optionButton.addEventListener("click", handlePetOptionSelect); // Обработчик для пета
             optionsContainer.appendChild(optionButton);
         });
         section.appendChild(optionsContainer);
          if (saveBtn) {
             modalContent.insertBefore(section, saveBtn);
         } else {
             modalContent.appendChild(section);
         }
    }

    // Добавляем отображение статов пета (только просмотр)
    const abilitiesSection = document.createElement("div");
    abilitiesSection.className = "customization-section";
    abilitiesSection.innerHTML = `<h3>Pet Abilities (View Only)</h3>`;
    const abilitiesGrid = document.createElement("div");
    abilitiesGrid.className = "attributes-grid"; // Используем тот же стиль что и для статов перса
    const abilities = userData.pet.abilities || {};
    for (const [name, value] of Object.entries(abilities)) {
        const abilityDiv = document.createElement('div');
        abilityDiv.className = 'attribute'; // Используем стиль атрибута
        abilityDiv.innerHTML = `
            <div class="attribute-name">${name.charAt(0).toUpperCase() + name.slice(1)}</div>
            <div class="attribute-bar"><div class="attribute-fill" style="width: ${value}%; background-color: #f39c12;"></div></div>
            <div class="attribute-value">${value}</div>
        `;
        abilitiesGrid.appendChild(abilityDiv);
    }
    abilitiesSection.appendChild(abilitiesGrid);
    if (saveBtn) {
        modalContent.insertBefore(abilitiesSection, saveBtn);
    } else {
        modalContent.appendChild(abilitiesSection);
    }
}

function handlePetOptionSelect(event) {
     const button = event.target;
     const category = button.getAttribute("data-category");
     const option = button.getAttribute("data-option");

     userData.pet[category] = option;

     document.querySelectorAll(`.option-button[data-category="${category}"]`).forEach(btn => {
         btn.classList.remove("selected");
     });
     button.classList.add("selected");

     updatePetAppearance(); // Обновляем вид пета на странице
     saveUserData();
}

// --- Event Listeners ---

if (customizeButton) {
    customizeButton.addEventListener("click", () => openCustomizationModal('character'));
}
if (petButton) {
    petButton.addEventListener("click", () => openCustomizationModal('pet'));
}

// Закрытие модалки
if (closeModal) {
    closeModal.addEventListener("click", () => {
        if (customizationModal) customizationModal.style.display = "none";
    });
}
window.addEventListener("click", (event) => {
    if (event.target === customizationModal) {
        customizationModal.style.display = "none";
    }
});

// Клики по слотам экипировки открывают кастомизацию персонажа
if (equipmentSlotsContainer) {
    equipmentSlotsContainer.addEventListener('click', (event) => {
        const slot = event.target.closest('.equipment-slot');
        const slotType = slot ? slot.getAttribute('data-slot') : null;
        // Запрещаем открывать кастомизацию по клику на скин
        if (slot && slotType !== 'skin') {
            openCustomizationModal('character');
        }
    });
}


// --- Initialization ---

window.onload = function() {
    loadUserData();
    updateStatsDisplay();
    loadEquipmentSlots(); // Порядок важен
    updateCharacterAppearance();
    updatePetAppearance();

    // Тема применяется во встроенном скрипте в HTML
};
