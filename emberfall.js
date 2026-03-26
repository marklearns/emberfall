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
        } catch(e) {}
    },
    load() {
        try {
            const d = localStorage.getItem(this.key);
            if (!d) return false;
            const parsed = JSON.parse(d);
            
            const deepMerge = (target, source) => {
                for (const key in target) {
                    if (source.hasOwnProperty(key)) {
                        if (typeof target[key] === 'object' && !Array.isArray(target[key]) && target[key] !== null) {
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
        } catch(e) { return false; }
    },
    exists() { return !!localStorage.getItem(this.key); },
    clear() { localStorage.removeItem(this.key); }
};

// ============================================================
// UTILITY
// ============================================================
const Utils = {
    rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    randFrom(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(val, min, max) { return Math.max(min, Math.min(max, val)); },
    sleep(ms) { return new Promise(r => setTimeout(r, ms)); },
    pct(val, max) { return Math.round((val / max) * 100); },
    $(id) { return document.getElementById(id); },
    $$(sel) { return document.querySelectorAll(sel); }
};

// ============================================================
// SCREEN EFFECTS
// ============================================================
const VFX = {
    flash(type = 'white') {
        const el = Utils.$('screen-flash');
        if (!el) return;
        el.className = type;
        el.offsetWidth; // force reflow
        setTimeout(() => el.className = '', 600);
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
        setTimeout(() => { char.style.left = '15%'; }, 100);
        setTimeout(() => { if (sprite) sprite.classList.remove('char-walk'); }, 1300);
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
                animation-delay: ${Utils.rand(0,50)/10}s;
                pointer-events:none;
            `;
            container.appendChild(p);
        }
    }
};

// ============================================================
// AMBIENT GENERATORS
// ============================================================
const Ambient = {
    createFireflies(containerId, count = 15) {
        const c = Utils.$(containerId);
        if (!c) return;
        c.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const f = document.createElement('div');
            f.className = 'firefly';
            f.style.cssText = `
                left:${Utils.rand(5,95)}%;
                top:${Utils.rand(10,90)}%;
                --fd:${Utils.rand(4,9)}s;
                --fx:${Utils.rand(-40,40)}px;
                --fy:${Utils.rand(-50,20)}px;
                --fx2:${Utils.rand(-30,50)}px;
                --fy2:${Utils.rand(-20,30)}px;
                --fx3:${Utils.rand(-20,20)}px;
                --fy3:${Utils.rand(-40,10)}px;
                animation-delay:${Utils.rand(0,50)/10}s;
            `;
            c.appendChild(f);
        }
    },
    createSmoke(containerId, count = 6) {
        const c = Utils.$(containerId);
        if (!c) return;
        c.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const s = document.createElement('div');
            s.className = 'smoke';
            s.style.cssText = `
                left:${Utils.rand(20,70)}%;
                bottom:${Utils.rand(30,60)}%;
                --sd:${Utils.rand(5,10)}s;
                animation-delay: ${Utils.rand(0,60)/10}s;
            `;
            c.appendChild(s);
        }
    },
    createDust(containerId, count = 20) {
        const c = Utils.$(containerId);
        if (!c) return;
        c.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const d = document.createElement('div');
            d.className = 'dust';
            d.style.cssText = `
                left:${Utils.rand(5,95)}%;
                top:${Utils.rand(5,95)}%;
                --df:${Utils.rand(5,12)}s;
                --dx:${Utils.rand(-40,40)}px;
                --dy:${Utils.rand(-30,30)}px;
                animation-delay:${Utils.rand(0,80)/10}s;
            `;
            c.appendChild(d);
        }
    },
    createTendrils(containerId, count = 8) {
        const c = Utils.$(containerId);
        if (!c) return;
        c.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const t = document.createElement('div');
            t.className = 'tendril';
            t.style.cssText = `
                left:${Utils.rand(5,95)}%;
                top:${Utils.rand(10,80)}%;
                --tp:${Utils.rand(3,7)}s;
                --th:${Utils.rand(50,150)}px;
                animation-delay: ${Utils.rand(0,40)/10}s;
            `;
            c.appendChild(t);
        }
    },
    createArenaCrowd(containerId, count = 30) {
        const c = Utils.$(containerId);
        if (!c) return;
        c.innerHTML = '';
        const emojis = ['👤', '👤', '👤'];
        for (let i = 0; i < count; i++) {
            const s = document.createElement('span');
            s.textContent = Utils.randFrom(emojis);
            s.style.cssText = `font-size:${Utils.rand(10,16)}px; opacity:${Utils.rand(1,4)/10};`;
            c.appendChild(s);
        }
    }
};

// ============================================================
// HUD
// ============================================================
const HUD = {
    update() {
        const s = GameState;
        const set = (id, val) => { const el = Utils.$(id); if(el) el.textContent = val; };
        const setW = (id, pct) => { const el = Utils.$(id); if(el) el.style.width = Utils.clamp(pct,0,100) + '%'; };

        setW('bar-hp', Utils.pct(s.hp, s.maxHp));
        setW('bar-mp', Utils.pct(s.mp, s.maxMp));
        setW('bar-cor', Utils.clamp(s.corruption, 0, 100));
        
        set('val-hp', s.hp + '/' + s.maxHp);
        set('val-mp', s.mp + '/' + s.maxMp);
        set('val-cor', s.corruption + '%');
        set('val-gold', s.gold);
        set('hud-level', 'Lv. ' + s.level);

        const locNames = {
            map: 'World Map', village: 'The Village', forest: 'Whispering Forest',
            dungeon:'The Dungeon', castle: 'Broken Castle', arena: 'Echo Arena', veil: 'Veil Core'
        };
        set('hud-location', locNames[s.location] || s.location);

        const modeNames = {
            story: 'Story Mode', arena: 'Arena Mode', endless: 'Endless Veil',
            hardcore: 'Hardcore Mode', chaos: 'Chaos Mode'
        };
        set('hud-mode', modeNames[s.mode] || 'Story Mode');
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
// SCENE ENGINE
// ============================================================
const SceneEngine = {
    current: null,
    transitioning: false,
    async travel(target) {
        if (target === this.current && target !== 'map') return;
        if (this.transitioning) return;
        this.transitioning = true;

        const locks = {
            dungeon: !GameState.flags.dungeon_explored && GameState.chapter < 2,
            castle: GameState.chapter < 3,
            arena: GameState.chapter < 2,
            veil: !GameState.flags.veilNodeUnlocked
        };

        if (locks[target] && GameState.mode === 'story') {
            const msgs = {
                dungeon: '✕ The dungeon path is not yet revealed.',
                castle: '✕ The castle gates remain sealed for now.',
                arena: '✕ The Arena awaits—explore the forest first.',
                veil: '✕ The Veil Core is beyond your reach... yet.'
            };
            Toast.show(msgs[target] || 'This path is not open.', 'danger');
            this.transitioning = false;
            return;
        }

        const wipeNames = {
            map: 'World Map', village: 'The Fading Village', forest: 'Whispering Forest',
            dungeon: 'The Dungeon', castle: 'Broken Castle', arena: 'Echo Arena', veil: 'The Veil Core',
            title: ''
        };

        const wipe = Utils.$('wipe');
        const wipeText = Utils.$('wipe-text');
        if (wipeText) wipeText.textContent = wipeNames[target] || '';
        if (wipe) wipe.style.opacity = '1';
        await Utils.sleep(500);

        if (this.current) {
            const curEl = Utils.$('scene-' + this.current);
            if (curEl) {
                curEl.classList.remove('active', 'entering');
                curEl.style.display = 'none';
            }
        }

        this.current = target;
        GameState.location = target;

        const nextEl = Utils.$('scene-' + target);
        if (nextEl) {
            nextEl.style.removeProperty('display');
            nextEl.classList.add('active', 'entering');
            setTimeout(() => nextEl.classList.remove('entering'), 1000);
        }

        if (target !== 'map' && target !== 'title') {
            VFX.shake();
            VFX.zoom();
        }

        await Utils.sleep(300);
        if (wipe) wipe.style.opacity = '0';

        const hud = Utils.$('hud');
        if (target === 'title') { hud.classList.add('hidden'); }
        else { hud.classList.remove('hidden'); }

        if (target !== 'title') this.updateMapPlayer(target);
        const dnb = Utils.$('day-night-badge');
        if (dnb) dnb.style.display = (target === 'title') ? 'none' : 'flex';

        if (!GameState.locationsVisited.includes(target)) {
            GameState.locationsVisited.push(target);
        }

        if (target !== 'title' && target !== 'map') {
            setTimeout(() => VFX.walkCharIn(target), 200);
        }
        this.generateAmbient(target);
        this.onEnter(target);
        HUD.update();
        Save.save();
        this.transitioning = false;
    },
    generateAmbient(loc) {
        switch(loc) {
            case 'village': Ambient.createSmoke('village-smoke'); break;
            case 'forest': Ambient.createFireflies('forest-fireflies'); break;
            case 'dungeon': Ambient.createDust('dungeon-dust'); break;
            case 'arena': Ambient.createArenaCrowd('arena-crowd'); break;
            case 'veil': Ambient.createTendrils('veil-tendrils'); break;
        }
    },
    updateMapPlayer(loc) {
        const positions = {
            map: { left: '29%', top: '55%' },
            village: { left: '29%', top: '55%' },
            forest: { left: '50%', top: '40%' },
            dungeon: { left: '33%', top: '79%' },
            castle: { left: '74%', top: '47%' },
            arena: { left: '56%', top: '74%' },
            veil: { left: '90%', top: '28%' }
        };
        const mp = Utils.$('map-player');
        if (!mp) return;
        const pos = positions[loc] || positions.map;
        mp.style.left = pos.left;
        mp.style.top = pos.top;

        const info = Utils.$('map-info-text');
        const locNames = {
            village: '🏘 The Fading Village — where time loops',
            forest: '🌲 Whispering Forest — voices in the dark',
            dungeon: '⛏ The Dungeon — ancient and dangerous',
            castle: '🏰 Broken Castle — the corrupted king waits',
            arena: '⚔ Echo Arena — prove your worth',
            veil: '◉ Veil Core — the end of all things'
        };
        if (info) info.textContent = locNames[loc] || 'Select a location to travel';
    },
    onEnter(loc) {
        const events = [
            'A distant howl echoes.', 'You feel watched.', 'The air grows colder.',
            'Something skitters nearby.', 'Your vision blurs for a moment.',
            'A faint whisper calls your name.', 'The ground trembles slightly.'
        ];
        if (loc !== 'title' && loc !== 'map' && Math.random() > 0.55) {
            setTimeout(() => Toast.show(Utils.randFrom(events)), 1500);
        }
        if (loc === 'castle') {
            const cg = Utils.$('castle-glitch');
            if (cg) cg.classList.add('active');
        }
        if (loc === 'veil') VeilCore.onEnter();
        if (loc === 'arena') Arena.updateRecord();
        if (loc === 'forest' && GameState.choices.followedVoices) {
            const wl = Utils.$('whisper-line');
            if (wl) wl.textContent = '"Again you return... good. You are becoming what you were meant to be."';
        }
        if (loc === 'village' && GameState.choices.helpedVillagers) {
            const ml = Utils.$('mora-line');
            if (ml) ml.textContent = '"You helped us before. I remember. Thank you, Veilwalker."';
        }
    }
};

// ============================================================
// COMBAT ENGINE
// ============================================================
const Combat = {
    enemy: null,
    active: false,
    turnCount: 0,
    cooldown: false,
    onWin: null,
    onLose: null,
    _customEnemies: {},
    getEnemy(key) {
        const templates = {
            shadow_echo: { name:'Shadow Echo', icon:'👻', hp:40, maxHp:40, atk:[8,14], loot:'Shadow Shard', xp:25 },
            forest_wraith: { name:'Forest Wraith', icon:'🌿', hp:55, maxHp:55, atk:[10,18], loot:'Wraith Essence', xp:35 },
            dungeon_golem: { name:'Stone Golem', icon:'🪨', hp:80, maxHp:80, atk:[14,22], loot:'Golem Core', xp:50 },
            castle_guard: { name:'Hollow Guard', icon:'⚔', hp:65, maxHp:65, atk:[12,20], loot:null, xp:45 },
            arena_champion: { name:'Echo Champion', icon:'🏆', hp:100, maxHp:100, atk:[18,28], loot:'Champion Echo', xp:80 },
            veil_avatar: { name:'Veil Avatar', icon:'◉', hp:120, maxHp:120, atk:[20,32], loot:'Veil Fragment', xp:120 },
            dark_scout: { name:'Dark Scout', icon:'🗡', hp:30, maxHp:30, atk:[6,10], loot:null, xp:15 },
            wave2_warrior: { name:'Echo Warrior', icon:'⚔', hp:70, maxHp:70, atk:[14,20], loot:'Warrior Echo', xp:55 },
        };
        const t = templates[key] || this._customEnemies[key];
        if (!t) return null;
        return Object.assign({}, t, { reward: { xp: t.xp, gold: Utils.rand(5, 5 + t.xp) } });
    },
    start(enemyKey, onWin, onLose) {
        const e = this.getEnemy(enemyKey);
        if (!e) return;
        this.enemy = e;
        this.onWin = onWin || null;
        this.onLose = onLose || null;
        this.active = true;
        this.turnCount = 0;
        this.cooldown = false;
        
        const espr = Utils.$('enemy-sprite');
        const ename = Utils.$('enemy-name-display');
        const clog = Utils.$('combat-log');
        if (espr) espr.textContent = this.enemy.icon;
        if (ename) ename.textContent = this.enemy.name;
        if (clog) clog.innerHTML = '';
        this.updateBars();
        
        this.logMsg(`⚔ Battle begins: ${this.enemy.name} emerges!`, 'log-special');
        this.setTurnIndicator('Your Turn');
        Utils.$('combat-overlay').classList.add('active');
        const bsp = Utils.$('btn-special');
        if (bsp) bsp.disabled = !GameState.abilities.includes('veil_strike');
        VFX.flash('red');
        VFX.shake();
    },
    setTurnIndicator(text) {
        const el = Utils.$('combat-turn');
        if (el) el.textContent = text;
    },
    async attack() {
        if (!this.active || this.cooldown) return;
        this.cooldown = true;
        this.setTurnIndicator('Attacking...');
        const dmg = Utils.rand(10, 18 + GameState.level * 2);
        this.dealDamage(dmg, 'player');
        setTimeout(() => {
            this.cooldown = false;
            if (this.active) {
                this.setTurnIndicator('Enemy Turn');
                setTimeout(() => this.enemyTurn(), 600);
            }
        }, 800);
    },
    async special() {
        if (!this.active || this.cooldown || !GameState.abilities.includes('veil_strike')) return;
        if (GameState.mp < 20) { Toast.show('Not enough MP!', 'danger'); return; }
        this.cooldown = true;
        this.setTurnIndicator('Veil Strike!');
        GameState.mp -= 20;
        const dmg = Utils.rand(25, 40 + GameState.level * 3);
        GameState.corruption = Utils.clamp(GameState.corruption + 5, 0, 100);
        this.dealDamage(dmg, 'player', true);
        VFX.flash('veil');
        HUD.update();
        setTimeout(() => {
            this.cooldown = false;
            if (this.active) {
                this.setTurnIndicator('Enemy Turn');
                setTimeout(() => this.enemyTurn(), 700);
            }
        }, 1000);
    },
    heal() {
        if (!this.active || this.cooldown) return;
        const healItem = GameState.inventory.find(i => i.id === 'health_potion');
        if (!healItem) { Toast.show('No potions! Buy them in the village.', 'danger'); return; }
        this.cooldown = true;
        this.setTurnIndicator('Healing...');
        const amt = Utils.rand(25, 40);
        GameState.hp = Utils.clamp(GameState.hp + amt, 0, GameState.maxHp);
        Inventory.removeItem('health_potion');
        this.logMsg(`💊 You drink a potion, recovering ${amt} HP.`, 'log-player-hit');
        this.updateBars();
        HUD.update();
        setTimeout(() => {
            this.cooldown = false;
            this.setTurnIndicator('Enemy Turn');
            setTimeout(() => this.enemyTurn(), 600);
        }, 800);
    },
    flee() {
        if (!this.active || this.cooldown) return;
        if (Math.random() > 0.4) {
            this.logMsg('🏃 You escape into the shadows...', 'log-special');
            setTimeout(() => this.end(false), 800);
        } else {
            this.logMsg('⚠ Escape failed! The enemy strikes!', 'log-hit');
            this.setTurnIndicator('Enemy Turn');
            setTimeout(() => this.enemyTurn(), 500);
        }
    },
    dealDamage(dmg, attacker, isSpecial = false) {
        this.enemy.hp = Math.max(0, this.enemy.hp - dmg);
        const spr = Utils.$('enemy-sprite');
        if (spr) {
            spr.classList.add('hit-anim', 'shake-anim');
            setTimeout(() => spr.classList.remove('hit-anim', 'shake-anim'), 400);
        }
        this.showDmgFloat(dmg, false);
        this.logMsg(
            `${isSpecial ? '✨ Veil Strike' : '⚔ Attack'}: ${dmg} damage to ${this.enemy.name}!`,
            isSpecial ? 'log-special' : 'log-player-hit'
        );
        this.updateBars();
        if (this.enemy.hp <= 0) {
            this.cooldown = true;
            setTimeout(() => this.victory(), 600);
        }
    },
    enemyTurn() {
        if (!this.active) return;
        this.turnCount++;
        let dmg = Utils.rand(...this.enemy.atk);
        if (this.enemy.hp / this.enemy.maxHp < 0.3) dmg = Math.round(dmg * 1.4);
        if (GameState.mode === 'chaos' && Math.random() > 0.7) dmg *= 2;
        if (GameState.corruption > 70) dmg = Math.round(dmg * 0.8);
        if (GameState.timeOfDay === 'night') dmg = Math.round(dmg * 1.15);
        
        GameState.hp = Utils.clamp(GameState.hp - dmg, 0, GameState.maxHp);
        const pSpr = Utils.$('player-sprite');
        if (pSpr) {
            pSpr.classList.add('shake-anim');
            setTimeout(() => pSpr.classList.remove('shake-anim'), 300);
        }
        this.showDmgFloat(dmg, true);
        this.logMsg(`💥 ${this.enemy.name} attacks for ${dmg} damage!`, 'log-hit');
        VFX.flash('red');
        this.updateBars();
        HUD.update();
        if (GameState.hp <= 0) {
            setTimeout(() => this.defeat(), 600);
        } else {
            this.setTurnIndicator('Your Turn');
        }
    },
    showDmgFloat(dmg, isEnemy) {
        const el = document.createElement('div');
        el.className = 'dmg-float' + (isEnemy ? '' : ' player');
        el.textContent = `-${dmg}`;
        const scene = document.querySelector('.combat-scene');
        if (!scene) return;
        el.style.cssText = `left:${isEnemy ? '25%' : '65%'};top:25%;`;
        scene.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    },
    updateBars() {
        const ph = Utils.$('combat-player-hp');
        const eh = Utils.$('combat-enemy-hp');
        const phv = Utils.$('combat-player-hp-val');
        const ehv = Utils.$('combat-enemy-hp-val');
        if (ph) ph.style.width = Utils.pct(GameState.hp, GameState.maxHp) + '%';
        if (eh) eh.style.width = Utils.pct(this.enemy.hp, this.enemy.maxHp) + '%';
        if (phv) phv.textContent = GameState.hp + '/' + GameState.maxHp + ' HP';
        if (ehv) ehv.textContent = this.enemy.hp + '/' + this.enemy.maxHp + ' HP';
    },
    logMsg(msg, cls = '') {
        const log = Utils.$('combat-log');
        if (!log) return;
        log.innerHTML += `<div class="${cls}">${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    },
    victory() {
        this.active = false;
        const e = this.enemy;
        GameState.kills++;
        GameState.xp += e.reward.xp;
        GameState.gold += e.reward.gold;
        if (e.loot && Math.random() > 0.4) {
            Inventory.addItem({
                id: e.loot.toLowerCase().replace(/ /g,'_'),
                name: e.loot,
                icon: '💎',
                desc: 'A rare drop from battle.',
                type: 'items',
                val: 30
            });
        }
        this.logMsg(`✨ Victory! +${e.reward.xp} XP, +${e.reward.gold}g`, 'log-special');
        this.setTurnIndicator('Victory!');
        VFX.flash('white');
        if (GameState.xp >= GameState.xpToLevel) this.levelUp();
        HUD.update();
        setTimeout(() => {
            Utils.$('combat-overlay').classList.remove('active');
            if (this.onWin) this.onWin();
        }, 1500);
        Save.save();
    },
    levelUp() {
        GameState.level++;
        GameState.xp -= GameState.xpToLevel;
        GameState.xpToLevel = Math.round(GameState.xpToLevel * 1.4);
        GameState.maxHp += 15;
        GameState.hp = GameState.maxHp;
        GameState.maxMp += 8;
        GameState.mp = GameState.maxMp;
        Toast.show(`⬆ Level Up! Now level ${GameState.level}`, 'veil');
        VFX.flash('white');
        HUD.update();
    },
    defeat() {
        this.active = false;
        GameState.deaths++;
        Utils.$('combat-overlay').classList.remove('active');
        if (GameState.hardcore) {
            Save.clear();
            Game.showDeath(true);
        } else {
            Game.showDeath(false);
        }
        if (this.onLose) this.onLose();
    },
    end(fled) {
        this.active = false;
        Utils.$('combat-overlay').classList.remove('active');
        if (fled) Toast.show('You fled from battle.');
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
            items = GameState.inventory.filter(i => (i.type || 'items') === this.currentTab);
        }
        const cont = Utils.$('inv-content');
        if (!cont) return;
        if (!items || !items.length) {
            cont.innerHTML = `<div style="grid-column:1/-1;font-family:var(--font-body);font-style:italic;color:var(--text-dim);padding:20px 0;text-align:center;">Nothing here yet.</div>`;
            return;
        }
        if (this.currentTab === 'lore') {
            cont.innerHTML = items.map(l => `
                <div class="inv-item">
                    <div class="inv-item-icon">📜</div>
                    <div class="inv-item-name">${l.title}</div>
                    <div class="inv-item-desc">${l.text}</div>
                </div>`).join('');
        } else {
            cont.innerHTML = items.map(item => `
                <div class="inv-item" onclick="Inventory.use('${item.id}')">
                    <div class="inv-item-icon">${item.icon}</div>
                    <div class="inv-item-name">${item.name}</div>
                    <div class="inv-item-desc">${item.desc}</div>
                    <div class="inv-item-val">${item.val}g</div>
                </div>`).join('');
        }
    },
    addItem(item) {
        if (item.id === 'health_potion') {
            GameState.inventory.push(item);
            Toast.show(`+ ${item.icon} ${item.name} added`, 'veil');
            return;
        }
        if (!GameState.inventory.find(i => i.id === item.id)) {
            GameState.inventory.push(item);
            Toast.show(`+ ${item.icon} ${item.name} added`, 'veil');
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
            this.removeItem('health_potion');
            Toast.show('🧪 Restored 30 HP!');
            HUD.update();
            this.render();
        }
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
        opts.innerHTML = options.map((o,i) =>
            `<div class="choice-opt" onclick="Choice.pick(${i})">${o.text}</div>`
        ).join('');
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
// VILLAGE
// ============================================================
const Village = {
    log(msg) {
        const card = Utils.$('village-events');
        const log = Utils.$('village-log');
        if (card) card.style.display = 'block';
        if (log) log.innerHTML += `<p style="margin-bottom:6px;">• ${msg}</p>`;
    },
    helpVillagers() {
        if (GameState.choices.helpedVillagers) {
            Toast.show('You have already helped the village.'); return;
        }
        GameState.choices.helpedVillagers = true;
        GameState.morality = Utils.clamp(GameState.morality + 20, 0, 100);
        GameState.xp += 30;
        GameState.gold += 15;
        this.log('You spent the morning helping rebuild the broken homes. The fog seems a little thinner now.');
        this.log('Elder Mora presses something into your hand — an Ember Stone, warm to the touch.');
        Inventory.addItem({ id:'ember_stone', name:'Ember Stone', icon:'🔥', desc:'Given by Elder Mora. Warm Veil energy within.', type:'items', val:50 });
        Toast.show('✓ Village helped — Morality +20, XP +30');
        VFX.flash('white');
        HUD.update();
        if (GameState.chapter < 2) {
            GameState.chapter = 2;
            Utils.$('node-forest')?.classList.remove('locked');
            Utils.$('node-arena')?.classList.remove('locked');
            Toast.show('🌲 Whispering Forest is now accessible!', 'veil');
        }
        Save.save();
    },
    explore() {
        if (!GameState.choices.helpedVillagers && Math.random() > 0.5) {
            Toast.show('The villagers whisper as you walk past...', 'danger');
        }
        const finds = [
            'You find a rusted lockbox with 10 gold inside.',
            'A child hands you a strange coin — engraved with the Veil symbol.',
            'You discover a hidden cellar with supplies.',
            'Behind an old wall, you find a small pouch of gold.'
        ];
        this.log(Utils.randFrom(finds));
        GameState.gold += 10;
        HUD.update();
    },
    talkElder() {
        const lines = [
            '"The Veil came three moons ago. People started forgetting. Now they loop — same moments, forever."',
            '"My granddaughter said she saw you before. But you only just arrived... didn\'t you?"',
            '"There is a forest north of here. Strange things happen when you look away. Be cautious, Veilwalker."',
            '"Sometimes I remember things that haven\'t happened yet. That\'s the worst part."'
        ];
        const el = Utils.$('mora-line');
        if (el) el.textContent = Utils.randFrom(lines);
        Toast.show('💬 Elder Mora shares knowledge.');
    },
    shop() {
        Choice.show('Village Trade', 'Old Mara runs a stall with damp cloth over it. She eyes you carefully.', [
            { text: '🧪 Buy Health Potion (15g)', fn: () => {
                if (GameState.gold < 15) { Toast.show('Not enough gold!','danger'); return; }
                GameState.gold -= 15;
                Inventory.addItem({id:'health_potion',name:'Health Potion',icon:'🧪', desc:'Restore 30 HP in battle',type:'items',val:20});
                Toast.show('🧪 Health Potion acquired!');
                HUD.update();
            }},
            { text: '🛡 Buy Iron Charm (30g) — +5 Max HP', fn: () => {
                if (GameState.gold < 30) { Toast.show('Not enough gold!','danger'); return; }
                GameState.gold -= 30;
                GameState.maxHp += 5;
                GameState.hp = Utils.clamp(GameState.hp + 5, 0, GameState.maxHp);
                Inventory.addItem({id:'iron_charm',name:'Iron Charm',icon:'🛡', desc:'+5 Max HP permanently',type:'items',val:40});
                Toast.show('🛡 Iron Charm equipped — Max HP +5');
                HUD.update();
            }},
            { text: '⚔ Buy Short Sword (40g) — +3 Attack', fn: () => {
                if (GameState.gold < 40) { Toast.show('Not enough gold!','danger'); return; }
                GameState.gold -= 40;
                Inventory.addItem({id:'short_sword',name:'Short Sword',icon:'⚔', desc:'+3 Attack damage',type:'items',val:50});
                Toast.show('⚔ Short Sword equipped — Attack increased!');
                HUD.update();
            }}
        ]);
    }
};

// ============================================================
// VILLAGE (continued)
// ============================================================
Village.rest = function() {
    if (GameState.gold < 20) { Toast.show('Not enough gold! You need 20g.', 'danger'); return; }
    GameState.gold -= 20;
    GameState.hp = GameState.maxHp;
    GameState.mp = GameState.maxMp;
    GameState.dayCount++;
    Toast.show('🕯 You rest at the inn. HP and MP fully restored.', 'veil');
    VFX.flash('white');
    HUD.update();
    Save.save();
};

// ============================================================
// FOREST
// ============================================================
const Forest = {
    log(msg) {
        const card = Utils.$('forest-events');
        const log  = Utils.$('forest-log');
        if (card) card.style.display = 'block';
        if (log)  log.innerHTML += `<p style="margin-bottom:6px;">• ${msg}</p>`;
    },
    followVoices() {
        if (GameState.choices.followedVoices) {
            Toast.show('The voices grow stronger the deeper you go...', 'veil'); return;
        }
        GameState.choices.followedVoices = true;
        GameState.corruption = Utils.clamp(GameState.corruption + 15, 0, 100);
        GameState.xp += 40;
        this.log('You follow the voices deeper into the dark. Reality bends. You find a Veil Shard pulsing on a stone altar.');
        Inventory.addItem({ id:'veil_shard', name:'Veil Shard', icon:'💜', desc:'A fragment of the Veil. It hums with dark power.', type:'items', val:60 });
        Toast.show('⚠ Corruption +15 — Veil Shard obtained', 'danger');
        GameState.abilities.push('veil_strike');
        Toast.show('✨ New ability: Veil Strike unlocked!', 'veil');
        VFX.flash('veil');
        HUD.update();
        if (GameState.chapter < 3) {
            GameState.chapter = 3;
            Utils.$('node-castle')?.classList.remove('locked');
            Utils.$('node-dungeon')?.classList.remove('locked');
            Toast.show('🏰 Broken Castle is now accessible!', 'veil');
        }
        Save.save();
    },
    ignoreVoices() {
        GameState.morality = Utils.clamp(GameState.morality + 10, 0, 100);
        GameState.xp += 20;
        this.log('You press your hands over your ears and push through. The whispers fade. You find a calm glade and breathe.');
        Toast.show('✓ Stayed grounded — Morality +10, XP +20');
        HUD.update();
        Save.save();
    },
    fightEnemy() {
        Combat.start('forest_wraith',
            () => {
                Forest.log('The wraith dissolves into mist. Silence returns to the forest.');
                GameState.xp += 10;
                HUD.update();
                Save.save();
            },
            () => Toast.show('You barely escape the wraith...', 'danger')
        );
    },
    gather() {
        const herbs = ['Moon Petal', 'Shadowroot', 'Ember Moss', 'Veil Fern'];
        const herb = Utils.randFrom(herbs);
        this.log(`You gather a clump of ${herb} from the forest floor.`);
        Inventory.addItem({ id: herb.toLowerCase().replace(/ /g,'_'), name: herb, icon:'🌿', desc:'A forest herb with unknown properties.', type:'items', val:15 });
        GameState.xp += 10;
        Toast.show(`🌿 Gathered ${herb}`);
        HUD.update();
        Save.save();
    }
};

// ============================================================
// DUNGEON
// ============================================================
const Dungeon = {
    log(msg) {
        const card = Utils.$('dungeon-events');
        const log  = Utils.$('dungeon-log');
        if (card) card.style.display = 'block';
        if (log)  log.innerHTML += `<p style="margin-bottom:6px;">• ${msg}</p>`;
    },
    explore() {
        const finds = [
            'A skeleton slumps against the wall clutching 15 gold.',
            'You find a rusted chest — inside, a faded map fragment.',
            'A hidden alcove holds a torch that never burns out.',
            'Ancient writing on the wall: "The Veil was opened here first."'
        ];
        this.log(Utils.randFrom(finds));
        GameState.gold += 15;
        GameState.xp += 20;
        GameState.flags.dungeon_explored = true;
        Toast.show('🔍 You explored the dungeon depths.');
        HUD.update();
        Save.save();
    },
    fightBoss() {
        Toast.show('⚔ A terrible presence stirs in the dark...', 'danger');
        Combat.start('dungeon_golem',
            () => {
                Dungeon.log('The golem crumbles. A passage opens to a deeper chamber.');
                GameState.flags.veilNodeUnlocked = true;
                Utils.$('node-veil')?.classList.remove('locked');
                Toast.show('◉ The Veil Core has been revealed!', 'veil');
                VFX.flash('veil');
                HUD.update();
                Save.save();
            },
            () => Toast.show('The golem overpowers you. You retreat.', 'danger')
        );
    },
    searchChests() {
        const loot = [
            { id:'dungeon_key', name:'Dungeon Key', icon:'🗝', desc:'Opens a sealed door somewhere.', type:'items', val:25 },
            { id:'bone_charm', name:'Bone Charm', icon:'🦴', desc:'+3 Defense. Cold to the touch.', type:'items', val:35 }
        ];
        const item = Utils.randFrom(loot);
        Inventory.addItem(item);
        this.log(`You pry open a chest — ${item.name} inside.`);
        GameState.gold += Utils.rand(5, 20);
        HUD.update();
        Save.save();
    },
    veilFragment() {
        if (GameState.corruption < 20) {
            Toast.show('You sense something here but cannot grasp it yet...'); return;
        }
        this.log('A Veil Fragment tears free from the wall and embeds in your palm. It burns.');
        Inventory.addItem({ id:'veil_fragment_d', name:'Veil Fragment', icon:'◉', desc:'A shard of pure Veil energy.', type:'items', val:80 });
        GameState.corruption = Utils.clamp(GameState.corruption + 10, 0, 100);
        Toast.show('◉ Veil Fragment absorbed — Corruption +10', 'veil');
        VFX.flash('veil');
        HUD.update();
        Save.save();
    }
};

// ============================================================
// CASTLE
// ============================================================
const Castle = {
    log(msg) {
        const card = Utils.$('castle-events');
        const log  = Utils.$('castle-log');
        if (card) card.style.display = 'block';
        if (log)  log.innerHTML += `<p style="margin-bottom:6px;">• ${msg}</p>`;
    },
    killKing() {
        if (GameState.choices.killedKing) { Toast.show('It is done. The throne sits empty.'); return; }
        GameState.choices.killedKing = true;
        GameState.morality = Utils.clamp(GameState.morality - 25, 0, 100);
        GameState.corruption = Utils.clamp(GameState.corruption + 20, 0, 100);
        GameState.xp += 60;
        GameState.gold += 50;
        this.log('You strike down the king. His body dissolves into Veil smoke. The castle shudders.');
        Toast.show('⚠ King slain — Morality -25, Corruption +20', 'danger');
        VFX.flash('red');
        VFX.shake();
        HUD.update();
        Save.save();
    },
    freeKing() {
        if (GameState.choices.freedKing) { Toast.show('The king is at peace. His gratitude lingers in the air.'); return; }
        GameState.choices.freedKing = true;
        GameState.morality = Utils.clamp(GameState.morality + 30, 0, 100);
        GameState.xp += 80;
        this.log('You channel the Veil\'s energy to shatter the curse. The king collapses, weeping. "Thank you... I remember now."');
        Inventory.addItem({ id:'royal_seal', name:'Royal Seal', icon:'👑', desc:'Given by King Aldric. Proof of a broken curse.', type:'items', val:100 });
        Toast.show('✓ Curse broken — Morality +30, Royal Seal obtained', 'veil');
        VFX.flash('white');
        HUD.update();
        Save.save();
    },
    fightGuards() {
        Combat.start('castle_guard',
            () => {
                Castle.log('The hollow guard crumbles to ash. Others do not notice.');
                GameState.xp += 10;
                HUD.update();
                Save.save();
            },
            () => Toast.show('The guards overwhelm you. You retreat.', 'danger')
        );
    },
    searchCastle() {
        const finds = [
            'Behind a tapestry you find a pouch of 30 gold.',
            'A locked armory holds a Veil-forged blade — but the lock holds.',
            'The royal library contains a lore tome about the Veil\'s origin.',
            'A servant\'s ghost points silently toward a hidden staircase.'
        ];
        this.log(Utils.randFrom(finds));
        GameState.gold += 30;
        GameState.xp += 15;
        HUD.update();
        Save.save();
    }
};

// ============================================================
// ARENA
// ============================================================
const Arena = {
    record: { wins: 0, best: 0 },
    updateRecord() {
        const el = Utils.$('arena-record');
        if (el) el.textContent = `Best: Wave ${this.record.best} | Wins: ${this.record.wins}`;
    },
    startWave(difficulty) {
        const enemies = { 1: 'dark_scout', 2: 'wave2_warrior', 3: 'arena_champion' };
        const key = enemies[difficulty] || 'dark_scout';
        GameState.arenaWave = difficulty;
        Toast.show(`⚔ Wave ${difficulty} begins!`, 'danger');
        Combat.start(key,
            () => {
                Arena.record.wins++;
                Arena.record.best = Math.max(Arena.record.best, difficulty);
                GameState.arenaKills++;
                if (difficulty >= 3) {
                    GameState.flags.arena_completed = true;
                    Toast.show('🏆 Arena Champion! You have proven your worth.', 'veil');
                    VFX.flash('white');
                }
                Arena.updateRecord();
                Save.save();
            },
            () => Toast.show('You fall in the arena. Train harder.', 'danger')
        );
    },
    startEndless() {
        GameState.mode = 'endless';
        Toast.show('∞ Endless Veil begins — survive as long as you can.', 'veil');
        HUD.update();
        this.startWave(Utils.rand(1, 3));
    }
};

// ============================================================
// VEIL CORE
// ============================================================
const VeilCore = {
    onEnter() {
        const desc = Utils.$('veil-desc');
        const voice = Utils.$('veil-voice');
        const descs = [
            'The world here does not obey. Multiple versions of you exist in the same space.',
            'Every choice you made echoes here. The Veil has been watching all along.',
            'Time folds. You see yourself entering this room a thousand times.'
        ];
        const voices = [
            '"You\'ve walked far, Veilwalker. Now you must choose what you become."',
            '"We have waited for one who could walk between. That is you."',
            '"Destroy us and end the suffering. Control us and reshape reality. Merge and become something new."'
        ];
        if (desc)  desc.textContent  = Utils.randFrom(descs);
        if (voice) voice.textContent = Utils.randFrom(voices);
        VFX.flash('veil');
    },
    destroy() {
        GameState.choices.veilChoice = 'destroy';
        Toast.show('You channel every fragment of power — and tear the Veil apart.', 'veil');
        VFX.flash('white');
        VFX.shake();
        setTimeout(() => Game.showEnding('destroy'), 2000);
    },
    control() {
        GameState.choices.veilChoice = 'control';
        Toast.show('You reach into the Veil and claim dominion. It screams — then obeys.', 'danger');
        VFX.flash('red');
        VFX.shake();
        setTimeout(() => Game.showEnding('control'), 2000);
    },
    merge() {
        GameState.choices.veilChoice = 'merge';
        Toast.show('You step into the Veil. It steps into you. You are both now.', 'veil');
        VFX.flash('veil');
        setTimeout(() => Game.showEnding('merge'), 2000);
    }
};

// ============================================================
// GAME CONTROLLER
// ============================================================
const Game = {
    startNewGame() {
        Save.clear();
        Object.assign(GameState, {
            hp:100, maxHp:100, mp:60, maxMp:60, xp:0, xpToLevel:100,
            level:1, gold:50, corruption:0, morality:50, location:'title',
            chapter:1, mode:'story', hardcore:false, timeOfDay:'day', dayCount:1,
            kills:0, deaths:0, totalChoices:0, startTime:Date.now(), arenaWave:0, arenaKills:0,
            choices:{ helpedVillagers:false, followedVoices:false, killedKing:false, freedKing:false, veilChoice:null },
            inventory:[], lore:[], abilities:['basic_attack'], questsComplete:[], locationsVisited:[],
            npcMemory:{},
            flags:{ veilNodeUnlocked:false, dungeon_explored:false, castle_explored:false, arena_completed:false }
        });
        SceneEngine.travel('village');
    },
    continueGame() {
        if (Save.load()) {
            SceneEngine.travel(GameState.location === 'title' ? 'map' : GameState.location);
        } else {
            Toast.show('No saved game found.', 'danger');
        }
    },
    openModeSelect() {
        Choice.show('Game Mode', 'Choose how you want to experience Emberfall.', [
            { text: '📖 Story Mode — guided narrative', fn: () => { GameState.mode = 'story'; Toast.show('Story Mode selected.'); HUD.update(); } },
            { text: '⚔ Arena Mode — wave combat focus', fn: () => { GameState.mode = 'arena'; Toast.show('Arena Mode selected.'); HUD.update(); SceneEngine.travel('arena'); } },
            { text: '☠ Hardcore Mode — one life only', fn: () => { GameState.mode = 'hardcore'; GameState.hardcore = true; Toast.show('Hardcore Mode — death is permanent.', 'danger'); HUD.update(); } },
            { text: '🌀 Chaos Mode — unpredictable world', fn: () => { GameState.mode = 'chaos'; Toast.show('Chaos Mode — anything can happen.', 'veil'); HUD.update(); } }
        ]);
    },
    openStats() {
        const s = GameState;
        Choice.show('Veilwalker Log',
            `Level ${s.level} | HP ${s.hp}/${s.maxHp} | MP ${s.mp}/${s.maxMp}\n` +
            `Gold: ${s.gold}g | Corruption: ${s.corruption}% | Morality: ${s.morality}\n` +
            `Kills: ${s.kills} | Deaths: ${s.deaths} | Choices: ${s.totalChoices}\n` +
            `Chapter: ${s.chapter} | Days: ${s.dayCount} | Mode: ${s.mode}`,
            [{ text: 'Close', fn: () => {} }]
        );
    },
    openJournal() {
        const lore = [
            { title:'The Veil', text:'An invisible barrier between the living world and the forgotten one. Three moons ago it began to tear.' },
            { title:'Veilwalkers', text:'Rare individuals who exist partially outside of normal time. They can perceive and interact with the Veil directly.' },
            { title:'Ash\'vel', text:'A village caught in a temporal loop. Its inhabitants repeat the same day, unaware, forever.' },
            { title:'The Corruption', text:'Prolonged Veil exposure twists the mind and body. Some say it grants power. All say it takes more than it gives.' }
        ];
        lore.forEach(l => { if (!GameState.lore.find(e => e.title === l.title)) GameState.lore.push(l); });
        Inventory.currentTab = 'lore';
        Inventory.open();
    },
    openCraft() {
        const sword  = GameState.inventory.find(i => i.id === 'short_sword');
        const shard  = GameState.inventory.find(i => i.id === 'veil_shard');
        const stone  = GameState.inventory.find(i => i.id === 'ember_stone');
        const canCraft = sword && shard && stone;
        Choice.show('Crafting', canCraft
            ? 'You have the materials to forge a Veil Blade!'
            : `Craft a Veil Blade — requires: Short Sword, Veil Shard, Ember Stone. You have: ${sword?'✓':'✗'} Sword, ${shard?'✓':'✗'} Shard, ${stone?'✓':'✗'} Stone.`,
            canCraft ? [
                { text: '⚔ Forge Veil Blade', fn: () => {
                    Inventory.removeItem('short_sword');
                    Inventory.removeItem('veil_shard');
                    Inventory.removeItem('ember_stone');
                    Inventory.addItem({ id:'veil_blade', name:'Veil Blade', icon:'⚔', desc:'A sword infused with Veil energy. Hits harder.', type:'items', val:150 });
                    Toast.show('⚔ Veil Blade forged!', 'veil');
                    VFX.flash('veil');
                }},
                { text: 'Cancel', fn: () => {} }
            ] : [{ text: 'Close', fn: () => {} }]
        );
    },
    showDeath(permanent) {
        const msg = permanent
            ? 'You have fallen. Hardcore run ended. Your journey is over.'
            : 'You have fallen... but the Veil is not done with you yet.';
        Choice.show('☠ Fallen', msg, [
            { text: permanent ? '↺ New Game' : '↺ Rise Again', fn: () => {
                if (!permanent) {
                    GameState.hp = Math.floor(GameState.maxHp * 0.4);
                    GameState.mp = Math.floor(GameState.maxMp * 0.4);
                    SceneEngine.travel('village');
                    HUD.update();
                } else {
                    Game.startNewGame();
                }
            }}
        ]);
    },
    showEnding(type) {
        const endings = {
            destroy: { title:'The Veil Destroyed', text:'The fractures in reality seal shut. The loops end. The forgotten are finally released. You are ordinary once more — but the world breathes again.' },
            control: { title:'The Veil Claimed', text:'You sit at the center of reality\'s web. Every thread obeys your will. Was this freedom — or did the Veil simply find a new anchor?' },
            merge:   { title:'The Veil and You', text:'You are everywhere the Veil touches. You watch over the loops, comfort the lost, and slowly guide reality back to wholeness. You are no longer one person. You are the boundary itself.' }
        };
        const e = endings[type] || endings.destroy;
        GameState.timePlayed += Math.floor((Date.now() - GameState.startTime) / 1000);
        Save.save();
        Choice.show(e.title, e.text + `\n\n— ${GameState.kills} enemies defeated | ${GameState.totalChoices} choices made | ${GameState.dayCount} days survived —`, [
            { text: '↺ Play Again', fn: () => Game.startNewGame() }
        ]);
    }
};

// ============================================================
// INIT
// ============================================================
(function init() {
    // Starfield
    const sf = Utils.$('starfield');
    if (sf) {
        for (let i = 0; i < 120; i++) {
            const s = document.createElement('div');
            s.className = 'star';
            const size = Utils.rand(1, 3);
            s.style.cssText = `width:${size}px;height:${size}px;left:${Utils.rand(0,100)}%;top:${Utils.rand(0,100)}%;--d:${Utils.rand(2,6)}s;--a1:${Utils.rand(3,9)/10};--a2:${Utils.rand(1,4)/10};animation-delay:${Utils.rand(0,60)/10}s;`;
            sf.appendChild(s);
        }
    }

    // Veil title particles
    VFX.createParticles('veil-particles', 30, 'rgba(128,64,255,0.4)', 3);

    // Loading screen
    const bar   = Utils.$('loading-bar');
    const sub   = Utils.$('loading-sub');
    const steps = ['Initializing the Veil...','Loading world fragments...','Weaving reality...','Summoning echoes...','Ready.'];
    let pct = 0, step = 0;
    const tick = setInterval(() => {
        pct = Math.min(pct + Utils.rand(12, 22), 100);
        if (bar) bar.style.width = pct + '%';
        if (sub && step < steps.length) sub.textContent = steps[step++];
        if (pct >= 100) {
            clearInterval(tick);
            setTimeout(() => {
                const ls = Utils.$('loading-screen');
                if (ls) { ls.style.opacity = '0'; setTimeout(() => ls.style.display = 'none', 600); }
                SceneEngine.travel('title');
                if (Save.exists()) {
                    const bc = Utils.$('btn-continue');
                    if (bc) bc.style.display = 'inline-flex';
                }
            }, 400);
        }
    }, 160);
})();
