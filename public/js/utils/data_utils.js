function isOfType(type, obj) {
    if (obj === undefined || obj === null)
        return false;

    return type === Object.prototype.toString.call(obj).slice(8, -1);
}
