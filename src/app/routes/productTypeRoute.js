module.exports = function(app){
    const entire = require('../controllers/productTypeController');

   //모델지역 전체조회     
   app.get('/entiremap',entire.default)
   app.get('/recentmotel',entire.recentMotel)
   app.get('/motel',entire.motel)
};

