module.exports = function(app){
    const search = require('../controllers/searchController');

    app.get('/search',  search.default);
    app.get('/searchlist',  search.getSearchList);
    app.delete('/searchall',search.deleteAll);
    app.delete('/search/:id',search.deleteid);
};
