const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');
const geoip = require('geoip-lite');
const request = require('request');
const searchDao = require('../dao/searchDao');
const fetch = require('node-fetch')
const axios = require('axios');

const CryptoJS = require("crypto-js");
const { response } = require('express');



const timeStamp = Math.floor(+new Date).toString();


exports.getSearchList= async function(req,res){
    let ip = req.clientIp;
if (ip.length>18){
    ip = ip.substr(7, 22);
}
    let geo = geoip.lookup(ip);
    console.log("위도,",geo.ll[0]);
    console.log("경도,",geo.ll[1]);
  
  


    try{
        const connection = await pool.getConnection(async conn => conn);
        try{
            const rows= await searchDao.searchListDao(ip);
            console.log('rows'+rows);
            connection.release();
        //   return   res.render('search',{isSuccess:true,message:"데이터 요청 성공",code:200,data:rows})
         
            return  res.json({code:200,isSuccess:true,message:"데이터 요청 성공",data:rows})
        }
        catch(err){
            console.log('컨넥션 에러'+err);
            res.json({code:400})
        }

    }catch(err){
        logger.error(`example non transaction Query error 2번째\n: ${JSON.stringify(err)}`);
        connection.release();
        return false;
    }
}

exports.default = async function (req, res) {
    const {search,entire_title,startDate,endDate,human_count} = req.query;
    let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }

    let geo = geoip.lookup(ip);
    
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            if (search == null || search == "undefined" || search == "" || search == "." ) return res.json({
                isSuccess: false,
                code: 400,
                message: "검색할 키워드를 입력해 주세요."
            });

            if(entire_title == null || entire_title =='undefined' || entire_title=="")
            {
                res.json({isSucees:false,code:400,mesaage:"숙소 유형 데이터가 없습니다."})
            }
            
            if(startDate == null || startDate =='undefined' || startDate=="")
            {
                res.json({isSucees:false,code:400,mesaage:"체크인 데이터가 없습니다."})
            }
            if(endDate == null || endDate =='undefined' || endDate=="")
            {
                res.json({isSucees:false,code:400,mesaage:"체크아웃 데이터가 없습니다."})
            }
            if(human_count == null || human_count =='undefined' || human_count=="")
            {
                res.json({isSucees:false,code:400,mesaage:"인원 수를 체크해주세요"})
            }


            const product_list = await searchDao.getListDao(entire_title,search);
            if(product_list == null || product_list == 'undefined' || product_list ==""){
              connection.release();
              return res.json({
                   isSuccess:"실패",
                   code:400,
                   message:"상품리스트가 없습니다"
               })
            }


            const product_list_title = product_list.map((item)=>{return item.id})

            const product_room = await searchDao.getReserveRoomDao(startDate,endDate); // 대실 예약확인
             let product_number_array =  product_room.map((item)=>item.product_number); //예약된 상품명 가져오기

             let number_array= product_number_array.filter((item,index)=>{
                 return product_number_array.indexOf(item)===index
             }) //예약된 상품목록 (중복 제거)
             
         
             //reserve_type 1 대실 2 숙박
             const product_room_count= await searchDao.getRoomCountDao(number_array); // 상품 마다 갖고있는 방 갯수
             let box=[];
             let box_sleep=[];
             for(let i = 0 ; i<number_array.length;i++){ //예약된 방 카운터 체크
                let list  = product_room.filter((item)=>item.product_number==number_array[i] && item.reserve_type == 1); //대실 리스트              
                let sleep_list  = product_room.filter((item)=>item.product_number==number_array[i] && item.reserve_type == 2); //숙박 리스트

                let test_result =list.map((item)=>item.room_number);
                let sleep_reuslt =sleep_list.map((item)=>item.room_number);
                box[i] ={
                    id:number_array[i],
                    roomCount:test_result,
                    Reserve:'N',
                }; 
               
                box_sleep[i] ={
                    id:number_array[i],
                    roomCount:sleep_reuslt,
                    Reserve:'N',
                }; 
             }

    

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
                        product_list[i].room_price  =  parseInt(room_price[i].weekday_room_price) 
                        product_list[i].sleep_price = parseInt(room_price[i].weekday_sleep_price)
                        product_list[i].room_time = parseInt(room_price[i].weekday_room_time)
                        product_list[i].sleep_time =parseInt(room_price[i].weekday_sleep_start)
                        product_list[i].review_score =parseFloat(product_list[i].review_score)
                    }
                 }
                 else{
                    for(let i = 0 ; i<product_list_title.length; i++){
                        product_list[i].room_price  =  parseInt(room_price[i].weekend_room_price)
                        product_list[i].sleep_price = parseInt(room_price[i].weekend_sleep_price)
                        product_list[i].room_time =  parseInt(room_price[i].weekend_room_time)
                        product_list[i].sleep_time = parseInt(room_price[i].weekend_sleep_start)
                        product_list[i].review_score =parseFloat(product_list[i].review_score)
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
           try{
            const insert = await searchDao.insertSearch(search,startDate,endDate,new Date(),human_count,ip);
            
           }
           catch(err){
               console.error('최근기록 에러 '+err);
           }
           connection.release();
        //    return  res.render('list',{code:200,isSucess:true ,message:"데이터 요청 성공", data:product_list})
       
        return  res.json({code:200,isSucess:true ,message:"데이터 요청 성공", data:product_list})

        } catch (err) {
            console.error(err);
            logger.error(`example non transaction Query error 2번째\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
};

exports.deleteAll=async function(req,res){
        let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }

    try{
        const connection = await pool.getConnection(async conn => conn);
        try{
            const del = await searchDao.deleteAllDao(ip);
            if(del == null || del == undefined || del == 0){
           
              connection.release();
               return res.json({
                    isSuccess:"실패",
                    code:302,
                    message:"데이터가 모두 삭제됐습니다."
                })
            }
            connection.release();
            return res.json({isSuccess:true,message:"해당 아이피 최근 검색 데이터 모두삭제",code:200})
            

        }
        catch(err){
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

exports.deleteid = async function(req,res){
    const {id,} = req.params
    let ip = req.clientIp;
    if (ip.length>18){
        ip = ip.substr(7, 22);
    }
    try{
        const connection = await pool.getConnection(async conn => conn);
        try{
            const del =await searchDao.deleteIdDao(id,ip);
            console.log(del);

            if(del == null || del == undefined || del == 0){
                res.json({
                    isSuccess:"실패",
                    code:402,
                    message:"삭제된 컬럼이거나 없는 데이터입니다"
                })
            }
            connection.release();
            return res.json({code:200,isSuccess:true,message:`삭제 성공`});
           
        }
        catch(err){
            console.error('db연결 에러'+err);
        }

    }
    catch(error){
        logger.error(`connection db failed ${JSON.stringify(err)}`);
        connection.release();
        return false;
    }
}