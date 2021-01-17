const { pool } = require("../../../config/database");

// index
async function defaultDao() {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
  select id, sub_title from entire_title
  `;

  const [rows] = await connection.query(selectEmailQuery);
  connection.release();

  return rows;
}


async function getRecentProduct(map_number,submap_number,entire_number){
    const connection = await pool.getConnection(async(conn)=>{conn});
    const query  =`
    select 
    p.id,
    p.product_title ,
    pi2.image_url ,
      round((sum(prs.review_a +prs.review_b +prs.review_c +prs.review_d)/count(prs.review_number )/4),2) as score,
     count(prw.review_number) as review_count
    from  product p
    inner join 
        map_product mp 
    on
        p.id = mp.product_number 
    inner join 
        title_product tp 
    on 
    p.id =tp.product_number 
    inner join 
        product_image pi2 
    on
        p.id = pi2.product_number 
    and
        pi2.room_number = 0 
     left outer join 
         product_review pr
     on p.id = pr.product_number 
     left outer join 
         product_review_score prs 
     on pr.id  = prs.review_number 
     left outer join 
         product_review_writer prw
     on pr.id  = prw.review_number 

 
    where 
    mp.map_number = ? and  mp.submap_number =?  and tp.entire_number = ?
 
     GROUP by p.id, pi2.image_url

     ORDER by score DESC 
	 `

     //3 2 7 example number 
    const params = [map_number,submap_number,entire_number];

    const [recentList] = await connection.query(query,params);
    connection.release();
    return recentList;
    }


module.exports = {
  defaultDao,
  getRecentProduct,
};
