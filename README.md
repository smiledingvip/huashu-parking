# 华数和振传间车辆信息传输系统
工作原理：获取停车场终端摄像头拍摄的车牌信息后，将信息按照文档要求处理成十六进制的数据包，再与华数服务器建立tcp长连接后，将数据包发送至华数服务器，
建立长连接的的同时，需要发送心跳包。
### 主要技术： node

### 难点：buffer,net,socket
