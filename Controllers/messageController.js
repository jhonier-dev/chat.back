const constants = require('../Utils/constants.js');
const messageProvider = require("../Repository/messageProvider");

exports.create = async (req, res, next) => {
    const { message, nickName, recipientNickName, groupName } = req.body;
    console.log("Estos son los datos:"+message+nickName+recipientNickName+groupName);

    try {

        const params = {
            message,
            nickName,
            recipientNickName, 
            groupName
        };
        const response = await messageProvider.create(params);
        
        if (response.status === constants.STATUSES.OK) {
            return res.status(200).json(response);
        } else {
            return res.status(500).json(response);
        }
        
    } catch (error) {
        return res.status(500).json({
            msg: error.message,
        });
    }
};

exports.consultMessages = async (req, res) => {

    console.log("Llegó petición a consultMessages:", req.body);

    try {
        const response = await messageProvider.consultMessages(req.body);
        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({
            status: constants.STATUSES.ERROR,
            msg: error.message
        });
    }
};
