function transData (data, need_len) {
    if (data instanceof String) { // 是字符串
        return Buffer.concat([Buffer.alloc(need_len - Buffer.from(str_re).length), Buffer.from(str_re)])
    } else if (!isNaN(data)) { // 是数字
        let data_tran = data.toString(16);
        let len = data_tran.length
        return Buffer.concat([Buffer.alloc(need_len - Math.ceil(len / 2)), Buffer.alloc(Math.ceil(len / 2), len % 2 > 0 ? '0' + String(data_tran): String(data_tran), 'hex')])

    }
}

function calSize (base64url) {
    // var str = base64url.replace('data:image/png;base64,', '');
    var equalIndex = base64url.indexOf('=');
    if(base64url.indexOf('=')>0) {
        base64url=base64url.substring(0, equalIndex);
    }
    var strLength=base64url.length;
    var fileLength=parseInt(strLength-(strLength/8)*2);
    return fileLength
}

function  heartbeatPackage (socket) {
    var iBegin = Buffer.alloc(4).fill('77aa77aa','hex') // 包头
    var iPackageLen = transData((4 + 4 + Buffer.from('T1').length), 4); // 包长
    var iVersion = transData(2, 4); // 版本号
    var iCommandId = transData(101, 4); // 命令码
    var iData = Buffer.from('T1') // data内容
    var iEnd = Buffer.alloc(4).fill('77ab77ab','hex'); // 包尾
    var heartbeatPackage = Buffer.concat([iBegin, iPackageLen, iVersion, iCommandId, iData, iEnd]); // 合并
    socket.write(heartbeatPackage)
}

module.exports.heartbeatPackage = heartbeatPackage
module.exports.transData = transData
module.exports.calSize = calSize