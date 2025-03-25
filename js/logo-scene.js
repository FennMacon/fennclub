const symbols = ['✦', '⋆', '.', '✧', '⊹'];
const logoSection = document.getElementById('nav-logo-section');
const cursor = document.createElement('div');
cursor.classList.add('custom-cursor');
document.body.appendChild(cursor);

// Function to get a random symbol from the array
function getRandomSymbol() {
    return symbols[Math.floor(Math.random() * symbols.length)];
}

// Function to initialize random symbols
function initializeRandomSymbols() {
    const logoSymbols = document.querySelectorAll('.logo-symbol');
    logoSymbols.forEach((symbol, index) => {
        // Check if this is a letter position
        const isLetter = symbol.classList.contains('letter');
        if (!isLetter) {
            symbol.textContent = getRandomSymbol();
        } else {
            // Restore the original letter
            symbol.textContent = originalSymbols[index];
        }
    });
}

// Character sets for different effects with their themed colors
const characterSets = {
    twinkle: {
        chars: ['☆', '★', '✧', '✦', '✯', '✮', '✭', '✬'],
        colors: ['#ffffff', '#f0f0f0', '#e0e0e0', '#d0d0d0']
    },
    explode: {
        chars: ['❀', '✿', '❁', '✾', '❃', '❊', '❉', '❋'],
        colors: ['#ff4444', '#ff6666', '#ff8888', '#ffaaaa']
    },
    moon: {
        chars: ['☽', '☾', '☉', '☈', '☇', '☊', '☋'],
        colors: ['#ffd700', '#ffeb3b', '#fff176', '#fff59d']
    },
    stars: {
        chars: ['★', '☆', '✧', '✦', '✯', '✮', '✭', '✬', '✫', '✪', '✩', '✨', '⭐', '🌟', '💫', '✨'],
        colors: ['#ffffff', '#ffd700', '#ffeb3b', '#fff176', '#fff59d', '#fff8e1', '#fffde7', '#fff9c4', '#00ffff', '#40e0d0', '#00ced1', '#20b2aa']
    },
    nature: {
        chars: ['❄', '❆', '❅', '❉', '❊', '❋', '❀', '✿', '❁', '✾', '❃', '❊', '❉', '❋', '❀', '✿', '❁', '✾', '❃'],
        colors: ['#98FB98', '#90EE90', '#3CB371', '#2E8B57', '#228B22', '#006400']
    },
    geometric: {
        chars: ['◈', '◇', '◊', '◉', '◊', '◈', '◇', '◊', '◉', '◊', '◈', '◇', '◊', '◉', '◊', '◈', '◇', '◊', '◉', '◊'],
        colors: ['#FF69B4', '#FF1493', '#DB7093', '#C71585', '#FF69B4', '#FF1493']
    },
    special: {
        chars: ['✧', '✦', '✯', '✮', '✭', '✬', '✫', '✪', '✩', '✰', '✯', '✮', '✭', '✬', '✫', '✪', '✩', '✰', '✯', '✮'],
        colors: ['#FFD700', '#FFA500', '#FF8C00', '#FFD700', '#FFA500', '#FF8C00']
    },
    cosmic: {
        chars: ['☄', '☉', '☽', '☾', '☽', '☉', '☄', '☽', '☾', '☽', '☉', '☄', '☽', '☾', '☽', '☉', '☄', '☽', '☾', '☽'],
        colors: ['#00FFFF', '#40E0D0', '#00CED1', '#20B2AA', '#00FFFF', '#40E0D0']
    },
    mystical: {
        chars: ['✧', '✦', '✯', '✮', '✭', '✬', '✫', '✪', '✩', '✰', '✯', '✮', '✭', '✬', '✫', '✪', '✩', '✰', '✯', '✮'],
        colors: ['#9370DB', '#8A2BE2', '#9400D3', '#8B008B', '#9370DB', '#8A2BE2']
    }
};

let swapInterval;
let isHovering = false;
let currentSet = 'twinkle';
let originalSymbols = [];
let restoreTimeout;

// Store original symbols
document.querySelectorAll('.logo-symbol').forEach(symbol => {
    originalSymbols.push(symbol.textContent);
});

function getMirroredIndex(index, length) {
    return length - 1 - index;
}

function getRandomColor(set) {
    const colors = characterSets[set].colors;
    return colors[Math.floor(Math.random() * colors.length)];
}

function getRandomChar(set, excludeChars = []) {
    const chars = characterSets[set].chars;
    let availableChars = chars.filter(char => !excludeChars.includes(char));
    if (availableChars.length === 0) availableChars = chars;
    return availableChars[Math.floor(Math.random() * availableChars.length)];
}

function getAdjacentSymbols(symbols, index, columns = 10) {
    const adjacent = [];
    const row = Math.floor(index / columns);
    const col = index % columns;
    
    // Check above
    if (row > 0) adjacent.push(symbols[index - columns]);
    // Check below
    if (row < Math.floor(symbols.length / columns) - 1) adjacent.push(symbols[index + columns]);
    // Check left
    if (col > 0) adjacent.push(symbols[index - 1]);
    // Check right
    if (col < columns - 1) adjacent.push(symbols[index + 1]);
    
    return adjacent;
}

function swapRandomCharacter() {
    if (!isHovering) return;
    
    const symbols = logoSection.querySelectorAll('.logo-symbol');
    const length = symbols.length;
    
    // Get a random index from the first half of the text
    const randomIndex = Math.floor(Math.random() * (length / 2));
    const mirroredIndex = getMirroredIndex(randomIndex, length);
    
    // Get adjacent symbols
    const adjacentSymbols = getAdjacentSymbols(symbols, randomIndex);
    const adjacentChars = adjacentSymbols.map(s => s.textContent);
    
    // Get a random character that's not in adjacent positions
    const randomChar = getRandomChar(currentSet, adjacentChars);
    
    // Always swap the characters
    symbols[randomIndex].textContent = randomChar;
    symbols[mirroredIndex].textContent = randomChar;
    
    // Random chance to add color variation
    if (Math.random() < 0.3) { // 30% chance for color variation
        symbols[randomIndex].style.color = getRandomColor(currentSet);
        symbols[mirroredIndex].style.color = getRandomColor(currentSet);
    }

    // Randomly change character set occasionally
    if (Math.random() < 0.1) { // 10% chance to change set
        const sets = Object.keys(characterSets);
        const currentSetIndex = sets.indexOf(currentSet);
        currentSet = sets[(currentSetIndex + 1) % sets.length];
    }
}

function restoreSymbol(symbol, originalChar, delay) {
    setTimeout(() => {
        symbol.textContent = originalChar;
        symbol.style.color = ''; // Reset color
    }, delay);
}

function restoreOriginalText() {
    const symbols = logoSection.querySelectorAll('.logo-symbol');
    const restoreDelay = 20; // Delay between each symbol restore
    
    symbols.forEach((symbol, index) => {
        // Calculate delay based on position (staggered effect)
        const delay = index * restoreDelay;
        restoreSymbol(symbol, originalSymbols[index], delay);
    });
}

// Update cursor position
function updateCursorPosition(e) {
    const x = e.clientX;
    const y = e.clientY;
    cursor.style.left = x + 'px';
    cursor.style.top = y + 'px';
}

// Force hide cursor
function forceHideCursor() {
    logoSection.style.cursor = 'none';
    document.querySelectorAll('.article-nav-button').forEach(arrow => {
        arrow.style.cursor = 'none';
    });
}

// Show default cursor
function showDefaultCursor() {
    logoSection.style.cursor = '';
    document.querySelectorAll('.article-nav-button').forEach(arrow => {
        arrow.style.cursor = '';
    });
}

// Update gradient effect for an element
function updateGradientEffect(element, e) {
    const rect = element.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Add a slight delay to the gradient movement for smoother effect
    requestAnimationFrame(() => {
        element.style.setProperty('--mouse-x', `${x}%`);
        element.style.setProperty('--mouse-y', `${y}%`);
    });
}

// Function to sequentially randomize symbols
function sequentialRandomize() {
    const logoSymbols = document.querySelectorAll('.logo-symbol');
    const delay = 20; // Delay between each symbol change
    
    logoSymbols.forEach((symbol, index) => {
        setTimeout(() => {
            // Check if this is a letter position
            const isLetter = symbol.classList.contains('letter');
            if (!isLetter) {
                symbol.textContent = getRandomSymbol();
            } else {
                // Restore the original letter
                symbol.textContent = originalSymbols[index];
            }
        }, index * delay);
    });
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initializeRandomSymbols();
    
    // Mouse movement handling for the entire document
    document.addEventListener('mousemove', (e) => {
        updateCursorPosition(e);
        
        // Update gradient effect for nav buttons
        document.querySelectorAll('.article-nav-button').forEach(button => {
            updateGradientEffect(button, e);
        });
    });
    
    // Mouse movement handling for gradient effect
    logoSection.addEventListener('mousemove', (e) => {
        updateGradientEffect(logoSection, e);
    });
    
    // Ensure cursor stays hidden
    logoSection.addEventListener('mouseenter', () => {
        forceHideCursor();
        isHovering = true;
        currentSet = 'twinkle';
        // Clear any ongoing restore animation
        clearTimeout(restoreTimeout);
        // Start swapping characters more frequently
        swapInterval = setInterval(swapRandomCharacter, 100);
    });
    
    logoSection.addEventListener('mouseleave', () => {
        isHovering = false;
        clearInterval(swapInterval);
        sequentialRandomize();
        showDefaultCursor();
    });


    // Add hover events for nav buttons
    document.querySelectorAll('.article-nav-button').forEach(button => {
        button.addEventListener('mouseenter', forceHideCursor);
        button.addEventListener('mouseleave', showDefaultCursor);
    });
});

// Periodically randomize symbols (optional, uncomment if you want continuous randomization)
// setInterval(randomizeSymbols, 5000); 