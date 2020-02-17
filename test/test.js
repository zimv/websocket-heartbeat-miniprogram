/* 测试用例使用Taro的 https://nervjs.github.io/taro/docs/ui-lib.html#%E9%A1%B9%E7%9B%AE%E6%B5%8B%E8%AF%95 */
/* eslint-disable */
import { Websocket, Server } from 'mock-socket';
import mockConsole from 'jest-mock-console';
import Taro from './taro-websocket-api/webSocket';
import WebsocketHeartbeat from '../lib/index';

const mockServer = new Server('wss://localhost:8881');
mockServer.on('connection', socket => {
  socket.on('message', data => {
    if(data === 'clientMsg') socket.send('serverMsg');
    if(data === 'please close') socket.close();
    if(data === 'please server send close message') socket.send('close');
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

/*
  测试onClose方法是否在后端主动close断开或者因为网络等其他原因断开时被执行，
  一旦断开，将会调用onClose钩子函数，并且会立刻重连，onReconnect钩子函数也会被执行
*/
test('test: onClose, reconnect, onReconnect', done => {
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
        if(onreconnectExecute) done();
        task.close();//close socket
      };
    };
    task.onReconnect = () => {
      onreconnectExecute = true;
    };
  });
});

/*
  只有前端使用task.close方法，才能关闭socket，后端想要主动关闭只能通过发送消息，前端获取对应消息后主动关闭。
*/
test('test: onClose, reconnect, onReconnect', done => {
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

      //这里发现taro api的一个bug，即使前端执行socketTast.close，实例的onClose也应该执行，浏览器的WebSocket如此，在微信里运行，发现也是如此
      //但是这里也有可能是jest WebSocket的问题
      if(data === 'close'){
        task.close({
          success(){
            console.log('close success')
          }
        });//close socket
        done();
      }
    };
    task.onClose = () => {
      console.log('onclose')
    };
    task.onReconnect = () => {
      onreconnectExecute = true;
    };
  });
});

// it('onclose && reconnect', function() {
//   this.timeout(4000);
//   var oncloseExecute = false;
//   wsHeartbeat.onclose = function() {
//       oncloseExecute = true;
//   };
//   var onreconnectExecute = false;
//   wsHeartbeat.onreconnect = function() {
//       onreconnectExecute = true;
//   };
//   wsHeartbeat.ws.onclose();
//   chai.expect(onreconnectExecute).to.equal(true);
//   chai.expect(oncloseExecute).to.equal(true);
// });

// it('manually close && forbid reconnect', function() {
//   this.timeout(4000);
//   var oncloseExecute = false;
//   wsHeartbeat.onclose = function() {
//       oncloseExecute = true;
//   };
//   wsHeartbeat.close();
//   chai.expect(oncloseExecute).to.equal(false);
//   chai.expect(wsHeartbeat.forbidReconnect).to.equal(true);
//   wsHeartbeat.onclose = function() {};
// });

// describe('reconnect test, wait 6~20 seconds, repeatLimit:4', function() {
//   it('limit reconnect', function(done) {
//       this.timeout(26000);
//       var wsHeartbeat2 = new WebsocketHeartbeat({
//           //error address
//           url: 'ws://123.207.167.163:9010',
//           repeatLimit: 4
//       });
//       wsHeartbeat2.onreconnect = function() {
//           if (wsHeartbeat2.repeat > 3) {
//               setTimeout(function() {
//                   if (
//                       wsHeartbeat2.repeat > 3 &&
//                       wsHeartbeat2.repeat <= 4
//                   ) {
//                       done();
//                   }
//               }, 8000);
//           }
//       };
//   });
// });
// describe('reconnect test, wait 6~20 seconds, repeatLimit:default', function() {
//   it('durative reconnect', function(done) {
//       this.timeout(26000);
//       var wsHeartbeat2 = new WebsocketHeartbeat({
//           //error address
//           url: 'ws://123.207.167.163:9010'
//       });
//       wsHeartbeat2.onreconnect = function() {
//           if (wsHeartbeat2.repeat > 5) {
//               wsHeartbeat2.close();
//               setTimeout(function() {
//                   if (wsHeartbeat2.repeat > 5) {
//                       done();
//                   }
//               }, 8000);
//           }
//       };
//   });
// });
// describe('websocket', () => {
//   test('options should be object', () => {
//     mockConsole()

//     expect.assertions(2)
//     return Taro.connectSocket()
//       .catch(err => {
//         const expectErrMsg = 'connectSocket:fail parameter error: parameter should be Object instead of Undefined'
//         expect(console.error).toHaveBeenNthCalledWith(1, expectErrMsg)
//         expect(err.errMsg).toMatch(expectErrMsg)
//       })
//   })

//   test('options.url should be string', () => {
//     mockConsole()
//     const success = jest.fn()
//     const fail = jest.fn()
//     const complete = jest.fn()

//     expect.assertions(7)
//     return Taro.connectSocket({
//       url: 1,
//       success,
//       fail,
//       complete
//     })
//       .catch(err => {
//         const expectErrMsg = 'connectSocket:fail parameter error: parameter.url should be String instead of Number'
//         expect(success.mock.calls.length).toBe(0)
//         expect(fail.mock.calls.length).toBe(1)
//         expect(fail.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//         expect(complete.mock.calls.length).toBe(1)
//         expect(complete.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//         expect(console.error).toHaveBeenCalledWith(expectErrMsg)
//         expect(err.errMsg).toMatch(expectErrMsg)
//       })
//   })

//   test('options.url should be starts with ws:// or wss://', () => {
//     mockConsole()
//     const url = 'http://localhost:8881'
//     const success = jest.fn()
//     const fail = jest.fn()
//     const complete = jest.fn()

//     expect.assertions(7)
//     return Taro.connectSocket({
//       url,
//       success,
//       fail,
//       complete
//     })
//       .catch(err => {
//         const expectErrMsg = `request:fail invalid url "${url}"`
//         expect(success.mock.calls.length).toBe(0)
//         expect(fail.mock.calls.length).toBe(1)
//         expect(fail.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//         expect(complete.mock.calls.length).toBe(1)
//         expect(complete.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//         expect(console.error).toHaveBeenCalledWith(expectErrMsg)
//         expect(err.errMsg).toMatch(expectErrMsg)
//       })
//   })

//   test('should not keep more than 2 connection', () => {
//     mockConsole()
//     const success = jest.fn()
//     const fail = jest.fn()
//     const complete = jest.fn()

//     expect.assertions(9)
//     return Promise.all([
//       Taro.connectSocket({ url: 'wss://localhost:8881', success })
//         .then(task => {
//           expect(success.mock.calls[0][0]).toEqual({ socketTaskId: 1, errMsg: 'connectSocket:ok'})
//           task.close()
//         }),
//       Taro.connectSocket({ url: 'wss://localhost:8090', success })
//         .then(task => {
//           task.close()
//           expect(success.mock.calls[1][0]).toEqual({ socketTaskId: 2, errMsg: 'connectSocket:ok'})
//         }),
//       Taro.connectSocket({
//         url: 'wss://localhost:9090',
//         success,
//         fail,
//         complete
//       })
//         .catch(err => {
//           const expectErrMsg = `同时最多发起 2 个 socket 请求，更多请参考文档。`
//           expect(success.mock.calls.length).toBe(2)
//           expect(fail.mock.calls.length).toBe(1)
//           expect(fail.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//           expect(complete.mock.calls.length).toBe(1)
//           expect(complete.mock.calls[0][0]).toEqual({ errMsg: expectErrMsg })
//           expect(console.error).toHaveBeenCalledWith(expectErrMsg)
//           expect(err.errMsg).toMatch(expectErrMsg)
//         })
//     ])
//   })

//   test('should work basically', done => {
//     const mockServer = new Server('wss://localhost:8881')
//     const connected = jest.fn()
//     const success = jest.fn()
//     const complete = jest.fn()
//     const msg = 'hello'
//     const msg2 = 'hello too'

//     mockServer.on('connection', connected)
//     mockServer.on('message', message => {
//       expect(message).toMatch(msg)
//       mockServer.send(msg2)
//     })

//     expect.assertions(11)
//     Taro.connectSocket({
//       url: 'wss://localhost:8881',
//       success,
//       complete
//     })
//       .then(task => {
//         const closeCode = 100
//         const closeReason = 'yeah'
//         jest.spyOn(task.ws, 'send')
//         jest.spyOn(task.ws, 'close')

//         task.onOpen(() => {
//           task.send({ data: msg })
//             .then(res => {
//               expect(task.ws.send).toHaveBeenCalled()
//               expect(res.errMsg).toMatch('sendSocketMessage:ok')
//             })
//         })
//         task.onMessage(res => {
//           expect(res.data).toMatch(msg2)
//           task.close({
//             code: closeCode,
//             reason: closeReason
//           })
//             .then(res => {
//               expect(task.ws.close).toHaveBeenCalled()
//               expect(res.errMsg).toMatch('closeSocket:ok')
//             })
//         })
//         task.onClose(({ code, reason }) => {
//           const expectMsg = 'connectSocket:ok'
//           expect(connected.mock.calls.length).toBe(1)
//           expect(success.mock.calls[0][0].errMsg).toMatch(expectMsg)
//           expect(complete.mock.calls[0][0].errMsg).toMatch(expectMsg)
//           expect(code).toBe(closeCode)
//           expect(reason).toBe(closeReason)
//           done()
//         })
//       })
//   })

//   test('that passing protocols into the constructor works', () => {
//     expect.assertions(2)
//     console.log('66666666')
//     return Promise.all([
//       Taro.connectSocket({ url: 'ws://not-real', protocols: ['foo'] })
//         .then(task => {
//           console.log('aaaaaaaaaa')
//           expect(task.ws.protocol).toMatch('foo')
//           task.close()
//         }),
//       Taro.connectSocket({ url: 'ws://not-real-too', protocols: 'bar' })
//         .then(task => {
//           console.log('bbbbbbbbbb')
//           expect(task.ws.protocol).toMatch('')
//           task.close()
//         })
//     ])
//   })

//   test('that on(open, message, error, and close) can be set', () => {
//     expect.assertions(4)
//     return Taro.connectSocket({
//       url: 'wss://localhost:8881'
//     })
//       .then(task => {
//         task.onOpen(() => {})
//         task.onMessage(res => {})
//         task.onClose(() => {})
//         task.onError(() => {})
//         const { listeners } = task.ws
//         expect(listeners.open.length).toBe(1)
//         expect(listeners.message.length).toBe(1)
//         expect(listeners.close.length).toBe(1)
//         expect(listeners.error.length).toBe(1)
//         task.close()
//       })
//   })

//   test('that sending when the socket is closed throws an expection', () => {
//     mockConsole()
//     const success = jest.fn()
//     const fail = jest.fn()
//     const complete = jest.fn()

//     expect.assertions(4)
//     return Taro.connectSocket({
//       url: 'wss://localhost:8881'
//     })
//       .then(task => {
//         task.send({
//           data: 'test',
//           success,
//           fail,
//           complete
//         })
//           .catch(res => {
//             expect(console.error).toHaveBeenLastCalledWith(res.errMsg)
//             expect(success.mock.calls.length).toBe(0)
//             expect(fail.mock.calls[0][0]).toEqual(res)
//             expect(complete.mock.calls[0][0]).toEqual(res)
//             task.close()
//           })
//       })
//   })
//})
