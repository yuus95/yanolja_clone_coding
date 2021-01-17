const { pool } = require("../../../config/database");

// index
async function getImageDao(id) {
  const connection = await pool.getConnection(async (conn) => conn);
  const query = `
  select  image_url from product_image where product_number = ? ORDER by room_number asc
  `;
    const params = [id];
  const [rows] = await connection.query(query,params);
  connection.release();
  return rows;
}

async function getScoreDao(id) {
    const connection = await pool.getConnection(async (conn) => conn);
    const query = `
    select 
	p.id ,
	p.product_title ,
	round((sum(prs.review_a+prs.review_b+prs.review_c+prs.review_d)/count(prs.review_number)/4),2)   as review_score,
	COUNT(product_number) review_number ,
	COUNT(ra.review_number) answer_number 
	from product p 
	inner join 
		product_review pr 
	on
		p.id = pr.product_number 
	inner join 
		product_review_score prs
	on
		pr.id  = prs.review_number 	
	left outer join 
		review_answer ra 
	on 
		pr.id = ra.review_number 
	where p.id = ?
    `;
      const params = [id];
    const [score] = await connection.query(query,params);
    connection.release();
    return score;
  }
  
  async function getProductListDao(id){
      const connection = await pool.getConnection(async conn=> conn);
      const query = `
      select 
		pr.room_number ,
		pr.room_title ,
		pr.memo,
		pr.adult_num as standard_num ,
		pr.max_num,
		pi2.image_url 
        from product p
        inner join 
            product_room pr 
        on
            p.id = pr.product_number        
        left outer join
            product_image pi2 
        on 
            p.id = pi2.product_number 
        AND 
            pi2.room_number = pr.room_number 
        and pi2.image_number = 1
        

        where p.id  = ?
        ORDER by  pr.room_number 
        
      `
    
      const params  = [id];
      
      const [productList] = await connection.query(query,params);

      connection.release();

      return productList;
  }


    async function getReserveListDao(id,startDate,endDate){
        const connection = await pool.getConnection( async conn => conn);
        const query =`
        select 
        room_number,
        reserve_type
        from  product_reservation 
        where
         reserve_start>= ? 
        and
         reserve_start< ?
        and      
        reserve_end > ?
        and reserve_end  <= ?
     and product_number  = ?
        `
        
        const params = [startDate,endDate,startDate,endDate,id]

        const [reserveList] = await connection.query(query,params);

        connection.release();
  
        return reserveList;

    }

    async function getReserveRoomListDao(product_number,room_number,startDate,endDate){
        const connection = await pool.getConnection( async conn => conn);
        const query =`
        select 
        room_number,
        reserve_type
        from  product_reservation 
        where
         reserve_start>=? 
        and
         reserve_start< ?
        and      
        reserve_end > ?
        and reserve_end  <= ?
        and product_number  = ?
        and room_number = ?
        `
        
        const params = [startDate,endDate,startDate,endDate,product_number,room_number]

        const [reserveList] = await connection.query(query,params);

        connection.release();
  
        return reserveList;

    }

    async function getAmenListDao(id){
        const connection = await pool.getConnection(async conn => conn);
        const query = `
        select 
        amenities_title
        from product_amenities pa
        inner join
            amenities a 
        on 
            a.id = pa.id 
        where 
            product_number = ?
        
        `
        const params = [id];

        const [list] = await connection.query(query,params);

        connection.release();

        return list ;

 
 
    }

    async function getInfoListDao(id){
        const connection = await pool.getConnection(async conn => conn);
        const query = `
		select 
		pi2.info_title,
		pim.inifo_memo
		
		from product_info pi2
		inner join
			product_info_memo pim
		on
			pi2.id = pim.info_number 
		WHERE 
			pi2.product_number = ?
        
        `
        const params = [id];

        const [list] = await connection.query(query,params);

        connection.release();

        return list ;

    }

    
    async function getScoreSubDao(id){
        const connection = await pool.getConnection(async conn => conn);
        const query = `
		
        select 
            round(sum(prs.review_a)/count(pr.id),2) as a_sum ,
            round(sum(prs.review_b)/count(pr.id),2) as b_sum,
            round(sum(prs.review_c)/count(pr.id),2) as c_sum,
            round(sum(prs.review_d)/count(pr.id),2) as d_sum
        from product_review pr
        inner join
            product_review_score prs 
        on
            pr.id  = prs.review_number 

        where 
            pr.product_number = ?
        
        
        `
        const params = [id];

        const [list] = await connection.query(query,params);

        connection.release();

        return list ;

    }

    async function getReviewListDao(id){
        const connection = await pool.getConnection(async conn => conn);
        const query = `
		
     	select 
			pr.id ,
			room_number ,
			user_number ,
			prw.review_content ,
			prw.create_at as write_create_at,
			ra.review_content as review_answer_content,
			ra.create_at as answer_create_at
		from 
			product_review pr 
		inner join
			product_review_writer prw 
		on	
			pr.id  = prw.review_number 
		left outer  join 
			review_answer ra 
		on 
			pr.id  = ra.review_number 
		where 
			pr.product_number  = ?
        
        `
        const params = [id];

        const [list] = await connection.query(query,params);

        connection.release();

        return list ;
    }

    async function getRoomDao(product_number,room_number){
        const connection = await pool.getConnection(async conn => conn);
        const query = `
		
     			
	select 
	p.product_title,
	pr.product_number ,
	pr.room_number ,
	pr.room_title ,
	pr.adult_num ,
	pr.max_num,
	pp.weekday_room_price,
	pp.weekend_room_price,
	pp.weekday_sleep_price ,
	pp.weekend_sleep_price ,
	pp.weekday_room_sale ,
	pp.weekend_sleep_sale ,
    prt.weekday_room_time ,
    prt.weekend_room_time ,
	prt.weekday_use_start ,
	prt.weekday_sleep_end ,
	prt.weekend_sleep_start ,
	prt.weekend_sleep_end 
	
	from product p
	inner join
		product_room pr
	on
		p.id = pr.product_number 
	inner join 
		product_price pp 
	on 
		p.id = pp.product_number 
	AND 
		pp.room_number  = pr.room_number 
	INNER JOIN 
		product_room_time prt 
	on
		p.id = prt.product_number 
	and 
		pr.room_number = prt.room_number 
	where
		p.id = ?
	AND 
		pr.room_number = ?	
		     
        `
        const params = [product_number,room_number];

        const [list] = await connection.query(query,params);

        connection.release();

        return list ;
    }

    async function getPriceListDao(id){
        const connection = await pool.getConnection(async conn=> conn);
        const query = `
           	
     select 
     pp.room_number,
        pp.weekday_room_price,
        pp.weekend_room_price,
        pp.weekday_sleep_price ,
        pp.weekend_sleep_price ,
        pp.weekday_room_sale ,
        pp.weekend_sleep_sale ,
        prt.weekday_room_time ,
        prt.weekend_room_time,
        prt.weekday_use_start ,
        prt.weekday_sleep_end ,
        prt.weekend_sleep_start ,
        prt.weekend_sleep_end 
        from product p
        inner join 
                product_room pr 
        on 
            p.id  = pr.product_number 
        INNER JOIN
            product_price pp
        on	
            p.id = pp.product_number 
         AND 
               pr.room_number  = pp.room_number 
        INNER JOIN 
            product_room_time prt 
        on
            p.id = prt.product_number  
         and
               pr.room_number  = prt.room_number 

        where p.id  =?
          
        `
      
        const params  = [id];
        
        const [productList] = await connection.query(query,params);
  
        connection.release();
  
        return productList;
    }



    
    async function getJjimList(email,product_number){
        const connection = await pool.getConnection(async conn=> conn);
        const query = `
        select count(*) as num from user_jjim where email ='${email}'  and product_number = ${product_number}
        `
        
        const [JjimList] = await connection.query(query);
        
        connection.release();
  
        return JjimList;
    }
    async function insertJjim(email,product_number){
        const connection = await pool.getConnection(async conn=> conn);
        const query = `
                 
        INSERT INTO yanolja.user_jjim
        (email, product_number)
        VALUES('${email}',${product_number});
       
        `
        
        await connection.query(query);
  
        connection.release();
  
        return 
    }
    async function deleteJjim(email,product_number){
        const connection = await pool.getConnection(async conn=> conn);
        const query = `
        DELETE FROM yanolja.user_jjim
        WHERE email='${email}' AND product_number=${product_number};
        `
        
       await connection.query(query);
  
        connection.release();
  
        return ;
    }


    async function allJjimList(email){
        const connection = await pool.getConnection(async conn=> conn);
        const query = 
        `
        select product_number from user_jjim where email ='${email}' 
        `
        
       const [numberList] = await connection.query(query);
  
        connection.release();
  
        return numberList;
    }

    
    async function getProduct(number){
        const connection = await pool.getConnection(async conn=> conn);
        const query = 
        `
        select 
        p.id,
        p.product_title,
        pi2.image_url,
        round((sum(prs.review_a+prs.review_b+prs.review_c+prs.review_d)/count(prs.review_number)/4),2)   as review_score,
        COUNT(prs.review_number) review_number 
        
        from
            product p
        inner join
            product_image pi2 
        on
            p.id = pi2.product_number 
        AND 
            pi2.room_number = 0
        left outer join 
            product_review pr 
        on 
            p.id = pr.product_number 
        left outer join 
            product_review_score prs 
        on 
            pr.id  = prs.review_number 
            
        where p.id in(${number})
        group by p.id ,p.product_title,pi2.image_url 
        limit 6 offset   0 
        `
       const [productList] = await connection.query(query);
  
        connection.release();
  
        return productList;
    }




module.exports = {
    getImageDao,
    getScoreDao,
    getProductListDao,
    getReserveListDao,
    getAmenListDao,
    getInfoListDao,
    getScoreSubDao,
    getReviewListDao,
    getRoomDao,
    getReserveRoomListDao,
    getPriceListDao,
    getJjimList,
    insertJjim,
    deleteJjim,
    allJjimList,
    getProduct
};
