class DateConverter {
  static GREGORIAN_MONTH_DAYS = [
    31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31,
  ];
  static JALALI_MONTH_DAYS = [31, 31, 31, 31, 31, 31, 30, 30, 30, 30, 30, 29];

  static jalaliToGregorian(jYear, jMonth, jDay) {
    const [gYear, gMonth, gDay] = this.convert(jYear, jMonth, jDay);
    return new Date(`${gYear}-${gMonth}-${gDay}`);
  }

  static convert(jy, jm, jd) {
    jy = parseInt(jy);
    jm = parseInt(jm);
    jd = parseInt(jd);

    // Initial calculations
    let jy1 = jy - 979;
    let jm1 = jm - 1;
    let jd1 = jd - 1;

    // Calculating the days of Jalali
    let jdn =
      365 * jy1 + Math.floor(jy1 / 33) * 8 + Math.floor(((jy1 % 33) + 3) / 4);

    // Adding days of the Jalali months
    for (let i = 0; i < jm1; ++i) {
      jdn += this.JALALI_MONTH_DAYS[i];
    }

    // Add the current day and correct the date
    jdn += jd1;
    let gdn = jdn + 79;

    // Gregorian calendar calculations
    let gy = 1600 + 400 * Math.floor(gdn / 146097);
    gdn %= 146097;

    // Managing leap years
    let leap = true;
    if (gdn >= 36525) {
      gdn--;
      gy += 100 * Math.floor(gdn / 36524);
      gdn %= 36524;
      if (gdn >= 365) gdn++;
      else leap = false;
    }

    gy += 4 * Math.floor(gdn / 1461);
    gdn %= 1461;

    // Final calculation of the year
    if (gdn >= 366) {
      leap = false;
      gdn--;
      gy += Math.floor(gdn / 365);
      gdn %= 365;
    }

    // Calculating the month and day
    let gi;
    for (
      gi = 0;
      gdn >= this.GREGORIAN_MONTH_DAYS[gi] + (gi === 1 && leap);
      gi++
    ) {
      gdn -= this.GREGORIAN_MONTH_DAYS[gi] + (gi === 1 && leap);
    }

    return [
      gy,
      (gi + 1).toString().padStart(2, "0"),
      (gdn + 1).toString().padStart(2, "0"),
    ];
  }

  // Validation of Jalali's date
  static validateJalaliDate(year, month, day) {
    if (month < 1 || month > 12) return false;
    const maxDay =
      month === 12 && this.isJalaliLeap(year)
        ? 30
        : this.JALALI_MONTH_DAYS[month - 1];
    return day >= 1 && day <= maxDay;
  }

  // Jalali's leap year review
  static isJalaliLeap(year) {
    return ((year - 979) % 33) % 4 === 1;
  }
}

class LifeCalculator {
  static LIFE_EXPECTANCY_YEARS = 73;

  static calculateLifeProgress(birthDate) {
    const today = new Date();
    const lifeExpectancyDate = new Date(
      birthDate.getFullYear() + this.LIFE_EXPECTANCY_YEARS,
      birthDate.getMonth(),
      birthDate.getDate()
    );

    const totalDays = this.getDaysBetween(birthDate, lifeExpectancyDate);
    const passedDays = this.getDaysBetween(birthDate, today);
    const progressPercentage = ((passedDays / totalDays) * 100).toFixed(2);

    return {
      totalDays,
      passedDays,
      progressPercentage,
      lifeExpectancyDate,
    };
  }

  static getDaysBetween(startDate, endDate) {
    const msPerDay = 1000 * 60 * 60 * 24;
    return Math.floor((endDate - startDate) / msPerDay);
  }
}

class UIManager {
  static init() {
    this.cacheDOM();
    this.bindEvents();
  }

  static cacheDOM() {
    this.form = document.getElementById("ageCalculatorForm");
    this.statsContainer = document.getElementById("statsContainer");
    this.lifeGrid = document.getElementById("lifeGrid");
  }

  static bindEvents() {
    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
    this.form.querySelectorAll(".date-input").forEach((input) => {
      input.addEventListener("input", (e) => this.validateDateInput(e.target));
    });
  }

  static handleSubmit(e) {
    e.preventDefault();
    const [day, month, year] = Array.from(this.form.elements)
      .filter((el) => el.tagName === "INPUT")
      .map((input) => parseInt(input.value));

    try {
      const birthDate = DateConverter.jalaliToGregorian(year, month, day);
      const lifeData = LifeCalculator.calculateLifeProgress(birthDate);
      this.updateUI(lifeData);
    } catch (error) {
      console.error(error);
      this.showError("تاریخ وارد شده معتبر نیست");
    }
  }

  static updateUI({
    totalDays,
    passedDays,
    progressPercentage,
    lifeExpectancyDate,
  }) {
    this.statsContainer.innerHTML = `
                <p>شما ${progressPercentage}% از عمر خود تا میانگین امید به زندگی در ایران را سپری کرده‌اید.</p>
                <p>تاریخ رسیدن به میانگین امید به زندگی: ${lifeExpectancyDate.toLocaleDateString(
                  "fa-IR"
                )}</p>
            `;

    this.renderLifeGrid(totalDays, passedDays);
  }

  static renderLifeGrid(totalDays, passedDays) {
    const fragment = document.createDocumentFragment();

    let currentWeek = null;
    for (let i = 0; i < totalDays; i++) {
      if (i % 7 === 0 || i === 0) {
        currentWeek = document.createElement("div");
        currentWeek.className = "week";

        fragment.appendChild(currentWeek);
      }

      const day = document.createElement("div");
      day.className = `life-day ${i < passedDays ? "passed" : ""}`;
      currentWeek.appendChild(day);
    }

    this.lifeGrid.innerHTML = "";
    this.lifeGrid.appendChild(fragment);
  }

  static validateDateInput(input) {
    const maxValues = {
      dayInput: 31,
      monthInput: 12,
      yearInput: parseInt(new Date().toLocaleDateString("fa-IR-u-nu-latn")),
    };

    if (input.value > maxValues[input.id]) {
      input.value = input.value.slice(0, -1);
    }
  }

  static showError(message) {
    this.statsContainer.innerHTML = `<div class="error">${message}</div>`;
  }
}

// Initialize application
document.addEventListener("DOMContentLoaded", () => UIManager.init());
