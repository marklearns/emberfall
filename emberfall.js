'use strict';

// ============================================================
// GAME STATE
// ============================================================
const GameState = {
    hp: 100, maxHp: 100,
    mp: 60, maxMp: 60,
    xp: 0, xpToLevel: 100,
    level: 1,
    gold: 50,
    corruption: 0,
    morality: 50,
    location: 'title',
    chapter: 1,
    mode: 'story',
    hardcore: false,
    timeOfDay: 'day',
    dayCount: 1,
    kills: 0,
    deaths: 0,
    totalChoices: 0,
    timePlayed: 0,
    startTime: Date.now(),
    arenaWave: 0,
    arenaKills: 0,
    choices: {
        helpedVillagers: false,
        followedVoices: false,
        killedKing: false,
        freedKing: false,
        veilChoice: null,
    },
    inventory: [],
    lore: [],
    abilities: ['basic_attack'],
    questsComplete: [],
    locationsVisited: [],
    npcMemory: {},
    flags: {
        veilNodeUnlocked: false,
        dungeon_explored: false,
        castle_explored: false,
        arena_completed: false,
    }
};

// ============================================================
// SAVE / LOAD
// ============================================================
const Save = {
    key: 'emberfall_v5',

    save() {
        try {
            GameState.timePlayed += Math.floor((Date.now() - GameState.startTime) / 1000);
            GameState.startTime = Date.now();
            localStorage.setItem(this.key, JSON.stringify(GameState));
        } catch (e) {}
    },

    load() {
        try {
            const d = localStorage.getItem(this.key);
            if (!d) return false;

            const parsed = JSON.parse(d);

            const deepMerge = (target, source) => {
                for (const key in target) {
                    if (source.hasOwnProperty(key)) {
                        if (
                            typeof target[key] === 'object' &&
                            !Array.isArray(target[key]) &&
                            target[key] !== null
                        ) {
                            deepMerge(target[key], source[key] || {});
                        } else {
                            target[key] = source[key];
                        }
                    }
                }
            };

            deepMerge(GameState, parsed);
            GameState.startTime = Date.now();
            return true;
        } catch (e) {
            return false;
        }
    },

    exists() {
        return !!localStorage.getItem(this.key);
    },

    clear() {
        localStorage.removeItem(this.key);
    }
};

// ============================================================
// UTILITY
// ============================================================
const Utils = {
    rand(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    randFrom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },
    clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    },
    sleep(ms) {
        return new Promise(r => setTimeout(r, ms));
    },
    pct(val, max) {
        return Math.round((val / max) * 100);
    },
    $(id) {
        return document.getElementById(id);
    },
    $$(sel) {
        return document.querySelectorAll(sel);
    }
};

// ============================================================
// SCREEN EFFECTS
// ============================================================
const VFX = {
    flash(type = 'white') {
        const el = Utils.$('screen-flash');
        if (!el) return;
        el.className = 'screen-flash ' + type;
        el.offsetWidth;
        setTimeout(() => (el.className = 'screen-flash'), 500);
    },

    shake() {
        const vp = Utils.$('game-viewport');
        if (!vp) return;
        vp.classList.add('cam-shake');
        setTimeout(() => vp.classList.remove('cam-shake'), 400);
    },

    zoom() {
        const vp = Utils.$('game-viewport');
        if (!vp) return;
        vp.classList.add('cam-zoom');
        setTimeout(() => vp.classList.remove('cam-zoom'), 900);
    },

    walkCharIn(sceneId) {
        const char = Utils.$(sceneId + '-char');
        if (!char) return;
        const sprite = char.querySelector('.char-sprite');

        char.style.left = '-10%';
        char.style.opacity = '1';

        if (sprite) sprite.classList.add('char-walk');

        setTimeout(() => {
            char.style.left = '15%';
        }, 100);

        setTimeout(() => {
            if (sprite) sprite.classList.remove('char-walk');
        }, 1300);
    },

    createParticles(containerId, count, color, size) {
        const container = Utils.$(containerId);
        if (!container) return;

        container.innerHTML = '';

        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');

            p.style.cssText = `
                position:absolute;
                width:${size || Utils.rand(2,5)}px;
                height:${size || Utils.rand(2,5)}px;
                border-radius:50%;
                background:${color || 'rgba(240,192,64,0.3)'};
                left:${Utils.rand(0,100)}%;
                top:${Utils.rand(0,100)}%;
                animation:floatParticle ${Utils.rand(4,10)}s ease-in-out infinite;
                animation-delay:${Utils.rand(0,50)/10}s;
                pointer-events:none;
            `;

            container.appendChild(p);
        }
    }
};

// ============================================================
// TOAST NOTIFICATIONS
// ============================================================
const Toast = {
    show(msg, type = 'normal') {
        const el = document.createElement('div');
        el.className = 'toast ' + (type === 'danger' ? 'danger' : type === 'veil' ? 'veil' : '');
        el.textContent = msg;

        const container = Utils.$('toast-container');
        if (container) container.appendChild(el);

        setTimeout(() => el.remove(), 3200);
    }
};

// ============================================================
// CHOICE MODAL
// ============================================================
const Choice = {
    callbacks: [],

    show(title, body, options) {
        Utils.$('choice-title').textContent = title;
        Utils.$('choice-body').textContent = body;

        const opts = Utils.$('choice-options');

        opts.innerHTML = options
            .map((o, i) => `<div class="choice-opt" onclick="Choice.pick(${i})">${o.text}</div>`)
            .join('');

        this.callbacks = options.map(o => o.fn);

        Utils.$('choice-modal').classList.add('active');
        GameState.totalChoices++;
    },

    pick(i) {
        Utils.$('choice-modal').classList.remove('active');
        if (this.callbacks[i]) this.callbacks[i]();
    }
};

// ============================================================
// INVENTORY
// ============================================================
const Inventory = {
    currentTab: 'items',

    open() {
        this.render();
        Utils.$('inventory-overlay').classList.add('active');
    },

    close() {
        Utils.$('inventory-overlay').classList.remove('active');
    },

    tab(name, el) {
        this.currentTab = name;
        Utils.$$('.inv-tab').forEach(t => t.classList.remove('active'));
        el.classList.add('active');
        this.render();
    },

    render() {
        let items;

        if (this.currentTab === 'lore') {
            items = GameState.lore;
        } else {
            items = GameState.inventory.filter(
                i => (i.type || 'items') === this.currentTab
            );
        }

        const cont = Utils.$('inv-content');
        if (!cont) return;

        if (!items || !items.length) {
            cont.innerHTML = `<div style="text-align:center;">Nothing here yet.</div>`;
            return;
        }

        cont.innerHTML = items
            .map(
                item => `
                <div class="inv-item" onclick="Inventory.use('${item.id}')">
                    <div>${item.icon}</div>
                    <div>${item.name}</div>
                    <div>${item.desc}</div>
                </div>`
            )
            .join('');
    },

    addItem(item) {
        if (!GameState.inventory.find(i => i.id === item.id)) {
            GameState.inventory.push(item);
            Toast.show(`+ ${item.icon} ${item.name}`);
        }
    },

    removeItem(id) {
        const idx = GameState.inventory.findIndex(i => i.id === id);
        if (idx !== -1) GameState.inventory.splice(idx, 1);
    },

    use(id) {
        const item = GameState.inventory.find(i => i.id === id);
        if (!item) return;

        if (item.id === 'health_potion') {
            GameState.hp = Utils.clamp(GameState.hp + 30, 0, GameState.maxHp);
            this.removeItem(id);
            Toast.show('Restored 30 HP');
        }
    }
};
