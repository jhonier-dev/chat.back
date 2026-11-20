const constants = require('../Utils/constants.js');
let pool = require('./DataBaseConnection.js');


exports.create = async (params) => {
    const {
        message,
        nickName,
        recipientNickName,
        groupName,
    } = params;

    const status = "sent";

    // Validar el destino del mensaje
    const isPrivate = !!recipientNickName && !groupName;
    const isGroup = !!groupName && !recipientNickName;

    if (!message || !nickName || (!isPrivate && !isGroup)) {

        console.log("No se puede enviar el mensaje porque faltan datos.");
        
        return {
            status: constants.STATUSES.ERROR,
            msg: "Datos del mensaje inválidos o destino no especificado"
        };
    }

    return new Promise((resolve) => {
        const sql = 'CALL SP_Message_I(?, ?, ?, ?, ?)';

        pool.query(
            sql,
            [message, nickName, recipientNickName || null, groupName || null, status],
            (err, results) => {
                if (err) {
                    console.log("No guardó el mensaje:", err);

                    return resolve({
                        status: constants.STATUSES.ERROR,
                        msg: err.message
                    });
                }

                console.log("Guardó el mensaje:", results[0]);

                resolve({
                    status: constants.STATUSES.OK,
                    data: results[0]
                });
            }
        );
    });
};


exports.consultMessages = async (params) => {
    const { nickName, recipientNickName, groupName } = params;

    const isPrivate = !!recipientNickName && !groupName;
    const isGroup = !!groupName && !recipientNickName;

    if (!nickName || (!isPrivate && !isGroup)) {
        return {
            status: constants.STATUSES.ERROR,
            msg: "Datos de consulta inválidos"
        };
    }

    return new Promise((resolve) => {

        let sql;
        let data;

        if (isPrivate) {
            sql = `
                SELECT id, nickName, recipientNickName, groupName,
                       message,
                       createDate,
                       DATE_FORMAT(createDate, '%d/%m/%Y - %h:%i:%s %p') AS formattedDate,
                       status
                FROM messages
                WHERE
                    (nickName = ? AND recipientNickName = ?)
                    OR
                    (nickName = ? AND recipientNickName = ?)
                ORDER BY createDate ASC
            `;

            data = [
                nickName, recipientNickName,
                recipientNickName, nickName
            ];

        } else {
            sql = `
                SELECT id, nickName, recipientNickName, groupName,
                       message,
                       createDate,
                       DATE_FORMAT(createDate, '%d/%m/%Y - %h:%i:%s %p') AS formattedDate,
                       status
                FROM messages
                WHERE groupName = ?
                ORDER BY createDate ASC
            `;

            data = [groupName];
        }

        pool.query(sql, data, (err, results) => {

            if (err) {
                console.error("Error al consultar los mensajes:", err);

                return resolve({
                    status: constants.STATUSES.ERROR,
                    msg: err.message
                });
            }
            
            //console.log("Mensajes recuperados:", results);
            resolve({
                status: constants.STATUSES.OK,
                data: results
            });
        });
    });
};

exports.markAsReceived = async (messageId, recipientNickName) => {

    if (!messageId || !recipientNickName) {
        return {
            status: constants.STATUSES.ERROR,
            msg: "Faltan datos para confirmar la recepción"
        };
    }

    return new Promise((resolve) => {

        const sql = `
            UPDATE messages
            SET status = 'received'
            WHERE id = ?
              AND recipientNickName = ?
              AND groupName IS NULL
              AND status = 'sent'
        `;

        pool.query(sql, [messageId, recipientNickName], (err, result) => {

            if (err) {
                console.error("Error al actualizar el estado del mensaje:", err);

                return resolve({
                    status: constants.STATUSES.ERROR,
                    msg: err.message
                });
            }

            if (result.affectedRows === 0) {
                return resolve({
                    status: constants.STATUSES.ERROR,
                    msg: "No se encontró un mensaje pendiente para este destinatario"
                });
            }

            const sqlSender = `
                SELECT nickName
                FROM messages
                WHERE id = ?
            `;

            pool.query(sqlSender, [messageId], (err, results) => {

                if (err) {
                    console.error("Error al consultar el remitente:", err);

                    return resolve({
                        status: constants.STATUSES.ERROR,
                        msg: err.message
                    });
                }

                resolve({
                    status: constants.STATUSES.OK,
                    data: {
                        senderNickName: results[0].nickName
                    }
                });
            });
        });
    });
};

exports.getPendingMessages = async (recipientNickName) => {

    if (!recipientNickName) {
        return {
            status: constants.STATUSES.ERROR,
            msg: "Falta el destinatario"
        };
    }

    return new Promise((resolve) => {

        const sql = `
            SELECT *
            FROM messages
            WHERE recipientNickName = ?
              AND groupName IS NULL
              AND status = 'sent'
            ORDER BY createDate ASC
        `;

        pool.query(sql, [recipientNickName], (err, results) => {

            if (err) {
                console.error("Error al consultar mensajes pendientes:", err);

                return resolve({
                    status: constants.STATUSES.ERROR,
                    msg: err.message
                });
            }

            resolve({
                status: constants.STATUSES.OK,
                data: results
            });
        });
    });
};

