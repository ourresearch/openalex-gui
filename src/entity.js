import {api} from "@/api";

const getType = (id, config) => {
    return Object.values(config).find(entity => {
        const reStr = entity.idRegex.replace("(?i)", "");
        const regex = new RegExp(reStr, "i");
        return regex.test(id);
    })?.id;
};

const getId = (id, config) => {
    const myType = getType(id, config);
    if (!myType) {
        return null;
    }
    const reStr = config[myType].idRegex.replace("(?i)", "");
    const regex = new RegExp(reStr, "i");
    const matches = regex.exec(id);
    return matches ? matches[1] : null;
};

const fullId = (id, entityType) => {
    // 123, topics => "topics/T123"
    if (typeof id !== "string") {
        return `${entityType}/${entityType[0].toUpperCase()}${id}`;
    }
    return id;
};

const getEntityData = async (id) => {
    id = fullId(id);
    console.log("getEntityData", id);
    const resp = await api.get(`/${id}`, {format: "ui"});
    return resp.props;
};

const entity = {
    getType,
    getId,
    fullId,
    getEntityData
};

export {
    entity
}