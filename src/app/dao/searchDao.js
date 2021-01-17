const { pool } = require("../../../config/database");

async function searchListDao(ip){
    const connection = await pool.getConnection(async(conn)=>{conn})
    const query = `    
    select
        search, 
        start_date, 
        end_date, 
        update_at, 
        adult_num
    from 
        recent_search 
    
    where ip =INET_ATON(?)
    order by 
        update_at DESC 
     limit 6 offset 0    ;

    `
    const params = [ip];

       
    const [searchList] = await connection.query(query,params);
    connection.release();
    return searchList;
}










//리스트 조회
async function getListDao(entire_title,search){
    const connection = await pool.getConnection(async(conn)=>{conn});
 
    
    const query = `
   
     select	
     p.id,
     p.product_title,
     pi2.image_url,
     round((sum(prs.review_a+prs.review_b+prs.review_c+prs.review_d)/count(prs.review_number)/4),2) as review_score,
     count(prs.review_number) as review_sum	,
     p.product_event
     from product p 
     inner join
         product_image pi2
     on 
         p.id = pi2.product_number 
     AND 
         pi2.room_number =0 
     inner join 
         map_product mp 
     on 
         p.id = mp.product_number 
     inner join 
         entire_map em 
     on
         mp.map_number = em.id 
     inner  join 
         title_product tp
     on
         p.id = tp.product_number 
     inner  join 
         entire_title et 
     on 
         tp.entire_number = et.id 
     inner join 
         product_subway ps 
     on
         ps.product_number  = p.id 
     
        left outer join 
              product_review pr
          on 
              p.id = pr.product_number 
         left outer join 
              product_review_score prs 
          on pr.id  = prs.review_number 
        left outer join 
              product_review_writer prw
          on
              pr.id  = prw.review_number 
   
         where et.entire_title = ?  and em.map_title like '%${search}%' or p.product_title like '%${search}%' or ps.subway_title like '%${search}%' or ps.subway_sub_title like '%${search}%'
         
         GROUP  by p.id,pi2.image_url
             limit 6 offset  0   
         
    `
    
        const params = [entire_title];
        
        const [list] = await connection.query(query,params);
        connection.release();
        return list;
 
    }





async function getReserveRoomDao(startDate,endDate){ //숙박 예약확인
    const connection = await pool.getConnection(async(conn)=>{conn});
    const query = `select product_number, room_number  	,reserve_type
	from 
		product_reservation 
	WHERE 
		reserve_start BETWEEN  ? AND ?   
	OR
        reserve_end   BETWEEN ? AND ? 

	group by product_number  ,room_number,reserve_type
    `
     //3 2 7 example number 
    const params = [startDate,endDate,startDate,endDate];

        const [Reserve] = await connection.query(query,params);
        connection.release();
        return Reserve;
  
    }


    async function getRoomCountDao(number_array){
        const connection = await pool.getConnection(async(conn)=>{conn});
        const query = ` 
         select product_number ,count(room_number) as room_number_count
        from product_room pr
        where product_number in (?)
        group by product_number

        `
         //3 2 7 example number 
        const params = [number_array];
    
            const [Reserve] = await connection.query(query,params);
            connection.release();
            return Reserve;
    
        }
    

        async function getPriceDao(number_array){
        const connection = await pool.getConnection(async(conn)=>{conn});
        const query = `
        select 
        pp.product_number, 
         pp.room_number,
          pp.weekend_room_price,
          pp.weekday_room_price,
          pp.weekday_sleep_price, 
          pp.weekend_sleep_price,
          prt.weekday_room_time,	
          prt.weekend_room_time,
          prt.weekday_sleep_start,
          prt.weekend_sleep_start
      from 
          product_price pp
      inner join
          product_room_time prt
      on
          pp.product_number = prt.product_number 
      and 
          pp.room_number = prt.room_number 
      where 
            pp.product_number in(?)
         limit 6 offset  0 
                   `
        const params = [number_array]
   
            const [Reserve] = await connection.query(query,params);
            connection.release();
            return Reserve;
        }

            //검색 기록 저장
        async function getRoomCountDao(number_array){
            const connection = await pool.getConnection(async conn=>conn );
            const query = ` 
             select product_number ,
             count(room_number) as room_number_count
            from product_room pr
            where product_number in (?)
            group by product_number
    
            `
             //3 2 7 example number 
            const params = [number_array];
        
                const [Reserve] = await connection.query(query,params);
                connection.release();
                return Reserve;
        
            }
        
    
            async function insertSearch(search,startDate,endDate,update_at,human_count,ip){
            const connection = await pool.getConnection(async(conn)=>{conn});
            const query = `
            INSERT INTO yanolja.recent_search
            (search, start_date, end_date, update_at, adult_num,  ip)
            VALUES(?, ?, ?, ?, ?,INET_ATON(?))`
            const params = [search,startDate,endDate,update_at,human_count,ip]
            
       
                const [Reserve] = await connection.query(query,params);
                connection.release();
                return Reserve;
            }

        async function deleteAllDao(ip){
            const connection = await pool.getConnection(async conn => conn);
            const query =`
            delete from recent_search where ip =  INET_ATON( ?) 
            `
            const parms = [ip];
             const [list] = await connection.query(query,ip);
             console.log(list);
            connection.release(); 
            return list;
            
            
        }

        async function deleteIdDao(id,ip){
            const connection = await pool.getConnection(async conn => conn);
            const query= `
            delete from recent_search where id = ? and ip =INET_ATON(?)
            `

            const params =[id,ip]
            const [result] =await connection.query(query,params);
            connection.release();
            return result; 
          
        }
module.exports = {
    getReserveRoomDao,
    getRoomCountDao,
    getListDao,
    getPriceDao,
    insertSearch,
    searchListDao,
    deleteAllDao,
    deleteIdDao
};
