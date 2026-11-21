const userProvider = require("../Repository/UserProvider");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const constants = require('../Utils/constants.js');

exports.login = async (req, res) => {
    try {
        
        const { password } = req.body;
        const nickName = req.body.nickName?.trim();
        if (!nickName) {
            return res.status(400).json({ msg: 'Username is required.' });
}
        const user = await userProvider.findUserByNickName(nickName);  
        
        if (!user)
            return res.status(401).json({ msg: 'Username does not exist.' });        

        const isMatch = await bcrypt.compare(password, user.userPassword);  
        if (!isMatch)
            return res.status(401).json({ msg: 'Invalid password' });

        const payload = {  
            userId: user.id
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' }); 

        res.cookie('access_token', token, { httpOnly: true });   
        return res.status(200).json({ msg: 'Login successful', status: 'OK'});
    } catch (error) {
        return res.status(500).json({ msg: error.message });
    }
};

exports.create = async (req, res, next) => {
    
    try {

        const { password, cargo, correo } = req.body;
        const nickName = req.body.nickName?.trim();  //Extrae el nickName y demás parámetros del cuerpo de la solicitud
        if (!nickName) {
            return res.status(400).json({ msg: 'Username is required.' });
}
        const hashedPassword = bcrypt.hashSync(password, constants.SALT_ROUNDS.PRODUCTION);
        const params = {
            nickName,
            password: hashedPassword,
            cargo,
            correo             //Crea un objeto params con el nickName extraído
        };          

        //const response = await userProvider.create(params); //Llama al método create del userProvider y espera su resultado
        //return res.status(200).json(response); //Si la operación es exitosa, devuelve una respuesta con estado 200 y el resultado en formato JSON
        const response = await userProvider.create(params);
        if (response.data) {
            response.data = response.data.map(({ userPassword, ...user }) => user);
        }
        return res.status(200).json(response);

    } catch (error) {
        return res.status(500).json({
            msg: error.message,     //Si ocurre un error, captura el error y devuelve una respuesta con estado 500 y el mensaje del error
        });
    }
};