class WebsocketHeartbeat {
  constructor(
    {
      miniprogram, //Taro,支付宝my,百度swan，微信wx，等等只要有相应方法，比如connectSocket等
      connectSocketParams, //小程序connectSocket的参数
      pingTimeout = 15000,
      pongTimeout = 10000,
      reconnectTimeout = 2000,
      pingMsg = 'heartbeat',
      repeatLimit = null,
    },
    { resolve, reject }
  ) {
    if (!miniprogram) {
      const err = Error(
        '请传入小程序全局实例：Taro:Taro,支付宝:my,百度:swan，微信:wx等'
      );
      reject(err);
      throw err;
    }

    if (!connectSocketParams || !connectSocketParams.url) {
      const err = Error('小程序connectSocket参数不全');
      reject(err);
      throw err;
    }
    this.opts = {
      connectSocketParams,
      miniprogram,
      pingTimeout,
      pongTimeout,
      reconnectTimeout,
      pingMsg,
      repeatLimit,
    };
    this.socketTask = null; //websocket实例
    this.repeat = 0;
    //override
    this.onClose = () => {};
    this.onError = () => {};
    this.onOpen = () => {};
    this.onMessage = () => {};
    this.onReconnect = () => {};

    this.createWebSocket(resolve);
  }
  createWebSocket(resolve) {
    //支付宝connectSocket不会返回实例，并且只允许一个websocket请求，api和其他小程序不一样这里需要兼容
    //offSocketClose只有支付宝才有
    if (this.opts.miniprogram.offSocketClose) {
      //每次创建实例前，先清空之前的绑定事件
      this.opts.miniprogram.offSocketClose();
      this.opts.miniprogram.offSocketMessage();
      this.opts.miniprogram.offSocketOpen();
      this.opts.miniprogram.offSocketError();
      //兼容,重写
      this.socketTask = {
        onClose: this.opts.miniprogram.onSocketClose,
        onMessage: this.opts.miniprogram.onSocketMessage,
        onOpen: this.opts.miniprogram.onSocketOpen,
        onError: this.opts.miniprogram.onSocketError,
        send: this.opts.miniprogram.sendSocketMessage,
        close: this.opts.miniprogram.closeSocket,
      };
      this.opts.miniprogram.connectSocket(
        Object.assign(
          {
            complete: () => {},
          },
          this.opts.connectSocketParams
        )
      );
      this.registerHeartBeatEvent();
      resolve && resolve(this);
    } else {
      //wx,Taro,uni,百度等。Taro返回的promise，所以这里使用promise，兼容promise和直接返回对象
      //本来使用的async await语法，但是在百度小程序内会有兼容问题，引入语法兼容会导致库包增大，得不偿失，因此不使用语法糖
      new Promise((res) => {
        res(
          this.opts.miniprogram.connectSocket(
            Object.assign(
              {
                complete: () => {}, //为兼容uni-app：如果希望返回一个 socketTask 对象，需要至少传入 success / fail / complete 参数中的一个
              },
              this.opts.connectSocketParams
            )
          )
        );
      }).then((socketTask) => {
        this.socketTask = socketTask;
        this.registerHeartBeatEvent();
        resolve && resolve(this);
      });
    }
  }
  //注册心跳和钩子函数
  registerHeartBeatEvent() {
    this.socketTask.onClose((e) => {
      this.onClose(e);
      this.reconnect();
    });
    this.socketTask.onError((e) => {
      this.onError(e);
      this.reconnect();
    });
    this.socketTask.onOpen((e) => {
      this.repeat = 0;
      this.onOpen(e);
      //心跳检测重置
      this.heartCheck();
    });
    this.socketTask.onMessage((event) => {
      this.onMessage(event);
      //如果获取到消息，心跳检测重置
      //拿到任何消息都说明当前连接是正常的
      this.heartCheck();
    });
  }
  reconnect() {
    if (this.opts.repeatLimit > 0 && this.opts.repeatLimit <= this.repeat)
      return; //limit repeat the number
    if (this.lockReconnect || this.forbidReconnect) return;
    this.lockReconnect = true;
    this.repeat++; //必须在lockReconnect之后，避免进行无效计数
    this.onReconnect();
    //没连接上会一直重连，设置延迟避免请求过多
    setTimeout(() => {
      this.createWebSocket();
      this.lockReconnect = false;
    }, this.opts.reconnectTimeout);
  }
  send(msg) {
    this.socketTask.send(msg);
  }
  heartCheck() {
    this.heartReset();
    this.heartStart();
  }
  heartStart() {
    if (this.forbidReconnect) return; //不再重连就不再执行心跳
    this.pingTimeoutId = setTimeout(() => {
      //这里发送一个心跳，后端收到后，返回一个心跳消息，
      //onMessage拿到返回的心跳就说明连接正常
      this.send({
        data: this.opts.pingMsg,
      });
      //如果超过一定时间还没重置，说明后端主动断开了
      this.pongTimeoutId = setTimeout(() => {
        //如果onClose会执行reconnect，我们执行ws.close()就行了.如果直接执行reconnect 会触发onClose导致重连两次
        this.socketTask.close();
      }, this.opts.pongTimeout);
    }, this.opts.pingTimeout);
  }
  heartReset() {
    clearTimeout(this.pingTimeoutId);
    clearTimeout(this.pongTimeoutId);
  }
  close(miniprogramParam) {
    //如果手动关闭连接，不再重连
    this.forbidReconnect = true;
    this.heartReset();
    this.socketTask.close(miniprogramParam);
  }
}

export default (param) => {
  return new Promise((resolve, reject) => {
    new WebsocketHeartbeat(param, {
      resolve,
      reject,
    });
  });
};
