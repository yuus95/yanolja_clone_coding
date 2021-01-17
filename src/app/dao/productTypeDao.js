const { pool } = require("../../../config/database");

// index
async function entireListDao() {
  const connection = await pool.getConnection(async (conn) => conn);
  const query = `
  select 
  em.id  entire_id,
  em.map_title,
  sm.id as sub_id ,
  sm.title  as sub_title
  from entire_map em
  inner join 
      sub_map sm 
  on
      em.id = sm.map_number 
  `;

  const [rows] = await connection.query(query);
  connection.release();

  return rows;
}

async function getMotelDao(entire_number,sub_number){
    const connection = await pool.getConnection(async conn => conn);
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
        sub_map sm 
    on
       sm.map_number =em.id       
    
       left outer join 
             product_review pr
         on 
             p.id = pr.product_number 
        left outer join 
             product_review_score prs 
         on pr.id  = prs.review_number 
       left outer join 
             product_review_writer prw
         on              pr.id  = prw.review_number 
                    
  
        where et.entire_title = '국내숙소' and    em.id = ?   and sm.id = ?
        
        GROUP  by p.id,pi2.image_url
    `
    const params = [entire_number,sub_number];

   const [list] = await connection.query(query,params)
   connection.release();
   return list;

}

async function getRecentMotel(sub_title,sub_sub_title){
    const connection = await pool.getConnection(async conn => conn);
    const query = `
    select 
    p.id,
	p.product_title ,
	pi2.image_url ,
	(round(sum(prs.review_a +prs.review_b +prs.review_c +prs.review_d )/4/count(prs.review_number ),2)) as score,
	count(prs.review_number ) as num
	from
		product p 
	
	inner join 
		map_product mp 
	on 
		p.id = mp.product_number 
	inner join 
		entire_map em 
	on 
		mp.map_number = em.id 
	inner join 
		sub_map sm 
	on 
		mp.submap_number  = sm.id 
	inner join 
		sub_sub_map ssm 
	on 
        ssm.id  = mp.sub_sub_map_number 
    left outer join 
		product_image pi2 
	on 
		p.id = pi2.product_number 
	AND 
		pi2.room_number = 0
	left outer join 
			product_review pr 
	on 
		p.id  = pr.product_number 
	left outer join 
		product_review_score prs 
	on 
		pr.id  = prs.review_number 
		
	where 
		sm.title  like  '%${sub_title}%' or ssm.title like  '%${sub_sub_title}%'
	group by p.id ,pi2.image_url 
	
    `
   const [list] = await connection.query(query)
   connection.release();
   return list;
} 

async function getPrice(idList){
    const connection = await pool.getConnection(async conn => conn);
    const query = `
    

	select 
    pp.product_number ,
    pp.weekday_sleep_price ,
    pp.weekend_sleep_price 
    from 
    product_price pp 
    where  pp.product_number  in(${idList})
    and pp.room_number = 1
        
    `
   const [list] = await connection.query(query)
   connection.release();
   return list;
} 




module.exports = {
    entireListDao,
    getMotelDao,
    getRecentMotel,
    getPrice
};
