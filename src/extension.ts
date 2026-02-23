
import * as vscode from 'vscode';

// Interface for custom pets
interface CustomPet {
    name: string;
    emoji: string;
    walkFrames: string[];
}

let statusBarButton: vscode.StatusBarItem;
let isAnimationRunning = false;
let reminderInterval: NodeJS.Timeout | undefined;
let typeCounter = 0;
let lastTypeTime = Date.now();

// Built-in pets collection
const builtInPets: CustomPet[] = [
    { name: "Cat", emoji: "🐱", walkFrames: ["🐱", "😺", "🐾"] },
    { name: "Dog", emoji: "🐶", walkFrames: ["🐶", "🐕", "🐾"] },
    { name: "Fox", emoji: "🦊", walkFrames: ["🦊", "🧡", "🐾"] },
    { name: "Rabbit", emoji: "🐰", walkFrames: ["🐰", "🐇", "🐾"] },
    { name: "Frog", emoji: "🐸", walkFrames: ["🐸", "🟢", "🐾"] },
    { name: "Koala", emoji: "🐨", walkFrames: ["🐨", "🍃", "🌿"] },
    { name: "Panda", emoji: "🐼", walkFrames: ["🐼", "🎋", "🐾"] },
    { name: "Raccoon", emoji: "🦝", walkFrames: ["🦝", "🌙", "🐾"] },
    { name: "Bear", emoji: "🐻", walkFrames: ["🐻", "🍯", "🐾"] },
    { name: "Wolf", emoji: "🐺", walkFrames: ["🐺", "🌙", "🐾"] },
    { name: "Tiger", emoji: "🐅", walkFrames: ["🐅", "🧡", "🐾"] },
    { name: "Lion", emoji: "🦁", walkFrames: ["🦁", "👑", "🐾"] }
];

export function activate(context: vscode.ExtensionContext) {
    console.log('🐾 Pet Runner is now active!');

    // Create the static status bar button
    createStatusBarButton();

    // Register commands
    const commands = [
        vscode.commands.registerCommand('vscodePets.runPet', () => runPet(context)),
        vscode.commands.registerCommand('vscodePets.managePets', () => managePets()),
        vscode.commands.registerCommand('vscodePets.exportPets', () => exportPets()),
        vscode.commands.registerCommand('vscodePets.importPets', () => importPets()),
        vscode.commands.registerCommand('vscodePets.feedPet', () => feedPet()),
        vscode.commands.registerCommand('vscodePets.playWithPet', () => playWithPet(context))
    ];

    // Add to subscriptions
    context.subscriptions.push(statusBarButton, ...commands);

    // Track user typing for XP and mood
    context.subscriptions.push(vscode.workspace.onDidChangeTextDocument(event => {
        if (event.contentChanges.length > 0) {
            typeCounter += event.contentChanges.length;
            lastTypeTime = Date.now();

            if (typeCounter > 100) {
                // Earn XP for typing
                addXp(10);
                typeCounter = 0;
            }
            updateStatusBarButton();
        }
    }));

    // Periodically update mood based on idle time and hunger
    setInterval(() => {
        const config = vscode.workspace.getConfiguration('vscodePets');
        let hunger = config.get<number>('hunger', 100);

        // Decrease hunger over time
        if (hunger > 0) {
            hunger = Math.max(0, hunger - 1);
            config.update('hunger', hunger, vscode.ConfigurationTarget.Global);
        }

        updateStatusBarButton();
    }, 60000); // 1 minute

    // Setup Pomodoro break reminder
    setupBreakReminder(context);

    // Listen for configuration changes (but button text stays static)
    vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration('vscodePets')) {
            updateStatusBarButton();
            setupBreakReminder(context);
        }
    });
}

function setupBreakReminder(context: vscode.ExtensionContext) {
    if (reminderInterval) {
        clearInterval(reminderInterval);
        reminderInterval = undefined;
    }

    const config = vscode.workspace.getConfiguration('vscodePets');
    const minutes = config.get<number>('breakReminderMinutes', 0);

    if (minutes > 0) {
        reminderInterval = setInterval(() => {
            vscode.window.showInformationMessage('☕ Time for a break! Here is your pet reminder.');
            runPet(context);
        }, minutes * 60 * 1000);
    }
}

function createStatusBarButton() {
    statusBarButton = vscode.window.createStatusBarItem(
        vscode.StatusBarAlignment.Right,
        100
    );
    updateStatusBarButton();
    statusBarButton.show();
}

function updateStatusBarButton() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const level = config.get<number>('level', 1);
    const hunger = config.get<number>('hunger', 100);
    const favoritePet = config.get<string>('favoritePet', '🐾');
    const primaryEmoji = favoritePet && favoritePet !== '' ? favoritePet : '🐾';

    let moodEmoji = '';
    const idleTime = Date.now() - lastTypeTime;

    if (hunger < 20) {
        moodEmoji = ' 🤤'; // Hungry
    } else if (idleTime > 10 * 60 * 1000) { // 10 minutes idle
        moodEmoji = ' 💤'; // Sleeping
    } else if (idleTime < 5000) { // Actively typing
        moodEmoji = ' 💻'; // Working
    }

    statusBarButton.text = `${primaryEmoji} Lvl ${level}${moodEmoji}`;
    statusBarButton.tooltip = `Level ${level} | Hunger: ${hunger}% | Click to run!`;
    statusBarButton.command = 'vscodePets.runPet';
    statusBarButton.backgroundColor = isAnimationRunning || hunger < 20
        ? new vscode.ThemeColor('statusBarItem.warningBackground')
        : undefined;
}

async function addXp(amount: number) {
    const config = vscode.workspace.getConfiguration('vscodePets');
    let xp = config.get<number>('xp', 0);
    let level = config.get<number>('level', 1);

    xp += amount;
    const nextLevelXp = level * 100;

    if (xp >= nextLevelXp) {
        level += 1;
        xp -= nextLevelXp;

        const favoritePetName = config.get<string>('favoritePetName', 'Your pet');
        vscode.window.showInformationMessage(`🎉 ${favoritePetName} leveled up to Level ${level}!`);
    }

    await config.update('xp', xp, vscode.ConfigurationTarget.Global);
    await config.update('level', level, vscode.ConfigurationTarget.Global);
    updateStatusBarButton();
}

async function feedPet() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    let hunger = config.get<number>('hunger', 100);

    if (hunger >= 100) {
        vscode.window.showInformationMessage('Your pet is already full! 🛑');
        return;
    }

    hunger = Math.min(100, hunger + 30);
    await config.update('hunger', hunger, vscode.ConfigurationTarget.Global);

    // Gain XP for taking care of pet
    await addXp(15);

    const favoritePetName = config.get<string>('favoritePetName', 'Your pet');
    vscode.window.showInformationMessage(`🍔 You fed ${favoritePetName}! Hunger is now ${hunger}%.`);
    updateStatusBarButton();
}

async function playWithPet(context: vscode.ExtensionContext) {
    const config = vscode.workspace.getConfiguration('vscodePets');
    // Gain XP for playing
    await addXp(25);
    const favoritePetName = config.get<string>('favoritePetName', 'Your pet');
    vscode.window.showInformationMessage(`🎾 You played with ${favoritePetName}! It looks happy.`);
    runPet(context);
}

async function runPet(context: vscode.ExtensionContext) {
    if (isAnimationRunning) {
        vscode.window.showInformationMessage('🐾 A pet is already running! Wait for it to finish.');
        return;
    }

    const config = vscode.workspace.getConfiguration('vscodePets');
    const favoritePet = config.get<string>('favoritePet', '');
    const favoritePetName = config.get<string>('favoritePetName', '');

    let petToRun: CustomPet;

    // Smart behavior: If favorite pet is set, run only that pet. Otherwise, run random.
    if (favoritePet && favoritePet.trim() !== '') {
        // User has set a favorite pet - run only that pet
        const customPets = config.get<CustomPet[]>('customPets', []);
        const allPets = [...builtInPets, ...customPets];

        // Try to find the favorite pet in the collections
        petToRun = allPets.find(pet => pet.emoji === favoritePet || pet.name === favoritePetName) || {
            name: favoritePetName || 'Favorite',
            emoji: favoritePet,
            walkFrames: [favoritePet, '🐾']
        };
    } else {
        // No favorite pet set - run random pet
        const customPets = config.get<CustomPet[]>('customPets', []);
        const collection = config.get<string>('petCollection', 'mixed');

        let availablePets: CustomPet[] = [];

        switch (collection) {
            case 'built-in':
                availablePets = [...builtInPets];
                break;
            case 'custom':
                availablePets = [...customPets];
                break;
            case 'mixed':
            default:
                availablePets = [...builtInPets, ...customPets];
                break;
        }

        if (availablePets.length === 0) {
            vscode.window.showInformationMessage('No pets available! Add some custom pets or change your collection setting.');
            return;
        }

        petToRun = availablePets[Math.floor(Math.random() * availablePets.length)];
    }

    await runPetAnimation(context, petToRun, favoritePet !== '');
}

async function managePets() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const favoritePet = config.get<string>('favoritePet', '');
    const favoritePetName = config.get<string>('favoritePetName', '');

    const items: vscode.QuickPickItem[] = [
        {
            label: "$(heart) Set Favorite Pet",
            description: favoritePet ? `Current: ${favoritePet} ${favoritePetName}` : "No favorite set (runs random pets)",
            detail: "Choose a pet to always run when clicking the button"
        },
        {
            label: "$(plus) Add Custom Pet",
            description: "Create a new custom pet",
            detail: "Add your own pet with custom name, emoji, and animation"
        },
        {
            label: "$(list-unordered) View All Pets",
            description: "See all available pets (built-in + custom)",
            detail: "Browse your complete pet collection"
        },
        {
            label: "$(edit) Edit Custom Pet",
            description: "Modify an existing custom pet",
            detail: "Change name, emoji, or walking animation"
        },
        {
            label: "$(trash) Delete Custom Pet",
            description: "Remove a custom pet",
            detail: "Delete pets you no longer want"
        },
        {
            label: "$(refresh) Reset to Defaults",
            description: "Reset all settings to default values",
            detail: "This will remove all custom pets and clear favorite"
        },
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        {
            label: "$(export) Export Custom Pets",
            description: "Export pets to clipboard",
            detail: "Share your pets with others"
        },
        {
            label: "$(import) Import Custom Pets",
            description: "Import pets from clipboard",
            detail: "Add custom pets from others"
        },
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        {
            label: "$(gear) Open Settings",
            description: "Open Pet Runner settings in VS Code",
            detail: "Configure animation speed, sparkles, and other options"
        }
    ];

    const selected = await vscode.window.showQuickPick(items, {
        title: "🐾 Pet Runner Management",
        placeHolder: "What would you like to do?"
    });

    if (!selected) return;

    switch (selected.label) {
        case "$(heart) Set Favorite Pet":
            await setFavoritePet();
            break;
        case "$(plus) Add Custom Pet":
            await addCustomPet();
            break;
        case "$(list-unordered) View All Pets":
            await viewAllPets();
            break;
        case "$(edit) Edit Custom Pet":
            await editCustomPet();
            break;
        case "$(trash) Delete Custom Pet":
            await deleteCustomPet();
            break;
        case "$(refresh) Reset to Defaults":
            await resetToDefaults();
            break;
        case "$(export) Export Custom Pets":
            await exportPets();
            break;
        case "$(import) Import Custom Pets":
            await importPets();
            break;
        case "$(gear) Open Settings":
            vscode.commands.executeCommand('workbench.action.openSettings', 'vscodePets');
            break;
    }
}

async function setFavoritePet() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const customPets = config.get<CustomPet[]>('customPets', []);
    const allPets = [...builtInPets, ...customPets];

    const quickPickItems: vscode.QuickPickItem[] = [
        {
            label: "$(circle-slash) No Favorite (Random Pets)",
            description: "Clear favorite pet to run random pets",
            detail: "Button will run a different pet each time"
        },
        {
            label: "$(symbol-color) Custom Emoji",
            description: "Enter your own custom emoji",
            detail: "Use any emoji as your favorite pet"
        },
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        { label: "Built-in Pets", kind: vscode.QuickPickItemKind.Separator }
    ];

    // Add built-in pets
    builtInPets.forEach(pet => {
        quickPickItems.push({
            label: `${pet.emoji} ${pet.name}`,
            description: pet.walkFrames.join(' '),
            detail: "Built-in pet - will always run when button is clicked"
        });
    });

    // Add custom pets if any exist
    if (customPets.length > 0) {
        quickPickItems.push({ label: "Your Custom Pets", kind: vscode.QuickPickItemKind.Separator });
        customPets.forEach(pet => {
            quickPickItems.push({
                label: `${pet.emoji} ${pet.name}`,
                description: pet.walkFrames.join(' '),
                detail: "Your custom pet - will always run when button is clicked"
            });
        });
    }

    const selected = await vscode.window.showQuickPick(quickPickItems, {
        title: "💖 Set Favorite Pet",
        placeHolder: "Choose your favorite pet (or clear to run random pets)..."
    });

    if (!selected) return;

    if (selected.label === "$(circle-slash) No Favorite (Random Pets)") {
        // Clear favorite pet
        await config.update('favoritePet', '', vscode.ConfigurationTarget.Global);
        await config.update('favoritePetName', '', vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage('🎲 Favorite pet cleared! Button will now run random pets.');
    } else if (selected.label === "$(symbol-color) Custom Emoji") {
        await setCustomFavoritePet();
    } else {
        // Extract emoji and name from selection
        const parts = selected.label.split(' ');
        const emoji = parts[0];
        const name = parts.slice(1).join(' ');

        await config.update('favoritePet', emoji, vscode.ConfigurationTarget.Global);
        await config.update('favoritePetName', name, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(`💖 ${name} is now your favorite pet! ${emoji} Button will always run ${name}.`);
    }
}

async function setCustomFavoritePet() {
    const config = vscode.workspace.getConfiguration('vscodePets');

    const emoji = await vscode.window.showInputBox({
        title: "💖 Custom Favorite Pet - Emoji",
        prompt: "Enter your favorite emoji or symbol",
        placeHolder: "🦄, 👽, 🌟, 🚀, etc...",
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter an emoji or symbol";
            }
            if (value.length > 10) {
                return "Please keep it short (max 10 characters)";
            }
            return null;
        }
    });

    if (!emoji) return;

    const name = await vscode.window.showInputBox({
        title: "💖 Custom Favorite Pet - Name",
        prompt: "What would you like to call this pet?",
        placeHolder: "Sparkles, Cosmic, Spirit, etc...",
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter a name";
            }
            if (value.length > 20) {
                return "Please keep the name shorter (max 20 characters)";
            }
            return null;
        }
    });

    if (!name) return;

    await config.update('favoritePet', emoji.trim(), vscode.ConfigurationTarget.Global);
    await config.update('favoritePetName', name.trim(), vscode.ConfigurationTarget.Global);

    vscode.window.showInformationMessage(`💖 ${name.trim()} ${emoji.trim()} is now your favorite pet! Button will always run ${name.trim()}.`);
}

async function addCustomPet() {
    const config = vscode.workspace.getConfiguration('vscodePets');

    // Get pet name
    const name = await vscode.window.showInputBox({
        title: "➕ Add Custom Pet - Name",
        prompt: "What's your new pet's name?",
        placeHolder: "Dragon, Unicorn, Spirit, etc...",
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter a name";
            }
            if (value.length > 30) {
                return "Please keep the name shorter (max 30 characters)";
            }
            return null;
        }
    });

    if (!name) return;

    // Get main emoji
    const emoji = await vscode.window.showInputBox({
        title: `➕ Add Custom Pet - ${name} Emoji`,
        prompt: `What emoji represents ${name}?`,
        placeHolder: "🐉, 🦄, 👻, 🚀, etc...",
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter an emoji";
            }
            if (value.length > 5) {
                return "Please use a single emoji or short symbol";
            }
            return null;
        }
    });

    if (!emoji) return;

    // Get walking frames
    const walkFrames = await vscode.window.showInputBox({
        title: `➕ Add Custom Pet - ${name} Animation`,
        prompt: `Enter 2-4 emojis for ${name}'s walking animation (space separated)`,
        placeHolder: `${emoji} ✨ 💨 (or just ${emoji} 🐾)`,
        validateInput: (value) => {
            if (!value || value.trim().length === 0) {
                return "Please enter at least one emoji for animation";
            }
            const frames = value.split(' ').filter(f => f.trim().length > 0);
            if (frames.length > 6) {
                return "Please use 6 or fewer animation frames";
            }
            return null;
        }
    });

    if (!walkFrames) return;

    // Process walk frames
    const frames = walkFrames.split(' ').filter(f => f.trim().length > 0);
    if (frames.length === 0) {
        frames.push(emoji, '🐾');
    }

    // Add to custom pets
    const customPets = config.get<CustomPet[]>('customPets', []);
    const newPet: CustomPet = {
        name: name.trim(),
        emoji: emoji.trim(),
        walkFrames: frames
    };

    // Check if pet already exists
    const existingIndex = customPets.findIndex(pet =>
        pet.name.toLowerCase() === newPet.name.toLowerCase() || pet.emoji === newPet.emoji
    );

    if (existingIndex >= 0) {
        const replace = await vscode.window.showWarningMessage(
            `A pet named "${customPets[existingIndex].name}" or with emoji "${customPets[existingIndex].emoji}" already exists. Replace it?`,
            'Replace', 'Cancel'
        );

        if (replace === 'Replace') {
            customPets[existingIndex] = newPet;
        } else {
            return;
        }
    } else {
        customPets.push(newPet);
    }

    await config.update('customPets', customPets, vscode.ConfigurationTarget.Global);

    const setAsFavorite = await vscode.window.showInformationMessage(
        `✨ ${newPet.name} ${newPet.emoji} has been added to your custom pets!`,
        'Set as Favorite', 'OK'
    );

    if (setAsFavorite === 'Set as Favorite') {
        await config.update('favoritePet', newPet.emoji, vscode.ConfigurationTarget.Global);
        await config.update('favoritePetName', newPet.name, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`💖 ${newPet.name} is now your favorite pet! Button will always run ${newPet.name}.`);
    }
}

async function viewAllPets() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const customPets = config.get<CustomPet[]>('customPets', []);
    const favoritePet = config.get<string>('favoritePet', '');

    const items: vscode.QuickPickItem[] = [
        { label: "Built-in Pets", kind: vscode.QuickPickItemKind.Separator }
    ];

    builtInPets.forEach(pet => {
        const isFavorite = pet.emoji === favoritePet;
        items.push({
            label: `${pet.emoji} ${pet.name}${isFavorite ? ' 💖' : ''}`,
            description: `Animation: ${pet.walkFrames.join(' ')}`,
            detail: isFavorite ? "Your favorite pet ❤️" : "Built-in pet"
        });
    });

    if (customPets.length > 0) {
        items.push({ label: "Your Custom Pets", kind: vscode.QuickPickItemKind.Separator });
        customPets.forEach(pet => {
            const isFavorite = pet.emoji === favoritePet;
            items.push({
                label: `${pet.emoji} ${pet.name}${isFavorite ? ' 💖' : ''}`,
                description: `Animation: ${pet.walkFrames.join(' ')}`,
                detail: isFavorite ? "Your favorite custom pet ❤️" : "Your custom pet"
            });
        });
    }

    items.push(
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        { label: `📊 Total Pets: ${builtInPets.length + customPets.length}`, kind: vscode.QuickPickItemKind.Separator }
    );

    await vscode.window.showQuickPick(items, {
        title: "👀 All Available Pets",
        placeHolder: "Your complete pet collection..."
    });
}

async function editCustomPet() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const customPets = config.get<CustomPet[]>('customPets', []);

    if (customPets.length === 0) {
        vscode.window.showInformationMessage("You don't have any custom pets to edit. Add one first!");
        return;
    }

    const items = customPets.map(pet => ({
        label: `${pet.emoji} ${pet.name}`,
        description: `Animation: ${pet.walkFrames.join(' ')}`,
        detail: "Click to edit this pet"
    }));

    const selected = await vscode.window.showQuickPick(items, {
        title: "✏️ Edit Custom Pet",
        placeHolder: "Which pet would you like to edit?"
    });

    if (!selected) return;

    const petName = selected.label.split(' ').slice(1).join(' ');
    const petIndex = customPets.findIndex(pet => pet.name === petName);

    if (petIndex >= 0) {
        const pet = customPets[petIndex];

        const action = await vscode.window.showInformationMessage(
            `Edit ${pet.name} ${pet.emoji}. Currently this will replace the entire pet. Individual field editing coming soon!`,
            'Replace Pet', 'Cancel'
        );

        if (action === 'Replace Pet') {
            customPets.splice(petIndex, 1);
            await config.update('customPets', customPets, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`${pet.name} has been removed. Now add the updated version:`);
            await addCustomPet();
        }
    }
}

async function deleteCustomPet() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const customPets = config.get<CustomPet[]>('customPets', []);

    if (customPets.length === 0) {
        vscode.window.showInformationMessage("You don't have any custom pets to delete.");
        return;
    }

    const items = [
        ...customPets.map(pet => ({
            label: `${pet.emoji} ${pet.name}`,
            description: `Animation: ${pet.walkFrames.join(' ')}`,
            detail: "Click to delete this pet"
        })),
        { label: "", kind: vscode.QuickPickItemKind.Separator },
        {
            label: "$(trash) Delete All Custom Pets",
            description: "Remove all your custom pets at once",
            detail: "⚠️  This cannot be undone"
        }
    ];

    const selected = await vscode.window.showQuickPick(items, {
        title: "🗑️ Delete Custom Pet",
        placeHolder: "Which pet would you like to remove?"
    });

    if (!selected) return;

    if (selected.label === "$(trash) Delete All Custom Pets") {
        const confirm = await vscode.window.showWarningMessage(
            `Are you sure you want to delete ALL ${customPets.length} custom pets? This cannot be undone.`,
            'Delete All', 'Cancel'
        );

        if (confirm === 'Delete All') {
            await config.update('customPets', [], vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`All ${customPets.length} custom pets have been deleted.`);
        }
    } else {
        const petName = selected.label.split(' ').slice(1).join(' ');
        const petIndex = customPets.findIndex(pet => pet.name === petName);

        if (petIndex >= 0) {
            const pet = customPets[petIndex];
            const confirm = await vscode.window.showWarningMessage(
                `Are you sure you want to delete ${pet.name} ${pet.emoji}? This cannot be undone.`,
                'Delete', 'Cancel'
            );

            if (confirm === 'Delete') {
                customPets.splice(petIndex, 1);
                await config.update('customPets', customPets, vscode.ConfigurationTarget.Global);
                vscode.window.showInformationMessage(`${pet.name} has been deleted from your custom pets.`);

                // If this was the favorite pet, clear favorite
                const favoritePet = config.get<string>('favoritePet', '');
                if (favoritePet === pet.emoji) {
                    await config.update('favoritePet', '', vscode.ConfigurationTarget.Global);
                    await config.update('favoritePetName', '', vscode.ConfigurationTarget.Global);
                    vscode.window.showInformationMessage(`Your favorite pet has been cleared. Button will now run random pets.`);
                }
            }
        }
    }
}

async function resetToDefaults() {
    const confirm = await vscode.window.showWarningMessage(
        '⚠️ Reset to Defaults\n\nThis will:\n• Remove all custom pets\n• Clear favorite pet (button will run random pets)\n• Reset all settings to default values\n\nThis cannot be undone. Continue?',
        'Reset Everything', 'Cancel'
    );

    if (confirm !== 'Reset Everything') return;

    const config = vscode.workspace.getConfiguration('vscodePets');

    try {
        // Reset all settings to defaults
        await config.update('favoritePet', undefined, vscode.ConfigurationTarget.Global);
        await config.update('favoritePetName', undefined, vscode.ConfigurationTarget.Global);
        await config.update('customPets', undefined, vscode.ConfigurationTarget.Global);
        await config.update('petCollection', undefined, vscode.ConfigurationTarget.Global);
        await config.update('animationSpeed', undefined, vscode.ConfigurationTarget.Global);
        await config.update('showSparkles', undefined, vscode.ConfigurationTarget.Global);
        await config.update('customSparkles', undefined, vscode.ConfigurationTarget.Global);
        await config.update('showPetName', undefined, vscode.ConfigurationTarget.Global);
        await config.update('petSize', undefined, vscode.ConfigurationTarget.Global);

        vscode.window.showInformationMessage(
            '✅ Reset Complete!\n\n• All custom pets removed\n• Favorite pet cleared\n• Button will now run random pets\n• All settings restored to defaults'
        );

    } catch (error) {
        vscode.window.showErrorMessage('Failed to reset settings. Please try again or reset manually in VS Code settings.');
    }
}

async function runPetAnimation(context: vscode.ExtensionContext, petData: CustomPet, isFavorite: boolean): Promise<void> {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const animationSpeed = config.get<number>('animationSpeed', 5000);
    const showSparkles = config.get<boolean>('showSparkles', true);
    const showPetName = config.get<boolean>('showPetName', true);
    const customSparkles = config.get<string[]>('customSparkles', ['✨', '⭐', '💫', '🌟', '💖', '🎀']);
    const petSize = config.get<string>('petSize', 'normal');

    isAnimationRunning = true;
    updateStatusBarButton();

    if (showPetName) {
        const petType = isFavorite ? '💖 Favorite pet' : '🎲 Random pet';
        vscode.window.showInformationMessage(`${petType}: ${petData.name} is running! ${petData.emoji}`);
    }

    try {
        await createPetAnimation(context, petData, animationSpeed, showSparkles, customSparkles, petSize);
    } finally {
        isAnimationRunning = false;
        updateStatusBarButton();
    }
}

async function createPetAnimation(
    context: vscode.ExtensionContext,
    petData: CustomPet,
    duration: number,
    showSparkles: boolean,
    customSparkles: string[],
    petSize: string
): Promise<void> {
    return new Promise((resolve) => {
        const panel = vscode.window.createWebviewPanel(
            'petAnimation',
            `${petData.name} Runner`,
            {
                viewColumn: vscode.ViewColumn.Active,
                preserveFocus: true
            },
            {
                enableScripts: true,
                retainContextWhenHidden: false
            }
        );

        panel.webview.html = getBeautifulPetAnimationHtml(petData, duration, showSparkles, customSparkles, petSize);

        panel.webview.onDidReceiveMessage((message) => {
            if (message.command === 'animationComplete') {
                panel.dispose();
                resolve();
            }
        });

        panel.onDidDispose(() => resolve());

        setTimeout(() => {
            if (panel) {
                panel.dispose();
            }
            resolve();
        }, duration + 1000);
    });
}

function getBeautifulPetAnimationHtml(petData: CustomPet, duration: number, showSparkles: boolean, customSparkles: string[], petSize: string): string {
    const nonce = getNonce();

    // Pet size mapping
    const sizeMap = {
        'small': 32,
        'normal': 48,
        'large': 64
    };
    const fontSize = sizeMap[petSize as keyof typeof sizeMap] || 48;

    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; script-src 'nonce-${nonce}';">
        <title>🐾 ${petData.name} is Running!</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                height: 100vh;
                background: linear-gradient(135deg, rgba(255,182,193,0.1) 0%, rgba(173,216,230,0.1) 100%);
                overflow: hidden;
                position: relative;
                cursor: none;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            
            .pet-container {
                position: absolute;
                bottom: 30px;
                left: -150px;
                width: 100px;
                height: 100px;
                font-size: ${fontSize}px;
                display: flex;
                align-items: center;
                justify-content: center;
                animation: beautifulRun ${duration}ms cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
                z-index: 9999;
                transform-origin: center bottom;
            }
            
            .pet {
                animation: gentleBounce 800ms ease-in-out infinite alternate;
                filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
                transition: all 0.3s ease;
            }
            
            .pet-name {
                position: absolute;
                top: -40px;
                left: 50%;
                transform: translateX(-50%);
                font-size: 14px;
                color: #333;
                background: linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.7) 100%);
                backdrop-filter: blur(10px);
                padding: 4px 12px;
                border-radius: 20px;
                white-space: nowrap;
                animation: nameFloat 3s ease-in-out infinite;
                border: 1px solid rgba(255,255,255,0.3);
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            
            @keyframes beautifulRun {
                0% {
                    left: -150px;
                    transform: scaleX(1) translateY(0px);
                }
                10% {
                    transform: scaleX(1) translateY(-20px);
                }
                20% {
                    transform: scaleX(1) translateY(0px);
                }
                30% {
                    transform: scaleX(1) translateY(-15px);
                }
                40% {
                    left: calc(20vw - 50px);
                    transform: scaleX(1) translateY(0px);
                }
                50% {
                    left: calc(50vw - 50px);
                    transform: scaleX(1) translateY(-10px);
                }
                60% {
                    transform: scaleX(1) translateY(0px);
                }
                70% {
                    left: calc(80vw - 50px);
                    transform: scaleX(1) translateY(-8px);
                }
                80% {
                    transform: scaleX(1) translateY(0px);
                }
                90% {
                    transform: scaleX(1) translateY(-5px);
                }
                100% {
                    left: calc(100vw + 150px);
                    transform: scaleX(1) translateY(0px);
                }
            }
            
            @keyframes gentleBounce {
                0% { 
                    transform: translateY(0px) scaleY(1) scaleX(1);
                }
                100% { 
                    transform: translateY(-12px) scaleY(0.85) scaleX(1.1);
                }
            }
            
            @keyframes nameFloat {
                0%, 100% { 
                    opacity: 0.8;
                    transform: translateX(-50%) translateY(0px);
                }
                50% { 
                    opacity: 1;
                    transform: translateX(-50%) translateY(-3px);
                }
            }
            
            .sparkle {
                position: absolute;
                font-size: ${Math.floor(fontSize * 0.4)}px;
                pointer-events: none;
                animation: beautifulSparkle 2s ease-out forwards;
                z-index: 9998;
            }
            
            @keyframes beautifulSparkle {
                0% {
                    opacity: 1;
                    transform: translateY(0px) scale(0.5) rotate(0deg);
                }
                20% {
                    opacity: 1;
                    transform: translateY(-10px) scale(1) rotate(90deg);
                }
                50% {
                    opacity: 0.8;
                    transform: translateY(-25px) scale(1.3) rotate(180deg);
                }
                80% {
                    opacity: 0.4;
                    transform: translateY(-40px) scale(0.8) rotate(270deg);
                }
                100% {
                    opacity: 0;
                    transform: translateY(-60px) scale(0.2) rotate(360deg);
                }
            }
            
            .ground-effect {
                position: absolute;
                bottom: 15px;
                font-size: ${Math.floor(fontSize * 0.3)}px;
                opacity: 0.6;
                animation: groundDust 1.2s ease-out forwards;
                z-index: 9997;
            }
            
            @keyframes groundDust {
                0% {
                    opacity: 0.6;
                    transform: translateX(0px) scale(1) rotate(0deg);
                }
                50% {
                    opacity: 0.4;
                    transform: translateX(-20px) scale(1.2) rotate(180deg);
                }
                100% {
                    opacity: 0;
                    transform: translateX(-50px) scale(0.3) rotate(360deg);
                }
            }
            
            /* Beautiful background effects */
            .background-sparkle {
                position: absolute;
                font-size: 20px;
                opacity: 0.3;
                animation: backgroundFloat 8s ease-in-out infinite;
                pointer-events: none;
                z-index: 1;
            }
            
            @keyframes backgroundFloat {
                0%, 100% {
                    transform: translateY(0px) rotate(0deg);
                    opacity: 0.1;
                }
                50% {
                    transform: translateY(-20px) rotate(180deg);
                    opacity: 0.3;
                }
            }
        </style>
    </head>
    <body>
        <div class="pet-container" id="petContainer">
            <div class="pet" id="pet">${petData.emoji}</div>
            <div class="pet-name">${petData.name}</div>
        </div>
        
        <script nonce="${nonce}">
            const petContainer = document.getElementById('petContainer');
            const pet = document.getElementById('pet');
            const showSparkles = ${showSparkles};
            const duration = ${duration};
            const walkFrames = ${JSON.stringify(petData.walkFrames)};
            const customSparkles = ${JSON.stringify(customSparkles)};
            
            let frameIndex = 0;
            
            // Add beautiful background sparkles
            function createBackgroundSparkles() {
                const sparkles = ['✨', '⭐', '💫', '🌟'];
                for (let i = 0; i < 8; i++) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'background-sparkle';
                    sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
                    sparkle.style.left = Math.random() * 100 + '%';
                    sparkle.style.top = Math.random() * 100 + '%';
                    sparkle.style.animationDelay = Math.random() * 8 + 's';
                    document.body.appendChild(sparkle);
                    
                    setTimeout(() => sparkle.remove(), 8000);
                }
            }
            
            // Create background sparkles
            createBackgroundSparkles();
            
            // Slower, more beautiful walking animation
            const walkInterval = setInterval(() => {
                pet.textContent = walkFrames[frameIndex % walkFrames.length];
                frameIndex++;
            }, 400); // Slower frame changes
            
            // Add beautiful sparkle effects
            if (showSparkles) {
                const sparkleInterval = setInterval(() => {
                    addSparkle();
                    if (Math.random() > 0.7) {
                        addGroundEffect();
                    }
                }, 250); // Less frequent sparkles
                
                setTimeout(() => {
                    clearInterval(sparkleInterval);
                }, duration - 500);
            }
            
            function addSparkle() {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                sparkle.textContent = customSparkles[Math.floor(Math.random() * customSparkles.length)];
                
                const rect = petContainer.getBoundingClientRect();
                sparkle.style.left = (rect.left + Math.random() * 100 - 50) + 'px';
                sparkle.style.bottom = (35 + Math.random() * 60) + 'px';
                
                document.body.appendChild(sparkle);
                
                setTimeout(() => sparkle.remove(), 2000);
            }
            
            function addGroundEffect() {
                const effects = ['💨', '🌪️', '💭', '☁️'];
                const effect = document.createElement('div');
                effect.className = 'ground-effect';
                effect.textContent = effects[Math.floor(Math.random() * effects.length)];
                
                const rect = petContainer.getBoundingClientRect();
                effect.style.left = (rect.left + Math.random() * 60) + 'px';
                
                document.body.appendChild(effect);
                
                setTimeout(() => effect.remove(), 1200);
            }
            
            // Clean up and notify completion
            setTimeout(() => {
                clearInterval(walkInterval);
                
                if (window.acquireVsCodeApi) {
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({command: 'animationComplete'});
                }
            }, duration - 200);
            
            // Click to close early
            document.addEventListener('click', () => {
                if (window.acquireVsCodeApi) {
                    const vscode = acquireVsCodeApi();
                    vscode.postMessage({command: 'animationComplete'});
                }
            });
            
            // Add some interactivity
            pet.addEventListener('mouseover', () => {
                pet.style.transform = 'scale(1.2)';
            });
            
            pet.addEventListener('mouseout', () => {
                pet.style.transform = 'scale(1)';
            });
        </script>
    </body>
    </html>`;
}

function getNonce(): string {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

export function deactivate() {
    console.log('🐾 Pet Runner is deactivating...');
    if (statusBarButton) {
        statusBarButton.dispose();
    }
    if (reminderInterval) {
        clearInterval(reminderInterval);
    }
}

async function exportPets() {
    const config = vscode.workspace.getConfiguration('vscodePets');
    const customPets = config.get<CustomPet[]>('customPets', []);
    if (customPets.length === 0) {
        vscode.window.showInformationMessage('No custom pets to export!');
        return;
    }
    await vscode.env.clipboard.writeText(JSON.stringify(customPets, null, 2));
    vscode.window.showInformationMessage('📋 Custom pets exported to clipboard!');
}

async function importPets() {
    try {
        const text = await vscode.env.clipboard.readText();
        const imported = JSON.parse(text);
        if (Array.isArray(imported) && imported.length > 0 && imported[0].name && imported[0].emoji && imported[0].walkFrames) {
            const config = vscode.workspace.getConfiguration('vscodePets');
            const customPets = config.get<CustomPet[]>('customPets', []);

            const newPets = [...customPets, ...imported];
            const uniquePets = newPets.filter((pet, index, self) =>
                index === self.findIndex((p) => p.name === pet.name)
            );

            await config.update('customPets', uniquePets, vscode.ConfigurationTarget.Global);
            vscode.window.showInformationMessage(`✅ Successfully imported ${imported.length} custom pets! Your pet list now has ${uniquePets.length} custom pets.`);
        } else {
            throw new Error("Invalid format");
        }
    } catch (e) {
        vscode.window.showErrorMessage('❌ Failed to import pets. Make sure valid JSON is in your clipboard.');
    }
}
