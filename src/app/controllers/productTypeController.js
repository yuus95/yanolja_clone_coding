const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const geoip = require('geoip-lite');
const request = require('request');
require('dotenv').config();

const productTypeDao = require('../dao/productTypeDao');
const searchDao = require('../dao/searchDao');

const axios = require('axios');
const CryptoJS = require("crypto-js");


const requestMethod = "GET";
const hostName = 'https://geolocation.apigw.ntruss.com'
const requestUrl= '/geolocation/v2/geoLocation'
const access_key = process.env.access_key
const secret_key = process.env.secret_key


const timeStamp = Math.floor(+new Date).toString();


exports.default = async function (req, res) {
    let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }
    
        let geo = geoip.lookup(ip);
  
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {            
            const rows = await productTypeDao.entireListDao();            
            return res.json({code:200,isSucees:true,message:"성공했습니다.",data:rows});
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


exports.motel = async function(req,res){
    const {entire_number,sub_number,startDate,endDate} =req.query;
    let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }
 
    if(sub_number == null || sub_number =='undefined' || sub_number=="")
    {
        res.json({isSucees:false,code:400,mesaage:"하위 행정구역이 입력되지않았습니다. ex)광명,부천"})
    }
    if(entire_number == null || entire_number =='undefined' || entire_number=="")
    {
        res.json({isSucees:false,code:400,mesaage:"행정구역이 입력되지 않았습니다."})
    }
    if(startDate == null || startDate =='undefined' || startDate=="")
    {
        res.json({isSucees:false,code:400,mesaage:"체크인 시간을 등록하지 않았습니다."})
    }
    if(endDate == null || endDate =='undefined' || endDate=="")
    {
        res.json({isSucees:false,code:400,mesaage:"체크아웃 시간을 등록하지 않았습니다."})
    }
    
    try{
        const connection =await  pool.getConnection(async conn => conn);
        try{
            
            const product_list = await productTypeDao.getMotelDao(entire_number,sub_number); //아이템 리스트 
            
            const product_list_title = product_list.map((item)=>{return item.id})

            const product_room = await searchDao.getReserveRoomDao(startDate,endDate); // 대실 예약확인
            // const product_sleep = await searchDao.getReserveRoomDao(startDate,endDate); //숙박 예약확인
             let product_number_array =  product_room.map((item)=>item.product_number); //예약된 상품명 가져오기

             let number_array= product_number_array.filter((item,index)=>{
                 return product_number_array.indexOf(item)===index
             }) //예약된 상품목록 (중복 제거)
             
         
             const product_room_count= await searchDao.getRoomCountDao(number_array); // 상품 마다 갖고있는 방 갯수
             let box=[];
             let box_sleep=[];
             for(let i = 0 ; i<number_array.length;i++){ //예약된 방 카운터 체크
                let test  = product_room.filter((item)=>item.product_number==number_array[i] && item.reserve_type == 1);
                // console.log(test); 
                let test_result =test.map((item)=>item.room_number);
              
                box[i] ={
                    id:number_array[i],
                    roomCount:test_result,
                    Reserve:'N',
                }; 

                box_sleep[i] ={
                    id:number_array[i],
                    roomCount:test_result,
                    Reserve:'N',
                }; 
             }

    

             console.log ("product_room_count",product_room_count[1].room_number_count);
             console.log("box[i]",box[1].roomCount.length);
             for(let i = 0 ; i<number_array.length; i++){
                 if(box[i].roomCount.length == product_room_count[i].room_number_count){
                     box[i].Reserve = 'Y'
                 }

                 if(box_sleep[i].roomCount.length == product_room_count[i].room_number_count){
                    box_sleep[i].Reserve = 'Y'
                }
             }

        
             let checkDay = new Date(startDate).getDay(); //주말 가격 비교하기 위해서
             //5, 6 은 주말가격

             const room_price = await searchDao.getPriceDao(product_list_title);
             console.log(room_price);
             try{
                if(checkDay == 5 || checkDay == 6 ){
                    for(let i = 0 ; i<product_list_title.length; i++){
                        product_list[i].room_price  =  parseFloat(room_price[i].weekday_room_price)
                        product_list[i].sleep_price = parseFloat(room_price[i].weekday_sleep_price)
                        product_list[i].room_time = parseFloat(room_price[i].weekday_room_time)
                        product_list[i].sleep_time = parseFloat(room_price[i].weekday_sleep_start)
                        product_list[i].review_score = parseFloat(product_list[i].review_score)
                    }
                 }
                 else{
                    for(let i = 0 ; i<product_list_title.length; i++){
                        product_list[i].room_price  =  parseFloat(room_price[i].weekend_room_price)
                        product_list[i].sleep_price = parseFloat(room_price[i].weekend_sleep_price)
                        product_list[i].room_time = parseFloat(room_price[i].weekend_room_time)
                        product_list[i].sleep_time =parseFloat(room_price[i].weekend_sleep_start) 
                        product_list[i].review_score = parseFloat(product_list[i].review_score);
                    }
                 }                 
             }catch(err){
                 console.error('daycheck err '+ err);
             }
             
             for(let i = 0 ; i< box.length; i++){
                 for(let j = 0; j <product_list.length;j++){
                     if(box[i].id ==product_list[j].id && box[i].Reserve =='Y' ){
                        product_list[j].room_price ="예약 마감"
                     }
                     else if (box_sleep[i].id == product_list[j].id && box_sleep[i].Reserve=='Y' ){
                        product_list[j].sleep_price ="예약 마감"
                     }    
                 }
             }
             console.log("product_list,",product_list);
                 connection.release();
            return  res.json({code:200,isSucess:true,message:"데이터요청 성공", data:product_list})               
        }
        catch(err){
            console.error('sql 에러 '+err);
            connection.release()
            return false;
        }
    }
    catch(err){
        console.error(err);
        logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
        return false;
    }

}

exports.recentMotel = async function(req,res){
    let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }
        // let geo = geoip.lookup(ip);
        // console.log("위도,",geo.ll[0]);
        // console.log("경도,",geo.ll[1]);
        
        const sortedSet = {};
        sortedSet["ip"] =  ip; //"118.223.192.107" //예시ip 
        sortedSet["ext"] = "t";
        sortedSet["responseFormatType"] = "json";
      
        let queryString = Object.keys(sortedSet).reduce( (prev, curr)=>{
          return prev + curr + '=' + sortedSet[curr] + '&';
        }, "");
      
        queryString = queryString.substr(0, queryString.length -1 );
      
        const baseString = requestUrl + "?" + queryString;
        const signature = await  makeSignature(secret_key, requestMethod, baseString, timeStamp, access_key);
      
        const config = {
          headers: {
            'x-ncp-apigw-timestamp': timeStamp,
            'x-ncp-iam-access-key' : access_key,
            'x-ncp-apigw-signature-v2': signature
          }
        }

        try{
            let a = await axios.get(`${hostName}${baseString}`, config)
            try{
                const connection = await pool.getConnection(async conn=>conn);
                try{        
                    const list = await productTypeDao.getRecentMotel(a.data.geoLocation.r2,a.data.geoLocation.r3)
                        try{
                            if(list[0]==null ||list[0]=='undefined'|| list[0]=="" ) {
        
                                connection.release();
                                return res.json({ip:ip,code:400,isSucees:false,message:"데이터가 없습니다",map:a.data.geoLocation.r2,map_b:a.data.geoLocation.r3});
                            }               
                        let idList = list.map((item=>item.id));                     
                        const priceList = await productTypeDao.getPrice(idList);                     

                        const daycheck = new Date();
                        if(daycheck == 5 || daycheck == 6){
                            for(let i=0 ; i< list.length; i++){
                                list[i].price = priceList[i]. weekend_sleep_price
                                list[i].score = parseFloat(list[i].score);
                                list[i].price = parseInt(list[i].price);
                            }
                        }
                        else {
                            for(let i=0 ; i< list.length; i++){
                                list[i].price = priceList[i]. weekday_sleep_price
                                list[i].score = parseFloat(list[i].score);
                                list[i].price = parseInt(list[i].price);
                            }
                        }   
                            connection.release();
                        return   res.json({code:200,isSucees:true,mesaage:"데이터 요청 성공 ",data:a.data.geoLocation.r3,list:list});
                        }catch(err){
                            console.error('err',err);
                            connection.release();
                            return false;
                        }        
                      }
                    catch(err){
                    console.error(err);
                    logger.error(`example non transaction Query error 2번째\n: ${JSON.stringify(err)}`);
                    connection.release();
                    return false;
                    }
                    }
                catch(err){
                    logger.error(`example non transaction Query error 2번째\n: ${JSON.stringify(err)}`);
                    connection.release();
                    return false;
                    }            
                }
            catch(err){
                    console.error(err);
            }
            
            

          
        function makeSignature(secretKey, method, baseString, timestamp, accessKey) {
            const space = " ";
            const newLine = "\n";
            let hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secretKey);

            hmac.update(method);
            hmac.update(space);
            hmac.update(baseString);
            hmac.update(newLine);
            hmac.update(timestamp);
            hmac.update(newLine);
            hmac.update(accessKey);
            const hash = hmac.finalize();

            return hash.toString(CryptoJS.enc.Base64);
        }
        
  



}