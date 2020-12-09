/* eslint-disable */
(function(Datetime) {
    'use strict';

    var locale = {
        months: "一月 二月 三月 四月 五月 六月 七月 八月 九月 十月 十一月 十二月".split(" "),
        monthsShort: "1月 2月 3月 4月 5月 6月 7月 8月 9月 10月 11月 12月".split(" "),
        weekdays: "星期日 星期一 星期二 星期三 星期四 星期五 星期六".split(" "),
        weekdaysShort: "周日 周一 周二 周三 周四 周五 周六".split(" "),
        weekdaysMin: "日 一 二 三 四 五 六".split(" "),
        weekStart: 1
    };

    Datetime.locale("zh", locale);
}(Datetime));
/* eslint-enable */