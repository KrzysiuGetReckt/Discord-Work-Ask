function parseWorkMessage(content) {
    const parts = content.split('/').map(part => part.trim());

    const [
        date,
        task,
        client,
        time,
        km,
        registration
    ] = parts;

    if (!task || !client || !time) {
        return null;
    }

    return {
        date: date || new Date().toISOString().slice(0, 10),

        // leave unused Excel columns empty
        service: null,
        ordering: null,
        it: null,

        // requested fields
        task,
        client,
        time,

        km: km || null,
        registration: registration || null
    };
}

module.exports = {
    parseWorkMessage
};