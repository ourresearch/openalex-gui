async function sleep(ms) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

function hashCode(str) {
    return Math.abs(str.split('').reduce((prevHash, currVal) =>
        (((prevHash << 5) - prevHash) + currVal.charCodeAt(0)) | 0, 0));
}
const toHexHash = function(str){
    return "0x" + hashCode(str).toString(16)
}





export {
    sleep,
    toHexHash
}