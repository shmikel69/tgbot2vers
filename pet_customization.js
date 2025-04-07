// Initialize Telegram Web App compatibility
let tg = window.Telegram && window.Telegram.WebApp;
if (tg) {
    tg.expand();
}

// DOM Elements
const petLocked = document.getElementById('pet-locked');
const petUnlocked = document.getElementById('pet-unlocked');
const backToStatsButton = document.getElementById('back-to-stats');
const toCharacterPage = document.getElementById('to-character-page');

// Load user data from localStorage
function loadUserData() {
    const savedData = localStorage.getItem('brainTrainingUserData');
    if (savedData) {
        return JSON.parse(savedData);
    } else {
        // Default user data
        return {
            level: 1,
            xp: 0,
            lives: 5,
            lastPlayed: new Date(),
            stats: {
                intelligence: 10,
                sports: 5,
                languages: 3,
                energy: 8,
                creativity: 7,
                health: 10
            },
            pet: {
                unlocked: false,
                type: 'cat',
                color: 'default',
                accessory: 'none',
                abilities: {
                    loyalty: 50,
                    intelligence: 70,
                    speed: 60,
                    strength: 40
                }
            },
            inventory: []
        };
    }
}

// Save user data to localStorage
function saveUserData(userData) {
    localStorage.setItem('brainTrainingUserData', JSON.stringify(userData));
}

// Update the pet appearance
function updatePetAppearance() {
    const userData = loadUserData();
    
    // Check if pet is unlocked
    if (userData.pet && userData.pet.unlocked) {
        petLocked.style.display = 'none';
        petUnlocked.style.display = 'block';
        
        // Apply pet styling based on settings
        const petBase = document.getElementById('pet-base');
        petBase.className = 'pet-container';
        petBase.classList.add(`pet-type-${userData.pet.type}`);
        petBase.classList.add(`pet-color-${userData.pet.color}`);
        
        if (userData.pet.accessory !== 'none') {
            petBase.classList.add(`pet-accessory-${userData.pet.accessory}`);
        }
        
        // Update selected buttons
        document.querySelectorAll('.option-button').forEach(button => {
            button.classList.remove('selected');
        });
        
        document.querySelector(`[data-type="${userData.pet.type}"]`).classList.add('selected');
        document.querySelector(`[data-color="${userData.pet.color}"]`).classList.add('selected');
        document.querySelector(`[data-accessory="${userData.pet.accessory}"]`).classList.add('selected');
        
        // Update ability bars
        const abilities = userData.pet.abilities;
        const abilityBars = document.querySelectorAll('.ability-fill');
        
        abilityBars[0].style.width = `${abilities.loyalty}%`;
        abilityBars[1].style.width = `${abilities.intelligence}%`;
        abilityBars[2].style.width = `${abilities.speed}%`;
        abilityBars[3].style.width = `${abilities.strength}%`;
    } else {
        petLocked.style.display = 'block';
        petUnlocked.style.display = 'none';
    }
}

// Handle option button clicks
function handleOptionClick(event) {
    if (!event.target.classList.contains('option-button')) return;
    
    const userData = loadUserData();
    
    // Skip if pet is not unlocked
    if (!userData.pet || !userData.pet.unlocked) return;
    
    const optionType = event.target.dataset.type;
    const optionColor = event.target.dataset.color;
    const optionAccessory = event.target.dataset.accessory;
    
    // Update the corresponding option
    if (optionType) {
        userData.pet.type = optionType;
        document.querySelectorAll('[data-type]').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
    } else if (optionColor) {
        userData.pet.color = optionColor;
        document.querySelectorAll('[data-color]').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
    } else if (optionAccessory) {
        userData.pet.accessory = optionAccessory;
        document.querySelectorAll('[data-accessory]').forEach(el => el.classList.remove('selected'));
        event.target.classList.add('selected');
    }
    
    saveUserData(userData);
    updatePetAppearance();
}

// Back button handler
backToStatsButton.addEventListener('click', function() {
    window.location.href = 'stats.html';
});

// To character page handler
toCharacterPage.addEventListener('click', function() {
    window.location.href = 'stats.html';
});

// Handle options container clicks
document.querySelectorAll('.options-container').forEach(container => {
    container.addEventListener('click', handleOptionClick);
});

// Add unlock pet button for testing
document.querySelector('.pet-locked').addEventListener('click', function() {
    const userData = loadUserData();
    userData.pet.unlocked = true;
    saveUserData(userData);
    updatePetAppearance();
});

// Initialize the page
window.onload = function() {
    updatePetAppearance();
    
    // Load theme preference
    const savedTheme = localStorage.getItem("preferred-theme");
    if (savedTheme) {
        document.body.className = savedTheme + "-theme";
    } else {
        document.body.className = "colorful-theme";
    }
    
    // Add navigation handlers
    document.querySelectorAll(".icon").forEach(icon => {
        icon.addEventListener("click", function() {
            const action = this.getAttribute("data-action");
            if (action === "games") {
                window.location.href = "index.html";
            } else if (action === "stats") {
                window.location.href = "stats.html";
            } else if (action === "room") {
                window.location.href = "room.html";
            } else if (action === "inventory") {
                alert("Inventory is coming soon! 🎒");
            } else if (action === "battle") {
                window.location.href = "battle.html";
            }
        });
    });
};