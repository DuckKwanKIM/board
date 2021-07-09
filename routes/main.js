const { render } = require("ejs");
var express = require("express");
var router = express.Router();
var moment = require("moment");
require('dotenv').config();
var mysql = require("mysql2");

var connection = mysql.createConnection({
    host : process.env.host, //127.0.0.1
    port : process.env.port,
    user : process.env.user,
    password : process.env.password,
    database : process.env.database
});

router.get("/", function(req, res, next){
    if(!req.session.logged){
        res.redirect("/")
    }else{
    connection.query(
        `select * from board`,
        function(err, result){
            if(err){
                console.log(err);
                res.send("select Error")
            }else{
                console.log(result)
                // res.send(result.length)
                res.render('index',{
                    content : result,
                    name : req.session.logged.name
                })
            }
        }
    )}
})

router.get("/add", function(req, res, next){
    if(!req.session.logged){
        res.redirect("/board")
    }else{
    res.render('add', {
        name : req.session.logged.name
    })
    }
})

router.post("/add_2", function(req, res, next){
    var title = req.body.title;
    var content = req.body.content;
    var img = req.body.img;
    var date = moment().format("YYYY-MM-DD");
    var time = moment().format("hh:mm:ss");
    console.log(title, content);
    if(!req.session.logged){
        res.redirect("/board")
    }else{
        var author = req.session.logged.name;
        var post_id = req.session.logged.post_id;
        connection.query(
            `insert into board(title, content, img, date, time, author, post_id) value(?, ?, ?, ?, ?, ?, ?)`,
            [title, content, img, date, time, author, post_id],
            function(err, result){
                if(err){
                    console.log(err);
                    res.send("add insert Error")
                }else{
                    res.redirect("/board")
                }
            }
        )
    }
})

router.get("/info", function(req, res, next){
    var no = req.query.no;
    console.log(no);
    if(!req.session.logged){
        res.redirect("/board")
    }else{
        connection.query(
            `select * from board where No = ?`,
            [no],
            function(err, result){
                if(err){
                console.log(err)
                res.send("info select Error")
            }else{
                connection.query(
                    `select * from comment where parent_num = ?`,
                    [no],
                    function(err2, result2){
                        if(err2){
                            console.log(err2);
                            res.render("Error", {
                                message : "게시글의 댓글 출력 에러"
                            })
                        }else{
                            console.log(req.session.logged.post_id)
                            res.render('info', {
                                content : result,
                                opinion : result2,
                                post_id : req.session.logged.post_id,
                                name : req.session.logged.name
                                
                            })
                        }
                    }
                )}
            }
        )
    }
})

router.get("/del", function(req, res, next){
    var no = req.query.no;
    console.log(no);
    if(!req.session.logged){
        res.redirect("/board")
    }else{
        connection.query(
            `delete from board where No = ?`,
            [no],
            function(err, result){
                if(err){
                console.log(err)
                res.send("delete Error")
            }else{
                res.redirect("/board", {
                    name : req.session.logged.name
                    })
                }
            }
        )
    }
})

router.get("/update", function(req, res, next){
    var no = req.query.no;
    console.log(no);
    if(!req.session.logged){
        res.redirect("/")
    }else{
        connection.query(
            `select * from board where No = ?`,
            [no],
            function(err, result){
                if(err){
                    console.log(err)
                    res.send("update select Error")
                }else{
                    res.render('update' ,{
                        content : result,
                        name : req.session.logged.name
                    })
                }
            }
        )
    }
})

router.post("/update_2", function(req, res, next){
    var no = req.body.no;
    var post_id = req.body.post_id;
    var title = req.body.title;
    var content = req.body.content;
    console.log(no, title, content);
    if(!req.session.logged){
        res.redirect("/")
    }else{
        if(post_id == req.session.logged.post_id){     //작성자 == 로그인 아이디
            connection.query(
                `update board set title = ?, content = ? where No = ?`,
                [title, content, no],
                function(err, result){
                    if(err){
                        console.log(err);
                        res.send("update_2 update Error")
                    }else{
                        res.redirect("/board")
                    }
                }
            )
        }else{
            res.send("작성자와 로그인 한 아이디가 같지 않습니다.")
        }
    }
})

router.post("/add_comment", function(req, res, next){
    if(!req.session.logged){
        res.redirect("/")
    }else{
        var no = req.body.no;
        var comment = req.body.comment;
        var post_id = req.session.logged.post_id;
        var name = req.session.logged.name;
        var date = moment().format("YYYY-MM-DD");
        var time = moment().format("HH:mm:ss");
        console.log(no, comment, post_id, name, date, time);
        connection.query(
            `insert into comment(parent_num, opinion, post_id, name, date, time) value(?, ?, ?, ?, ?, ?)`,
            [no, comment, post_id, name, date, time],
            function(err, result){
                if(err){
                    console.log(err);
                    res.render("error", {
                        message : "댓글 추가 실패"
                    })
                }else{
                    res.redirect("/board/info?no="+no);
                }
            }
        )
    }
})

router.get("/comment_del/:no/:parent_num", function(req, res, next){
    var no = req.params.no;
    var parent_num = req.params.parent_num;
    connection.query(
        `delete from comment where No = ?`,
        [no],
        function(err, result){
            if(err){
                console.log(err)
                res.render("error", {
                    message : "댓글 삭제 에러"
                })
                }else{
                    res.redirect("/board/info?no="+parent_num);
                }
            }
        )
    }
)

router.get("/comment_up", function(req, res, next){
    var no = req.query.no;
    var parent_num = req.query.parent_num;
    var up = parseInt(req.query.up);
    var up_2 = up + 1
    console.log(no, parent_num, up)
    connection.query(
        `UPDATE comment SET up = ? where No = ?`,
        [up_2, no],
        function(err, result){
            if(err){
                console.log(err)
                res.render("error", {
                    message : "좋아요 추가 에러"
                })
            }else{
                res.redirect("/board/info?no="+parent_num);
            }
        }
    )
})

router.get("/comment_down", function(req, res, next){
    var no = req.query.no;
    var parent_num = req.query.parent_num;
    var down = parseInt(req.query.down);
    var down_2 = down + 1
    console.log(no, parent_num, down)
    connection.query(
        `UPDATE comment SET down = ? where No = ?`,
        [down_2, no],
        function(err, result){
            if(err){
                console.log(err)
                res.render("error", {
                    message : "싫어요 추가 에러"
                })
            }else{
                res.redirect("/board/info?no="+parent_num);
            }
        }
    )
})
module.exports = router;