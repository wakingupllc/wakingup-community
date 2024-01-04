import moment from 'moment';

moment.defineLocale('descriptive-durations', {
    relativeTime: {
        future: "%s",
        past:   "%s ago",
        s: function (number, withoutSuffix, key, isFuture) {
            // 's' is usually for "a few seconds", but we want to be precise, hence this function
            if (number === 1) return '1 second';
            return number + ' seconds';
        },
        ss:     "%d seconds",
        m:      "a minute",
        mm:     "%d minutes",
        h:      "an hour",
        hh:     "%d hours",
        d:      "a day",
        dd:     "%d days",
        M:      "a month",
        MM:     "%d months",
        y:      "a year",
        yy:     "%d years"
    }
});

moment.updateLocale('en', {
    relativeTime: {
        future: "%s",
        past:   "%s",
        s:      "now",
        ss:     "%ds",
        m:      "1m",
        mm:     "%dm",
        h:      "1h",
        hh:     "%dh",
        d:      "1d",
        dd:     "%dd",
        M:      "1mo",
        MM:     "%dmo",
        y:      "1y",
        yy:     "%dy"
    }
});
