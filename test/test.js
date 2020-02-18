
/* eslint-disable */
import { Websocket, Server } from 'mock-socket';
import mockConsole from 'jest-mock-console';
import WebsocketHeartbeat from '../lib/index';

/**
 * 引入Taro对象的代码源于Taro源码中taro-h5的websocket-api，它基于浏览器原生的WebSocket的基础上改造为小程序写法，
  它的实现和用法和小程序api本身有细微的差别，比如onClose等事件实际是钩子函数，而不是可以多次注册的注册方法。
*/
import Taro from './taro-websocket-api/webSocket';

const mockServer = new Server('wss://localhost:8881');
mockServer.on('connection', socket => {
  socket.on('message', data => {
    if(data === 'clientMsg') socket.send('serverMsg');
    if(data === 'please close') socket.close();
    if(data === 'please server send close message') socket.send('close');
    if(data === 'heartbeat') socket.send('get heartbeat');
  });
});

console.log('The test started, wait a moment...');

test('param error: connectSocketParams.url', done => {
  expect.assertions(1)
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {}
  }).catch(err=>{
    expect(err instanceof Error).toEqual(true);
    done();
  });
});
test('param error: miniprogram', done => {
  expect.assertions(1)
  WebsocketHeartbeat({
    connectSocketParams: {}
  }).catch(err=>{
    expect(err instanceof Error).toEqual(true);
    done();
  });
});


test('function test: onOpen, onMessage, send', done => {

  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881'
    }
  }).then(task => {
    task.onOpen = () => {
      task.send({
        data: 'clientMsg'
      });
    };
    task.onMessage = ({data}) => {
      if(data === 'serverMsg') done();
      task.close();//close socket
    };
  });
});

/** 
 * 测试onClose方法是否在后端主动close断开或者因为网络等其他原因断开时被执行，
  一旦断开，将会调用onClose钩子函数，并且会立刻重连，onReconnect钩子函数也会被执行
*/
test('test: client will reconnect and excute onReconnect hook function when server excute socket.close().', done => {
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881'
    }
  }).then(task => {
    let onreconnectExecute = false;
    task.onOpen = () => {
      task.send({
        data: 'please close'
      });
    };
    task.onClose = () => {
      task.onOpen = ()=>{
        expect(onreconnectExecute).toEqual(true);
        task.close();//close socket
        done();
      };
    };
    task.onReconnect = () => {
      onreconnectExecute = true;
    };
  });
});

/**
 * 只有前端使用task.close方法，才能关闭socket，后端想要主动关闭只能通过发送消息，前端获取对应消息后主动关闭, 这样就不会重连。
*/
test('test: client will not reconnect when client close socket', done => {
  expect.assertions(2)
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881'
    }
  }).then(task => {
    let onreconnectExecute = false;
    task.onOpen = () => {
      task.send({
        data: 'please server send close message'
      });
    };
    task.onMessage = ({data}) => {
      if(data === 'close'){
        task.close();//close socket
      }
    };
    task.onClose = () => {
      expect(task.forbidReconnect).toEqual(true);
      expect(onreconnectExecute).toEqual(false);
      done();
    };
    task.onReconnect = () => {
      onreconnectExecute = true;
    };
  });
});


test('reconnect test, wait 6~20 seconds, repeatLimit:4', done => {
  //error address
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881888'
    },
    repeatLimit: 4
  }).then(task => {
    task.onReconnect = () => {
      if (task.repeat > 3) {
        setTimeout(() => {
          if (
            task.repeat > 3 &&
            task.repeat <= 4
          ) {
            done();
          }
        }, 8000);
      }
    };
  });
}, 26000);

test('reconnect test, wait 6~20 seconds, repeatLimit:default(unlimit)', done => {
  //error address
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881888'
    }
  }).then(task => {
    task.onReconnect = () => {
      if (task.repeat > 5) {
        task.close();
        setTimeout(function() {
          if (task.repeat > 5) {
            done();
          }
        }, 8000);
      }
    };
  });
}, 26000);


test('test: heart beat)', done => {
  expect.assertions(1);
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881'
    },
    pingTimeout: 2000,
  }).then(task => {
    task.onMessage = ({data}) => {
      expect(data).toEqual('get heartbeat');
      task.close();
      done();
    }
  });
}, 6000);

test('test: server don`t response when client send heartbeat', done => {
  expect.assertions(1);
  WebsocketHeartbeat({
    miniprogram: Taro,
    connectSocketParams: {
      url: 'wss://localhost:8881'
    },
    pingTimeout: 2000,
    pongTimeout: 1500,
    reconnectTimeout: 5000,
    pingMsg: 'a error heartbeat message'
  }).then(task => {
    let getResponse = false;
    task.onMessage = () => {
      getResponse = true;
    }
    task.onReconnect = () => {
      expect(getResponse).toEqual(false);
      task.close();
      done();
    }
  });
}, 10000);
