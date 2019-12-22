const clientPath = `${__dirname}/../client`;

const constants = require(`${clientPath}/commons/constants.js`);

module.exports = (io) => {
  const waitingRoom = constants.WAITINGROOM;

  const getSocketIds = (room) => {
    const list = io.sockets.adapter.rooms[room];
    if (list !== undefined) {
      return Object.keys(list.sockets);
    }
    return [];
  }

  const updateWaitingList = () => {
    const socketIds = getSocketIds(waitingRoom);
    const clients = socketIds.map(id => {
      return{
        id: id,
        name: io.sockets.connected[id].name
      }
    });
    io.in(waitingRoom).emit('clientsChange', clients);
  }

  const broadcastEvent = (message) => {
    io.in(waitingRoom).emit('event', message);
  }
  const broadcastMessage = (clientMessage) => {
    io.in(waitingRoom).emit('message', clientMessage);
  }

  const registerPlayer = (sock, name) => {
    sock.name = name
    sock.join(waitingRoom);
    updateWaitingList();
  }

  var index = io.of('/')
  index.on('connection', (sock) => {
    if (constants.AUTO_LOGIN) {
      registerPlayer(sock, `player${++clientCounter}`);
    }

    sock.on('disconnect', updateWaitingList);

    sock.on('message', broadcastMessage);

    sock.on('clientRegistered', (name) => {
      registerPlayer(sock, name)
    })

    sock.on('opponentClick', (opponentId) => {
      //announcing match
      opponent = io.sockets.connected[opponentId];
      broadcastEvent(`Nouveau match ${sock.name} vs ${opponent.name}`)

      //leaving waitingRoom
      opponent.leave(waitingRoom)
      sock.leave(waitingRoom)
      sock.off('message', broadcastMessage);
      updateWaitingList();
    })
  });
}
