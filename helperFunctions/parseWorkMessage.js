function parseWorkMessage(content) {
    const parts = content.split('/').map(part => part.trim());

    // Match your template: Task / Client or Project / Time / KM (optional) / Registration (optional)
    const [task, client, time, km, registration] = parts;

    // Required fields: task, client, time
    if (!task || !client || !time) return null;

    return {
        // date will be added later in the DM handler
        task,
        client,
        time,
        km: km || null,
        registration: registration || null,
        service: null,
        ordering: null,
        it: null
    };
}

module.exports = { parseWorkMessage };