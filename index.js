//express 모듈 불러오기
const express = require("express");
const { json } = require("express/lib/response");

//express 사용
const app = express();

const conn = require('./config/mysql') 
const db = conn.init() 
conn.open(db)

//Express 4.16.0버전 부터 body-parser의 일부 기능이 익스프레스에 내장 body-parser 연결 
app.use(express.json());
app.use(express.urlencoded({ extended: true}));

app.post("/home", (req, res) => {

    const { user_id, page } = req.body

    const start = Number(page) * 3 - 3
    const end =  Number(start) + 2

    let id =[-1,-1,-1]
    let name = ["","",""]
    let score = [-1,-1,-1]
    
    db.query(`SELECT * FROM vedio limit ${start}, 3`,function(err,results){
        if (err){
            res.json({ok: false})
            throw err
        }
        for(let i=0; i<3; i++){
            if(results.length>i){
                id[i]=results[i].video_id
                name[i]=results[i].video_name
            }
        }

        console.log(id[0],user_id)
        db.query(`SELECT video_id, score FROM score WHERE (video_id = '${id[0]}' OR video_id = '${id[1]}' OR video_id = '${id[2]}') AND user_id = '${user_id}';`, function(err,results){
            if(err) {
                res.json({ok: false})
                throw err;
            }
            results.forEach(element => {
                score[element.video_id]=element.score
            });
            console.log(results)
            res.json(
                {
                    "firstVideo" : {
                        "id" : id[0],
                        "name" : name[0],
                        "score" : score[0]
                    },
                    "secondVideo" : {
                        "id" : id[1],
                        "name" : name[1],
                        "score" : score[1]
                    },
                    "thirdVideo" : {
                        "id" : id[2],
                        "name" : name[2],
                        "score" : score[2]
                    }
                }
            )
        })
    })
})

app.post('/info', (req, res)=>{

    const { video_id, user_id } = req.body
    
    db.query(`SELECT video_name FROM vedio WHERE video_id = '${video_id}';`,function(err,results){
        if (err){
            res.json({ok: false})
            throw err
        }
        let vedioName = "-";
        if(results.length>0){
            vedioName = results.video_name
        }
        db.query(`SELECT score FROM score WHERE video_id = '${video_id}' AND user_id = '${user_id}';`,function(err,results){
            if (err){
                res.json({ok: false})
                throw err
            }
            let myScore = -1;
            if(results.length>0){
                myScore=results[0].score
            }
            db.query(`SELECT user_id, score FROM score WHERE video_id='${video_id}' ORDER BY score DESC LIMIT 10`,function(err,results){
                if (err){
                    res.json({ok: false})
                    throw err
                }
                console.log(results)
                res.json(
                    {
                        "videoName" : "asdf",
                        "myScore" : myScore,
                        "rank" : results
                    }
                )
            })
        })
    })
});

app.post('/update', (req, res)=>{

    const { user_id, score, video_id } = req.body
    
    db.query(`SELECT score FROM score WHERE video_id = '${video_id}' AND user_id = '${user_id}';`,function(err,results){
        if (err){
            res.json({ok: false})
            throw err
        }
        let myScore = 0;
        if(results.length>0){
            myScore = results[0].score
            console.log(`이미 점수 있음, 이전점수 : ${myScore}, 새 점수 : ${score} `)
            if(myScore < score) {
                console.log("점수 갱신해야함")
                db.query(`UPDATE score SET score='${score}' WHERE video_id = '${video_id}' AND user_id = '${user_id}';`,function(err,results){
                    console.log(results)
                })
            }
        }
        else{
            console.log("점수 없음")
            db.query(`INSERT INTO score (video_id, score, user_id) VALUES ('${video_id}', '${score}', '${user_id}');`)
        }
    })
    res.json({ok: true})

});
  
// http listen port 생성 서버 실행
app.listen(3000);