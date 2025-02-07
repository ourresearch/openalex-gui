import axios from 'axios';

const getType = (id, config) => {
    return Object.values(config).find(entity => {
        const reStr = entity.idRegex.replace("(?i)", "")
        const regex = new RegExp(reStr, "i")
        return regex.test(id)
    })?.id
}
const getId = (id, config) => {
    const myType = getType(id, config)
    if (!myType) {
        return null
    }
    const reStr = config[myType].idRegex.replace("(?i)", "")
    const regex = new RegExp(reStr, "i")
    const matches = regex.exec(id)
    return matches ? matches[1] : null
}

const fullId = (id, entityType) => {
    // 123, topics => "topics/T123"
    if (typeof id !== "string") {
        return `${entityType}/${entityType[0].toUpperCase()}${id}`;
    }
    return id;
}

const entity = {
    getType,
    getId,
    fullId,
    async getEntityData(id) {
        const shortId = fullId(id).replace("https://openalex.org/", "")
        // TODO probably remove bypass_cache=true when live. For now allows us to make quick changes to config and UI changes be immediately available
        const myUrl = `https://api.openalex.org/${shortId}?format=ui&bypass_cache=true`
        const resp = await axios.get(myUrl)
        return resp.data.props
    }
}

export {
    entity
}