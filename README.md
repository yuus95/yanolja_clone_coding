# Yanolja Clone Coding


## Stack
- JavaScript
- Node.js
- Mysql

---
## API LIST

- [API 설계도](https://drive.google.com/file/d/1lr93dLlsv-AmaLWyeUVuqTJQ8KcnuRBJ/view)

---
## 요약 
- 야놀자 어플을 보면서 BackEnd 부분을 임의로  클론코딩해봤습니다.

- 클라이언트에서 들어오는 데이터에 대하여 유효성검사를 철저히 했습니다.

```javascript

// 찜리스트 검색 API 중 일부분
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

```

- await 함수와 Try catch문을 대부분 메소드에 활용했습니다.
```javascript
// 지역별 모텔 전체 조회 코드 
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
```