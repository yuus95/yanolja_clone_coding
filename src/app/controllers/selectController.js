const {pool} = require('../../../config/database');
const {logger} = require('../../../config/winston');

const selectDao = require('../dao/selectDao');
const searchDao = require('../dao/searchDao');


exports.default = async function (req, res) {
    const {id,startDate,endDate} = req.query;
    const curDay = new Date();

    console.log(id,startDate,endDate)
    try {
        
      const connection = await  pool.getConnection(async conn => conn);
    
        try {
           
           const imagelist = await  selectDao.getImageDao(id);
           if(imagelist == null || imagelist == 'undefined' || imagelist == ""){
               return res.json({code:500,message:'이미지 리스트 조회 실패'+err})
           }
         
            const score = await selectDao.getScoreDao(id);
            if(score == null || score == 'undefined' || score == ""){
                return res.json({code:500,message:'점수 조회 실패'+err})
            }

            score[0].review_score = parseFloat(score[0].review_score);
            const productList = await selectDao.getProductListDao(id);
            if(productList == null || productList == 'undefined' || productList == ""){
                return res.json({code:500,message:'상품 조회 실패 '+err})
            }

            const reserveList = await selectDao.getReserveListDao(id,startDate,endDate);      
            if(reserveList == null || reserveList == 'undefined' ||  reserveList == ""){
                console.error("err"+err);
                return res.json({code:500,message:'예약 조회 실패'+err})
            }
            
            const amenList = await selectDao.getAmenListDao(id);
            if(amenList == null || amenList == 'undefined' ||  amenList == ""){
                console.error("err"+err);
                return res.json({code:500,message:'편의시설 조회 실패'+err})
            }
            const infoList = await selectDao.getInfoListDao(id);
            if(infoList == null || infoList == 'undefined' ||  infoList == ""){
                console.error("err"+err);
                return res.json({code:500,message:'이용안내 리스트 조회 실패'+err})
            }
            const score_sub = await selectDao.getScoreSubDao(id);
            if(score_sub == null || score_sub == 'undefined' ||  score_sub == ""){
                console.error("err"+err);
                return res.json({code:500,message:'리뷰 세분화 점수 조회 실패'+err})
            }
            score_sub[0].a_sum= parseFloat(score_sub[0].a_sum)
            score_sub[0].b_sum= parseFloat(score_sub[0].b_sum)
            score_sub[0].c_sum= parseFloat(score_sub[0].c_sum)
            score_sub[0].d_sum= parseFloat(score_sub[0].d_sum)


            const reviewList = await selectDao.getReviewListDao(id);

      
            
            
                for(let i = 0 ; i<reviewList.length; i++){
                    let review_time = new Date(reviewList[i].write_create_at);
                    let timeDiff = curDay - review_time ;
                    let result = Math.floor(timeDiff/1000/60/60)
                    if(result >=24){
                       let result1 =  Math.floor(result/24);
                        if(result1 > 7)
                        reviewList[i].write_create_at = reviewList[i].write_create_at = `${review_time.getFullYear()}. ${review_time.getMonth()+1} .${review_time.getDay()}`
                        else 
                        reviewList[i].write_create_at = result1 +'일전'
                    }
                    else if(result ==0){

                        viewList[i].write_create_at = review_time.getMinutes() +'분전 '
                    }
                    else{
                        reviewList[i].write_create_at = result + '시간전'
                    }               
                            }


                for(let i = 0 ; i<reviewList.length; i++){
                    if(reviewList[i].answer_create_at){
                        let answer_time = new Date(reviewList[i].answer_create_at);
                        let timeDiff1 = curDay - answer_time;
                        let answer_time_reulst = Math.floor(timeDiff1/1000/60/60)
                        if(answer_time_reulst >=24){
                            let answer_time_reulst1 =  Math.floor(answer_time_reulst/24);
                                if(answer_time_reulst1 > 7)
                             reviewList[i].answer_create_at = `${answer_time.getFullYear()}. ${answer_time.getMonth()+1} .${answer_time.getDay()}`
                                else 
                                reviewList[i].answer_create_at = answer_time_reulst1 +'일전'
                            }
                            else if(answer_time_reulst ==0){
                                viewList[i].answer_create_at = answer_time.getMinutes() +'분전 '
                            }
                            else{
                                reviewList[i].answer_create_at = answer_time_reulst + '시간전'
                            }

                    }
                    }


        const price_list =await selectDao.getPriceListDao(id);

        console.log("price_list"+price_list)
            try{
                let checkDay = new Date(startDate).getDay(); //주말 가격 비교하기 위해서
             //5, 6 은 주말가격
                if(checkDay == 5 || checkDay == 6 ){
                    for(let i = 0 ; i<productList.length; i++){
                        productList[i].room_price  =  price_list[i].weekday_room_price
                        productList[i].sleep_price = price_list[i].weekday_sleep_price
                        productList[i].room_time = price_list[i].weekday_room_time
                        productList[i].sleep_time = price_list[i].weekday_sleep_start
                        
                    }  
                 }
                 else{
                    for(let i = 0 ; i<productList.length; i++){
                        productList[i].room_price  =  price_list[i].weekend_room_price
                        productList[i].sleep_price = price_list[i].weekend_sleep_price
                        productList[i].room_time = price_list[i].weekend_room_time
                        productList[i].sleep_time = price_list[i].weekend_sleep_start
                    }
                 }                 
             }catch(err){
                 console.error('daycheck err '+ err);
             }
             
             //예약 된 방 가격 변경 -1  방번호 중복 제거 
            let product = productList.map((item)=>item.room_number);
            let reserve_room =  reserveList.filter((item)=>{
                return item.reserve_type == 1 
            })
            let reserve_sleep =  reserveList.filter((item)=>{
                return item.reserve_type == 2
            })


            //예약 된 방 가격 변경 -2 
            for(let i = 0; i< product.length; i++){
                for(let j = 0; j<reserve_room.length;j++){
                    if(product[i] == reserve_room[j].room_number){
                        productList[i].room_price ='예약마감'
                    }
                }   
                for(let j = 0; j<reserve_sleep.length;j++){
                    
                    if(product[i] == reserve_sleep[j].room_number){
                        productList[i].sleep_price ='예약마감'
                    }
                }   
            }

            connection.release();
            return res.json({code:200,isSucees:true,message:"데이터 요청 성공",checkIn:startDate,checkOut:endDate,imageList:imagelist,score:score,productList:productList,amenList:amenList,infoList:infoList,scoreSub:score_sub,reviewList:reviewList});
        } catch (err) {
           
            logger.error(`example non transaction Query error1\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err){
            logger.error(`example non transaction Query error2\n: ${JSON.stringify(err)}`);
            return false;
    }
};

exports.room= async function(req,res){
    const {product_number,room_number}= req.params
    const {startDate,endDate } = req.query;
    let result ={};
    try {
        const connection = await pool.getConnection(async conn => conn);
        try {
            
            const room_detail = await selectDao.getRoomDao(product_number,room_number);            
        
            try{
                let checkDay = new Date(startDate).getDay(); //주말 가격 비교하기 위해서
             //5, 6 은 주말가격
                if(checkDay == 5 || checkDay == 6 ){                   
                    room_detail[0].room_price  =  room_detail[0].weekday_room_price
                    room_detail[0].sleep_price = room_detail[0].weekday_sleep_price
                    room_detail[0].room_time = room_detail[0].weekday_room_time
                    room_detail[0].sleep_time = room_detail[0].weekday_sleep_start
                }
                 else{                  
                        room_detail[0].room_price  =  room_detail[0].weekend_room_price
                        room_detail[0].sleep_price = room_detail[0].weekend_sleep_price
                        room_detail[0].room_time = room_detail[0].weekend_room_time
                        room_detail[0].sleep_time = room_detail[0].weekend_sleep_start
                 }                 
             }catch(err){
                 console.error('daycheck err '+ err);
             }

                //예약 된 방 가격 변경 -1  방번호 중복 제거 
            const reserveList = await selectDao.getReserveRoomListDao(product_number,room_number,startDate,endDate);
             console.log(reserveList);
            let reserve_room =  reserveList.filter((item)=>{
                return item.reserve_type == 1 
            })
            let reserve_sleep =  reserveList.filter((item)=>{
                return item.reserve_type ==  2
            })
           console.log(" room_detail[0].sleep_time",room_detail[0] )

            //예약 된 방 가격 변경 -2   `   
                
                    if(room_detail[0].room_number == reserve_room[0].room_number){
                        room_detail[0].room_price ='예약마감'
                    }
             
                
                    if(room_detail[0].room_number == reserve_sleep[0].room_number){
                        room_detail[0].sleep_price ='예약마감'
                    }
                  
                    try{
                        result.product_title = room_detail[0].product_title
                        result.product_number = room_detail[0].product_number
                        result. room_number= room_detail[0].room_number
                        result.room_title=room_detail[0].room_title
                        result.adult_num=room_detail[0].adult_num
                        result.max_num=room_detail[0].max_num
                        result.room_price= room_detail[0].room_price
                        result.sleep_price= room_detail[0].sleep_price
                        result.room_time=room_detail[0].room_time
                        result.sleep_time=room_detail[0].sleep_time
                    }
                    catch(error){
                        console.error("result 에러"+error)
                    }
                 
            

                    connection.release();
            return res.json({code:200,isSucees:true,message:"데이터 요청 성공",result:result});
        } catch (err) {
            logger.error(`example non transaction Query error\n: ${JSON.stringify(err)}`);
            connection.release();
            return false;
        }
    } catch (err) {
        logger.error(`example non transaction DB Connection error\n: ${JSON.stringify(err)}`);
        return false;
    }
}


exports.checkJjim= async function(req,res){
    const   {email} = req.verifiedToken;
    const { product_number} = req.query;
    if(email =="" || email == "undefined"|| email == null){
        return res.json({code:301,isSucees:false,message:"로그인 되어있지 않습니다",login:'N'})
    }
    //객체로 나온다 
    const [JjimList] =await selectDao.getJjimList(email,product_number);
    if(JjimList.num == 0 || JjimList.num == "undeinfed" || JjimList.num == null){
      return res.json({code:200,isSucees:true,message:"찜되어 있지않습니다.",confirm:'N'})
    }

    return res.json({code:200,isSucees:true,message:"찜되어있습니다.",confirm:'Y'})
}


exports.clickJjim= async function(req,res){
    const   {email} = req.verifiedToken;
    const {product_number,confirm} = req.body;
    if(email =="" || email == "undefined"|| email == null){
        return res.json({code:301,isSucees:false,message:"로그인 되어있지 않습니다",login:'N'})
    }
    if(confirm =="" || confirm=="undefined" || confirm == null){
        return res.json({code:301,isSucees:false,message:"찜목록 상태를 알 수 없습니다."})
    }
    try{

        if(confirm == 'N'){
            await selectDao.insertJjim(email,product_number)
            return res.json({
                code:200,isSucees:true,message:"찜목록 추가",confirm :'Y'
            })
        } 
    
        
        if(confirm == 'Y'){
            await selectDao.deleteJjim(email,product_number)
            return res.json({
                code:200,isSucees:true,message:"찜목록 취소",confirm :'N'
            })
        } 
    }
    catch(err){
        console.error(err);
    }
}




exports.jjimList= async function(req,res){
    const   {email} = req.verifiedToken;
    const {startDate,endDate,human_count} = req.query;
    if(email =="" || email == "undefined"|| email == null){
        return res.json({code:301,isSucees:false,message:"로그인 되어있지 않습니다",login:'N'})
    }
    if(startDate == null || startDate =='undefined' || startDate=="")
    {
        res.json({code:400,isSucees:false,mesaage:"체크인 데이터가 없습니다."})
    }
    if(endDate == null || endDate =='undefined' || endDate=="")
    {
        res.json({code:400,isSucees:false,mesaage:"체크아웃 데이터가 없습니다."})
    }
    if(human_count == null || human_count =='undefined' || human_count=="")
    {
        res.json({code:400,isSucees:false,mesaage:"인원 수를 체크해주세요"})
    }

    try{
      const  number_list =  await selectDao.allJjimList(email) 
      let number = number_list.map((item)=>item.product_number);
      const product_list = await selectDao.getProduct(number);
        try{
            const product_list_title = product_list.map((item)=>{return item.id})

            const product_room = await searchDao.getReserveRoomDao(startDate,endDate); //  예약확인

             let product_number_array =  product_room.map((item)=>item.product_number); //예약된 상품명 가져오기

             let number_array= product_number_array.filter((item,index)=>{
                 return product_number_array.indexOf(item)===index
             }) //예약된 상품목록 (중복 제거)
             
             
             //reserve_type 1 대실 2 숙박
             const product_room_count= await searchDao.getRoomCountDao(number_array); // 상품 마다 갖고있는 방 갯수
             
             let checkDay = new Date(startDate).getDay(); //주말 가격 비교하기 위해서
             //5, 6 은 주말가격
             const room_price = await searchDao.getPriceDao(product_list_title);

            for(let i = 0 ; i<number_array.length;i++){ //예약된 방 카운터 체크           
                let room_check_list = product_room.filter((item)=>{
                    return item.product_number === number_array[i] &&  item.reserve_type == 1 
                })
                room_check_list = room_check_list.map((item)=>{
                    return item.room_number;
                })
                room_check_list = room_check_list.filter((item,index)=>{
                    return room_check_list.indexOf(item)===index
                })


                //숙박 방번호 체크
                let sleep_check_list = product_room.filter((item)=>{
                    return item.product_number === number_array[i] &&  item.reserve_type == 2 
                })
                sleep_check_list = sleep_check_list.map((item)=>{
                    return item.room_number;
                })
                sleep_check_list = sleep_check_list.filter((item,index)=>{
                    return room_check_list.indexOf(item)===index
                })
                //가격 리스트
                let price_list = room_price.filter((item)=>{
                    return item.product_number == number_array[i]
                })


                for( let j= 0; j<product_list.length; j++){
                    if(number_array[i] == product_list[j].id){
                        if( room_check_list.length == product_room_count[i].room_number_count ){
                            product_list[j].room_price="예약마감"
                        }
                        else{
                           for(let k = 0; k<price_list.length; k++){
                            if(sleep_check_list.length == 0 ){
                                if(checkDay == 5 || checkDay == 6 ){
                                    product_list[j].room_price = price_list[0].weekday_room_price
                                    }
                                    else{
                                    product_list[j].room_price = price_list[0].weekend_room_price
                                    }
                            }
                           else if(room_check_list[k] !=price_list[k] ){
                                if(checkDay == 5 || checkDay == 6 ){
                                product_list[j].room_price = price_list[k].weekday_room_price
                                }
                                else{
                                product_list[j].room_price = price_list[k].weekend_room_price
                                }
                               }
                           }
                        }
                    }
                }
                for( let j= 0; j<product_list.length; j++){
                    if(number_array[i] == product_list[j].id){
                        if( sleep_check_list.length == product_room_count[i].room_number_count ){
                            product_list[j].sleep_price="예약마감"
                        }
                        else{
                           for(let k = 0; k<price_list.length; k++){
                                if(sleep_check_list.length == 0 ){
                                    if(checkDay == 5 || checkDay == 6 ){
                                        product_list[j].sleep_price = price_list[0].weekday_sleep_price
                                        }
                                        else{
                                        product_list[j].sleep_price = price_list[0].weekend_sleep_price
                                        }
                                }
                               else if(sleep_check_list[k] !=price_list[k]){
                                if(checkDay == 5 || checkDay == 6 ){
                                product_list[j].sleep_price = price_list[k].weekday_sleep_price
                                }
                                else{
                                product_list[j].sleep_price = price_list[k].weekend_sleep_price
                                }
                               }
                           }
                        }
                    }
                }
             }


            try{
                console.log("product_list",product_list);
                console.log("room_price",room_price);
                if(checkDay == 5 || checkDay == 6 ){
                    for(let i = 0 ; i<product_list_title.length; i++){
                        let price = room_price.filter((item)=>{
                            return item.product_number == product_list[i].id; 
                        })
                        console.log("price,",price)
                    if(product_list[i].room_price != '예약마감' || product_list[i].room_price == "" || product_list[i].room_price <= 1 ){
                            product_list[i].room_price  =  parseInt(price[0].weekday_room_price) 
                        }
                        if(product_list[i].sleep_price != '예약마감' || product_list[i].sleep_price == "" || product_list[i].sleep_price <= 1 ){
                            product_list[i].sleep_price = parseInt(price[0].weekday_sleep_price)
                        }
                        product_list[i].sleep_price = parseInt(price[0].weekday_sleep_price)
                        product_list[i].room_time = parseInt(price[0].weekday_room_time)
                        product_list[i].sleep_time =parseInt(price[0].weekday_sleep_start)
                        product_list[i].review_score =parseFloat(product_list[i].review_score)
                    }
                 }
                 else{
                    for(let i = 0 ; i<product_list_title.length; i++){

                        let price = room_price.filter((item)=>{
                            return item.product_number == product_list[i].id; 
                        })
                        console.log("price,",price)
                        if(product_list[i].room_price != '예약마감' || product_list[i].room_price == "" || product_list[i].room_price <= 1){
                            product_list[i].room_price  =  parseInt(price[0].weekend_room_price) 
                        }
                        if(product_list[i].sleep_price != '예약마감' || product_list[i].sleep_price == "" || product_list[i].sleep_price <= 1){
                            product_list[i].sleep_price = parseInt(price[0].weekend_sleep_price)
                        }
                        product_list[i].room_time =  parseInt(price[0].weekend_room_time)
                        product_list[i].sleep_time = parseInt(price[0].weekend_sleep_start)
                        product_list[i].review_score =parseFloat(product_list[i].review_score)
                    }
                 }                 
             }catch(err){
                 console.error('daycheck err '+ err);
             }
             
               
             res.json({code:200,isSucees:true,message:"찜목록 요청 성공",product_list:product_list})
        }
        catch(err){
            console.error(err);
        }
    }
    
    catch(err){
        console.error(err);
    }
}