const { pool } = require("../../../config/database");

// index
async function getPrice(product_number,room_number) {
  const connection = await pool.getConnection(async (conn) => conn);
  const query = `
  select 
		pp.weekday_room_price ,
		pp.weekend_room_price ,
		pp.weekday_sleep_price,
		pp.weekend_sleep_price 
	FROM 
		product_price pp 
	inner join
		product_room pr 
	on
		pp.product_number = pr.product_number 
	AND 
		pp.room_number  = pr.room_number 
	where	
		pr.product_number  = ? and pr.room_number = ? 
		
  `;

 const params = [product_number,room_number]
  const [rows] = await connection.query(query,params);
  connection.release();

  return rows;
}


async function getList(product_number,room_number){
    const connection = await pool.getConnection(async(conn)=>{conn});
    const query  =`
        
    select 
        p.product_title ,
        pr.room_title 

        
    from 
        product p 
    inner join 
        product_room pr 
    on
        p.id = pr.product_number 
    where 
        p.id = ? and pr.room_number  =?

	 `

     //3 2 7 example number 
    const params = [product_number,room_number];

    const [list] = await connection.query(query,params);
    connection.release();
    return list;
    }

    async function getSaleType(){
        const connection = await pool.getConnection(async(conn)=>{conn});
        const query  =`
            
        select 
            id,
            type_nmae ,
            image_url 
        from sale_type st 
    
         `
    
         //3 2 7 example number 
   
    
        const [list] = await connection.query(query);
        connection.release();
        return list;
        }

module.exports = {
    getList,
  getPrice,
  getSaleType
};
