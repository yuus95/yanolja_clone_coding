const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const reservationDao = require('../dao/reservationDao');


exports.getList = async function (req, res) {
    const {product_number,room_number,check_in,check_out,result_type } = req.query;
        if(product_number == null || product_number =='undefined' || product_number=="")
        {
            res.json({isSucees:false,code:400,mesaage:"상품번호가 입력되지 않았습니다."})
        }
        if(room_number == null || room_number =='undefined' || room_number=="")
        {
            res.json({isSucees:false,code:400,mesaage:"방번호가 입력되지 않았습니다."})
        }
        if(check_in == null || check_in =='undefined' || check_in=="")
        {
            res.json({isSucees:false,code:400,mesaage:"체크인 날짜가 입력되지 않았습니다."})
        }
        if(check_out == null || check_out =='undefined' || check_out=="")
        {
            res.json({isSucees:false,code:400,mesaage:"체크아웃 날짜가 입력되지 않았습니다."})
        }
        if(result_type == null || result_type =='undefined' || result_type=="")
        {
            res.json({isSucees:false,code:400,mesaage:"숙박 타입이 선택되지 않았습니다."})
        }
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
       


            
            const sale_list = await reservationDao.getSaleType();
            const room_reservation = await reservationDao.getList(product_number,room_number);   //
            const room_price = await reservationDao.getPrice(product_number,room_number); // 
            const day_check = new Date(check_in).getDay();
                if(day_check ==5  || day_check ==6){
                    if(result_type == 1 )
                    room_reservation[0].price = parseInt(room_price[0].weekend_room_price) 
                    else
                    room_reservation[0].price = parseInt(room_price[0].weekday_room_price)
                    
                }
                else{
                    if(result_type == 1 )
                    room_reservation[0].price =parseInt(room_price[0].weekend_sleep_price) 
                    else
                    room_reservation[0].price =parseInt(room_price[0].weekday_sleep_price ) 


                } 
                connection.release();
            // return res.render('index',{code:200,isSucees:true,mesaage:"데이터 요청성공",check_in:check_in,check_out:check_out,data:room_reservation});
            
            return res.json({code:200,isSucees:true,mesaage:"데이터 요청성공",check_in:check_in,check_out:check_out,data:room_reservation,sale_list:sale_list});
        } catch (err) {
            logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
};