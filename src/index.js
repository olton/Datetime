/* eslint-disable */
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
            weekdaysTwo: "Su Mo Tu We Th Fr Sa".split(" "),
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

    Datetime.unix = function(timestamp){
        return datetime(timestamp * 1000);
    }

    Datetime.locale = function(name, locale){
        global['DATETIME_LOCALES'][name] = locale;
    }

    Datetime.getNames = function(locale){
        return global['DATETIME_LOCALES'][locale || "en"];
    }

    Datetime.align = function(d, align, asDate){
        var date = datetime(d), result, temp;
        switch (align) {
            case C.s:  result = date[C.ms](0); break; //second
            case C.m:  result = date[C.ms](0)[C.s](0); break; //minute
            case C.h:  result = date[C.ms](0)[C.s](0)[C.m](0); break; //hour
            case C.D:  result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0); break; //day
            case C.M:  result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0)[C.D](1); break; //month
            case C.Y:  result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0)[C.D](1)[C.M](0); break; //year
            case C.q:  result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0)[C.D](1)[C.M](date.quarter() * 3 - 3); break; //quarter
            case C.W:  {
                temp = date.weekDay();
                result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0).addDay(-temp);
                break; // week
            }
            case C.WI: {
                temp = date.weekDay();
                result = date[C.ms](0)[C.s](0)[C.m](0)[C.h](0).addDay(-temp + 1);
                break; // isoWeek
            }
            default:   result = date;
        }
        return asDate ? result.val() : result;
    }

    Datetime.parse = function(str){
        return datetime(Date.parse(str));
    }

    Datetime.fromString = function(str, format, locale){
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

            if (not(month)) return -1;

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

        if (not(format) || (""+format).trim() === "") {
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

    /* Plugin support */
    Datetime.extend = function(where, obj){
        var options, name,
            length = arguments.length;

        var target = where;

        for (var i = 0; i < length; i++ ) {
            if ( ( options = arguments[ i ] ) != null ) {
                for ( name in options ) {
                    if (options.hasOwnProperty(name))
                        target[ name ] = options[ name ];
                }
            }
        }

        return target;
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
            return datetime(this.value);
        },

        same: function(d){
            return this.time() === datetime(d).time();
        },

        isValid: function(){
            return !isNaN(this.time());
        },

        year2: function(){
            return (""+this.year()).substr(-2);
        },

        isLeapYear: function(){
            var year = this.year();
            return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
        },

        isYesterday: function(d){
            var curr = this.clone().align('day').addDay(-1);
            var date = datetime(d).align('day');

            return curr.time() === date.time();
        },

        unix: function(val) {
            var _val = val * 1000;
            if (!arguments.length || (not(val))) {
                return Math.floor(this.valueOf() / 1000)
            }
            if (this.mutable) {
                return this.time(_val);
            }
            return datetime(this.value).time(_val);
        },

        isTomorrow: function(d){
            var curr = this.clone().align('day').addDay(1);
            var date = datetime(d).align('day');

            return curr.time() === date.time();
        },

        isToday: function(d){
            var curr = this.clone().align('day');
            var date = datetime(d).align('day');

            return curr.time() === date.time();
        },

        century: function(){
            return parseInt(this.year() / 100);
        },

        dayOfYear: function(){
            var dayCount = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
            var month = this.month();
            var day = this.day();
            return dayCount[month] + day + ((month > 1 && this.isLeapYear()) ? 1 : 0);
        },

        ampm: function(isLowerCase){
            var val = this.hour() < 12 ? "AM" : "PM";
            return isLowerCase ? val.toLowerCase() : val;
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
        },

        isoWeekDay: function(val){
            if (!arguments.length || (not(val))) {
                return (this.weekDay() + 6) % 7 + 1;
            }

            return this.weekDay((val + 6) % 7 + 1);
        },

        isoWeek: function(){
            return this.week(1);
        },

        weeksInYear: function(weekStart){
            var curr = this.clone();
            return curr.month(11).day(31).week(weekStart);
        },

        get: function(unit){
            switch (unit) {
                case C.D: return this.day();
                case C.d: return this.weekDay();
                case C.dI: return this.isoWeekDay();
                case C.W: return this.week();
                case C.WI: return this.isoWeek();
                case C.M: return this.month();
                case C.Y: return this.year();
                case C.Y2: return this.year2();
                case C.h: return this.hour();
                case C.m: return this.minute();
                case C.s: return this.second();
                case C.ms: return this.millisecond();
                case C.t: return this.time();
                case C.c: return this.century();
                default: return this.valueOf();
            }
        },

        set: function(unit, val){
            val = val || 0;
            switch (unit) {
                case C.D: return this.day(val);
                case C.M: return this.month(val);
                case C.Y: return this.year(val);
                case C.h: return this.hour(val);
                case C.m: return this.minute(val);
                case C.s: return this.second(val);
                case C.ms: return this.millisecond(val);
                case C.t: return this.time(val);
            }
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
        addDay: function(v){return this.add(v,C.D);},
        addWeek: function(v){return this.add(v,C.W);},
        addMonth: function(v){return this.add(v, C.M);},
        addYear: function(v){return this.add(v, C.Y);},

        between: function(d1, d2){
            return this.younger(d1) && this.older(d2);
        },

        align: function(align){
            if (this.mutable) {
                this.value = Datetime.align(this.value, align, true);
                return this;
            }

            return this.clone().align(align);
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

            align = (align || C.ms).toLowerCase();

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
        },

        daysInMonth: function(){
            var curr = this.clone();
            return curr.add(1, 'month').day(1).add(-1, 'day').day();
        },

        daysInYear: function(){
            return this.daysInYearMap().reduce(function(a, b){
                return a + b;
            }, 0)
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
        },

        quarter: function(){
            var month = this.month();

            if (month <= 2) return 1;
            if (month <= 5) return 2;
            if (month <= 8) return 3;
            return 4;
        },

        utcOffset: function(){
            return this.value.getTimezoneOffset();
        },

        timezone: function(){
            return this.toTimeString().replace(/.+GMT([+-])(\d{2})(\d{2}).+/, '$1$2:$3');
        },

        timezoneName: function(){
            return this.toTimeString().replace(/.+\((.+?)\)$/, '$1');
        },

        week: function (weekStart) {
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
        },


        format: function(fmt, locale){
            if (!this.isValid()) return INVALID_DATE;

            var format = fmt || DEFAULT_FORMAT;
            var names = Datetime.getNames(locale || this.locale);
            var year = this.year(), year2 = this.year2(), month = this.month(), day = this.day(), weekDay = this.weekDay(), week = this.week();
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
                dd: names.weekdaysTwo[weekDay],
                ddd: names.weekdaysShort[weekDay],
                dddd: names.weekdays[weekDay],
                W: week,
                WW: lpad(week, "0", 2),
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
                II: this.isoWeek()
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
/* eslint-enable */
