[![Build Status](https://travis-ci.org/zimv/websocket-heartbeat-miniprogram.svg?branch=master)](https://travis-ci.org/zimv/websocket-heartbeat-miniprogram)
[![Coverage Status](https://coveralls.io/repos/github/zimv/websocket-heartbeat-miniprogram/badge.svg?branch=master)](https://coveralls.io/github/zimv/websocket-heartbeat-miniprogram?branch=master)
<a href="https://www.npmjs.com/package/websocket-heartbeat-miniprogram" alt="NPM latest version"><img src="https://img.shields.io/npm/v/websocket-heartbeat-miniprogram.svg"></a>
<a href="https://npms.io/search?q=websocket-heartbeat-miniprogram" alt="NPM latest version"><img src="https://badges.npms.io/websocket-heartbeat-miniprogram.svg"></a>
[![DeepScan grade](https://deepscan.io/api/teams/2383/projects/9640/branches/127798/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=2383&pid=9640&bid=127798)
<a href="https://www.npmjs.com/package/websocket-heartbeat-miniprogram" alt="NPM total downloads"><img src="https://img.shields.io/npm/dt/websocket-heartbeat-miniprogram.svg"></a>
<a href="https://github.com/zimv/websocket-heartbeat-miniprogram" alt="Github stars"><img src="https://img.shields.io/github/stars/zimv/websocket-heartbeat-miniprogram.svg?style=social&label=Star"></a>
<a href="https://github.com/zimv/websocket-heartbeat-miniprogram" alt="Github forks"><img src="https://img.shields.io/github/forks/zimv/websocket-heartbeat-miniprogram.svg?style=social&label=Fork"></a>
<a href="https://github.com/zimv/websocket-heartbeat-miniprogram" alt="Github contributors"><img src="https://img.shields.io/github/contributors/zimv/websocket-heartbeat-miniprogram.svg"></a>
# websocket-heartbeat-miniprogram
WebSocket heart beat for miniprogram

## 介绍
websocket-heartbeat-miniprogram基于小程序的websocket相关API进行封装，主要目的是保障客户端websocket与服务端连接状态。该程序有心跳检测及自动重连机制，当网络断开或者后端服务问题造成客户端websocket断开，程序会自动尝试重新连接直到再次连接成功。兼容市面上大部分小程序微信，百度，支付宝，uni等，只要都是统一的小程序weboscket-API规范。也支持小程序框架比如Taro等。无论如何，业务是需要一层心跳机制的，否则一些情况下会丢失连接导致功能无法使用。

----------

## 用法
### 安装
    npm install --save websocket-heartbeat-miniprogram

### 引入使用

    import WebsocketHeartbeat from 'websocket-heartbeat-miniprogram';
    WebsocketHeartbeat({
        miniprogram: wx,
        connectSocketParams: {
            url: 'ws://xxx'
        }
    })
        .then(task => {
            task.onOpen = () => {//钩子函数
                console.log('open');
            };
            task.onClose = () => {//钩子函数
                console.log('close');
            };
            task.onError = e => {//钩子函数
                console.log('onError：', e);
            };
            task.onMessage = data => {//钩子函数
                console.log('onMessage', data);
            };
            task.onReconnect = () => {//钩子函数
                console.log('reconnect...');
            };
            task.socketTask.onOpen(data => {//原生实例注册函数，重连后丢失
                console.log('socketTask open');
            });
            task.socketTask.onMessage(data => {//原生实例注册函数，重连后丢失
                console.log('socketTask data');
            });
        })

本程序内部总是使用小程序connectSocket方法进行socket连接，如果socket断开，本程序内部会再次执行小程序的connectSocket方法，以此来重新建立连接，重连都会建立新的小程序socket实例。

WebsocketHeartbeat方法返回一个promise，返回的task对象是本程序的一个实例,提供了onOpen,onClose,onError,onMessage,onReconnect等钩子函数。也暴露了小程序本身的实例（socketTask），task.socketTask就是小程序connectSocket返回的实例，而task.socketTask是小程序的原生实例，它们通过onXXX方法传递函数进行监听注册，在socket重连以后，内部重新通过connectSocket新建实例，将会返回新的小程序原生实例，因此之前通过socketTask.onXXX注册的这些函数将会丢失。而本程序内部提供的钩子函数重连上以后依然有效。大部分情况下推荐就使用本程序的钩子函数。


## 支付宝小程序差异
支付宝小程序只允许同时存在一个socket连接，原生的API也和其他小程序有一点小差异，本程序已经做了兼容，但是还是要注意支付宝只允许建立一个socket，如果建立多个socket，前面的socket都会被系统关闭，一定要通过本程序实例的task.close关闭旧的socket，否则程序会一直重连，导致所有socket相互冲突无法使用。

## 约定

***1.只能通过前端主动关闭socket连接***

如果需要断开socket，应该执行task.close()方法。如果后端想要关闭socket，应该下发一个消息，前端判断此消息，前端再调用task.close()方法关闭。因为无论是后端调用close还是因为其他原因造成的socket关闭，前端的socket都会触发onClose事件，程序无法判断是什么原因导致的关闭。因此本程序会默认尝试重连。
 
 

    import WebsocketHeartbeat from 'websocket-heartbeat-miniprogram';
    WebsocketHeartbeat({
        miniprogram: wx,
        connectSocketParams: {
            url: 'ws://xxxx'
        }
    })
        .then(task => {
            task.onMessage = data => {
                if(data.data == 'close') task.close();//关闭socket并且，不再重连
            };
        })
 
***2.后端对前端心跳的反馈***

 前端发送心跳消息，后端收到后，需要立刻返回响应消息，后端响应的消息可以是任何值，因为本程序并不处理和判断响应的心跳消息，而只是在收到任何消息后，重置心跳，因为收到任何消息就说明连接是正常的。因此本程序收到任何后端返回的消息都会重置心跳倒计时，以此来减少不必要的请求，减少服务器压力。

 


----------



## API
### *创建实例*

##### 参数：` Object object`
##### 返回：` task <promise>`

    import WebsocketHeartbeat from 'websocket-heartbeat-miniprogram';
    WebsocketHeartbeat(Object object)

| 属性 | 必填 | 类型 | 默认值 | 描述 |
| ------ | ------ | ------ | ------ | ------ |
| miniprogram | true | object | none | 小程序api对象，wx,my,Taro等 |
| connectSocketParams | true | object | none | 小程序api,connectSocket方法的参数，本程序都是通过connectSocket方法建立websocket实例  |
| pingTimeout | false | number | 15000 | 每隔15秒发送一次心跳，如果收到任何后端消息定时器将会重置 |
| pongTimeout | false | number | 10000 | ping消息发送之后，10秒内没收到后端消息便会认为连接断开 |
| reconnectTimeout | false | number | 2000 | 尝试重连的间隔时间 |
| pingMsg | false | string | "heartbeat" | ping消息值 |
| repeatLimit | false | number | null | 重连尝试次数。默认不限制 |


### *task* 
#### task.socketTask `<小程序SocketTask实例>`
可以使用原生小程序API注册事件等

    task.socketTask.onOpen(data => {//原生实例注册函数，重连后丢失
        console.log('socketTask open');
    });


#### task.opts `<Object>`
    

| 属性 | 类型 | 默认值 | 描述 |
| ------ | ------ | ------ | ------ |
| miniprogram | object | none | 小程序api对象，wx,my,Taro等 |
| connectSocketParams | object | none | 小程序api,connectSocket方法的参数，本程序都是通过connectSocket方法建立websocket实例  |
| pingTimeout | number | 15000 | 每隔15秒发送一次心跳，如果收到任何后端消息定时器将会重置 |
| pongTimeout | number | 10000 | ping消息发送之后，10秒内没收到后端消息便会认为连接断开 |
| reconnectTimeout | number | 2000 | 尝试重连的间隔时间 |
| pingMsg | string | "heartbeat" | ping消息值 |
| repeatLimit | number | null | 重连尝试次数。默认不限制 |


### task.send(Object object) `<Function>`
发送消息,等同小程序send用法

    task.send({
        data: 'msg',
        success(){},
        ...
    })

### taks.close(Object object) `<Function>`
前端手动断开socket连接，此方法不会触发重连。
参数等同于小程序taskSocket.close方法

    task.close({
        success(){}
    })

### 钩子函数 *(推荐优先使用)*
#### task.onClose `<Function>`

    task.onClose = () => {
        console.log('connect close');
    }

#### task.onError `<Function>`

    task.onError = () => {
        console.log('socket onError');
    }

#### task.onOpen `<Function>`

    task.onOpen = () => {
        console.log('open success');
    }

#### task.onMessage `<Function>`

    task.onMessage = (data) => {
        console.log('msg:', data.data);
    }

#### task.onReconnect `<Function>`

    task.onReconnect = (e) => {
        console.log('reconnecting...');
    }


## 博客 
[小程序websocket心跳库——websocket-heartbeat-miniprogram][1]

## 相关代码库
[websocket-heartbeat-js][2]


  [1]: https://www.cnblogs.com/1wen/p/12302973.html
  [2]: https://github.com/zimv/websocket-heartbeat-js