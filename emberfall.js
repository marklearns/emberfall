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
[span_0](start_span)};[span_0](end_span)

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
    [span_1](start_span)},[span_1](end_span)
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
    [span_2](start_span)},[span_2](end_span)
    exists() { return !!localStorage.getItem(this.key); },
    clear() { localStorage.removeItem(this.key); }
[span_3](start_span)};[span_3](end_span)

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
[span_4](start_span)};[span_4](end_span)

// ============================================================
// SCREEN EFFECTS
// ============================================================
const VFX = {
    flash(type = 'white') {
        const el = Utils.$('screen-flash');
        if (!el) return;
        el.className = 'screen-flash ' + type;
        el.offsetWidth; // force reflow
        setTimeout(() => el.className = 'screen-flash', 500);
    [span_5](start_span)},[span_5](end_span)
    shake() {
        const vp = Utils.$('game-viewport');
        if (!vp) return;
        vp.classList.add('cam-shake');
        setTimeout(() => vp.classList.remove('cam-shake'), 400);
    [span_6](start_span)},[span_6](end_span)
    zoom() {
        const vp = Utils.$('game-viewport');
        if (!vp) return;
        vp.classList.add('cam-zoom');
        setTimeout(() => vp.classList.remove('cam-zoom'), 900);
    [span_7](start_span)},[span_7](end_span)
    walkCharIn(sceneId) {
        const char = Utils.$(sceneId + '-char');
        if (!char) return;
        const sprite = char.querySelector('.char-sprite');
        char.style.left = '-10%';
        char.style.opacity = '1';
        if (sprite) sprite.classList.add('char-walk');
        setTimeout(() => { char.style.left = '15%'; }, 100);
        setTimeout(() => { if (sprite) sprite.classList.remove('char-walk'); }, 1300);
    [span_8](start_span)},[span_8](end_span)
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
    [span_9](start_span)}
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
    },[span_9](end_span)
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
    [span_10](start_span)},[span_10](end_span)
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
    [span_11](start_span)},[span_11](end_span)
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
    [span_12](start_span)},[span_12](end_span)
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
    [span_13](start_span)}
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
        setW('bar-xp', Utils.pct(s.xp, s.xpToLevel));
        setW('bar-cor', Utils.clamp(s.corruption, 0, 100));[span_13](end_span)
        
        set('val-hp', s.hp + '/' + s.maxHp);
        set('val-mp', s.mp + '/' + s.maxMp);
        set('val-xp', s.xp + '/' + s.xpToLevel);
        set('val-cor', s.corruption + '%');
        set('val-gold', s.gold);
        set('hud-level', 'Lv. ' + s.level);
        [span_14](start_span)set('day-count', 'Day ' + s.dayCount);[span_14](end_span)

        const locNames = {
            map: 'World Map', village: 'The Village', forest: 'Whispering Forest',
            dungeon:'The Dungeon', castle: 'Broken Castle', arena: 'Echo Arena', veil: 'Veil Core'
        };
        [span_15](start_span)set('hud-location', locNames[s.location] || s.location);[span_15](end_span)

        const chapters = {
            village: 'Ch. I - The Fading Village', 
            forest: 'Ch. II - Whispering Forest',
            castle: 'Ch. III - Broken Castle', 
            veil: 'Ch. IV - Veil Core'
        };
        [span_16](start_span)set('hud-chapter', chapters[s.location] || 'Exploring the world...');[span_16](end_span)

        const modeNames = {
            story: 'Story Mode', arena: 'Arena Mode', endless: 'Endless Veil',
            hardcore: 'Hardcore Mode', chaos: 'Chaos Mode'
        };
        [span_17](start_span)set('hud-mode', modeNames[s.mode] || 'Story Mode');[span_17](end_span)

        const mm = Utils.$('minimap');
        const mmLabel = Utils.$('minimap-label');
        if (mm) mm.style.display = (s.location !== 'title' && s.location !== 'map') ? 'flex' : 'none';
        if (mmLabel) mmLabel.textContent = locNames[s.location] || [span_18](start_span)'';[span_18](end_span)

        const vig = Utils.$('corruption-vignette');
        if(vig) {
            vig.className = 'corruption-vignette';
            if(s.corruption >= 80) vig.classList.add('max');
            else if(s.corruption >= 60) vig.classList.add('high');
            else if(s.corruption >= 30) vig.classList.add('mid');
            else if(s.corruption >= 10) vig.classList.add('low');
        [span_19](start_span)}

        if(s.corruption > 50) {
            const moraLine = Utils.$('mora-line');
            if(moraLine && Math.random() > 0.7) {
                moraLine.style.color = 'var(--text-veil)';
            }
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
};[span_19](end_span)

// ============================================================
// SCENE ENGINE
// ============================================================
const SceneEngine = {
    current: null,
    transitioning: false,
    async travel(target) {
        if (target === this.current && target !== 'map') return;
        if (this.transitioning) return;
        [span_20](start_span)this.transitioning = true;[span_20](end_span)

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
        [span_21](start_span)}

        const wipeNames = {
            map: 'World Map', village: 'The Fading Village', forest: 'Whispering Forest',
            dungeon: 'The Dungeon', castle: 'Broken Castle', arena: 'Echo Arena', veil: 'The Veil Core',
            title: ''
        };

        const wipe = Utils.$('wipe');
        const wipeText = Utils.$('wipe-text');
        if (wipeText) wipeText.textContent = wipeNames[target] || '';
        if (wipe) wipe.style.opacity = '1';
        await Utils.sleep(500);[span_21](end_span)

        if (this.current) {
            const curEl = Utils.$('scene-' + this.current);
            if (curEl) {
                curEl.classList.remove('active', 'entering');
                curEl.style.display = 'none';
            }
        }

        this.current = target;
        [span_22](start_span)GameState.location = target;[span_22](end_span)

        const nextEl = Utils.$('scene-' + target);
        if (nextEl) {
            nextEl.style.removeProperty('display');
            nextEl.classList.add('active', 'entering');
            setTimeout(() => nextEl.classList.remove('entering'), 1000);
        [span_23](start_span)}

        if (target !== 'map' && target !== 'title') {
            VFX.shake();
            VFX.zoom();
        }

        await Utils.sleep(300);
        if (wipe) wipe.style.opacity = '0';[span_23](end_span)

        const hud = Utils.$('hud');
        if (target === 'title') { hud.classList.add('hidden'); }
        else { hud.classList.remove('hidden'); }

        if (target !== 'title') this.updateMapPlayer(target);
        const dnb = Utils.$('day-night-badge');
        if (dnb) dnb.style.display = (target === 'title') ? 'none' : 'flex';

        if (!GameState.locationsVisited.includes(target)) {
            GameState.locationsVisited.push(target);
        [span_24](start_span)}

        if (target !== 'title' && target !== 'map') {
            setTimeout(() => VFX.walkCharIn(target), 200);
        }
        this.generateAmbient(target);
        this.onEnter(target);
        HUD.update();
        Save.save();
        this.transitioning = false;
    },[span_24](end_span)
    generateAmbient(loc) {
        switch(loc) {
            case 'village': Ambient.createSmoke('village-smoke'); break;
            case 'forest': Ambient.createFireflies('forest-fireflies'); break;
            case 'dungeon': Ambient.createDust('dungeon-dust'); break;
            case 'arena': Ambient.createArenaCrowd('arena-crowd'); break;
            case 'veil': Ambient.createTendrils('veil-tendrils'); break;
        }
    [span_25](start_span)},[span_25](end_span)
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

        const info = Utils.$('map-info');
        const locNames = {
            village: '🏘 The Fading Village — where time loops',
            forest: '🌲 Whispering Forest — voices in the dark',
            dungeon: '⛏ The Dungeon — ancient and dangerous',
            castle: '🏰 Broken Castle — the corrupted king waits',
            arena: '⚔ Echo Arena — prove your worth',
            veil: '◉ Veil Core — the end of all things'
        };
        if (info) info.textContent = locNames[loc] || 'Select a location to travel';
    [span_26](start_span)},[span_26](end_span)
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
    [span_27](start_span)}
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
    },[span_27](end_span)
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
    [span_28](start_span)},[span_28](end_span)
    setTurnIndicator(text) {
        const el = Utils.$('combat-turn');
        if (el) el.textContent = text;
    [span_29](start_span)},[span_29](end_span)
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
    [span_30](start_span)},[span_30](end_span)
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
    [span_31](start_span)},[span_31](end_span)
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
    [span_32](start_span)},[span_32](end_span)
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
    [span_33](start_span)},[span_33](end_span)
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
    [span_34](start_span)},[span_34](end_span)
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
    [span_35](start_span)},[span_35](end_span)
    showDmgFloat(dmg, isEnemy) {
        const el = document.createElement('div');
        el.className = 'dmg-float' + (isEnemy ? '' : ' player');
        el.textContent = `-${dmg}`;
        const scene = document.querySelector('.combat-scene');
        if (!scene) return;
        el.style.cssText = `left:${isEnemy ? '25%' : '65%'};top:25%;`;
        scene.appendChild(el);
        setTimeout(() => el.remove(), 1000);
    [span_36](start_span)},[span_36](end_span)
    updateBars() {
        const ph = Utils.$('combat-player-hp');
        const eh = Utils.$('combat-enemy-hp');
        const phv = Utils.$('combat-player-hp-val');
        const ehv = Utils.$('combat-enemy-hp-val');
        if (ph) ph.style.width = Utils.pct(GameState.hp, GameState.maxHp) + '%';
        if (eh) eh.style.width = Utils.pct(this.enemy.hp, this.enemy.maxHp) + '%';
        if (phv) phv.textContent = GameState.hp + '/' + GameState.maxHp + ' HP';
        if (ehv) ehv.textContent = this.enemy.hp + '/' + this.enemy.maxHp + ' HP';
    [span_37](start_span)},[span_37](end_span)
    logMsg(msg, cls = '') {
        const log = Utils.$('combat-log');
        if (!log) return;
        log.innerHTML += `<div class="${cls}">${msg}</div>`;
        log.scrollTop = log.scrollHeight;
    [span_38](start_span)},[span_38](end_span)
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
    [span_39](start_span)},[span_39](end_span)
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
    [span_40](start_span)},[span_40](end_span)
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
    [span_41](start_span)},[span_41](end_span)
    end(fled) {
        this.active = false;
        Utils.$('combat-overlay').classList.remove('active');
        if (fled) Toast.show('You fled from battle.');
    [span_42](start_span)}
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
    },[span_42](end_span)
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
    [span_43](start_span)},[span_43](end_span)
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
    [span_44](start_span)},[span_44](end_span)
    removeItem(id) {
        const idx = GameState.inventory.findIndex(i => i.id === id);
        if (idx !== -1) GameState.inventory.splice(idx, 1);
    [span_45](start_span)},[span_45](end_span)
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
    [span_46](start_span)}
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
    },[span_46](end_span)
    pick(i) {
        Utils.$('choice-modal').classList.remove('active');
        if (this.callbacks[i]) this.callbacks[i]();
    [span_47](start_span)}
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
    },[span_47](end_span)
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
    [span_48](start_span)},[span_48](end_span)
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
    [span_49](start_span)},[span_49](end_span)
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
    [span_50](start_span)},[span_50](end_span)
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
    [span_51](start_span)}[span_51](end_span)
};
