// change response var name to resource

const createWebsocketRouteHandlers = (wss) => {
  const unfreezeObject = (obj) => JSON.parse(JSON.stringify(obj));

  const isUsermeta = (collection) => {
    return collection === 'usersmeta';
  }

  const getChannelInfo = (message) => {
    let channelType;
    let channelId;

    if (message.response && message.response.channelType && message.response.channelId) {
      channelType = message.response.channelType;
      channelId = message.response.channelId;
    } else if (message.channelType && message.channelId) {
      channelType = message.channelType;
      channelId = message.channelId;
    } else {
      channelType = null;
      channelId = null;
    }

    return { channelType, channelId };
  }

  const handlers = {
    handleHttpRequest(action, collection, data) {
      const dataCopy = unfreezeObject(data);
      const message = Object.assign({}, { action, collection, httpRequest: true, response: dataCopy });

      this.broadcast(message);
    },
    sendToOwner(message) {
      wss.clients.forEach((client) => {
        if (client.userId === message.response.userId) {
          this.sendMessage(client, message);
        }
      })
    },
    sendMessageToUser(userId, message) {
      wss.clients.forEach((client) => {
        if (client.userId === userId) {
          this.sendMessage(client, message);
        }
      })
    },
    broadcast(message) {
      if (isUsermeta(message.collection)) {
        this.sendToOwner(message);
        return;
      }

      const { channelType, channelId } = getChannelInfo(message);
      const channelName = `${channelType}_${channelId}`;

      if (channelType && channelId && wss.channels[channelName]) {
        wss.channels[channelName].forEach(connection => {
          this.sendMessage(connection, message);
        });
      } else {
        wss.clients.forEach((client) => this.sendMessage(client, message));
      }
    },
    sendMessage(client, message) {
      client.send(JSON.stringify(message));
    },
  };

  return handlers;
};

export default createWebsocketRouteHandlers;
