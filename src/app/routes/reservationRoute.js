
module.exports = function(app){
    const reservation = require('../controllers/reservationController');

  
    app.get('/reservation',  reservation.getList);
    // app.post('/reservation',reservation.post)
};


