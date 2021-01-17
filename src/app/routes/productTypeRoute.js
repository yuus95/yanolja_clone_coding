module.exports = function(app){
    const entire = require('../controllers/productTypeController');

        
   app.get('/entiremap',entire.default)
   app.get('/recentmotel',entire.recentMotel)
   app.get('/motel',entire.motel)
};

