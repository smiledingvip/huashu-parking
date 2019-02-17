var express = require('express');
var router = express.Router();
var net = require('net');
var fs = require('fs');
var Parser = require("fast-xml-parser").j2xParser;
var he = require('he');
var transData = require('../public/javascripts/common').transData
var sendHeartbeatPackage = require('../public/javascripts/common').heartbeatPackage

/* 创建TCP客户端 */
var client = net.Socket();

var heartbeatInterval = ''
/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

/* 设置连接的服务器 */
client.connect(1220, '192.168.1.115', function () {
    console.log("connect the server");

    heartbeatInterval = setInterval(()=> { // 发送心跳包
        sendHeartbeatPackage(client)
    }, 30000)
    router.post('/*', function(req, res, next) {

        console.log(req.body)
        if (req.body && req.body.data) {

            let data_set = req.body
            data_set.data = JSON.parse(data_set.data)

            var pic_data = ''
            var pic_data1 = ''
            var pic_num = 0
            if (data_set.data.picturepath && fs.existsSync(data_set.data.picturepath.replace(/\\\\\\\\/g, '\\\\'))) { // 读取全景图片
                pic_data = Buffer.from(fs.readFileSync(data_set.data.picturepath.replace(/\\\\\\\\/g, '\\\\')))
                pic_num++

            } else {
                console.log('没有全景图片');
            }
            if (data_set.data.picturepath1 && fs.existsSync(data_set.data.picturepath1.replace(/\\\\\\\\/g, '\\\\'))) { // 读取车牌特写图片
                pic_data1 = Buffer.from(fs.readFileSync(data_set.data.picturepath1.replace(/\\\\\\\\/g, '\\\\')))
                pic_num++
            } else {
                console.log('没有车牌特写图片');
            }

            let packageXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
            <Vehicle>
            <RecordID>${data_set.recordid}</RecordID>
            <CamID>01</CamID>
            <TollgateID>T1</TollgateID>
            <PassTime>20190129200730000</PassTime>
            <LaneID>${data_set.data.channel}</LaneID>
            <Direction>${data_set.data.direction}</Direction>
            <CarPlate>${data_set.data.VLP}</CarPlate>
            <PlateColor>2</PlateColor>
            <PlateNumber>1</PlateNumber>
            <PicNumber>1</PicNumber>
            <Image>
            <ImageIndex>1</ImageIndex>
            <ImageURL>http://n.sinaimg.cn/news/1_img/vcg/c4b46437/107/w683h1024/20190130/ul1x-hshmsti0908688.jpg</ImageURL>
            <ImageType>1</ImageType>
            </Image>
            <DealTag>0</DealTag>
            <IdentifyStatus>0</IdentifyStatus>
            </Vehicle>`

            let bBegin = Buffer.alloc(4).fill('77aa77aa','hex') // 包头

            console.log('bBegin', bBegin)

            let bPackageLen = ''

            if (pic_data && pic_data1) {
                bPackageLen = transData((4 + 4 + 4 + 4 + Buffer.from(packageXml).length + 4 + pic_data.length + pic_data1.length), 4); // 包长
            } else if (!pic_data && pic_data1) {
                bPackageLen = transData((4 + 4 + 4 + 4 + Buffer.from(packageXml).length + 4 + pic_data1.length), 4); // 包长
            } else if (pic_data && !pic_data1) {
                bPackageLen = transData((4 + 4 + 4 + 4 + Buffer.from(packageXml).length + 4 + pic_data.length), 4); // 包长
            } else {
                bPackageLen = transData((4 + 4 + 4 + 4 + Buffer.from(packageXml).length + 4), 4); // 包长
            }

            console.log('bPackageLen', bPackageLen, __dirname)

            let bVersion = transData(2, 4); // 版本号
            console.log('bVersion', bVersion)

            let bCommandId = transData(118, 4); // 命令码
            console.log('bCommandId', bCommandId)

            let bData = Buffer.concat([transData(Buffer.from(packageXml).length, 4), Buffer.from(packageXml), transData(pic_num, 4)]) // data内容
            if (pic_data && pic_data1) {
                bData = Buffer.concat([bData, transData(pic_data.length, 4), pic_data, transData(pic_data1.length, 4), pic_data1])
            } else if (!pic_data && pic_data1) {
                bData = Buffer.concat([bData, transData(pic_data1.length, 4), pic_data1])
            } else if (pic_data && !pic_data1) {
                bData = Buffer.concat([bData, transData(pic_data.length, 4), pic_data])
            } else {
                // 没有图片就什么都不做
            }
            console.log('bData', bData)

            let bEnd = Buffer.alloc(4).fill('77ab77ab','hex'); // 包尾
            console.log('bEnd', bEnd)

            let iMsgPackage = Buffer.concat([bBegin, bPackageLen, bVersion, bCommandId, bData, bEnd]); // 合并

            console.log('iMsgPackage', iMsgPackage.length)
            client.write(iMsgPackage);

        } else {

            console.log('没有数据')

            throw "can not get data";

        }
    })
})

/* 监听服务器传来的data数据 */
client.on("data", function (data) {
    console.log("the data of server is " + data.toString());
})

/* 监听end事件 */
client.on("end", function () {
    console.log("data end");
    clearInterval(heartbeatInterval); // 清理定时器
    heartbeatInterval = ''
})

module.exports = router;
