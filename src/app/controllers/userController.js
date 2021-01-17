const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const jwt = require('jsonwebtoken');
const regexEmail = require('regex-email');
const crypto = require('crypto');
const secret_config = require('../../../config/secret');

const userDao = require('../dao/userDao');
const { constants } = require('buffer');

/**
 update : 2020.10.4
 01.signUp API = 회원가입
 */
exports.signUp = async function (req, res) {
    const {
        email, password, nickname
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요."});
    if (password.length < 6 || password.length > 20) return res.json({
        isSuccess: false,
        code: 305,
        message: "비밀번호는 6~20자리를 입력해주세요."
    });

    if (!nickname) return res.json({isSuccess: false, code: 306, message: "닉네임을 입력 해주세요."});
    if (nickname.length > 20) return res.json({
        isSuccess: false,
        code: 307,
        message: "닉네임은 최대 20자리를 입력해주세요."
    });
    const connection =await pool.getConnection(async (conn)=>conn)
    try {
        try {
            // 이메일 중복 확인
            const emailRows = await userDao.userEmailCheck(email);
            if (emailRows.length > 0) {

                return res.json({
                    isSuccess: false,
                    code: 308,
                    message: "중복된 이메일입니다."
                });
            }

            // 닉네임 중복 확인
            const nicknameRows = await userDao.userNicknameCheck(nickname);
            if (nicknameRows.length > 0) {
                return res.json({
                    isSuccess: false,
                    code: 309,
                    message: "중복된 닉네임입니다."
                });
            }

            // TRANSACTION : advanced
           // await connection.beginTransaction(); // START TRANSACTION
            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            const insertUserInfoParams = [email, hashedPassword, nickname];
            
            const insertUserRows = await userDao.insertUserInfo(insertUserInfoParams);
            
           await connection.commit(); // COMMIT
           connection.release();
 
            return res.json({
                code: 200,
                isSuccess: true,
                message: "회원가입 성공"
            });
        } catch (err) {
           await connection.rollback(); // ROLLBACK
           connection.release();
            logger.error(`App - SignUp Query error\n: ${err.message}`);
            return res.status(500).send(`Error: ${err.message}`);
        }
    } catch (err) {
        logger.error(`App - SignUp DB Connection error\n: ${err.message}`);
        return res.status(500).send(`Error: ${err.message}`);
    }
};

/**
 update : 2020.10.4
 02.signIn API = 로그인
 **/
exports.signIn = async function (req, res) {
    const {
        email, password
    } = req.body;

    if (!email) return res.json({isSuccess: false, code: 301, message: "이메일을 입력해주세요."});
    if (email.length > 30) return res.json({
        isSuccess: false,
        code: 302,
        message: "이메일은 30자리 미만으로 입력해주세요."
    });

    if (!regexEmail.test(email)) return res.json({isSuccess: false, code: 303, message: "이메일을 형식을 정확하게 입력해주세요."});

    if (!password) return res.json({isSuccess: false, code: 304, message: "비밀번호를 입력 해주세요."});

    try {
        const connection = await pool.getConnection(async conn => conn);

        try {
            const [userInfoRows] = await userDao.selectUserInfo(email)

            if (userInfoRows.length < 1) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 310,
                    message: "아이디를 확인해주세요."
                });
            }

            const hashedPassword = await crypto.createHash('sha512').update(password).digest('hex');
            if (userInfoRows[0].user_pw !== hashedPassword) {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "비밀번호를 확인해주세요."
                });
            }
            if (userInfoRows[0].status === "INACTIVE") {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 312,
                    message: "비활성화 된 계정입니다. 고객센터에 문의해주세요."
                });
            } else if (userInfoRows[0].status === "DELETED") {
                connection.release();
                return res.json({
                    isSuccess: false,
                    code: 313,
                    message: "탈퇴 된 계정입니다. 고객센터에 문의해주세요."
                });
            }
            //토큰 생성
            let token = await jwt.sign({
                    email: userInfoRows[0].email,
                }, // 토큰의 내용(payload)
                secret_config.jwtsecret, // 비밀 키
                {
                    expiresIn: '365d',
                    subject: 'userInfo',
                } // 유효 시간은 365일
            );
               userInfoRows[0] 
            res.json({
                userInfo: {
                    emial:userInfoRows[0].email,
                    nickname:userInfoRows[0].nickname,
                    status:userInfoRows[0].status,
                    phone:userInfoRows[0].phone
                    
                },
                jwt: token,
                code: 200,
                isSuccess: true,
                message: "로그인 성공"
            });

            connection.release();
        } catch (err) {
            logger.error(`App - SignIn Query error\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`App - SignIn DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
};

    /** 
     update : 2019.09.23
    03.check API = token 검증
    **/
    exports.check = async function (req, res) {
        res.json({
            isSuccess: true,
            code: 200,
            message: "검증 성공",
            info: req.verifiedToken
        })
    };

    exports.logOut = async function(req,res){
        let token = req.headers['x-access-token'] || req.query.token;
        token = ""
        res.json({code:200,isSuccess:true,message:"로그아웃 완료",token:token});
    }

    exports.delete  = async function(req,res){
        const   {email} = req.verifiedToken;
        console.log(email);
        const connection = await pool.getConnection(async (conn)=>conn);
      

        await connection.beginTransaction();
        await connection.commit();
        connection.release();

        try{
            await userDao.deleteUser(email);
            res.json({code:200,isSuccess:true,message:"회원탈퇴 완료" })
            
        }catch(err){
            await connection.rollback();
            connection.release();
            console.error(err);
        }
    }

    // exports.change = async function(req,res){
    //     const   {email} = req.verifiedToken;
    //     const {newPsw,psw} = req.body ; 
        
    //     const [userInfoRows] = await userDao.selectUserInfo(email)

    //         const Password = await crypto.createHash('sha512').update(psw).digest('hex');
    //         if (userInfoRows[0].user_pw !== Password) {
    //             connection.release();
    //             return res.json({
    //                 isSuccess: false,
    //                 code: 311,
    //                 message: "비밀번호를 확인해주세요."
    //             });
    //         }
    //     const hashedPassword = await crypto.createHash('sha512').update(newPsw).digest('hex');
    //     let token = req.headers['x-access-token'] || req.query.token;
    //     token = ""
    //     try {
    //         await userDao.updatePassword(email,hashedPassword);
    //         res.json({code:200,isSuccess:true,message:"비밀번호 변경 완료",token:token})
    //     }
    //     catch(err){
    //         console.error(err);
    //     }
    // }


    
    
    exports.changePage = async function(req,res){
        const   {email} = req.verifiedToken;
            await userDao.userEmailCheck(email);
        try {
            res.json({code:200,isSuccess:true,message:"내정보 관리 페이지",confirm:'N',verifiedToken:verifiedToken})
        }
        catch(err){
            console.error(err);
        }
    }


    exports.changePageConfirm = async function(req,res){
        const   {email} = req.verifiedToken;
        const {password} = req.body ; 
        
        const [userInfoRows] = await userDao.selectUserInfo(email)

            const Password = await crypto.createHash('sha512').update(password).digest('hex');
            if (userInfoRows[0].user_pw !== Password) {
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "이메일(ID 또는 이메일) 과 비밀번호를 확인 후 다시 로그인 해주세요 (5회 이상 오류시 로그인 차단)"
                });
            }
        
        try {
            res.json({code:200,isSuccess:true,message:"비밀번호 확인 완료",Confirm:"Y"})
        }
        catch(err){
            console.error(err);
        }
    }


    exports.changePhone = async function(req,res){
        const   {email} = req.verifiedToken;
        const {newPhoneNumber} = req.body ; 
        const connection =await pool.getConnection(async(conn)=>conn);

        const [userInfoRows] = await userDao.selectUserInfo(email)

        if(userInfoRows[0].phone == newPhoneNumber){
            connection.release();
            return res.json({code:301,isSuccess:false,message:"같은 번호입니다"})
        }

        if(newPhoneNumber.length>13){
            return res.json({code:301,isSuccess:false,message:"number legnth is too long"})
        }
       
        let token = req.headers['x-access-token'] || req.query.token;
        token = ""
        try {
                           // TRANSACTION : advanced
            await connection.beginTransaction(); // START TRANSACTION
            await userDao.updatePhoneNumber(email,newPhoneNumber);
            await connection.commit(); // COMMIT
            connection.release();
            res.json({code:200,isSuccess:true,message:"번호 변경 완료",token:token})
        }
        catch(err){
            await connection.rollback(); // ROLLBACK
            connection.release();
            console.error(err);
        }
    }



    exports.changePassword = async function(req,res){
        const   {email} = req.verifiedToken;
        const {psw,newPsw,newPswConfirm} = req.body ; 
        
        const [userInfoRows] = await userDao.selectUserInfo(email)
        const connection =await pool.getConnection(async(conn)=>conn);

            const Password = await crypto.createHash('sha512').update(psw).digest('hex');
            if (userInfoRows[0].user_pw !== Password) {
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "비밀번호를 확인해주세요."
                });
            }

            if(newPsw !=newPswConfirm ){
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "두 비밀번호가 다릅니다."
                })
            }

        const hashedPassword = await crypto.createHash('sha512').update(newPsw).digest('hex');
        let token = req.headers['x-access-token'] || req.query.token;
        token = ""
        try {
            await connection.beginTransaction(); // START TRANSACTION
            await userDao.updatePassword(email,hashedPassword);
            await connection.commit(); // COMMIT
            connection.release();
            res.json({code:200,isSuccess:true,message:"비밀번호 변경 완료",token:token})
        }
        catch(err){
            await connection.rollback(); // ROLLBACK
            connection.release();
            console.error(err);
        }
    }


    
    exports.coupon = async function(req,res){
        const {email} = req.body ; 
        
        const [userInfoRows] = await userDao.selectUserInfo(email)

            const Password = await crypto.createHash('sha512').update(psw).digest('hex');
            if (userInfoRows[0].user_pw !== Password) {
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "비밀번호를 확인해주세요."
                });
            }

            if(newPsw !=newPswConfirm ){
                return res.json({
                    isSuccess: false,
                    code: 311,
                    message: "두 비밀번호가 다릅니다."
                })
            }

        const hashedPassword = await crypto.createHash('sha512').update(newPsw).digest('hex');
        let token = req.headers['x-access-token'] || req.query.token;
        token = ""
        try {
            await userDao.updatePassword(email,hashedPassword);
            res.json({code:200,isSuccess:true,message:"비밀번호 변경 완료",token:token})
        }
        catch(err){
            console.error(err);
        }
    }


    