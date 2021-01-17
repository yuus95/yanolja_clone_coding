module.exports = function(app){
    const user = require('../controllers/userController');
    const jwtMiddleware = require('../../../config/jwtMiddleware');

    app.post('/users',user.signUp) //회원가입
    app.route('/users/signIn').post(user.signIn); //로그인
    app.delete('/users',jwtMiddleware,user.delete) //회원탈퇴
    app.post('/users/logout',jwtMiddleware,user.logOut); //로그아웃


    app.get('/change',jwtMiddleware,user.changePage)
   
    app.post('/change',jwtMiddleware,user.changePageConfirm) //비밀번호 입력 페이지
    app.patch('/change/phone',jwtMiddleware,user.changePhone)
    app.patch('/change/password',jwtMiddleware,user.changePassword)



    app.get('/check', jwtMiddleware, user.check);

    app.get('/mycoupon',user.coupon)



};