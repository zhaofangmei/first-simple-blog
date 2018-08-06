const DB = require('./db.js');
const conn = DB.getConnection();
// const markdown = require('markdown').markdown;

function Post(userName, title, head, tag, post) {
    this.userName = userName;
    this.title = title;
    this.tag = tag;
    this.post = post;
    this.head = head;
}

module.exports = Post;

Post.prototype.save = function (callback) {
    let time = new Date().getTime();
    let post = {
        user_name: this.userName,
        create_time: time,
        title: this.title,
        head: this.head,
        post: this.post,
        tag: this.tag,
        reprint_info: JSON.stringify({}),
        pv: 0,
        comments: JSON.stringify([])
    }

    let sqlString = 'insert into t_blog_post set ? '
    let insert = conn.query(sqlString, post, function (error, results, fields) {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results.insertId) {
            return callback(null, 'success');
        }

    });
    console.log(insert.sql)
}

Post.getAll = function (name, callback) {
    let sqlString = 'select * from t_blog_post ';
    if (name) {
        sqlString += 'where user_name = "' + name + '"';
    }
    let findAll = conn.query(sqlString, function (error, results, fields) {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results) {
            // results.forEach(doc => {
            //     doc.post = markdown.toHTML(doc.post)
            // });
            return callback(null, results);
        }
    });
    console.log(findAll.sql)
}

Post.getPage = function (params, callback) {
    let pageSize = params.pageSize && parseInt(params.pageSize) || 5;
    pageSize = pageSize > 0 && pageSize < 101 && pageSize || 5;
    let pageIndex = params.pageIndex && parseInt(params.pageIndex) || 1;
    let limit = pageSize;
    let offset = (pageIndex - 1) * params.pageSize;
    let sqlString = 'select * from t_blog_post ';
    if (params.name) {
        sqlString += 'where user_name = "' + params.name + '"';
    }
    sqlString += ' limit ' + limit + ' offset ' + offset;
    let findPage = conn.query(sqlString, function (error, results, fields) {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results) {
            // results.forEach(doc => {
            //     doc.post = markdown.toHTML(doc.post)
            // });
            let countString = 'select count(*) as sum from t_blog_post ';
            if (params.name) {
                countString += 'where user_name = "' + params.name + '"';
            }
            let findSum = conn.query(countString, function (error, sumResults, fields) {
                if (error) {
                    console.log('error: ', error)
                    return callback(error);
                }
                if(sumResults) {
                    return callback(null, results, sumResults);
                }
            });
            console.log(findSum.sql)
            // return callback(null, results);
        }
    });
    console.log(findPage.sql)
}
/**
 * 获取博客详情
 * @param {*} query 
 * @param {*} callback 
 */
Post.getOne = function (query, callback) {
    let sqlString = '';
    if (query.name && query.time && query.title) {
        sqlString += 'select * from t_blog_post where user_name = ? and create_time = ? and title = ? ';
    } else {
        return callback('参数异常!')
    }

    let findOne = conn.query(sqlString, [query.name, query.time, query.title], function (error, results, fields) {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results && results.length > 0) {
            results.forEach(doc => {
                // doc.post = markdown.toHTML(doc.post);
                doc.comments = JSON.parse(doc.comments);
            });
            if(!query.aginAsk) {
                let post = results[0];
                //更新阅读pv
                let updateString = 'update t_blog_post set pv=pv+1 where user_name = ? and create_time = ? ';
                let update = conn.query(updateString, [post.user_name, post.create_time], function (error, results, fields) {
                    if (error) {
                        console.log('error: ', error)
                        return callback(error);
                    }
                });
                console.log(update.sql);
            }
            return callback(null, results);
        } else {
            return callback('它消失好久了!')
        }
    });
    console.log(findOne.sql)
}

/**
 * 编辑
 * @param {*} query 
 * @param {*} callback 
 */
Post.edit = function (query, callback) {
    if (query.name && query.time && query.title) {
        let sqlString = 'select * from  t_blog_post where user_name = ? and create_time = ? and title = ? ';
        let fineOne = conn.query(sqlString, [query.name, query.time, query.title], function (error, results, fields) {
            if (error) {
                console.log('error: ', error)
                return callback(error);
            }
            if (results) {
                console.log(JSON.stringify(results))
                return callback(null, results);
            }
        });

        console.log(fineOne.sql)

    } else {
        return callback('参数异常');
    }
}

Post.update = function (query, callback) {
    if (query.name && query.time && query.title) {
        let sqlString = 'update t_blog_post set ? where user_name = ? and create_time = ? ';
        let params = {
            user_name: query.name,
            create_time: query.time,
            title: query.title,
            post: query.post
        }
        let update = conn.query(sqlString, [params, query.name, query.time], function (error, results, fields) {
            if (error) {
                console.log('error: ', error)
                return callback(error);
            }
            return callback(null, 'success')
        });
        console.log(update.sql)
    }
}

Post.remove = function (query, callback) {
    if (query.name && query.time && query.title) {
        //1、获取该文章信息,判断是否存在reprint_from
        query.aginAsk = true;
        let sqlString = '';
        Post.getOne(query, function(error, posts) {
            if (error) {
                console.log('error: ', error)
                return callback(error);
            }
            if(posts.length > 0) {
                let origin_from_info = JSON.parse(posts[0].reprint_info);
                //2、存在reprint_from，说明该文章为转载， 更新源文件reprint_to记录
                if(origin_from_info.reprint_from) {
                    let origin_from = origin_from_info.reprint_from;
                    sqlString = 'select * from t_blog_post where user_name = ? and create_time = ? and title = ? ';
                    let find = conn.query(sqlString, [origin_from.user_name, origin_from.create_time, origin_from.title], function (error, results, fields) {
                        if (error) {
                            console.log('error: ', error)
                            return callback(error);
                        }

                        if(results.length > 0) {
                            let post = results[0];
                            //3、获取原文章的reprint_to，删除对应的记录
                            let origin_to = JSON.parse(post.reprint_info).reprint_to;
                            for(var i = 0; i < origin_to.length; i++) {
                                let item = origin_to[i];
                                if(item.user_name == query.name && item.create_time == query.time && item.title == query.title) {
                                    console.log('i: ', i)
                                    origin_to.splice(i, 1);
                                }
                            }
                            sqlString = 'update t_blog_post set ? where user_name = ? and create_time = ? ';
                            let params = {reprint_info: JSON.stringify({"reprint_to": origin_to})};
                            let update = conn.query(sqlString, [params, origin_from.user_name, origin_from.create_time], function (error, results, fields) {
                                if (error) {
                                    console.log('error: ', error)
                                    return callback(error);
                                }
                            });
                            console.log(update.sql);
                        }

                    });
                    console.log(find.sql);
                }

                //4、最后删除文章操作
                sqlString = 'delete from t_blog_post where user_name = ? and create_time = ? and title = ? ';
                let remove = conn.query(sqlString, [query.name, query.time, query.title], function (error, results, fields) {
                    if (error) {
                        console.log('error: ', error)
                        return callback(error);
                    }
                    if (results.affectedRows > 0) return callback(null, 'success');
                    return callback(null);
                });
                console.log(remove.sql);

            }

        });

    } else {
        return callback('参数异常！');
    }

}

/**
 * 根据用户名获取标签列表
 * @param {*} name 
 * @param {*} callback 
 */
Post.getTagsByName = function (name, callback) {
    let sqlString = 'select DISTINCT(tag) from t_blog_post where user_name = ?';
    let findTag = conn.query(sqlString, [name], (error, results, fields) => {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results) {
            return callback(null, results);
        } 
    });
    console.log(findTag.sql)
}
/**
 * 获取所有标签
 * @param {*} callback 
 */
Post.getTags = function (callback) {
    let sqlString = 'select DISTINCT(tag) from t_blog_post';
    let findTags = conn.query(sqlString, (error, results, fields) => {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        if (results) {
            return callback(null, results);
        } 
    });
    console.log(findTags.sql)
}

/**
 * 根据标签名获取所有博客列表
 * @param {*} tag 
 * @param {*} callback 
 */
Post.getTag = function (tag, callback) {
    if(tag) {
        let sqlString = 'select * from t_blog_post where tag = ?';
        let findOne = conn.query(sqlString, [tag], function (error, results, fields) {
            if (error) {
                console.log('error: ', error)
                return callback(error);
            }
            if (results) {
                return callback(null, results);
            }
        });
        console.log(findOne.sql)
    } else {
        return callback('参数异常！')
    }
}

Post.search = function (keyWord, callback) {
    if(!keyWord)  return callback('参数异常！');
    console.log('>>>>>>>>>>>>keyWord: ',keyWord)
    let sqlString = 'SELECT * FROM t_blog_post WHERE POSITION("' + keyWord + '" IN title)';
    let findFuzzys = conn.query(sqlString, function(error, results, fields) {
        if (error) {
            console.log('error: ', error)
            return callback(error);
        }
        console.log('>>>>>>>>>>>>results: ',results)
        if (results) {
            return callback(null, results);
        }
    });
    console.log(findFuzzys.sql)
}

Post.reprint = function(reprint_from, reprint_to, callback) {
    //1、找到原始文章
    let query = reprint_from;
    query.aginAsk = true;
    Post.getOne(query, (err, posts) => {
        if (err) {
            return callback(err);
        }
        if(posts && posts.length > 0) {
            let post = posts[0];
            let doc = {};
            doc.user_name = reprint_to.name;
            doc.head = reprint_to.head;
            doc.create_time = new Date().getTime();
            doc.title = (post.title.search(/[转载]/) > -1) ? post.title : "[转载]" + post.title;
            doc.post = post.post;
            let from = {user_name: reprint_from.name, create_time: reprint_from.time, title:reprint_from.title};
            doc.reprint_info = JSON.stringify({"reprint_from": from});
            doc.comments = JSON.stringify([]);
            doc.pv = 0;

            // 2、更新原始文章的reprint_to
            let sqlString = 'update t_blog_post set ? where user_name = ? and create_time = ? ';
            let to = {user_name: reprint_to.name, create_time: doc.create_time, title: doc.title};
            let info = JSON.parse(post.reprint_info);
            let to_tmp = undefined;
            if(info.reprint_to) {
                to_tmp = info.reprint_to;
            } else {
                to_tmp = []; 
            }
            to_tmp.push(to);
            let params = {reprint_info: JSON.stringify({"reprint_to": to_tmp})};
            let update = conn.query(sqlString, [params, reprint_from.name, reprint_from.time], function (error, results, fields) {
                if (error) {
                    console.log('error: ', error)
                    return callback(error);
                }
                // 3、新增转载记录
                let sqlString = 'insert into t_blog_post set ? '
                let insert = conn.query(sqlString, doc, function (error, results, fields) {
                    if (error) {
                        console.log('error: ', error)
                        return callback(error);
                    }
                    if (results.insertId) {
                        return callback(null, doc);
                    }
                });
                console.log(insert.sql)

            });
            console.log(update.sql)

        }

    });

}