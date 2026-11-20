const messageProvider = require("../Repository/messageProvider");
const userProvider = require("../Repository/UserProvider")
const constants = require("../Utils/constants");
let users = [];

function handleConnection(io) {
  io.on('connection', (socket) => {

    //Aqui agrega a la lista los usuarios que se conectan
    socket.on('joinChat', async (nickName) => {
      console.log("Al Socket llega el usuario: ", nickName);
      //Primero buscamos al usuario por su nickName directamente en la base de datos, lo agregamos al arreglo y lo lanzamos al frontend
      const result = await userProvider.findUserByNickName(nickName);
      users.push({ 
        id: socket.id, 
        nickName: result.nickName, 
        cargo: result.cargo, 
        correo: result.correo 
      });
      io.emit('userList', users);

      // Consultar mensajes privados pendientes del usuario
      const pendingResult = await messageProvider.getPendingMessages(
        result.nickName
      );

      if (pendingResult.status === constants.STATUSES.OK) {

        console.log(
          `Mensajes pendientes para ${result.nickName}:`,
          pendingResult.data.length
        );

        // Entregar cada mensaje pendiente al destinatario
        pendingResult.data.forEach((msg) => {
          socket.emit('receiveMessage', msg);
        });
      }

    });

    // Consultar los mensajes de la conversación seleccionada
    socket.on('loadConversation', async (conversationData) => {
      console.log("-------------------------------")
      console.log("Solicitud de historial recibida:", conversationData);
      const result = await messageProvider.consultMessages(conversationData);
      console.log("Historial recuperado correctamente");
      socket.emit('messagesList', result.data);

    });

    socket.on('sendMessage', async (data) => {

      const result = await messageProvider.create(data);
      
      if(result.status === constants.STATUSES.OK){
        const storedMessage = result.data[0];
        io.emit('receiveMessage', storedMessage);
      }
    });

    socket.on('messageReceived', async (data) => {

      const { messageId, recipientNickName } = data;

      const result = await messageProvider.markAsReceived(
        messageId,
        recipientNickName
      );

      if (result.status === constants.STATUSES.OK) {

        const senderNickName = result.data.senderNickName;

        // Buscar los sockets del remitente y del destinatario
        const involvedSockets = users.filter(user =>
          user.nickName.toLowerCase() === senderNickName.toLowerCase() ||
          user.nickName.toLowerCase() === recipientNickName.toLowerCase()
        );

        // Notificar a ambos usuarios
        involvedSockets.forEach(user => {
          io.to(user.id).emit('messageStatusUpdated', {
            messageId,
            status: 'received'
          });
        });
      }
    });

    //Aquí actualiza la lista, filtrando a los usuarios desconectados
    socket.on('disconnect', () => {
      users = users.filter(user => user.id !== socket.id);
      io.emit('userList', users);
    });
  });
}

module.exports = { handleConnection };