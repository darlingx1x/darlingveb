/**
 * time.js - Оптимизированная версия
 * Расчёт оставшегося времени жизни с точностью до секунды
 */

// Класс для расчёта жизненных показателей
class LifeTimeCalculator {
  constructor(settings = {}) {
    // Значения по умолчанию, можно переопределить через settings
    this.settings = {
      birthdate: new Date('2004-05-16'),
      lifeExpectancy: 70,
      activeThreshold: 50,
      sleepHours: 8,
      workHours: 40,
      commuteHours: 1,
      necessitiesHours: 2,
      // Добавлено “overheadHours” для учёта мелких обязательных дел
      overheadHours: 1,
      ...settings
    };

    this.updateCalculations();
    this.startRealtimeUpdate();
  }

  startRealtimeUpdate() {
    this.intervalId = setInterval(() => {
      this.updateCalculations();
    }, 1000);
  }

  stopRealtimeUpdate() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  updateCalculations() {
    this.calculateAge();
    this.calculateRemainingTime();
    this.updateUI();
  }

  calculateAge() {
    const now = new Date();
    const birthDate = new Date(this.settings.birthdate);
    const msDiff = now - birthDate;
    const msInYear = 365.25 * 24 * 60 * 60 * 1000;
    this.ageExact = msDiff / msInYear;
    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birthDate.getDate())) {
      age--;
    }
    this.age = age;
  }

  calculateRemainingTime() {
    // Остаток жизни
    this.yearsRemaining = this.settings.lifeExpectancy - this.ageExact;
    this.daysRemaining = this.yearsRemaining * 365.25;

    // Все часы
    const hoursPerYear = 365.25 * 24;
    const totalRemainingHours = this.yearsRemaining * hoursPerYear;

    // Распределение часов
    this.sleepHoursTotal      = this.yearsRemaining * 365.25 * this.settings.sleepHours;
    const workingYearsRemaining = Math.min(
      this.yearsRemaining,
      Math.max(0, this.settings.activeThreshold - this.ageExact)
    );
    this.workHoursTotal       = workingYearsRemaining * 52   * this.settings.workHours;
    this.commuteHoursTotal    = workingYearsRemaining * 260  * this.settings.commuteHours;
    this.necessitiesHoursTotal= this.yearsRemaining * 365.25 * this.settings.necessitiesHours;

    // “Грубое” свободное время
    this.freeTimeHoursTotal = totalRemainingHours
      - (this.sleepHoursTotal + this.workHoursTotal + this.commuteHoursTotal + this.necessitiesHoursTotal);

    // “True free time” с учётом overheadHours
    const overheadTotal = this.yearsRemaining * 365.25 * this.settings.overheadHours;
    this.trueFreeTimeHoursTotal = this.freeTimeHoursTotal - overheadTotal;
    if (this.trueFreeTimeHoursTotal < 0) this.trueFreeTimeHoursTotal = 0;

    // Прогресс-бары
    this.activeLifePercentage = Math.min(100, (this.ageExact / this.settings.activeThreshold) * 100);
    this.laterLifePercentage = 0;
    if (this.ageExact > this.settings.activeThreshold) {
      const laterSpan = this.settings.lifeExpectancy - this.settings.activeThreshold;
      const laterUsed = this.ageExact - this.settings.activeThreshold;
      this.laterLifePercentage = Math.min(100, (laterUsed / laterSpan) * 100);
    }
  }

  formatTimeWithSeconds(sec) {
    if (sec < 60) {
      return `${Math.floor(sec)} sec`;
    } else if (sec < 3600) {
      return `${Math.floor(sec/60)} min, ${Math.floor(sec%60)} sec`;
    } else if (sec < 86400) {
      const h = Math.floor(sec/3600);
      const m = Math.floor((sec%3600)/60);
      return `${h} h, ${m} m`;
    } else if (sec < 2592000) {
      const d = Math.floor(sec/86400);
      const h = Math.floor((sec%86400)/3600);
      return `${d} d, ${h} h`;
    } else if (sec < 31536000) {
      const mo = Math.floor(sec/2592000);
      const d  = Math.floor((sec%2592000)/86400);
      return `${mo} mo, ${d} d`;
    } else {
      const y = sec/31536000;
      return y<10
        ? `${this.formatNumber(y,1)} yr`
        : `${Math.floor(y)} yr`;
    }
  }

  formatNumber(num, dec=0) {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: dec,
      maximumFractionDigits: dec
    });
  }

  updateUI() {
    // Основные
    document.getElementById('age-value').textContent           = this.formatNumber(this.ageExact, 9);
    document.getElementById('years-left-value').textContent    = this.formatNumber(this.yearsRemaining, 9);
    document.getElementById('days-left-value').textContent     = this.formatNumber(this.daysRemaining, 1);
    document.getElementById('hours-left-value').textContent    = this.formatNumber(this.freeTimeHoursTotal, 5);

    // True Free Time (в годах)
    const tfElem = document.getElementById('true-free-time-value');
    if (tfElem) {
      const yrs = this.trueFreeTimeHoursTotal / (365.25*24);
      tfElem.textContent = this.formatNumber(yrs, 9);
    }

    // Прогресс
    document.getElementById('active-progress').style.width      = `${this.activeLifePercentage}%`;
    document.getElementById('progress-label').textContent       = `Active Life: ${Math.round(this.activeLifePercentage)}%`;
    document.getElementById('later-progress').style.width       = `${this.laterLifePercentage}%`;
    document.getElementById('later-progress-label').textContent = `Later Life: ${Math.round(this.laterLifePercentage)}%`;

    // Breakdown
    document.getElementById('sleep-value').textContent     = this.formatTimeWithSeconds(this.sleepHoursTotal*3600);
    document.getElementById('work-value').textContent      = this.formatTimeWithSeconds(this.workHoursTotal*3600);
    document.getElementById('commute-value').textContent   = this.formatTimeWithSeconds(this.commuteHoursTotal*3600);
    document.getElementById('necessities-value').textContent= this.formatTimeWithSeconds(this.necessitiesHoursTotal*3600);
    document.getElementById('free-time-value').textContent = 
      this.formatNumber(this.trueFreeTimeHoursTotal/(365.25*24), 1) + " years";
  }

  updateSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    this.updateCalculations();
    createStarField();
  }
}

// Создание “звёздного поля”
function createStarField() {
  const container = document.getElementById('star-field');
  if (!container) return;
  container.innerHTML = '';

  const now    = new Date();
  const birth  = new Date(calculatorInstance.settings.birthdate);
  const end    = new Date(birth);
  end.setFullYear(birth.getFullYear() + calculatorInstance.settings.lifeExpectancy);

  const totalMonths = (end.getFullYear() - birth.getFullYear())*12 + (end.getMonth() - birth.getMonth());
  const livedMonths = (now.getFullYear() - birth.getFullYear())*12 + (now.getMonth() - birth.getMonth());

  const width    = container.clientWidth;
  const isMobile = window.innerWidth <= 480;
  const base     = isMobile ? 5 : 8;
  const gap      = isMobile ? 1 : 2;
  const perRow   = Math.floor((width-20)/(base+gap*2));
  const starSize = Math.floor((width-20)/perRow - gap*2);

  container.style.display            = 'grid';
  container.style.gridTemplateColumns= `repeat(${perRow},1fr)`;
  container.style.gridGap            = `${gap*2}px`;
  container.style.padding            = '10px';
  container.style.justifyItems       = 'center';

  const months = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December'
  ];

  for (let i=0; i<totalMonths; i++) {
    const star = document.createElement('div');
    star.className = 'static-star';
    star.style.width  = `${starSize}px`;
    star.style.height = `${starSize}px`;
    if (i < livedMonths) star.classList.add('past');

    const idx   = birth.getMonth() + i;
    const yr    = birth.getFullYear() + Math.floor(idx/12);
    const mo    = idx%12;
    const title = `${months[mo]} ${yr}`;
    star.title  = title;

    if (isMobile) {
      star.addEventListener('click', e => {
        e.stopPropagation();
        const tt = document.createElement('div');
        tt.className='star-tooltip';
        tt.innerText= title;
        Object.assign(tt.style,{
          position:'absolute',
          background:'rgba(0,0,0,0.8)',
          color:'#FFD700',
          padding:'5px',
          borderRadius:'4px',
          fontSize:'12px',
          pointerEvents:'none',
          zIndex:'1000'
        });
        const r = star.getBoundingClientRect();
        tt.style.top = (r.top + r.height + window.scrollY + 5)+'px';
        tt.style.left= (r.left + window.scrollX)+'px';
        document.body.appendChild(tt);
        setTimeout(()=>tt.remove(),3000);
      });
    }

    container.appendChild(star);
  }

  const rows = Math.ceil(totalMonths/perRow);
  const minH = rows * (starSize + gap*2) + 20;
  container.style.minHeight = `${minH}px`;
}

// Загрузка сохранённых настроек
function loadSettings() {
  const saved = localStorage.getItem('timeCalculatorSettings');
  if (!saved) return;
  try {
    const s = JSON.parse(saved);
    document.getElementById('birthdate').value       = s.birthdate || '2004-05-16';
    document.getElementById('life-expectancy').value = s.lifeExpectancy || 70;
    document.getElementById('active-threshold').value= s.activeThreshold || 50;
    document.getElementById('sleep-hours').value     = s.sleepHours || 8;
    document.getElementById('work-hours').value      = s.workHours || 40;
    document.getElementById('commute-hours').value   = s.commuteHours || 1;
    document.getElementById('necessities-hours').value= s.necessitiesHours || 2;
    if (s.overheadHours !== undefined) {
      document.getElementById('overhead-hours').value = s.overheadHours;
    }
    calculatorInstance.updateSettings(s);
  } catch(e) {
    console.error('Error loading settings:', e);
  }
}

let calculatorInstance;

document.addEventListener('DOMContentLoaded', () => {
  calculatorInstance = new LifeTimeCalculator();
  createStarField();

  // Toggle настроек
  const toggleBtn = document.getElementById('settings-toggle-btn');
  const panel     = document.getElementById('settings-panel');
  if (toggleBtn && panel) {
    toggleBtn.addEventListener('click', () => panel.classList.toggle('visible'));
  }

  // Apply
  const applyBtn = document.getElementById('apply-btn');
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      const newS = {
        birthdate: document.getElementById('birthdate').value,
        lifeExpectancy:  parseInt(document.getElementById('life-expectancy').value, 10),
        activeThreshold: parseInt(document.getElementById('active-threshold').value, 10),
        sleepHours:      parseFloat(document.getElementById('sleep-hours').value),
        workHours:       parseFloat(document.getElementById('work-hours').value),
        commuteHours:    parseFloat(document.getElementById('commute-hours').value),
        necessitiesHours:parseFloat(document.getElementById('necessities-hours').value),
        overheadHours:   parseFloat(document.getElementById('overhead-hours').value)
      };
      localStorage.setItem('timeCalculatorSettings', JSON.stringify(newS));
      calculatorInstance.updateSettings(newS);
      panel.classList.remove('visible');
    });
  }

  // Reset
  const resetBtn = document.getElementById('reset-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      document.getElementById('birthdate').value        = '2004-05-16';
      document.getElementById('life-expectancy').value  = '70';
      document.getElementById('active-threshold').value = '50';
      document.getElementById('sleep-hours').value      = '8';
      document.getElementById('work-hours').value       = '40';
      document.getElementById('commute-hours').value    = '1';
      document.getElementById('necessities-hours').value= '2';
      document.getElementById('overhead-hours').value   = '1';

      localStorage.removeItem('timeCalculatorSettings');
      calculatorInstance.updateSettings({
        birthdate: '2004-05-16',
        lifeExpectancy: 70,
        activeThreshold: 50,
        sleepHours: 8,
        workHours: 40,
        commuteHours: 1,
        necessitiesHours: 2,
        overheadHours: 1
      });
    });
  }

  // Карточки blink
  document.querySelectorAll('.stat-card').forEach(card => {
    card.addEventListener('click', () => {
      card.classList.add('blink');
      setTimeout(() => card.classList.remove('blink'), 1000);
    });
  });

  loadSettings();
  window.addEventListener('resize', createStarField);
  window.addEventListener('beforeunload', () => {
    if (calculatorInstance) calculatorInstance.stopRealtimeUpdate();
  });
});
