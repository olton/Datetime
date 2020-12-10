/*
 * Datetime v1.0.0, (https://github.com/olton/Datetime.git)
 * Copyright 2020 by Serhii Pimenov
 * Datetime.js is a minimalist JavaScript library that parses, validates, manipulates, and displays dates and times for modern browsers with comfortable modern API.
 * Build at 10/12/2020 20:41:15
 * Licensed under MIT
 */


// Source: src/index.js

/* global global*/
(function(global) {
    'use strict';

    var DEFAULT_FORMAT = "YYYY-MM-DDTHH:mm:ss.sssZ";
    var INVALID_DATE = "Invalid date";
    var REGEX_FORMAT = /\[([^\]]+)]|Y{1,4}|M{1,4}|D{1,2}|d{1,4}|H{1,2}|h{1,2}|a|A|m{1,2}|s{1,3}|Z{1,2}|z{1,2}|C|W{1,2}|I{1,3}|B{2,4}|(^[T][a-zA-Z]{1,4})/g;

    global['DATETIME_LOCALES'] = {
        "en": {
            months: "January February March April May June July August September October November December".split(" "),
            monthsShort: "Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec".split(" "),
            weekdays: "Sunday Monday Tuesday Wednesday Thursday Friday Saturday".split(" "),
            weekdaysShort: "Sun Mon Tue Wed Thu Fri Sat".split(" "),
            weekdaysMin: "Su Mo Tu We Th Fr Sa".split(" "),
            weekStart: 0
        }
    }

    var M = {
        ms: "Milliseconds",
        s: "Seconds",
        m: "Minutes",
        h: "Hours",
        D: "Date",
        d: "Day",
        M: "Month",
        Y: "FullYear",
        y: "Year",
        t: "Time"
    }

    var C = {
        ms: "millisecond",
        s: "second",
        m: "minute",
        h: "hour",
        D: "day",
        W: "week",
        WI: "isoWeek",
        d: "weekDay",
        dI: "isoWeekDay",
        M: "month",
        Y: "year",
        Y2: "year2",
        t: "time",
        c: "century",
        q: "quarter"
    }

    var lpad = function(str, pad, length){
        var _str = ""+str;
        if (length && _str.length >= length) {
            return _str;
        }
        return Array((length + 1) - _str.length).join(pad) + _str;
    }

    var not = function(v){
        return typeof v === "undefined" || v === null;
    }

    /* Fabric method */
    var datetime = function(){
        var args;
        if (arguments[0] instanceof Datetime) {
            return arguments[0].clone();
        }
        if (Array.isArray(arguments[0])) {
            args = [].slice.call(arguments[0]);
        } else {
            args = [].slice.call(arguments);
        }
        return new (Function.prototype.bind.apply(Datetime,  [this].concat(args) ) );
    }

    /* Main class */
    var Datetime = function(){
        var args = [].slice.call(arguments);
        this.value = new (Function.prototype.bind.apply(Date,  [this].concat(args) ) );
        this.locale = "en";
        this.weekStart = global['DATETIME_LOCALES']["en"].weekStart;
        this.utcMode = false;
        this.mutable = true;
    }

    /* ************ Static methods **************** */
    Datetime.DEFAULT_FORMAT = DEFAULT_FORMAT;
    Datetime.REGEX_FORMAT = REGEX_FORMAT;
    Datetime.INVALID_DATE = INVALID_DATE;

    Datetime.lpad = lpad;
    Datetime.not = not;

    Datetime.isDatetime = function(val){
        return val instanceof Datetime;
    }

    Datetime.now = function(asDate){
        return asDate ? datetime().val() : datetime().time();
    }

    Datetime.locale = function(name, locale){
        global['DATETIME_LOCALES'][name] = locale;
    }

    Datetime.getNames = function(locale){
        return global['DATETIME_LOCALES'][locale || "en"];
    }

    Datetime.parse = function(str){
        return datetime(Date.parse(str));
    }

    /* Plugin support */
    Datetime.extend = function(where){
        var options, name,
            length = arguments.length;

        for (var i = 1; i < length; i++ ) {
            if ( ( options = arguments[ i ] ) != null ) {
                for ( name in options ) {
                    if (Object.prototype.hasOwnProperty.call(options, name))
                        where[ name ] = options[ name ];
                }
            }
        }

        return where;
    };

    Datetime.use = function(obj){
        Datetime.extend(Datetime.prototype, obj);
    }

    Datetime.useStatic = function(obj){
        Datetime.extend(Datetime, obj);
    }
    /* ************* End of static **************** */

    Datetime.prototype = {
        immutable: function(v){
            this.mutable = !(not(v) ? true : v);
            return this;
        },

        utc: function(){
            this.utcMode = true;
            return this;
        },

        local: function(){
            this.utcMode = false
            return this;
        },

        useLocale: function(val){
            this.locale = val;
            return this;
        },

        clone: function(){
            var c = datetime(this.value);
            c.locale = this.locale;
            c.mutable = this.mutable;
            c.weekStart = this.weekStart;
            return c;
        },

        isValid: function(){
            return !isNaN(this.time());
        },

        val: function(val){
            if ( !(val instanceof Date) )
                return this.value;

            if (this.mutable) {
                this.value = val;
                return this;
            }

            return datetime(val);
        },

        valueOf: function(){
            return this.value.getTime();
        },

        /* Get + Set */

        _set: function(m, v){
            var fn = "set" + (this.utcMode && m !== "t" ? "UTC" : "") + M[m];
            if (this.mutable) {
                this.value[fn](v);
                return this;
            }
            var clone = this.clone();
            clone.value[fn](v);
            return clone;
        },

        _get: function(m){
            return this.value["get"+(this.utcMode && m !== "t" ? "UTC" : "")+M[m]]();
        },

        _work: function(part, val){
            if (!arguments.length || (typeof val === "undefined" || val === null)) {
                return this._get(part);
            }
            return this._set(part, val);
        },

        millisecond: function(val){ return this._work("ms", val);},
        ms: function(val){ return this._work("ms", val);},
        second: function(val){return this._work("s", val);},
        minute: function(val){return this._work("m", val); },
        hour: function(val){return this._work("h", val);},
        day: function(val){return this._work("D", val);},
        month: function(val){return this._work("M", val);},
        year: function(val){return this._work("Y", val);},
        time: function(val){return this._work("t", val);},

        weekDay: function(val){
            if (!arguments.length || (not(val))) {
                return this.utcMode ? this.value.getUTCDay() : this.value.getDay();
            }

            var curr = this.weekDay();
            var diff = curr - val;

            this.day(this.day() + diff);

            return this;
        },

        get: function(unit){
            return Object.values(C).indexOf(unit) === -1 ? this.valueOf() : this[unit]();
        },

        set: function(unit, val){
            return Object.values(C).indexOf(unit) === -1 ? this : this[unit]( val || 0 );
        },

        add: function(val, to){
            switch (to) {
                case C.h: return this.time(this.time() + (val * 60 * 60 * 1000));
                case C.m: return this.time(this.time() + (val * 60 * 1000));
                case C.s: return this.time(this.time() + (val * 1000));
                case C.ms: return this.time(this.time() + (val));
                case C.D: return this.day(this.day() + val);
                case C.W: return this.day(this.day() + val * 7);
                case C.M: return this.month(this.month() + val);
                case C.Y: return this.year(this.year() + val);
                case C.q: return this.month(this.month() + val * 3);
            }
        },

        addHour: function(v){return this.add(v,C.h);},
        addMinute: function(v){return this.add(v,C.m);},
        addSecond: function(v){return this.add(v, C.s);},
        addMillisecond: function(v){return this.add(v, C.ms);},
        addMs: function(v){return this.add(v, C.ms);},
        addDay: function(v){return this.add(v,C.D);},
        addWeek: function(v){return this.add(v,C.W);},
        addMonth: function(v){return this.add(v, C.M);},
        addYear: function(v){return this.add(v, C.Y);},
        addQuarter: function(v){return this.add(v, C.q);},

        format: function(fmt, locale){
            if (!this.isValid()) return INVALID_DATE;

            var format = fmt || DEFAULT_FORMAT;
            var names = Datetime.getNames(locale || this.locale);
            var year = this.year(), year2 = this.year2(), month = this.month(), day = this.day(), weekDay = this.weekDay(), weekNumber = this.weekNumber();
            var hour = this.hour(), hour12 = this.hour12(), minute = this.minute(), second = this.second(), ms = this.millisecond();
            var matches = {
                YY: year2,
                YYYY: year,
                M: month + 1,
                MM: lpad(month + 1, "0", 2),
                MMM: names.monthsShort[month],
                MMMM: names.months[month],
                D: day,
                DD: lpad(day, "0", 2),
                d: weekDay,
                dd: names.weekdaysMin[weekDay],
                ddd: names.weekdaysShort[weekDay],
                dddd: names.weekdays[weekDay],
                W: weekNumber,
                WW: lpad(weekNumber, "0", 2),
                H: hour,
                HH: lpad(hour, "0", 2),
                h: hour12,
                hh: lpad(hour12, "0", 2),
                a: this.ampm(true),
                A: this.ampm(false),
                m: minute,
                mm: lpad(minute,"0", 2),
                s: second,
                ss: lpad(second,"0", 2),
                sss: lpad(ms,"0", 3),
                Z: this.utcMode ? "Z" : this.timezone(),
                C: this.century(),
                I: this.isoWeekDay(),
                II: this.isoWeekNumber()
            };

            return format.replace(REGEX_FORMAT, function(match){
                return matches[match] || match;
            });
        },

        toTimeString: function(){
            return this.value.toTimeString();
        },

        toLocaleDateString: function(){
            return this.value.toLocaleDateString();
        },

        toLocaleString: function(){
            return this.value.toLocaleString();
        },

        toLocaleTimeString: function(){
            return this.value.toLocaleTimeString();
        },

        toString: function(){
            return this.value.toString();
        },

        toJSON: function(){
            return this.value.toJSON();
        },

        toSource: function(){
            return this.value.toSource();
        },

        toISOString: function(){
            return this.value.toISOString();
        },

        toUTCString: function(){
            return this.value.toUTCString();
        },

        toDate: function(){
            return new Date(this.valueOf());
        }
    }

    global.Datetime = Datetime;
    global.datetime = datetime;

}(typeof self === "undefined" ? typeof global === "undefined" ? window : global : self));


// Source: src/i18n/af.js

/* global Datetime */
Datetime.locale("af", {
    months: "Januarie_Februarie_Maart_April_Mei_Junie_Julie_Augustus_September_Oktober_November_Desember".split("_"),
    monthsShort: "Jan_Feb_Mrt_Apr_Mei_Jun_Jul_Aug_Sep_Okt_Nov_Des".split("_"),
    weekdays: "Sondag_Maandag_Dinsdag_Woensdag_Donderdag_Vrydag_Saterdag".split("_"),
    weekdaysShort: "Son_Maa_Din_Woe_Don_Vry_Sat".split("_"),
    weekdaysMin: "So_Ma_Di_Wo_Do_Vr_Sa".split("_"),
    weekStart: 1
});


// Source: src/i18n/am.js

/* global Datetime */
Datetime.locale("am", {
    months: "ጃንዋሪ_ፌብሯሪ_ማርች_ኤፕሪል_ሜይ_ጁን_ጁላይ_ኦገስት_ሴፕቴምበር_ኦክቶበር_ኖቬምበር_ዲሴምበር".split("_"),
    monthsShort: "ጃንዋ_ፌብሯ_ማርች_ኤፕሪ_ሜይ_ጁን_ጁላይ_ኦገስ_ሴፕቴ_ኦክቶ_ኖቬም_ዲሴም".split("_"),
    weekdays: "እሑድ_ሰኞ_ማክሰኞ_ረቡዕ_ሐሙስ_አርብ_ቅዳሜ".split("_"),
    weekdaysShort: "እሑድ_ሰኞ_ማክሰ_ረቡዕ_ሐሙስ_አርብ_ቅዳሜ".split("_"),
    weekdaysMin: "እሑ_ሰኞ_ማክ_ረቡ_ሐሙ_አር_ቅዳ".split("_"),
    weekStart: 1
});


// Source: src/i18n/ar.js

/* global Datetime */
Datetime.locale("ar", {
    months: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
    monthsShort: "يناير_فبراير_مارس_أبريل_مايو_يونيو_يوليو_أغسطس_سبتمبر_أكتوبر_نوفمبر_ديسمبر".split("_"),
    weekdays: "الأحد_الإثنين_الثلاثاء_الأربعاء_الخميس_الجمعة_السبت".split("_"),
    weekdaysShort: "أحد_إثنين_ثلاثاء_أربعاء_خميس_جمعة_سبت".split("_"),
    weekdaysMin: "ح_ن_ث_ر_خ_ج_س".split("_"),
    weekStart: 1
});


// Source: src/i18n/az.js

/* global Datetime */
Datetime.locale("am", {
    months: "Yanvar_Fevral_Mart_Aprel_May_Iyun_Iyul_Avqust_Sentyabr_Oktyabr_Noyabr_Dekabr".split("_"),
    monthsShort: "Yan_Fev_Mar_Apr_May_Iyn_Iyl_Avq_Sen_Okt_Noy_Dek".split("_"),
    weekdays: "Bazar_Bazar ertəsi_Çərşənbə axşamı_Çərşənbə_Cümə axşamı_Cümə_Şənbə".split("_"),
    weekdaysShort: "Baz_BzE_ÇAx_Çər_CAx_Cüm_Şən".split("_"),
    weekdaysMin: "Bz_BE_ÇA_Çə_CA_Cü_Şə".split("_"),
    weekStart: 1
});


// Source: src/i18n/ba.js

/* global Datetime */
Datetime.locale("ba", {
    months: "Zanwuyekalo_Fewuruyekalo_Marisikalo_Awirilikalo_Mɛkalo_Zuwɛnkalo_Zuluyekalo_Utikalo_Sɛtanburukalo_ɔkutɔburukalo_Nowanburukalo_Desanburukalo".split("_"),
    monthsShort: "Zan_Few_Mar_Awi_Mɛ_Zuw_Zul_Uti_Sɛt_ɔku_Now_Des".split("_"),
    weekdays: "Kari_Ntɛnɛn_Tarata_Araba_Alamisa_Juma_Sibiri".split("_"),
    weekdaysShort: "Kar_Ntɛ_Tar_Ara_Ala_Jum_Sib".split("_"),
    weekdaysMin: "Ka_Nt_Ta_Ar_Al_Ju_Si".split("_"),
    weekStart: 1
});


// Source: src/i18n/be.js

/* global Datetime */
Datetime.locale("be", {
    months: "Студзеня_Лютага_Сакавіка_Красавіка_Траўня_Чэрвеня_Ліпеня_Жніўня_Верасня_Кастрычніка_Лістапада_Снежня".split("_"),
    monthsShort: "Студ_Лют_Сак_Крас_Трав_Чэрв_Ліп_Жнів_Вер_Каст_Ліст_Снеж".split("_"),
    weekdays: "Нядзелю_Панядзелак_Аўторак_Сераду_Чацвер_Пятніцу_Суботу".split("_"),
    weekdaysShort: "Няд_Пан_Аўт_Сер_Чац_Пят_Суб".split("_"),
    weekdaysMin: "Нд_Пн_Ат_Ср_Чц_Пт_Сб".split("_"),
    weekStart: 1
});


// Source: src/i18n/bg.js

/* global Datetime */
Datetime.locale("bg", {
    months: "Януари_Февруари_Март_Април_Май_Юни_Юли_Август_Септември_Октомври_Ноември_Декември".split("_"),
    monthsShort: "Янр_Фев_Мар_Апр_Май_Юни_Юли_Авг_Сеп_Окт_Ное_Дек".split("_"),
    weekdays: "Неделя_Понеделник_Вторник_Сряда_Четвъртък_Петък_Събота".split("_"),
    weekdaysShort: "Нед_Пон_Вто_Сря_Чет_Пет_Съб".split("_"),
    weekdaysMin: "Нд_Пн_Вт_Ср_Чт_Пт_Сб".split("_"),
    weekStart: 1
});


// Source: src/i18n/bi.js

/* global Datetime */
Datetime.locale("bi", {
    months: "Januari_Februari_Maj_Eprel_Mei_Jun_Julae_Okis_Septemba_Oktoba_Novemba_Disemba".split("_"),
    monthsShort: "Jan_Feb_Maj_Epr_Mai_Jun_Jul_Oki_Sep_Okt_Nov_Dis".split("_"),
    weekdays: "Sande_Mande_Tusde_Wenesde_Tosde_Fraede_Sarade".split("_"),
    weekdaysShort: "San_Man_Tus_Wen_Tos_Frae_Sar".split("_"),
    weekdaysMin: "Sn_Ma_Tu_We_To_Fr_Sr".split("_"),
    weekStart: 1
});


// Source: src/i18n/bn.js

/* global Datetime */
Datetime.locale("bn", {
    months: "জানুয়ারী_ফেব্রুয়ারি_মার্চ_এপ্রিল_মে_জুন_জুলাই_আগস্ট_সেপ্টেম্বর_অক্টোবর_নভেম্বর_ডিসেম্বর".split("_"),
    monthsShort: "জানু_ফেব_মার্চ_এপ্র_মে_জুন_জুল_আগ_সেপ্ট_অক্টো_নভে_ডিসে".split("_"),
    weekdays: "রবিবার_সোমবার_মঙ্গলবার_বুধবার_বৃহস্পতিবার_শুক্রবার_শনিবার".split("_"),
    weekdaysShort: "রবি_সোম_মঙ্গল_বুধ_বৃহস্পতি_শুক্র_শনি".split("_"),
    weekdaysMin: "রবি_সোম_মঙ্গ_বুধ_বৃহঃ_শুক্র_শনি".split("_"),
    weekStart: 1
});


// Source: src/i18n/bo.js

/* global Datetime */
Datetime.locale("bo", {
    months: "ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),
    monthsShort: "ཟླ་བ་དང་པོ_ཟླ་བ་གཉིས་པ_ཟླ་བ་གསུམ་པ_ཟླ་བ་བཞི་པ_ཟླ་བ་ལྔ་པ_ཟླ་བ་དྲུག་པ_ཟླ་བ་བདུན་པ_ཟླ་བ་བརྒྱད་པ_ཟླ་བ་དགུ་པ_ཟླ་བ་བཅུ་པ_ཟླ་བ་བཅུ་གཅིག་པ_ཟླ་བ་བཅུ་གཉིས་པ".split("_"),
    weekdays: "གཟའ་ཉི་མ་_གཟའ་ཟླ་བ་_གཟའ་མིག་དམར་_གཟའ་ལྷག་པ་_གཟའ་ཕུར་བུ_གཟའ་པ་སངས་_གཟའ་སྤེན་པ་".split("_"),
    weekdaysShort: "ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),
    weekdaysMin: "ཉི་མ་_ཟླ་བ་_མིག་དམར་_ལྷག་པ་_ཕུར་བུ_པ་སངས་_སྤེན་པ་".split("_"),
    weekStart: 1
});


// Source: src/i18n/br.js

/* global Datetime */
Datetime.locale("br", {
    months: "Genver_Cʼhwevrer_Meurzh_Ebrel_Mae_Mezheven_Gouere_Eost_Gwengolo_Here_Du_Kerzu".split("_"),
    monthsShort: "Gen_Cʼhwe_Meu_Ebr_Mae_Eve_Gou_Eos_Gwe_Her_Du_Ker".split("_"),
    weekdays: "Sul_Lun_Meurzh_Mercʼher_Yaou_Gwener_Sadorn".split("_"),
    weekdaysShort: "Sul_Lun_Meu_Mer_Yao_Gwe_Sad".split("_"),
    weekdaysMin: "Su_Lu_Me_Mer_Ya_Gw_Sa".split("_"),
    weekStart: 1
});


// Source: src/i18n/de.js

/* global Datetime */
Datetime.locale("de", {
    months: "Januar_Februar_März_April_Mai_Juni_Juli_August_September_Oktober_November_Dezember".split("_"),
    monthsShort: "Jan_Feb_Mär_Apr_Mai_Jun_Jul_Aug_Sep_Okt_Nov_Dez".split("_"),
    weekdays: "Sonntag_Montag_Dienstag_Mittwoch_Donnerstag_Freitag_Samstag".split("_"),
    weekdaysShort: "Son_Mon_Die_Mit_Don_Fre_Sam".split("_"),
    weekdaysMin: "So_Mo_Di_Mi_Do_Fr_Sa".split("_"),
    weekStart: 1
});


// Source: src/i18n/ru.js

/* global Datetime */
Datetime.locale("ru", {
    months: "Январь_Февраль_Март_Апрель_Май_Июнь_Июль_Август_Сентябрь_Октябрь_Ноябрь_Декабрь".split("_"),
    monthsParental: "Января_Февраля_Марта_Апреля_Мая_Июня_Июля_Августа_Сентября_Октября_Ноября_Декабря".split("_"),
    monthsShort: "Янв_Фев_Мар_Апр_Май_Июн_Июл_Авг_Сен_Окт_Ноя_Дек".split("_"),
    weekdays: "Воскресенье_Понедельник_Вторник_Среда_Четверг_Пятница_Суббота".split("_"),
    weekdaysShort: "Вск_Пон_Втр_Срд_Чет_Пят_Суб".split("_"),
    weekdaysMin: "Вс_Пн_Вт_Ср_Чт_Пт_Сб".split("_"),
    weekStart: 1
});


// Source: src/i18n/ua.js

/* global Datetime */
Datetime.locale("ua", {
    months: "Січень_Лютий_Березень_Квітень_Травень_Червень_Липень_Серпень_Вересень_Жовтень_Листопад_Грудень".split("_"),
    monthsParental: "Січня_Лютого_Березеня_Квітня_Травня_Червня_Липня_Серпня_Вересня_Жовтня_Листопада_Грудня".split("_"),
    monthsShort: "Січ_Лют_Бер_Кві_Тра_Чер_Лип_Сер_Вер_Жов_Лис_Гру".split("_"),
    weekdays: "Неділя_Понеділок_Вівторок_Середа_Четвер_П'ятниця_Субота".split("_"),
    weekdaysShort: "Нед_Пон_Вів_Сер_Чет_Птн_Суб".split("_"),
    weekdaysMin: "Нд_Пн_Вт_Ср_Чт_Пт_Сб".split("_"),
    weekStart: 1
});


// Source: src/i18n/zh.js

/* global Datetime */
Datetime.locale("zh", {
    months: "一月_二月_三月_四月_五月_六月_七月_八月_九月_十月_十一月_十二月".split("_"),
    monthsShort: "1月_2月_3月_4月_5月_6月_7月_8月_9月_10月_11月_12月".split("_"),
    weekdays: "星期日_星期一_星期二_星期三_星期四_星期五_星期六".split("_"),
    weekdaysShort: "周日_周一_周二_周三_周四_周五_周六".split("_"),
    weekdaysMin: "日_一_二_三_四_五_六".split("_"),
    weekStart: 1
});


// Source: src/plugins/align.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        align: function(d, align, asDate){
            var date = datetime(d), result, temp;
            switch (align) {
                case "second":  result = date["millisecond"](0); break; //second
                case "minute":  result = date["millisecond"](0)["second"](0); break; //minute
                case "hour":  result = date["millisecond"](0)["second"](0)["minute"](0); break; //hour
                case "day":  result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0); break; //day
                case "month":  result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0)["day"](1); break; //month
                case "year":  result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0)["day"](1)["month"](0); break; //year
                case "quarter":  result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0)["day"](1)["month"](date.quarter() * 3 - 3); break; //quarter
                case "week":  {
                    temp = date.weekDay();
                    result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0).addDay(-temp);
                    break; // week
                }
                case "isoWeek": {
                    temp = date.weekDay();
                    result = date["millisecond"](0)["second"](0)["minute"](0)["hour"](0).addDay(-temp + 1);
                    break; // isoWeek
                }
                default:   result = date;
            }
            return asDate ? result.val() : result;
        }
    })

    Datetime.use({
        align: function(align){
            if (this.mutable) {
                this.value = Datetime.align(this.value, align, true);
                return this;
            }

            return this.clone().align(align);
        }
    })
}());


// Source: src/plugins/buddhist.js

/* global Datetime */
(function() {
    'use strict';

    var oldFormat = Datetime.prototype.format;

    Datetime.use({
        buddhist: function(){
            return this.year() + 543;
        },

        format: function(format, locale){
            format = format || Datetime.DEFAULT_FORMAT;
            var matches = {
                BB: (this.buddhist()+"").slice(-2),
                BBBB: this.buddhist()
            }
            var result = format.replace(/(\[[^\]]+])|B{4}|B{2}/g, function(match){
                return matches[match] || match;
            })
            return oldFormat.bind(this)(result, locale)
        }
    });
}());


// Source: src/plugins/calendar.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.use({
        calendar: function(iso){
            return Datetime.calendar(this, iso);
        }
    });

    Datetime.useStatic({
        calendar: function(d, iso){
            var ws = iso ? 1 : 0;
            var date = d instanceof Datetime ? d.clone().align("month") : datetime(d);
            var wd = ws ? date.isoWeekDay() : date.weekDay();
            var names = Datetime.getNames(date.locale);

            var getWeekDays = function (wd, ws){
                if (ws === 0) {
                    return wd;
                }
                var su = wd[0];
                return wd.slice(1).concat([su]);
            }

            var result = {
                month: names.months[date.month()],
                days: [],
                weekstart: iso ? 1 : 0,
                weekdays: getWeekDays(names.weekdaysMin,ws),
                today: datetime().format("YYYY-MM-DD"),
                weekends: []
            };

            date.addDay(ws ? -wd+1 : -wd);

            for(var i = 0; i < 42; i++) {
                result.days.push(date.format("YYYY-MM-DD"));
                date.add(1, 'day');
            }

            result.weekends = result.days.filter(function(v, i){
                var def = [0,6,7,13,14,20,21,27,28,34,35,41];
                var iso = [5,6,12,13,19,20,26,27,33,34,40,41];

                return ws === 0 ? def.indexOf(i) > -1 : iso.indexOf(i) > -1;
            });

            return result;
        }
    });
}());


// Source: src/plugins/century.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        century: function(){
            return parseInt(this.year() / 100);
        }
    })
}());


// Source: src/plugins/compare.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.use({
        same: function(d){
            return this.time() === datetime(d).time();
        },

        /*
        * align: year, month, day, hour, minute, second, millisecond = default
        * */
        compare: function(d, align, operator){
            var date = datetime(d);
            var curr = this.clone();
            var t1, t2;

            operator = operator || "<";

            if (["<", ">", ">=", "<=", "=", "!="].indexOf(operator) === -1) {
                throw new Error("Operator must be one of <, >, >=, <=, =, !=");
            }

            if (!curr.isValid()) {
                throw new Error("Object has not contains a valid date");
            }

            if (!date.isValid()) {
                throw new Error("Argument is not a valid date");
            }

            align = (align || "millisecond").toLowerCase();

            t1 = curr.align(align).time();
            t2 = date.align(align).time();

            switch (operator) {
                case "<":
                    return t1 < t2;
                case ">":
                    return t1 > t2;
                case "<=":
                    return t1 <= t2;
                case ">=":
                    return t1 >= t2;
                case "=":
                    return t1 === t2;
                case "!=":
                    return t1 !== t2;
            }
        },

        between: function(d1, d2){
            return this.younger(d1) && this.older(d2);
        },

        older: function(date, align){
            return this.compare(date, align, "<");
        },

        olderOrEqual: function(date, align){
            return this.compare(date, align, "<=");
        },

        younger: function(date, align){
            return this.compare(date, align, ">");
        },

        youngerOrEqual: function(date, align){
            return this.compare(date, align, ">=");
        },

        equal: function(date, align){
            return this.compare(date, align, "=");
        },

        notEqual: function(date, align){
            return this.compare(date, align, "!=");
        },

        diff: function(d){
            var date = datetime(d);
            var diff = Math.abs(this.time() - date.time());
            var diffMonth = Math.abs(this.month() - date.month() + (12 * (this.year() - date.year())));

            return {
                "millisecond": diff,
                "second": Math.ceil(diff / 1000),
                "minute": Math.ceil(diff / (1000 * 60)),
                "hour": Math.ceil(diff / (1000 * 60 * 60)),
                "day": Math.ceil(diff / (1000 * 60 * 60 * 24)),
                "month": diffMonth,
                "year": Math.floor(diffMonth / 12)
            }
        },

        distance: function(d, align){
            return this.diff(d)[align];
        }
    })
}());


// Source: src/plugins/dayofyear.js

/* global Datetime */
/*
* Plugin required isleapyear.js
* */
(function() {
    'use strict';

    Datetime.use({
        dayOfYear: function(){
            var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            var month = this.month();
            var day = this.day();
            return dayCount[month] + day + ((month > 1 && this.isLeapYear()) ? 1 : 0);
        }
    })
}());


// Source: src/plugins/daysin.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        daysInMonth: function(){
            var curr = this.clone();
            return curr.add(1, 'month').day(1).add(-1, 'day').day();
        },

        daysInYear: function(){
            return this.isLeapYear() ? 366 : 365;
        },

        daysInYearMap: function(){
            var result = [];
            var curr = this.clone();

            curr.month(0).day(1);

            for(var i = 0; i < 12; i++) {
                curr.add(1, 'month').add(-1, 'day');
                result.push(curr.day());
                curr.day(1).add(1, 'month');
            }
            return result;
        },

        daysInYearObj: function(locale, shortName){
            var map = this.daysInYearMap();
            var result = {};
            var names = Datetime.getNames(locale || this.locale);

            map.forEach(function(v, i){
                result[names[shortName ? 'monthsShort' : 'months'][i]] = v;
            });

            return result;
        }
    })
}());


// Source: src/plugins/hour12.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        ampm: function(isLowerCase){
            var val = this.hour() < 12 ? "AM" : "PM";
            return isLowerCase ? val.toLowerCase() : val;
        },

        hour12: function(h, /* string am|pm */ p){
            var hour = h;

            if (arguments.length === 0) {
                return this.hour() % 12 || 12;
            }

            p = p || 'am';

            if (p.toLowerCase() === "pm") {
                hour += 12;
            }

            return this.hour(hour);
        }
    })
}());


// Source: src/plugins/isleapyear.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        isLeapYear: function(){
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        }
    })
}());


// Source: src/plugins/iso.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        isoWeekDay: function(val){
            if (!arguments.length || (Datetime.not(val))) {
                return (this.weekDay() + 6) % 7 + 1;
            }

            return this.weekDay((val + 6) % 7 + 1);
        },

        isoWeekNumber: function(){
            return this.weekNumber(1);
        }
    })
}());


// Source: src/plugins/parser.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        parseFromString: function(str, format, locale){
            var norm, normFormat, fItems, dItems;
            var iMonth, iDay, iYear, iHour, iMinute, iSecond;
            var year, month, day, hour, minute, second;
            var parsedMonth;

            var getIndex = function(where, what){
                return where.map(function(el){
                    return el.toLowerCase();
                }).indexOf(what.toLowerCase());
            }

            var monthNameToNumber = function(month){
                var i = -1;
                var names = Datetime.getNames(locale || 'en');

                if (Datetime.not(month)) return -1;

                i = getIndex(names.months, month);

                if (i === -1 && typeof names["monthsParental"] !== "undefined") {
                    i = getIndex(names.monthsParental, month);
                }

                if (i === -1) {
                    month = month.substr(0, 3);
                    i = getIndex(names.monthsShort, month);
                }

                return i === -1 ? -1 : i + 1;
            };

            var getPartIndex = function(part){
                var parts = {
                    "month": ["M", "mm", "%m"],
                    "day": ["D", "dd", "%d"],
                    "year": ["YY", "YYYY", "yy", "yyyy", "%y"],
                    "hour": ["h", "hh", "%h"],
                    "minute": ["m", "mi", "i", "ii", "%i"],
                    "second": ["s", "ss", "%s"]
                }

                var result = -1, key, index;

                if (!parts[part]) {
                    return result;
                }

                for(var i = 0; i < parts[part].length; i++) {
                    key = parts[part][i];
                    index = fItems.indexOf(key);
                    if (index !== -1) {
                        result = index;
                        break;
                    }
                }

                return result;
            }

            if (Datetime.not(format) || (""+format).trim() === "") {
                return datetime();
            }

            /* eslint-disable-next-line */
            norm = str.replace(/[\/,.:\s]/g, '-');
            /* eslint-disable-next-line */
            normFormat = format.toLowerCase().replace(/[^a-zA-Z0-9%]/g, '-');
            fItems = normFormat.split('-');
            dItems = norm.split('-');

            if (norm.replace(/-/g,"").trim() === "") {
                return Datetime.INVALID_DATE;
            }

            iMonth = getPartIndex("month");
            iDay = getPartIndex("day");
            iYear = getPartIndex("year");
            iHour = getPartIndex("hour");
            iMinute = getPartIndex("minute");
            iSecond = getPartIndex("second");

            if (iMonth > -1 && dItems[iMonth] !== "") {
                if (isNaN(parseInt(dItems[iMonth]))) {
                    dItems[iMonth] = monthNameToNumber(dItems[iMonth]);
                    if (dItems[iMonth] === -1) {
                        return Datetime.INVALID_DATE;
                    }
                } else {
                    parsedMonth = parseInt(dItems[iMonth]);
                    if (parsedMonth < 1 || parsedMonth > 12) {
                        return Datetime.INVALID_DATE;
                    }
                }
            } else {
                return Datetime.INVALID_DATE;
            }

            year  = iYear > -1 && dItems[iYear] ? dItems[iYear] : null;
            month = iMonth > -1 && dItems[iMonth] ? dItems[iMonth] : null;
            day   = iDay > -1 && dItems[iDay] ? dItems[iDay] : null;

            hour    = iHour > -1 && dItems[iHour] ? dItems[iHour] : null;
            minute  = iMinute > -1 && dItems[iMinute] ? dItems[iMinute] : null;
            second  = iSecond > -1 && dItems[iSecond] ? dItems[iSecond] : null;

            return datetime(year, month-1, day, hour, minute, second);
        }
    })

}());


// Source: src/plugins/quarter.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        quarter: function(){
            var month = this.month();

            if (month <= 2) return 1;
            if (month <= 5) return 2;
            if (month <= 8) return 3;
            return 4;
        }
    })
}());


// Source: src/plugins/strftime.js

/* global Datetime */
(function() {
    'use strict';

    var REGEX_FORMAT_STRFTIME = /(%[a-z])/gi;
    var DEFAULT_FORMAT_STRFTIME = "%Y-%m-%dT%H:%M:%S.%Q%t";

    var lpad = Datetime.lpad;

    Datetime.use({
        strftime: function(fmt, locale){
            if (!this.isValid()) return Datetime.INVALID_DATE;

            var format = fmt || DEFAULT_FORMAT_STRFTIME;
            var names = Datetime.getNames(locale || this.locale);
            var year = this.year(), year2 = this.year2(), month = this.month(), day = this.day(), weekDay = this.weekDay();
            var hour = this.hour(), hour12 = this.hour12(), minute = this.minute(), second = this.second(), millisecond = this.millisecond(), time = this.time();
            var aDay = lpad(day, "0", 2),
                aMonth = lpad(month + 1, "0", 2),
                aHour = lpad(hour, "0", 2),
                aHour12 = lpad(hour12, "0", 2),
                aMinute = lpad(minute, "0", 2),
                aSecond = lpad(second, "0", 2),
                aMillisecond = lpad(millisecond, "0", 3);

            var that = this;

            var thursday = function(){
                var target = that.clone();
                target.day(that.day() - ((that.weekDay() + 6) % 7) + 3);
                return target;
            };

            var matches = {
                '%a': names.weekdaysShort[weekDay],
                '%A': names.weekdays[weekDay],
                '%b': names.monthsShort[month],
                '%h': names.monthsShort[month],
                '%B': names.months[month],
                '%c': this.toString().substring(0, this.toString().indexOf(" (")),
                '%C': this.century(),
                '%d': aDay,
                '%D': [aDay, aMonth, year].join("/"),
                '%e': day,
                '%F': [year, aMonth, aDay].join("-"),
                '%G': thursday().year(),
                '%g': (""+thursday().year()).slice(2),
                '%H': aHour,
                '%I': aHour12,
                '%j': lpad(this.dayOfYear(), "0", 3),
                '%k': aHour,
                '%l': aHour12,
                '%m': aMonth,
                '%n': month + 1,
                '%M': aMinute,
                '%p': this.ampm(),
                '%P': this.ampm(true),
                '%s': Math.round(time / 1000),
                '%S': aSecond,
                '%u': this.isoWeekDay(),
                '%V': this.isoWeek(),
                '%w': weekDay,
                '%x': this.toLocaleDateString(),
                '%X': this.toLocaleTimeString(),
                '%y': year2,
                '%Y': year,
                '%z': this.timezone().replace(":", ""),
                '%Z': this.timezoneName(),
                '%r': [aHour12, aMinute, aSecond].join(":") + " " + this.ampm(),
                '%R': [aHour, aMinute].join(":"),
                "%T": [aHour, aMinute, aSecond].join(":"),
                "%Q": aMillisecond,
                "%q": millisecond,
                "%t": this.timezone()
            };

            return format.replace(REGEX_FORMAT_STRFTIME, function(match){
                return matches[match] || match;
            });
        }
    });
}());


// Source: src/plugins/timezone.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        utcOffset: function(){
            return this.value.getTimezoneOffset();
        },

        timezone: function(){
            return this.toTimeString().replace(/.+GMT([+-])(\d{2})(\d{2}).+/, '$1$2:$3');
        },

        timezoneName: function(){
            return this.toTimeString().replace(/.+\((.+?)\)$/, '$1');
        }
    })
}());


// Source: src/plugins/today.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        isToday: function(date){
            var d = (date instanceof  Datetime ? date.clone() : datetime(date)).align("day");
            var c = datetime().align('day');

            return d.time() === c.time();
        }
    })

    Datetime.use({
        isToday: function(){
            return Datetime.isToday(this);
        }
    })
}());


// Source: src/plugins/tomorrow.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        isTomorrow: function(date){
            var d = (date instanceof  Datetime ? date.clone() : datetime(date)).align("day");
            var c = datetime().align('day').add(1, 'day');

            return d.time() === c.time();
        }
    });

    Datetime.use({
        isTomorrow: function(){
            return Datetime.isTomorrow(this);
        }
    });
}());


// Source: src/plugins/unix.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        timestamp: function(){
            return datetime().unix();
        }
    })

    Datetime.use({
        unix: function(val) {
            var _val;

            if (!arguments.length || (Datetime.not(val))) {
                return Math.floor(this.valueOf() / 1000)
            }

            _val = val * 1000;

            if (this.mutable) {
                return this.time(_val);
            }

            return datetime(this.value).time(_val);
        },

        timestamp: function(){
            return this.unix();
        }
    });
}());


// Source: src/plugins/weekNumber.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.use({
        weekNumber: function (weekStart) {
            var nYear, nday, newYear, day, daynum, weeknum;

            weekStart = +weekStart || 0;
            newYear = datetime(this.year(), 0, 1);
            day = newYear.weekDay() - weekStart;
            day = (day >= 0 ? day : day + 7);
            daynum = Math.floor(
                (this.time() - newYear.time() - (this.utcOffset() - newYear.utcOffset()) * 60000) / 86400000
            ) + 1;

            if(day < 4) {
                weeknum = Math.floor((daynum + day - 1) / 7) + 1;
                if(weeknum > 52) {
                    nYear = datetime(this.year() + 1, 0, 1);
                    nday = nYear.weekDay() - weekStart;
                    nday = nday >= 0 ? nday : nday + 7;
                    weeknum = nday < 4 ? 1 : 53;
                }
            }
            else {
                weeknum = Math.floor((daynum + day - 1) / 7);
            }
            return weeknum;
        }
    })
}());


// Source: src/plugins/weeksinyear.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        weeksInYear: function(weekStart){
            var curr = this.clone();
            return curr.month(11).day(31).weekNumber(weekStart);
        }
    })
}());


// Source: src/plugins/year2.js

/* global Datetime */
(function() {
    'use strict';

    Datetime.use({
        year2: function(){
            return (""+this.year()).substr(-2);
        }
    })
}());


// Source: src/plugins/yesterday.js

/* global Datetime, datetime */
(function() {
    'use strict';

    Datetime.useStatic({
        isYesterday: function(date){
            var d = (date instanceof  Datetime ? date.clone() : datetime(date)).align("day");
            var c = datetime().align('day').add(-1, 'day');

            return d.time() === c.time();
        }
    });

    Datetime.use({
        isYesterday: function(){
            return Datetime.isYesterday(this);
        }
    })
}());
