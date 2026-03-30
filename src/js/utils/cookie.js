export const CookieManager = {
    get: function (name) {
        let cookie = document.cookie;
        let cookieCollection = cookie.split('; ');
        let cookieCollectionArr = [];
        let result = '';

        if (cookieCollection.length) {
            for (let i = 0; i < cookieCollection.length; i++) {
                let cookieCollectionItems = cookieCollection[i].split('=');
                cookieCollectionArr[cookieCollectionItems[0]] = cookieCollectionItems[1];
            }

            result = (typeof cookieCollectionArr[name] !== 'undefined') ? cookieCollectionArr[name] : undefined;
        }

        return result;
    },

    set: function (name, value, days, path = '/', secure = false) {
        let date = new Date();
        let cookie = [];

        if (!days) days = 1;
        date.setTime(date.getTime() + (days * 86400000));

        cookie.push(name + '=' + value);
        cookie.push('expires=' + date.toGMTString());
        cookie.push('path=' + path);
        cookie.push('domain=.' + location.hostname);
        cookie.push('samesite=lax');
        if (secure) cookie.push('secure');

        document.cookie = cookie.join('; ');
    },

    remove: function (name) {
        this.set(name, '', -1);
    }
}