module.exports = function(app){
    const select = require('../controllers/selectController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');


    app.get('/select',select.default);
    app.get('/room/:product_number/:room_number',select.room)
    app.get('/jjim',jwtMiddleware,select.checkJjim)
    app.post('/jjim',jwtMiddleware,select.clickJjim)
    app.get('/jjimList',jwtMiddleware,select.jjimList)
};
