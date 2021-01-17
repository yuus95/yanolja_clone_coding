
module.exports = function(app){
    const index = require('../controllers/indexController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');
    
    const fs = require('fs');

    app.get('/',  (req,res)=>{
        console.log("성공");
    });
    app.get('/main',jwtMiddleware,  index.default);
};


