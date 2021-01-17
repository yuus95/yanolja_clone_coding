const express = require('express');
const compression = require('compression');
const methodOverride = require('method-override');
const requestIp = require('request-ip');
const path = require('path');



var cors = require('cors');
module.exports = function () {
    let mypath = path.join(__dirname,"../views");
    const app = express();

    app.use(compression());

    app.use(express.json());

    app.use(requestIp.mw())
 
   
    app.use(express.urlencoded({extended: true}));

    app.use(methodOverride());

    app.use(cors());
    app.set('views', mypath);
    app.set('view engine', 'ejs');
  
    app.use(express.static(mypath));

    /* App (Android, iOS) */
    require('../src/app/routes/indexRoute')(app);
    require('../src/app/routes/searchRoute')(app);
    require('../src/app/routes/productTypeRoute')(app);
    require('../src/app/routes/selectProductRoute')(app);
    require('../src/app/routes/reservationRoute')(app);
    require('../src/app/routes/userRoute')(app);

    /* Web */
    // require('../src/web/routes/indexRoute')(app);

    /* Web Admin*/
    // require('../src/web-admin/routes/indexRoute')(app);
    return app;
};

