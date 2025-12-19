function parseWorkMessage(content) {
    const parts = content.split('|').map(part => part.trim());

    const [
        date,
        service,
        task,
        ordering,
        client,
        it,
        time
    ] = parts;

    if (!task || !time) {
        return null;
    }

    return {
        date: date || new Date().toISOString().slice(0, 10),
        service: service || '',
        task: task,
        ordering: ordering || '',
        client: client || '',
        it: it,
        time: time
    };
}

module.exports = {
    parseWorkMessage
};