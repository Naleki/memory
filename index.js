const defaultIntervals = [0, 1, 3, 7, 14, 29]
const msPerDay = 24 * 60 * 60 * 1000
const app = {
  mounted () {
    if('scrollRestoration' in history) {
      history.scrollRestoration = 'manual'
    }
    window.onpopstate = () => {
      this.restore()
      this.commit()
    }
    this.restore()
    this.commit()
    // Check if there are no search parameters, then update URL
    if((new URL(window.location)).searchParams.toString() === '') {
      this.updateURL(true)
    }
  },

  data () {
    return {
      // UI parameters
      title: '',
      weeks: [],
      newListPrefix: '',
      reviewListPrefix: '',
      weekdayNames: [],
      newParameters: {
        date: new Date(),
        startList: 1, // Added startList
        endList: 42,   // Added endList
      },
      stylesheet: null,
      allowCustomFont: false,
      // Table parameters
      parameters: {
        date: new Date(),
        today: false,
        monday: false,
        week: 'Sun',
        title: '17天GRE单词背诵计划时间表',
        prefix: 'L',
        startList: 1, // Added startList
        endList: 42,   // Added endList
        listPerDay: 2,
        reversed: false,
        colored: false,
        intervals: [],
        skippedDates: [],
        font: '',
      },
    }
  },

  computed: {
    greIntervals () {
      return defaultIntervals
    },

    displayedDate: {
      get () {
        return (this.newParameters.date.getFullYear()
                + '-'
                + ('0' + (this.newParameters.date.getMonth() + 1)).slice(-2)
                + '-'
                + ('0' + this.newParameters.date.getDate()).slice(-2)
               )
      },
      set (dateString) {
        this.newParameters.date = new Date(dateString)
      },
    },

    displayedIntervals: {
      get () {
        return this.newParameters.intervals && this.newParameters.intervals.join(',')
      },
      set (string) {
        var intervals = this.normalizeIntegersString(string)
        if(intervals) {
          this.newParameters.intervals = intervals
        }
      },
    },

    displayedSkippedDates: {
      get () {
        return this.newParameters.skippedDates && this.newParameters.skippedDates.join(',')
      },
      set (string) {
        var dates = this.normalizeIntegersString(string)
        if(dates) {
          this.newParameters.skippedDates = dates
        }
      },
    },

    monday: {
      get () {
        return this.newParameters.week === 'Mon'
      },
      set (mondayFirst) {
        if(mondayFirst) {
          this.newParameters.week = 'Mon'
        } else {
          this.newParameters.week = 'Sun'
        }
      },
    },
  },

  methods: {
    userCommit () {
      Object.assign(this.parameters, this.normalizeParameters(this.newParameters))
      this.commit()
      this.updateURL(false)
    },
    commit () {
      this.update(this.parameters)
    },

    updateURL (replace) {
      var url = new URL(window.location)
      for(var i in this.parameters) {
        if(i === 'date') {
          url.searchParams.set(i, this.displayedDate)
        } else if(i === 'intervals') {
          url.searchParams.set(i, this.displayedIntervals)
        } else if(i === 'skippedDates') {
          url.searchParams.set(i, this.displayedSkippedDates)
        } else if (i !== 'listTotal') { // Exclude listTotal from URL parameters
           url.searchParams.set(i, this.parameters[i]);
        }
      }
      if(replace) {
        window.history.replaceState('', this.title, url.href)
      } else {
        window.history.pushState('', this.title, url.href)
      }
    },

    restore () {
      var url = new URL(window.location)
      var newParameters = {}
      for(var i in this.parameters) {
        var value = url.searchParams.get(i)
        if(value) {
          newParameters[i] = value
        }
      }
      Object.assign(this.parameters, this.normalizeParameters(newParameters))
    },

    getDayClass (day) {
      if(day) {
        return 'd' + day.date.getFullYear() + '-' + (day.date.getMonth() + 1) + '-' + day.date.getDate()
      } else {
        return ''
      }
    },

    normalizeIntegersString (arrayString) {
      try {
        var array = JSON.parse('[' + arrayString + ']')
        if(Array.isArray(array)) {
          if(array.length === 0) {
            return array
          } else if(array.reduce((allNumber, value) => {
            return allNumber && Number.isInteger(value) && value >= 0
          }, true)) { // Added initial value true for reduce
            return array
          } else {
            return undefined
          }
        } else {
          return undefined
        }
      } catch (e) {
        return undefined
      }
    },

    normalizeParameters (parameters) {
      if(typeof(parameters.reversed) === 'string') {
        if(parameters.reversed === 'true') {
          parameters.reversed = true
        } else {
          parameters.reversed = false
        }
      }
      if(typeof(parameters.colored) === 'string') {
        if(parameters.colored === 'true') {
          parameters.colored = true
        } else {
          parameters.colored = false
        }
      }
      if(typeof(parameters.today) === 'string') {
        if(parameters.today === 'true') {
          parameters.today = true
        } else {
          parameters.today = false
        }
      }
      if(typeof(parameters.font) !== 'string') {
        parameters.font = ''
      }
      parameters.date = new Date(parameters.date)
      if(Number.isNaN(parameters.date.getTime())) {
        // If date is invalid, use a default or current date
        parameters.date = new Date();
      }

      // Normalize startList and endList
      parameters.startList = Number.parseInt(parameters.startList);
      if (!(Number.isInteger(parameters.startList) && parameters.startList > 0)) {
          parameters.startList = 1; // Default start list
      }

      parameters.endList = Number.parseInt(parameters.endList);
      if (!(Number.isInteger(parameters.endList) && parameters.endList >= parameters.startList)) {
          parameters.endList = parameters.startList + 41; // Default end list (maintaining 42 lists difference if start is 1)
      }

      parameters.listPerDay = Number.parseInt(parameters.listPerDay)
      if(!(Number.isInteger(parameters.listPerDay) &&
           parameters.listPerDay > 0
          )) {
        parameters.listPerDay = 2; // Default list per day
      }

      parameters.intervals = this.normalizeIntegersString(parameters.intervals)
      if(!parameters.intervals || parameters.intervals.length === 0) {
        parameters.intervals = defaultIntervals
      }
      parameters.skippedDates = this.normalizeIntegersString(parameters.skippedDates)
      if(!parameters.skippedDates) {
        parameters.skippedDates = []; // Default empty skipped dates
      }
      return parameters
    },

    increaseDate (date, days) {
      return new Date(date.getTime() + days * msPerDay)
    },
    getDistance (date1, date2) {
      return Math.round((date1 - date2) / msPerDay)
    },

    weekStartDate (date, weekType) {
      var sunday = this.increaseDate(date, -date.getDay())
      if(weekType === 'Mon') {
        if(date.getDay() === 0) {
          return this.increaseDate(sunday, -7 + 1)
        } else {
          return this.increaseDate(sunday, 1)
        }
      } else {
        return sunday
      }
    },

    initWeekdayNames (weekType) {
      var weekStart = this.weekStartDate(new Date(), weekType)

      var formatter = new Intl.DateTimeFormat([], {weekday: 'short'})
      var names = []
      for(var i = 0; i != 7; ++i) {
        names.push(formatter.format(this.increaseDate(weekStart, i)))
      }
      return names
    },

    initWeeks (weekNumber) {
      var weeks = new Array(weekNumber)
      for(var i = 0; i != weekNumber; ++i) {
        weeks[i] = [null, null, null, null, null, null, null]
      }
      return weeks
    },

    initCalendar (duration) {
      var calendar = new Array(duration)
      for(var i = 0; i != duration; ++i) {
        calendar[i] = {
          newLists: [],
          reviewLists: []
        }
      }
      return calendar
    },

    generateLinearCalendar (lists, intervals, skippedDates) {
      // Calculate the total number of lists based on the generated list ranges
      const totalListsCount = lists.length;
      const duration = totalListsCount + Math.max(...intervals) + skippedDates.length;
      var calendar = this.initCalendar(duration);
      var offset = 0;
      for (let i = 0; i < totalListsCount; ++i) {
          if (skippedDates.includes(i + offset + 1)) {
              --i;
              ++offset;
              continue;
          } else {
              calendar[i + offset].newLists.push(lists[i]);
              for (var interval of intervals) {
                  calendar[i + interval + offset].reviewLists.push(lists[i]);
              }
          }
      }
      return calendar;
    },

    generateWeeks (linearCalendar, startDate, weekType) {
      var weekStart = this.weekStartDate(startDate, weekType)
      var offset = this.getDistance(startDate, weekStart)
      var weekNumber = Math.ceil(
        (offset + linearCalendar.length) / 7
      )
      var weeks = this.initWeeks(weekNumber)
      for(var i = 0; i != linearCalendar.length; ++i) {
        var totalOffset = offset + i
        var week = Math.floor(totalOffset / 7)
        var day = totalOffset % 7
        weeks[week][day] = {
          date: this.increaseDate(startDate, i),
          lists: linearCalendar[i]
        }
      }
      return weeks
    },

    group (startList, endList, quota, reversed) {
      var lists = [];
      const totalListsToProcess = endList - startList + 1;
      const numberOfGroups = Math.ceil(totalListsToProcess / quota);

      for (let i = 0; i < numberOfGroups; ++i) {
          let currentStart = startList + i * quota;
          let currentEnd = currentStart + quota - 1;
          if (currentEnd > endList) {
              currentEnd = endList;
          }

          if (reversed) {
              // Adjust for reversed order calculation if needed,
              // but the current logic seems to group ranges in forward order and then potentially display/process them reversed later.
              // For grouping purposes based on start/end, we stick to the numerical range.
              // If reversed implies processing from endList down to startList, the iteration logic here needs to change.
              // Assuming reversed flag primarily affects the order of processing the generated list ranges, not the range generation itself.
               if (currentStart === currentEnd) {
                  lists.push('' + currentStart);
               } else {
                   lists.push(currentStart + '~' + currentEnd);
               }

          } else {
              if (currentStart === currentEnd) {
                  lists.push('' + currentStart);
              } else {
                  lists.push(currentStart + '~' + currentEnd);
              }
          }
      }

      // If reversed flag is for the order of groups, reverse the lists array
      if (reversed) {
          lists.reverse();
      }

      return lists;
    },


    generateStyles (lists, parameters) {
      this.stylesheet = document.createElement('style')
      document.body.appendChild(this.stylesheet)
      var stylesheet = document.styleSheets[document.styleSheets.length-1]
      if(parameters.font) {
        stylesheet.insertRule(
          'html { font-family: ' + parameters.font + '; }',
          0)
      }
      if(parameters.colored) {
         // Generate colors based on the order of lists in the 'lists' array after grouping and potential reversing
        for(var i = 0; i != lists.length; ++i) {
          stylesheet.insertRule(
            // Need to handle ranges like "1~5" correctly to match CSS class
            'div.c' + lists[i].replace('~', '') +
              ' { background-color: hsl(' + ((i * 97) % 360) + ', 100%, 80%); }',
            0)
        }
      }
      if(parameters.today) {
        var today = new Date()
        stylesheet.insertRule(
          '.' + this.getDayClass({date: today})
            + '{'
            + 'background: repeating-linear-gradient('
            + '45deg,'
            + '#bbb,'
            + '#bbb 14px,'
            + 'white 14px,'
            + 'white 21px'
            + ');'
            + '}',
          0)
        stylesheet.insertRule(
          '.' + this.getDayClass({date: today}) + ' div'
            + '{'
            + 'background-color: #ffffff80;'
            + '}',
          0)
      }
    },

    update (parameters) {
      // Use startList and endList to generate the list ranges
      var lists = this.group(parameters.startList,
                             parameters.endList,
                             parameters.listPerDay,
                             parameters.reversed
                            )
      if(parameters.intervals && parameters.intervals.length > 0) {
        var calendar = this.generateLinearCalendar(lists,
                                                   parameters.intervals,
                                                   parameters.skippedDates
                                                  )
      } else {
        var calendar = this.generateLinearCalendar(lists,
                                                   defaultIntervals,
                                                   parameters.skippedDates
                                                  )
      }
      var weeks = this.generateWeeks(calendar,
                                     parameters.date,
                                     parameters.week)
      document.title = parameters.title
      this.title = parameters.title
      this.newListPrefix = parameters.prefix
      this.reviewListPrefix = parameters.prefix + '*'
      this.weekdayNames = this.initWeekdayNames(parameters.week)
      this.weeks = weeks
      if(this.stylesheet) {
        this.stylesheet.remove()
        this.stylesheet = null
      }
      this.generateStyles(lists, parameters) // Pass the generated lists for coloring
      Object.assign(this.newParameters, this.parameters)
    },
  },
}

const vueApp = Vue.createApp(app)
vueApp.component('font-radios', {
  props: {
    modelValue: String,
  },
  data () {
    return {
      fontRadio: '',
      customFont: '',
      placeholder: 'placeholder-other-font',
      fonts: [
        'serif',
        'sans-serif',
      ],
    }
  },
  watch: {
    fontRadio (val) {
      if(val !== this.placeholder) {
        this.customFont = val
      }
    },
    customFont (val) {
      this.$emit('update:modelValue', val)
    },
    modelValue (val) {
      if(this.fontRadio !== this.placeholder
         && this.fontRadio !== val) {
        if(this.fonts.includes(val)) {
          this.fontRadio = val
        } else {
          this.fontRadio = this.placeholder
        }
      }
      if(this.customFont !== val) {
        this.customFont = val
      }
    },
  },
  computed: {
  },
  template: `
  <div v-for="font in fonts" :key="font" style="display: inline-block">
    <input name="font-radio"
           :id="font + '-radio'"
           :value="font"
           type="radio"
           v-model="fontRadio">
    <label :for="font + '-radio'" :style="'font-family: ' + font">
      {{ font }}
    </label>
  </div>
  <br>
  <div>
    <input id="other-font-radio"
           name="font-radio"
           :value="placeholder"
           type="radio"
           v-model="fontRadio">
    <label for="other-font-radio" :style="'font-family: ' + customFont">其它</label>
    <input :disabled="fontRadio !== placeholder" v-model="customFont"
           :style="'font-family: ' + customFont">
  </div>
  `}) // Closing template literal
vueApp.mount('#app')