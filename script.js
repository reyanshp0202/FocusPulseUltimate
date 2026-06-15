let secondsElapsed = 0;
let fatiguePercentage = 0;
let intervalId = null;
let yellowSetting = 45 * 60;
let redSetting = 55 * 60;
let breakSetting = 60 * 60;
let breakLengthSetting = 5 * 60;
let breakActive = false;
let sessionStarted = false;
let currentBreakActivity = null;
let lastAlertStage = 'idle';
let voiceEnabled = false;

// New feature state
let demoMode = false;
let moodFatigueBonus = 0;
let breakTypePreference = 'Random';
let fatigueBeforeBreak = 0;
let sessionTimeAtBreak = '00:00';
let currentMood = 'Okay';
let activityMode = 'Normal Work';
let timeUnit = 'minutes';

const activityModes = {
    'Normal Work': {
        yellow: 45,
        red: 55,
        breakStart: 60,
        breakLength: 5,
        breakType: 'Random',
        focus: 'Hourly reset'
    },
    'Studying': {
        yellow: 20,
        red: 25,
        breakStart: 25,
        breakLength: 5,
        breakType: 'Breathing',
        focus: 'Pomodoro rhythm'
    },
    'Coding': {
        yellow: 45,
        red: 55,
        breakStart: 60,
        breakLength: 5,
        breakType: 'Stretch',
        focus: 'Posture reset'
    },
    'Gaming': {
        yellow: 45,
        red: 55,
        breakStart: 60,
        breakLength: 5,
        breakType: 'Eye Relief',
        focus: 'Hourly screen reset'
    },
    'Reading': {
        yellow: 20,
        red: 25,
        breakStart: 30,
        breakLength: 5,
        breakType: 'Eye Relief',
        focus: 'Visual recovery'
    },
    'Creative Writing': {
        yellow: 25,
        red: 45,
        breakStart: 50,
        breakLength: 5,
        breakType: 'Breathing',
        focus: 'Mental reset'
    }
};

const breakActivities = [
    {
        title: 'Square Breathing',
        instructions: 'Inhale for 4 seconds, hold for 4 seconds, exhale for 4 seconds, then hold at the bottom for 4 seconds. Repeat until the timer ends.',
        duration: 16,
        visualText: 'BREATH',
        type: 'Breathing'
    },
    {
        title: 'Deep Sigh Breathing',
        instructions: 'Inhale deeply through your nose, then take a second short sharp inhale. Exhale slowly through your mouth while letting your shoulders drop.',
        duration: 10,
        visualText: 'BREATH',
        type: 'Breathing'
    },
    {
        title: 'Seated Spinal Twist',
        instructions: 'While seated, twist your torso to the right and look over your right shoulder. Hold for 15 seconds, then switch to the other side.',
        duration: 30,
        visualText: 'STRETCH',
        type: 'Stretch'
    },
    {
        title: 'Neck Drop',
        instructions: 'Slowly drop your right ear toward your right shoulder and hold for 15 seconds. Then switch sides and repeat.',
        duration: 30,
        visualText: 'STRETCH',
        type: 'Stretch'
    },
    {
        title: '20-20-20 Rule',
        instructions: '20-20-20 Rule: look away from your screen and focus on something about 20 feet away for 20 seconds to relax your eyes.',
        duration: 20,
        visualText: 'FOCUS',
        type: 'Eye Relief'
    }
];

function showPage(pageName) {
    const aboutPage = document.getElementById('about-page');
    const tryPage = document.getElementById('try-page');
    const aboutTab = document.getElementById('about-tab');
    const tryTab = document.getElementById('try-tab');

    if (pageName === 'try') {
        aboutPage.hidden = true;
        tryPage.hidden = false;
        aboutTab.classList.remove('active');
        tryTab.classList.add('active');
    } else {
        aboutPage.hidden = false;
        tryPage.hidden = true;
        aboutTab.classList.add('active');
        tryTab.classList.remove('active');
    }
}

function startEngine() {
    if (intervalId !== null) {
        return;
    }

    intervalId = setInterval(() => {
        secondsElapsed++;
        updateDashboard();
    }, 1000);
}

function pauseEngine() {
    clearInterval(intervalId);
    intervalId = null;
}

function beginSession() {
    if (sessionStarted) {
        return;
    }

    enableVoiceAlerts();
    sessionStarted = true;
    document.getElementById('begin-button').disabled = true;
    document.getElementById('begin-button').innerText = 'Running';
    updateMoodControls();
    updateDashboard();
    startEngine();
}

function selectMood(mood) {
    currentMood = mood;

    if (mood === 'Stressed') {
        moodFatigueBonus = 10;
    } else if (mood === 'Tired') {
        moodFatigueBonus = 15;
    } else {
        moodFatigueBonus = 0;
    }

    updateMoodControls();
    updateDashboard();
}

function updateMoodControls() {
    document.getElementById('mood-display').innerText = currentMood;

    document.querySelectorAll('.mood-chip').forEach((button) => {
        button.classList.remove('active');
    });

    let activeButton = document.getElementById(`mood-${currentMood.toLowerCase()}`);
    if (activeButton) {
        activeButton.classList.add('active');
    }
}

function updateDashboard() {
    let mins = String(Math.floor(secondsElapsed / 60)).padStart(2, '0');
    let secs = String(secondsElapsed % 60).padStart(2, '0');
    let displayTime = `${mins}:${secs}`;
    document.getElementById('timer-val').innerText = displayTime;

    fatiguePercentage = Math.min(Math.floor((secondsElapsed / breakSetting) * 100) + moodFatigueBonus, 100);
    document.getElementById('fatigue-val').innerText = `${fatiguePercentage}%`;
    updateActivityModeDisplay();

    const light = document.getElementById('light');
    const status = document.getElementById('status');
    let currentStage = 'green';

    if (secondsElapsed < yellowSetting) {
        light.style.backgroundColor = '#22c55e';
        light.style.boxShadow = '0 0 40px #22c55e';
        light.innerText = 'GOOD';
        status.innerText = 'Feeling Focused';
        status.style.color = '#22c55e';
        currentStage = 'green';
    } else if (secondsElapsed >= yellowSetting && secondsElapsed < redSetting) {
        light.style.backgroundColor = '#eab308';
        light.style.boxShadow = '0 0 40px #eab308';
        light.innerText = 'SLOW';
        status.innerText = 'Break Soon';
        status.style.color = '#eab308';
        currentStage = 'yellow';
    } else if (secondsElapsed >= redSetting) {
        light.style.backgroundColor = '#ef4444';
        light.style.boxShadow = '0 0 40px #ef4444';
        light.innerText = 'REST';
        status.innerText = 'Break Needed';
        status.style.color = '#ef4444';
        currentStage = 'red';
    }

    updateEventMessage(currentStage, displayTime);
    updateCoach();

    if (shouldStartBreak() && !breakActive) {
        triggerBreakLockout();
    }
}

function shouldStartBreak() {
    return secondsElapsed >= breakSetting || fatiguePercentage >= 100;
}

function updateEventMessage(stage, displayTime) {
    const messageEl = document.getElementById('event-message');

    if (!sessionStarted || stage === 'green') {
        messageEl.innerText = '';
        messageEl.classList.remove('active');
        lastAlertStage = stage;
        return;
    }

    if (stage === lastAlertStage) {
        return;
    }

    if (stage === 'yellow') {
        messageEl.innerText = `Break soon warning started at ${displayTime}.`;
        speakAlert('Break soon.');
    } else if (stage === 'red') {
        messageEl.innerText = `Break needed warning started at ${displayTime}.`;
        speakAlert('Break needed.');
    }

    messageEl.classList.add('active');
    lastAlertStage = stage;
}

function enableVoiceAlerts() {
    if (!('speechSynthesis' in window)) {
        return;
    }

    voiceEnabled = true;
    window.speechSynthesis.cancel();
}

function speakAlert(message) {
    if (!voiceEnabled || !('speechSynthesis' in window)) {
        return;
    }

    window.speechSynthesis.cancel();
    const speech = new SpeechSynthesisUtterance(message);
    speech.rate = 1;
    speech.pitch = 1;
    speech.volume = 1;
    window.speechSynthesis.speak(speech);
}

function updateCoach() {
    const stateEl = document.getElementById('coach-state');
    const adviceEl = document.getElementById('coach-advice');
    const etaEl = document.getElementById('coach-eta');
    const recEl = document.getElementById('coach-rec');
    const recValueEl = document.getElementById('coach-rec-value');
    const recReasonEl = document.getElementById('coach-rec-reason');

    // Idle state before a session starts.
    if (!sessionStarted) {
        stateEl.innerText = 'Standing by';
        stateEl.style.color = 'var(--muted)';
        adviceEl.innerText = 'Start a session and I\u2019ll monitor your fatigue patterns in real time.';
        etaEl.innerText = '';
        recEl.setAttribute('hidden', '');
        return;
    }

    const moodNote = currentMood === 'Tired'
        ? ' You logged in tired, so I\u2019m watching your strain more closely.'
        : currentMood === 'Stressed'
            ? ' You started stressed, so short resets will help you the most.'
            : '';

    if (secondsElapsed < yellowSetting) {
        const eta = Math.max(yellowSetting - secondsElapsed, 0);
        stateEl.innerText = 'In flow';
        stateEl.style.color = '#22c55e';
        adviceEl.innerText = 'You\u2019re focused and your fatigue is low. Protect this window for your hardest task.' + moodNote;
        etaEl.innerText = `~${formatDuration(eta)} to warning`;
        etaEl.style.color = '#22c55e';
        recEl.setAttribute('hidden', '');
    } else if (secondsElapsed < redSetting) {
        const eta = Math.max(redSetting - secondsElapsed, 0);
        stateEl.innerText = 'Fatigue building';
        stateEl.style.color = '#eab308';
        adviceEl.innerText = 'Your focus is starting to drift. Finish your current thought and find a natural stopping point.' + moodNote;
        etaEl.innerText = `~${formatDuration(eta)} to rest`;
        etaEl.style.color = '#eab308';
        showCoachRecommendation(recEl, recValueEl, recReasonEl);
    } else {
        stateEl.innerText = 'Recovery advised';
        stateEl.style.color = '#ef4444';
        adviceEl.innerText = 'You\u2019re past your focus limit. Pushing further now trades real productivity for mistakes.' + moodNote;
        etaEl.innerText = 'Rest now';
        etaEl.style.color = '#ef4444';
        showCoachRecommendation(recEl, recValueEl, recReasonEl);
    }
}

function showCoachRecommendation(recEl, recValueEl, recReasonEl) {
    const pick = recommendBreak();
    recValueEl.innerText = pick.title;
    recReasonEl.innerText = pick.reason;
    recEl.removeAttribute('hidden');
}

function recommendBreak() {
    // Choose a reset that matches the user's mood and fatigue, respecting their preference when set.
    let type;
    let reason;

    if (breakTypePreference !== 'Random') {
        type = breakTypePreference;
        reason = `Matches your preferred ${breakTypePreference.toLowerCase()} reset.`;
    } else if (currentMood === 'Stressed' || fatiguePercentage >= 75) {
        type = 'Breathing';
        reason = 'High strain detected \u2014 breathing lowers your fatigue fastest.';
    } else if (currentMood === 'Tired') {
        type = 'Stretch';
        reason = 'You\u2019re tired \u2014 movement boosts circulation and alertness.';
    } else if (secondsElapsed >= redSetting) {
        type = 'Eye Relief';
        reason = 'Long screen stretch \u2014 give your eyes a 20-foot reset.';
    } else {
        type = 'Breathing';
        reason = 'A quick breathing reset will bring your focus back.';
    }

    const matches = breakActivities.filter((activity) => activity.type === type);
    const pick = matches.length > 0 ? matches[0] : breakActivities[0];
    return { title: pick.title, reason: reason };
}

function toggleDemoMode() {
    demoMode = !demoMode;
    const button = document.getElementById('demo-button');

    if (demoMode) {
        yellowSetting = 5;
        redSetting = 7;
        breakSetting = 9;
        breakLengthSetting = 10;
        button.innerText = 'Disable Demo Mode';
        button.classList.add('demo-active');
    } else {
        // Return to the saved user settings.
        loadSettingsFromBrowser();
        button.innerText = 'Enable Demo Mode';
        button.classList.remove('demo-active');
    }

    updateDashboard();
}

function toggleRecoveryLog() {
    const log = document.getElementById('recovery-log');
    const button = document.getElementById('recovery-log-button');
    const isHidden = log.hasAttribute('hidden');

    if (isHidden) {
        renderRecoveryHistory();
        log.removeAttribute('hidden');
        button.classList.add('log-open');
        log.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    } else {
        log.setAttribute('hidden', '');
        button.classList.remove('log-open');
    }
}

function openSettings() {
    pauseEngine();

    if (demoMode) {
        demoMode = false;
        const demoButton = document.getElementById('demo-button');
        demoButton.innerText = 'Enable Demo Mode';
        demoButton.classList.remove('demo-active');
        loadSettingsFromBrowser();
        updateDashboard();
    }

    document.getElementById('activity-mode-setting').value = activityMode;
    updateTimeUnitControls();
    setSettingInputsFromSeconds();
    document.getElementById('break-type-setting').value = breakTypePreference;
    document.getElementById('settings-screen').style.display = 'flex';
}

function closeSettings() {
    document.getElementById('settings-screen').style.display = 'none';

    if (sessionStarted && !breakActive) {
        startEngine();
    }
}

function saveSettings() {
    activityMode = document.getElementById('activity-mode-setting').value;
    let minimums = getTimeMinimums();
    yellowSetting = readTimeInput('yellow-setting', 45 * 60, minimums.yellow, 240 * 60);
    redSetting = readTimeInput('red-setting', 55 * 60, minimums.red, 240 * 60);
    breakSetting = readTimeInput('break-setting', 60 * 60, minimums.breakStart, 240 * 60);
    breakLengthSetting = readTimeInput('break-length-setting', 5 * 60, minimums.breakLength, 60 * 60);
    breakTypePreference = document.getElementById('break-type-setting').value;

    if (redSetting < yellowSetting) {
        redSetting = yellowSetting + minimums.gap;
    }

    if (breakSetting < redSetting) {
        breakSetting = redSetting;
    }

    setSettingInputsFromSeconds();

    // Saving settings exits Demo Mode so demo values are never stored as real settings.
    demoMode = false;
    const demoButton = document.getElementById('demo-button');
    demoButton.innerText = 'Enable Demo Mode';
    demoButton.classList.remove('demo-active');

    saveSettingsToBrowser();
    document.getElementById('settings-screen').style.display = 'none';
    updateDashboard();

    if (sessionStarted && !breakActive) {
        startEngine();
    }
}

function saveSettingsToBrowser() {
    localStorage.setItem('settingsUnitVersion', 'minutes-v3');
    localStorage.setItem('timeUnit', timeUnit);
    localStorage.setItem('activityMode', activityMode);
    localStorage.setItem('yellowTimeSetting', yellowSetting);
    localStorage.setItem('redTimeSetting', redSetting);
    localStorage.setItem('breakTimeSetting', breakSetting);
    localStorage.setItem('breakLengthSetting', breakLengthSetting);
    localStorage.setItem('breakTypePreference', breakTypePreference);
}

function loadSettingsFromBrowser() {
    if (localStorage.getItem('settingsUnitVersion') !== 'minutes-v3') {
        applyActivityModePreset(activityMode);
        saveSettingsToBrowser();
        return;
    }

    let storedActivityMode = localStorage.getItem('activityMode');
    if (activityModes[storedActivityMode]) {
        activityMode = storedActivityMode;
    }

    let storedTimeUnit = localStorage.getItem('timeUnit');
    if (storedTimeUnit === 'seconds' || storedTimeUnit === 'minutes') {
        timeUnit = storedTimeUnit;
    }

    let minimums = getTimeMinimums();
    yellowSetting = clampSetting(localStorage.getItem('yellowTimeSetting'), yellowSetting, minimums.yellow, 240 * 60);
    redSetting = clampSetting(localStorage.getItem('redTimeSetting'), redSetting, minimums.red, 240 * 60);
    breakSetting = clampSetting(localStorage.getItem('breakTimeSetting'), breakSetting, minimums.breakStart, 240 * 60);
    breakLengthSetting = clampSetting(localStorage.getItem('breakLengthSetting'), breakLengthSetting, minimums.breakLength, 60 * 60);

    let storedPreference = localStorage.getItem('breakTypePreference');
    if (storedPreference === 'Random' || storedPreference === 'Breathing' || storedPreference === 'Stretch' || storedPreference === 'Eye Relief') {
        breakTypePreference = storedPreference;
    }

    if (redSetting < yellowSetting) {
        redSetting = yellowSetting + minimums.gap;
    }

    if (breakSetting < redSetting) {
        breakSetting = redSetting;
    }

    saveSettingsToBrowser();
}

function previewActivityMode() {
    let selectedMode = document.getElementById('activity-mode-setting').value;
    let mode = activityModes[selectedMode];

    if (!mode) {
        return;
    }

    document.getElementById('yellow-setting').value = convertSecondsToDisplayValue(minutesToSeconds(mode.yellow));
    document.getElementById('red-setting').value = convertSecondsToDisplayValue(minutesToSeconds(mode.red));
    document.getElementById('break-setting').value = convertSecondsToDisplayValue(minutesToSeconds(mode.breakStart));
    document.getElementById('break-length-setting').value = convertSecondsToDisplayValue(minutesToSeconds(mode.breakLength));
    document.getElementById('break-type-setting').value = mode.breakType;
}

function applyActivityModePreset(modeName) {
    let mode = activityModes[modeName] || activityModes['Normal Work'];
    activityMode = modeName;
    yellowSetting = minutesToSeconds(mode.yellow);
    redSetting = minutesToSeconds(mode.red);
    breakSetting = minutesToSeconds(mode.breakStart);
    breakLengthSetting = minutesToSeconds(mode.breakLength);
    breakTypePreference = mode.breakType;
}

function updateActivityModeDisplay() {
    let mode = activityModes[activityMode] || activityModes['Normal Work'];
    document.getElementById('activity-mode-display').innerText = activityMode;
    document.getElementById('activity-mode-focus').innerText = mode.focus;
}

function minutesToSeconds(minutes) {
    return minutes * 60;
}

function secondsToMinutes(seconds) {
    return Math.round(seconds / 60);
}

function toggleTimeUnit() {
    let yellowSeconds = readTimeInput('yellow-setting', yellowSetting, 1, 240 * 60);
    let redSeconds = readTimeInput('red-setting', redSetting, 1, 240 * 60);
    let breakSeconds = readTimeInput('break-setting', breakSetting, 1, 240 * 60);
    let lengthSeconds = readTimeInput('break-length-setting', breakLengthSetting, 1, 60 * 60);

    timeUnit = timeUnit === 'minutes' ? 'seconds' : 'minutes';
    yellowSetting = yellowSeconds;
    redSetting = redSeconds;
    breakSetting = breakSeconds;
    breakLengthSetting = lengthSeconds;

    updateTimeUnitControls();
    setSettingInputsFromSeconds();
}

function updateTimeUnitControls() {
    let labelText = timeUnit === 'minutes' ? 'in minutes' : 'in seconds';
    document.getElementById('unit-toggle-button').innerText = timeUnit === 'minutes' ? 'Minutes' : 'Seconds';

    document.querySelectorAll('.time-unit-label').forEach((label) => {
        label.innerText = labelText;
    });
}

function setSettingInputsFromSeconds() {
    document.getElementById('yellow-setting').value = convertSecondsToDisplayValue(yellowSetting);
    document.getElementById('red-setting').value = convertSecondsToDisplayValue(redSetting);
    document.getElementById('break-setting').value = convertSecondsToDisplayValue(breakSetting);
    document.getElementById('break-length-setting').value = convertSecondsToDisplayValue(breakLengthSetting);
}

function readTimeInput(elementId, fallbackSeconds, minSeconds, maxSeconds) {
    let value = clampSetting(document.getElementById(elementId).value, convertSecondsToDisplayValue(fallbackSeconds), 1, 9999);
    let seconds = timeUnit === 'minutes' ? minutesToSeconds(value) : value;
    return Math.min(Math.max(seconds, minSeconds), maxSeconds);
}

function getTimeMinimums() {
    if (timeUnit === 'seconds') {
        return {
            yellow: 1,
            red: 2,
            breakStart: 3,
            breakLength: 1,
            gap: 1
        };
    }

    return {
        yellow: 60,
        red: 120,
        breakStart: 180,
        breakLength: 60,
        gap: 60
    };
}

function convertSecondsToDisplayValue(seconds) {
    if (timeUnit === 'minutes') {
        return secondsToMinutes(seconds);
    }

    return seconds;
}

function formatDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    }

    return `${Math.ceil(seconds / 60)}m`;
}

function formatBreakTimer(seconds) {
    let minutes = String(Math.floor(seconds / 60)).padStart(2, '0');
    let secs = String(seconds % 60).padStart(2, '0');
    return `${minutes}:${secs}`;
}

function clampSetting(value, fallback, min, max) {
    if (value === null || value === '') {
        return fallback;
    }

    let number = Number(value);

    if (Number.isNaN(number)) {
        return fallback;
    }

    return Math.min(Math.max(number, min), max);
}

function triggerBreakLockout() {
    if (breakActive) {
        return;
    }

    breakActive = true;
    pauseEngine();

    // Capture the pre-break stats for the recovery summary.
    fatigueBeforeBreak = fatiguePercentage;
    sessionTimeAtBreak = document.getElementById('timer-val').innerText;
    showBreakStartMessage(sessionTimeAtBreak);

    currentBreakActivity = getBreakActivity();
    document.getElementById('break-title').innerText = currentBreakActivity.title;
    document.getElementById('break-instructions').innerText = currentBreakActivity.instructions;
    document.getElementById('break-visual').innerText = currentBreakActivity.visualText;
    document.getElementById('break-timer').innerText = formatBreakTimer(breakLengthSetting);
    document.getElementById('exercise-start-button').style.display = 'block';
    document.getElementById('break-screen').style.display = 'flex';
}

function showBreakStartMessage(displayTime) {
    const messageEl = document.getElementById('event-message');
    const message = `Break is needed. Time to start your reset at ${displayTime}.`;
    messageEl.innerText = message;
    messageEl.classList.add('active');
    document.getElementById('break-start-message').innerText = message;
    speakAlert('Break needed. Time to reset.');
    lastAlertStage = 'break';
}

function startBreakExercise() {
    document.getElementById('exercise-start-button').style.display = 'none';

    let countdown = breakLengthSetting;
    document.getElementById('break-timer').innerText = formatBreakTimer(countdown);

    let breakInterval = setInterval(() => {
        countdown--;
        document.getElementById('break-timer').innerText = formatBreakTimer(countdown);

        if (countdown <= 0) {
            clearInterval(breakInterval);
            showRecoveryComplete();
        }
    }, 1000);
}

function showRecoveryComplete() {
    document.getElementById('recovery-exercise').innerText = currentBreakActivity.title;
    document.getElementById('recovery-session-time').innerText = sessionTimeAtBreak;
    document.getElementById('recovery-fatigue-before').innerText = `${fatigueBeforeBreak}%`;
    document.getElementById('recovery-fatigue-after').innerText = '0%';

    saveRecoveryToHistory(currentBreakActivity.title, sessionTimeAtBreak, fatigueBeforeBreak);

    document.getElementById('break-screen').style.display = 'none';
    document.getElementById('recovery-screen').style.display = 'flex';
}

function closeRecoveryScreen() {
    document.getElementById('recovery-screen').style.display = 'none';

    secondsElapsed = 0;
    fatiguePercentage = 0;
    moodFatigueBonus = 0;
    breakActive = false;
    currentBreakActivity = null;
    sessionStarted = false;
    currentMood = 'Okay';

    document.getElementById('begin-button').disabled = false;
    document.getElementById('begin-button').innerText = 'Begin';

    updateMoodControls();
    updateDashboard();
    renderRecoveryHistory();
}

function getBreakActivity() {
    let pool = breakActivities;

    if (breakTypePreference !== 'Random') {
        let filtered = breakActivities.filter((activity) => activity.type === breakTypePreference);
        if (filtered.length > 0) {
            pool = filtered;
        }
    }

    let randomIndex = Math.floor(Math.random() * pool.length);
    return pool[randomIndex];
}

function saveRecoveryToHistory(exercise, sessionTime, fatigueBefore) {
    let history = loadRecoveryHistory();

    history.unshift({
        exercise: exercise,
        sessionTime: sessionTime,
        fatigueBefore: fatigueBefore,
        date: new Date().toLocaleString()
    });

    history = history.slice(0, 5);
    localStorage.setItem('recoveryHistory', JSON.stringify(history));
}

function loadRecoveryHistory() {
    try {
        let stored = JSON.parse(localStorage.getItem('recoveryHistory'));
        if (Array.isArray(stored)) {
            return stored;
        }
        return [];
    } catch (error) {
        return [];
    }
}

function renderRecoveryHistory() {
    let history = loadRecoveryHistory();
    let list = document.getElementById('recovery-list');
    list.innerHTML = '';

    if (history.length === 0) {
        let empty = document.createElement('li');
        empty.className = 'recovery-empty';
        empty.innerText = 'No recovery sessions logged yet.';
        list.appendChild(empty);
        return;
    }

    history.forEach((item) => {
        let li = document.createElement('li');
        li.className = 'recovery-item';

        let main = document.createElement('div');
        main.className = 'recovery-item-main';

        let name = document.createElement('span');
        name.className = 'recovery-item-exercise';
        name.innerText = item.exercise;

        let meta = document.createElement('span');
        meta.className = 'recovery-item-meta';
        meta.innerText = `${item.sessionTime} · ${item.fatigueBefore}% → 0%`;

        main.appendChild(name);
        main.appendChild(meta);

        let date = document.createElement('span');
        date.className = 'recovery-item-date';
        date.innerText = item.date;

        li.appendChild(main);
        li.appendChild(date);
        list.appendChild(li);
    });
}

loadSettingsFromBrowser();
updateMoodControls();
updateDashboard();
renderRecoveryHistory();
