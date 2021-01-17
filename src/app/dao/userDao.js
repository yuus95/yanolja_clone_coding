const { pool } = require("../../../config/database");

// Signup
async function userEmailCheck(email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectEmailQuery = `
                SELECT email, nickname 
                FROM user 
                WHERE email = ?;
                `;
  const selectEmailParams = [email];
  const [emailRows] = await connection.query(
    selectEmailQuery,
    selectEmailParams
  );
  connection.release();

  return emailRows;
}

async function userNicknameCheck(nickname) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectNicknameQuery = `
                SELECT email, nickname 
                FROM user 
                WHERE nickname = ?;
                `;
  const selectNicknameParams = [nickname];
  const [nicknameRows] = await connection.query(
    selectNicknameQuery,
    selectNicknameParams
  );
  connection.release();
  return nicknameRows;
}

async function insertUserInfo(insertUserInfoParams) {
  const connection = await pool.getConnection(async (conn) => conn);
  const insertUserInfoQuery = `
    INSERT INTO user
    (email, user_pw, nickname)
    VALUES(?, ?, ?);
    
    `;
  const insertUserInfoRow = await connection.query(
    insertUserInfoQuery,
    insertUserInfoParams
  );
  connection.release();
  return insertUserInfoRow;
}

//SignIn
async function selectUserInfo(email) {
  const connection = await pool.getConnection(async (conn) => conn);
  const selectUserInfoQuery = `
                SELECT email , user_pw, nickname ,status,phone
                FROM user 
                WHERE email = ?;
                `;

  let selectUserInfoParams = [email];
  const [userInfoRows] = await connection.query(
    selectUserInfoQuery,
    selectUserInfoParams
  );
  connection.release();
  return [userInfoRows];
}

async function deleteUser(email){
  const connection = await pool.getConnection(async(conn)=>conn);
  const query = `
  update user set status ='DELETED' where email = '${email}' 
  `
  console.log(query);
   await connection.query(query);

   connection.release();
   return 
}

  //비밀번호변경
  async function updatePassword(email,hashedPassword){
    const connection = await pool.getConnection(async(conn)=>conn);
    const query = `
    update user set user_pw ='${hashedPassword}'  where email  = '${email}'
    `
     await connection.query(query);
  
     connection.release();
     return 
  }
  //번호변경
  async function updatePhoneNumber(email,newPhoneNumber){
    const connection = await pool.getConnection(async(conn)=>conn);
    const query = `
    update user set phone ='${newPhoneNumber}'  where email  = '${email}'
    `
     await connection.query(query);
  
     connection.release();
     return 
  }
module.exports = {
  userEmailCheck,
  userNicknameCheck,
  insertUserInfo,
  selectUserInfo,
  deleteUser,
  updatePassword,
  updatePhoneNumber
};
