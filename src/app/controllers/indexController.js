const { parse } = require('tough-cookie');
const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const indexDao = require('../dao/indexDao');
const searchDao =  require('../dao/searchDao');


exports.default = async function (req, res) {
    const {map_number,submap_number,entire_number } = req.query;
    console.log("req.token",req.token)
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            if(map_number == null || map_number =='undefined' || map_number=="")
            {
                res.json({isSucees:false,code:400,mesaage:"행정구역이 입력되지않았습니다.ex)서울시 number x"})
            }
            if(submap_number == null || submap_number =='undefined' || submap_number=="")
            {
                res.json({isSucees:false,code:400,mesaage:"하위 행정구역이 입력되지않았습니다. ex)광명,부천"})
            }
            if(entire_number == null || entire_number =='undefined' || entire_number=="")
            {
                res.json({isSucees:false,code:400,mesaage:"상품 유형이 입력되지 않았습니다."})
            }
            const type_list = await indexDao.defaultDao();            
           
            
                const product = await indexDao.getRecentProduct(map_number,submap_number,entire_number); 
                
                
                const product_list = product.map((item)=>item.id);
            
                let checkDay = new Date().getDay(); //주말 가격 비교하기 위해서
                //5, 6 은 주말가격
    

                //decimal  타입은 String 으로 반환된다 
                const room_price = await searchDao.getPriceDao(product_list);
                console.log(room_price);
                try{
                   if(checkDay == 5 || checkDay == 6 ){
                       for(let i = 0 ; i<product_list.length; i++){
                           product[i].sleep_price =parseInt(room_price[i].weekday_sleep_price) 
                            product[i].score = parseFloat(product[i].score);
                        }
                    }
                    else{
                       for(let i = 0 ; i<product_list.length; i++){
                           product[i].sleep_price =parseInt(room_price[i].weekend_sleep_price)  
                           product[i].score = parseFloat(product[i].score);                        
                       }

                      
                    }                 
                }catch(err){
                    console.error('daycheck err '+ err);
                }
                
                console.log("테스트",typeof(room_price[0].weekend_sleep_price));
                console.log("테스트",parseInt(product[0].sleep_price));
                console.log("테스트",parseFloat(product[0].score));

                
                console.log(type_list);
                console.log(product)
                connection.release();
                // return res.render('index',{isSucees:true,mesaage:"데이터 요청성공",code:200,menu_List:type_list,data_list:product});
            return res.json({code:200,isSucees:true,mesaage:"데이터 요청성공",menu_List:type_list,data_list:product});
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