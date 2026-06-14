const {Router} = require('express');
const userRoute = Router();
userRoute.get('/', (req, res) => {
    res.send('Trackher is working!');
});
module.exports = userRoute;