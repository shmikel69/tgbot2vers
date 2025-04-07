
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
    tg.ready();
}

// DOM Elements
const roomCanvas = document.getElementById('room-canvas');
const itemsGrid = document.getElementById('items-grid'); // Контейнер для опций предметов
const themeOptionsContainer = document.getElementById('theme-options-container'); // Контейнер для кнопок тем
const buffsList = document.getElementById('room-buffs-list');

// User data (глобальная для этой страницы)
let userData = {};

// Room items configuration (включая statBoost для корректного снятия/добавления)
const roomItemsConfig = {
    bed: { buff: 'Energy +10%', buffIcon: '💤', statBoost: { energy: 10 } },
    desk: { buff: 'Intelligence +5%', buffIcon: '📝', statBoost: { intelligence: 5 } },
    bookshelf: { buff: 'Intelligence +10%', buffIcon: '📚', statBoost: { intelligence: 10 } },
    plant: { buff: 'Health +5%', buffIcon: '🌿', statBoost: { health: 5 } },
    poster: { buff: 'Creativity +8%', buffIcon: '🎨', statBoost: { creativity: 8 } },
    lamp: { buff: 'Energy +5%', buffIcon: '💡', statBoost: { energy: 5 } },
    rug: { buff: 'Comfort +10%', buffIcon: '🧶', statBoost: { /* Нет прямых статов, можно добавить health/energy */ } }, // Убрал статы для примера
    computer: { buff: 'Intelligence +8%, Creativity +5%', buffIcon: '💻', statBoost: { intelligence: 8, creativity: 5 } }
};

// Available themes
const availableThemes = ['default', 'modern', 'cozy', 'nature', 'tech'];

// --- Data Management ---

function loadUserData() {
    const savedData = localStorage.getItem('brainTrainingUserData');
    if (savedData) {
        try {
            userData = JSON.parse(savedData);
            // Обеспечиваем наличие поля room и его структуры
            if (!userData.room) {
                userData.room = { theme: 'default', items: [] };
                 // Если статы не загружены, создаем базовые
                 if (!userData.stats) {
                    userData.stats = { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 };
                 }
                 saveUserData(); // Сохраняем структуру, если ее не было
            }
             // Убедимся что items это массив
            if (!Array.isArray(userData.room.items)) {
                userData.room.items = [];
            }
             // Убедимся что stats есть
            if (!userData.stats) {
                 userData.stats = { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 };
                 saveUserData();
            }


        } catch (e) {
            console.error("Error parsing user data:", e);
            setDefaultUserDataRoom(); // Сброс к дефолту при ошибке
        }
    } else {
        setDefaultUserDataRoom();
    }
     console.log("User data loaded for room page:", userData);
}

function setDefaultUserDataRoom() {
    // Создаем только нужные для комнаты поля, если данных нет
    userData = {
        ...(userData || {}), // Сохраняем остальные данные, если они были
        room: { theme: 'default', items: [] },
        // Добавляем базовые статы, если их нет
        stats: userData.stats || { intelligence: 10, sports: 5, languages: 3, energy: 8, creativity: 7, health: 10 }
    };
    saveUserData();
}


function saveUserData() {
    try {
        localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
         console.log("User data saved from room page.");
    } catch (e) {
        console.error("Error saving user data:", e);
    }
}

// --- UI Updates ---

function updateRoomDisplay() {
    if (!userData || !userData.room || !roomCanvas) return;

    // 1. Apply Room Theme Class
    roomCanvas.className = 'room-canvas'; // Reset classes
    roomCanvas.classList.add(`theme-${userData.room.theme || 'default'}`);

    // 2. Update Item Visibility
    // Сначала скроем все предметы
    Object.keys(roomItemsConfig).forEach(itemName => {
        const itemElement = document.getElementById(`room-item-${itemName}`);
        if (itemElement) itemElement.style.display = 'none';
    });
    // Затем покажем те, что есть в userData.room.items
    (userData.room.items || []).forEach(itemName => {
        const itemElement = document.getElementById(`room-item-${itemName}`);
        if (itemElement) itemElement.style.display = 'block';
    });

    // 3. Update Item Option Selection State
    const itemOptions = itemsGrid ? itemsGrid.querySelectorAll('.room-item-option') : [];
    itemOptions.forEach(option => {
        const itemName = option.getAttribute('data-item');
        if ((userData.room.items || []).includes(itemName)) {
            option.classList.add('selected');
        } else {
            option.classList.remove('selected');
        }
    });

    // 4. Update Theme Button Selection State
    const themeButtons = themeOptionsContainer ? themeOptionsContainer.querySelectorAll('.theme-option') : [];
    themeButtons.forEach(button => {
        const themeName = button.getAttribute('data-theme');
        if (themeName === (userData.room.theme || 'default')) {
            button.classList.add('selected');
        } else {
            button.classList.remove('selected');
        }
    });

    // 5. Update Buffs List
    updateBuffsList(userData.room.items || []);
}

function updateBuffsList(activeItems) {
    if (!buffsList) return;
    buffsList.innerHTML = ''; // Clear previous buffs

    let hasVisibleBuffs = false;
    if (activeItems && activeItems.length > 0) {
        activeItems.forEach(itemName => {
            const itemConfig = roomItemsConfig[itemName];
            if (itemConfig && itemConfig.buff) { // Показываем только если есть текст баффа
                hasVisibleBuffs = true;
                const buffItem = document.createElement('div');
                buffItem.className = 'buff-item';
                buffItem.innerHTML = `
                    <div class="buff-icon">${itemConfig.buffIcon || '❔'}</div>
                    <div class="buff-text">${itemConfig.buff}</div>
                `;
                buffsList.appendChild(buffItem);
            }
        });
    }

    if (!hasVisibleBuffs) {
        buffsList.innerHTML = '<div class="no-buffs">Add items for buffs!</div>';
    }
}


// --- Actions ---

function toggleRoomItem(itemName) {
    if (!userData || !userData.room || !userData.stats || !roomItemsConfig[itemName]) return;

    const itemConfig = roomItemsConfig[itemName];
    const currentItems = userData.room.items || [];
    const itemIndex = currentItems.indexOf(itemName);
    const statBoosts = itemConfig.statBoost || {};

    if (itemIndex === -1) {
        // Add item
        currentItems.push(itemName);
        // Apply stat boosts
        for (const stat in statBoosts) {
            if (userData.stats.hasOwnProperty(stat)) {
                 userData.stats[stat] = (userData.stats[stat] || 0) + statBoosts[stat];
                 console.log(`Stat ${stat} increased by ${statBoosts[stat]}`);
            }
        }
         console.log(`Added item: ${itemName}`);
    } else {
        // Remove item
        currentItems.splice(itemIndex, 1);
        // Remove stat boosts
         for (const stat in statBoosts) {
            if (userData.stats.hasOwnProperty(stat)) {
                 userData.stats[stat] = (userData.stats[stat] || 0) - statBoosts[stat];
                 // Не даем статам уйти в минус (опционально)
                 // userData.stats[stat] = Math.max(0, userData.stats[stat]);
                 console.log(`Stat ${stat} decreased by ${statBoosts[stat]}`);
            }
        }
         console.log(`Removed item: ${itemName}`);
    }

    userData.room.items = currentItems; // Обновляем массив предметов
    saveUserData(); // Сохраняем все изменения (предметы и статы)
    updateRoomDisplay(); // Обновляем весь UI комнаты
}


function changeRoomTheme(themeName) {
    if (!userData || !userData.room || !availableThemes.includes(themeName)) return;

    userData.room.theme = themeName;
    saveUserData();
    updateRoomDisplay(); // Обновляем UI для отображения новой темы
     console.log(`Theme changed to: ${themeName}`);
}


// --- Event Listeners Setup ---

function setupEventListeners() {
    // Listener for item options grid (event delegation)
    if (itemsGrid) {
        itemsGrid.addEventListener('click', function(event) {
            const option = event.target.closest('.room-item-option');
            if (option) {
                const itemName = option.getAttribute('data-item');
                toggleRoomItem(itemName);
                // Состояние 'selected' обновится в updateRoomDisplay()
            }
        });
    } else {
        console.error("Items grid container not found!");
    }

    // Listener for theme options container (event delegation)
    if (themeOptionsContainer) {
        themeOptionsContainer.addEventListener('click', function(event) {
            const button = event.target.closest('.theme-option');
            if (button) {
                const themeName = button.getAttribute('data-theme');
                changeRoomTheme(themeName);
                 // Состояние 'selected' обновится в updateRoomDisplay()
            }
        });
    } else {
         console.error("Theme options container not found!");
    }

    // Back button listener (уже есть во встроенном скрипте HTML)
    /*
    const backButton = document.getElementById('back-to-menu');
    if (backButton) {
        backButton.addEventListener('click', function() {
            window.location.href = 'index.html';
        });
    }
    */
}


// --- Initialization ---

document.addEventListener('DOMContentLoaded', () => {
    console.log("Room page DOM loaded.");
    loadUserData();
    updateRoomDisplay(); // Первичное отображение комнаты
    setupEventListeners(); // Настройка обработчиков событий
});
