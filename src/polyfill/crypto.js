(() => {
    var crypto = require('crypto')

    function getRandomValues(array) {
        return crypto.webcrypto.getRandomValues(array)
    }

    if (typeof globalThis.crypto !== 'object') {
        globalThis.crypto = crypto
    }

    if (typeof globalThis.crypto.getRandomValues !== 'function') {
        globalThis.crypto.getRandomValues = getRandomValues
    }
})()